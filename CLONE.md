# Clone & Setup Guide

This guide walks you through replicating this project for your own personal site or portfolio.

## Prerequisites

Before starting, ensure you have:

- **Bun** (v1.0+): Install from [bun.sh](https://bun.sh)
- **PostgreSQL** (v15+): Local or hosted (Supabase, Neon, Railway, etc.)
- **Cloudflare Account**: For R2 storage (optional but recommended)
- **PostHog Account**: For analytics (optional)
- **Git**: For version control

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/your-site.git
cd your-site

# 2. Install dependencies
bun install

# 3. Copy environment template and configure
cp .env.example .env.local
# Edit .env.local with your values

# 4. Push database schema
bunx drizzle-kit push

# 5. Start development server
bun dev
```

## Detailed Setup

### 1. Database Setup

#### Option A: Local PostgreSQL

```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb your_site_db
```

Your connection string will be:
```
DATABASE_URL="postgresql://localhost:5432/your_site_db"
```

#### Option B: Hosted PostgreSQL (Recommended for Production)

Popular options:
- **Neon** (free tier): [neon.tech](https://neon.tech)
- **Supabase** (free tier): [supabase.com](https://supabase.com)
- **Railway**: [railway.app](https://railway.app)
- **Vercel Postgres**: [vercel.com/storage/postgres](https://vercel.com/storage/postgres)

Get your connection string from your provider's dashboard.

#### Initialize Schema

```bash
# Push schema to database
bunx drizzle-kit push

# (Optional) Open Drizzle Studio to view/edit data
bunx drizzle-kit studio
```

### 2. Cloudflare R2 Setup (Image Storage)

R2 provides S3-compatible object storage with a generous free tier.

1. **Create R2 Bucket**
   - Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Go to R2 → Create bucket
   - Name: `your-site-images`
   - Location: Choose closest to your users

2. **Enable Public Access**
   - Bucket settings → Public access → Allow Access
   - Copy the public URL (e.g., `https://pub-xxx.r2.dev`)

3. **Create API Token**
   - R2 → Manage R2 API Tokens → Create API Token
   - Permissions: Object Read & Write
   - Specify bucket: your bucket name
   - Copy the Access Key ID and Secret Access Key

4. **Update R2 Configuration**

   Edit `src/lib/r2.ts` to use your R2 public URL:
   ```typescript
   export const R2_PUBLIC_URL = "https://pub-YOUR-BUCKET-ID.r2.dev";
   ```

### 3. PostHog Setup (Analytics)

PostHog provides product analytics with a generous free tier.

1. **Create PostHog Account**
   - Sign up at [posthog.com](https://posthog.com)
   - Create a new project

2. **Get API Keys**
   - Project Settings → Project API Key (for client-side)
   - Personal API Keys → Create new key (for server-side analytics API)

3. **Find Project ID**
   - Look at your PostHog URL: `us.posthog.com/project/YOUR_PROJECT_ID`

### 4. Environment Variables

Create `.env.local` with all required variables:

```bash
# ===================
# REQUIRED
# ===================

# Database - PostgreSQL connection string
DATABASE_URL="postgresql://user:password@host:5432/database"

# ===================
# OPTIONAL (but recommended)
# ===================

# Cloudflare R2 - Image storage
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="your-bucket-name"

# PostHog - Analytics
NEXT_PUBLIC_POSTHOG_KEY="phc_..."          # Client-side tracking
NEXT_PUBLIC_POSTHOG_HOST="https://us.posthog.com"
POSTHOG_PERSONAL_API_KEY="phx_..."         # Server-side API
POSTHOG_PROJECT_ID="12345"

# ===================
# ADMIN ACCESS
# ===================

# Generate with: openssl rand -hex 32
# Store this in the database via Drizzle Studio or a script
# The admin dashboard reads API keys from the database
```

### 5. Admin API Key Setup

The admin dashboard uses API key authentication stored in the database.

```bash
# Open Drizzle Studio
bunx drizzle-kit studio
```

In Drizzle Studio:
1. Navigate to `api_keys` table
2. Insert a new row:
   - `name`: "Admin"
   - `key`: Generate with `openssl rand -hex 32`
   - `permissions`: `["admin:read", "admin:write"]`

Save this key - you'll use it to log into the admin dashboard at `/admin`.

## Customization

### Branding

1. **Site Name/Bio**: Edit `src/app/page.tsx` and `src/app/about/page.tsx`
2. **Social Links**: Update in `src/app/about/page.tsx` and `src/components/Navbar.tsx`
3. **Colors**: Tailwind config in `tailwind.config.ts`

### Content Types

The database schema supports:

| Table | Purpose |
|-------|---------|
| `jobs` | Job listings (portfolio companies, network) |
| `candidates` | Candidate profiles for hiring |
| `investments` | Portfolio investments with tiers |
| `affiliations` | Work history/affiliations for About page |
| `curated_links` | Curated news/articles |
| `announcements` | Company announcements |
| `blog_posts` | Blog content (MDX) |
| `api_keys` | Admin authentication |

To add/modify fields, edit `src/db/schema/*.ts` and run:
```bash
bunx drizzle-kit push
```

### Features to Enable/Disable

- **Jobs Board**: Remove `/app/jobs/` directory
- **Candidates**: Remove `/app/candidates/` directory
- **Blog**: Remove `/app/blog/` directory
- **News**: Remove `/app/news/` directory
- **Analytics**: Skip PostHog configuration (will show "-" in dashboard)

### Adding New Pages

1. Create directory in `src/app/your-page/`
2. Add `page.tsx` with your component
3. Update `Navbar.tsx` if adding to navigation

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
vercel
```

Add environment variables in Vercel Dashboard → Settings → Environment Variables.

### Other Platforms

Works with any platform supporting Next.js:
- **Netlify**: Add `netlify.toml` for build settings
- **Railway**: Auto-detects Next.js
- **Fly.io**: Use `fly launch` with Dockerfile
- **Self-hosted**: Run `bun run build && bun run start`

## Project Structure

```
├── src/
│   ├── app/                    # Pages and API routes
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/v1/            # REST API
│   │   ├── blog/              # Blog pages
│   │   ├── candidates/        # Candidates directory
│   │   ├── jobs/              # Jobs board
│   │   ├── news/              # News aggregator
│   │   └── portfolio/         # Investment portfolio
│   ├── components/            # React components
│   │   ├── admin/             # Admin UI components
│   │   └── ...                # Shared components
│   ├── db/                    # Database
│   │   ├── index.ts           # Drizzle client
│   │   └── schema.ts          # Table definitions
│   └── lib/                   # Utilities
│       ├── r2.ts              # Cloudflare R2 helpers
│       ├── posthog-api.ts     # PostHog server API
│       └── ...                # Other utilities
├── content/
│   └── blog/                  # MDX blog posts
├── drizzle/                   # Generated migrations
└── public/                    # Static assets
```

## Troubleshooting

### Database Connection Errors
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/dbname`
- Check if database is accessible from your network
- For SSL: append `?sslmode=require` to connection string

### R2 Upload Failures
- Verify bucket exists and is public
- Check API token has write permissions
- Ensure `R2_PUBLIC_URL` matches your bucket's public URL

### PostHog Not Showing Data
- Check `POSTHOG_PERSONAL_API_KEY` is a Personal API key (not Project key)
- Verify `POSTHOG_PROJECT_ID` matches your project
- Analytics may take a few minutes to populate

### Admin Login Issues
- Verify API key exists in `api_keys` table
- Check key has `admin:read` permission
- Clear browser localStorage and try again

## Commands Reference

```bash
# Development
bun dev                      # Start dev server (port 3000)
bun run build               # Production build
bun run start               # Start production server

# Database
bunx drizzle-kit push       # Push schema changes
bunx drizzle-kit studio     # Open database GUI
bunx drizzle-kit generate   # Generate migration files

# Testing
bun run test                # Run Playwright tests
bunx playwright install     # Install browser binaries

# Utilities
bun run lint                # ESLint check
```

## Support

If you run into issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review error messages in browser console / terminal
3. For database issues, use `bunx drizzle-kit studio` to inspect data
