import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardList } from "@/components/ui/Card";
import { JobsHelpText } from "@/components/jobs/JobsHelpText";
import { JOBS_PAGE } from "@/data/page-content";

export default function JobsLoading() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-[72px]">
      <PageHeader
        eyebrow="Jobs board"
        title="Work with teams I believe in."
        lede={JOBS_PAGE.description}
        aside={<JobsHelpText />}
      />
      <div className="flex flex-wrap items-start gap-6">
        <Card className="h-[420px] flex-[1_1_240px] animate-pulse lg:max-w-[300px]" />
        <CardList className="min-w-0 flex-[999_1_560px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[120px] animate-pulse bg-surface" />
          ))}
        </CardList>
      </div>
    </div>
  );
}
