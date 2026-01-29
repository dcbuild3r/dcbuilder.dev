# Project Guidelines

## Package Manager

This project uses **bun** exclusively. Always use bun commands:

- `bun install` - Install dependencies
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bunx <package>` - Run packages (not npx)
- `bun run <script>` - Run scripts

Never use npm, npx, yarn, or pnpm.

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS
- Bun runtime
- PostgreSQL (Drizzle ORM)
- Cloudflare R2 (image storage)
- PostHog (analytics)

## Project Structure

- `src/app/` - Next.js app router pages
- `src/app/admin/` - Admin dashboard pages
- `src/app/api/v1/` - REST API routes
- `src/components/` - React components
- `src/components/admin/` - Admin-specific components (TableSkeleton, ImagePreview, etc.)
- `src/db/` - Database schema and client (Drizzle)
- `src/lib/` - Utilities (skill-colors, source-colors, r2, posthog-api)
- `content/blog/` - MDX blog posts
- `scripts/` - Utility scripts for data management

## Code Style

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Tailwind for styling (no CSS modules)
- Admin UI uses section-specific color themes (blue=jobs, green=candidates, amber=investments, etc.)
