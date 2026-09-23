import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";

const SITE_ORIGIN = "https://dcbuilder.dev";
const upstream = new URL(process.env.DCBUILDER_PUBLIC_API_ORIGIN ?? SITE_ORIGIN);
if (upstream.origin !== SITE_ORIGIN && !(process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(upstream.hostname))) {
  throw new Error("DCBUILDER_PUBLIC_API_ORIGIN must be https://dcbuilder.dev");
}
const API_URL = new URL("/api/public/mcp", upstream);
const PORT = Number(process.env.PORT ?? 3088);
const MCP_HOST = process.env.MCP_PUBLIC_HOST ?? "mcp.dcbuilder.dev";
const windows = new Map<string, { count: number; reset: number }>();

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }], structuredContent: data as Record<string, unknown> };
}

async function publicData(params: Record<string, unknown>) {
  const url = new URL(API_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) value.forEach((item) => url.searchParams.append(key === "categories" ? "category" : "tag", String(item)));
    else url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(15_000) });
  const body = await response.json().catch(() => ({ error: "Invalid upstream response" }));
  if (!response.ok) throw new Error(response.status === 404 ? "Public item not found" : "Public content is temporarily unavailable");
  return body;
}

function makeServer() {
  const server = new McpServer({ name: "dcbuilder.dev public", version: "1.0.0" });
  const readOnly = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };

  server.registerTool("get_site_page", {
    description: "Read the public dcbuilder.dev Home or About page, including current About affiliations and canonical source URL.",
    inputSchema: { page: z.enum(["home", "about"]) }, annotations: readOnly,
  }, async ({ page }) => toolResult(await publicData({ page })));

  server.registerTool("get_public_item", {
    description: "Read one public news item, full published blog post, candidate profile, portfolio investment, or job by its ID. Use search tools to find IDs first.",
    inputSchema: { collection: z.enum(["news", "blog", "candidates", "portfolio", "jobs"]), id: z.string().min(1).max(200) }, annotations: readOnly,
  }, async ({ collection, id }) => toolResult(await publicData({ collection, id })));

  const page = { limit: z.number().int().min(1).max(50).optional().describe("Results per page, maximum 50"), offset: z.number().int().min(0).max(10000).optional().describe("Number of results to skip") };
  server.registerTool("search_news", {
    description: "Search public news, including curated links, published blog entries, and announcements. Results include dates, relevance, source links, and canonical URLs.",
    inputSchema: { q: z.string().optional(), company: z.string().optional(), category: z.string().optional(), type: z.enum(["curated", "blog", "announcement", "portfolio"]).optional(), hidePortfolioUpdates: z.boolean().optional(), minRelevance: z.number().min(0).max(10).optional(), since: z.string().optional().describe("Earliest date, YYYY-MM-DD"), sort: z.enum(["newest", "posted", "relevance"]).optional(), ...page }, annotations: readOnly,
  }, async (args) => toolResult(await publicData({ collection: "news", ...args })));

  server.registerTool("search_blog", {
    description: "Search published blog posts by title, description, or source. Use get_public_item with collection blog for full article text.",
    inputSchema: { q: z.string().optional(), source: z.string().optional(), minRelevance: z.number().min(0).max(10).optional(), since: z.string().optional(), sort: z.enum(["newest", "relevance", "alphabetical"]).optional(), ...page }, annotations: readOnly,
  }, async (args) => toolResult(await publicData({ collection: "blog", ...args })));

  server.registerTool("search_candidates", {
    description: "Search publicly displayed candidate profiles by name, title, skills, location, experience, and availability. Contact details only appear when displayed on the public site.",
    inputSchema: { q: z.string().optional(), location: z.string().optional(), availability: z.enum(["looking", "open", "not-looking", "active"]).optional(), experience: z.string().optional(), tags: z.array(z.string()).optional().describe("Skills; candidate must have every requested skill"), featured: z.boolean().optional(), ...page }, annotations: readOnly,
  }, async (args) => toolResult(await publicData({ collection: "candidates", ...args })));

  server.registerTool("search_portfolio", {
    description: "Search the public investment portfolio by company, category, status, featured status, or current job openings.",
    inputSchema: { q: z.string().optional(), category: z.string().optional(), categories: z.array(z.string()).optional().describe("Match any selected portfolio category"), status: z.string().optional(), featured: z.boolean().optional(), hiring: z.boolean().optional(), main: z.boolean().optional().describe("Only investments in tiers 1 through 3"), sort: z.enum(["alphabetical", "relevance"]).optional(), ...page }, annotations: readOnly,
  }, async (args) => toolResult(await publicData({ collection: "portfolio", ...args })));

  server.registerTool("search_jobs", {
    description: "Search public jobs by title, company, role or department, location, remote status, and tags. Results include the original application URL.",
    inputSchema: { q: z.string().optional(), company: z.string().optional(), type: z.enum(["portfolio", "network"]).optional().describe("Company relationship type"), role: z.string().optional(), location: z.string().optional(), remote: z.boolean().optional(), featured: z.boolean().optional(), tags: z.array(z.string()).optional().describe("Job must have every requested tag"), ...page }, annotations: readOnly,
  }, async (args) => toolResult(await publicData({ collection: "jobs", ...args })));
  return server;
}

function allowRequest(request: Request) {
  const host = request.headers.get("host")?.split(":")[0];
  if (host !== MCP_HOST && host !== "localhost" && host !== "127.0.0.1") return new Response("Invalid host", { status: 403 });
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const key = forwarded || "local";
  const now = Date.now();
  const window = windows.get(key);
  if (!window || now > window.reset) windows.set(key, { count: 1, reset: now + 60_000 });
  else if (++window.count > 120) return new Response("Rate limit exceeded", { status: 429 });
  if (windows.size > 5000) for (const [ip, entry] of windows) if (entry.reset < now) windows.delete(ip);
  return null;
}

function withPublicCors(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID");
  headers.set("Access-Control-Expose-Headers", "MCP-Session-Id");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export const app = Bun.serve({
  hostname: process.env.HOST ?? "127.0.0.1",
  port: PORT,
  maxRequestBodySize: 64 * 1024,
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === "/healthz") return Response.json({ status: "ok" });
    if (path !== "/mcp") return new Response("Not found", { status: 404 });
    const denied = allowRequest(request);
    if (denied) return withPublicCors(denied);
    if (request.method === "OPTIONS") return withPublicCors(new Response(null, { status: 204 }));
    if (request.method !== "POST" && request.method !== "GET" && request.method !== "DELETE") return withPublicCors(new Response("Method not allowed", { status: 405 }));
    const server = makeServer();
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    await server.connect(transport);
    return withPublicCors(await transport.handleRequest(request));
  },
});

console.info(`Public MCP listening on ${app.hostname}:${app.port}`);
