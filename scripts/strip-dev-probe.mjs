// Post-build pruning for the H5 diagnostic probe.
//
// The probe (app/(tourist)/debug/h5/h5-probe.tsx) is dev-only: its chunk is
// loaded through a dynamic import guarded by DEV_RUNTIME, so no production
// code path ever fetches it — but the bundler emits async chunks before
// dead-code elimination runs, which still ships the file to the CDN. The
// emitted chunk is an orphan (nothing references it), so deleting the file is
// safe; this script finds it by a probe-only marker string and removes it,
// keeping every build pipeline (local, CI artifact, Docker) uniformly clean.
import { readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = "out";
// String that exists only in the probe module (its <h1>), never in the
// production SDK loader (lib/lark-h5.ts) or anywhere else.
const MARKER = "H5 login probe";

const chunksDir = join(OUT_DIR, "_next", "static", "chunks");
let removed = 0;
for (const entry of readdirSync(chunksDir)) {
  const file = join(chunksDir, entry);
  if (!statSync(file).isFile() || !entry.endsWith(".js")) continue;
  if (readFileSync(file, "utf8").includes(MARKER)) {
    rmSync(file);
    removed += 1;
    console.log(`[strip-dev-probe] removed orphaned probe chunk: ${entry}`);
  }
}
if (removed === 0) {
  console.log("[strip-dev-probe] no probe chunk found (already clean)");
}
