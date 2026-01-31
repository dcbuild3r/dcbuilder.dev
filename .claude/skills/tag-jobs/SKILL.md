---
name: tag-jobs
description: This skill should be used when the user asks to "tag jobs", "categorize jobs", "update job tags", "assign roles to jobs", "review job classifications", "fix job tagging", or wants to ensure all jobs have proper tags and role/department assignments. Iterates through ALL jobs systematically and suggests appropriate tags based on job title, company, and description.
---

# Tag Jobs Skill

Systematically review and tag all jobs in the database with appropriate tags and roles/departments.

## Quick Start

Run this skill when you need to:
- Tag new jobs that don't have tags yet
- Review existing job tags for accuracy
- Assign departments/roles to jobs missing them
- Batch update jobs with consistent tagging

## Workflow

### Step 1: Fetch Current Tags and Roles

First, get the available tags and roles from the database:

```bash
bun -e "
import { db, jobTags, jobRoles } from './src/db';
import { asc } from 'drizzle-orm';

const [tags, roles] = await Promise.all([
  db.select().from(jobTags).orderBy(asc(jobTags.label)),
  db.select().from(jobRoles).orderBy(asc(jobRoles.label)),
]);

console.log('=== AVAILABLE TAGS ===');
tags.forEach(t => console.log(\`  \${t.slug}: \${t.label} (\${t.color || 'no color'})\`));
console.log('\\n=== AVAILABLE ROLES ===');
roles.forEach(r => console.log(\`  \${r.slug}: \${r.label}\`));
process.exit(0);
"
```

### Step 2: Fetch All Jobs

Get all jobs that need review:

```bash
bun -e "
import { db, jobs } from './src/db';
import { desc } from 'drizzle-orm';

const allJobs = await db.select({
  id: jobs.id,
  title: jobs.title,
  company: jobs.company,
  department: jobs.department,
  tags: jobs.tags,
  description: jobs.description,
}).from(jobs).orderBy(desc(jobs.createdAt));

console.log(\`Found \${allJobs.length} jobs to review\\n\`);

allJobs.forEach((job, i) => {
  console.log(\`[\${i+1}] \${job.title} @ \${job.company}\`);
  console.log(\`    Department: \${job.department || '(none)'}\`);
  console.log(\`    Tags: \${job.tags?.join(', ') || '(none)'}\`);
  console.log('');
});
process.exit(0);
"
```

### Step 3: Analyze and Tag Each Job

For each job, analyze the title, company, and description to determine:

1. **Department/Role** (the `department` field): What function does this role serve?
   - Engineering, Design, Product, Marketing, Sales, Operations, etc.

2. **Tags** (the `tags` array): What characteristics describe this job?
   - Technology: `ai`, `ml`, `zkp`, `cryptography`, `rust`, `frontend`, `backend`, `fullstack`, `mobile`
   - Domain: `defi`, `protocol`, `infra`, `gaming`, `trading`, `mev`, `security`
   - Level: `entry-level`, `internship`, `leadership`, `management`
   - Ecosystem: `solana`, `monad-ecosystem`, `berachain-ecosystem`, `world`
   - Type: `research`, `design`, `bd`, `marketing`, `sales`, `legal`, `accounting`, `talent`

### Step 4: Update Jobs

Update a single job:

```bash
bun -e "
import { db, jobs } from './src/db';
import { eq } from 'drizzle-orm';

const [updated] = await db.update(jobs)
  .set({
    department: 'Engineering',
    tags: ['ai', 'ml', 'research', 'fullstack'],
  })
  .where(eq(jobs.id, 'JOB_ID_HERE'))
  .returning();

console.log('Updated:', updated.title);
process.exit(0);
"
```

Batch update multiple jobs:

```bash
bun -e "
import { db, jobs } from './src/db';
import { eq } from 'drizzle-orm';

const updates = [
  { id: 'job1', department: 'Engineering', tags: ['frontend', 'web3'] },
  { id: 'job2', department: 'Design', tags: ['design', 'product'] },
  // Add more...
];

for (const { id, ...data } of updates) {
  await db.update(jobs).set(data).where(eq(jobs.id, id));
  console.log(\`Updated: \${id}\`);
}

console.log(\`\\nUpdated \${updates.length} jobs\`);
process.exit(0);
"
```

## Tagging Guidelines

### Department Assignment

| Job Title Contains | Department |
|-------------------|------------|
| Engineer, Developer, SWE, SRE, DevOps | Engineering |
| Designer, UX, UI | Design |
| Product Manager, PM | Product |
| Marketing, Growth, Content | Marketing |
| Sales, Account Executive, SDR, BDR | Sales |
| BD, Business Development, Partnerships | Business Development |
| Research, Researcher, Scientist | Research |
| HR, People, Recruiter, Talent | Human Resources |
| Legal, Counsel, Compliance | Legal |
| Finance, Accountant, Controller | Finance |
| Operations, Ops, Office Manager | Operations |
| Community, Mod, Ambassador | Community |
| DevRel, Developer Advocate | Developer Relations |
| Support, Success, Help Desk | Support |
| CEO, CTO, CFO, COO, VP, Director, Head | Executive |
| Data, Analytics, BI | Data |
| Security, Infosec, Pentester | Security |

### Tag Assignment Rules

**By Title Keywords:**
- "AI", "Machine Learning", "ML", "LLM" → `ai`, `ml`
- "Solidity", "Smart Contract" → `protocol`, `defi`
- "ZK", "Zero Knowledge" → `zkp`, `cryptography`
- "Rust" → `rust`
- "Frontend", "React", "Vue" → `frontend`
- "Backend", "API", "Server" → `backend`
- "Full Stack", "Fullstack" → `fullstack`
- "Mobile", "iOS", "Android" → `mobile`
- "Security", "Audit" → `security`
- "Trading", "Quant" → `trading`
- "MEV" → `mev`
- "Infrastructure", "Platform" → `infra`
- "Research" → `research`

**By Company/Ecosystem:**
- Monad Foundation, Category Labs → `monad-ecosystem`
- Berachain → `berachain-ecosystem`
- Worldcoin, World ID → `world`
- Solana Labs, Solana Foundation → `solana`

**By Seniority:**
- "Junior", "Entry", "Associate", "New Grad" → `entry-level`
- "Intern" → `internship`
- "Senior", "Staff", "Principal" → (no special tag)
- "Lead", "Manager", "Director", "VP", "Head" → `leadership` or `management`

**Special Tags:**
- `hot` - Only for exceptional, high-priority roles (add manually)
- `top` - Only for featured positions (add manually)

## Verification

After tagging, verify changes:

```bash
bun -e "
import { db, jobs } from './src/db';
import { isNull, or, eq, sql } from 'drizzle-orm';

// Jobs without department
const noDept = await db.select({ count: sql\`count(*)\` })
  .from(jobs)
  .where(or(isNull(jobs.department), eq(jobs.department, '')));

// Jobs without tags
const noTags = await db.select({ count: sql\`count(*)\` })
  .from(jobs)
  .where(or(isNull(jobs.tags), eq(sql\`array_length(tags, 1)\`, sql\`0\`)));

console.log(\`Jobs without department: \${noDept[0].count}\`);
console.log(\`Jobs without tags: \${noTags[0].count}\`);
process.exit(0);
"
```

## Creating New Tags

If a job needs a tag that doesn't exist:

```bash
bun -e "
import { db, jobTags } from './src/db';

const [tag] = await db.insert(jobTags).values({
  slug: 'new-tag-slug',
  label: 'New Tag Label',
  color: 'blue', // blue, green, purple, red, amber, etc.
}).returning();

console.log('Created tag:', tag);
process.exit(0);
"
```

## Creating New Roles

If a department doesn't exist as a role:

```bash
bun -e "
import { db, jobRoles } from './src/db';

const [role] = await db.insert(jobRoles).values({
  slug: 'new-role-slug',
  label: 'New Role Label',
}).returning();

console.log('Created role:', role);
process.exit(0);
"
```

## Additional Resources

- **`references/tag-mapping.md`** - Detailed tag definitions and colors
- **`references/role-mapping.md`** - Department/role definitions
