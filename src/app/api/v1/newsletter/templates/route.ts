import { NextRequest } from "next/server";
import { requireAuth } from "@/services/auth";
import { listNewsletterTemplates, upsertNewsletterTemplate } from "@/services/newsletter";
import {
  getNewsletterAvailabilityMeta,
  isMissingNewsletterSchemaError,
  NEWSLETTER_DB_UNAVAILABLE_ERROR,
} from "@/services/newsletter-schema";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "admin:read");
  if (auth instanceof Response) return auth;

  try {
    const templates = await listNewsletterTemplates();
    return Response.json({ data: templates });
  } catch (error) {
    console.error("[api/newsletter/templates] GET failed:", error);
    if (isMissingNewsletterSchemaError(error)) {
      return Response.json({
        data: [],
        meta: getNewsletterAvailabilityMeta(),
      });
    }
    return Response.json({ error: "Failed to load newsletter templates" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request, "admin:write");
  if (auth instanceof Response) return auth;

  let body: {
    newsletterType?: string;
    subjectTemplate?: string;
    htmlTemplate?: string;
    textTemplate?: string;
    markdownTemplate?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let result;
  try {
    result = await upsertNewsletterTemplate({
      newsletterType: body.newsletterType || "",
      subjectTemplate: body.subjectTemplate || "",
      htmlTemplate: body.htmlTemplate || "",
      textTemplate: body.textTemplate || "",
      markdownTemplate: body.markdownTemplate || "",
    });
  } catch (error) {
    console.error("[api/newsletter/templates] PUT failed:", error);
    if (isMissingNewsletterSchemaError(error)) {
      return Response.json(
        { error: NEWSLETTER_DB_UNAVAILABLE_ERROR, meta: getNewsletterAvailabilityMeta() },
        { status: 503 }
      );
    }
    return Response.json({ error: "Failed to save newsletter template" }, { status: 500 });
  }

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ data: result.data });
}
