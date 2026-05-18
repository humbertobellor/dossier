import { readdirSync, statSync, readFileSync } from "fs";
import { resolve, join } from "path";
import { createGunzip } from "zlib";
import { pipeline } from "stream/promises";
import { createReadStream, createWriteStream } from "fs";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

const ASSETS_DIR = resolve(
  import.meta.dirname,
  "../../artifacts/humberto-bello/dist/public/assets",
);

const INITIAL_CHUNK_LIMIT_BYTES = 150 * 1024;
const INITIAL_AGGREGATE_LIMIT_BYTES = 200 * 1024;

async function gzippedSize(filePath: string): Promise<number> {
  const tmp = join(tmpdir(), `${randomUUID()}.gz`);
  const { createGzip } = await import("zlib");
  await pipeline(
    createReadStream(filePath),
    createGzip({ level: 9 }),
    createWriteStream(tmp),
  );
  const size = statSync(tmp).size;
  return size;
}

async function main() {
  let files: string[];
  try {
    files = readdirSync(ASSETS_DIR);
  } catch {
    console.error(
      `ERROR: dist directory not found at ${ASSETS_DIR}. Run the build first.`,
    );
    process.exit(1);
  }

  const jsFiles = files.filter((f) => f.endsWith(".js"));
  const lazyPrefixes = ["FadeIn-", "de-", "es-"];

  const initialChunks = jsFiles.filter(
    (f) => !lazyPrefixes.some((prefix) => f.startsWith(prefix)),
  );
  const lazyChunks = jsFiles.filter((f) =>
    lazyPrefixes.some((prefix) => f.startsWith(prefix)),
  );

  console.log("\nBundle size report");
  console.log("==================");

  let failed = false;

  console.log("\nInitial chunks (eagerly loaded):");
  for (const file of initialChunks.sort()) {
    const fullPath = join(ASSETS_DIR, file);
    const rawBytes = statSync(fullPath).size;
    const gzBytes = await gzippedSize(fullPath);
    const overLimit = gzBytes > INITIAL_CHUNK_LIMIT_BYTES;
    const marker = overLimit ? "  ✗ OVER LIMIT" : "  ✓";
    console.log(
      `  ${file}: ${(rawBytes / 1024).toFixed(1)} kB raw / ${(gzBytes / 1024).toFixed(1)} kB gzip${marker}`,
    );
    if (overLimit) failed = true;
  }

  console.log("\nLazy chunks (deferred):");
  for (const file of lazyChunks.sort()) {
    const fullPath = join(ASSETS_DIR, file);
    const rawBytes = statSync(fullPath).size;
    const gzBytes = await gzippedSize(fullPath);
    console.log(
      `  ${file}: ${(rawBytes / 1024).toFixed(1)} kB raw / ${(gzBytes / 1024).toFixed(1)} kB gzip`,
    );
  }

  let totalInitialGzip = 0;
  for (const file of initialChunks) {
    totalInitialGzip += await gzippedSize(join(ASSETS_DIR, file));
  }
  const aggregateOver = totalInitialGzip > INITIAL_AGGREGATE_LIMIT_BYTES;
  if (aggregateOver) failed = true;

  console.log(
    `\nAggregate initial JS: ${(totalInitialGzip / 1024).toFixed(1)} kB gzip` +
      ` (limit ${INITIAL_AGGREGATE_LIMIT_BYTES / 1024} kB)` +
      (aggregateOver ? "  ✗ OVER LIMIT" : "  ✓"),
  );
  console.log(
    `Per-chunk limit: each initial chunk must be ≤ ${INITIAL_CHUNK_LIMIT_BYTES / 1024} kB gzip`,
  );

  if (failed) {
    console.error(
      "\nFAIL: bundle size limit exceeded. Investigate with ANALYZE=1 pnpm build.\n",
    );
    process.exit(1);
  }

  console.log("\nPASS: all size limits satisfied.\n");
}

main();
