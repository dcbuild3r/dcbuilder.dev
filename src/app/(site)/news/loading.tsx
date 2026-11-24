import { CardList } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { NEWS_PAGE } from "@/data/page-content";

export default function NewsLoading() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-[72px] pb-24">
      <PageHeader eyebrow="News" title="Signal, curated." lede={NEWS_PAGE.description} />
      <CardList className="animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-start gap-5 px-6 py-5">
            <div className="size-11 flex-shrink-0 rounded-full bg-surface-2" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 rounded bg-surface-2" />
              <div className="h-4 w-full rounded bg-surface-2" />
              <div className="h-3 w-1/3 rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </CardList>
    </div>
  );
}
