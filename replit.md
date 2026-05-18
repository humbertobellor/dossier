# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Humberto Bello - Professional Dossier (`artifacts/humberto-bello`)
- **Type**: React + Vite (presentation/portfolio site)
- **Preview path**: `/` (root)
- **Description**: Personal professional dossier website for Humberto "Bert" Bello, a Principal Architect & Engineering Leader
- **Content**: Hero section, professional skills, selected experience, clients/employers, CTA
- **Source material**: Converted from `attached_assets/Humberto_Bello_Dossier_1776738383392.pptx`
- **Theme color**: Teal `#56B5A3` on dark navy background
- **No backend** — pure static frontend site

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## CI / GitHub Actions

Every `uses:` line in `.github/workflows/ci.yml` is pinned to a full 40-character commit SHA rather than a mutable tag. A comment on each line shows the human-readable tag it corresponds to (e.g. `# v4`). This prevents unexpected breakage or supply-chain compromise from upstream tag mutations.

**To update an action to a newer version:**
1. Find the new tag's SHA via the GitHub API:
   ```
   curl https://api.github.com/repos/<owner>/<repo>/git/ref/tags/<tag>
   ```
   If the returned object type is `"tag"` (annotated), follow its `object.url` one level deeper to get the commit SHA.
2. Replace the old SHA in the workflow with the new one.
3. Update the inline `# vX` comment to match.
