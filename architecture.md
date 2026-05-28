# Architecture — `dossier`

> Documentación del estado actual del repositorio
> [`humbertobellor/dossier`](https://github.com/humbertobellor/dossier) /
> [`Gmrf18/dossier`](https://github.com/Gmrf18/dossier).
> **Esta es la línea base sobre la que se evaluará cualquier migración**;
> mantenerla actualizada en cada fase.

---

## 1. Resumen de alto nivel

`dossier` es el sitio profesional de Humberto "Bert" Bello. A pesar de aparentar
ser un sitio estático de una sola página, internamente es un **monorepo pnpm con
backend propio**: el frontend React consulta un API server en Express que
proxea las releases públicas del repo `humbertobellor/dossier` en GitHub
(con caché en memoria y refresh en background) para alimentar el módulo
"Changelog" del sitio.

Stack resumido:

- **Runtime**: Node 24, pnpm workspaces, TypeScript 5.9
- **Frontend**: React 19 + Vite 7 + Tailwind 4 + Radix UI + Framer Motion + wouter + react-i18next (EN/ES/DE) + TanStack Query
- **Backend**: Express 5 + pino + CORS allowlist + Zod
- **Contrato**: OpenAPI 3.1 → Orval → Zod + TanStack Query hooks (codegen)
- **CI**: GitHub Actions con jobs path-filtered (`check-fonts`, `typecheck`, `lint`)
- **Calidad**: Husky + lint-staged + ESLint 10 + Prettier 3

Filosofía explícita en el repo:
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
- `mockup-sandbox` es un workspace independiente con su propio Radix/Vite —
  está **fuera del scope del módulo `/cv`** y de la migración a Astro
  propuesta, salvo que se decida lo contrario explícitamente.
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

Implicación importante para cualquier migración:
**el sitio frontend NO es 100% estático** — la sección Changelog requiere un
backend vivo. Migrarlo a SSG puro implica una de tres opciones:

1. **Mantener `api-server` desplegado** y que Astro/cliente lo consuma en
   runtime (igual que hoy). Sigue siendo SSG en el HTML inicial; el fetch
   ocurre tras hidratar.
2. **Build-time fetch**: en cada build, Astro consulta GitHub e inyecta los
   releases en el HTML. Pierde frescura (necesita rebuild para reflejar
   nuevas releases).
3. **Cliente llama a GitHub directo**: elimina `api-server`, pero expone
   rate limit anónimo (60 req/hora/IP) y la lógica de caché desaparece.

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
- **No hay job de `build` ni de `test`** en CI hoy — gap a cubrir si se
  añaden gates de Lighthouse/Playwright en la Fase 5 bis del plan.

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

Brechas identificables (relevantes para una migración):
- `api-server` **no tiene rate-limit propio** en endpoints públicos
  (`express-rate-limit` está en dependencies pero no se instancia en `app.ts`).
- `CSP` actual permite `'unsafe-inline'` y `'unsafe-eval'` en scripts — un
  refactor a Astro SSG podría endurecer esto al eliminar React runtime y
  los plugins `dev` de Replit.
- Fuentes Bogart son la versión `-trial`; cualquier despliegue público
  estable debería resolverlo antes (fuera del scope técnico, pero a
  registrar).

---

## 11. Mapa de impacto para el plan de migración a Astro + `/cv`

Esta sección conecta la arquitectura documentada con el plan de migración
(`propuesta_optimizacion.md`):

| Hecho arquitectónico | Implicación para el plan |
|---|---|
| `Changelog.tsx` consume `/api/releases` vía TanStack Query | **El frontend no es SSG puro** — hay que decidir entre mantener `api-server`, build-time fetch o llamar a GitHub directo |
| Contrato Orval `openapi.yaml → api-zod / api-client-react` | La migración a Astro debe seguir consumiendo `@workspace/api-client-react` como isla cliente (React island); no se puede simplemente "des-Reactizar" el Changelog |
| `server.mjs` aplica CSP/HSTS/COOP | Astro estático puro pierde estas cabeceras; o se replican en el host, o se mantiene un adapter Node |
| i18n EN/ES/DE con lazy loading de ES/DE | Astro requiere routing i18n nativo o conservar i18next como isla — decisión bloqueante antes de Fase 3 |
| `home.tsx` 1279 LOC con Radix + Framer + i18n + react-query | "Transformar a `.astro`" no es 1:1; requiere despiece previo en bloques (Astro puros vs islas focalizadas) |
| `attached_assets/` tiene 1 sola imagen referenciada (headshot, 4 archivos, 2 anchos: 350w + 700w) | Las 6 escalas globales del plan original (320/480/768/1080/1440/2160) son sobreingeniería; alcance real = mover/renombrar 4 archivos |
| `sharp@^0.34.5` en devDeps del root | El convertidor externo (`image-conversor.netlify.app`) propuesto en Fase 4 es innecesario |
| CI sin job de `build` ni `test` | Si Fase 5 bis añade Lighthouse/Playwright/a11y gates, hay que extender `.github/workflows/ci.yml` |
| `mockup-sandbox` es un workspace aparte | Fuera del scope del módulo `/cv` salvo decisión explícita |
| `humberto-bello` ya tiene `Humberto_Bello_Resume.pdf` estático | El nuevo `cv.md` SSOT **reemplaza** ese PDF; el botón de descarga ya existe (líneas 288, 354 de `home.tsx`) — solo cambia el destino |

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
