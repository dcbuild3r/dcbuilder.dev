import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import {
  buildFallbackNewsDescription,
  buildMevLetterDescriptionFromHtml,
  isGenericMevLetterDescription,
  resolveMevLetterDescription,
} from "../src/lib/news-description-style";

const mevLetterFixture = readFileSync(
  new URL("./fixtures/the-mev-letter-133.html", import.meta.url),
  "utf8"
);

describe("buildFallbackNewsDescription", () => {
  test("keeps direct event statements free of author attribution", () => {
    expect(buildFallbackNewsDescription("TBPN has been acquired by OpenAI")).toBe(
      "TBPN has been acquired by OpenAI."
    );
  });

  test("rewrites announcing titles into direct event phrasing", () => {
    expect(buildFallbackNewsDescription("Announcing ARC-AGI-3")).toBe(
      "ARC-AGI-3 is being announced."
    );
  });

  test("rewrites introducing titles into direct event phrasing", () => {
    expect(buildFallbackNewsDescription("Introducing Aztec Labs")).toBe(
      "Aztec Labs is being introduced."
    );
  });

  test("builds MEV Letter descriptions from top headliner items", () => {
    expect(
      buildMevLetterDescriptionFromHtml("The MEV Letter #133", mevLetterFixture)
    ).toBe(
      "Issue #133 covers Geographical Centralization Resilience in Ethereum’s Block-Building Paradigms, When Frontrunning is Alchemy, Economic Security of VDF-Based Randomness Beacons, and Blocks Are Dead. Long Live Blobs."
    );
  });

  test("treats the current MEV Letter placeholder as generic", () => {
    expect(
      isGenericMevLetterDescription(
        "The weekly MEV Letter summarizes the latest MEV research, discussions, and developments, with links for further reading."
      )
    ).toBe(true);
  });

  test("treats the older Flashbots issue roundup copy as generic", () => {
    expect(
      isGenericMevLetterDescription(
        "Flashbots publishes issue #131 of The MEV Letter, a weekly roundup of MEV papers, articles, threads, talks, and ecosystem resources."
      )
    ).toBe(true);
  });

  test("replaces a generic MEV Letter subtitle with extracted headliners", () => {
    expect(
      resolveMevLetterDescription({
        title: "The MEV Letter #133",
        url: "https://collective.flashbots.net/t/the-mev-letter-133/5650",
        description:
          "The weekly MEV Letter summarizes the latest MEV research, discussions, and developments, with links for further reading.",
        html: mevLetterFixture,
      })
    ).toBe(
      "Issue #133 covers Geographical Centralization Resilience in Ethereum’s Block-Building Paradigms, When Frontrunning is Alchemy, Economic Security of VDF-Based Randomness Beacons, and Blocks Are Dead. Long Live Blobs."
    );
  });
});
