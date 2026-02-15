# Database Environments: Supabase + Drizzle

This project uses three separate Supabase Postgres databases:

- `dev`: day-to-day local development
- `staging`: pre-production validation
- `prod`: production

## 1. Supabase Projects

Create three Supabase projects and copy each connection string:

- `DATABASE_URL_DEV`
- `DATABASE_URL_STAGING`
- `DATABASE_URL_PROD`

Use direct Postgres URLs for migrations. Keep these values private.

## 2. Local Environment Variables

Set these in your local `.env.local` (or shell):

```bash
DATABASE_URL=postgresql://...          # runtime URL for local app
DATABASE_URL_DEV=postgresql://...      # drizzle migrations target for dev
DATABASE_URL_STAGING=postgresql://...  # optional locally
DATABASE_URL_PROD=postgresql://...     # optional locally
```

Notes:

- `DATABASE_URL` is used by app runtime (`src/db/index.ts`).
- Migration scripts require explicit target (`--env=dev|staging|prod`).

## 3. Migration Workflow (Developer)

When schema changes:

1. Update Drizzle schema files under `src/db/schema/**`.
2. Generate migration files:

```bash
bun run db:generate
```

3. Apply locally:

```bash
bun run db:migrate:dev
```

4. Commit all migration artifacts (`drizzle/*.sql`, `drizzle/meta/*`).

## 4. GitHub Environments and Secrets

Create GitHub environments:

- `staging`
- `production`

Add secrets:

- In `staging` environment: `DATABASE_URL_STAGING`
- In `production` environment: `DATABASE_URL_PROD`

Recommended:

- Require reviewers for the `production` environment.
- Restrict who can trigger production workflow runs.

## 5. CI/CD Promotion

### CI (`.github/workflows/ci.yml`)

- Validates schema/migration sync (`db:check:migrations`).
- Applies migration files to CI database with `db:migrate:dev`.
- Runs typecheck, lint, unit tests, and e2e tests.

### Staging migration (`.github/workflows/db-migrate-staging.yml`)

- Runs on pushes to `master`.
- Applies migration files to staging database.

### Production migration (`.github/workflows/db-migrate-prod.yml`)

- Manual trigger only.
- Requires explicit confirmation string.
- Generates pre-migration `pg_dump` backup and uploads it as workflow artifact.
- Applies migration files to production database with `ALLOW_PROD_MIGRATION=true`.

## 6. Operational Rules

- Never use `drizzle-kit push` against shared/staging/prod databases.
- Use migration files as the source of truth.
- Always run staging migration before production migration.
- Treat production migration as a controlled release step.
