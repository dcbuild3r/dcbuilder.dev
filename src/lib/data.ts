import { db } from "@/db";
import { jobs as jobsTable, candidates as candidatesTable, curatedLinks as curatedLinksTable } from "@/db/schema";
import { desc } from "drizzle-orm";
import type { Job, Company, RelationshipCategory, JobTag, JobTier } from "@/data/jobs";
import type {
  Candidate,
  VisibilityMode,
  SkillTag,
  ExperienceLevel,
  AvailabilityStatus,
  RoleType,
  CandidateTier,
} from "@/data/candidates";
import type { CuratedLink } from "@/data/news";

// Fetch all jobs from database and transform to component format
export async function getJobsFromDB(): Promise<Job[]> {
  const dbJobs = await db.select().from(jobsTable).orderBy(desc(jobsTable.createdAt));

  return dbJobs.map((job) => {
    const company: Company = {
      name: job.company,
      logo: job.companyLogo || undefined,
      website: job.companyWebsite || "",
      category: job.category as RelationshipCategory,
      x: job.companyX || undefined,
      github: job.companyGithub || undefined,
    };

    return {
      id: job.id,
      title: job.title,
      company,
      location: job.location || "",
      remote: job.remote === "Remote",
      type: job.type as Job["type"],
      department: job.department || undefined,
      salary: job.salary || undefined,
      link: job.link,
      featured: job.featured || false,
      tags: (job.tags || []) as JobTag[],
      tier: 3 as JobTier, // Default tier
      description: job.description || undefined,
      createdAt: job.createdAt,
    };
  });
}

// Fetch all candidates from database and transform to component format
export async function getCandidatesFromDB(): Promise<Candidate[]> {
  const dbCandidates = await db.select().from(candidatesTable).orderBy(desc(candidatesTable.createdAt));

  return dbCandidates.map((candidate) => ({
    id: candidate.id,
    visibility: "public" as VisibilityMode,
    name: candidate.name,
    title: candidate.title || "",
    bio: candidate.summary || "",
    profileImage: candidate.image || undefined,
    skills: (candidate.skills || []) as SkillTag[],
    location: candidate.location || "",
    remote: true,
    experience: (candidate.experience || "3-5") as ExperienceLevel,
    availability: (candidate.availability || "looking") as AvailabilityStatus,
    preferredRoles: [],
    lookingFor: [] as RoleType[],
    socials: {
      x: candidate.x || undefined,
      github: candidate.github || undefined,
      linkedin: candidate.linkedin || undefined,
      email: candidate.email || undefined,
      website: candidate.website || undefined,
      telegram: candidate.telegram || undefined,
      cv: candidate.cv || undefined,
    },
    tier: 2 as CandidateTier,
    featured: candidate.featured || false,
    createdAt: candidate.createdAt,
  }));
}

// Fetch curated links from database
export async function getCuratedLinksFromDB(): Promise<CuratedLink[]> {
  const dbLinks = await db.select().from(curatedLinksTable).orderBy(desc(curatedLinksTable.date));

  return dbLinks.map((link) => ({
    id: link.id,
    type: "curated" as const,
    title: link.title,
    url: link.url,
    source: link.source,
    date: link.date.toISOString().split("T")[0],
    description: link.description || undefined,
    category: link.category as CuratedLink["category"],
    featured: link.featured || false,
  }));
}
