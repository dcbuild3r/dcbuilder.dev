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

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendDueNewsletterCampaigns();
  return Response.json(result.data);
}

export async function GET(request: Request) {
  return POST(request);
}
