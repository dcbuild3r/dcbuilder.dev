export function normalizeJobTags(tags: readonly unknown[] | null | undefined): string[] {
  if (!tags) {
    return [];
  }

  const seen = new Set<string>();
  const normalizedTags: string[] = [];

  for (const tag of tags) {
    if (typeof tag !== "string") {
      continue;
    }

    const normalized = tag.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    normalizedTags.push(normalized);
  }

  return normalizedTags;
}

// Words that title-casing gets wrong.
const TAG_WORDS: Record<string, string> = {
  ai: "AI", api: "API", bci: "BCI", bd: "BD", dao: "DAO", defi: "DeFi", devops: "DevOps", devrel: "DevRel",
  evm: "EVM", fhe: "FHE", fullstack: "Full Stack", gtm: "GTM", hr: "HR", ios: "iOS", javascript: "JavaScript",
  mev: "MEV", ml: "ML", mpc: "MPC", nft: "NFT", qa: "QA", rwa: "RWA", sdk: "SDK", tee: "TEE",
  typescript: "TypeScript", ui: "UI", ux: "UX", vc: "VC", zk: "ZK", zkp: "ZKP",
};

export function formatJobTagLabel(tag: string): string {
  return tag
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => TAG_WORDS[part.toLowerCase()] ?? part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getJobTagLabel(tag: string, labels: Record<string, string>): string {
  const normalized = tag.trim().toLowerCase();
  return labels[normalized]?.trim() || formatJobTagLabel(normalized);
}
