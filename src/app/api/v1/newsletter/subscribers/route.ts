import { NextRequest } from "next/server";
import { requireAuth } from "@/services/auth";
import { db, newsletterSubscribers, newsletterPreferences } from "@/db";
import { count, desc, eq, inArray } from "drizzle-orm";
import { getEmailClicksLast7Days } from "@/services/posthog";
import {
  getNewsletterAvailabilityMeta,
  isMissingNewsletterSchemaError,
} from "@/services/newsletter-schema";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "admin:read");
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const rawLimit = parseInt(url.searchParams.get("limit") || "100", 10);
  const limit = Math.min(Number.isNaN(rawLimit) ? 100 : rawLimit, 500);
  const rawOffset = parseInt(url.searchParams.get("offset") || "0", 10);
  const offset = Number.isNaN(rawOffset) ? 0 : rawOffset;
  const status = url.searchParams.get("status");

  // Build where condition
  const where = status ? eq(newsletterSubscribers.status, status) : undefined;

  try {
    // Fetch subscribers and total count in parallel
    const [subscribers, [totalRow]] = await Promise.all([
      db
        .select()
        .from(newsletterSubscribers)
        .where(where)
        .orderBy(desc(newsletterSubscribers.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(newsletterSubscribers)
        .where(where),
    ]);

    // Fetch preferences for the returned subscribers
    const subscriberIds = subscribers.map((s) => s.id);
    const preferences =
      subscriberIds.length > 0
        ? await db
            .select()
            .from(newsletterPreferences)
            .where(inArray(newsletterPreferences.subscriberId, subscriberIds))
        : [];

    // Fetch click analytics from PostHog
    const clickResult = await getEmailClicksLast7Days();

    // Group preferences by subscriber ID
    const preferencesBySubscriber = new Map<string, typeof preferences>();
    for (const pref of preferences) {
      const existing = preferencesBySubscriber.get(pref.subscriberId);
      if (existing) {
        existing.push(pref);
      } else {
        preferencesBySubscriber.set(pref.subscriberId, [pref]);
      }
    }

    // Build click data map keyed by email
    const clicksByEmail = new Map<string, { clicks7d: number; lastClickedLink: string }>();
    if (clickResult.success) {
      for (const row of clickResult.data) {
        clicksByEmail.set(row.email, {
          clicks7d: row.count,
          lastClickedLink: row.lastClickedLink,
        });
      }
    }

    // Merge subscribers with their preferences and click analytics
    const data = subscribers.map((subscriber) => {
      const clickData = clicksByEmail.get(subscriber.email);
      return {
        ...subscriber,
        preferences: preferencesBySubscriber.get(subscriber.id) || [],
        clicks7d: clickData?.clicks7d ?? 0,
        lastClickedLink: clickData?.lastClickedLink ?? null,
      };
    });

    return Response.json({
      data,
      total: totalRow?.total ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[api/newsletter/subscribers] GET failed:", error);
    if (isMissingNewsletterSchemaError(error)) {
      return Response.json({
        data: [],
        total: 0,
        limit,
        offset,
        meta: getNewsletterAvailabilityMeta(),
      });
    }

    return Response.json({ error: "Failed to load newsletter subscribers" }, { status: 500 });
  }
}
