import { describe, expect, test } from "bun:test";
import type { Candidate } from "@/data/candidates";
import {
	buildCandidateSearchIndex,
	filterCandidates,
	getCandidateLocationParts,
	type CandidateFilters,
} from "@/lib/candidate-filters";

const make = (over: Partial<Candidate>): Candidate =>
	({
		id: "x",
		name: "Name",
		title: "Engineer",
		bio: "bio",
		location: "Berlin",
		availability: "looking",
		visibility: "public",
		...over,
	}) as Candidate;

const candidates = [
	make({ id: "a", name: "Zelda", location: "Remote / Berlin", skills: ["rust" as never] }),
	make({ id: "b", name: "Bob", availability: "not-looking", experience: "5-10" as never }),
	make({ id: "c", visibility: "anonymous", anonymousAlias: "Phantom", location: "Canada (Toronto)" }),
];
const base: CandidateFilters = {
	availability: "active",
	experience: "all",
	role: "all",
	location: "all",
	tags: [],
	query: "",
};
const ids = (f: Partial<CandidateFilters>) =>
	filterCandidates(candidates, { ...base, ...f }, buildCandidateSearchIndex(candidates)).map((c) => c.id);

describe("candidate filters", () => {
	test("splits locations", () => {
		expect(getCandidateLocationParts("Remote / Berlin")).toEqual(["Remote", "Berlin"]);
		expect(getCandidateLocationParts("Canada (Toronto)")).toEqual(["Canada", "Toronto"]);
	});
	test("active hides not-looking, all keeps them", () => {
		expect(ids({})).toEqual(["a", "c"]);
		expect(ids({ availability: "all" })).toEqual(["a", "b", "c"]);
	});
	test("location, tags and search", () => {
		expect(ids({ location: "Toronto" })).toEqual(["c"]);
		expect(ids({ tags: ["rust" as never] })).toEqual(["a"]);
		expect(ids({ query: "phantom" })).toEqual(["c"]);
		expect(ids({ query: "zelda" })).toEqual(["a"]);
	});
});
