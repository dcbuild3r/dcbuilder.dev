import { R2_PUBLIC_URL } from "@/services/r2";

interface InvestmentLogoVariants {
  light: string;
  dark?: string;
}

const THEMED_INVESTMENT_LOGOS: Record<string, InvestmentLogoVariants> = {
  unlink: {
    light: "/logos/unlink-dark.jpg",
    dark: "/logos/unlink-light.jpg",
  },
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

// Banner background per company, sampled from the edge of its logo so the logo sits full-bleed.
// shortcut: hardcoded map, a new company gets the neutral tile until added here. Move to the DB when that gets annoying.
const INVESTMENT_TILES: Record<string, string> = {
  accountable: "#000000",
  agora: "#f3f4ef",
  "aligned layer": "#0a0a0a",
  astria: "#030504",
  atoma: "#f9fafc",
  berachain: "linear-gradient(90deg, #f0a750, #ff6c01)",
  blocksense: "#2b2929",
  clique: "#4042ee",
  confetti: "#000000",
  delta: "#000000",
  dria: "#0a0a0a",
  eclipse: "#a0fea0",
  exo: "#231924",
  "fabric cryptography": "#131313",
  friend: "#f5f5f5",
  giza: "#000000",
  "happy chain": "#194495",
  herodotus: "#060d1e",
  inco: "#3673f5",
  intuition: "#0c1114",
  knox: "#ffffff",
  lighter: "#07060c",
  lucis: "#1d2120",
  mega: "#d43338",
  megaeth: "#dfd9d9",
  "mind palace": "#000000",
  mizu: "#0d1808",
  mode: "#d7ff00",
  monad: "#6e54ff",
  morpho: "#2973ff",
  movement: "#000000",
  nebra: "#ffffff",
  nillion: "#0000fe",
  octet: "#ffffff",
  onlydust: "#05051f",
  openq: "#000000",
  own: "#222222",
  phylax: "#111213",
  pimlico: "#1f0430",
  "pin ai": "#ffffff",
  pluto: "#000000",
  pragma: "#032420",
  praxis: "#000000",
  "prime intellect": "#000000",
  rhinestone: "#4f41f0",
  ritual: "#000000",
  runner: "#a35940",
  sealgate: "#0a0a0a",
  sorella: "#170b1b",
  succinct: "#ffffff",
  unlink: "#ffffff",
  "v12.sh": "#ffffff",
  wildcat: "#232323",
  zenith: "#4f868a",
};

// Logos that need help blending into their banner.
const FADE = "[mask-image:radial-gradient(closest-side,#000_62%,transparent)]";
const LOGO_CLASS: Record<string, string> = {
  // Gradient or photo backgrounds: fade the edges into the tile.
  "aligned layer": FADE,
  "fabric cryptography": FADE,
  zenith: FADE,
  herodotus: FADE,
  intuition: FADE,
  "happy chain": FADE,
  dria: FADE,
  // A circle on white corners: clip to the circle.
  agora: "rounded-full",
};

export function getInvestmentLogoClass(title: string): string | undefined {
  return LOGO_CLASS[title.trim().toLowerCase()];
}

export function getInvestmentTile(title: string): string | undefined {
  return INVESTMENT_TILES[title.trim().toLowerCase()];
}
