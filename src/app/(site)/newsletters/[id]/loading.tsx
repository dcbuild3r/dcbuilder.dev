import { Card } from "@/components/ui/Card";

export default function NewsletterViewLoading() {
  return (
    <div className="mx-auto max-w-[960px] px-6 pt-[72px] pb-24">
      <div className="mb-6 h-4 w-28 animate-pulse rounded bg-surface-2" />
      <div className="mb-6 space-y-3">
        <div className="h-8 w-2/3 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-4 w-40 animate-pulse rounded bg-surface-2" />
      </div>
      <Card className="min-h-[400px] animate-pulse" />
    </div>
  );
}
