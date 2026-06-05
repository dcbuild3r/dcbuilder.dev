---
name: dcbuilder-cli
description: Use when an agent needs to operate the dcbuilder CLI or local MCP server to read dcbuilder.dev news, jobs, candidates, run allowlisted queries, submit inbox messages/jobs/candidates, manage inbox review actions, create submit invites, refresh search indexes, or fetch the agent API schema.
---

# dcbuilder CLI

Use this skill whenever the user asks an agent to work through the `dcbuilder`
CLI or MCP server. The backend API is the source of truth; the CLI must not query
Postgres directly.

## Environment

Required for authenticated commands:

```bash
export DCBUILDER_API_URL=https://dcbuilder.dev
export DCBUILDER_API_TOKEN=...
```

Do not store `DCBUILDER_API_TOKEN` in repo files, config files, logs, or examples.
Use environment variables only. Public `submit message` may be allowed without a
token, but authenticated usage is preferred for trusted agents.

Default output is JSON. Use `--format table` or `--format markdown` only for
human-readable summaries.

## Read Commands

Fetch OpenAPI/schema metadata:

```bash
dcbuilder schema
```

Read recent news:

```bash
dcbuilder news --since 7d --limit 20
dcbuilder news --q "MegaETH" --format table
```

Read jobs:

```bash
dcbuilder jobs --remote --limit 25
dcbuilder jobs --company "ExampleCo" --location "Remote"
dcbuilder jobs --tag infra --tag ai
```

Read candidates:

```bash
dcbuilder candidates --availability open --location "Europe"
dcbuilder candidates --q "founding engineer"
```

Sensitive candidate fields are redacted unless the token has elevated scope such
as `agent:sensitive`, `admin:read`, or `*`.

## Query Command

Use structured filters as the canonical contract:

```bash
dcbuilder query --json '{"table":"jobs","filters":{"remote":true,"limit":10}}'
```

Natural-language query text is only client-side convenience. The CLI parses it
into deterministic filters before calling the API:

```bash
dcbuilder query "remote AI infra jobs from the last week"
```

Never expose raw SQL as a CLI/MCP interface.

## Submit Commands

Submissions create inbox items for review; they do not publish live jobs or
candidates by themselves.

```bash
dcbuilder submit message --json '{"subject":"Scout report","body":"Found 3 relevant jobs.","source":"agent","priority":"normal"}'
dcbuilder submit job --json '{"title":"Founding Engineer","company":"ExampleCo","link":"https://example.com/jobs/1","location":"Remote"}'
dcbuilder submit candidate --json '{"name":"Ada Example","headline":"AI infra engineer","location":"Berlin","skills":["Bun","MCP","Postgres"]}'
```

Use `submit message` when reporting findings, asking for approval, or requesting
help from Daniel. Prefer messages over direct approval unless the user explicitly
asked the agent to approve or publish.

## Inbox Review Commands

Admin-scoped tokens can review and manage inbox submissions:

```bash
dcbuilder inbox list --status pending --limit 20
dcbuilder inbox show <id>
dcbuilder inbox comment <id> "Looks good; please add salary range."
dcbuilder inbox approve <id> --json '{"note":"Approved by trusted agent"}'
dcbuilder inbox reject <id> --json '{"reason":"Duplicate submission"}'
```

Approval is create-only for job/candidate records. Do not approve, reject, or
comment unless the user's instruction clearly authorizes that action.

## Admin Commands

Create scoped submit invites:

```bash
dcbuilder invites create --json '{"allowedKinds":["job","candidate","message"],"submitterName":"Partner","submitterEmail":"partner@example.com","expiresInDays":30,"maxUses":5}'
```

The returned invite token is a secret. Do not print it in final answers unless
the user explicitly asked for the token value.

Refresh search snapshots / semantic index metadata:

```bash
dcbuilder search refresh --json '{"resources":["jobs","candidates","news"],"limit":100}'
```

If no embedding provider is configured, the backend should fall back cleanly to
filter/text search.

## MCP Server

Start the local stdio MCP server from the CLI package:

```bash
dcbuilder-mcp
```

The MCP server uses the same `DCBUILDER_API_URL` and `DCBUILDER_API_TOKEN`
environment variables. It exposes typed tools for:

- `dcbuilder_schema`
- reading news, jobs, and candidates
- generic allowlisted queries
- submitting messages, jobs, and candidates
- listing/showing/commenting/approving/rejecting inbox items
- creating scoped submit invites
- refreshing search indexes

Prefer MCP tools when the calling agent supports MCP natively. Prefer CLI
commands when producing a reproducible shell transcript or operating in a plain
terminal.

## Agent Workflow Pattern

1. Read with `news`, `jobs`, `candidates`, or `query`.
2. Analyze locally; do not send free-form prompts to the API as the canonical
   query contract.
3. Submit a concise inbox message with findings and recommended next action.
4. Only use inbox approval actions when the user explicitly delegates approval.

Example scout flow:

```bash
dcbuilder news --since 7d --limit 20 > /tmp/dcbuilder-news.json
dcbuilder jobs --remote --limit 25 > /tmp/dcbuilder-jobs.json
dcbuilder candidates --limit 25 > /tmp/dcbuilder-candidates.json
dcbuilder submit message --json '{"subject":"Weekly opportunity scout","body":"Summary with recommended follow-ups...","source":"dcbuilder-cli","priority":"normal"}'
```
