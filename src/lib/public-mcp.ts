export const PUBLIC_MCP_COLLECTIONS = ["news", "blog", "candidates", "portfolio", "jobs"] as const;
export type PublicMcpCollection = (typeof PUBLIC_MCP_COLLECTIONS)[number];
export type PublicMcpRecord = Record<string, unknown> & { id: string; url: string };

export type PublicMcpFilters = {
  q?: string;
  company?: string;
  category?: string;
  categories?: string[];
  type?: string;
  source?: string;
  location?: string;
  role?: string;
  availability?: string;
  experience?: string;
  status?: string;
  featured?: boolean;
  remote?: boolean;
  hiring?: boolean;
  main?: boolean;
  hidePortfolioUpdates?: boolean;
  tags?: string[];
  minRelevance?: number;
  since?: string;
  sort?: "newest" | "posted" | "relevance" | "alphabetical";
  limit?: number;
  offset?: number;
};

const text = (value: unknown) => typeof value === "string" ? value.toLowerCase() : "";
const array = (value: unknown): string[] => Array.isArray(value) ? value.map(text) : [];
const eq = (value: unknown, filter: string | undefined) => !filter || text(value) === filter.toLowerCase();
const includes = (value: unknown, filter: string | undefined) => !filter || text(value).includes(filter.toLowerCase());
const matchesNewsCompany = (record: PublicMcpRecord, company: string | undefined) => !company || [record.company, record.portfolioCompany, ...text(record.source).split(",")].some((value) => text(value).trim() === company.trim().toLowerCase());

export function parsePublicMcpFilters(params: URLSearchParams): PublicMcpFilters {
  const filters: PublicMcpFilters = {};
  for (const key of ["q", "company", "category", "type", "source", "location", "role", "availability", "experience", "status", "since"] as const) {
    const value = params.get(key)?.trim();
    if (value) filters[key] = value.slice(0, 200);
  }
  const sort = params.get("sort");
  if (sort === "newest" || sort === "posted" || sort === "relevance" || sort === "alphabetical") filters.sort = sort;
  for (const key of ["featured", "remote", "hiring", "main", "hidePortfolioUpdates"] as const) {
    if (params.get(key) === "true") filters[key] = true;
    if (params.get(key) === "false") filters[key] = false;
  }
  const tags = [...params.getAll("tag"), ...params.getAll("tags").flatMap((value) => value.split(","))].map((tag) => tag.trim()).filter(Boolean).slice(0, 20);
  if (tags.length) filters.tags = tags;
  const categories = params.getAll("category").flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean).slice(0, 20);
  if (categories.length > 1) { filters.categories = categories; delete filters.category; }
  const relevance = Number(params.get("minRelevance"));
  if (params.has("minRelevance") && Number.isFinite(relevance)) filters.minRelevance = Math.max(0, Math.min(10, relevance));
  const limit = Number(params.get("limit"));
  const offset = Number(params.get("offset"));
  filters.limit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 50) : 20;
  filters.offset = Number.isInteger(offset) && offset >= 0 ? Math.min(offset, 10000) : 0;
  return filters;
}

export function filterPublicMcpRecords(collection: PublicMcpCollection, records: PublicMcpRecord[], filters: PublicMcpFilters) {
  const matching = records.filter((record) => {
    const searchable = collection === "candidates"
      ? [record.displayName, record.title, record.bio, record.location, ...array(record.skills)]
      : collection === "jobs"
        ? [record.title, record.company, record.location, record.department, ...array(record.tags)]
        : collection === "news"
          ? [record.title, record.description, record.source, record.company, record.portfolioCompany]
          : collection === "blog"
            ? [record.title, record.description, record.source]
            : [record.title, record.description, ...array(record.categories)];
    if (filters.q && !searchable.map(text).join(" ").includes(filters.q.toLowerCase())) return false;
    if (filters.featured === true && record.featured !== true) return false;
    if (filters.category && !(eq(record.category, filters.category) || array(record.categories).includes(filters.category.toLowerCase()))) return false;
    if (filters.categories?.length && !filters.categories.some((category) => array(record.categories).includes(category.toLowerCase()))) return false;
    if (filters.tags?.length && !filters.tags.every((tag) => array(record.tags ?? record.skills).includes(tag.toLowerCase()))) return false;
    if (filters.since && text(record.date ?? record.createdAt) < filters.since.toLowerCase()) return false;
    if (collection === "news") {
      if (filters.type === "portfolio" && !record.isPortfolioUpdate) return false;
      if (filters.hidePortfolioUpdates && record.isPortfolioUpdate) return false;
      if (filters.type !== "portfolio" && !eq(record.type, filters.type)) return false;
      if (!matchesNewsCompany(record, filters.company)) return false;
      if ((record.relevance as number ?? 0) < (filters.minRelevance ?? 0)) return false;
    }
    if (collection === "blog" && (!eq(record.source, filters.source) || (record.relevance as number ?? 0) < (filters.minRelevance ?? 0))) return false;
    if (collection === "candidates") {
      if (!eq(record.availability, filters.availability) && !(filters.availability === "active" && record.availability !== "not-looking")) return false;
      if (!eq(record.experience, filters.experience) || !includes(record.location, filters.location)) return false;
    }
    if (collection === "portfolio") {
      if (!eq(record.status, filters.status)) return false;
      if (filters.hiring === true && !record.hiring) return false;
      if (filters.main === true && Number(record.tier) > 3) return false;
    }
    if (collection === "jobs") {
      if (!eq(record.company, filters.company) || !eq(record.department, filters.role)) return false;
      if (filters.type && !eq(record.companyCategory, filters.type)) return false;
      if (!includes(record.location, filters.location) || (filters.remote !== undefined && record.remote !== filters.remote)) return false;
    }
    return true;
  });
  if (filters.sort === "alphabetical") matching.sort((a, b) => text(a.title ?? a.displayName).localeCompare(text(b.title ?? b.displayName)));
  if (filters.sort === "relevance") matching.sort((a, b) => Number(b.relevance ?? 0) - Number(a.relevance ?? 0));
  if (filters.sort === "newest" || filters.sort === "posted") matching.sort((a, b) => text(b[filters.sort === "posted" ? "postedAt" : "date"] ?? b.createdAt).localeCompare(text(a[filters.sort === "posted" ? "postedAt" : "date"] ?? a.createdAt)));
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 20;
  return { data: matching.slice(offset, offset + limit), meta: { total: matching.length, limit, offset, hasMore: offset + limit < matching.length } };
}
