# dcbuilder.dev

Personal site built with Next.js (App Router) for dcbuilder.eth. It includes a homepage, about page, blog (MDX), portfolio, jobs board, and candidates directory.

## Overview

- Home: brief focus areas and hero image.
- About: bio plus affiliations.
- Blog: MDX posts from `content/blog`, rendered server-side.
- Portfolio: investment cards from `src/data/investments.ts`.
- Jobs: filterable job board from `src/data/jobs.ts`.
- Candidates: filterable candidate directory with modal profiles from `src/data/candidates.ts`.

## How the site works

- Data sources: all structured data lives in `src/data/*.ts`. Update those files to change jobs, candidates, affiliations, and portfolio items.
- Blog: posts live in `content/blog/*.mdx`. Frontmatter is parsed by `gray-matter` in `src/lib/blog.ts`.
- MDX rendering: `next-mdx-remote` plus custom renderers in `src/components/MDXComponents.tsx`.
- Theming: `next-themes` toggles a `dark` class on `html`, with styles in `src/app/globals.css`.
- Open Graph images: generated with `next/og` in `src/app/**/opengraph-image.tsx`.
- Interactive UI: filters, tags, shuffles, and modals are client components in `src/components/*`.

## Packages

### Dependencies
- `next`: App Router framework.
- `react`, `react-dom`: UI runtime.
- `next-themes`: theme toggle with system support.
- `next-mdx-remote`: MDX rendering for blog posts.
- `gray-matter`: frontmatter parsing.

### Dev dependencies
- `typescript`: type checking.
- `eslint`, `eslint-config-next`: linting.
- `tailwindcss`, `@tailwindcss/postcss`: styling pipeline.
- `@types/node`, `@types/react`, `@types/react-dom`: TypeScript types.
- `@playwright/test`: end-to-end smoke tests.

## Commands (Bun)

Install dependencies:

```bash
bun install
```

Run the dev server:

```bash
bun dev
```

Build and run production:

```bash
bun run build
bun run start
```

Lint:

```bash
bun run lint
```

Run Playwright tests (first-time setup required):

```bash
bunx playwright install
bun run test
```

Playwright uses port 3001 by default; override with:

```bash
PORT=3000 bun run test
```

## Contributing / updating content

- Blog posts: add MDX files to `content/blog/` with frontmatter (`title`, `date`, `description`, optional `source`, `sourceUrl`).
- Jobs: update `src/data/jobs.ts`.
- Candidates: update `src/data/candidates.ts`.
- Portfolio: update `src/data/investments.ts`.
- Affiliations: update `src/data/affiliations.ts`.

## Contact

You can reach me on Telegram: `https://t.me/dcbuilder`.

## Notes

- This repo uses Bun (see `bun.lock`).
- The UI is built with TailwindCSS utility classes and custom components in `src/components`.
- The site is deployed as a standard Next.js app; no backend or database is required.
