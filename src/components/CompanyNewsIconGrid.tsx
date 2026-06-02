import Image from "next/image";
import Link from "next/link";
import type { CompanyNewsIconCompany } from "@/lib/company-news-navigation";

interface CompanyNewsIconGridProps {
  activeCompanyName?: string;
  companies: CompanyNewsIconCompany[];
  variant?: "sidebar" | "compact";
}

export function CompanyNewsIconGrid({
  activeCompanyName,
  companies,
  variant = "sidebar",
}: CompanyNewsIconGridProps) {
  if (companies.length === 0) return null;

  const isCompact = variant === "compact";
  const sectionClassName = isCompact
    ? "flex flex-col rounded-lg border border-neutral-200 bg-white/90 p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/80 sm:p-4"
    : "flex h-full flex-col rounded-lg border border-neutral-200 bg-white/90 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/80 sm:p-5 lg:h-[37rem]";
  const scrollerClassName = isCompact
    ? "max-h-[10.5rem] overflow-y-auto pr-1"
    : "max-h-[13.5rem] overflow-y-auto pr-1 lg:min-h-0 lg:flex-1 lg:max-h-none";
  const gridClassName = isCompact
    ? "grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-6"
    : "grid grid-cols-3 gap-x-5 gap-y-7";
  const linkClassName = isCompact
    ? "group flex h-20 min-w-0 flex-col items-center justify-start gap-2 rounded-lg transition-transform duration-150 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 dark:focus:ring-white dark:focus:ring-offset-neutral-950"
    : "group flex h-[6.5rem] min-w-0 flex-col items-center justify-start gap-2 rounded-lg transition-transform duration-150 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 dark:focus:ring-white dark:focus:ring-offset-neutral-950";
  const logoSizeClassName = isCompact ? "h-12 w-12" : "h-14 w-14";
  const imageSize = isCompact ? 48 : 48;
  const imageSizes = isCompact ? "48px" : "48px";
  const labelClassName = isCompact
    ? "max-w-16 text-center text-[10px] font-semibold leading-tight text-neutral-950 dark:text-white"
    : "max-w-20 text-center text-[11px] font-semibold leading-tight text-neutral-950 dark:text-white";

  return (
    <section
      aria-labelledby="company-news-icon-grid-heading"
      className={sectionClassName}
    >
      <div className={isCompact ? "mb-3 flex items-center justify-between gap-3" : "mb-4 flex items-center justify-between gap-3"}>
        <h2
          id="company-news-icon-grid-heading"
          className="text-sm font-semibold uppercase text-neutral-500 dark:text-neutral-400"
        >
          Portfolio news
        </h2>
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
          {companies.length}
        </span>
      </div>

      <div className={scrollerClassName}>
        <div className={gridClassName}>
          {companies.map((company) => {
            const isActive = activeCompanyName === company.name;
            const logoBackgroundClass =
              company.logoBackground === "dark" ? "bg-black" : "bg-white";

            return (
              <Link
                key={company.name}
                href={company.href}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Open ${company.name} news`}
                title={company.name}
                className={`${linkClassName} ${
                  isActive
                    ? "scale-105"
                    : ""
                }`}
              >
                <Image
                  src={company.logo}
                  alt=""
                  width={imageSize}
                  height={imageSize}
                  sizes={imageSizes}
                  className={`${logoSizeClassName} object-contain transition-transform duration-150 group-hover:scale-105 ${logoBackgroundClass}`}
                  unoptimized
                />
                <span className={labelClassName}>
                  {company.name}
                </span>
                <span className="sr-only">
                  {company.newsCount} news items
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
