---
name: add-company-news
description: Use when the user asks to add, backfill, index, classify, or verify news for a specific dcbuilder.dev portfolio company page such as /news/morpho, /news/megaeth, or a company timeline/history page.
---

# Add Company News Skill

Use this skill for company-specific timeline pages at `/news/<company-slug>`.
For raw DB insert mechanics, also use the `post-news` skill.

## Mental Model

Company pages are not separate tables. They are filtered timeline views over the existing news feed:

- Canonical route: `/news/<company-slug>` such as `/news/morpho`
- Legacy route: `/news/company?company=Morpho` redirects through `src/proxy.ts`
- Slug helper: `src/lib/portfolio-news.ts`
- Company matching and timeline sorting: `src/lib/company-news.ts`
- Timeline UI: `src/components/CompanyTimeline.tsx`
- Source tables: `announcements` and `curated_links`

## Choose The Record Type

Use an **announcement** when the news is official company communication:

- Official X post from the company
- Company blog post
- GitHub release or official repo announcement
- Product, growth, funding, launch, or roadmap announcement

Use a **curated link** when the source is not official company communication:

- External article about the company
- Individual post, analyst thread, ecosystem commentary
- Research or press that should appear in `/news` but is not owned by the company

For company timeline pages, prefer announcements when in doubt and the source is official.

## Required Fields

For an announcement:

- `title`: concise milestone title
- `url`: canonical source URL
- `company`: exact portfolio company name from `investments.title`
- `platform`: `x`, `blog`, `github`, `discord`, or `other`
- `date`: publication/event date as `YYYY-MM-DD`
- `category`: topical category, not necessarily the source
- `description`: direct event summary

For a curated link:

- `title`
- `url`
- `source`: source name that can map to the portfolio company
- `date`
- `category`
- `description`

## Category Rules

Use these current news categories:

| Value | Label | Use For |
| --- | --- | --- |
| `x_post` | X Post | The item itself is mainly an X post with no better topical category |
| `growth` | Growth | Adoption, usage, ecosystem expansion, partnerships, integrations |
| `product` | Product | Product launches, new features, app releases |
| `defi` | DeFi | DeFi protocol mechanics, markets, lending, trading |
| `crypto` | Crypto | Broad crypto/network/token news |
| `ai` | AI | AI agents, models, automation |
| `infrastructure` | Infrastructure | Infra, devtools, protocol/platform updates |
| `research` | Research | Papers, whitepapers, technical research |
| `funding` | Funding | Fundraises, grants, token sale/fundraising events |
| `general` | General | Fallback only |

Timeline cards can show multiple badges. For example, an announcement with
`platform: "x"` and `category: "growth"` displays `X Post` and `Growth`.
Do not force every X-sourced announcement to `category: "x_post"` if a better
topical category exists.

## Description Style

Write descriptions as milestones, not attribution blurbs.

- Good: `Morpho Agents [Beta] launches as an AI-agent-native lending interface through Base MCP.`
- Good: `The Ethereum Foundation increased its treasury allocation to Morpho, while additional institutions expanded yield offerings with Morpho.`
- Avoid: `Morpho tweeted that agents are now available.`

## Workflow

1. Resolve the company by checking `investments.title`.
2. Confirm the canonical page slug with `getPortfolioNewsUrl(company)`.
3. Decide announcement vs curated link.
4. Pick `platform` and topical `category`.
5. Check for duplicate `url` in the target table before inserting.
6. Insert locally/runtime and, unless told otherwise, mirror to production per `post-news`.
7. Verify the company page, not just `/news`:

```bash
curl -sS -o /tmp/company-news.html -w '%{http_code}\n' 'http://localhost:3000/news/morpho'
```

8. Browser-check the timeline card includes the expected badges, date, title, and description.

## Useful Checks

List a company timeline from the aggregated feed:

```bash
bun -e "
import { getAllNews } from './src/lib/news.ts';
import { filterNewsByCompany } from './src/lib/company-news.ts';
const news = await getAllNews();
console.log(JSON.stringify(
  filterNewsByCompany(news, 'Morpho').map(({ title, type, platform, category, date, url }) => ({
    date, type, platform, category, title, url
  })),
  null,
  2
));
"
```

Check an announcement by URL:

```bash
bun -e "
import { db, announcements } from './src/db';
import { eq } from 'drizzle-orm';
const url = 'SOURCE_URL';
console.log(await db.select().from(announcements).where(eq(announcements.url, url)));
"
```

## Done Criteria

- `/news/<company-slug>` returns `200`
- The item appears in the vertical timeline in chronological order
- The card displays source badge plus topical category when relevant
- The category dropdown contains the topical category
- `bunx tsc --noEmit` passes
- `bun run lint` passes or only shows known unrelated warnings
