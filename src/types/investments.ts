/**
 * Shared type definitions for investments/portfolio.
 * Used by PortfolioGrid, InvestmentCard, and related components.
 */

export type InvestmentTier = 1 | 2 | 3 | 4;

export interface Investment {
  id?: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  logo: string | null;
  tier: InvestmentTier;
  featured: boolean;
  status?: string | null;
  categories?: string[] | null;
  website?: string | null;
  x?: string | null;
  github?: string | null;
  createdAt?: string | Date | null;
}

export interface InvestmentCategory {
  id: string;
  slug: string;
  label: string;
  color: string | null;
}

export type SortOption = "relevance" | "alphabetical" | "alphabetical-desc";

export type FilterOption = "main" | "featured" | "all";
