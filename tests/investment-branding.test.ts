import { describe, expect, test } from "bun:test";
import { getInvestmentLogoVariants } from "@/lib/investment-branding";

describe("getInvestmentLogoVariants", () => {
  test("uses Sealgate's light and dark mode logos", () => {
    expect(getInvestmentLogoVariants("Sealgate", "fallback.png")).toEqual({
      light:
        "https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/investments/sealgate-light.png",
      dark:
        "https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/investments/sealgate-dark.png",
    });
  });

  test("keeps the database logo for companies without theme variants", () => {
    expect(getInvestmentLogoVariants("Example", "example.png")).toEqual({
      light: "example.png",
    });
  });
});
