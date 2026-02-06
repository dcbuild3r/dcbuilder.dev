import { syncJobBoards } from "@/services/job-board-sync";

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

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "true";
  const sourceName = url.searchParams.get("source") || undefined;

  const summary = await syncJobBoards({ dryRun, sourceName });
  return Response.json(summary);
}

export async function GET(request: Request) {
  return POST(request);
}
