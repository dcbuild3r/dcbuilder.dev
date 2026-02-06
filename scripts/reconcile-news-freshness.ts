import { reconcileNewsFreshness } from "../src/services/news-freshness";

async function main() {
  const result = await reconcileNewsFreshness();
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

main().catch((error) => {
  console.error("[reconcile-news-freshness] Failed:", error);
  process.exit(1);
});
