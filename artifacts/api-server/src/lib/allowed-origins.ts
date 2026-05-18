import { logger } from "./logger";

/**
 * Builds the set of origins that are permitted to call the API.
 *
 * In all environments, every domain listed in REPLIT_DOMAINS is allowed so
 * that both the dev-preview domain and any custom/published domain work.
 * In non-production environments localhost variants are also added so that
 * local development tooling (e.g. Vite dev server on any port) keeps working.
 */
export function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>();

  const replitDomains = process.env.REPLIT_DOMAINS ?? "";
  for (const raw of replitDomains.split(",")) {
    const domain = raw.trim();
    if (domain) {
      origins.add(`https://${domain}`);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost");
    origins.add("http://127.0.0.1");
    for (const port of [3000, 4000, 5000, 5173, 8080]) {
      origins.add(`http://localhost:${port}`);
      origins.add(`http://127.0.0.1:${port}`);
    }
  }

  return origins;
}

export const allowedOrigins: Set<string> = buildAllowedOrigins();

if (allowedOrigins.size === 0) {
  logger.warn(
    "allowedOrigins is empty — REPLIT_DOMAINS may not be set. " +
      "All browser contact submissions will be rejected with 403.",
  );
}
