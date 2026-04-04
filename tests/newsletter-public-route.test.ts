import { afterEach, describe, expect, mock, test } from "bun:test";
import type { ReactNode } from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

describe("newsletter public archive routes", () => {
  afterEach(() => {
    mock.restore();
  });

  test("permanently redirects legacy ids to the canonical public slug", async () => {
    mock.module("@/lib/newsletter-archive", () => ({
      loadPublicNewsletterCampaign: async () => ({
        available: true,
        campaign: {
          id: "camp_123",
          publicSlug: "weekly-news-digest-2026-03-11",
          subject: "Weekly News Digest",
          previewText: "Top updates",
          newsletterType: "news",
          sentAt: new Date("2026-03-11T08:00:00.000Z"),
          renderedHtml: "<p>Body</p>",
        },
        redirectTo: "/newsletters/weekly-news-digest-2026-03-11",
      }),
    }));
    mock.module("@/components/Navbar", () => ({
      Navbar: () => createElement("nav"),
    }));
    mock.module("@/components/NewsletterIframe", () => ({
      NewsletterIframe: ({ html }: { html: string }) => createElement("iframe", { srcDoc: html }),
    }));
    mock.module("next/navigation", () => ({
      notFound: () => {
        throw new Error("NEXT_NOT_FOUND");
      },
      permanentRedirect: (url: string) => {
        throw new Error(`NEXT_REDIRECT:${url}`);
      },
    }));

    const { default: NewsletterViewPage } = await import(
      `../src/app/newsletters/[id]/page?newsletter-public-route=${Date.now()}`
    );

    await expect(
      NewsletterViewPage({ params: Promise.resolve({ id: "camp_123" }) }),
    ).rejects.toThrow("NEXT_REDIRECT:/newsletters/weekly-news-digest-2026-03-11");
  });

  test("renders the canonical public slug route without redirecting", async () => {
    mock.module("@/lib/newsletter-archive", () => ({
      loadPublicNewsletterCampaign: async () => ({
        available: true,
        campaign: {
          id: "camp_123",
          publicSlug: "weekly-news-digest-2026-03-11",
          subject: "Weekly News Digest",
          previewText: "Top updates",
          newsletterType: "news",
          sentAt: new Date("2026-03-11T08:00:00.000Z"),
          renderedHtml: "<p>Body</p>",
        },
        redirectTo: null,
      }),
    }));
    mock.module("@/components/Navbar", () => ({
      Navbar: () => createElement("nav"),
    }));
    mock.module("@/components/NewsletterIframe", () => ({
      NewsletterIframe: ({ html }: { html: string }) => createElement("iframe", { srcDoc: html }),
    }));
    mock.module("next/link", () => ({
      default: ({
        href,
        children,
        ...props
      }: {
        href: string;
        children: ReactNode;
      }) => createElement("a", { href, ...props }, children),
    }));
    mock.module("next/navigation", () => ({
      notFound: () => {
        throw new Error("NEXT_NOT_FOUND");
      },
      permanentRedirect: (url: string) => {
        throw new Error(`NEXT_REDIRECT:${url}`);
      },
    }));

    const { default: NewsletterViewPage } = await import(
      `../src/app/newsletters/[id]/page?newsletter-public-render=${Date.now()}`
    );
    const markup = renderToStaticMarkup(
      await NewsletterViewPage({
        params: Promise.resolve({ id: "weekly-news-digest-2026-03-11" }),
      }),
    );

    expect(markup).toContain("Weekly News Digest");
    expect(markup).toContain("Body");
  });
});
