import { NextRequest } from "next/server";
import { db, jobs, candidates, curatedLinks, announcements } from "@/db";
import { sql } from "drizzle-orm";

// GET /api/v1/autocomplete?field=company&q=uni
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const field = searchParams.get("field");
  const query = searchParams.get("q")?.toLowerCase() || "";

  if (!field) {
    return Response.json({ error: "Missing field parameter" }, { status: 400 });
  }

  try {
    let values: string[] = [];

    switch (field) {
      // Jobs fields
      case "company": {
        const result = await db
          .selectDistinct({ value: jobs.company })
          .from(jobs)
          .where(sql`LOWER(${jobs.company}) LIKE ${`%${query}%`}`)
          .limit(20);
        values = result.map((r) => r.value).filter(Boolean);
        break;
      }
      case "location": {
        // Get from both jobs and candidates
        const jobLocations = await db
          .selectDistinct({ value: jobs.location })
          .from(jobs)
          .where(sql`${jobs.location} IS NOT NULL AND LOWER(${jobs.location}) LIKE ${`%${query}%`}`)
          .limit(20);
        const candidateLocations = await db
          .selectDistinct({ value: candidates.location })
          .from(candidates)
          .where(sql`${candidates.location} IS NOT NULL AND LOWER(${candidates.location}) LIKE ${`%${query}%`}`)
          .limit(20);
        const allLocations = new Set([
          ...jobLocations.map((r) => r.value),
          ...candidateLocations.map((r) => r.value),
        ]);
        values = Array.from(allLocations).filter(Boolean) as string[];
        break;
      }
      case "department": {
        const result = await db
          .selectDistinct({ value: jobs.department })
          .from(jobs)
          .where(sql`${jobs.department} IS NOT NULL AND LOWER(${jobs.department}) LIKE ${`%${query}%`}`)
          .limit(20);
        values = result.map((r) => r.value).filter(Boolean) as string[];
        break;
      }
      case "tags": {
        // Get all tags and filter/flatten
        const result = await db
          .select({ value: jobs.tags })
          .from(jobs)
          .where(sql`${jobs.tags} IS NOT NULL`);
        const allTags = new Set<string>();
        result.forEach((r) => {
          if (r.value && Array.isArray(r.value)) {
            r.value.forEach((tag) => {
              if (tag.toLowerCase().includes(query)) {
                allTags.add(tag);
              }
            });
          }
        });
        values = Array.from(allTags).slice(0, 20);
        break;
      }
      case "skills": {
        // Get all skills from candidates
        const result = await db
          .select({ value: candidates.skills })
          .from(candidates)
          .where(sql`${candidates.skills} IS NOT NULL`);
        const allSkills = new Set<string>();
        result.forEach((r) => {
          if (r.value && Array.isArray(r.value)) {
            r.value.forEach((skill) => {
              if (skill.toLowerCase().includes(query)) {
                allSkills.add(skill);
              }
            });
          }
        });
        values = Array.from(allSkills).slice(0, 20);
        break;
      }
      // News fields
      case "source": {
        const result = await db
          .selectDistinct({ value: curatedLinks.source })
          .from(curatedLinks)
          .where(sql`LOWER(${curatedLinks.source}) LIKE ${`%${query}%`}`)
          .limit(20);
        values = result.map((r) => r.value).filter(Boolean);
        break;
      }
      case "newsCategory": {
        // Get from both curated links and announcements
        const curatedCategories = await db
          .selectDistinct({ value: curatedLinks.category })
          .from(curatedLinks)
          .where(sql`LOWER(${curatedLinks.category}) LIKE ${`%${query}%`}`)
          .limit(20);
        const announcementCategories = await db
          .selectDistinct({ value: announcements.category })
          .from(announcements)
          .where(sql`LOWER(${announcements.category}) LIKE ${`%${query}%`}`)
          .limit(20);
        const allCategories = new Set([
          ...curatedCategories.map((r) => r.value),
          ...announcementCategories.map((r) => r.value),
        ]);
        values = Array.from(allCategories).filter(Boolean);
        break;
      }
      case "announcementCompany": {
        const result = await db
          .selectDistinct({ value: announcements.company })
          .from(announcements)
          .where(sql`LOWER(${announcements.company}) LIKE ${`%${query}%`}`)
          .limit(20);
        values = result.map((r) => r.value).filter(Boolean);
        break;
      }
      default:
        return Response.json({ error: "Unknown field" }, { status: 400 });
    }

    return Response.json({ data: values.sort() });
  } catch (error) {
    console.error("Autocomplete error:", error);
    return Response.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
