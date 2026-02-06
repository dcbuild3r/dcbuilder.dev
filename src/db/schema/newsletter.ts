import { createId } from "@paralleldrive/cuid2";
import { boolean, index, integer, text, timestamp, pgTable } from "drizzle-orm/pg-core";

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    email: text("email").notNull().unique(),
    status: text("status").notNull().default("pending"), // pending | active | unsubscribed
    confirmedAt: timestamp("confirmed_at"),
    unsubscribedAt: timestamp("unsubscribed_at"),
    source: text("source").notNull().default("news-page"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("newsletter_subscribers_status_idx").on(table.status)]
);

export const newsletterPreferences = pgTable(
  "newsletter_preferences",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    subscriberId: text("subscriber_id").notNull(),
    newsletterType: text("newsletter_type").notNull(), // news | jobs | candidates
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("newsletter_preferences_subscriber_idx").on(table.subscriberId),
    index("newsletter_preferences_type_idx").on(table.newsletterType),
  ]
);

export const newsletterCampaigns = pgTable(
  "newsletter_campaigns",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    newsletterType: text("newsletter_type").notNull(), // news | jobs | candidates
    subject: text("subject").notNull(),
    previewText: text("preview_text"),
    status: text("status").notNull().default("draft"), // draft | scheduled | sending | sent | failed
    periodDays: integer("period_days").notNull().default(7),
    scheduledAt: timestamp("scheduled_at"),
    sentAt: timestamp("sent_at"),
    failureReason: text("failure_reason"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("newsletter_campaigns_status_idx").on(table.status),
    index("newsletter_campaigns_type_idx").on(table.newsletterType),
    index("newsletter_campaigns_scheduled_idx").on(table.scheduledAt),
  ]
);

export const newsletterCampaignRecipients = pgTable(
  "newsletter_campaign_recipients",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    campaignId: text("campaign_id").notNull(),
    subscriberId: text("subscriber_id").notNull(),
    email: text("email").notNull(),
    status: text("status").notNull().default("pending"), // pending | sent | failed | skipped
    sentAt: timestamp("sent_at"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("newsletter_campaign_recipients_campaign_idx").on(table.campaignId),
    index("newsletter_campaign_recipients_subscriber_idx").on(table.subscriberId),
  ]
);

export const newsletterSendEvents = pgTable(
  "newsletter_send_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    campaignId: text("campaign_id").notNull(),
    recipientId: text("recipient_id"),
    eventType: text("event_type").notNull(), // queued | sent | failed | bounced | complained
    provider: text("provider"),
    providerMessageId: text("provider_message_id"),
    payload: text("payload"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("newsletter_send_events_campaign_idx").on(table.campaignId),
    index("newsletter_send_events_type_idx").on(table.eventType),
  ]
);

export const newsletterUnsubTokens = pgTable(
  "newsletter_unsub_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    subscriberId: text("subscriber_id").notNull(),
    newsletterType: text("newsletter_type"), // null means applies to all
    tokenType: text("token_type").notNull().default("unsubscribe"), // confirm | unsubscribe | preferences
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("newsletter_unsub_tokens_subscriber_idx").on(table.subscriberId),
    index("newsletter_unsub_tokens_token_idx").on(table.token),
  ]
);

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type NewNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

export type NewsletterPreference = typeof newsletterPreferences.$inferSelect;
export type NewNewsletterPreference = typeof newsletterPreferences.$inferInsert;

export type NewsletterCampaign = typeof newsletterCampaigns.$inferSelect;
export type NewNewsletterCampaign = typeof newsletterCampaigns.$inferInsert;

export type NewsletterCampaignRecipient = typeof newsletterCampaignRecipients.$inferSelect;
export type NewNewsletterCampaignRecipient = typeof newsletterCampaignRecipients.$inferInsert;

export type NewsletterSendEvent = typeof newsletterSendEvents.$inferSelect;
export type NewNewsletterSendEvent = typeof newsletterSendEvents.$inferInsert;

export type NewsletterUnsubToken = typeof newsletterUnsubTokens.$inferSelect;
export type NewNewsletterUnsubToken = typeof newsletterUnsubTokens.$inferInsert;
