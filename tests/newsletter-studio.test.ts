import { describe, expect, test } from "bun:test";
import { canAutoRenderComposePreview } from "../src/lib/newsletter-studio";

describe("canAutoRenderComposePreview", () => {
  test("waits for the studio data load to finish before auto-rendering preview", () => {
    expect(
      canAutoRenderComposePreview({
        loading: true,
        mode: "compose",
        draft: { contentMode: "template", markdownContent: "", manualHtml: "", manualText: "" },
      })
    ).toBe(false);
    expect(
      canAutoRenderComposePreview({
        loading: false,
        mode: "compose",
        draft: { contentMode: "template", markdownContent: "", manualHtml: "", manualText: "" },
      })
    ).toBe(true);
  });

  test("does not auto-render preview outside compose mode", () => {
    expect(
      canAutoRenderComposePreview({
        loading: false,
        mode: "queue",
        draft: { contentMode: "template", markdownContent: "", manualHtml: "", manualText: "" },
      })
    ).toBe(false);
    expect(
      canAutoRenderComposePreview({
        loading: false,
        mode: "templates",
        draft: { contentMode: "template", markdownContent: "", manualHtml: "", manualText: "" },
      })
    ).toBe(false);
  });

  test("does not auto-render markdown preview until markdown content exists", () => {
    expect(
      canAutoRenderComposePreview({
        loading: false,
        mode: "compose",
        draft: { contentMode: "markdown", markdownContent: "", manualHtml: "", manualText: "" },
      })
    ).toBe(false);
    expect(
      canAutoRenderComposePreview({
        loading: false,
        mode: "compose",
        draft: { contentMode: "markdown", markdownContent: "## News digest", manualHtml: "", manualText: "" },
      })
    ).toBe(true);
  });

  test("does not auto-render manual preview until html and text both exist", () => {
    expect(
      canAutoRenderComposePreview({
        loading: false,
        mode: "compose",
        draft: { contentMode: "manual", markdownContent: "", manualHtml: "<p>Hello</p>", manualText: "" },
      })
    ).toBe(false);
    expect(
      canAutoRenderComposePreview({
        loading: false,
        mode: "compose",
        draft: { contentMode: "manual", markdownContent: "", manualHtml: "<p>Hello</p>", manualText: "Hello" },
      })
    ).toBe(true);
  });
});
