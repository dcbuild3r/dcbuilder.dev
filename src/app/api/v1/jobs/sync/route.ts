import { NextRequest } from "next/server";
import { requireAuth } from "@/services/auth";
import { syncJobBoards } from "@/services/job-board-sync";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "jobs:write");
  if (auth instanceof Response) return auth;

  let body: { dryRun?: boolean; sourceName?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const summary = await syncJobBoards({
    dryRun: Boolean(body.dryRun),
    sourceName: body.sourceName,
  });

  return Response.json(summary);
}
