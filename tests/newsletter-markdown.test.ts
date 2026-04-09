import { afterEach, describe, expect, mock, test } from "bun:test";

describe("markdownToHtml", () => {
  afterEach(() => {
    mock.restore();
  });

  test("renders starter markdown with section dividers and a padded newsletter shell", async () => {
    process.env.DATABASE_URL = "postgres://postgres:postgres@127.0.0.1:5432/dcbuilder_test";

    const { markdownToHtml } = await import(`../src/services/newsletter?newsletter-markdown-html=${Date.now()}`);
    const html = markdownToHtml(`## News digest

Recent highlights from the last 7 days.

## X Posts

- **Ethereal news weekly #14** · Weekly #14 covering the first ePBS devnet going live. · 0 views · [open](https://x.com/example/status/1)

---

### Want to read more?

**Recommended newsletters & links**

- **[The MEV Letter](https://collective.flashbots.net/tag/the-mev-letter)** — Flashbots' MEV research roundup

[Manage preferences](https://dcbuilder.dev/preferences) | [Unsubscribe](https://dcbuilder.dev/unsubscribe)`);

    expect(html).toContain("max-width:560px;margin:0 auto;padding:0 24px");
    expect(html).toContain("dcbuilder.png");
    expect(html).toContain("padding-bottom:10px;border-bottom:2px solid #171717");
    expect(html).toContain("background:#fafafa;border-radius:12px");
    expect(html).toContain("href=\"https://x.com/example/status/1\"");
    expect(html).not.toContain(">open<");
  });
});
