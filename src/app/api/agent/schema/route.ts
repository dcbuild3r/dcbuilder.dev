import { buildAgentOpenApiDocument } from "@/services/agent-api";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(buildAgentOpenApiDocument());
}
