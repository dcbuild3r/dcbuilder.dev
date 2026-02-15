import { NextRequest } from "next/server";
import { requireAuth } from "@/services/auth";
import { listNewsletterTemplates, upsertNewsletterTemplate } from "@/services/newsletter";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "admin:read");
  if (auth instanceof Response) return auth;

  const templates = await listNewsletterTemplates();
  return Response.json({ data: templates });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request, "admin:write");
  if (auth instanceof Response) return auth;

  let body: {
    newsletterType?: string;
    subjectTemplate?: string;
    htmlTemplate?: string;
    textTemplate?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await upsertNewsletterTemplate({
    newsletterType: body.newsletterType || "",
    subjectTemplate: body.subjectTemplate || "",
    htmlTemplate: body.htmlTemplate || "",
    textTemplate: body.textTemplate || "",
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ data: result.data });
}
