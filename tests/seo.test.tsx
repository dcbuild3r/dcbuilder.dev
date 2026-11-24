import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { blogPostingJsonLd, JsonLd, jobPostingJsonLd, pageMetadata, personJsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

describe("pageMetadata", () => {
	test("sets canonical and page-specific og/twitter", () => {
		const m = pageMetadata({ title: "About", description: "d", path: "/about" });
		expect(m.alternates?.canonical).toBe(`${SITE_URL}/about`);
		expect((m.openGraph as { title: string }).title).toBe("About");
		expect((m.twitter as { title: string }).title).toBe("About");
		expect(m.openGraph).toHaveProperty("images", [`${SITE_URL}/about/opengraph-image`]);
	});
	test("article type carries publishedTime; noindex sets robots", () => {
		const m = pageMetadata({ title: "T", path: "/blog/x", type: "article", publishedTime: "2026-01-01", noindex: true });
		expect(m.openGraph).toMatchObject({ type: "article", publishedTime: "2026-01-01" });
		expect(m.robots).toMatchObject({ index: false });
	});
	test("home canonical has no trailing slash", () => {
		expect(pageMetadata({ title: "t", path: "/" }).alternates?.canonical).toBe(SITE_URL);
	});
});

describe("json-ld", () => {
	test("blog posting", () => {
		const j = blogPostingJsonLd({ slug: "a", title: "A", date: "2026-01-02" });
		expect(j["@type"]).toBe("BlogPosting");
		expect(j.url).toBe(`${SITE_URL}/blog/a`);
	});
	test("job posting requires a description", () => {
		const base = { id: "1", title: "Eng", company: "Co", createdAt: new Date("2026-01-01") };
		expect(jobPostingJsonLd(base)).toBeNull();
		const j = jobPostingJsonLd({ ...base, description: "Build", remote: "Remote", type: "Full-time" });
		expect(j).toMatchObject({ jobLocationType: "TELECOMMUTE", employmentType: "FULL_TIME", directApply: false });
	});
	test("person graph", () => {
		expect(personJsonLd()["@graph"].map((n) => n["@type"])).toEqual(["Person", "WebSite"]);
	});
	test("JsonLd escapes <", () => {
		const html = renderToStaticMarkup(<JsonLd data={{ a: "</script><b>" }} />);
		expect(html).not.toContain("</script><b>");
		expect(html).toContain("\\u003c/script>");
	});
});
