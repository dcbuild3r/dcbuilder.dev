import { NextRequest, NextResponse } from "next/server";
import { getPortfolioNewsSlug } from "@/lib/portfolio-news";

export function proxy(request: NextRequest) {
  const company = request.nextUrl.searchParams.get("company");
  const redirectUrl = request.nextUrl.clone();

  if (!company?.trim()) {
    redirectUrl.pathname = "/news";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.pathname = `/news/${getPortfolioNewsSlug(company)}`;
  redirectUrl.search = "";

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: "/news/company",
};
