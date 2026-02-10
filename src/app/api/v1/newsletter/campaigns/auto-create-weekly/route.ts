import { NextRequest } from "next/server";
import { requireAuth } from "@/services/auth";
import { createWeeklyNewsCampaignIssue } from "@/services/newsletter";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "admin:write");
  if (auth instanceof Response) return auth;

  let body: {
    periodDays?: number;
    createdBy?: string;
    scheduledAt?: string;
  };

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const result = await createWeeklyNewsCampaignIssue({
    periodDays: body.periodDays,
    createdBy: body.createdBy,
    scheduledAt: body.scheduledAt,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ data: result.data }, { status: result.data.created ? 201 : 200 });
}
