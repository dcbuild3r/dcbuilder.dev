import { describe, expect, test } from "bun:test";
import { getJobCompanyLogo } from "../src/lib/job-company-branding";

describe("job company branding", () => {
	test("uses the canonical Succinct logo even when the record has a stale URL", () => {
		expect(getJobCompanyLogo("Succinct", "https://example.com/old-logo.png")).toBe(
			"/logos/succinct.png",
		);
	});

	test("preserves stored logos for other companies", () => {
		expect(getJobCompanyLogo("Monad", "https://example.com/monad.png")).toBe(
			"https://example.com/monad.png",
		);
		expect(getJobCompanyLogo("Unknown Co", null)).toBeUndefined();
	});
});
