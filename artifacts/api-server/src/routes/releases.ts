import { Router, type IRouter } from "express";
import { GetReleasesResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const GITHUB_RELEASES_URL =
  "https://api.github.com/repos/humbertobellor/dossier/releases?per_page=5";

const CACHE_TTL_MS = 5 * 60 * 1000;
const REFRESH_INTERVAL_MS = 4 * 60 * 1000;

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

let cache: CacheEntry | null = null;

async function fetchAndUpdateCache(): Promise<void> {
  const now = Date.now();

  let upstream: Response;
  try {
    upstream = await fetch(GITHUB_RELEASES_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  } catch (err) {
    logger.error({ err }, "Background cache refresh: failed to reach GitHub API");
    return;
  }

  if (!upstream.ok) {
    if (upstream.status === 404) {
      const empty: unknown[] = [];
      cache = { data: empty, expiresAt: now + CACHE_TTL_MS };
      return;
    }
    logger.error(
      { status: upstream.status },
      "Background cache refresh: GitHub API returned non-OK status",
    );
    return;
  }

  let raw: unknown;
  try {
    raw = await upstream.json();
  } catch (err) {
    logger.error({ err }, "Background cache refresh: failed to parse GitHub API response as JSON");
    return;
  }

  const result = GetReleasesResponse.safeParse(raw);
  if (!result.success) {
    logger.error(
      { issues: result.error.issues },
      "Background cache refresh: GitHub API response failed schema validation",
    );
    return;
  }

  cache = { data: result.data, expiresAt: now + CACHE_TTL_MS };
  logger.info("Background cache refresh: releases cache updated");
}

export function startReleaseCacheWarmer(): void {
  const interval = setInterval(() => {
    fetchAndUpdateCache().catch((err) => {
      logger.error({ err }, "Background cache refresh: unexpected error");
    });
  }, REFRESH_INTERVAL_MS);

  interval.unref();
  logger.info({ intervalMs: REFRESH_INTERVAL_MS }, "Releases cache warmer started");
}

router.get("/releases", async (req, res) => {
  const now = Date.now();

  if (cache) {
    if (now < cache.expiresAt) {
      req.log.debug("Serving releases from cache");
    } else {
      req.log.debug("Serving stale releases from cache; background warmer will refresh");
    }
    res.json(cache.data);
    return;
  }

  // No cache at all (cold start) — fetch live and populate the cache.
  let upstream: Response;
  try {
    upstream = await fetch(GITHUB_RELEASES_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to reach GitHub API");
    res.status(502).json({ error: "Failed to fetch releases" });
    return;
  }

  if (!upstream.ok) {
    if (upstream.status === 404) {
      const empty: unknown[] = [];
      cache = { data: empty, expiresAt: now + CACHE_TTL_MS };
      res.json(empty);
      return;
    }
    req.log.error({ status: upstream.status }, "GitHub API returned non-OK status");
    res.status(502).json({ error: "Failed to fetch releases" });
    return;
  }

  let raw: unknown;
  try {
    raw = await upstream.json();
  } catch (err) {
    req.log.error({ err }, "Failed to parse GitHub API response as JSON");
    res.status(502).json({ error: "Failed to fetch releases" });
    return;
  }

  const result = GetReleasesResponse.safeParse(raw);
  if (!result.success) {
    req.log.error({ issues: result.error.issues }, "GitHub API response failed schema validation");
    res.status(502).json({ error: "Failed to fetch releases" });
    return;
  }

  cache = { data: result.data, expiresAt: now + CACHE_TTL_MS };
  req.log.info("Fetched releases from GitHub and updated cache");
  res.json(result.data);
});

export default router;
