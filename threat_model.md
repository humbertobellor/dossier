# Threat Model

## Project Overview

This repository is a pnpm monorepo with two production-relevant surfaces: a public React/Vite portfolio site in `artifacts/humberto-bello` served at `/`, and an Express API in `artifacts/api-server` served at `/api`. It also contains shared OpenAPI/client/database libraries under `lib/` and a `artifacts/mockup-sandbox` preview app used for development.

The current deployment wiring confirms that the portfolio is built as a static site, the API is a separate production service, and the mockup sandbox has development-only service wiring with no production stanza. In the checked-in code, the portfolio is public and mostly static, but the API is no longer just a health check: it also exposes `POST /api/contact`, which accepts unauthenticated submissions, writes contact data to PostgreSQL through `lib/db`, and optionally forwards the message through Resend. Per platform assumptions, production traffic is terminated over TLS by the platform and `NODE_ENV` is `production`.

## Assets

- **Application availability** — the portfolio site, health endpoint, and contact channel should remain reachable because the app is customer-facing and used as a professional profile.
- **Contact submissions** — names, email addresses, and messages collected through `/api/contact` are real user-supplied data stored in PostgreSQL and relayed to the owner by email.
- **Deployment and infrastructure secrets** — environment variables such as `DATABASE_URL`, `RESEND_API_KEY`, future auth tokens, and any deployment credentials must not be exposed to clients or logs.
- **Server integrity** — the API process and build pipeline must not execute attacker-controlled code or import arbitrary files.
- **Professional contact details and published content** — the site intentionally publishes biographical information and an email address, but it should not accidentally expose unpublished files, hidden assets, or internal metadata.

## Trust Boundaries

- **Browser to portfolio frontend** — all page state, navigation inputs, and contact form inputs from the browser are untrusted.
- **Browser to API (`/api`)** — production API routes must treat all requests as untrusted and enforce validation and abuse controls server-side.
- **API to PostgreSQL** — `lib/db` creates a privileged database connection from `DATABASE_URL`; injection or unsafe query construction here would directly impact data confidentiality and integrity.
- **API to Resend** — the contact flow can call Resend with `RESEND_API_KEY`; abuse of this path can turn the site into a spam amplifier or leak operational details.
- **Production vs dev-only artifacts** — `artifacts/mockup-sandbox` is a development/preview surface with development-only service wiring and should be ignored unless it becomes reachable from the deployed production app.
- **Build-time environment to client bundle** — Vite configuration and frontend code must not leak server-side secrets into shipped client assets.

## Scan Anchors

- **Production entry points:** `artifacts/humberto-bello/src/main.tsx`, `artifacts/humberto-bello/src/App.tsx`, `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/health.ts`, `artifacts/api-server/src/routes/contact.ts`.
- **Highest-risk code areas:** `artifacts/api-server/src/routes/contact.ts`, `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/lib/logger.ts`, `lib/db/src/index.ts`, `lib/db/src/schema/contact_submissions.ts`, `lib/api-client-react/src/custom-fetch.ts`.
- **Public vs authenticated vs admin surfaces:** current production surface is entirely public; there are no authenticated or admin routes in the checked-in code.
- **Dev-only areas usually out of scope:** `artifacts/mockup-sandbox/**`, generated UI primitives not imported by production routes, and local preview/build helpers unless production reachability is demonstrated.

## Threat Categories

### Spoofing

The current production application does not implement end-user authentication, so spoofing risk is limited to future API expansion and service-to-service trust. Any new protected endpoint added under `artifacts/api-server/src/routes` must require a server-validated identity and must not rely on client-only claims or UI state.

### Tampering

All request data reaching the Express API must be treated as attacker-controlled. The current `POST /api/contact` route already accepts unauthenticated user input, so request bodies, headers, and form submissions must be validated before use, and the server must not derive SQL fragments, email headers, filesystem paths, or security decisions directly from user input.

### Information Disclosure

The highest current disclosure risk is accidental leakage of secrets or internal files through frontend bundling, API responses, or logs. Environment variables such as `DATABASE_URL` and `RESEND_API_KEY` must remain server-only, logs must continue to redact cookies and authorization headers, and production responses must not expose stack traces, hidden files, or unnecessary infrastructure details.

### Denial of Service

The public site and API are internet-reachable, and the contact endpoint performs storage and optional email delivery side effects. Public write endpoints such as `/api/contact` must use bounded request sizes, effective abuse controls, and origin-aware protections so attackers cannot flood the inbox, database, or third-party email provider by driving submissions from many clients. The health endpoint should remain lightweight and side-effect free.

### Elevation of Privilege

The strongest privilege boundary today is between public traffic and any future privileged API/database operations. All future data-bearing routes must enforce authorization server-side where applicable, and all database usage must remain parameterized through safe ORM/query-builder patterns rather than string-built SQL. Dev-only preview tooling must not become reachable from production because it intentionally exposes broader file/component discovery behavior appropriate only for local development.
