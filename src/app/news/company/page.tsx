import { redirect } from "next/navigation";
import { getPortfolioNewsUrl } from "@/lib/portfolio-news";

interface LegacyCompanyNewsPageProps {
  searchParams: Promise<{ company?: string }>;
}

export default async function LegacyCompanyNewsPage({
  searchParams,
}: LegacyCompanyNewsPageProps) {
  const { company } = await searchParams;

  if (company?.trim()) {
    redirect(getPortfolioNewsUrl(company));
  }

  redirect("/news");
}
