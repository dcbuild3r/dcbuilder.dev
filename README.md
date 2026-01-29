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
- **Blog**: MDX posts with syntax highlighting and OG images
- **Portfolio**: Investment cards with tiers and status
- **Jobs**: Filterable job board with "hot" and "new" tags
- **Candidates**: Candidate directory with modal profiles
- **News**: Curated links and portfolio announcements

### Admin Dashboard (`/admin`)
- **Dashboard**: Site-wide analytics and quick actions
- **Blog Management**: Markdown editor with live preview
- **Jobs Management**: Full CRUD with analytics
- **Candidates Management**: Profile editor with skills
- **Investments Management**: Tier and status tracking
- **News Management**: Curated links and announcements
- **Affiliations Management**: About page affiliations

#### Admin Features
- **Colorful UI**: Section-specific color themes (blue for jobs, green for candidates, etc.)
- **Skeleton Loading**: Smooth table loading with animated placeholders
- **Column Filters**: Text search and multi-select for enumerable fields
- **Sortable Columns**: Click-to-sort with visual indicators
- **Pill-style Actions**: Colorful Edit/Delete buttons matching section colors
- **Quick Actions**: Color-coded shortcuts on dashboard
- **Image Upload**: R2 integration with live preview
- **Analytics**: Real-time PostHog data with skeleton loading
- **Pulsing Tags**: Animated HOT/TOP badges for featured items

## Architecture

### Data Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  API Routes │────▶│  PostgreSQL │
│  (React)    │◀────│  (Next.js)  │◀────│  (Drizzle)  │
└─────────────┘     └─────────────┘     └─────────────┘
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
│   └── ...              # Shared components
├── db/                  # Database schema and client
├── lib/                 # Utilities and helpers
└── data/                # Static data (legacy, being migrated)

content/
└── blog/                # MDX blog posts
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

# Run database migrations
bunx drizzle-kit push

# Open Drizzle Studio (DB GUI)
bunx drizzle-kit studio

# Run Playwright tests
bunx playwright install  # first time only
bun run test
```

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Cloudflare R2
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="..."
R2_PUBLIC_URL="..."

# PostHog Analytics
POSTHOG_PERSONAL_API_KEY="..."
POSTHOG_PROJECT_ID="..."

# Admin Authentication
ADMIN_API_KEY="..."  # Generate with: openssl rand -hex 32
```

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
Add MDX files to `content/blog/` with frontmatter:
```yaml
---
title: "Post Title"
date: "2024-01-15"
description: "Brief description"
source: "Mirror"  # optional
sourceUrl: "https://..."  # optional
---
```

## Deployment

The site deploys as a standard Next.js app. Ensure all environment variables are configured in your deployment platform.

## Contact

Telegram: [@dcbuilder](https://t.me/dcbuilder)
