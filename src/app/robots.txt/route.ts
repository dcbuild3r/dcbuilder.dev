import { MCP_URL, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const robots = `# Public MCP (Streamable HTTP): ${MCP_URL}
# Site context and MCP tool guide: ${SITE_URL}/llms.txt

User-Agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: ${SITE_URL}/sitemap.xml
`;

  return new Response(robots, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
