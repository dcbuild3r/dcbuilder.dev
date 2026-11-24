import { CardList } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export default function NewslettersLoading() {
  return (
    <div className="mx-auto max-w-[960px] px-6 pt-[72px] pb-24">
      <PageHeader eyebrow="Newsletter" title="Newsletter archive" lede="Browse past newsletter issues." />
      <CardList className="animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start justify-between gap-3 px-6 py-5">
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 rounded bg-surface-2" />
              <div className="h-4 w-1/2 rounded bg-surface-2" />
            </div>
            <div className="h-5 w-14 rounded-full bg-surface-2" />
          </div>
        ))}
      </CardList>
    </div>
  );
}
