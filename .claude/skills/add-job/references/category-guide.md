# Job Category Guide

Jobs have two categories: `portfolio` and `network`.

## Portfolio Companies

Jobs from companies that are in the investments database (portfolio companies).

**To check if a company is in the portfolio:**

```bash
bun -e "
import { db, investments } from './src/db';
import { ilike } from 'drizzle-orm';

const results = await db.select({ title: investments.title })
  .from(investments)
  .where(ilike(investments.title, '%COMPANY_NAME%'));

console.log(results.length > 0 ? 'Portfolio company' : 'Network company');
results.forEach(r => console.log('-', r.title));
process.exit(0);
"
```

**Or list all portfolio companies:**

```bash
bun -e "
import { db, investments } from './src/db';

const all = await db.select({ title: investments.title }).from(investments);
console.log('Portfolio companies:');
all.forEach(r => console.log('-', r.title));
process.exit(0);
"
```

## Network Companies

Jobs from companies that are NOT in the investments database. These are companies in the broader network/ecosystem that may be of interest to job seekers.

## Category Assignment Rules

1. **If user explicitly specifies**: Use their specified category
2. **If company is in investments table**: Use `portfolio`
3. **If company is NOT in investments table**: Use `network`
4. **If uncertain**: Ask the user which category to use

## Examples

| Company | Category | Reason |
|---------|----------|--------|
| Monad | `portfolio` | In investments table |
| Story | `portfolio` | In investments table |
| Uniswap | `network` | Not a portfolio company |
| Figma | `network` | Not a portfolio company |
| Paradigm | `network` | Not a portfolio company (unless invested) |
