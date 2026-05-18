import { execSync } from "node:child_process";

const OWNER = "humbertobellor";
const REPO = "dossier";
const BRANCH = "main";
const REPO_URL = `https://github.com/${OWNER}/${REPO}.git`;
const API_BASE = "https://api.github.com";

/**
 * Pass --push (or PUSH_TO_GITHUB=1) to actually perform the push.
 * Without an explicit opt-in the script exits 0 so that automated
 * callers (e.g. the Project parallel runner) are always harmless.
 */
const PUSH_ENABLED =
  process.argv.includes("--push") || process.env["PUSH_TO_GITHUB"] === "1";

if (!PUSH_ENABLED) {
  console.log("Push to GitHub — opt-in required.");
  console.log("");
  console.log("Run one of the following to actually push:");
  console.log(
    "  pnpm --filter @workspace/scripts run push-now",
  );
  console.log(
    "  PUSH_TO_GITHUB=1 pnpm --filter @workspace/scripts run push-to-github",
  );
  process.exit(0);
}

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
  console.log(`✓ Already up-to-date. GitHub is at ${headSha}`);
  process.exit(0);
}

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
