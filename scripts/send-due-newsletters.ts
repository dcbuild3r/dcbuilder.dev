import { sendDueNewsletterCampaigns } from "../src/services/newsletter";

async function main() {
  const result = await sendDueNewsletterCampaigns();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("[send-due-newsletters] Failed:", error);
  process.exit(1);
});
