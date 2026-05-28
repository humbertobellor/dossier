# Propuesta de Optimización — `/cv` desde `cv.md`

> Análisis del plan original tras auditar el repo (`architecture.md`) y
> recortar todo lo que añade complejidad sin retorno proporcional al
> objetivo real.

---

## 1. Veredicto

El plan original elegía **Astro SSG** por dos razones declaradas:

1. **SEO potenciado**
2. **`/cv` en Markdown indexable**

La auditoría muestra que **ambas se cubren sin migrar el framework**:

- **El SEO ya está maxed** (`architecture.md` §9): title, description,
  keywords, canonical, OG completo, Twitter Card, **JSON-LD `ProfilePage`
  con `Person` anidado** (`knowsAbout`, `hasOccupation`, `sameAs`),
  `sitemap.xml`, `robots.txt`. Astro no añade nada material aquí.
- **`/cv` indexable desde Markdown** se logra compilando `cv.md → cv/index.html`
  en build time como HTML plano (sin React), y sirviéndolo como ruta estática
  desde `server.mjs`. Googlebot recibe el contenido en el primer byte;
  el resto del sitio React SPA queda intacto.

**Recomendación**: **NO migrar a Astro.** Añadir `/cv` al stack actual
(Vite + React + Express) con un build script que genere HTML estático
desde `cv.md`. Esto preserva todo lo que ya funciona (Beasties, hero
preload, AVIF+WebP, i18next EN/ES/DE, Changelog → `api-server`, headers
CSP/HSTS en `server.mjs`, contrato Orval) y entrega el deliverable real
con riesgo mínimo.

---

## 2. Hechos arquitectónicos que mandan

Solo los que realmente afectan la decisión. Detalle completo en
`architecture.md`.

| # | Hecho | Por qué importa |
|---|---|---|
| A | Vite + React 19 con perf optimizada al máximo (Beasties, hero/font preload, manual chunks, AVIF+WebP) — `architecture.md` §6 | El stack actual está bien; reemplazarlo es trabajo sin retorno |
| B | `Changelog.tsx` consume `/api/releases` vía TanStack Query → `api-server` Express con caché — `architecture.md` §4 | El sitio NO es estático. Cualquier "SSG puro" rompe esto o requiere mantener `api-server` igualmente |
| C | SEO ya completo en `index.html` (meta + OG + JSON-LD `ProfilePage` + sitemap) — `architecture.md` §9 | Astro no aporta SEO extra. Hay que preservar lo que ya está, no rehacerlo |
| D | `home.tsx` = 1279 LOC con Radix (~50), Framer Motion, i18next (EN/ES/DE), wouter — `architecture.md` §6 | Reescribirlo a Astro implica islas para Radix/Framer/i18n/Changelog → cero ganancia real |
| E | Imágenes en uso = **1 sola** (headshot, 4 archivos, **350w + 700w**). Resto de `attached_assets/` es source material no referenciado — `architecture.md` §9 | Optimización de imágenes = mover/renombrar 4 archivos, no procesar nada masivo |
| F | `Humberto_Bello_Resume.pdf` ya se descarga desde `home.tsx` líneas 288, 354 — `architecture.md` §9, §11 | Los botones existen; solo cambia el destino del PDF |
| G | `cv.md` indexable se logra con `dist/public/cv/index.html` estático servido por `server.mjs` | Build script de ~50 líneas (remark/rehype) — sin framework switch |

---

## 3. Lo que se elimina del plan original

| Elemento del plan original | Por qué se quita |
|---|---|
| **Migrar Vite+React a Astro** | Hecho A + B + C + D: ganancia marginal, costo alto, no resuelve nada que no se resuelva con un build script |
| Adapter de Astro (estático vs Node) | No aplica si no hay Astro |
| `BaseHead.astro`, `astro:content` collections | No aplica |
| Decisión de routing i18n (Astro nativo vs i18next isla) | i18next sigue como está; no se toca |
| Reescribir `home.tsx` (1279 LOC) sección por sección | No se toca; `/` se queda como está |
| Conversor externo `image-conversor.netlify.app` | El headshot ya está pre-generado AVIF+WebP a 1x/2x; basta moverlo |
| 6 escalas de imagen (320/468/768/1080/1440/2160) | Los `sizes` reales del `<picture>` solo piden 350w y 700w |
| Mover `attached_assets/` entero a `src/assets/images/` | Solo 4 archivos del headshot se referencian; el resto se queda |
| Crear `docs/source-material/` | Innecesario, los archivos no estorban donde están |
| Playwright visual regression en CI | Overkill para un cambio acotado a una ruta nueva; manual + Lighthouse cubre |
| Lighthouse CI con presupuestos estrictos | Manual antes/después es suficiente para validar que `/cv` no degrada `/` |
| axe-core gate en CI | Útil pero no bloqueante; correr a mano una vez |
| Scope de `mockup-sandbox` | Workspace independiente, nunca estuvo en juego |
| Licencia Bogart `-trial` | Orthogonal a la migración; tema legal aparte |
| Endurecimiento de CSP (quitar `'unsafe-inline'`) | Orthogonal; el sitio sigue cargando React → la CSP actual sigue siendo necesaria |
| `/clear` entre fases del prompt | Irrelevante al resultado técnico |
| 7 "decisiones bloqueantes" antes de tocar código | Sobre-procedimiento; las decisiones reales son 2 (ver §5) |

---

## 4. Lo que se conserva

- **Stack actual intacto**: Vite + React + Tailwind + Radix + Framer + i18next + wouter + TanStack Query + `api-server` + Orval + Husky + ESLint + Prettier + CI actual.
- **Toda la performance ya optimizada**: Beasties, hero preload, font preload, manual chunks, AVIF+WebP responsive.
- **Todo el SEO ya construido**: meta + OG + Twitter + JSON-LD `ProfilePage` + sitemap + robots.
- **Botones de descarga del CV en `home.tsx`** (líneas 288, 354) — solo cambia su `href` y `download` si se decide regenerar el PDF.
- **Auditoría de imágenes**: 1 sola imagen, 350w + 700w. El renombrado semántico (`humberto-bello-headshot.{avif,webp}`) sigue siendo deseable para SEO de imagen y se hace en una sola operación.

---

## 5. Las 2 decisiones que sí importan

1. **¿Cómo se genera el PDF descargable desde `cv.md`?**
   - **Opción recomendada (MVP)**: el PDF lo descarga el usuario desde
     `/cv` con `window.print()` y `@media print` CSS aislada. Cero infra,
     cero dependencias nuevas, fidelidad razonable.
   - Alternativa futura: Playwright/Puppeteer en build genera
     `humberto-bello-cv.pdf` estático en cada deploy (requiere extender CI;
     dejar para una v2 solo si el resultado del MVP no es satisfactorio).

2. **¿`/cv` mantiene el shell visual del sitio o es independiente?**
   - **Opción recomendada**: independiente — HTML plano con su propio
     `<head>` SEO (canonical `/cv`, JSON-LD adicional para `CreativeWork`/`Resume`),
     tipografía Wolknitive reutilizada vía `@font-face`, layout sobrio
     orientado a leer y a imprimir. Sin React, sin i18n. Indexable al 100%.
   - Alternativa: integrar `/cv` dentro del SPA React con `wouter`. Se ve
     más unificado pero el contenido vive detrás de JS — peor para SEO,
     que es exactamente lo que queríamos potenciar.

---

## 6. Plan refinado (4 pasos cortos)

### Paso 1 — Diseñar `cv.md`

- Frontmatter YAML con metadatos (nombre, headline, contacto, JSON-LD del CV).
- Cuerpo con secciones (Resumen, Experiencia, Educación, Habilidades, etc.).
- Validar con un `zod` schema en el build script.
- **Output**: `cv.md` en la raíz del workspace o en `artifacts/humberto-bello/content/cv.md`.

### Paso 2 — Build script `cv.md → cv/index.html`

- Script `scripts/src/build-cv.ts` (en el workspace `@workspace/scripts` ya existente):
  - Lee `cv.md`, parsea frontmatter, valida con Zod.
  - Compila MD → HTML con `unified` + `remark-parse` + `remark-rehype` + `rehype-stringify` (~150 KB de deps build-time, cero deps runtime).
  - Envuelve en plantilla HTML con `<head>` SEO (title, description, canonical, OG, **JSON-LD `Person`+`Resume`** reutilizando el bloque actual) y `<style>` con print CSS embebido.
  - Escribe `artifacts/humberto-bello/public/cv/index.html` para que Vite lo copie en `dist/public/cv/index.html` durante `vite build`.
- Hook en `package.json` de `humberto-bello`: `prebuild` corre `build-cv`.
- **Resultado**: `https://.../cv` sirve HTML estático con el contenido de `cv.md` en el primer byte. Googlebot lo indexa inmediatamente.

### Paso 3 — Reorganizar el único asset que se usa

- Mover el headshot de `attached_assets/` a `artifacts/humberto-bello/src/assets/images/`:
  - `humberto-bello-headshot.{avif,webp}` (700w)
  - `humberto-bello-headshot@1x.{avif,webp}` (350w)
- Actualizar 4 imports en `home.tsx` y 2 regex en `vite.config.ts` (`heroPreloadPlugin`).
- Quitar el alias `@assets` si deja de usarse, o redirigirlo al nuevo directorio.

### Paso 4 — Conectar `/cv` y validar

- Actualizar `home.tsx` líneas 288, 354: `href="/cv"` (o mantener
  `Humberto_Bello_Resume.pdf` si el PDF se genera en build con Playwright,
  v2).
- Añadir botón "Descargar PDF" en `/cv/index.html` que dispara `window.print()`.
- Añadir `/cv` a `sitemap.xml` (manual o regenerado).
- Validación:
  - Lighthouse antes/después sobre `/` y `/cv` (manual, no en CI).
  - Inspector de Google: `view-source:` en `/cv` muestra el contenido del MD.
  - PDF descargable: imprimir `/cv` desde Chrome, verificar paginación, fuentes y márgenes.
  - Smoke test del Changelog: que sigue funcionando (no se tocó).

---

## 7. Riesgos (top 5)

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Print CSS de `/cv` produce PDF con paginación rota o fuentes mal embebidas | Media | Medio | Iterar el CSS print con Chrome DevTools (Rendering → Emulate CSS media print) antes de cerrar el MVP |
| Pérdida del JSON-LD o canonical al duplicar `<head>` en `/cv` | Media | Alto | Centralizar el bloque SEO en una constante reutilizada por `index.html` y `cv/index.html` (build script lo inyecta) |
| Renombrado del headshot rompe el `heroPreloadPlugin` por el regex | Media | Bajo (build error inmediato) | Actualizar regex y validar que `npm run build` siga inyectando el preload |
| `/cv` no se actualiza en `sitemap.xml` y queda fuera del índice | Baja | Alto | Añadir línea a `sitemap.xml` en el mismo commit del Paso 4 |
| `cv.md` desincronizado del JSON-LD de `index.html` (jobTitle, knowsAbout, etc.) | Media | Medio | El build script lee del mismo source de verdad (frontmatter de `cv.md`) y genera ambos JSON-LD |

---

## 8. Recomendación final

**Implementar los 4 pasos del §6 sobre el stack actual. No migrar a Astro.**
La razón resumida:

- Las **dos motivaciones declaradas** (SEO potenciado + MD indexable) se
  cubren con un build script de MD→HTML, sin tocar el framework.
- El stack actual ya es **estado del arte en perf** para este tipo de sitio
  (`architecture.md` §6).
- Migrar implica reescribir 1279 LOC y mantener islas React para Radix,
  Framer, i18next y Changelog **igualmente**, por ganancia marginal.
- El deliverable real (`/cv` indexable + PDF descargable) se entrega en
  ~1 sprint sin riesgo de regresión sobre `/`.

Si más adelante aparecen razones **no-declaradas** para Astro (DX, demo
de stack moderno como portfolio piece, etc.), reabrir la conversación
entonces — pero no pagar el costo ahora con motivaciones que no lo
justifican.
