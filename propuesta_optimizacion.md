# Propuesta de Optimización — Revisión del Plan de Migración a Astro + Módulo `/cv`

> Revisión técnica del plan propuesto para la migración del repo `dossier`
> (https://github.com/humbertobellor/dossier) a Astro SSG con un nuevo módulo
> `/cv` alimentado por un `cv.md` SSOT.
>
> **Esta propuesta se apoya en `architecture.md`** (estado actual del repo,
> diagramas Mermaid, contrato OpenAPI, flujos de datos, seguridad). Léelo
> primero — todas las referencias `§N` apuntan a sus secciones.

---

## 1. Veredicto general

**Viable, con condiciones.** El esqueleto de fases es razonable y el patrón
de ledger (`migration_progress.md`) es buena disciplina. Sin embargo, al
confrontar el plan con la arquitectura real (`architecture.md`) aparecen
**dos supuestos rotos** y **varios huecos**:

- **Supuesto roto 1**: "el sitio es estático". Falso — `Changelog.tsx`
  consume `/api/releases` vía TanStack Query → `api-server` Express → GitHub
  con cache en memoria y warmer en background (`architecture.md` §4). Una
  migración a "Astro SSG puro" no se sostiene sin decidir qué hacer con ese
  flujo.
- **Supuesto roto 2**: "el sitio actual no es un CV". También impreciso —
  ya es un dossier profesional con OG/JSON-LD, y ya descarga
  `Humberto_Bello_Resume.pdf` desde dos botones en `home.tsx`
  (`architecture.md` §9, §11).
- **Huecos**: PDF (cómo se genera), i18n EN/ES/DE (ignorada en el plan),
  cabeceras de seguridad (CSP/HSTS viven en `server.mjs`, no en el host),
  contrato Orval (cómo sobrevive a la migración), `mockup-sandbox` (scope).

---

## 2. Hechos arquitectónicos clave (relevantes para el plan)

Resumen — el detalle completo está en `architecture.md`. La tabla mapea cada
hecho a su consecuencia para la migración.

| # | Hecho arquitectónico (ref) | Implicación para el plan |
|---|---|---|
| A | Monorepo pnpm con 7 paquetes; `humberto-bello` consume `@workspace/api-client-react` generado por Orval desde `lib/api-spec/openapi.yaml` (`architecture.md` §2, §3) | La migración **debe integrarse al catálogo** de versiones y **conservar el codegen** Orval; los hooks generados se siguen consumiendo desde una isla React |
| B | `Changelog.tsx` llama `useGetReleases()` → `/api/releases` → `api-server` (cache 5 min, warmer 4 min, monitor de rate-limit GitHub) (`architecture.md` §4, §7) | El frontend **no es SSG puro**. Decisión bloqueante: (1) mantener `api-server`, (2) build-time fetch de GitHub, (3) cliente llama a GitHub directo |
| C | `server.mjs` del frontend aplica CSP, HSTS, COOP, X-Frame-Options y cache headers diferenciados (`architecture.md` §5, §10) | Astro estático puro pierde estas cabeceras. Replicarlas en host (`_headers`, `vercel.json`) o mantener adapter Node |
| D | `home.tsx` = **1279 LOC**, importa Radix (~50), Framer Motion (lazy), i18next (EN inline / ES,DE lazy), TanStack Query (Changelog) (`architecture.md` §6) | "Transformar a `.astro` 1:1" no existe. Hay que despezar en bloques: estáticos (Astro nativo) vs interactivos (islas React focalizadas) |
| E | SEO presente: title, description, keywords, canonical, OG completo, Twitter Card, **JSON-LD `ProfilePage`** con `Person.knowsAbout/hasOccupation/sameAs`, `sitemap.xml`, `robots.txt` (`architecture.md` §9) | Inventario SEO a preservar **incluye el JSON-LD** (el plan original solo menciona meta-tags) |
| F | Performance ya optimizada: Beasties (critical CSS), `heroPreloadPlugin`, `bogartPreloadPlugin`, manual chunks `vendor-react`/`vendor-i18n`, AVIF+WebP responsive (`architecture.md` §6) | Ganancia esperada de Astro en CWV es **marginal** salvo que se elimine React por completo. Motivo real de Astro: DX + content collections, no LCP/INP |
| G | Imágenes en uso real: **1 sola** (headshot, 4 archivos, **350w + 700w**). `opengraph.jpg` y `favicon.svg` intactos. Resto de `attached_assets/` (PPTX, PDFs viejos, ZIP, screenshots, jpegs) **no se referencia** — source material (`architecture.md` §9) | Fase 4 = mover/renombrar 4 archivos + actualizar 6 referencias. Las 6 escalas globales del plan son sobreingeniería |
| H | `sharp@^0.34.5` ya está en devDeps del root (`architecture.md` §9 implícito) | El convertidor externo (`image-conversor.netlify.app`) es innecesario; Astro `<Image>` y/o script local con sharp cubren el caso |
| I | i18n EN/ES/DE con LanguageDetector, EN inline, ES/DE lazy (`architecture.md` §6) | **El plan no lo menciona en ninguna fase** — gap bloqueante. Decisión: routing i18n nativo de Astro (`src/pages/[lang]/...`) o isla i18next |
| J | CI tiene 3 jobs path-filtered (check-fonts, typecheck, lint), `uses:` pineados a SHA, `minimumReleaseAge: 1440`. **No hay job de `build` ni `test`** (`architecture.md` §8) | Si Fase 5 bis añade Lighthouse/Playwright/a11y, hay que **extender CI** y mantener la convención SHA-pinning |
| K | `mockup-sandbox` es un workspace independiente con su propio React+Vite+Radix (`architecture.md` §2) | **Fuera de scope** salvo decisión explícita |
| L | `public/Humberto_Bello_Resume.pdf` ya se descarga desde `home.tsx` (líneas 288, 354) (`architecture.md` §9, §11) | `/cv` con `cv.md` SSOT **reemplaza** ese PDF; los botones existentes solo cambian destino |
| M | Fuentes Bogart son la versión `-trial` (`architecture.md` §10) | Riesgo legal en despliegue público; resolver licencia antes (fuera del scope técnico) |
| N | `api-server` no instancia rate-limit propio (pese a tener `express-rate-limit` en deps); CSP permite `'unsafe-inline'`/`'unsafe-eval'` (`architecture.md` §10) | Oportunidad: la migración puede endurecer CSP al eliminar Replit dev plugins y reducir inline scripts |

---

## 3. Hallazgos por fase del plan original

### Fase 0 — Justificación técnica + SEO + diseño de `/cv`

**Lo que se sostiene**
- Auditoría de SEO a preservar.
- Aislamiento del módulo `/cv` con `cv.md` SSOT y layout de impresión separado.

**Lo que falla o falta**
- La justificación pide "validar Astro mejorará CWV". Con el stack actual ya optimizado al máximo, **la ganancia real es modesta** salvo que se elimine React por completo. Sé honesto: el motivo principal de Astro aquí es **DX y arquitectura de contenido** (Markdown + colecciones), no LCP/INP.
- El "inventario SEO" no menciona el **bloque JSON-LD `ProfilePage`** ni el `sitemap.xml`/`robots.txt`/`canonical`. Sin ese inventario explícito, se va a olvidar al migrar.

### Fase 1 — `architecture.md`

**Lo que se sostiene**
- Documentar Security by Design (consistente con `threat_model.md` existente).
- Diagrama Mermaid del flujo `cv.md → /cv` y `cv.md → PDF`.

**Lo que falla o falta**
- No identifica que `home.tsx` tiene 1279 LOC y necesita despiece **antes** de migrar.
- No documenta la dependencia con `@workspace/api-client-react` (workspace dep que sobrevive al cambio de framework).

### Fase 2 — Estrategia de migración y enrutamiento

**Lo que se sostiene**
- Componente `BaseHead.astro` para meta-tags.
- Aislamiento de estilos de impresión.

**Lo que falla o falta**
- **i18n EN/ES/DE no se menciona.** Astro tiene routing i18n nativo (`src/pages/en/...`, `src/pages/es/...`) o se puede usar `astro-i18next`. Decidir antes de Fase 3.
- No define qué **adapter de Astro** se usa: estático puro (recomendado, pero pierde `server.mjs` headers) o `@astrojs/node` (mantiene Express). Decisión que bloquea Fase 3.
- "Aislamiento de estilos para el PDF" deja sin elegir entre **`@media print` + `window.print()`** (cero infra) vs **Playwright build-time** (mejor fidelidad, +CI) vs **`html2pdf.js` cliente** (bundle weight). Sin elegir, Fase 3 no puede arrancar.

### Fase 3 — Migración de código + nueva ruta

**Lo que se sostiene**
- Integrar Astro en el monorepo pnpm.
- Lectura de `cv.md` (con `astro:content` y collections — añadirlo explícitamente).

**Lo que falla o falta**
- "Transforma las páginas y componentes actuales a `.astro` manteniendo exactamente su diseño, lógica y metadatos SEO" es **hand-waving**. En la práctica:
  - Cada Radix UI (~50 componentes) sigue siendo React → isla `client:load` o `client:visible`.
  - Framer Motion solo corre client-side → isla.
  - i18next + LanguageDetector → isla por bloque traducido o rewrite a routing i18n estático.
  - Toaster, TooltipProvider, QueryClientProvider → contexto React global → isla raíz.
- Definir si la home se rewrite a Astro nativo (gana SSG real) o se mantiene como isla raíz `client:load` (gana cero LCP, pero migración trivial). **Recomendación: rewrite parcial — secciones estáticas como Astro, interactividad (idioma, animaciones) como islas focalizadas.**

### Fase 4 — Optimización de assets

**Lo que se sostiene**
- Renombrado semántico (e.g. `humberto-bello-headshot.webp`) → bien para SEO de imágenes.
- Mantener `opengraph.jpg` intacto → correcto (caches de Facebook/LinkedIn/Twitter).
- Adaptar componentes para `<picture>` / `<Image>` con escalas responsive.

**Lo que falla o falta — corregir**
- **El alcance está muy sobredimensionado.** La auditoría del front muestra que **solo se usa 1 imagen** (`headshot-corp`) en 2 anchos reales (350w + 700w). El resto de `attached_assets/` no se referencia desde código. No hay "optimización masiva" que ejecutar.
- **Las escalas propuestas (320/468/768/1080/1440/2160) son sobreingeniería para esta imagen.** Los `sizes` actuales del `<picture>` son:
  - Desktop: `(max-width: 1280px) 50vw, 640px` → cubierto por `350w` (≤768px efectivo) y `700w` (≥768px @2x)
  - Mobile: `336px` fijo → cubierto por `350w` (1x) y `700w` (2x retina)
  - Generar 4 escalas extra (480/768/1080/1440/2160) gastaría build time sin que ningún breakpoint las solicite.
- **`468px` parece typo de `480px`**, pero el punto es moot — ningún `sizes` del layout actual pide esos anchos.
- **Eliminar la dependencia del servicio externo `image-conversor.netlify.app`.** El repo ya incluye `sharp@^0.34.5`. La imagen actual ya está pre-generada en AVIF+WebP a 1x/2x; solo hay que **mover y renombrar**. Si en el futuro se añade alguna imagen nueva al `/cv`, se procesa con `<Image>` de Astro (sharp en build), no con un convertidor web externo.
- **NO mover `attached_assets/` en bloque.** Mover **solo los 4 archivos del headshot** que están realmente importados. El resto (PPTX, PDFs viejos, ZIP de design system, screenshots, jpegs no usados) se queda o se mueve a `docs/source-material/` — pero fuera del bundle.
- Mantener PNG/JPG **fallback** para navegadores legacy en el `<picture>` (Astro lo hace si se pasan `formats: ['avif','webp']` y un `src` fallback).
- **Regla para nuevas imágenes** (cuando aparezcan en `/cv` u otras secciones): derivar los `widths` del `<Image>` desde los `sizes` reales del layout que las contiene — no aplicar una lista global de 6 escalas por defecto.

### Fase 5 — Validaciones finales

**Lo que se sostiene**
- Sitemap regenerado con `/cv`.
- Validar build final y meta-tags en producción.

**Lo que falla o falta**
- **Cero regresión visual/perf.** Añadir:
  - Lighthouse CI con presupuesto (LCP < 2.5s, CLS < 0.1, INP < 200ms) comparando antes/después.
  - Playwright screenshots de home + `/cv` en 3 viewports (móvil/tablet/desktop) y diff vs baseline.
  - Test de descarga de PDF (que el archivo se genere, peso razonable, primera página tenga el nombre).
- **Cabeceras de seguridad** (CSP/HSTS/COOP de `server.mjs`) → reconfigurar en el host (Netlify `_headers`, Vercel `vercel.json`, o adapter Node si se mantiene Express).
- **a11y**: pasar `axe-core` o `pa11y` sobre home y `/cv`, especialmente el botón de descarga.

---

## 4. Decisiones pendientes que bloquean el arranque

Antes de empezar la Fase 0 hay que decidir:

1. **Releases / `api-server` (BLOQUEANTE — derivada del hecho B)**. Tres caminos:
   - **A. Mantener `api-server` desplegado** y que Astro lo siga consumiendo desde una isla React `<Changelog client:visible>` con `@workspace/api-client-react`. Conserva caché, rate-limit monitor y backend propio. **Recomendada** — preserva la arquitectura actual sin sorpresas.
   - **B. Build-time fetch**: en cada build de Astro, leer GitHub e inyectar releases en HTML. Pierde frescura (rebuild para reflejar nuevas releases) y rompe el flujo de codegen Orval para `useGetReleases`. Solo viable si se reduce la frecuencia esperada de releases.
   - **C. Cliente llama a GitHub directo**: elimina `api-server`. Rate limit anónimo (60 req/h/IP), no hay caché ni token. **Descartar** salvo prototipo.
2. **Adapter de Astro**: estático puro (`output: 'static'`) + headers replicados en host (`_headers`/`vercel.json`), o `@astrojs/node` reusando `server.mjs`. Dependiente de la decisión 1: si se elige A, basta con estático (el backend sigue separado).
3. **Estrategia de generación de PDF**:
   - **A. Print CSS + `window.print()`** — cero infra, calidad razonable, el usuario decide márgenes. Recomendada para MVP.
   - **B. Playwright en build** — genera `humberto-bello-cv.pdf` estático en cada deploy desde `/cv?print=1`. Mejor fidelidad. Requiere extender CI (que hoy no tiene job de build, hecho J). Recomendada para v2.
   - **C. Cliente con `html2pdf.js`** — descartar (bundle ~150KB, fidelidad pobre con custom fonts).
4. **i18n**: mantener i18next como isla `client:load` (bajo esfuerzo de migración, conserva 3 locales con lazy loading actual), o adoptar el routing i18n nativo de Astro (`src/pages/[lang]/...`, mejor para SEO con `hreflang`, requiere rewrite del switcher).
5. **Alcance del rewrite de `home.tsx` (1279 LOC, hecho D)**: home entera a `.astro` con islas focalizadas (Changelog, FadeIn/Framer, switcher de idioma), o home como isla raíz `client:load` (migración trivial sin ganancia de perf — equivalente a "Astro shell" sobre el bundle actual).
6. **Scope de `mockup-sandbox`**: queda fuera de la migración salvo decisión explícita (hecho K). Confirmar.
7. **Licencia Bogart `-trial`** (hecho M): comprar, sustituir, o aceptar el riesgo legal antes del despliegue.

Sin estas 7 decisiones, las fases siguientes producirán código que habrá que reescribir.

---

## 5. Plan refinado (versión propuesta)

### Fase 0 bis — Decisiones de arquitectura + inventario completo

- Resolver las **7 decisiones** de la sección 4 (incluida la del `api-server`).
- Inventario SEO completo: title, description, OG, Twitter, canonical, **JSON-LD ProfilePage**, sitemap, robots, hreflang (si se mantiene i18n con routing nativo).
- Diseñar `cv.md` con frontmatter validable vía `astro:content` schema (Zod). Reutilizar las claves del JSON-LD existente (`jobTitle`, `knowsAbout`, `sameAs`, `hasOccupation`) para evitar duplicar verdad.
- **Output**: `migration_progress.md` con decisiones grabadas + `cv.md` schema borrador.

### Fase 1 bis — Arquitectura documentada + despiece de `home.tsx` ✅ parcialmente hecha

- ✅ `architecture.md` ya existe con: monorepo, contrato Orval, runtime data flow, topología de despliegue, interior del frontend, interior del backend, CI, inventario SEO/assets, postura de seguridad. Mantenerlo vivo: actualizar tras cada fase.
- Pendiente: **mapa explícito** de `home.tsx` (1279 LOC) → bloques Astro nativos vs islas React focalizadas. Sugerido:
  - **Astro nativo**: Hero (texto + img), Experience (lista), Clients (grid), CTA (links a `/cv` y `mailto:`), Footer.
  - **Islas React**: `<Changelog client:visible>` (consume `@workspace/api-client-react`), `<FadeIn client:visible>` (Framer Motion), `<LanguageSwitcher client:load>` (si se mantiene i18next), `<Toaster>` solo si se usa.
- Documentar estrategia de cabeceras de seguridad post-migración (host vs adapter Node) según la decisión 2.

### Fase 2 bis — Bootstrap Astro + componentes base

- Crear `artifacts/dossier-astro/` como **paquete nuevo** del workspace (respeta el patrón `@workspace/*` y el catálogo `pnpm-workspace.yaml`). Coexiste con `humberto-bello/` durante la migración; al final se decide qué hacer con el legado.
- Integrar Astro en el monorepo: añadir las versiones de `astro`, `@astrojs/react`, `@astrojs/sitemap`, `@astrojs/mdx` al `catalog:` para mantener convención.
- **Conservar el contrato Orval**: `dossier-astro` consume `@workspace/api-client-react` desde una isla React (no regenerar; los hooks existen). Documentar que el Changelog sigue siendo React island.
- `BaseHead.astro` parametrizable con todos los meta + JSON-LD (reutilizar el bloque actual textualmente — está bien construido).
- `astro:content` collection `cv` con schema Zod alineado al frontmatter de `cv.md`.
- Routing i18n según decisión 4 (nativo Astro o isla i18next).
- Smoke test: home renderiza con SSG (sin Changelog aún) y pasa Lighthouse igual o mejor que el baseline actual.

### Fase 3 bis — Migración incremental por secciones

- Migrar `home.tsx` sección por sección siguiendo el mapa de Fase 1 bis. **Snapshot Playwright en cada PR** comparado contra `humberto-bello/` baseline para detectar regresiones visuales.
- Migrar el `Changelog` como isla: reutilizar literalmente el componente actual (`Changelog.tsx`) envuelto en `<QueryClientProvider>` propio, con `client:visible`. Cero cambios en `@workspace/api-client-react` ni en `api-server`.
- Implementar `/cv`:
  - Página Astro consume `cv.md` vía content collections (`getEntry('cv', '...')`).
  - Layout web hereda el shell del sitio (header/footer).
  - Layout de impresión (`/cv?print=1` o ruta separada `/cv/print`) con CSS `@media print` y `@page` para márgenes — completamente aislado del shell web.
- Generación de PDF según decisión 3 (Print CSS MVP o Playwright build v2).
- Actualizar los `<a download>` de `home.tsx` (líneas 288, 354) para apuntar al PDF generado desde `cv.md`, o reemplazarlos por un link a `/cv` con botón "Descargar" interno.

### Fase 4 bis — Reorganización mínima de assets (alcance real)

Inventario auditado de assets en uso desde el front:

| Asset | Origen | Destino | Acción |
|---|---|---|---|
| `headshot-corp_1776739603885.avif` (700w) | `attached_assets/` | `artifacts/<app>/src/assets/images/humberto-bello-headshot.avif` | mover + renombrar |
| `headshot-corp_1776739603885.webp` (700w) | `attached_assets/` | `…/humberto-bello-headshot.webp` | mover + renombrar |
| `headshot-corp_1776739603885@1x.avif` (350w) | `attached_assets/` | `…/humberto-bello-headshot@1x.avif` | mover + renombrar |
| `headshot-corp_1776739603885@1x.webp` (350w) | `attached_assets/` | `…/humberto-bello-headshot@1x.webp` | mover + renombrar |
| `opengraph.jpg` | repo root | sin cambios | conservar (caches sociales) |
| `favicon.svg` | repo root | sin cambios | conservar |
| `Humberto_Bello_Resume.pdf` | `public/` | reemplazado por el PDF generado desde `cv.md` (Fase 3 bis) | regenerar |
| `attached_assets/*.{pptx,pdf,zip,png,jpeg}` no listados arriba | `attached_assets/` | `docs/source-material/` o **se quedan** | NO se procesan; no son assets de runtime |

Tareas concretas:

1. **Mover y renombrar 4 archivos** del headshot.
2. **Actualizar 4 imports** en `src/pages/home.tsx` (líneas 24-27) y los 2 lookups regex en `vite.config.ts` (`heroPreloadPlugin`, líneas 73-77).
3. Mantener los anchos actuales (**350w + 700w**) — son los que dictan los `sizes` del `<picture>` y cubren mobile (336px ≈ 350) y desktop (640px @1x / @2x ≈ 700).
4. Para imágenes **nuevas** que aparezcan en `/cv`: usar `<Image>` de Astro con `widths` derivados del layout específico (no una lista global).
5. **No tocar** PPTX, PDFs históricos, ZIP de design system, screenshots — no se referencian desde código.

### Fase 5 bis — Validaciones y release

- **Extender `.github/workflows/ci.yml`** (hoy solo tiene check-fonts/typecheck/lint, hecho J) con jobs nuevos pineados a SHA siguiendo la convención del repo:
  - `build`: `pnpm -r --filter ./artifacts/dossier-astro run build` y `pnpm --filter @workspace/api-server run build`.
  - `lighthouse`: presupuesto LCP < 2.5s, CLS < 0.1, INP < 200ms, TBT < 200ms — comparativa contra baseline `humberto-bello/`.
  - `visual-regression`: Playwright screenshots en 3 viewports (móvil 375, tablet 768, desktop 1280) para `/`, `/cv`, `/cv/print`.
  - `a11y`: axe-core sobre las mismas rutas (foco especial en el botón de descarga del PDF y el switcher de idioma).
- **Smoke test del PDF**: que el archivo se genere, peso razonable (< 500 KB esperado para CV de 1–2 páginas), primera página contenga el nombre, fuentes embebidas correctamente.
- **Smoke test del Changelog**: que la isla hidrate, `useGetReleases()` ejecute, y los datos cacheados de `api-server` rendericen. Validar también que el frontend nuevo está incluido en la `allowed-origins.ts` de `api-server` para no romper CORS.
- **Cabeceras de seguridad** (CSP/HSTS/COOP de `server.mjs`, hecho C) → reconfigurar en el host (`_headers`/`vercel.json`) si Astro es estático, o validar que adapter Node sirve las mismas. **Oportunidad de endurecer CSP** (hecho N) eliminando `'unsafe-inline'`/`'unsafe-eval'` cuando se quiten los plugins de Replit.
- **Regenerar `sitemap.xml`** con `/cv` y `hreflang` si aplica. Usar `@astrojs/sitemap` (auto-genera) en lugar del XML manual actual.
- Validar que `pnpm --filter @workspace/api-spec run codegen` sigue funcionando y que `dossier-astro` consume los hooks generados sin friction.

---

## 6. Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Asumir SSG puro y romper el flujo `Changelog → /api/releases → GitHub` | Alta si no se toma decisión 1 | Alto | Mantener `api-server` y consumirlo desde una isla React (decisión 1 opción A) |
| Romper CORS al cambiar de origen del frontend | Alta | Medio | Añadir el nuevo origen a `api-server/src/lib/allowed-origins.ts` antes del primer deploy |
| Re-generar `lib/api-zod`/`lib/api-client-react` manualmente y desincronizar con `openapi.yaml` | Media | Alto | Nunca editar `generated/`; usar `pnpm --filter @workspace/api-spec run codegen` |
| Pérdida de CWV al introducir islas mal calibradas | Media | Alto | Lighthouse CI gate antes de mergear |
| Romper SEO (perder JSON-LD o canonical) | Media | Alto | Test automatizado de meta-tags en build; reutilizar literalmente el bloque actual de `index.html` |
| PDF generado con fonts rotas (Bogart custom) | Alta | Medio | Embeber fuentes en el PDF; con Playwright esperar `document.fonts.ready` antes de imprimir |
| Despliegue estático pierde cabeceras CSP/HSTS/COOP de `server.mjs` | Alta si Astro `output: 'static'` | Alto | Replicar headers en host (`_headers`/`vercel.json`) o mantener adapter Node |
| Fuentes Bogart `-trial` en producción | Alta | Bajo-Medio (legal) | Resolver licencia antes del primer deploy público (decisión 7) |
| CI sin job de build/test → regresiones que solo se ven en deploy | Alta | Alto | Añadir jobs `build`, `lighthouse`, `visual-regression`, `a11y` (Fase 5 bis) |
| Generar escalas de imagen no usadas por ningún breakpoint | Alta si se sigue el plan original | Bajo (gasta build time, no rompe) | Limitar `widths` a los anchos que dictan los `sizes` reales del layout (350w + 700w para el headshot) |
| `attached_assets/` movido entero rompe referencias en docs/scripts | Eliminado | — | Decisión cerrada: solo los 4 archivos del headshot se mueven; el resto se queda |
| i18n se rompe durante migración | Alta si no se planifica | Alto | Decidir routing i18n en Fase 0 bis, no en Fase 3 (decisión 4) |
| `/clear` entre fases pierde decisiones | Alta | Medio | Ledger explícito + commit por fase con notas en el mensaje; `architecture.md` se mantiene vivo |
| Servicio externo de conversión de imágenes no reproducible | Alta | Medio | Usar `sharp` local (ya está en devDeps) |
| `mockup-sandbox` queda olvidado y diverge | Media | Bajo | Confirmar en decisión 6 que queda fuera; documentar en `architecture.md` |

---

## 7. Recomendación final

**Adoptar el plan con las correcciones de las secciones 3, 4 y 5 de este
documento, y usar `architecture.md` como línea base viva** que se actualiza
en cada fase. En particular:

1. Cerrar las **7 decisiones** de la sección 4 **antes** de tocar código — en particular la #1 (`api-server`) porque condiciona el adapter de Astro, la CSP y el alcance de la Fase 3.
2. **No romper el contrato Orval**: `dossier-astro` consume `@workspace/api-client-react` como isla; el codegen no se modifica.
3. Reemplazar el convertidor externo por `sharp` / `<Image>` de Astro; aplicarlo **solo** a imágenes que efectivamente se rendericen.
4. Mover **solo los 4 archivos del headshot** de `attached_assets/`; el resto (PPTX, PDFs viejos, ZIP, screenshots) no se procesa. Derivar `widths` de los `sizes` reales del layout (para el headshot actual: 350w + 700w, no las 6 escalas globales del plan original).
5. Incluir i18n y JSON-LD en el inventario desde Fase 0.
6. Definir el método de generación de PDF antes de Fase 3.
7. **Extender CI** (hoy sin build/test) con jobs nuevos en Fase 5 bis, manteniendo la convención de SHA-pinning.
8. Decidir destino de las cabeceras CSP/HSTS/COOP (host vs adapter Node) antes de Fase 3.

Con esas correcciones el plan tiene buena probabilidad de ejecutarse sin
sorpresas. Sin ellas, la Fase 3 se atascará en decisiones de arquitectura
que debieron tomarse antes — especialmente la del `api-server`, que es la
brecha más grande entre el plan original y la arquitectura real del repo.
