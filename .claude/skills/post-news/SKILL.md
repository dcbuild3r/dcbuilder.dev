---
name: post-news
description: This skill should be used when the user asks to "add news", "post news", "add an X post to news", "add tweet to news", "add announcement", "add curated link", "post to news feed", "share on news", "add article to news", or mentions adding content to the dcbuilder.dev news section. Provides workflows for adding announcements (portfolio company posts with logos) and curated links (external content) with optional R2 image upload.
---

# Post News Skill

Add news items to the dcbuilder.dev news feed. Supports two types: **announcements** (company posts with logos) and **curated links** (external content without logos).

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

### Step 3: Insert via Database

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

## Workflow: Add Curated Link

For external articles, individual posts, or content not from portfolio companies.

### Step 1: Gather Information

Required fields:
- **title**: Post/article title
- **url**: Full URL
- **source**: Author name or publication (e.g., "Vitalik Buterin", "Paradigm")
- **date**: Publication date (YYYY-MM-DD)
- **category**: `x_post`, `crypto`, `ai`, `research`, etc.

### Step 2: Insert via Database

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

After adding, verify the item exists:

```bash
# For announcements
curl -s "http://localhost:3000/api/v1/news/announcements?limit=1" | jq .

# For curated links
curl -s "http://localhost:3000/api/v1/news/curated?limit=1" | jq .
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
- **`scripts/add-announcement.ts`** - Add announcement via JSON
- **`scripts/add-curated-link.ts`** - Add curated link via JSON
- **`scripts/download-image.ts`** - Download image from URL
- **`scripts/upload-to-r2.ts`** - Upload image to R2
