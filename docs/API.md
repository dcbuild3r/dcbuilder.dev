# API Documentation

## Overview

The API follows REST conventions with JSON request/response bodies. All endpoints are under `/api/v1/` except for utility endpoints.

## Authentication

Protected endpoints require an API key passed via the `x-api-key` header:

```bash
curl -H "x-api-key: YOUR_API_KEY" https://yoursite.com/api/v1/jobs
```

API keys are stored in the `api_keys` database table with associated permissions.

### Permission Scopes

| Scope | Description |
|-------|-------------|
| `admin:read` | Read admin data (analytics, unpublished posts) |
| `admin:write` | Upload files, manage all content |
| `jobs:write` | Create/update/delete jobs |
| `candidates:write` | Create/update/delete candidates |
| `investments:write` | Create/update/delete investments |
| `affiliations:write` | Create/update/delete affiliations |
| `news:write` | Create/update/delete news items |

## Response Format

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "total": 100,
    "limit": 20,
    "offset": 0
  }
}
```

### Error Response

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Missing or invalid fields |
| `INVALID_JSON` | 400 | Malformed JSON body |
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_KEY` | 409 | Resource already exists |
| `SLUG_EXISTS` | 409 | Blog slug already exists |
| `FK_CONSTRAINT` | 409 | Foreign key constraint violation |
| `DB_QUERY_ERROR` | 500 | Database query failed |
| `DB_INSERT_ERROR` | 500 | Database insert failed |
| `DB_UPDATE_ERROR` | 500 | Database update failed |
| `DB_DELETE_ERROR` | 500 | Database delete failed |

## Pagination

List endpoints support pagination via query parameters:

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `limit` | 100 | 500 | Number of items to return |
| `offset` | 0 | - | Number of items to skip |

Example: `/api/v1/jobs?limit=20&offset=40`

---

## Jobs

Manage job listings for portfolio companies and network.

### List Jobs

```
GET /api/v1/jobs
```

**Query Parameters:**
- `company` - Filter by company name
- `category` - Filter by category (`portfolio` | `network`)
- `featured` - Filter featured jobs (`true`)
- `limit` / `offset` - Pagination

**Response:** Array of job objects

### Get Job

```
GET /api/v1/jobs/:id
```

**Response:** Single job object

### Create Job

```
POST /api/v1/jobs
```

**Auth Required:** `jobs:write`

**Body:**
```json
{
  "title": "Senior Engineer",        // required
  "company": "Acme Corp",            // required
  "link": "https://...",             // required
  "category": "portfolio",           // required: "portfolio" | "network"
  "location": "New York",
  "remote": "Remote",                // "Remote" | "Hybrid" | "On-site"
  "type": "Full-time",               // "Full-time" | "Part-time" | "Contract"
  "salary": "$150k-200k",
  "department": "Engineering",
  "tags": ["Solidity", "TypeScript"],
  "featured": false,
  "description": "Job description...",
  "companyLogo": "https://...",
  "companyWebsite": "https://...",
  "companyX": "https://x.com/...",
  "companyGithub": "https://github.com/..."
}
```

### Update Job

```
PUT /api/v1/jobs/:id
```

**Auth Required:** `jobs:write`

**Body:** Partial job object (same fields as create)

### Delete Job

```
DELETE /api/v1/jobs/:id
```

**Auth Required:** `jobs:write`

---

## Candidates

Manage candidate profiles for the talent directory.

### List Candidates

```
GET /api/v1/candidates
```

**Query Parameters:**
- `available` - Filter by availability (`true` | `false`)
- `featured` - Filter featured candidates (`true`)
- `limit` / `offset` - Pagination

### Get Candidate

```
GET /api/v1/candidates/:id
```

### Create Candidate

```
POST /api/v1/candidates
```

**Auth Required:** `candidates:write`

**Body:**
```json
{
  "name": "Jane Doe",               // required
  "title": "Smart Contract Developer",
  "location": "Remote",
  "summary": "5+ years experience...",
  "skills": ["Solidity", "Rust", "TypeScript"],
  "experience": "5 years",
  "education": "BS Computer Science",
  "image": "https://...",
  "cv": "https://...",
  "featured": false,
  "available": true,
  "email": "jane@example.com",
  "telegram": "@janedoe",
  "calendly": "https://calendly.com/...",
  "x": "https://x.com/...",
  "github": "https://github.com/...",
  "linkedin": "https://linkedin.com/in/...",
  "website": "https://..."
}
```

### Update Candidate

```
PUT /api/v1/candidates/:id
```

**Auth Required:** `candidates:write`

### Delete Candidate

```
DELETE /api/v1/candidates/:id
```

**Auth Required:** `candidates:write`

---

## Investments

Manage portfolio investments.

### List Investments

```
GET /api/v1/investments
```

**Query Parameters:**
- `tier` - Filter by tier (`1` | `2` | `3` | `4`)
- `status` - Filter by status (`active` | `inactive` | `acquired`)
- `featured` - Filter featured (`true`)
- `limit` / `offset` - Pagination

### Get Investment

```
GET /api/v1/investments/:id
```

### Create Investment

```
POST /api/v1/investments
```

**Auth Required:** `investments:write`

**Body:**
```json
{
  "title": "Protocol Name",          // required
  "description": "Description...",
  "logo": "https://...",
  "imageUrl": "https://...",
  "tier": "1",                       // "1" | "2" | "3" | "4"
  "featured": false,
  "status": "active",                // "active" | "inactive" | "acquired"
  "website": "https://...",
  "x": "https://x.com/...",
  "github": "https://github.com/..."
}
```

### Update Investment

```
PUT /api/v1/investments/:id
```

**Auth Required:** `investments:write`

### Delete Investment

```
DELETE /api/v1/investments/:id
```

**Auth Required:** `investments:write`

---

## Affiliations

Manage work history and affiliations for the About page.

### List Affiliations

```
GET /api/v1/affiliations
```

**Query Parameters:**
- `limit` / `offset` - Pagination

### Get Affiliation

```
GET /api/v1/affiliations/:id
```

### Create Affiliation

```
POST /api/v1/affiliations
```

**Auth Required:** `affiliations:write`

**Body:**
```json
{
  "title": "Company Name",           // required
  "role": "Senior Engineer",         // required
  "dateBegin": "2020-01",
  "dateEnd": "2023-06",              // null for current
  "description": "Description...",
  "logo": "https://...",
  "imageUrl": "https://...",
  "website": "https://..."
}
```

### Update Affiliation

```
PUT /api/v1/affiliations/:id
```

**Auth Required:** `affiliations:write`

### Delete Affiliation

```
DELETE /api/v1/affiliations/:id
```

**Auth Required:** `affiliations:write`

---

## Blog

Manage blog posts with MDX content.

### List Blog Posts

```
GET /api/v1/blog
```

- **Public:** Returns only published posts
- **Authenticated (`admin:read`):** Returns all posts including unpublished

### Get Blog Post

```
GET /api/v1/blog/:slug
```

### Create Blog Post

```
POST /api/v1/blog
```

**Auth Required:** `admin:write`

**Body:**
```json
{
  "slug": "my-blog-post",            // required, lowercase alphanumeric + hyphens
  "title": "My Blog Post",           // required
  "content": "# Heading\n\nContent...", // required, MDX format
  "date": "2024-01-15",
  "description": "Brief description...",
  "source": "Mirror",                // optional source attribution
  "sourceUrl": "https://...",
  "image": "https://...",
  "published": true
}
```

### Update Blog Post

```
PUT /api/v1/blog/:slug
```

**Auth Required:** `admin:write`

### Delete Blog Post

```
DELETE /api/v1/blog/:slug
```

**Auth Required:** `admin:write`

---

## News

Manage curated links and company announcements.

### Curated Links

#### List Curated Links

```
GET /api/v1/news/curated
```

**Query Parameters:**
- `category` - Filter by category
- `featured` - Filter featured (`true`)
- `limit` / `offset` - Pagination (default limit: 50, max: 200)

#### Get Curated Link

```
GET /api/v1/news/curated/:id
```

#### Create Curated Link

```
POST /api/v1/news/curated
```

**Auth Required:** `news:write`

**Body:**
```json
{
  "title": "Article Title",          // required
  "url": "https://...",              // required
  "source": "Vitalik Buterin",       // required
  "date": "2024-01-15T00:00:00Z",    // required
  "category": "crypto",              // required
  "description": "Brief summary...",
  "featured": false
}
```

#### Update Curated Link

```
PUT /api/v1/news/curated/:id
```

**Auth Required:** `news:write`

#### Delete Curated Link

```
DELETE /api/v1/news/curated/:id
```

**Auth Required:** `news:write`

### Announcements

#### List Announcements

```
GET /api/v1/news/announcements
```

**Query Parameters:**
- `company` - Filter by company name
- `category` - Filter by category
- `featured` - Filter featured (`true`)
- `limit` / `offset` - Pagination (default limit: 50, max: 200)

#### Get Announcement

```
GET /api/v1/news/announcements/:id
```

#### Create Announcement

```
POST /api/v1/news/announcements
```

**Auth Required:** `news:write`

**Body:**
```json
{
  "title": "Announcement Title",     // required
  "url": "https://...",              // required
  "company": "Acme Protocol",        // required
  "platform": "x",                   // required: "x" | "blog" | "discord" | "github" | "other"
  "date": "2024-01-15T00:00:00Z",    // required
  "category": "crypto",              // required
  "companyLogo": "https://...",
  "description": "Brief summary...",
  "featured": false
}
```

#### Update Announcement

```
PUT /api/v1/news/announcements/:id
```

**Auth Required:** `news:write`

#### Delete Announcement

```
DELETE /api/v1/news/announcements/:id
```

**Auth Required:** `news:write`

---

## Utility Endpoints

### File Upload

```
POST /api/upload
```

**Auth Required:** `admin:write`

**Body:** `multipart/form-data`
- `file` - Image file (JPEG, PNG, GIF, WebP, SVG)
- `folder` - Target folder (default: "uploads")

**Limits:**
- Max size: 5MB
- Allowed types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`

**Response:**
```json
{
  "success": true,
  "url": "https://pub-xxx.r2.dev/uploads/abc123.jpg",
  "key": "uploads/abc123.jpg",
  "filename": "abc123.jpg",
  "size": 102400,
  "type": "image/jpeg"
}
```

### Autocomplete

```
GET /api/v1/autocomplete
```

Returns unique values for filtering (companies, locations, tags, etc.)

**Query Parameters:**
- `type` - Field to autocomplete (`company` | `location` | `tag` | etc.)

### Admin Analytics

```
GET /api/v1/admin/analytics
```

**Auth Required:** `admin:read`

**Query Parameters:**
- `type` - Specific analytics type (`jobs` | `candidates` | `blog` | `site`)

Returns PostHog analytics data including:
- Job apply clicks (7 days)
- Candidate profile views (7 days)
- Blog post views (7 days)
- Site-wide pageviews and unique visitors

---

## Hot Content Endpoints

Internal endpoints for tracking popular content. Returns 503 if PostHog is not configured.

### Hot Jobs

```
GET /api/hot-jobs
```

Returns job IDs with most apply clicks in the last 7 days.

### Hot Candidates

```
GET /api/hot-candidates
```

Returns candidate IDs with most profile views in the last 7 days.

### Hot News

```
GET /api/hot-news
```

Returns news IDs with most clicks in the last 7 days.
