import { Router, type IRouter } from "express";
import { GetReleasesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const GITHUB_RELEASES_URL =
  "https://api.github.com/repos/humbertobellor/dossier/releases?per_page=5";

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

let cache: CacheEntry | null = null;

router.get("/releases", async (req, res) => {
  const now = Date.now();

  if (cache && now < cache.expiresAt) {
    req.log.debug("Serving releases from cache");
    res.json(cache.data);
    return;
  }

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
