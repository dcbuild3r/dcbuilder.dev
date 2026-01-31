# News Data Schemas

## News Categories

Valid values for the `category` field:

| Category | Label | Use For |
|----------|-------|---------|
| `crypto` | Crypto | Cryptocurrency topics |
| `ai` | AI | Artificial intelligence |
| `infrastructure` | Infrastructure | Blockchain/Web3 infrastructure |
| `defi` | DeFi | Decentralized finance |
| `research` | Research | Academic/research papers |
| `product` | Product | Product launches |
| `funding` | Funding | Funding announcements |
| `general` | General | General news |
| `x_post` | X Post | X/Twitter posts |

## Announcement Schema

For company/portfolio announcements with logos.

```typescript
{
  title: string;           // Required: Announcement title
  url: string;             // Required: Link URL
  company: string;         // Required: Company name
  platform: string;        // Required: x | blog | discord | github | other
  date: string;            // Required: Date (YYYY-MM-DD)
  category: string;        // Required: See categories above
  companyLogo?: string;    // Optional: Logo URL (R2 or local path)
  description?: string;    // Optional: Summary text
  featured?: boolean;      // Optional: Spotlight flag (default: false)
}
```

**Platform values:**
- `x` - X/Twitter post
- `blog` - Blog post
- `discord` - Discord announcement
- `github` - GitHub release/discussion
- `other` - Other platforms

## Curated Link Schema

For external articles and posts without logos.

```typescript
{
  title: string;           // Required: Link title
  url: string;             // Required: Link URL
  source: string;          // Required: Author or publication name
  date: string;            // Required: Date (YYYY-MM-DD)
  category: string;        // Required: See categories above
  description?: string;    // Optional: Summary text
  featured?: boolean;      // Optional: Spotlight flag (default: false)
}
```

## When to Use Which Type

### Use Announcement when:
- Post is from a portfolio company
- A company logo should be displayed
- Content is official company communication

### Use Curated Link when:
- Post is from an individual (not a company)
- No logo is needed
- Sharing interesting external content

## Image Storage

### Local Images (investments folder)
Already uploaded to R2 via sync. Use path format:
```
/images/investments/company-name.jpg
```

### R2 Public URL
For images uploaded directly to R2:
```
https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/folder/filename.ext
```

### Investment Logos
Existing portfolio company logos are in `/images/investments/`:
- `lighter.jpg`
- `megaeth.png`
- `friend.jpg`
- etc.

Check `src/data/investments.ts` for the full list.
