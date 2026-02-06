import { describe, expect, test } from "bun:test";
import {
  canonicalizeJobUrl,
  detectTermination,
  extractJobLinksFromHtml,
  type JobBoardSource,
} from "../src/lib/job-board-sync";

describe("job board sync helpers", () => {
  test("canonicalizes URLs by removing tracking params and hashes", () => {
    const canonical = canonicalizeJobUrl(
      "https://example.com/jobs/senior-engineer/?utm_source=twitter&ref=abc&lang=en#section"
    );

    expect(canonical).toBe("https://example.com/jobs/senior-engineer?lang=en");
  });

  test("extracts deduplicated job links from board HTML", () => {
    const source: JobBoardSource = {
      name: "board",
      url: "https://jobs.example.com",
      jobLinkPattern: "/positions/",
    };

    const html = `
      <main>
        <a href="/positions/backend-engineer">Backend Engineer</a>
        <a href="/positions/backend-engineer?utm_source=x">Backend Engineer duplicate</a>
        <a href="/positions/design-lead">Design Lead</a>
        <a href="/blog/company-update">Blog post</a>
      </main>
    `;

    const links = extractJobLinksFromHtml(source, html);
    expect(links).toHaveLength(2);
    expect(links.map((link) => link.link)).toEqual([
      "https://jobs.example.com/positions/backend-engineer",
      "https://jobs.example.com/positions/design-lead",
    ]);
  });

  test("detects terminated job on HTTP status codes and content markers", () => {
    expect(
      detectTermination({
        status: 404,
        jobUrl: "https://jobs.example.com/positions/backend",
        sourceUrl: "https://jobs.example.com/careers",
      })
    ).toEqual({ terminated: true, reason: "http_404" });

    expect(
      detectTermination({
        status: 200,
        bodyText: "Sorry, this position has been filled.",
        jobUrl: "https://jobs.example.com/positions/backend",
        sourceUrl: "https://jobs.example.com/careers",
      })
    ).toEqual({ terminated: true, reason: "content_marker:position has been filled" });

    expect(
      detectTermination({
        status: 200,
        bodyText: "Apply now",
        finalUrl: "https://jobs.example.com/positions/backend",
        jobUrl: "https://jobs.example.com/positions/backend",
        sourceUrl: "https://jobs.example.com/careers",
      })
    ).toEqual({ terminated: false, reason: "active" });
  });
});
