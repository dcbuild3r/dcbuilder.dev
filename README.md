# dcbuilder.dev

Personal site built with Next.js (App Router) for dcbuilder.eth. Features a homepage, about page, blog (MDX), portfolio, jobs board, candidates directory, and news aggregator with a full admin dashboard.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Runtime**: Bun
- **Database**: PostgreSQL (Drizzle ORM)
- **Storage**: Cloudflare R2 (images)
- **Analytics**: PostHog
- **Styling**: TailwindCSS
- **Language**: TypeScript

## Features

### Public Pages

- **Home**: Hero with focus areas and featured content
- **About**: Bio, affiliations, and social links
- **Blog**: MDX posts with syntax highlighting and dynamic OG images
- **Portfolio**: Investment cards with tiers, status, and category filtering
- **Jobs**: Filterable job board with HOT/TOP/NEW badges, modal details, and shareable URLs
- **Candidates**: Candidate directory with modal profiles, skill tags, and availability status
- **News**: Curated links and portfolio announcements
- **Newsletter**: Double opt-in subscriptions, segmented campaigns (`news`/`jobs`/`candidates`), and scheduled sends

### OpenGraph & Social Sharing

- **Dynamic OG Images**: Auto-generated preview images for jobs, candidates, and blog posts
- **Individual OG Images**: Each job/candidate has a unique OG image with:
  - Company logo or candidate photo
  - Title, skills/tags (ordered by relevance)
  - HOT/TOP/NEW badges in top-right corner
  - Branded dcbuilder.eth header
- **Modal URL Support**: Shareable URLs for modals (`/jobs?job=xxx`, `/candidates?candidate=xxx`)
- **Copy Link Button**: One-click sharing from job/candidate modals

### UI/UX Features

- **HOT Badge**: Orange gradient badge for high-demand items (analytics-driven or manual)
- **TOP Badge**: Purple gradient badge for featured/premium items
- **NEW Badge**: Blue badge for items created within 14 days
- **Responsive Modals**: Full-screen on mobile, centered dialog on desktop
- **Smart Truncation**: Long titles/names automatically truncate with ellipsis
- **Keyboard Navigation**: Escape to close, focus trapping in modals

### Admin Dashboard (`/admin`)

- **Dashboard**: Site-wide analytics and quick actions
- **Blog Management**: Markdown editor with live preview
- **Jobs Management**: Full CRUD with analytics
- **Candidates Management**: Profile editor with skills
- **Investments Management**: Tier and status tracking
- **News Management**: Curated links and announcements
- **Affiliations Management**: About page affiliations

#### Admin Features

- **Colorful UI**: Section-specific color themes (blue for jobs, green for candidates, amber for investments, etc.)
- **Skeleton Loading**: Smooth table loading with animated placeholders
- **Column Filters**: Text search and multi-select for enumerable fields
- **Sortable Columns**: Click-to-sort with visual indicators
- **Drag-to-Reorder**: Skills/tags ordered by relevance (reflected in OG images)
- **Pill-style Actions**: Colorful Edit/Delete buttons matching section colors
- **Quick Actions**: Color-coded shortcuts on dashboard
- **Image Upload**: R2 integration with live preview and validation
- **Analytics**: Real-time PostHog data with skeleton loading
- **Pulsing Tags**: Animated HOT/TOP badges for featured items
- **Batch Operations**: Multi-select for bulk updates

## Architecture

### Data Flow

```

┌─────────────┐     ┌─────────────┐     ┌───────────────┐     ┌─────────────┐
│   Client    │────▶│  API Routes │────▶│ Services Layer│────▶│  PostgreSQL │
│  (React)    │◀────│  (Next.js)  │◀────│ (Auth, R2...) │◀────│  (Drizzle)  │
└─────────────┘     └─────────────┘     └───────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  PostHog    │
                                        │ (Analytics) │
                                        └─────────────┘
```

### Directory Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── admin/           # Admin dashboard pages
│   ├── api/v1/          # REST API routes
│   └── ...              # Public pages
├── components/          # React components
│   ├── admin/           # Admin-specific components
│   ├── ui/              # Reusable UI primitives (Badge, Icons, SocialLinks)
│   └── ...              # Shared components
├── db/                  # Database configuration
│   ├── schema/          # Modular Drizzle schema definitions
│   └── index.ts         # DB client export
├── hooks/               # Custom React hooks (useHotCandidates, etc.)
├── services/            # Business logic & External clients (R2, PostHog, Auth)
└── lib/                 # Shared utilities and helpers
    ├── data.ts          # Shared data fetching (getJobById, getCandidateById, getBaseUrl)
    ├── shuffle.ts       # Deterministic shuffling and date utilities (isNew, isWithinDays)
    ├── utils.ts         # General utilities (cn for classnames)
    └── *-colors.ts      # Color mappings for skills, sources, tiers

tests/                   # E2E tests (Playwright)

docs/
├── API.md               # API documentation
└── openapi.yaml         # OpenAPI specification
```

## API Reference

See [API Documentation](./docs/API.md) for full endpoint documentation.

### Quick Reference

| Resource | Endpoint | Auth |
|----------|----------|------|
| Jobs | `/api/v1/jobs` | Read: Public, Write: API Key |
| Candidates | `/api/v1/candidates` | Read: Public, Write: API Key |
| Investments | `/api/v1/investments` | Read: Public, Write: API Key |
| Blog | `/api/v1/blog` | Read: Public, Write: API Key |
| News (Curated) | `/api/v1/news/curated` | Read: Public, Write: API Key |
| News (Announcements) | `/api/v1/news/announcements` | Read: Public, Write: API Key |
| Affiliations | `/api/v1/affiliations` | Read: Public, Write: API Key |
| Analytics | `/api/v1/admin/analytics` | API Key |

## Commands (Bun)

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Build for production
bun run build

# Start production server
bun run start

# Lint
bun run lint
# Note: Next.js v16 no longer ships a `next lint` command; use ESLint directly.

# Generate SQL migrations from schema changes
bun run db:generate

# Apply migration files (explicit target required)
bun run db:migrate:dev
bun run db:migrate:staging
ALLOW_PROD_MIGRATION=true bun run db:migrate:prod

# Open Drizzle Studio (DB GUI)
bun run db:studio

# Run Playwright tests
bunx playwright install  # first time only
bun run test
```

## Environment Variables

See [.env.example](./.env.example) for all configuration options.

```bash
# Runtime database URL (set per environment in your hosting platform)
DATABASE_URL="postgresql://..."

# Explicit migration targets (local + CI)
DATABASE_URL_DEV="postgresql://..."
DATABASE_URL_STAGING="postgresql://..."
DATABASE_URL_PROD="postgresql://..."

# Cloudflare R2 (image storage)
R2_ENDPOINT="https://ACCOUNT_ID.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="..."
R2_PUBLIC_URL="https://pub-xxx.r2.dev"

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
POSTHOG_PERSONAL_API_KEY="phx_..."
POSTHOG_PROJECT_ID="..."

# Newsletter delivery (Resend)
RESEND_API_KEY="re_..."
NEWSLETTER_FROM_EMAIL="newsletter@yourdomain.com"
NEWSLETTER_REPLY_TO="hello@yourdomain.com"

# Cron auth for /api/cron/* endpoints
CRON_SECRET="..."
```

### Weekly Newsletter Issue Automation

The workflow `.github/workflows/newsletter-issue-create.yml` runs every Monday at `14:00 UTC` and calls:

- `POST /api/cron/newsletter-issue-create`

Required GitHub environment secrets (recommended in `production` environment):

- `CRON_SECRET` (required)
- `CRON_BASE_URL` (optional, defaults to `https://dcbuilder.dev`)

## Database Environments (Supabase + Drizzle)

This repo now uses explicit environment targets for migrations:

1. `dev` (local development Supabase project)
2. `staging` (staging Supabase project)
3. `prod` (production Supabase project)

Promotion flow:

1. Generate and commit migration files in PRs (`bun run db:generate`)
2. Merge to `master` and run staging migration workflow
3. Verify staging
4. Run production migration workflow (manual + backup artifact + explicit confirmation)

Setup details are in `docs/database-environments.md`.

## Content Management

### Via Admin Dashboard (Recommended)

1. Navigate to `/admin`
2. Enter your API key
3. Use the dashboard to manage all content

### Via API

```bash
# Create a job
curl -X POST https://dcbuilder.dev/api/v1/jobs \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"title": "...", "company": "...", "link": "..."}'
```

### Blog Posts

Create blog posts via the admin dashboard or API. Posts use MDX format and support:

- Markdown with syntax highlighting
- Custom components
- Source attribution for republished content

```bash
# Create via API
curl -X POST https://yoursite.com/api/v1/blog \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "slug": "my-post",
    "title": "Post Title",
    "content": "# Heading\n\nContent...",
    "date": "2024-01-15"
  }'
```

## Deployment

The site deploys as a standard Next.js app. Ensure all environment variables are configured in your deployment platform.

## Cloning This Project

Want to create your own version? See [CLONE.md](./CLONE.md) for a complete setup guide covering:

- Database setup (local or hosted PostgreSQL)
- Cloudflare R2 configuration for image storage
- PostHog analytics integration
- Admin authentication setup
- Customization options

## Contact

Telegram: [@dcbuilder](https://t.me/dcbuilder)
