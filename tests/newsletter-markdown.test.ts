import { describe, expect, test } from "bun:test";
import { markdownToHtml } from "../src/services/newsletter";

describe("markdownToHtml", () => {
  test("renders starter markdown with the newsletter shell and recommended-links card styling", () => {
    const html = markdownToHtml(`## News digest

Recent highlights from the last 7 days.

- **Ethereal news weekly #14** · Weekly #14 covering the first ePBS devnet going live. · 0 views · [open](https://x.com/example/status/1)

---

### Want to read more?

**Recommended newsletters & links**

- **[The MEV Letter](https://collective.flashbots.net/tag/the-mev-letter)** — Flashbots' MEV research roundup

[Manage preferences](https://dcbuilder.dev/preferences) | [Unsubscribe](https://dcbuilder.dev/unsubscribe)`);

    expect(html).toContain("max-width:560px");
    expect(html).toContain("dcbuilder.png");
    expect(html).toContain("background:#fafafa;border-radius:12px");
    expect(html).toContain("href=\"https://x.com/example/status/1\"");
    expect(html).not.toContain(">open<");
  });
});
