import { getPreferenceContext, updatePreferencesByToken } from "@/services/newsletter";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 400 });
  }

  const result = await getPreferenceContext(token);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result.data);
}

export async function PUT(request: Request) {
  let body: { token?: string; newsletterTypes?: string[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.token) {
    return Response.json({ error: "Missing token" }, { status: 400 });
  }

  const result = await updatePreferencesByToken(body.token, body.newsletterTypes || []);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ ok: true });
}
