---
name: add-job
description: Use when the user asks to "add job", "post job", "create job listing", "add a position", "post a role", "add job opening", "list a job", "add candidate to jobs board", or mentions adding someone looking for work to the jobs section.
---

# Add Job Skill

This skill adds job listings to the dcbuilder.dev jobs board. It handles:
- Job details (title, company, location, salary, etc.)
- Social links (company website, X/Twitter, GitHub)
- Image uploads (company logo from URL or local file → R2)
- CV/resume handling (local PDF → R2 upload, or external URL)
- Automatic tag assignment based on context

## Workflow

### Step 1: Gather Job Information

Collect the following information from the user:

**Required:**
- `title` - Job title (e.g., "Senior Software Engineer")
- `company` - Company name
- `link` - Job posting URL or application link
- `category` - Either "portfolio" (portfolio companies) or "network" (network companies)

**Optional but recommended:**
- `location` - Physical location (e.g., "San Francisco, CA")
- `remote` - Remote policy: "Remote", "Hybrid", or "On-site"
- `type` - Employment type: "Full-time", "Part-time", or "Contract"
- `salary` - Salary range (e.g., "$150k - $200k" or "Competitive")
- `department` - Role category (see references/role-mapping.md)
- `description` - Job description text
- `responsibilities` - List of job responsibilities
- `qualifications` - List of required qualifications
- `benefits` - List of benefits offered

**Company socials:**
- `companyWebsite` - Company website URL
- `companyX` - X/Twitter handle (just the handle, e.g., "@company" or "company")
- `companyGithub` - GitHub organization name or URL

**Candidate socials (when adding candidates):**
- `x` - X/Twitter handle or URL
- `telegram` - Telegram handle or URL
- `github` - GitHub username or URL
- `linkedin` - LinkedIn profile URL
- `website` - Personal website URL
- `email` - Email address

**Assets:**
- `companyLogo` - Logo image (URL or local file path)
- `cv` - CV/resume (local PDF path or URL)

### Step 2: Normalize Social URLs

**IMPORTANT:** Always normalize social handles to full URLs before storing in the database.

| Platform | Input Examples | Normalized Output |
|----------|---------------|-------------------|
| X/Twitter | `@username`, `username`, `x.com/username`, `twitter.com/username` | `https://x.com/username` |
| Telegram | `@username`, `username`, `t.me/username` | `https://t.me/username` |
| GitHub | `username`, `github.com/username` | `https://github.com/username` |
| LinkedIn | `in/username`, `linkedin.com/in/username` | `https://linkedin.com/in/username` |

**Normalization rules:**
1. Remove `@` prefix if present
2. If input is just a username (no domain), prepend the appropriate base URL
3. If input already has the domain, ensure it uses `https://` protocol
4. For X/Twitter, always use `x.com` (not `twitter.com`)

**Examples:**
- `@ciefa_eth` → `https://x.com/ciefa_eth` (for X)
- `ciefa_eth` → `https://t.me/ciefa_eth` (for Telegram)
- `ciefa` → `https://github.com/ciefa` (for GitHub)
- `twitter.com/user` → `https://x.com/user`

### Step 3: Handle Company Logo

If a company logo is provided:

#### Option A: Logo is a URL (external)
Download and upload to R2:

```bash
# Download the image first
curl -L "https://example.com/logo.png" -o /tmp/company-logo.png

# Then upload to R2
bun -e "
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createId } from '@paralleldrive/cuid2';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT?.replace(/\/dcbuilder-images$/, ''),
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const file = Bun.file('/tmp/company-logo.png');
const buffer = await file.arrayBuffer();
const ext = 'png'; // Adjust based on actual file type
const key = 'jobs/logos/' + createId() + '.' + ext;

await r2.send(new PutObjectCommand({
  Bucket: 'dcbuilder-images',
  Key: key,
  Body: Buffer.from(buffer),
  ContentType: 'image/' + ext,
  CacheControl: 'public, max-age=31536000, immutable',
}));

console.log('Logo URL:', process.env.R2_PUBLIC_URL + '/' + key);
"
```

#### Option B: Logo is a local file
Upload directly to R2:

```bash
bun -e "
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createId } from '@paralleldrive/cuid2';
import { extname } from 'path';

const localPath = '/path/to/logo.png'; // Replace with actual path
const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT?.replace(/\/dcbuilder-images$/, ''),
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const file = Bun.file(localPath);
const buffer = await file.arrayBuffer();
const ext = extname(localPath).slice(1) || 'png';
const key = 'jobs/logos/' + createId() + '.' + ext;

await r2.send(new PutObjectCommand({
  Bucket: 'dcbuilder-images',
  Key: key,
  Body: Buffer.from(buffer),
  ContentType: file.type || 'image/' + ext,
  CacheControl: 'public, max-age=31536000, immutable',
}));

console.log('Logo URL:', process.env.R2_PUBLIC_URL + '/' + key);
"
```

### Step 4: Handle CV/Resume

If a CV is provided:

#### Option A: CV is a local PDF file
Upload to R2:

```bash
bun -e "
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createId } from '@paralleldrive/cuid2';

const localPath = '/path/to/resume.pdf'; // Replace with actual path
const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT?.replace(/\/dcbuilder-images$/, ''),
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const file = Bun.file(localPath);
const buffer = await file.arrayBuffer();
const key = 'jobs/cvs/' + createId() + '.pdf';

await r2.send(new PutObjectCommand({
  Bucket: 'dcbuilder-images',
  Key: key,
  Body: Buffer.from(buffer),
  ContentType: 'application/pdf',
  CacheControl: 'public, max-age=31536000, immutable',
}));

console.log('CV URL:', process.env.R2_PUBLIC_URL + '/' + key);
"
```

#### Option B: CV is already online
Use the URL directly - no upload needed. Just store the URL.

### Step 5: Assign Tags

Based on the job information, assign appropriate tags. Consider:

**From job title:**
- "Engineer" → look for `engineering` department + tech tags
- "Designer" → `design` department
- "Product Manager" → `product` department
- "Marketing" → `marketing` department + `marketing` tag

**From description/qualifications:**
- Mentions AI/ML → `ai`, `ml` tags
- Mentions Rust → `rust` tag
- Mentions React/Frontend → `frontend` tag
- Mentions Solidity/Web3 → `web3` tag
- Mentions DeFi → `defi` tag
- Mentions ZK/Zero-knowledge → `zkp` tag
- Mentions Security → `security` tag

**From company/ecosystem:**
- Monad-related → `monad-ecosystem`
- Berachain-related → `berachain-ecosystem`
- Solana-related → `solana`

**From seniority indicators:**
- "Senior", "Staff", "Principal" → no special tag (default)
- "Junior", "Entry" → `entry-level`
- "Intern" → `internship`
- "Head of", "VP", "Director", "Lead" → `leadership`
- "Manager" → `management`

See `references/tag-mapping.md` for the full list of available tags.

### Step 6: Insert Job/Candidate into Database

```bash
bun -e "
import { db, jobs } from './src/db';

const [newJob] = await db.insert(jobs).values({
  title: 'REPLACE_TITLE',
  company: 'REPLACE_COMPANY',
  link: 'REPLACE_LINK',
  category: 'REPLACE_CATEGORY', // 'portfolio' or 'network'

  // Optional fields - remove if not provided
  location: 'REPLACE_LOCATION',
  remote: 'REPLACE_REMOTE', // 'Remote' | 'Hybrid' | 'On-site'
  type: 'REPLACE_TYPE', // 'Full-time' | 'Part-time' | 'Contract'
  salary: 'REPLACE_SALARY',
  department: 'REPLACE_DEPARTMENT',
  tags: ['tag1', 'tag2'], // Array of tag slugs
  featured: false,
  description: 'REPLACE_DESCRIPTION',
  responsibilities: ['resp1', 'resp2'],
  qualifications: ['qual1', 'qual2'],
  benefits: ['benefit1', 'benefit2'],
  companyLogo: 'REPLACE_LOGO_URL', // R2 URL from Step 2
  companyWebsite: 'REPLACE_WEBSITE',
  companyX: 'REPLACE_X_HANDLE',
  companyGithub: 'REPLACE_GITHUB',
}).returning();

console.log('Created job:', JSON.stringify(newJob, null, 2));
process.exit(0);
"
```

### Step 7: Verify

After insertion, verify the job was created:

```bash
bun -e "
import { db, jobs } from './src/db';
import { desc } from 'drizzle-orm';

const latest = await db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(1);
console.log('Latest job:', JSON.stringify(latest[0], null, 2));
process.exit(0);
"
```

## Quick Reference

### Department/Role Options
See `references/role-mapping.md`

### Tag Options
See `references/tag-mapping.md`

### R2 Paths
- Company logos: `jobs/logos/{cuid}.{ext}`
- CVs/Resumes: `jobs/cvs/{cuid}.pdf`

### Environment Variables Required
- `R2_ENDPOINT` - Cloudflare R2 endpoint
- `R2_ACCESS_KEY_ID` - R2 access key
- `R2_SECRET_ACCESS_KEY` - R2 secret key
- `R2_PUBLIC_URL` - Public URL for R2 bucket (https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev)

## Examples

### Example 1: Basic Job Posting
```
User: Add a job for Senior Rust Engineer at Monad, remote, $180k-$220k
```
→ Create job with:
- title: "Senior Rust Engineer"
- company: "Monad"
- remote: "Remote"
- salary: "$180k - $220k"
- department: "engineering"
- tags: ["rust", "monad-ecosystem", "backend"]
- category: "portfolio"

### Example 2: Job with Logo and CV
```
User: Add job for me - looking for frontend role, here's my CV at ~/Documents/resume.pdf and logo from https://example.com/logo.png
```
→ Upload logo from URL to R2, upload PDF to R2, create job with both links

### Example 3: Network Company Job
```
User: Add a design position at Figma - they're hiring a Senior Product Designer
```
→ Create job with:
- category: "network" (Figma is not a portfolio company)
- department: "design"
- tags: ["design"]
