import { subscribeToNewsletters } from "@/services/newsletter";

export async function POST(request: Request) {
  let body: { email?: string; newsletterTypes?: string[]; source?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await subscribeToNewsletters({
    email: body.email || "",
    newsletterTypes: body.newsletterTypes || [],
    source: body.source || "news-page",
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result);
}
