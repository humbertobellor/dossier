# Architecture — `dossier`

> Documentación de la arquitectura del repositorio
> [`humbertobellor/dossier`](https://github.com/humbertobellor/dossier) /
> [`Gmrf18/dossier`](https://github.com/Gmrf18/dossier).
> Las secciones §§1–10 describen el estado actual; la §11 describe el
> módulo `/cv` planificado.

---

## 1. Resumen de alto nivel

`dossier` es el sitio profesional de Humberto "Bert" Bello. Aunque aparenta
ser un sitio estático de una sola página, internamente es un **monorepo pnpm
con backend propio**: el frontend React consulta un API server en Express
que proxea las releases públicas del repo `humbertobellor/dossier` en
GitHub (con caché en memoria y refresh en background) para alimentar el
módulo "Changelog" del sitio.

Stack:

- **Runtime**: Node 24, pnpm workspaces, TypeScript 5.9
- **Frontend**: React 19 + Vite 7 + Tailwind 4 + Radix UI + Framer Motion + wouter + react-i18next (EN/ES/DE) + TanStack Query
- **Backend**: Express 5 + pino + CORS allowlist + Zod
- **Contrato**: OpenAPI 3.1 → Orval → Zod + TanStack Query hooks (codegen)
- **CI**: GitHub Actions con jobs path-filtered (`check-fonts`, `typecheck`, `lint`)
- **Calidad**: Husky + lint-staged + ESLint 10 + Prettier 3

Principios de diseño:
- `Security by Design` — `threat_model.md` con categorías STRIDE.
- **Acciones de CI pineadas a SHA** (no a tags) para evitar supply-chain.
- **Catálogo central de versiones** en `pnpm-workspace.yaml` (`catalog:`).
- `minimumReleaseAge: 1440` (24h) para mitigar paquetes recién publicados.

---

## 2. Monorepo — paquetes

```mermaid
flowchart TB
    subgraph Workspace["Workspace (pnpm + catalog)"]
        direction TB
        subgraph Artifacts["artifacts/ - apps desplegables"]
            HB["@workspace/humberto-bello<br/>React 19 + Vite 7<br/>portfolio frontend"]
            API["@workspace/api-server<br/>Express 5 + pino<br/>backend /api/*"]
            MOCK["@workspace/mockup-sandbox<br/>React + Vite<br/>(sandbox de diseno)"]
        end

        subgraph Lib["lib/ - paquetes internos"]
            SPEC["@workspace/api-spec<br/>openapi.yaml + orval.config.ts<br/>fuente de verdad de contrato"]
            ZOD["@workspace/api-zod<br/>generado por Orval<br/>schemas Zod + types"]
            CLI["@workspace/api-client-react<br/>generado por Orval<br/>TanStack Query hooks + customFetch"]
        end

        SCR["@workspace/scripts<br/>check-fonts, check-bundle-size,<br/>push-to-github, hello"]
    end

    SPEC -- orval codegen --> ZOD
    SPEC -- orval codegen --> CLI
    ZOD -- "consume schemas" --> API
    CLI -- "consume hooks (Changelog)" --> HB
    SCR -- "check-fonts (CI)" --> HB
    SCR -- "check-bundle-size" --> HB
```

Notas:
- `mockup-sandbox` es un workspace independiente con su propio React + Vite + Radix.
- `lib/api-zod/src/generated/` y `lib/api-client-react/src/generated/` se
  regeneran con `pnpm --filter @workspace/api-spec run codegen`. **No editar
  a mano** los archivos `generated/`.

---

## 3. Contrato de API y flujo de codegen

```mermaid
flowchart LR
    subgraph Source["Fuente de verdad"]
        OAS["lib/api-spec/openapi.yaml<br/>OpenAPI 3.1<br/>tags: health, releases"]
    end

    subgraph Codegen["Orval (titleTransformer fija title=Api)"]
        ORV["orval.config.ts"]
    end

    subgraph Generated["Salida generada (clean: true)"]
        ZG["lib/api-zod/src/generated/<br/>schemas Zod + types TS<br/>useDates, useBigInt"]
        CG["lib/api-client-react/src/generated/<br/>useGetReleases, useHealthCheck<br/>mode: split, baseUrl: /api"]
        CF["lib/api-client-react/src/custom-fetch.ts<br/>mutator HTTP centralizado"]
    end

    subgraph Consumers["Consumidores"]
        API_C["api-server validacion respuestas"]
        HB_C["humberto-bello/Changelog.tsx<br/>useGetReleases()"]
    end

    OAS --> ORV --> ZG
    OAS --> ORV --> CG
    CG -.usa.-> CF
    ZG --> API_C
    CG --> HB_C
```

Reglas clave:
- `pnpm --filter @workspace/api-spec run codegen` regenera ambos paquetes y
  corre `typecheck:libs` después.
- El título OpenAPI **debe** permanecer como `Api` — el `titleTransformer`
  de Orval lo fuerza y los paths de exportación lo asumen.
- Endpoints actuales: `GET /api/healthz`, `GET /api/releases`.

---

## 4. Runtime — flujo de datos en producción

```mermaid
sequenceDiagram
    participant U as Browser
    participant FE as humberto-bello server.mjs
    participant BE as api-server
    participant GH as api.github.com

    U->>FE: GET /
    FE-->>U: index.html + assets (CSP, HSTS, COOP headers)
    Note over U: hydrate React, monta wouter, i18n
    Note over U: Changelog dispara useGetReleases vía TanStack Query
    U->>BE: GET /api/releases (CORS allowlist)
    alt cache hit (TTL 5 min)
        BE-->>U: 200 JSON (datos cacheados)
    else cache miss o stale
        BE->>GH: GET /repos/humbertobellor/dossier/releases<br/>Authorization Bearer GITHUB_TOKEN opcional
        GH-->>BE: 200 JSON + X-RateLimit-Remaining
        Note over BE: checkRateLimit (warn si remaining bajo umbral)
        Note over BE: cache = data + expiresAt
        BE-->>U: 200 JSON
    end
    Note over BE: setInterval cada 4 min, warmer en background
```

El frontend **no es 100% estático**: el módulo Changelog requiere el
backend vivo (`api-server`) para obtener releases.

---

## 5. Topología de despliegue (estado actual)

```mermaid
flowchart LR
    subgraph Client["Cliente (browser)"]
        BR["index.html + assets<br/>fonts woff2 + AVIF/WebP"]
    end

    subgraph Edge["Edge / Reverse proxy"]
        EDGE["X-Forwarded-For<br/>(api-server: trust proxy = 1)"]
    end

    subgraph FE_Tier["Frontend tier"]
        FESRV["humberto-bello/server.mjs<br/>Express estatico<br/>+ CSP / HSTS / COOP<br/>+ Cache-Control inmutable /assets /fonts"]
        DIST["dist/public/<br/>(salida de vite build)"]
        FESRV --> DIST
    end

    subgraph BE_Tier["Backend tier"]
        APISRV["api-server<br/>Express + pino-http<br/>cors allowlist<br/>express.json()"]
        CACHE[("In-memory cache<br/>releases (5 min TTL,<br/>refresh 4 min)")]
        APISRV <--> CACHE
    end

    subgraph Upstream["Upstream"]
        GH2["api.github.com"]
    end

    BR <--> EDGE
    EDGE <--> FESRV
    EDGE <--> APISRV
    APISRV -.fetch releases.-> GH2
```

Notas:
- Las cabeceras de seguridad las añade **el `server.mjs` del frontend**, no
  el host. Cualquier migración a hosting estático (Netlify/Vercel/Pages)
  debe replicarlas (`_headers`, `vercel.json`, etc.).
- `api-server` no aplica `helmet` ni rate-limit propio en los endpoints
  públicos; solo monitorea el rate limit upstream de GitHub.
- CORS: la allowlist vive en `artifacts/api-server/src/lib/allowed-origins.ts`.

---

## 6. Frontend `humberto-bello` — interior

```mermaid
flowchart TB
    HTML["index.html<br/>SEO completo: title, description,<br/>OG, Twitter, canonical, JSON-LD ProfilePage<br/>+ font preloads (Bogart, InterTight, JetBrainsMono)"]

    MAIN["src/main.tsx<br/>monta &lt;App /&gt;"]

    APP["src/App.tsx<br/>QueryClientProvider<br/>TooltipProvider<br/>WouterRouter base=BASE_URL"]

    subgraph Pages["pages/"]
        HOME["home.tsx<br/>1279 LOC<br/>Hero + Experience + Clients + CTA"]
        NF["not-found.tsx"]
    end

    subgraph Components["components/"]
        FADE["FadeIn.tsx<br/>Framer Motion (lazy)"]
        CL["Changelog.tsx<br/>useGetReleases() + UI"]
        UI["ui/ (~50 Radix UI)"]
    end

    subgraph I18N["i18n/"]
        I["i18n.ts<br/>i18next + LanguageDetector<br/>EN inline, ES/DE lazy"]
        EN["locales/en.json"]
        ES["locales/es.json"]
        DE["locales/de.json"]
    end

    subgraph Styles["styles/"]
        WT["wolknitive-tokens.css<br/>@font-face Bogart -trial-,<br/>InterTight, JetBrainsMono, Newsreader<br/>+ design tokens"]
    end

    subgraph Assets["@assets -> ../../attached_assets"]
        HC["headshot-corp_*.{avif,webp}<br/>+ @1x.{avif,webp}<br/>(unica imagen renderizada en UI)"]
    end

    HTML --> MAIN --> APP
    APP --> HOME
    APP --> NF
    HOME --> FADE
    HOME --> CL
    HOME --> UI
    HOME --> I
    HOME --> HC
    I --> EN
    I -.lazy.-> ES
    I -.lazy.-> DE
    HOME --> WT
```

Pipeline de build (`vite.config.ts`):

| Plugin | Función |
|---|---|
| `@vitejs/plugin-react` | JSX/HMR |
| `@tailwindcss/vite` | Tailwind 4 |
| `runtimeErrorOverlay` | Overlay de errores (Replit) |
| `criticalCssPlugin` | Beasties — inline critical CSS, preload del resto (`swap`) |
| `heroPreloadPlugin` | Inyecta `<link rel="preload" as="image">` para el headshot AVIF con `imagesrcset`/`imagesizes` |
| `bogartPreloadPlugin` | Inyecta `<link rel="preload" as="font">` para Bogart no-italic |
| `cartographer` / `devBanner` | Replit dev only |
| `visualizer` (opcional `ANALYZE=1`) | Bundle stats |
| `manualChunks` | `vendor-react`, `vendor-i18n` |

Servido por `server.mjs` con:
- `/assets` y `/fonts` → `Cache-Control: public, max-age=1y, immutable`
- `*.html` → `Cache-Control: no-store`
- Catch-all `/*` → `index.html` (SPA fallback)
- Headers: CSP, HSTS, COOP, X-Frame-Options=SAMEORIGIN

---

## 7. Backend `api-server` — interior

```mermaid
flowchart TB
    IDX["src/index.ts<br/>lee PORT (env), valida, listen()<br/>startReleaseCacheWarmer()"]

    APP["src/app.ts<br/>trust proxy = 1<br/>pino-http (req id, method, url)<br/>cors(allowedOrigins)<br/>express.json()"]

    subgraph Routes["src/routes/"]
        IDXR["index.ts (Router)"]
        HZ["health.ts<br/>GET /healthz"]
        REL["releases.ts<br/>GET /releases<br/>+ in-memory cache (5 min TTL)<br/>+ background refresh (4 min)<br/>+ rate limit monitor (X-RateLimit-Remaining)"]
    end

    subgraph Lib["src/lib/"]
        LOG["logger.ts (pino)"]
        AO["allowed-origins.ts<br/>(allowlist CORS)"]
    end

    GH3["api.github.com<br/>/repos/humbertobellor/dossier/releases?per_page=5"]

    IDX --> APP
    APP --> IDXR
    IDXR --> HZ
    IDXR --> REL
    REL -.fetch().-> GH3
    APP -.usa.-> LOG
    APP -.usa.-> AO
    REL -.valida con.-> ZODX["@workspace/api-zod<br/>GetReleasesResponse"]
```

- Build: `esbuild` con `esbuild-plugin-pino` (bundle CJS hacia `dist/index.mjs`).
- Variables de entorno: `PORT` (obligatoria), `GITHUB_TOKEN` (opcional),
  `GITHUB_RATE_LIMIT_WARN_THRESHOLD` (default 100).
- Sin rate-limit propio en endpoints públicos (es una posible brecha — ver
  `threat_model.md`).

---

## 8. CI — GitHub Actions

```mermaid
flowchart LR
    PUSH["push/pull_request<br/>branches: all"]

    subgraph Jobs["Jobs (path-filtered)"]
        CF["check-fonts<br/>trigger: **/*.css, **/public/fonts/**<br/>ejecuta scripts/check-fonts.ts"]
        TC["typecheck<br/>trigger: **/*.ts, **/*.tsx,<br/>**/tsconfig*.json, pnpm-lock.yaml,<br/>package.json<br/>ejecuta pnpm run typecheck"]
        LN["lint<br/>trigger: **/*.ts, **/*.tsx, ...<br/>ejecuta pnpm run lint<br/>(eslint . --max-warnings=0)"]
    end

    PUSH --> CF
    PUSH --> TC
    PUSH --> LN
```

Convenciones de CI:
- Cada `uses:` está pineado a SHA de commit, con el tag legible en comentario.
- Setup unificado: `pnpm/action-setup@SHA` v4 (pnpm 10.26.1) + `actions/setup-node@SHA` v4 (Node 24).
- `pnpm install --frozen-lockfile`.
- **No hay job de `build` ni de `test`** en CI.

Hooks locales (Husky):
- `pre-commit`: `lint-staged` con reglas en `.lintstagedrc.mjs`.
- `post-merge`: `scripts/post-merge.sh`.

---

## 9. SEO y assets — inventario auditado

Lo que **sí** se referencia desde código:

| Item | Origen | Uso |
|---|---|---|
| `headshot-corp_*.{avif,webp}` (700w) + `@1x.{avif,webp}` (350w) | `attached_assets/` vía alias `@assets` | 4 imports en `home.tsx` (líneas 24–27); 2 lookups regex en `vite.config.ts` (`heroPreloadPlugin`) |
| `opengraph.jpg` | repo root → copiado a `dist/public` | meta OG + Twitter |
| `favicon.svg` | repo root | `<link rel="icon">` |
| `fonts/*.woff2` | `public/fonts/` | `@font-face` en `wolknitive-tokens.css` + preloads en `index.html` |
| `Humberto_Bello_Resume.pdf` | `public/` | `<a download>` en home (líneas 288, 354) |
| `sitemap.xml` + `robots.txt` | repo root | servidos estáticos |

SEO ya presente en `index.html`:
- `<title>`, `<meta description>`, `<meta keywords>`, `<meta robots>`, `<meta author>`
- `<link rel="canonical">`
- Open Graph completo (type, title, description, url, image+w/h, locale, site_name, profile:first_name/last_name)
- Twitter Card (`summary_large_image`)
- **JSON-LD `ProfilePage`** con `Person` anidado (jobTitle, knowsAbout, hasOccupation, sameAs)

Lo que **no** se referencia y por tanto **no debe procesarse**:
- `attached_assets/*.{pptx,pdf,zip,png,jpeg}` no listados arriba — source
  material (PPTX original, PDFs históricos del CV, ZIP del design system,
  screenshots, fotos varias).

---

## 10. Seguridad — postura actual

| Capa | Mecanismo | Archivo |
|---|---|---|
| Headers HTTP (frontend) | CSP, HSTS, COOP, X-Frame-Options | `artifacts/humberto-bello/server.mjs` |
| CORS (backend) | Allowlist explícita | `artifacts/api-server/src/lib/allowed-origins.ts` |
| Trust proxy | `app.set("trust proxy", 1)` (X-Forwarded-For) | `artifacts/api-server/src/app.ts` |
| Validación de payloads | Zod schemas generados | `lib/api-zod/` |
| Supply chain CI | `uses:` pineados a SHA + `minimumReleaseAge: 1440` | `.github/workflows/ci.yml`, `pnpm-workspace.yaml` |
| Secrets | `GITHUB_TOKEN` opcional vía env | `artifacts/api-server/src/routes/releases.ts` |
| Pre-commit | Husky + lint-staged | `.husky/`, `.lintstagedrc.mjs` |
| Modelo STRIDE | `threat_model.md` (Spoofing/Tampering/Info Disclosure/DoS/EoP) | `threat_model.md` |

Brechas identificadas:
- `api-server` **no tiene rate-limit propio** en endpoints públicos
  (`express-rate-limit` está en dependencies pero no se instancia en `app.ts`).
- `CSP` actual permite `'unsafe-inline'` y `'unsafe-eval'` en scripts —
  necesarias para React y los plugins `dev` de Replit.
- Fuentes Bogart son la versión `-trial`.

---

## 11. Módulo `/cv` (planificado)

Ruta `/cv` servida como HTML estático generado en build a partir de un
`cv.md` SSOT. El stack del sitio (Vite + React + i18n + Radix + Framer +
Changelog + `api-server` + Orval + `server.mjs`) **permanece sin cambios**.

### 11.1 Componentes nuevos

| Componente | Ubicación | Rol |
|---|---|---|
| `cv.md` | `artifacts/humberto-bello/content/cv.md` | SSOT del CV: frontmatter YAML (Zod-validado) + cuerpo Markdown |
| `build-cv.ts` | `scripts/src/build-cv.ts` (`@workspace/scripts`) | Build script tsx: parsea `cv.md`, compila con `unified` + `remark-parse` + `remark-rehype` + `rehype-stringify`, inyecta `<head>` SEO y CSS print embebido |
| `cv/index.html` | `artifacts/humberto-bello/public/cv/index.html` | HTML estático generado; copiado a `dist/public/cv/index.html` por `vite build` |
| `humberto-bello-headshot.{avif,webp,@1x.*}` | `artifacts/humberto-bello/src/assets/images/` | Reubicación + rename semántico del headshot (4 archivos, 350w + 700w) |

### 11.2 Modificaciones a componentes existentes

| Componente | Cambio |
|---|---|
| `home.tsx` | 4 imports del headshot (líneas 24–27) + 2 `<a>` de descarga (líneas 288, 354) → `href="/cv"` |
| `vite.config.ts` | 2 regex del `heroPreloadPlugin` (líneas 73–77) ajustados al nuevo nombre |
| `humberto-bello/package.json` | Nuevo hook `prebuild` invoca `build-cv.ts` |
| `sitemap.xml` | Entrada nueva para `/cv` |

### 11.3 Flujo de datos del módulo

```mermaid
flowchart LR
    subgraph Source["SSOT"]
        MD["artifacts/humberto-bello/content/cv.md<br/>frontmatter YAML + Markdown"]
    end

    subgraph BuildTime["Build time"]
        BCV["scripts/src/build-cv.ts<br/>@workspace/scripts (tsx)"]
        UNIFIED["unified + remark-parse<br/>+ remark-rehype + rehype-stringify"]
        TPL["plantilla HTML:<br/>head SEO (canonical /cv, OG,<br/>JSON-LD Person+Resume),<br/>@font-face Wolknitive,<br/>style screen + print embebido"]
        BCV --> UNIFIED --> TPL
    end

    subgraph Output["Salida en repo"]
        PUB["artifacts/humberto-bello/public/cv/index.html"]
    end

    subgraph Vite["vite build"]
        DIST["dist/public/cv/index.html<br/>(copia automatica de public/)"]
    end

    subgraph Runtime["Runtime"]
        SRV["server.mjs<br/>Express estatico<br/>(misma CSP/HSTS/COOP que /)"]
        BR["Browser - GET /cv"]
        PRT["window.print() -><br/>PDF generado por el navegador<br/>con print CSS"]
    end

    MD --> BCV
    TPL --> PUB
    PUB --> DIST
    DIST --> SRV
    SRV --> BR
    BR -.boton Descargar.-> PRT
```

### 11.4 Ubicación en el monorepo

```mermaid
flowchart TB
    subgraph New["Nuevo"]
        direction TB
        CONT["artifacts/humberto-bello/content/cv.md<br/>SSOT del CV"]
        ASSETS["artifacts/humberto-bello/src/assets/images/<br/>headshot renombrado (4 archivos)"]
        BUILD["scripts/src/build-cv.ts<br/>nuevo entry point"]
        PUBCV["artifacts/humberto-bello/public/cv/index.html<br/>generado en prebuild"]
        SITE["sitemap.xml<br/>+ entry /cv"]
    end

    subgraph Touched["Modificados"]
        HOME["home.tsx<br/>4 imports actualizados (lineas 24-27)<br/>2 hrefs actualizados (lineas 288, 354)"]
        VC["vite.config.ts<br/>2 regex actualizados (heroPreloadPlugin)"]
        PKG["humberto-bello/package.json<br/>+ prebuild hook"]
    end

    subgraph Intact["Sin cambios"]
        REACT["App.tsx, router, i18n,<br/>Changelog, Radix, Framer,<br/>api-server, api-client-react,<br/>api-spec, api-zod, server.mjs,<br/>CI, mockup-sandbox"]
    end

    CONT --> BUILD --> PUBCV
    ASSETS --> HOME
    HOME --> VC
    BUILD --> PKG
    PUBCV -.sirve.-> SITE
```

---

## 12. Convenciones del repo a respetar

- **Versiones**: usar `catalog:` en `package.json` cuando esté disponible.
- **Codegen**: nunca editar `lib/api-*/src/generated/` a mano.
- **Imports**:
  - `@/` en `humberto-bello` → `src/`
  - `@assets/` en `humberto-bello` → `../../attached_assets/`
- **Estilos**: tokens centralizados en `src/styles/wolknitive-tokens.css`
  (paleta Wolknitive: ink `#14110B`, teal `#1B4E4A`, vellum `#FAF6EC`…).
- **CI**: actions pineadas a SHA, comentario con tag legible.
- **Comentarios en código**: solo el "por qué" no-obvio; no narrar el "qué".
