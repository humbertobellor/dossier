/**
 * check-fonts.ts
 *
 * Repo-wide validation of font files. For every artifact under artifacts/ that
 * contains a public/fonts/ directory the script:
 *
 *   1. Scans all CSS files under that artifact's src/ directory (recursively).
 *   2. Confirms every local url('/fonts/...') reference resolves to a file on
 *      disk in public/fonts/.
 *   3. Confirms every file in public/fonts/ is referenced by at least one
 *      local url('/fonts/...') across the artifact's CSS files.
 *   4. Rejects any non-woff2 font format (ttf, otf, eot, woff, svg) found in
 *      public/fonts/ — those are legacy formats that should not ship.
 *
 * Remote URLs (http/https) in CSS src: are intentionally ignored.
 * The dist/ and node_modules/ directories are never scanned.
 *
 * When called with file path arguments (e.g. by lint-staged), only the
 * artifacts that contain those files are checked. When called with no
 * arguments, all artifacts with a public/fonts/ directory are checked.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const artifactsDir = resolve(repoRoot, "artifacts");

const LEGACY_FONT_EXTENSIONS = new Set([".ttf", ".otf", ".eot", ".woff", ".svg"]);
const SKIP_DIRS = new Set(["dist", "node_modules", ".git"]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function collectCssFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectCssFiles(full));
    } else if (entry.endsWith(".css")) {
      results.push(full);
    }
  }
  return results;
}

function rel(p: string): string {
  return p.replace(repoRoot + "/", "");
}

// ---------------------------------------------------------------------------
// 1. Determine which artifacts to check
// ---------------------------------------------------------------------------

// lint-staged passes staged file paths as CLI arguments.
// When arguments are present, scope the check to only the affected artifacts.
const stagedFiles = process.argv.slice(2);

let artifactNames: string[];

if (stagedFiles.length > 0) {
  const allArtifactNames = readdirSync(artifactsDir).filter((name) =>
    statSync(join(artifactsDir, name)).isDirectory()
  );

  const affectedArtifacts = new Set<string>();
  for (const file of stagedFiles) {
    const absFile = resolve(repoRoot, file);
    for (const name of allArtifactNames) {
      const artifactPath = join(artifactsDir, name);
      if (absFile.startsWith(artifactPath + "/")) {
        affectedArtifacts.add(name);
      }
    }
  }

  // Only validate affected artifacts that actually have a public/fonts/ dir
  artifactNames = [...affectedArtifacts].filter((name) =>
    existsSync(join(artifactsDir, name, "public", "fonts"))
  );

  if (artifactNames.length === 0) {
    console.log("[check-fonts] No artifacts with public/fonts/ affected by staged files — skipping.");
    process.exit(0);
  }
} else {
  // No arguments: full scan across all artifacts (CI / manual use)
  artifactNames = readdirSync(artifactsDir).filter((name) => {
    const fontsDir = join(artifactsDir, name, "public", "fonts");
    return statSync(join(artifactsDir, name)).isDirectory() && existsSync(fontsDir);
  });

  if (artifactNames.length === 0) {
    console.log("[check-fonts] No artifacts with public/fonts/ found — nothing to check.");
    process.exit(0);
  }
}

// ---------------------------------------------------------------------------
// 2. Validate each artifact independently
// ---------------------------------------------------------------------------
let overallFailed = false;

for (const artifactName of artifactNames) {
  const fontsDir = join(artifactsDir, artifactName, "public", "fonts");
  const srcDir = join(artifactsDir, artifactName, "src");

  console.log(`\n[check-fonts] Artifact: ${artifactName}`);

  // Collect CSS files
  const cssFiles = collectCssFiles(srcDir);
  if (cssFiles.length === 0) {
    console.error(
      `[check-fonts] ERROR: public/fonts/ exists but no CSS files found under ${rel(srcDir)}`
    );
    overallFailed = true;
    continue;
  }

  console.log(`  Scanning ${cssFiles.length} CSS file(s):`);
  for (const f of cssFiles) {
    console.log(`    ${rel(f)}`);
  }

  // Parse local /fonts/... references from all CSS files
  const URL_RE = /url\(\s*(['"]?)([^)'"]+)\1\s*\)/g;
  const referencedFiles = new Set<string>();

  for (const cssFile of cssFiles) {
    const css = readFileSync(cssFile, "utf8");
    URL_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = URL_RE.exec(css)) !== null) {
      const href = match[2].trim();
      if (href.startsWith("http://") || href.startsWith("https://")) continue;
      const fontMatch = href.match(/^\/fonts\/(.+)$/);
      if (fontMatch) {
        referencedFiles.add(fontMatch[1]);
      }
    }
  }

  // Read files on disk
  const diskFiles = new Set<string>(readdirSync(fontsDir));

  // Check for legacy formats
  const legacyFiles: string[] = [];
  for (const file of diskFiles) {
    const ext = file.slice(file.lastIndexOf(".")).toLowerCase();
    if (LEGACY_FONT_EXTENSIONS.has(ext)) {
      legacyFiles.push(file);
    }
  }

  // CSS references missing from disk
  const missingFromDisk: string[] = [];
  for (const ref of referencedFiles) {
    if (!diskFiles.has(ref)) {
      missingFromDisk.push(ref);
    }
  }

  // Disk files not referenced in CSS
  const unreferencedOnDisk: string[] = [];
  for (const file of diskFiles) {
    if (!referencedFiles.has(file)) {
      unreferencedOnDisk.push(file);
    }
  }

  let artifactFailed = false;

  if (legacyFiles.length > 0) {
    console.error(
      `  ERROR: public/fonts/ contains legacy font format files (only woff2 is permitted):`
    );
    for (const f of legacyFiles.sort()) {
      console.error(`    legacy format: ${f}`);
    }
    artifactFailed = true;
  }

  if (missingFromDisk.length > 0) {
    console.error(
      `  ERROR: CSS references font files that are missing from public/fonts/:`
    );
    for (const f of missingFromDisk.sort()) {
      console.error(`    missing: ${f}`);
    }
    artifactFailed = true;
  }

  if (unreferencedOnDisk.length > 0) {
    console.error(
      `  ERROR: public/fonts/ contains files not referenced by any @font-face in the CSS:`
    );
    for (const f of unreferencedOnDisk.sort()) {
      console.error(`    unreferenced: ${f}`);
    }
    artifactFailed = true;
  }

  if (artifactFailed) {
    overallFailed = true;
  } else {
    console.log(
      `  OK — ${referencedFiles.size} reference(s) across ${cssFiles.length} CSS file(s) ` +
        `all present on disk; ${diskFiles.size} file(s) on disk all referenced; all formats are woff2.`
    );
  }
}

if (overallFailed) {
  console.error("\n[check-fonts] Fix the mismatches above, then re-run the check.\n");
  process.exit(1);
}

console.log("\n[check-fonts] All artifacts passed.");
