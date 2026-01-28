# API & Database Design for dcbuilder.dev

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable dynamic content management for jobs, candidates, and news via API.

**Architecture:** REST API backed by Supabase Postgres, queried via Drizzle ORM.

**Tech Stack:** Next.js API routes, Drizzle ORM, Supabase Postgres

---

## Architecture

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Admin UI  │  │  Telegram   │  │    CLI      │
│  (Next.js)  │  │    Bot      │  │   Tool      │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │   REST API      │
              │ /api/v1/jobs    │
              │ /api/v1/cand... │  ← API key auth for writes
              │ /api/v1/news    │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │    Drizzle      │  ← Type-safe query layer
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Supabase Postgres│  ← Hosted database
              └─────────────────┘
```

---

## Database Schema

### Jobs
| Column | Type | Notes |
|--------|------|-------|
| id | cuid | Primary key |
| title | text | Required |
| company | text | Required |
| companyLogo | text | URL, optional |
| link | text | Apply URL, required |
| location | text | Optional |
| remote | text | "Remote" / "Hybrid" / "On-site" |
| type | text | "Full-time" / "Part-time" / "Contract" |
| salary | text | Optional |
| department | text | Optional |
| tags | text[] | Array of tags |
| category | text | "portfolio" / "network" |
| featured | boolean | Default false |
| description | text | Long description, optional |
| companyWebsite | text | Optional |
| companyX | text | Optional |
| companyGithub | text | Optional |
| createdAt | timestamp | Auto |
| updatedAt | timestamp | Auto |

### Candidates
| Column | Type | Notes |
|--------|------|-------|
| id | cuid | Primary key |
| name | text | Required |
| title | text | Optional |
| location | text | Optional |
| summary | text | Bio/description |
| skills | text[] | Array |
| experience | text | Optional |
| education | text | Optional |
| image | text | URL |
| cv | text | URL |
| featured | boolean | Default false |
| available | boolean | Default true |
| email | text | Optional |
| telegram | text | Optional |
| calendly | text | Optional |
| x | text | Optional |
| github | text | Optional |
| linkedin | text | Optional |
| website | text | Optional |
| createdAt | timestamp | Auto |
| updatedAt | timestamp | Auto |

### Curated Links (News)
| Column | Type | Notes |
|--------|------|-------|
| id | cuid | Primary key |
| title | text | Required |
| url | text | Required |
| source | text | e.g., "Vitalik Buterin" |
| date | timestamp | Publication date |
| description | text | Optional |
| category | text | crypto/ai/infrastructure/etc |
| featured | boolean | Default false |
| createdAt | timestamp | Auto |
| updatedAt | timestamp | Auto |

### Announcements (News)
| Column | Type | Notes |
|--------|------|-------|
| id | cuid | Primary key |
| title | text | Required |
| url | text | Required |
| company | text | Portfolio company name |
| companyLogo | text | URL |
| platform | text | x/blog/discord/github/other |
| date | timestamp | Publication date |
| description | text | Optional |
| category | text | product/funding/etc |
| featured | boolean | Default false |
| createdAt | timestamp | Auto |
| updatedAt | timestamp | Auto |

### API Keys
| Column | Type | Notes |
|--------|------|-------|
| id | cuid | Primary key |
| name | text | e.g., "Admin", "CLI" |
| key | text | Hashed, unique |
| permissions | text[] | e.g., ["jobs:write"] |
| lastUsedAt | timestamp | Optional |
| createdAt | timestamp | Auto |

---

## API Endpoints

### Jobs
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/v1/jobs | Public | List with filters |
| GET | /api/v1/jobs/:id | Public | Get one |
| POST | /api/v1/jobs | API Key | Create |
| PUT | /api/v1/jobs/:id | API Key | Update |
| DELETE | /api/v1/jobs/:id | API Key | Delete |

### Candidates
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/v1/candidates | Public | List with filters |
| GET | /api/v1/candidates/:id | Public | Get one |
| POST | /api/v1/candidates | API Key | Create |
| PUT | /api/v1/candidates/:id | API Key | Update |
| DELETE | /api/v1/candidates/:id | API Key | Delete |

### News
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/v1/news | Public | All news combined |
| GET | /api/v1/news/curated | Public | Curated links |
| GET | /api/v1/news/announcements | Public | Announcements |
| POST | /api/v1/news/curated | API Key | Add link |
| POST | /api/v1/news/announcements | API Key | Add announcement |

### Auth
- Header: `x-api-key: <key>`
- Required for POST/PUT/DELETE
- GET endpoints are public

### Response Format
```json
{
  "data": [...],
  "meta": { "total": 287, "page": 1, "perPage": 50 }
}
```

---

## Phase 1 Implementation Tasks

### Task 1: Set Up Supabase Project
- Create Supabase project
- Get connection string
- Add DATABASE_URL to .env.local

### Task 2: Install Drizzle
- `bun add drizzle-orm postgres`
- `bun add -D drizzle-kit`
- Create drizzle.config.ts

### Task 3: Define Drizzle Schema
- Create `src/db/schema.ts` with all tables
- Generate migrations

### Task 4: Create Database Client
- Create `src/db/index.ts` with connection

### Task 5: Create API Key Auth Middleware
- Create `src/lib/api-auth.ts`
- Validate x-api-key header
- Check permissions

### Task 6: Create Jobs API Routes
- `src/app/api/v1/jobs/route.ts` (GET, POST)
- `src/app/api/v1/jobs/[id]/route.ts` (GET, PUT, DELETE)

### Task 7: Create Candidates API Routes
- `src/app/api/v1/candidates/route.ts`
- `src/app/api/v1/candidates/[id]/route.ts`

### Task 8: Create News API Routes
- `src/app/api/v1/news/route.ts` (GET all)
- `src/app/api/v1/news/curated/route.ts`
- `src/app/api/v1/news/announcements/route.ts`

### Task 9: Push Schema & Create Initial API Key
- Run migrations
- Insert initial API key for admin use

---

## Environment Variables

```bash
# Supabase Postgres
DATABASE_URL="postgresql://..."

# Admin API Key (generate: openssl rand -hex 32)
ADMIN_API_KEY="..."
```

---

## Future Phases (Not in Scope)

- Phase 2: Data migration script
- Phase 3: Admin UI
- Phase 4: CLI tool
- Phase 5: Telegram bot
