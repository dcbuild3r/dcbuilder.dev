import { createWeeklyNewsCampaignIssue } from "@/services/newsletter";

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

  const result = await createWeeklyNewsCampaignIssue({
    periodDays: 7,
    createdBy: "cron:newsletter-issue-create",
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ data: result.data });
}

export async function GET(request: Request) {
  return POST(request);
}
