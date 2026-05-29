import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderInlineNewsMarkdown } from "../src/components/news-inline-markdown";

describe("renderInlineNewsMarkdown", () => {
  test("renders bold and italic emphasis inline", () => {
    const markup = renderToStaticMarkup(
      <p>{renderInlineNewsMarkdown("**Bagel** releases *Paris 2.0*.")}</p>
    );

    expect(markup).toContain("<strong>Bagel</strong>");
    expect(markup).toContain("<em>Paris 2.0</em>");
  });

  test("leaves unmatched emphasis markers as text", () => {
    const markup = renderToStaticMarkup(
      <p>{renderInlineNewsMarkdown("This **stays literal.")}</p>
    );

    expect(markup).toContain("This **stays literal.");
  });
});
