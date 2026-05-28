# Propuesta de Optimización — `/cv` desde `cv.md`

> Análisis y plan apoyados en `architecture.md`. Stack actual (Vite + React +
> Express + Orval) se conserva; se añade `/cv` como HTML estático generado
> en build desde un `cv.md` SSOT.

---

## 1. Plan refinado

### Paso 1 — Diseñar `cv.md` (SSOT)

- Frontmatter YAML con metadatos del CV: nombre, headline, ubicación,
  contacto, idiomas, JSON-LD de respaldo (`jobTitle`, `knowsAbout`,
  `hasOccupation`, `sameAs`). Reutilizar las claves del JSON-LD
  `ProfilePage` ya presente en `index.html` (`architecture.md` §9) para
  evitar duplicar fuente de verdad.
- Cuerpo en Markdown con secciones: Resumen, Experiencia, Educación,
  Habilidades, Certificaciones, Idiomas.
- Validar el frontmatter con un schema Zod (encaja con `@workspace/api-zod`
  patrón ya usado en el repo).
- Ubicación sugerida: `artifacts/humberto-bello/content/cv.md`.

### Paso 2 — Build script `cv.md → cv/index.html`

- Nuevo `scripts/src/build-cv.ts` dentro del paquete `@workspace/scripts`
  (tsx ya está disponible, encaja con `check-fonts.ts` / `check-bundle-size.ts`).
- Pipeline:
  - Leer `cv.md`, parsear frontmatter, validar con Zod.
  - Compilar MD → HTML con `unified` + `remark-parse` + `remark-rehype` +
    `rehype-stringify` (sólo build-time, cero deps runtime).
  - Envolver en plantilla HTML con:
    - `<head>` SEO completo: `title`, `description`, `canonical=/cv`, OG,
      Twitter Card, **JSON-LD `Person` + `Resume`/`CreativeWork`** derivados
      del frontmatter.
    - `@font-face` reutilizando las Bogart / InterTight / JetBrainsMono ya
      existentes en `/fonts`.
    - `<style>` con CSS de pantalla **y** print embebido (`@media print`,
      `@page` con márgenes definidos).
  - Escribir `artifacts/humberto-bello/public/cv/index.html`.
- Hook en `artifacts/humberto-bello/package.json`: `prebuild` ejecuta
  `pnpm --filter @workspace/scripts exec tsx ./src/build-cv.ts`.
- `vite build` ya copia `public/*` a `dist/public/*`; `server.mjs` ya sirve
  estáticos — `/cv` queda funcional sin más cambios de infraestructura.
- **PDF descargable**: botón en `/cv/index.html` que llama
  `window.print()`. Cero infra extra. El usuario obtiene un PDF fiel al
  print CSS desde el diálogo del navegador. (Si más adelante se requiere
  un PDF descargable directo desde `/`, añadir Playwright en build en v2 —
  no entra en este alcance.)

### Paso 3 — Reorganizar el único asset que se usa

- Mover el headshot de `attached_assets/` a
  `artifacts/humberto-bello/src/assets/images/` con nombre semántico:
  - `humberto-bello-headshot.{avif,webp}` (700w)
  - `humberto-bello-headshot@1x.{avif,webp}` (350w)
- Actualizar 4 imports en `artifacts/humberto-bello/src/pages/home.tsx`
  (líneas 24-27) y los 2 lookups regex en `artifacts/humberto-bello/vite.config.ts`
  (`heroPreloadPlugin`, líneas 73-77).
- Mantener `opengraph.jpg`, `favicon.svg` y fuentes intactos.
- Mantener los anchos actuales (350w + 700w) — son los que dictan los
  `sizes` reales del `<picture>` (`architecture.md` §9).
- El resto de `attached_assets/` (PPTX, PDFs viejos, ZIP, screenshots, jpegs
  sueltos) **no se toca** — no se referencia desde código.

### Paso 4 — Conectar `/cv` y validar

- Actualizar `home.tsx` líneas 288, 354: `href="/cv"` y quitar `download="..."`
  (el PDF se obtiene desde el botón "Imprimir/Descargar" dentro de `/cv`).
- Añadir `/cv` a `sitemap.xml` (raíz del repo).
- Validación manual:
  - `view-source:` en `/cv` muestra el contenido del MD en el primer byte
    (objetivo SEO cumplido).
  - Lighthouse antes/después en `/` (no debe degradar) y en `/cv` (target
    ≥ 95 en SEO y Performance).
  - Imprimir `/cv` desde Chrome → verificar paginación, fuentes embebidas
    y márgenes del PDF resultante.
  - Smoke test del `Changelog` en `/` — debe seguir funcionando (no se
    tocó la ruta).

---

## 2. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Print CSS produce PDF con paginación rota o fuentes mal embebidas | Media | Medio | Iterar el CSS print con Chrome DevTools (Rendering → Emulate CSS media print) antes de cerrar el Paso 2 |
| Pérdida o duplicación del JSON-LD al construir `<head>` de `/cv` | Media | Alto | Centralizar el bloque SEO en una constante TS importada tanto por `build-cv.ts` como por una posible plantilla compartida; canonical de `/cv` debe apuntar a `/cv`, no a `/` |
| Renombrado del headshot rompe `heroPreloadPlugin` por el regex | Media | Bajo (build falla inmediatamente) | Actualizar regex en el mismo commit y validar que `vite build` siga inyectando el `<link rel="preload">` |
| `/cv` no se añade a `sitemap.xml` y queda fuera del índice | Baja | Alto | Editar `sitemap.xml` en el mismo commit del Paso 4 |
| `cv.md` desincronizado del JSON-LD de `index.html` (`jobTitle`, `knowsAbout`…) | Media | Medio | El build script lee del mismo frontmatter de `cv.md` y emite ambos JSON-LD; idealmente `index.html` también pasa a inyectarse vía script para que `cv.md` sea la única fuente |
| Fuentes Bogart `-trial` en producción (legal) | Alta existente | Bajo-Medio | Orthogonal al cambio, pero registrar para resolver antes de un despliegue público estable |
