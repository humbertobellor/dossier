import { execSync } from "node:child_process";

const OWNER = "humbertobellor";
const REPO = "dossier";
const BRANCH = "main";
const REPO_URL = `https://github.com/${OWNER}/${REPO}.git`;
const API_BASE = "https://api.github.com";

function run(cmd: string, opts: { redact?: string } = {}): string {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch (err: unknown) {
    const raw =
      err instanceof Error
        ? ((err as NodeJS.ErrnoException & { stderr?: string }).stderr ?? err.message)
        : String(err);
    const msg = opts.redact ? raw.replaceAll(opts.redact, "***") : raw;
    throw new Error(msg);
  }
}

async function getRemoteHead(token: string): Promise<string | null> {
  const url = `${API_BASE}/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { object?: { sha?: string } };
  return data.object?.sha ?? null;
}

function buildTagName(sha: string, commitDate: string): string {
  const shortSha = sha.slice(0, 7);
  return `v${commitDate}-${shortSha}`;
}

async function tagRefExists(token: string, tag: string): Promise<boolean> {
  const res = await fetch(
    `${API_BASE}/repos/${OWNER}/${REPO}/git/ref/tags/${encodeURIComponent(tag)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (res.ok) return true;
  if (res.status === 404) return false;
  throw new Error(`GitHub API error checking tag ref ${res.status}: ${await res.text()}`);
}

async function findExistingReleaseForCommit(
  token: string,
  sha: string,
): Promise<{ url: string; name: string } | null> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  for (let page = 1; ; page++) {
    const res = await fetch(
      `${API_BASE}/repos/${OWNER}/${REPO}/releases?per_page=100&page=${page}`,
      { headers },
    );
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`GitHub API error listing releases ${res.status}: ${await res.text()}`);
    }
    const releases = (await res.json()) as Array<{
      target_commitish?: string;
      html_url?: string;
      name?: string;
      tag_name?: string;
    }>;
    if (releases.length === 0) break;
    const match = releases.find((r) => r.target_commitish === sha);
    if (match) {
      return {
        url: match.html_url ?? `https://github.com/${OWNER}/${REPO}/releases`,
        name: match.name ?? match.tag_name ?? sha.slice(0, 7),
      };
    }
    if (releases.length < 100) break;
  }
  return null;
}

async function createTagAndRelease(
  token: string,
  tag: string,
  sha: string,
  commitDate: string,
): Promise<{ url: string; created: boolean }> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  const tagExists = await tagRefExists(token, tag);

  if (!tagExists) {
    const tagObjRes = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/git/tags`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        tag,
        message: `Release ${tag} — automated Replit push on ${commitDate}`,
        object: sha,
        type: "commit",
      }),
    });

    if (!tagObjRes.ok) {
      throw new Error(
        `GitHub API error creating tag object ${tagObjRes.status}: ${await tagObjRes.text()}`,
      );
    }

    const tagObj = (await tagObjRes.json()) as { sha?: string };
    const tagSha = tagObj.sha;
    if (!tagSha) throw new Error("GitHub API returned no SHA for tag object");

    const refRes = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/git/refs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ref: `refs/tags/${tag}`, sha: tagSha }),
    });

    if (!refRes.ok) {
      throw new Error(
        `GitHub API error creating tag ref ${refRes.status}: ${await refRes.text()}`,
      );
    }
  }

  const releaseRes = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/releases`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      tag_name: tag,
      target_commitish: sha,
      name: tag,
      body: `Automated release from Replit push on ${commitDate}.\n\nCommit: \`${sha}\``,
      draft: false,
      prerelease: false,
    }),
  });

  if (releaseRes.status === 422) {
    const existingRes = await fetch(
      `${API_BASE}/repos/${OWNER}/${REPO}/releases/tags/${encodeURIComponent(tag)}`,
      { headers },
    );
    if (existingRes.ok) {
      const existing = (await existingRes.json()) as { html_url?: string };
      return {
        url: existing.html_url ?? `https://github.com/${OWNER}/${REPO}/releases`,
        created: false,
      };
    }
  }

  if (!releaseRes.ok) {
    throw new Error(
      `GitHub API error creating release ${releaseRes.status}: ${await releaseRes.text()}`,
    );
  }

  const releaseData = (await releaseRes.json()) as { html_url?: string };
  return {
    url: releaseData.html_url ?? `https://github.com/${OWNER}/${REPO}/releases`,
    created: true,
  };
}

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("ERROR: GITHUB_TOKEN environment variable is not set.");
  console.error("Add it via Replit Secrets (Settings → Secrets) with the 'repo' scope.");
  process.exit(1);
}

let headSha: string;
try {
  headSha = run("git rev-parse HEAD");
} catch (err) {
  console.error(
    "ERROR: Could not read HEAD commit SHA:",
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
}

let commitDate: string;
try {
  commitDate = run("git log -1 --format=%cd --date=format:%Y.%m.%d HEAD");
} catch {
  const now = new Date();
  commitDate = `${now.getUTCFullYear()}.${String(now.getUTCMonth() + 1).padStart(2, "0")}.${String(now.getUTCDate()).padStart(2, "0")}`;
}

console.log(`Checking ${REPO_URL} ...`);

let remoteSha: string | null;
try {
  remoteSha = await getRemoteHead(token);
} catch (err) {
  console.error(
    "ERROR: Could not query GitHub API:",
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
}

if (remoteSha === headSha) {
  console.log(`  Already up-to-date. GitHub is at ${headSha}`);
} else {
  console.log(`  local : ${headSha}`);
  console.log(`  remote: ${remoteSha ?? "(branch not found)"}`);
  console.log(`Pushing ${BRANCH} → ${REPO_URL}`);

  const authenticatedUrl = `https://x-access-token:${token}@github.com/${OWNER}/${REPO}.git`;

  try {
    run(`git push ${authenticatedUrl} ${BRANCH}:${BRANCH}`, { redact: token });
  } catch (err) {
    const msg = (err instanceof Error ? err.message : String(err)).replaceAll(token, "***");
    console.error("ERROR: Push failed.");
    console.error(msg);
    console.error("\nCommon causes:");
    console.error("  • GITHUB_TOKEN lacks the 'repo' scope");
    console.error(
      "  • The remote branch has commits not present locally (need to pull first)",
    );
    console.error("  • Network error — retry in a moment");
    process.exit(1);
  }

  console.log(`\n✓ Pushed commit ${headSha} to ${REPO_URL}`);
}

console.log(`\nChecking for an existing release on commit ${headSha.slice(0, 7)} ...`);

let existingReleaseUrl: { url: string; name: string } | null;
try {
  existingReleaseUrl = await findExistingReleaseForCommit(token, headSha);
} catch (err) {
  console.error(
    "ERROR: Could not query existing releases:",
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
}

if (existingReleaseUrl !== null) {
  console.log(
    `✓ Release already exists for this commit: ${existingReleaseUrl.name} — ${existingReleaseUrl.url}`,
  );
} else {
  const tag = buildTagName(headSha, commitDate);
  console.log(`  No existing release found. Creating release ${tag} ...`);

  let release: { url: string; created: boolean };
  try {
    release = await createTagAndRelease(token, tag, headSha, commitDate);
  } catch (err) {
    console.error(
      "ERROR: Could not create release:",
      err instanceof Error ? err.message : err,
    );
    process.exit(1);
  }

  if (release.created) {
    console.log(`✓ Release created: ${release.url}`);
  } else {
    console.log(`✓ Release already exists: ${release.url}`);
  }
}
