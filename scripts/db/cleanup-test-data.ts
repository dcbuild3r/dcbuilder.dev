import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import {
  announcements,
  candidates,
  curatedLinks,
  investmentCategories,
  investments,
  jobRoles,
  jobTags,
  jobs,
  newsletterCampaignRecipients,
  newsletterCampaigns,
  newsletterPreferences,
  newsletterSendEvents,
  newsletterSubscribers,
  newsletterUnsubTokens,
} from "../../src/db";
import { createPreferredPostgresSocket, resolvePreferredPostgresTarget } from "../../src/db/postgres-connection";
import { TEST_ID_PREFIX } from "../../src/lib/test-data-cleanup";
import { isMissingNewsletterSchemaError } from "../../src/services/newsletter-schema";

type TargetEnv = "dev" | "staging" | "prod";

const VALID_ENVS: TargetEnv[] = ["dev", "staging", "prod"];
const TEST_PREFIXES = ["test ", "demo ", "qa ", "e2e "];
const TEST_SUBSTRINGS = [
  TEST_ID_PREFIX,
  "demo-",
  "qa-",
  "e2e-",
  "@test.example.com",
  "@example.com",
  ".example.com",
  "://example.com",
];

function parseEnvArg(argv: string[]): TargetEnv {
  const arg = argv.find((value) => value.startsWith("--env="));
  if (!arg) {
    throw new Error("Missing required argument --env=dev|staging|prod");
  }

  const value = arg.slice("--env=".length).toLowerCase();
  if (!VALID_ENVS.includes(value as TargetEnv)) {
    throw new Error(`Invalid --env value "${value}". Expected dev, staging, or prod.`);
  }

  return value as TargetEnv;
}

function resolveUrl(targetEnv: TargetEnv): string {
  if (targetEnv === "dev") {
    const devUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
    if (!devUrl) {
      throw new Error("DATABASE_URL_DEV (or DATABASE_URL fallback) is required for --env=dev.");
    }
    return devUrl;
  }

  if (targetEnv === "staging") {
    const stagingUrl = process.env.DATABASE_URL_STAGING;
    if (!stagingUrl) {
      throw new Error("DATABASE_URL_STAGING is required for --env=staging.");
    }
    return stagingUrl;
  }

  const prodUrl = process.env.DATABASE_URL_PROD;
  if (!prodUrl) {
    throw new Error("DATABASE_URL_PROD is required for --env=prod.");
  }

  return prodUrl;
}

function orSql(clauses: Array<ReturnType<typeof sql>>) {
  return clauses.reduce<ReturnType<typeof sql> | null>((acc, clause) => {
    if (!acc) return clause;
    return sql`${acc} OR ${clause}`;
  }, null) ?? sql`FALSE`;
}

function testLike(column: unknown) {
  return orSql([
    ...TEST_PREFIXES.map((prefix) => sql`lower(coalesce(${column}::text, '')) LIKE ${`${prefix}%`}`),
    ...TEST_SUBSTRINGS.map((part) => sql`lower(coalesce(${column}::text, '')) LIKE ${`%${part}%`}`),
  ]);
}

async function run() {
  const targetEnv = parseEnvArg(process.argv.slice(2));
  const databaseUrl = resolveUrl(targetEnv);
  console.log(`[db:cleanup-test-data] Cleaning ${targetEnv}`);

  const target = await resolvePreferredPostgresTarget(databaseUrl);
  if (target.tlsServername && target.connectHost !== target.tlsServername) {
    console.log(
      `[db:cleanup-test-data] Using IPv4 connect target ${target.connectHost} for ${target.tlsServername}`
    );
  }

  const queryClient = postgres(databaseUrl, {
    max: 1,
    socket: targetEnv === "dev" ? undefined : () => createPreferredPostgresSocket(databaseUrl),
  });

  try {
    const db = drizzle(queryClient);

    const testSubscriberIds = sql`(
      SELECT id FROM newsletter_subscribers
      WHERE ${orSql([
        testLike(newsletterSubscribers.id),
        testLike(newsletterSubscribers.email),
        testLike(newsletterSubscribers.source),
      ])}
    )`;

    const testCampaignIds = sql`(
      SELECT id FROM newsletter_campaigns
      WHERE ${orSql([
        testLike(newsletterCampaigns.id),
        testLike(newsletterCampaigns.subject),
        testLike(newsletterCampaigns.previewText),
        testLike(newsletterCampaigns.createdBy),
      ])}
    )`;

    const deletions = [
      {
        label: "newsletter_send_events",
        run: () =>
          db
            .delete(newsletterSendEvents)
            .where(orSql([
              sql`${newsletterSendEvents.campaignId} IN ${testCampaignIds}`,
              testLike(newsletterSendEvents.payload),
              testLike(newsletterSendEvents.providerMessageId),
            ]))
            .returning({ id: newsletterSendEvents.id }),
      },
      {
        label: "newsletter_campaign_recipients",
        run: () =>
          db
            .delete(newsletterCampaignRecipients)
            .where(orSql([
              sql`${newsletterCampaignRecipients.campaignId} IN ${testCampaignIds}`,
              sql`${newsletterCampaignRecipients.subscriberId} IN ${testSubscriberIds}`,
              testLike(newsletterCampaignRecipients.email),
            ]))
            .returning({ id: newsletterCampaignRecipients.id }),
      },
      {
        label: "newsletter_preferences",
        run: () =>
          db
            .delete(newsletterPreferences)
            .where(sql`${newsletterPreferences.subscriberId} IN ${testSubscriberIds}`)
            .returning({ id: newsletterPreferences.id }),
      },
      {
        label: "newsletter_unsub_tokens",
        run: () =>
          db
            .delete(newsletterUnsubTokens)
            .where(sql`${newsletterUnsubTokens.subscriberId} IN ${testSubscriberIds}`)
            .returning({ id: newsletterUnsubTokens.id }),
      },
      {
        label: "newsletter_campaigns",
        run: () =>
          db
            .delete(newsletterCampaigns)
            .where(sql`${newsletterCampaigns.id} IN ${testCampaignIds}`)
            .returning({ id: newsletterCampaigns.id }),
      },
      {
        label: "newsletter_subscribers",
        run: () =>
          db
            .delete(newsletterSubscribers)
            .where(sql`${newsletterSubscribers.id} IN ${testSubscriberIds}`)
            .returning({ id: newsletterSubscribers.id }),
      },
      {
        label: "announcements",
        run: () =>
          db
            .delete(announcements)
            .where(orSql([
              testLike(announcements.id),
              testLike(announcements.title),
              testLike(announcements.company),
              testLike(announcements.url),
              testLike(announcements.description),
            ]))
            .returning({ id: announcements.id }),
      },
      {
        label: "curated_links",
        run: () =>
          db
            .delete(curatedLinks)
            .where(orSql([
              testLike(curatedLinks.id),
              testLike(curatedLinks.title),
              testLike(curatedLinks.url),
              testLike(curatedLinks.source),
              testLike(curatedLinks.description),
            ]))
            .returning({ id: curatedLinks.id }),
      },
      {
        label: "jobs",
        run: () =>
          db
            .delete(jobs)
            .where(orSql([
              testLike(jobs.id),
              testLike(jobs.title),
              testLike(jobs.company),
              testLike(jobs.link),
              testLike(jobs.companyWebsite),
              testLike(jobs.description),
            ]))
            .returning({ id: jobs.id }),
      },
      {
        label: "candidates",
        run: () =>
          db
            .delete(candidates)
            .where(orSql([
              testLike(candidates.id),
              testLike(candidates.name),
              testLike(candidates.title),
              testLike(candidates.summary),
              testLike(candidates.email),
              testLike(candidates.github),
              testLike(candidates.linkedin),
              testLike(candidates.website),
            ]))
            .returning({ id: candidates.id }),
      },
      {
        label: "investments",
        run: () =>
          db
            .delete(investments)
            .where(orSql([
              testLike(investments.id),
              testLike(investments.title),
              testLike(investments.description),
              testLike(investments.website),
              testLike(investments.github),
              testLike(investments.x),
            ]))
            .returning({ id: investments.id }),
      },
      {
        label: "investment_categories",
        run: () =>
          db
            .delete(investmentCategories)
            .where(orSql([
              testLike(investmentCategories.id),
              testLike(investmentCategories.slug),
              testLike(investmentCategories.label),
            ]))
            .returning({ id: investmentCategories.id }),
      },
      {
        label: "job_tags",
        run: () =>
          db
            .delete(jobTags)
            .where(orSql([
              testLike(jobTags.id),
              testLike(jobTags.slug),
              testLike(jobTags.label),
            ]))
            .returning({ id: jobTags.id }),
      },
      {
        label: "job_roles",
        run: () =>
          db
            .delete(jobRoles)
            .where(orSql([
              testLike(jobRoles.id),
              testLike(jobRoles.slug),
              testLike(jobRoles.label),
            ]))
            .returning({ id: jobRoles.id }),
      },
    ];

    for (const deletion of deletions) {
      try {
        const rows = await deletion.run();
        console.log(`[db:cleanup-test-data] ${deletion.label}: ${rows.length}`);
      } catch (error) {
        if (deletion.label.startsWith("newsletter_") && isMissingNewsletterSchemaError(error)) {
          console.log(`[db:cleanup-test-data] ${deletion.label}: skipped (newsletter schema unavailable)`);
          continue;
        }
        throw error;
      }
    }
  } finally {
    await queryClient.end({ timeout: 5 });
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown cleanup error";
  console.error(`[db:cleanup-test-data] ${message}`);
  process.exit(1);
});
