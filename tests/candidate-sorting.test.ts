import { describe, expect, test } from "bun:test";
import type { Candidate, SkillTag } from "../src/data/candidates";
import { sortCandidatesByVisibilityPriority } from "../src/lib/candidate-sorting";

function candidate(
  id: string,
  overrides: Partial<Candidate> = {}
): Candidate {
  return {
    id,
    visibility: "public",
    name: id,
    title: "",
    bio: "",
    skills: [],
    location: "",
    remote: true,
    experience: "3-5",
    availability: "looking",
    preferredRoles: [],
    tier: 2,
    featured: false,
    ...overrides,
  };
}

const hasTopTag = (candidate: Candidate) =>
  candidate.skills.includes("top" as SkillTag);

describe("sortCandidatesByVisibilityPriority", () => {
  test("puts non-featured hot candidates below featured candidates and above non-hot candidates", () => {
    const candidates = [
      candidate("verified", { vouched: true }),
      candidate("featured", { featured: true }),
      candidate("hot", { skills: ["hot" as SkillTag] }),
      candidate("unverified"),
    ];

    const sorted = sortCandidatesByVisibilityPriority(candidates, {
      filterKey: "test",
      isHotCandidate: (candidate) => candidate.skills.includes("hot" as SkillTag),
      hasTopTag,
    });

    expect(sorted.map((candidate) => candidate.id)).toEqual([
      "featured",
      "hot",
      "verified",
      "unverified",
    ]);
  });

  test("uses the same analytics-hot predicate that drives the HOT badge", () => {
    const candidates = [
      candidate("featured", { featured: true }),
      candidate("analytics-hot"),
      candidate("verified", { vouched: true }),
    ];

    const sorted = sortCandidatesByVisibilityPriority(candidates, {
      filterKey: "test",
      isHotCandidate: (candidate) => candidate.id === "analytics-hot",
      hasTopTag,
    });

    expect(sorted.map((candidate) => candidate.id)).toEqual([
      "featured",
      "analytics-hot",
      "verified",
    ]);
  });

  test("puts featured hot candidates ahead of featured non-hot candidates", () => {
    const candidates = [
      candidate("featured", { featured: true }),
      candidate("featured-hot", {
        featured: true,
        skills: ["hot" as SkillTag],
      }),
      candidate("hot", { skills: ["hot" as SkillTag] }),
    ];

    const sorted = sortCandidatesByVisibilityPriority(candidates, {
      filterKey: "test",
      isHotCandidate: (candidate) => candidate.skills.includes("hot" as SkillTag),
      hasTopTag,
    });

    expect(sorted.map((candidate) => candidate.id)).toEqual([
      "featured-hot",
      "featured",
      "hot",
    ]);
  });
});
