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
- class-variance-authority (CVA) for component variants

## Project Structure

- `src/app/` - Next.js app router pages
- `src/app/admin/` - Admin dashboard pages
- `src/app/api/v1/` - REST API routes
- `src/components/` - React components
- `src/components/admin/` - Admin-specific components (TableSkeleton, ImagePreview, etc.)
- `src/components/ui/` - Reusable UI primitives (Badge, Icons, SocialLinks)
- `src/db/` - Database schema and client (Drizzle)
- `src/hooks/` - Custom React hooks (useHotCandidates, etc.)
- `src/lib/` - Utilities (utils, skill-colors, source-colors, r2, posthog-api)
- `content/blog/` - MDX blog posts
- `scripts/` - Utility scripts for data management
- `tests/` - E2E tests (Playwright)

## Code Style

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Tailwind for styling (no CSS modules)
- Use `cn()` from `@/lib/utils` for conditional class merging
- Use CVA (class-variance-authority) for component variants
- Use reusable icon components from `@/components/ui/icons`
- Admin UI uses section-specific color themes (blue=jobs, green=candidates, amber=investments, etc.)

## UI Components

### Badge Component (`src/components/ui/badge.tsx`)
CVA-based badge with variants: `default`, `hot`, `top`, `new`, `success`, `info`, `warning`, `muted`
Pre-configured: `HotBadge`, `TopBadge`, `NewBadge`

### Icons (`src/components/ui/icons.tsx`)
Reusable SVG icons: XIcon, GitHubIcon, LinkedInIcon, TelegramIcon, EmailIcon, WebsiteIcon, DocumentIcon, CloseIcon, ChevronDownIcon, ChevronRightIcon, LinkIcon, CheckIcon, SpinnerIcon

### SocialLinks (`src/components/ui/social-links.tsx`)
Reusable social links component with `compact` and `expanded` variants

## Custom Hooks

### useHotCandidates (`src/hooks/useHotCandidates.ts`)
Manages HOT/TOP candidate status from PostHog analytics. Returns:
- `isHotCandidate(candidate)` - Check if candidate is hot (analytics or tag)
- `hasTopTag(candidate)` - Check if candidate has TOP skill tag
- `showTopCardStyle(candidate)` - Check if TOP styling should show (waits for hot data to prevent flicker)
