import { describe, expect, test } from "bun:test";
import { filterPublicMcpRecords, parsePublicMcpFilters } from "../src/lib/public-mcp";

describe("public MCP search", () => {
  test("applies filters before pagination", () => {
    const rows = [
      { id: "1", url: "https://dcbuilder.dev/jobs?job=1", title: "Rust engineer", company: "A", department: "Engineering", location: "Berlin", remote: false, tags: ["rust"] },
      { id: "2", url: "https://dcbuilder.dev/jobs?job=2", title: "Rust engineer", company: "B", department: "Engineering", location: "Remote", remote: true, tags: ["rust", "zk"] },
      { id: "3", url: "https://dcbuilder.dev/jobs?job=3", title: "Designer", company: "B", department: "Design", location: "Remote", remote: true, tags: [] },
    ];
    expect(filterPublicMcpRecords("jobs", rows, { q: "rust", remote: true, tags: ["rust", "zk"], limit: 1 }).data.map((item) => item.id)).toEqual(["2"]);
  });

  test("searches candidate display names rather than hidden names", () => {
    const rows = [{ id: "1", url: "https://dcbuilder.dev/candidates?candidate=1", displayName: "Anonymous", title: "Engineer", bio: "Rust", skills: ["rust"], availability: "looking" }];
    expect(filterPublicMcpRecords("candidates", rows, { q: "secret real name" }).meta.total).toBe(0);
    expect(filterPublicMcpRecords("candidates", rows, { q: "rust", availability: "active" }).meta.total).toBe(1);
  });

  test("bounds pagination and parses repeated tags", () => {
    const result = parsePublicMcpFilters(new URLSearchParams("limit=1000&offset=-1&tag=rust&tags=zk,ai"));
    expect(result).toMatchObject({ limit: 50, offset: 0, tags: ["rust", "zk", "ai"] });
  });

  test("filters news type and relevance", () => {
    const rows = [
      { id: "blog-a", url: "https://dcbuilder.dev/blog/a", title: "A", type: "blog", relevance: 8 },
      { id: "link-b", url: "https://example.com/b", title: "B", type: "curated", relevance: 3 },
    ];
    expect(filterPublicMcpRecords("news", rows, { type: "blog", minRelevance: 5 }).data.map((item) => item.id)).toEqual(["blog-a"]);
  });
});
