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

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Bun runtime

## Project Structure

- `src/app/` - Next.js app router pages
- `src/components/` - React components
- `src/data/` - Static data (jobs.ts, candidates.ts, investments.ts)
- `public/images/` - Static images (companies, candidates, investments)
- `scripts/` - Utility scripts for data management

## Code Style

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Tailwind for styling (no CSS modules)
- Keep data in typed arrays in src/data/
