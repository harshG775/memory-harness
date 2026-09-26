# memory-harness

A hosted long-term memory server for AI assistants, exposed over [MCP](https://modelcontextprotocol.io). Memories are short markdown entries organized by category, with optimistic concurrency and full-text search. There is also a web UI for browsing and editing them.

Live at `https://memory-harness.hgaur491.workers.dev`. The MCP endpoint is `/mcp`.

## Stack

- **App**: [TanStack Start](https://tanstack.com/start) (React) on **Cloudflare Workers**
- **Database**: **Cloudflare D1** (SQLite) via [Drizzle ORM](https://orm.drizzle.team). Full-text search uses FTS5.
- **Auth**: [better-auth](https://better-auth.com). It handles email/password + email OTP for the UI, and acts as an OAuth 2.1 provider with dynamic client registration for MCP clients.

## MCP tools

Every tool is scoped to the authenticated user.

| Tool | Purpose |
| --- | --- |
| `memory_read` | Fetch one entry by path |
| `memory_write` | Create (`if_version: "new"`) or overwrite (`if_version: <n>`) an entry |
| `memory_append` | Append text to an entry |
| `memory_str_replace` | Replace a substring that occurs exactly once |
| `memory_list` | List entries, filterable by category / path prefix, cursor-paginated |
| `memory_search` | Full-text search over name, description and content |
| `memory_delete` | Soft delete |

Paths look like `<category>/<name>.md`, where category is one of `you`, `topics`, `areas`, `people`, `sessions`. Every write requires `if_version`. A stale version is rejected, so two clients can't silently overwrite each other.

### Connecting from Claude Code

```sh
claude mcp add --transport http memory-harness https://memory-harness.hgaur491.workers.dev/mcp
```

Then authenticate via `/mcp` in Claude Code. For local development, point it at `http://localhost:3000/mcp` instead.

## Development

Requires Node and pnpm.

```sh
pnpm install
cp .env.example .env   # then fill in, see below
pnpm db:migrate        # create tables in the local D1 database
pnpm dev               # http://localhost:3000
```

### Environment

`.env`:

```sh
SERVER_URL=http://localhost:3000
BETTER_AUTH_SECRET=...           # any long random string

# Only needed for drizzle-kit push / studio against the remote database
CLOUDFLARE_ACCOUNT_ID=...        # `pnpm wrangler whoami`
CLOUDFLARE_DATABASE_ID=...       # `database_id` in wrangler.jsonc
CLOUDFLARE_D1_TOKEN=...          # API token with Account → D1 → Edit
```

Email OTP codes are logged to the server console. No email provider is wired up yet.

### Local database

`pnpm dev` runs against a local D1 (SQLite) database. It lives under `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite` and is separate from production.

- Query it: `pnpm wrangler d1 execute memory-harness --local --command "select path, version from memory"`
- Reset it: delete `.wrangler/state/v3/d1`, then run `pnpm db:migrate`

### Schema changes

The schema lives in `src/lib/db/schema/`.

```sh
pnpm db:generate          # write a new migration to src/lib/db/migrations/
pnpm db:migrate           # apply to local D1
pnpm db:migrate:remote    # apply to production D1
```

Migrations are applied by wrangler (`wrangler d1 migrations apply`), not drizzle-kit. Drizzle writes each migration as `<name>/migration.sql`, so `wrangler.jsonc` sets `migrations_pattern` to match that layout.

**Full-text search** runs on the FTS5 virtual table `memory_fts`. Triggers keep it in sync with `memory`. It is defined in a hand-written migration (`*_memory_fts`) and described for queries in `src/lib/db/fts.ts`. That file sits outside `schema/` on purpose, so drizzle-kit doesn't try to manage it. If you add searchable columns to `memory`, update those triggers in a new custom migration (`pnpm drizzle-kit generate --custom --name <name>`).

## Deploy

```sh
pnpm db:migrate:remote   # if there are new migrations
pnpm deploy              # vite build + wrangler deploy
```

## Design notes

- **Why D1**: the app originally used Neon Postgres. Neon's free tier suspends compute when idle, and every query crossed clouds, so infrequent MCP calls were slow. D1 is a Worker binding in the same datacenter, with no cold start and no network hop.
- **No interactive transactions** on D1. Every write is a single atomic statement: a version-checked `UPDATE ... WHERE version = ?`, or an `INSERT ... ON CONFLICT` that revives a soft-deleted row.
- **Vector / semantic search** is not implemented. D1 can't load native extensions like `sqlite-vec`. If semantic search is ever needed, the plan is to pair D1 with Cloudflare Vectorize.
