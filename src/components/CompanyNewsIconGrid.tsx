import Image from 'next/image';
import Link from 'next/link';
import type { CompanyNewsIconCompany } from '@/lib/company-news-navigation';
import { cn } from '@/lib/utils';

interface CompanyNewsIconGridProps {
  activeCompanyName?: string;
  companies: CompanyNewsIconCompany[];
  variant?: 'sidebar' | 'compact';
}

export function CompanyNewsIconGrid({
  activeCompanyName,
  companies,
  variant = 'sidebar',
}: CompanyNewsIconGridProps) {
  if (companies.length === 0) return null;

  const isCompact = variant === 'compact';

  return (
    <section aria-labelledby="company-news-icon-grid-heading">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2
          id="company-news-icon-grid-heading"
          className="font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-muted"
        >
          {isCompact ? 'More portfolio news' : 'Portfolio company news'}
        </h2>
      </div>

      <div className="thin-scroll relative -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {companies.map((company) => {
          const isActive = activeCompanyName === company.name;

          return (
            <Link
              key={company.name}
              href={company.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Open ${company.name} news`}
              title={company.name}
              className={cn(
                'flex min-h-11 flex-none items-center gap-2 rounded-full pl-1.5 pr-3.5 text-[13.5px] font-medium transition-colors',
                isActive ? 'bg-accent-soft text-accent-ink' : 'bg-surface-2 text-ink hover:bg-line',
              )}
            >
              <Image
                src={company.logo}
                alt=""
                width={32}
                height={32}
                sizes="32px"
                className="size-8 rounded-full object-contain"
                unoptimized
              />
              <span>{company.name}</span>
              <span className="sr-only">{company.newsCount} news items</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
