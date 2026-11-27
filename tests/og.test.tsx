import { describe, expect, test } from "bun:test";
import { renderOg, type OgSpec } from "@/lib/og";

const long = "A very long title about verifiable computation, zero knowledge proofs and distributed systems at planetary scale ".repeat(2);

const specs: Record<string, OgSpec> = {
	site: { kind: "site" },
	about: { kind: "about", title: "Dominik Clemente", description: "Research, engineering, and angel investing." },
	section: { kind: "section", title: "Writing", description: "Notes." },
	post: { kind: "post", title: long, description: long, date: "Jul 22, 2026", readingMinutes: 20 },
	job: {
		kind: "job",
		title: long,
		company: "Commonware",
		meta: ["United States", "Remote", "$250K"],
		tags: ["Rust", "Cryptography", "Distributed Systems", "Protocol", "Research"],
		badges: ["Hot", "Featured", "New"],
		affiliation: "Network",
	},
	candidate: {
		kind: "candidate",
		name: "Eric Woolsey",
		title: "Protocol Engineer",
		status: "Actively Looking",
		imageUrl: "http://127.0.0.1:1/missing.png",
		meta: ["Canada"],
		skills: ["Rust", "TypeScript"],
		badges: ["Top"],
	},
};

describe("renderOg", () => {
	for (const [name, spec] of Object.entries(specs)) {
		test(`${name} renders a PNG`, async () => {
			const res = await renderOg(spec);
			expect(res.status).toBe(200);
			expect(res.headers.get("content-type")).toBe("image/png");
			const bytes = new Uint8Array(await res.arrayBuffer());
			expect(Array.from(bytes.slice(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47]);
			if (process.env.OG_DUMP) await Bun.write(`${process.env.OG_DUMP}/${name}.png`, bytes);
		});
	}
});
