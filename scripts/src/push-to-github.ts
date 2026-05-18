import { execSync } from "node:child_process";

const REPO_URL = "https://github.com/humbertobellor/dossier.git";

function run(cmd: string, opts: { redact?: string } = {}): string {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch (err: unknown) {
    const raw = err instanceof Error ? (err as NodeJS.ErrnoException & { stderr?: string }).stderr ?? err.message : String(err);
    const msg = opts.redact ? raw.replaceAll(opts.redact, "***") : raw;
    throw new Error(msg);
  }
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
  console.error("ERROR: Could not read HEAD commit SHA:", err instanceof Error ? err.message : err);
  process.exit(1);
}

const authenticatedUrl = `https://x-access-token:${token}@github.com/humbertobellor/dossier.git`;

console.log(`Pushing main → ${REPO_URL}`);
console.log(`  HEAD: ${headSha}`);

try {
  run(`git push ${authenticatedUrl} main:main`, { redact: token });
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("ERROR: Push failed.");
  console.error(msg.replaceAll(token, "***"));
  console.error("\nCommon causes:");
  console.error("  • GITHUB_TOKEN lacks the 'repo' scope");
  console.error("  • The remote branch has commits not present locally (need to pull first)");
  console.error("  • Network error — retry in a moment");
  process.exit(1);
}

console.log(`\n✓ Pushed commit ${headSha} to ${REPO_URL}`);
