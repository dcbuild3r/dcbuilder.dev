import { unsubscribeByToken } from "@/services/newsletter";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 400 });
  }

  const result = await unsubscribeByToken(token);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return new Response(
    "<html><body><h2>Unsubscribed</h2><p>You will no longer receive this newsletter type.</p></body></html>",
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
