# dcbuilder.dev Modernization Design

## Overview

Migrate the existing Next.js 11 / Chakra UI personal website to a modern stack while preserving content and improving maintainability.

## Stack

| Current                   | New                     |
| ------------------------- | ----------------------- |
| Next.js 11 (Pages Router) | Next.js 15 (App Router) |
| React 17                  | React 19                |
| Chakra UI 1.x             | Tailwind CSS 4          |
| TypeScript 4.5            | TypeScript 5            |

## Project Structure

```
dcbuilder.dev/
├── app/
│   ├── layout.tsx        # Root layout with theme provider
│   ├── page.tsx          # Home page
│   ├── about/
│   │   └── page.tsx
│   ├── portfolio/
│   │   └── page.tsx
│   └── globals.css       # Tailwind + CSS variables for theming
├── components/
│   ├── Navbar.tsx        # Navigation with theme toggle
│   ├── ThemeToggle.tsx   # Dark/light mode switcher
│   └── Footer.tsx        # Optional
├── data/
│   └── portfolio.ts      # Affiliations and investments data
├── public/
│   └── images/
│       └── kaneki.png
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

## Design Decisions

### Styling

-   Tailwind CSS with utility-first inline classes
-   No component library (CVA/clsx added only if needed)
-   CSS variables for theme colors

### Theming

-   System-based dark/light mode (respects OS preference)
-   Manual toggle to override
-   `next-themes` library for implementation
-   Persistence via localStorage

### Typography

-   Clean sans-serif (Inter or system font stack)
-   Large, bold headings
-   18-20px base font size

### Color Palette

```
Light mode:
  - Background: white / neutral-50
  - Text: neutral-900
  - Accent: blue for links

Dark mode:
  - Background: neutral-950
  - Text: neutral-100
  - Accent: adjusted for contrast
```

## Pages

### Home (`/`)

-   Navbar with theme toggle
-   Hero section with kaneki.png image
-   Research interests list
-   Development skills list
-   Angel investing section with link to portfolio
-   Responsive: image left / content right on desktop, stacked on mobile

### About (`/about`)

-   Bio/background text
-   Social links (Twitter, GitHub, Email)
-   Clean prose layout with comfortable line length

### Portfolio (`/portfolio`)

-   Affiliations section (current roles) - logo grid
-   Investments section (angel investments) - logo grid
-   Responsive grid: 3-4 columns desktop, 2 columns mobile
-   Each logo links to company site

## Data Handling

Portfolio data stored as TypeScript arrays:

```ts
// data/portfolio.ts
export const affiliations = [
	{ name: "Company", logo: "/images/company.png", url: "https://..." },
];

export const investments = [
	{ name: "Startup", logo: "/images/startup.png", url: "https://..." },
];
```

## What's Removed

-   Chakra UI and @chakra-ui/\* packages
-   @emotion/\* packages
-   framer-motion
-   `--openssl-legacy-provider` Node flag
-   Cypress (can add Playwright later if needed)
-   Old Pages Router structure

## What's Preserved

-   All content (research areas, skills, bio, portfolio items)
-   Image assets (kaneki.png, company logos)
-   URL structure (`/`, `/about`, `/portfolio`)

## Migration Strategy

1. Create fresh Next.js 15 project with Tailwind
2. Set up theming (next-themes + CSS variables)
3. Build components (Navbar, ThemeToggle)
4. Migrate each page, preserving content
5. Copy over images/assets
6. Test both themes, all breakpoints
7. Remove old files, clean up
