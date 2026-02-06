import { and, eq, gt, lte } from "drizzle-orm";
import { db, announcements, blogPosts, curatedLinks } from "@/db";

export const FRESH_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getFreshCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - FRESH_WINDOW_DAYS * DAY_MS);
}

export function shouldBeFresh(date: Date, now: Date = new Date()): boolean {
  return now.getTime() - date.getTime() < FRESH_WINDOW_DAYS * DAY_MS;
}

type FreshnessReconcileStats = {
  table: "curated_links" | "announcements" | "blog_posts";
  markedFresh: number;
  markedStale: number;
};

export interface NewsFreshnessReconcileResult {
  cutoffUtc: string;
  stats: FreshnessReconcileStats[];
}

export async function reconcileNewsFreshness(now: Date = new Date()): Promise<NewsFreshnessReconcileResult> {
  const cutoff = getFreshCutoff(now);

  const [curatedFresh, curatedStale, announcementsFresh, announcementsStale, blogFresh, blogStale] = await Promise.all([
    db
      .update(curatedLinks)
      .set({ isFresh: true, updatedAt: now })
      .where(and(gt(curatedLinks.date, cutoff), eq(curatedLinks.isFresh, false)))
      .returning({ id: curatedLinks.id }),
    db
      .update(curatedLinks)
      .set({ isFresh: false, updatedAt: now })
      .where(and(lte(curatedLinks.date, cutoff), eq(curatedLinks.isFresh, true)))
      .returning({ id: curatedLinks.id }),
    db
      .update(announcements)
      .set({ isFresh: true, updatedAt: now })
      .where(and(gt(announcements.date, cutoff), eq(announcements.isFresh, false)))
      .returning({ id: announcements.id }),
    db
      .update(announcements)
      .set({ isFresh: false, updatedAt: now })
      .where(and(lte(announcements.date, cutoff), eq(announcements.isFresh, true)))
      .returning({ id: announcements.id }),
    db
      .update(blogPosts)
      .set({ isFresh: true, updatedAt: now })
      .where(and(gt(blogPosts.date, cutoff), eq(blogPosts.isFresh, false)))
      .returning({ slug: blogPosts.slug }),
    db
      .update(blogPosts)
      .set({ isFresh: false, updatedAt: now })
      .where(and(lte(blogPosts.date, cutoff), eq(blogPosts.isFresh, true)))
      .returning({ slug: blogPosts.slug }),
  ]);

  return {
    cutoffUtc: cutoff.toISOString(),
    stats: [
      {
        table: "curated_links",
        markedFresh: curatedFresh.length,
        markedStale: curatedStale.length,
      },
      {
        table: "announcements",
        markedFresh: announcementsFresh.length,
        markedStale: announcementsStale.length,
      },
      {
        table: "blog_posts",
        markedFresh: blogFresh.length,
        markedStale: blogStale.length,
      },
    ],
  };
}
