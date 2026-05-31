# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AgroComm is a Brazilian agropecuarian commodities platform — a full-stack Next.js 16 application with real-time commodity prices, agricultural news, and classified listings.

## Commands

```bash
pnpm dev          # Start dev server (port 3000) — runs tsx src/server.ts, NOT next dev
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

There are no automated tests. Type checking and linting are the verification tools. Always use **pnpm** — never npm or yarn.

## Architecture

**Single Next.js application** (not a monorepo) using App Router with a custom server that integrates Socket.IO.

### Custom Server (`src/server.ts`)
The app runs via a custom Next.js server — not `next start`. Socket.IO is attached at `/api/socketio` and broadcasts commodity prices every 60 seconds. Dev mode also uses this custom server via `tsx`.

### Data Flow
- **Server Actions** (`src/actions/`) handle form submissions and data mutations — use manual FormData parsing with inline validation (no Zod)
- **API Routes** (`src/app/api/`) handle REST endpoints (commodities, health, admin operations, tracking)
- **Drizzle ORM** (`src/db/`) provides type-safe SQLite access via libSQL
- **Real-time**: Socket.IO client in `CommoditySidebar.tsx` connects for live price updates; falls back to `/api/commodities`

### Routing Structure
- **Route group `(auth)`** — groups auth pages: login, cadastro, esqueci-senha, ativar-conta, redefinir-senha
- **Parallel routes `@modal`** — intercepts `/ajuda`, `/sobre`, `/suporte`, `/privacidade`, `/termos` as modals via `(.)` convention; also accessible as full pages
- **Admin panel `/admin`** — full-featured with managers for: users, moderation, conflicts, categories, storage, quotes, news, logs. Each section follows page.tsx + Manager component pattern
- **Feature routes** — `/classificados`, `/noticias`, `/cotacoes`, `/notificacoes`, `/ajustes`

### Components (`src/components/`)
Organized with feature subfolders: `admin/` and `auth/`. Root-level components are domain-specific (Header, Footer, ContactForm, etc.) — no generic `ui/` folder.

### Key Libraries (`src/lib/`)
- `auth.ts` — JWT access + refresh tokens in HTTP-only cookies; email verification and password reset tokens in DB
- `password.ts` — password hashing/verification
- `email.ts` — email sending via Nodemailer
- `scraper.ts` + `src/db/scrape.ts` — commodity and news scraping
- `markdown.ts` — markdown rendering
- `moderation.ts` — action logging
- `whatsapp.ts` — WhatsApp integration

### Database
- **ORM**: Drizzle ORM with SQLite/libSQL (`@libsql/client`)
- **Schema**: `src/db/schema.ts` — all table definitions in one file
- **Rule**: Always use `pnpm push` (`drizzle-kit push`) to sync schema. Never use `drizzle-kit migrate`.
- **Rule**: Prefer Drizzle ORM APIs over raw SQL. Use raw SQL only when unavoidable (for example, importing an external `.sql` backup).
- **Seed**: `src/db/seed.ts` creates the admin user, roles/permissions, and sample data

### Backup / Restore (Admin)
- Admin storage manager supports restore from `.zip`, `.db/.sqlite`, and `.sql`
- Always create a pre-restore DB backup in `drizzle/backups/` before replacing data
- Keep file restore safe: reject/ignore path traversal attempts when extracting media from zip
- `.sql` restores are saved in `drizzle/backups/` for auditability and future Postgres migration workflows
- Keep the app Nginx `client_max_body_size` aligned with restore uploads; current target is `200m`

### Scraping
- Fetches from Scot Consultoria (pecuária), Notícias Agrícolas (grãos), and Yahoo Finance API (CBOT futures: ZS=F, ZC=F, LE=F)
- Scraper dynamically constructs URLs per product/state from the base URL stored in `sources` table
- News articles store full HTML content; tags are auto-extracted with fallback generation from title keywords
- Deduplication via `sourceUrl` UNIQUE constraint on `news_articles`

### Email
Nodemailer with Pug templates in `src/emails/`. Requires `MAIL_ADDR`, `MAIL_USER`, `MAIL_PASS` env vars.

## Key Rules

- **Never use `any`** — enforced as an error by Biome (`noExplicitAny: "error"`)
- **Styling**: Tailwind CSS v4, dark theme, green accents (`--background: #394634`)
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
