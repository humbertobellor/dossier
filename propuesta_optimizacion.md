# Propuesta de Optimización — Revisión del Plan de Migración a Astro + Módulo `/cv`

> Revisión técnica del plan propuesto para la migración del repo `dossier`
> (https://github.com/humbertobellor/dossier) a Astro SSG con un nuevo módulo
> `/cv` alimentado por un `cv.md` SSOT.

---

## 1. Veredicto general

**Viable, con condiciones.** El esqueleto de fases es razonable y el patrón de
ledger (`migration_progress.md`) es buena disciplina. Sin embargo, varios
supuestos del plan no se sostienen al confrontarlos con el estado real del
repo, y hay decisiones críticas que el plan deja en aire (formato de
generación del PDF, i18n existente, cabeceras de seguridad, manejo de
`attached_assets`). Antes de ejecutar, conviene cerrar esos huecos.

---

## 2. Estado real del repositorio (relevante para el plan)

| Pieza | Estado actual | Implicación para la migración |
|---|---|---|
| Sitio principal | `artifacts/humberto-bello`: React 19 + Vite 7 + Tailwind 4 + Radix UI (~50 componentes) + Framer Motion + wouter + React Query + i18next (EN/ES/DE) | Migración a Astro **no es 1:1**; islas React inevitables o rewrite parcial |
| Página única | `src/pages/home.tsx`: **1279 LOC** | Trocear en componentes Astro/islas antes de migrar |
| CV actual | `public/Humberto_Bello_Resume.pdf` ya existe (estático, sin ruta `/cv`) | El plan debe enmarcarse como **reemplazar el PDF estático por SSOT en Markdown**, no como "añadir CV donde no había" |
| SEO | `index.html` ya trae Title/Description/OG/Twitter/canonical + JSON-LD `ProfilePage` completo + `sitemap.xml` + `robots.txt` | Hay que **trasladar el JSON-LD** (el plan solo menciona meta-tags) |
| Performance | Beasties (critical CSS), Hero AVIF preload plugin, Bogart font preload plugin, manual chunks `vendor-react`/`vendor-i18n`, AVIF+WebP `@1x`/full | Las ganancias de Astro serán **marginales** si se conservan las islas React |
| Imágenes | `headshot-corp_*.{avif,webp,png}` + variantes `@1x` en `attached_assets/` | `attached_assets/` también contiene PDFs, PPTX, ZIPs y screenshots — **no es solo imágenes** |
| Procesamiento de imagen | `sharp@^0.34.5` ya está en devDependencies del root | **No hace falta un convertidor externo**; Astro `<Image>` usa sharp internamente |
| Seguridad | `server.mjs` aplica CSP, HSTS, COOP, X-Frame-Options, cache headers diferenciados | Sin esto, un Astro estático puro pierde las cabeceras; hay que mover la CSP al host o usar adapter Node |
| i18n | i18next + LanguageDetector con bundle EN inline y ES/DE lazy | **El plan no lo menciona en ninguna fase** — gap crítico |
| Fuentes | Bogart `-trial` (versión de prueba) | Revisar licencia antes de despliegue público (fuera del scope del plan, pero a registrar) |
| Monorepo | pnpm workspaces; `artifacts/humberto-bello` consume `@workspace/api-client-react` | Integrar Astro respetando el catálogo de versiones (`pnpm-workspace.yaml`) |

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
- **Eliminar la dependencia del servicio externo `image-conversor.netlify.app`.** El repo ya incluye `sharp@^0.34.5`. Usar:
  - **Astro `<Image>` / `<Picture>`** (procesa con sharp en build, genera AVIF/WebP, srcset y `widths` automáticos), o
  - Un script local `scripts/optimize-images.ts` con sharp si se necesita fuera de Astro.
  - Beneficios: reproducible en CI, sin upload de assets a tercero, sin paso manual entre fases.
- **No mover ciegamente `attached_assets/` a `src/assets/images/`.** Esa carpeta también contiene:
  - PDFs (`Humberto_Bello_Resume-05-26_*.pdf`, `bertjbello_*.pdf`) — fuente del CV
  - PPTX (`Humberto_Bello_Dossier_*.pptx`) — material original
  - ZIP (`Wolknitive_Design_System-handoff_*.zip`)
  - Screenshots de prueba
  - Solo las imágenes (`headshot-corp_*`, fotos jpeg/png) deben moverse. El resto se queda o pasa a `docs/source-material/`.
- Escalas propuestas: `468px` parece typo de `480px`. Además, **Astro deriva las escalas vía `widths=[320,480,768,1080,1440,2160]` en `<Image>`** — no hay que generarlas a mano una a una.
- Mantener PNG/JPG **fallback** para navegadores legacy en el `<picture>` (Astro lo hace si se pasan `formats: ['avif','webp']` y un `src` fallback).

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

1. **Adapter de Astro**: estático puro (`output: 'static'`) + headers en el host, o `@astrojs/node` manteniendo `server.mjs`.
2. **Estrategia de generación de PDF**:
   - **A. Print CSS + `window.print()`** — cero infra, calidad razonable, el usuario decide márgenes. Recomendada para MVP.
   - **B. Playwright en build** — genera `humberto-bello-cv.pdf` estático en cada deploy desde `/cv?print=1`. Mejor fidelidad. Recomendada para v2.
   - **C. Cliente con `html2pdf.js`** — descartar (bundle ~150KB, fidelidad pobre con custom fonts).
3. **i18n**: mantener i18next como isla, o adoptar el routing i18n nativo de Astro (`src/pages/[lang]/...`)?
4. **Alcance del rewrite**: ¿home entera a `.astro` con islas focalizadas, o home como isla raíz `client:load` (migración trivial sin ganancia de perf)?
5. **Licencia Bogart**: las fuentes son `-trial`. ¿Compramos licencia, sustituimos, o se mantiene fuera de scope (riesgo legal)?

Sin estas 5 decisiones, las fases siguientes producirán código que habrá que reescribir.

---

## 5. Plan refinado (versión propuesta)

### Fase 0 bis — Decisiones de arquitectura + inventario completo

- Resolver las 5 decisiones de la sección 4.
- Inventario SEO completo: title, description, OG, Twitter, canonical, **JSON-LD ProfilePage**, sitemap, robots, hreflang (si se mantiene i18n).
- Diseñar `cv.md` con frontmatter validable vía `astro:content` schema (Zod).
- **Output**: `migration_progress.md` con decisiones grabadas + `cv.md` schema borrador.

### Fase 1 bis — Arquitectura documentada + despiece de `home.tsx`

- `architecture.md` con:
  - Diagrama del monorepo (`artifacts/`, `lib/`, `scripts/`).
  - Mermaid `cv.md → /cv (web) + cv.md → PDF`.
  - Mapa de qué bloques de `home.tsx` (1279 LOC) pasan a Astro nativo vs isla React.
  - Estrategia de cabeceras de seguridad post-migración.

### Fase 2 bis — Bootstrap Astro + componentes base

- Crear `artifacts/dossier-astro/` (o reescribir `humberto-bello/` in-place según se prefiera).
- `BaseHead.astro` con todos los meta + JSON-LD parametrizable.
- `astro:content` collection para `cv` con schema Zod.
- Routing i18n decidido en Fase 0 bis.
- Smoke test: la home renderiza con SSG y pasa Lighthouse igual o mejor que el baseline.

### Fase 3 bis — Migración incremental por secciones

- Migrar `home.tsx` sección por sección (hero, experience, clients, CTA), con baseline visual de Playwright en cada paso para evitar regresiones.
- Implementar `/cv` consumiendo el frontmatter + body del `cv.md`.
- Implementar generación de PDF según decisión Fase 0 bis (Print CSS o Playwright build).

### Fase 4 bis — Optimización de assets reproducible

- Mover **solo imágenes** de `attached_assets/` a `src/assets/images/` con nombres semánticos.
- Source material no-imagen → `docs/source-material/` (fuera de bundle).
- Usar `<Image>` / `<Picture>` de Astro con `widths=[320,480,768,1080,1440,2160]`, `formats=['avif','webp']`, `quality=80`, `loading="lazy"` (excepto hero, `eager` + `fetchpriority="high"`).
- Conservar `opengraph.jpg` y favicon intactos.

### Fase 5 bis — Validaciones y release

- Lighthouse CI con presupuesto y comparativa antes/después.
- Playwright visual regression en 3 viewports para home y `/cv`.
- Test funcional del flujo de descarga del PDF.
- a11y con axe-core sobre home y `/cv`.
- Configurar CSP/HSTS/COOP en el host (o validar que adapter Node mantiene `server.mjs`).
- Regenerar `sitemap.xml` con `/cv` y hreflang si aplica.

---

## 6. Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Pérdida de CWV al introducir islas mal calibradas | Media | Alto | Lighthouse CI gate antes de mergear |
| Romper SEO (perder JSON-LD o canonical) | Media | Alto | Test automatizado de meta-tags en build |
| PDF generado con fonts rotas (Bogart custom) | Alta | Medio | Embeber fuentes en el PDF o usar Playwright con esperas de `document.fonts.ready` |
| `attached_assets/` movido entero rompe referencias en docs/scripts | Alta | Bajo-Medio | Mover solo imágenes; auditar `grep -r attached_assets` antes |
| i18n se rompe durante migración | Alta si no se planifica | Alto | Decidir routing i18n en Fase 0 bis, no en Fase 3 |
| `/clear` entre fases pierde decisiones | Alta | Medio | Ledger explícito + commit por fase con notas en el mensaje |
| Servicio externo de conversión de imágenes no reproducible | Alta | Medio | Usar `sharp` local (ya está en devDeps) |

---

## 7. Recomendación final

**Adoptar el plan con las correcciones de las secciones 3, 4 y 5 de este
documento.** En particular:

1. Cerrar las 5 decisiones de la sección 4 **antes** de tocar código.
2. Reemplazar el convertidor externo por `sharp` / `<Image>` de Astro.
3. No mover `attached_assets/` en bloque — auditar primero.
4. Incluir i18n y JSON-LD en el inventario desde Fase 0.
5. Definir el método de generación de PDF antes de Fase 3.
6. Añadir gates de Lighthouse, visual regression y a11y en Fase 5.

Con esas correcciones el plan tiene buena probabilidad de ejecutarse sin
sorpresas. Sin ellas, la Fase 3 se atascará en decisiones de arquitectura
que debieron tomarse antes.
