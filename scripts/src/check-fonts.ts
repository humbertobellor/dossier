/**
 * check-fonts.ts
 *
 * Validates that the local font files declared across all CSS files under
 * artifacts/humberto-bello/src/styles/ exactly match the files present in
 * public/fonts/.
 *
 * Rules:
 *   1. Every local url('/fonts/...') in any CSS file must have a corresponding
 *      file in public/fonts/.
 *   2. Every file in public/fonts/ must be referenced by at least one
 *      local url('/fonts/...') across all CSS files.
 *
 * Remote URLs (http/https) are intentionally ignored.
 */

import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");

const STYLES_DIR = resolve(
  repoRoot,
  "artifacts/humberto-bello/src/styles"
);
const FONTS_DIR = resolve(repoRoot, "artifacts/humberto-bello/public/fonts");

// ---------------------------------------------------------------------------
// 1. Discover all CSS files under src/styles/
// ---------------------------------------------------------------------------
const cssFiles = readdirSync(STYLES_DIR)
  .filter((f) => f.endsWith(".css"))
  .map((f) => resolve(STYLES_DIR, f));

if (cssFiles.length === 0) {
  console.error(`[check-fonts] ERROR: No CSS files found in ${STYLES_DIR}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Parse each CSS file and collect all local /fonts/... references
// ---------------------------------------------------------------------------
// Match url('...') and url("...") and url(...) — skip http/https URLs
const URL_RE = /url\(\s*(['"]?)([^)'"]+)\1\s*\)/g;
const referencedFiles = new Set<string>();

for (const cssFile of cssFiles) {
  const css = readFileSync(cssFile, "utf8");
  let match: RegExpExecArray | null;
  URL_RE.lastIndex = 0;
  while ((match = URL_RE.exec(css)) !== null) {
    const href = match[2].trim();
    if (href.startsWith("http://") || href.startsWith("https://")) continue;
    const fontMatch = href.match(/^\/fonts\/(.+)$/);
    if (fontMatch) {
      referencedFiles.add(fontMatch[1]);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Read the actual files on disk
// ---------------------------------------------------------------------------
const diskFiles = new Set<string>(readdirSync(FONTS_DIR));

// ---------------------------------------------------------------------------
// 4. Compare and report
// ---------------------------------------------------------------------------
const missingFromDisk: string[] = [];
for (const ref of referencedFiles) {
  if (!diskFiles.has(ref)) {
    missingFromDisk.push(ref);
  }
}

const unreferencedOnDisk: string[] = [];
for (const file of diskFiles) {
  if (!referencedFiles.has(file)) {
    unreferencedOnDisk.push(file);
  }
}

let failed = false;

if (missingFromDisk.length > 0) {
  console.error(
    "\n[check-fonts] ERROR: CSS references font files that are missing from public/fonts/:"
  );
  for (const f of missingFromDisk.sort()) {
    console.error(`  missing: ${f}`);
  }
  failed = true;
}

if (unreferencedOnDisk.length > 0) {
  console.error(
    "\n[check-fonts] ERROR: public/fonts/ contains files not referenced by any @font-face in the CSS:"
  );
  for (const f of unreferencedOnDisk.sort()) {
    console.error(`  unreferenced: ${f}`);
  }
  failed = true;
}

if (failed) {
  console.error(
    "\n[check-fonts] Fix the mismatches above, then re-run the check.\n"
  );
  process.exit(1);
}

console.log(
  `[check-fonts] OK — ${referencedFiles.size} font reference(s) across ` +
    `${cssFiles.length} CSS file(s) all present on disk; ` +
    `${diskFiles.size} file(s) on disk all referenced.`
);
