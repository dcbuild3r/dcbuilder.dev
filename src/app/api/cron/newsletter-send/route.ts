import { sendDueNewsletterCampaigns } from "@/services/newsletter";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) return false;

  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const headerToken = request.headers.get("x-cron-secret");
  const token = bearerToken || headerToken;

  return token === configuredSecret;
}

function getSendFailures(results: Array<{ campaignId: string; result: unknown }>) {
  return results.flatMap((entry) => {
    const result = entry.result as
      | { ok: false; error: string }
      | { ok: true; data?: { failed?: number } };

    if (!result?.ok) {
      return `${entry.campaignId}: ${result?.error || "unknown send failure"}`;
    }

    const failedRecipients = typeof result.data?.failed === "number" ? result.data.failed : 0;
    if (failedRecipients > 0) {
      return `${entry.campaignId}: ${failedRecipients} recipient(s) failed`;
    }

    return [];
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendDueNewsletterCampaigns();
  const failedCampaigns = getSendFailures(result.data.results);
  if (failedCampaigns.length > 0) {
    return Response.json(
      {
        error: `Newsletter send failures: ${failedCampaigns.join("; ")}`,
        ...result.data,
        failedCampaigns,
      },
      { status: 500 }
    );
  }

  return Response.json(result.data);
}

export async function GET(request: Request) {
  return POST(request);
}
