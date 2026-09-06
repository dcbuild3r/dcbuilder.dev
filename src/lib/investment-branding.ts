import { R2_PUBLIC_URL } from "@/services/r2";

interface InvestmentLogoVariants {
  light: string;
  dark?: string;
}

const THEMED_INVESTMENT_LOGOS: Record<string, InvestmentLogoVariants> = {
  sealgate: {
    light: `${R2_PUBLIC_URL}/investments/sealgate-light.png`,
    dark: `${R2_PUBLIC_URL}/investments/sealgate-dark.png`,
  },
};

export function getInvestmentLogoVariants(
  title: string,
  fallbackLogo: string | null
): InvestmentLogoVariants | null {
  const themedLogos = THEMED_INVESTMENT_LOGOS[title.trim().toLowerCase()];
  if (themedLogos) return themedLogos;
  if (!fallbackLogo) return null;

  return { light: fallbackLogo };
}
