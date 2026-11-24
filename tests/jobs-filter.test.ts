import { describe, expect, test } from "bun:test";
import type { Job } from "@/data/jobs";
import { buildSearchIndex, filterJobs, rankJobs, type JobFilters } from "@/lib/jobs-filter";

const job = (id: string, over: Partial<Job> & { name?: string; category?: string } = {}) =>
  ({
    id,
    title: `Role ${id}`,
    location: "Berlin",
    link: `https://example.com/${id}`,
    company: { name: over.name ?? `Co${id}`, category: over.category ?? "portfolio" },
    ...over,
  }) as unknown as Job;

const jobs = [
  job("1", { name: "Morpho", tags: ["hot", "rust"] as Job["tags"], featured: true }),
  job("2", { name: "Flashbots", category: "network", title: "Solidity Engineer" }),
  job("3", { name: "Morpho", tags: ["rust"] as Job["tags"] }),
  job("4", { name: "Uniswap Labs", category: "network" }),
];
const base: JobFilters = {
  category: "all", companies: ["all"], role: "all", location: "all",
  tags: [], featuredOnly: false, query: "",
};
const run = (f: Partial<JobFilters>) =>
  filterJobs(jobs, { ...base, ...f }, buildSearchIndex(jobs, (t) => t)).map((j) => j.id);

describe("jobs filter", () => {
  test("affiliation", () => {
    expect(run({ category: "network" })).toEqual(["2", "4"]);
  });
  test("tags require all, including hot", () => {
    expect(run({ tags: ["rust"] })).toEqual(["1", "3"]);
    expect(run({ tags: ["rust", "hot"] })).toEqual(["1"]);
  });
  test("search matches title and company, case-insensitive", () => {
    expect(run({ query: "solidity" })).toEqual(["2"]);
    expect(run({ query: "UNISWAP" })).toEqual(["4"]);
  });
  test("ranking is stable, hot and featured first", () => {
    const hot = (j: Job) => j.tags?.includes("hot") ?? false;
    const a = rankJobs(jobs, "k", hot).map((j) => j.id);
    expect(rankJobs(jobs, "k", hot).map((j) => j.id)).toEqual(a);
    expect(a[0]).toBe("1");
    expect(a.indexOf("3")).toBeLessThan(a.indexOf("2")); // tier 1 before tier 4/5
  });
});
