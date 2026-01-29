# API Documentation

Base URL: `https://dcbuilder.dev/api/v1`

## Authentication

Write operations require an API key passed in the `x-api-key` header.

```bash
curl -H "x-api-key: YOUR_API_KEY" https://dcbuilder.dev/api/v1/jobs
```

Read operations are public and do not require authentication.

### Permission Scopes

| Scope | Description |
|-------|-------------|
| `jobs:read` | Read jobs |
| `jobs:write` | Create, update, delete jobs |
| `candidates:read` | Read candidates |
| `candidates:write` | Create, update, delete candidates |
| `investments:read` | Read investments |
| `investments:write` | Create, update, delete investments |
| `news:read` | Read curated links and announcements |
| `news:write` | Create, update, delete news items |
| `affiliations:read` | Read affiliations |
| `affiliations:write` | Create, update, delete affiliations |
| `*` | All permissions |

---

## Response Format

All responses follow this structure:

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

Error responses:

```json
{
  "error": "Error message"
}
```

---

## Jobs

### List Jobs

```
GET /jobs
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `company` | string | Filter by company name (exact match) |
| `category` | string | Filter by category: `portfolio` or `network` |
| `featured` | boolean | Filter by featured status |
| `limit` | integer | Number of results (default: 100) |
| `offset` | integer | Pagination offset (default: 0) |

**Response:**

```json
{
  "data": [
    {
      "id": "clx123...",
      "title": "Senior Engineer",
      "company": "Acme Inc",
      "companyLogo": "https://...",
      "link": "https://...",
      "location": "San Francisco, CA",
      "remote": "Remote",
      "type": "Full-time",
      "salary": "$150k-$200k",
      "department": "Engineering",
      "tags": ["rust", "blockchain", "zk"],
      "category": "portfolio",
      "featured": true,
      "description": "...",
      "companyWebsite": "https://...",
      "companyX": "https://x.com/...",
      "companyGithub": "https://github.com/...",
      "createdAt": "2024-01-15T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  ],
  "meta": { "total": 50, "limit": 100, "offset": 0 }
}
```

### Get Job

```
GET /jobs/:id
```

**Response:** Single job object.

### Create Job

```
POST /jobs
```

**Required Fields:**
- `title` (string)
- `company` (string)
- `link` (string)
- `category` (string): `portfolio` or `network`

**Optional Fields:**
- `companyLogo` (string)
- `location` (string)
- `remote` (string): `Remote`, `Hybrid`, or `On-site`
- `type` (string): `Full-time`, `Part-time`, or `Contract`
- `salary` (string)
- `department` (string)
- `tags` (string[])
- `featured` (boolean)
- `description` (string)
- `responsibilities` (string[])
- `qualifications` (string[])
- `benefits` (string[])
- `companyWebsite` (string)
- `companyX` (string)
- `companyGithub` (string)

**Example:**

```bash
curl -X POST https://dcbuilder.dev/api/v1/jobs \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "title": "Senior Engineer",
    "company": "Acme Inc",
    "link": "https://acme.com/jobs/123",
    "category": "portfolio",
    "tags": ["rust", "blockchain"],
    "featured": true
  }'
```

### Update Job

```
PUT /jobs/:id
```

Pass any fields to update. Same fields as POST.

### Delete Job

```
DELETE /jobs/:id
```

---

## Candidates

### List Candidates

```
GET /candidates
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `available` | boolean | Filter by availability |
| `featured` | boolean | Filter by featured status |
| `limit` | integer | Number of results (default: 100) |
| `offset` | integer | Pagination offset (default: 0) |

**Response:**

```json
{
  "data": [
    {
      "id": "clx123...",
      "name": "Alice Smith",
      "title": "Full Stack Engineer",
      "location": "New York, NY",
      "summary": "Experienced engineer...",
      "skills": ["TypeScript", "React", "Node.js"],
      "experience": "5-10",
      "education": "MIT",
      "image": "https://...",
      "cv": "https://...",
      "featured": true,
      "available": true,
      "email": "alice@example.com",
      "telegram": "@alice",
      "calendly": "https://calendly.com/alice",
      "x": "https://x.com/alice",
      "github": "https://github.com/alice",
      "linkedin": "https://linkedin.com/in/alice",
      "website": "https://alice.dev",
      "createdAt": "2024-01-15T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  ],
  "meta": { "total": 25, "limit": 100, "offset": 0 }
}
```

### Get Candidate

```
GET /candidates/:id
```

### Create Candidate

```
POST /candidates
```

**Required Fields:**
- `name` (string)

**Optional Fields:**
- `title` (string)
- `location` (string)
- `summary` (string)
- `skills` (string[])
- `experience` (string): `0-1`, `1-3`, `3-5`, `5-10`, `10+`
- `education` (string)
- `image` (string)
- `cv` (string)
- `featured` (boolean)
- `available` (boolean, default: true)
- `email` (string)
- `telegram` (string)
- `calendly` (string)
- `x` (string)
- `github` (string)
- `linkedin` (string)
- `website` (string)

### Update Candidate

```
PUT /candidates/:id
```

### Delete Candidate

```
DELETE /candidates/:id
```

---

## Investments

### List Investments

```
GET /investments
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tier` | string | Filter by tier: `1`, `2`, `3`, or `4` |
| `status` | string | Filter by status: `active`, `inactive`, or `acquired` |
| `featured` | boolean | Filter by featured status |
| `limit` | integer | Number of results (default: 100) |
| `offset` | integer | Pagination offset (default: 0) |

**Response:**

```json
{
  "data": [
    {
      "id": "clx123...",
      "title": "Protocol Labs",
      "description": "Decentralized storage...",
      "imageUrl": "https://...",
      "logo": "https://...",
      "tier": "1",
      "featured": true,
      "status": "active",
      "website": "https://...",
      "x": "https://x.com/...",
      "github": "https://github.com/...",
      "createdAt": "2024-01-15T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  ],
  "meta": { "limit": 100, "offset": 0 }
}
```

### Get Investment

```
GET /investments/:id
```

### Create Investment

```
POST /investments
```

**Required Fields:**
- `title` (string)

**Optional Fields:**
- `description` (string)
- `imageUrl` (string)
- `logo` (string)
- `tier` (string): `1`, `2`, `3`, or `4`
- `featured` (boolean)
- `status` (string): `active`, `inactive`, `acquired`
- `website` (string)
- `x` (string)
- `github` (string)

### Update Investment

```
PUT /investments/:id
```

### Delete Investment

```
DELETE /investments/:id
```

---

## News - Curated Links

### List Curated Links

```
GET /news/curated
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category |
| `featured` | boolean | Filter by featured status |
| `limit` | integer | Number of results (default: 50) |
| `offset` | integer | Pagination offset (default: 0) |

**Response:**

```json
{
  "data": [
    {
      "id": "clx123...",
      "title": "The Future of Ethereum",
      "url": "https://...",
      "source": "Vitalik Buterin",
      "date": "2024-01-15T00:00:00.000Z",
      "description": "Analysis of...",
      "category": "crypto",
      "featured": true,
      "createdAt": "2024-01-15T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  ],
  "meta": { "limit": 50, "offset": 0 }
}
```

### Get Curated Link

```
GET /news/curated/:id
```

### Create Curated Link

```
POST /news/curated
```

**Required Fields:**
- `title` (string)
- `url` (string)
- `source` (string)
- `date` (string, ISO 8601)
- `category` (string)

**Optional Fields:**
- `description` (string)
- `featured` (boolean)

### Update Curated Link

```
PUT /news/curated/:id
```

### Delete Curated Link

```
DELETE /news/curated/:id
```

---

## News - Announcements

### List Announcements

```
GET /news/announcements
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `company` | string | Filter by company |
| `platform` | string | Filter by platform: `x`, `blog`, `discord`, `github`, `other` |
| `featured` | boolean | Filter by featured status |
| `limit` | integer | Number of results (default: 50) |
| `offset` | integer | Pagination offset (default: 0) |

**Response:**

```json
{
  "data": [
    {
      "id": "clx123...",
      "title": "New Product Launch",
      "url": "https://...",
      "company": "Acme Inc",
      "companyLogo": "https://...",
      "platform": "blog",
      "date": "2024-01-15T00:00:00.000Z",
      "description": "Launching...",
      "category": "product",
      "featured": true,
      "createdAt": "2024-01-15T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  ],
  "meta": { "limit": 50, "offset": 0 }
}
```

### Get Announcement

```
GET /news/announcements/:id
```

### Create Announcement

```
POST /news/announcements
```

**Required Fields:**
- `title` (string)
- `url` (string)
- `company` (string)
- `platform` (string): `x`, `blog`, `discord`, `github`, `other`
- `date` (string, ISO 8601)
- `category` (string)

**Optional Fields:**
- `companyLogo` (string)
- `description` (string)
- `featured` (boolean)

### Update Announcement

```
PUT /news/announcements/:id
```

### Delete Announcement

```
DELETE /news/announcements/:id
```

---

## Affiliations

### List Affiliations

```
GET /affiliations
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Number of results (default: 100) |
| `offset` | integer | Pagination offset (default: 0) |

**Response:**

```json
{
  "data": [
    {
      "id": "clx123...",
      "title": "Ethereum Foundation",
      "role": "Advisor",
      "dateBegin": "2022-01",
      "dateEnd": null,
      "description": "Advising on...",
      "imageUrl": "https://...",
      "logo": "https://...",
      "website": "https://ethereum.org",
      "createdAt": "2024-01-15T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  ],
  "meta": { "limit": 100, "offset": 0 }
}
```

### Get Affiliation

```
GET /affiliations/:id
```

### Create Affiliation

```
POST /affiliations
```

**Required Fields:**
- `title` (string)
- `role` (string)

**Optional Fields:**
- `dateBegin` (string)
- `dateEnd` (string)
- `description` (string)
- `imageUrl` (string)
- `logo` (string)
- `website` (string)

### Update Affiliation

```
PUT /affiliations/:id
```

### Delete Affiliation

```
DELETE /affiliations/:id
```

---

## Analytics

### Get Dashboard Analytics

```
GET /admin/analytics
```

**Authentication Required:** Yes

Returns aggregated analytics from PostHog for the admin dashboard.

**Response:**

```json
{
  "pageviews": {
    "week": 1500,
    "month": 6000
  },
  "uniqueVisitors": {
    "week": 800,
    "month": 3200
  },
  "topPages": [
    { "path": "/", "views": 500 },
    { "path": "/jobs", "views": 300 }
  ]
}
```

---

## Error Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Missing or invalid fields |
| 401 | Unauthorized - Missing or invalid API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently no rate limiting is enforced. Please be respectful of server resources.

---

## Examples

### Fetch Featured Jobs

```bash
curl "https://dcbuilder.dev/api/v1/jobs?featured=true&category=portfolio"
```

### Create a Curated Link

```bash
curl -X POST https://dcbuilder.dev/api/v1/news/curated \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "title": "The Future of Web3",
    "url": "https://example.com/article",
    "source": "Vitalik Buterin",
    "date": "2024-01-15",
    "category": "crypto",
    "featured": true
  }'
```

### Update Job to Featured

```bash
curl -X PUT https://dcbuilder.dev/api/v1/jobs/clx123 \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"featured": true}'
```
