import { syncJobBoards } from "../src/services/job-board-sync";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const sourceIndex = args.findIndex((arg) => arg === "--source");
  const sourceName = sourceIndex >= 0 ? args[sourceIndex + 1] : undefined;

  const summary = await syncJobBoards({ dryRun, sourceName });
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error("[sync-job-boards] Failed:", error);
  process.exit(1);
});
