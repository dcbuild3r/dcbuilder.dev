import { describe, expect, test } from "bun:test";
import {
	getNewsDisplayCompany,
	getNewsDisplaySource,
} from "../src/components/NewsGrid";

function portfolioCompany(title: string, sourceIsCompanyAccount = true) {
	return {
		title,
		logo: null,
		website: null,
		jobsUrl: `/jobs?company=${encodeURIComponent(title)}`,
		jobCount: 0,
		sourceIsCompanyAccount,
	};
}

describe("news grid metadata display", () => {
	test("hides exact source and portfolio company duplicates", () => {
		for (const company of ["Zenith", "Movement", "Morpho", "Inco", "Monad"]) {
			expect(
				getNewsDisplaySource({
					source: company,
					portfolioCompany: portfolioCompany(company),
				}),
			).toBeUndefined();
		}
	});

	test("hides exact duplicates even when the source mapping is not a company account", () => {
		expect(
			getNewsDisplaySource({
				source: "Monad",
				portfolioCompany: portfolioCompany("Monad", false),
			}),
		).toBeUndefined();
	});

	test("preserves non-company author names for founder posts", () => {
		expect(
			getNewsDisplaySource({
				source: "Alex Cheema",
				portfolioCompany: portfolioCompany("Exo", false),
			}),
		).toBe("Alex Cheema");
	});

	test("removes company parentheticals and repeated source tokens", () => {
		expect(
			getNewsDisplaySource({
				source: "Monad (Monad), Category Labs",
				portfolioCompany: portfolioCompany("Monad"),
			}),
		).toBe("Category Labs");
	});

	test("hides announcement company when portfolio company metadata already shows it", () => {
		expect(
			getNewsDisplayCompany({
				company: "Morpho",
				portfolioCompany: portfolioCompany("Morpho"),
			}),
		).toBeUndefined();
		expect(
			getNewsDisplayCompany({
				company: "Monad Foundation",
				portfolioCompany: portfolioCompany("Monad"),
			}),
		).toBe("Monad Foundation");
	});
});
