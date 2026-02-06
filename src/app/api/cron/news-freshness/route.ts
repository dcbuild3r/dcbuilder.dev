import { reconcileNewsFreshness } from "@/services/news-freshness";

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

  try {
    const result = await reconcileNewsFreshness();
    console.info("[cron/news-freshness] Reconciled freshness", result);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/news-freshness] Reconcile failed", error);
    return Response.json({ error: "Failed to reconcile news freshness" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
