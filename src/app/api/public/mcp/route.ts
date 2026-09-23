import { NextRequest } from "next/server";
import { db, affiliations, investments } from "@/db";
import { getAllNews, isCompanyTimelineNewsItem } from "@/lib/news";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { getCandidatesFromDB, getJobsFromDB } from "@/lib/data";
import { HERO, SECTIONS } from "@/data/home";
import { ABOUT_BIO } from "@/data/about";
import { PUBLIC_MCP_COLLECTIONS, filterPublicMcpRecords, parsePublicMcpFilters, type PublicMcpCollection, type PublicMcpRecord } from "@/lib/public-mcp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const origin = "https://dcbuilder.dev";

function absolute(path: string) { return new URL(path, origin).toString(); }

async function list(collection: PublicMcpCollection): Promise<PublicMcpRecord[]> {
  if (collection === "news") {
    return (await getAllNews({ includeCompanyTimelineNews: true })).map((item) => ({
      id: item.id, type: item.type, title: item.title, description: item.description,
      url: absolute(item.url), date: item.date, postedAt: item.postedAt,
      category: item.category, relevance: item.relevance, featured: item.featured ?? false,
      source: item.source, company: item.company, portfolioCompany: item.portfolioCompany?.title,
      isPortfolioUpdate: isCompanyTimelineNewsItem(item),
      image: item.image ?? item.sourceImage ?? item.companyLogo,
    }));
  }
  if (collection === "blog") {
    return (await getAllPosts()).map((post) => ({ ...post, id: post.slug, url: absolute(`/blog/${post.slug}`) }));
  }
  if (collection === "candidates") {
    return (await getCandidatesFromDB()).map((candidate) => ({
      id: candidate.id, url: absolute(`/candidates?candidate=${encodeURIComponent(candidate.id)}`),
      displayName: candidate.visibility === "anonymous" ? candidate.anonymousAlias || "Anonymous" : candidate.name,
      title: candidate.title, bio: candidate.bio, location: candidate.location,
      skills: candidate.skills, experience: candidate.experience, availability: candidate.availability,
      featured: candidate.featured, image: candidate.visibility === "anonymous" ? undefined : candidate.profileImage,
      socialLinks: candidate.visibility === "anonymous" ? {} : candidate.socials,
      createdAt: candidate.createdAt,
    }));
  }
  if (collection === "portfolio") {
    const [rows, jobs] = await Promise.all([db.select().from(investments), getJobsFromDB()]);
    return rows.map((row) => ({
      id: row.id, url: absolute("/portfolio"), title: row.title,
      description: row.description, website: row.website, image: row.logo,
      tier: Number(row.tier ?? 2), status: row.status, featured: row.featured ?? false,
      categories: row.categories ?? [], hiring: jobs.some((job) => job.company.name.toLowerCase() === row.title.toLowerCase()),
      createdAt: row.createdAt,
    }));
  }
  return (await getJobsFromDB()).map((job) => ({
    id: job.id, url: absolute(`/jobs?job=${encodeURIComponent(job.id)}`), title: job.title,
    company: job.company.name, companyCategory: job.company.category, companyLogo: job.company.logo,
    location: job.location, remote: job.remote, department: job.department,
    type: job.type, salary: job.salary, tags: job.tags, featured: job.featured,
    description: job.description, applyUrl: job.link, createdAt: job.createdAt,
  }));
}

async function page(name: string) {
  if (name === "home") return {
    id: "home", title: "dcbuilder.eth", url: origin, image: absolute(HERO.image),
    sections: SECTIONS,
  };
  if (name === "about") return {
    id: "about", title: "About dcbuilder.eth", url: absolute("/about"),
    bio: ABOUT_BIO,
    affiliations: (await db.select().from(affiliations)).map((item) => ({
      title: item.title, role: item.role, dateBegin: item.dateBegin, dateEnd: item.dateEnd,
      description: item.description, website: item.website, logo: item.logo,
    })),
  };
  return null;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const pageName = params.get("page");
  const collection = params.get("collection");
  const id = params.get("id");
  try {
    if (pageName) {
      const data = await page(pageName);
      return data ? Response.json({ data }) : Response.json({ error: "Unknown page" }, { status: 404 });
    }
    if (!collection || !PUBLIC_MCP_COLLECTIONS.includes(collection as PublicMcpCollection)) {
      return Response.json({ error: "Unknown collection" }, { status: 400 });
    }
    if (id && collection === "blog") {
      const post = await getPostBySlug(id);
      return post ? Response.json({ data: { ...post, id: post.slug, url: absolute(`/blog/${post.slug}`) } }) : Response.json({ error: "Not found" }, { status: 404 });
    }
    const rows = await list(collection as PublicMcpCollection);
    if (id) {
      const record = rows.find((row) => row.id === id);
      return record ? Response.json({ data: record }) : Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(filterPublicMcpRecords(collection as PublicMcpCollection, rows, parsePublicMcpFilters(params)));
  } catch (error) {
    console.error("[public-mcp] content query failed", error);
    return Response.json({ error: "Public content temporarily unavailable" }, { status: 503 });
  }
}
