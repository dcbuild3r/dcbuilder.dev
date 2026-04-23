---
name: post-news
description: Use when the user asks to add or post content to the dcbuilder.dev news feed, including X posts, announcements, curated links, or articles.
---

# Post News Skill

Add news items to the dcbuilder.dev news feed. Supports two types: **announcements** (company posts with logos) and **curated links** (external content without logos).

## Description Style

When writing `description`, prefer direct event framing instead of attribution framing.

- Good: `OpenAI has acquired TBPN.`
- Good: `An orbital animation shows Artemis II's crewed trajectory around the Moon and back to Earth.`
- Avoid: `Jordi Hays says OpenAI has acquired TBPN.`
- Avoid: `delian shares orbital animation of Artemis 2 heading to the Moon.`

## Default Publishing Behavior

Unless the user explicitly says otherwise, `post-news` means:

1. Resolve the item metadata and decide announcement vs curated link.
2. Check the local/runtime database for an existing record with the same URL.
3. Insert into the local/runtime database if not present.
4. Check the production database for an existing record with the same URL.
5. Insert into production if not present.
6. Verify both environments before reporting success.

Use `.env.local` for local/runtime access (`DATABASE_URL`) and `DATABASE_URL_PROD` for production.

For production writes, do **not** rely on `src/db/index.ts`, which always reads `DATABASE_URL`. Use a one-off Bun script with `postgres`, `drizzle`, and `src/db/postgres-connection.ts` so the write is explicitly bound to `DATABASE_URL_PROD`.

## Quick Decision

| Scenario | Type | Use When |
|----------|------|----------|
| **Announcement** | Company post | Portfolio company content, needs logo display |
| **Curated Link** | External content | Individual posts, articles, no logo needed |

## Workflow: Add Announcement

For portfolio company posts (X posts, blog posts, etc.) with company logo.

### Step 1: Gather Information

Required fields:
- **title**: Post title/headline
- **url**: Full URL to the post
- **company**: Company name (e.g., "Lighter", "MegaETH")
- **platform**: `x`, `blog`, `discord`, `github`, or `other`
- **date**: Publication date (YYYY-MM-DD format, use today if not specified)
- **category**: Usually `x_post` for X posts, or `product`, `funding`, etc.

Optional:
- **companyLogo**: Path to logo image
- **description**: Brief summary
- **featured**: Set to `true` to spotlight

### Step 2: Resolve Company Logo

Check if company has existing logo in investments data:

```bash
grep -i "company-name" src/data/investments.ts
```

Common logo paths: `/images/investments/lighter.jpg`, `/images/investments/megaeth.png`

If no existing logo, see "Image Upload Flow" below.

### Step 3: Insert into Local/Runtime Database

Run from project root:

```bash
bun -e "
import { db, announcements } from './src/db';

await db.insert(announcements).values({
  title: 'YOUR_TITLE',
  url: 'YOUR_URL',
  company: 'COMPANY_NAME',
  companyLogo: '/images/investments/company.jpg',
  platform: 'x',
  date: new Date('YYYY-MM-DD'),
  category: 'x_post',
}).returning().then(r => console.log('Created:', JSON.stringify(r, null, 2)));

process.exit(0);
"
```

### Step 4: Mirror to Production

Always check prod for an existing record with the same URL first. If it does not exist, insert it with a one-off script that uses `DATABASE_URL_PROD` directly.

```bash
bunx dotenv -e .env.local -- bun -e '
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { announcements } from "./src/db/schema/news";
import { createPreferredPostgresSocket } from "./src/db/postgres-connection";

const prodUrl = process.env.DATABASE_URL_PROD;
if (!prodUrl) throw new Error("DATABASE_URL_PROD is required");

const payload = {
  title: "YOUR_TITLE",
  url: "YOUR_URL",
  company: "COMPANY_NAME",
  companyLogo: "/images/investments/company.jpg",
  platform: "x",
  date: new Date("YYYY-MM-DD"),
  category: "x_post",
  description: "OPTIONAL_DESCRIPTION",
  featured: false,
};

const sql = postgres(prodUrl, {
  max: 1,
  socket: () => createPreferredPostgresSocket(prodUrl),
});

try {
  const db = drizzle(sql, { schema: { announcements } });
  const existing = await db.select().from(announcements).where(eq(announcements.url, payload.url));

  if (existing.length) {
    console.log(JSON.stringify({ status: "exists", existing }, null, 2));
  } else {
    const created = await db.insert(announcements).values(payload).returning();
    console.log(JSON.stringify({ status: "created", created }, null, 2));
  }
} finally {
  await sql.end({ timeout: 5 });
}
'
```

## Workflow: Add Curated Link

For external articles, individual posts, or content not from portfolio companies.

### Step 1: Gather Information

Required fields:
- **title**: Post/article title
- **url**: Full URL
- **source**: Author name or publication (e.g., "Vitalik Buterin", "Paradigm")
- **date**: Publication date (YYYY-MM-DD)
- **category**: `x_post`, `crypto`, `ai`, `research`, etc.

### Step 2: Insert into Local/Runtime Database

Preferred (script):

```bash
# Example (loads env vars from .env.local)
bunx dotenv -e .env.local -- bun run scripts/add-curated-link.ts \
  --title "YOUR_TITLE" \
  --url "YOUR_URL" \
  --source "SOURCE_NAME" \
  --category x_post \
  --date YYYY-MM-DD
```

Alternate (inline):

```bash
bun -e "
import { db, curatedLinks } from './src/db';

await db.insert(curatedLinks).values({
  title: 'YOUR_TITLE',
  url: 'YOUR_URL',
  source: 'SOURCE_NAME',
  date: new Date('YYYY-MM-DD'),
  category: 'x_post',
}).returning().then(r => console.log('Created:', JSON.stringify(r, null, 2)));

process.exit(0);
"
```

### Step 3: Mirror to Production

Check prod for an existing record with the same URL first. If it does not exist, insert it with a one-off script that uses `DATABASE_URL_PROD` directly.

```bash
bunx dotenv -e .env.local -- bun -e '
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { curatedLinks } from "./src/db/schema/news";
import { createPreferredPostgresSocket } from "./src/db/postgres-connection";

const prodUrl = process.env.DATABASE_URL_PROD;
if (!prodUrl) throw new Error("DATABASE_URL_PROD is required");

const payload = {
  title: "YOUR_TITLE",
  url: "YOUR_URL",
  source: "SOURCE_NAME",
  date: new Date("YYYY-MM-DD"),
  description: "OPTIONAL_DESCRIPTION",
  category: "x_post",
  featured: false,
};

const sql = postgres(prodUrl, {
  max: 1,
  socket: () => createPreferredPostgresSocket(prodUrl),
});

try {
  const db = drizzle(sql, { schema: { curatedLinks } });
  const existing = await db.select().from(curatedLinks).where(eq(curatedLinks.url, payload.url));

  if (existing.length) {
    console.log(JSON.stringify({ status: "exists", existing }, null, 2));
  } else {
    const created = await db.insert(curatedLinks).values(payload).returning();
    console.log(JSON.stringify({ status: "created", created }, null, 2));
  }
} finally {
  await sql.end({ timeout: 5 });
}
'
```

## Image Upload Flow

When a new image is needed (not already in investments):

### Option 1: Download and Upload

```bash
# 1. Download image
curl -L "IMAGE_URL" -o /tmp/company-logo.jpg

# 2. Upload to R2 (requires R2 env vars)
bun -e "
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createId } from '@paralleldrive/cuid2';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT?.replace(/\\/dcbuilder-images$/, ''),
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const buffer = await Bun.file('/tmp/company-logo.jpg').arrayBuffer();
const key = 'news/' + createId() + '.jpg';

await r2.send(new PutObjectCommand({
  Bucket: 'dcbuilder-images',
  Key: key,
  Body: Buffer.from(buffer),
  ContentType: 'image/jpeg',
  CacheControl: 'public, max-age=31536000, immutable',
}));

console.log('Uploaded:', process.env.R2_PUBLIC_URL + '/' + key);
"
```

### Option 2: Use Existing Investment Logo

Most portfolio companies already have logos. Check:
```bash
ls public/images/investments/
```

Use path format: `/images/investments/company-name.jpg`

## Categories Reference

| Value | Display | Use For |
|-------|---------|---------|
| `x_post` | X Post | Twitter/X posts |
| `crypto` | Crypto | Cryptocurrency news |
| `ai` | AI | AI/ML content |
| `infrastructure` | Infrastructure | Blockchain infra |
| `defi` | DeFi | DeFi protocols |
| `research` | Research | Papers, research |
| `product` | Product | Product launches |
| `funding` | Funding | Fundraising news |
| `general` | General | Other news |

## Verification

After adding, verify the item exists in both environments:

```bash
# Local/runtime announcements
curl -s "http://localhost:3000/api/v1/news/announcements?limit=1" | jq .

# Local/runtime curated links
curl -s "http://localhost:3000/api/v1/news/curated?limit=1" | jq .

# Production direct DB verification should query DATABASE_URL_PROD by URL
# using the same pattern as the production duplicate-check script above.
```

## Common Examples

### X Post from Portfolio Company
```bash
bun -e "
import { db, announcements } from './src/db';
await db.insert(announcements).values({
  title: 'Product launch announcement',
  url: 'https://x.com/company/status/123456',
  company: 'Company',
  companyLogo: '/images/investments/company.jpg',
  platform: 'x',
  date: new Date(),
  category: 'x_post',
}).returning().then(r => console.log(JSON.stringify(r, null, 2)));
process.exit(0);
"
```

### Article from Individual
```bash
bun -e "
import { db, curatedLinks } from './src/db';
await db.insert(curatedLinks).values({
  title: 'Interesting article title',
  url: 'https://example.com/article',
  source: 'Author Name',
  date: new Date(),
  category: 'research',
}).returning().then(r => console.log(JSON.stringify(r, null, 2)));
process.exit(0);
"
```

## Additional Resources

### Reference Files
- **`references/schemas.md`** - Detailed field schemas and validation rules

### Scripts
- **`scripts/add-curated-link.ts`** - Add curated link via CLI flags (`--dry-run` supported)
