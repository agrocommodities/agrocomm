# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AgroComm is a Brazilian agropecuarian commodities platform — a full-stack Next.js 16 application with real-time commodity prices, agricultural news, and classified listings.

## Commands

```bash
pnpm dev          # Start dev server (port 3000)
pnpm build        # Build for production
pnpm start        # Start production server (port 4000)
pnpm check        # TypeScript type checking (no emit)
pnpm lint         # Biome linter check
pnpm format       # Auto-format code with Biome
pnpm push         # Apply schema changes to database (use this, NOT migrate)
pnpm seed         # Seed database with initial data
pnpm scrape       # Run scraper manually
pnpm reset        # Full reset: delete DB → push → seed → scrape
```

There are no automated tests. Type checking and linting are the verification tools.

## Architecture

**Single Next.js application** (not a monorepo) using App Router with a custom server that integrates Socket.IO.

### Custom Server (`src/server.ts`)
The app runs via a custom Next.js server — not `next start`. Socket.IO is attached at `/api/socketio` and broadcasts commodity prices every 60 seconds.

### Data Flow
- **Server Actions** (`src/actions/`) handle form submissions and data mutations
- **API Routes** (`src/app/api/`) handle REST endpoints (commodities, health)
- **Drizzle ORM** (`src/db/`) provides type-safe SQLite access via libSQL
- **Real-time**: Socket.IO client in `CommoditySidebar.tsx` connects for live price updates; falls back to `/api/commodities`

### Parallel Routes / Modals
`src/app/@modal/` uses Next.js parallel routes to intercept `/ajuda`, `/sobre`, and `/suporte` — rendering them as modals when navigated to via the layout, or as full pages when accessed directly.

### Database
- **ORM**: Drizzle ORM with SQLite/libSQL (`@libsql/client`)
- **Schema**: `src/db/schema.ts` — all table definitions in one file
- **Rule**: Always use `pnpm push` (`drizzle-kit push`) to sync schema. Never use `drizzle-kit migrate`.
- **Seed**: `src/db/seed.ts` creates the admin user, roles/permissions, and sample data

### Authentication
JWT-based with access + refresh tokens stored in HTTP-only cookies. Logic in `src/lib/auth.ts`. Email verification tokens and password reset tokens are stored in the database.

### Scraping
- `src/lib/scraper.ts` + `src/db/scrape.ts` — fetches from Scot Consultoria (pecuária), Notícias Agrícolas (grãos), and Yahoo Finance API (CBOT futures: ZS=F, ZC=F, LE=F)
- News articles store full HTML content; tags are auto-extracted with fallback generation
- Deduplication via `sourceUrl` UNIQUE constraint on `news_articles`

### Email
Nodemailer with Pug templates in `src/emails/`. Requires `MAIL_ADDR`, `MAIL_USER`, `MAIL_PASS` env vars.

## Key Rules

- **Never use `any`** — enforced as an error by Biome
- **Styling**: Tailwind CSS v4, dark theme, green accents
- **Linting/Formatting**: Biome only (not ESLint/Prettier)
- **Path alias**: `@/*` maps to `src/*`
- **Server actions body limit**: 35mb (configured in `next.config.ts` for image uploads)

## Environment Variables

Key variables needed for development (see `.env`):

| Variable | Purpose |
|----------|---------|
| `DB_FILE_NAME` | SQLite path (e.g. `file:drizzle/agrocomm.db`) |
| `JWT_SECRET` | JWT signing secret |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used only during seeding |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | 64-char hex for server action encryption |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare CAPTCHA |
| `MAIL_USER` / `MAIL_PASS` / `MAIL_ADDR` | SMTP email sending (optional in dev) |

## Deployment

Production runs on Rocky Linux 9 VPS via:
- `scripts/deploy.sh` — SSH deploy script
- `ansible/playbook.yml` — full server provisioning
- systemd service `agrocomm.service` + scraper timer `agrocomm-scraper.timer` (2x/day)
- Nginx reverse proxy with SSL
