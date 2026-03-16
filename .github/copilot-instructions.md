# Copilot Instructions

## Database

- This project uses **Drizzle ORM** with **libsql/SQLite**.
- **Never use `drizzle-kit migrate`**. Always use `pnpm drizzle-kit push` to apply schema changes to the database.

## Architecture

- **Next.js 16** with App Router + custom server (`src/server.ts`)
- **Socket.IO** integrated into the custom server for real-time commodity prices (CBOT)
- **Tailwind CSS v4** — dark theme with green accents (`--background: #394634`)
- **Biome** for lint/format — never use ESLint/Prettier
- **pnpm** — never npm or yarn

## TypeScript

- **Never use the `any` type** — not as a type annotation, type assertion (`as any`), or generic parameter. Use proper types, `unknown`, generics, or type narrowing instead.
- Biome enforces `noExplicitAny: "error"` — any use of `any` will fail the lint check.

## Key Patterns

### Real-Time Data
- Socket.IO server runs on the same HTTP server as Next.js (path: `/api/socketio`)
- Commodity prices fetched from Yahoo Finance API (CBOT futures: ZS=F, ZC=F, LE=F)
- Prices broadcast every 60 seconds to subscribed clients
- Fallback via `/api/commodities` REST endpoint for SSR

### News System
- Full article content stored in `newsArticles.content` column (HTML)
- Tag system: `tags` + `news_article_tags` junction table
- Tags auto-extracted from article pages (meta keywords, tag elements)
- Fallback: auto-generated tags from title keywords
- Source citation: always show `sourceName` and link to `sourceUrl`
- Scraping runs 2x/day (configurable via systemd timer)
- Dedup by `sourceUrl` unique constraint

### Parallel Routes (Modals)
- `@modal` slot in root layout for intercepting routes
- Pages: `/ajuda`, `/sobre`, `/suporte` — accessible as full pages or modals
- Modal intercepting routes at `src/app/@modal/(.)ajuda/`, `(.)sobre/`, `(.)suporte/`

### Contact Form
- Server action saves to `contact_messages` table
- Optional Nodemailer integration via SMTP env vars
- Input validation server-side

## Environment Variables

| Variable | Description |
|---|---|
| `DB_FILE_NAME` | SQLite database file path |
| `JWT_SECRET` | JWT signing secret |
| `SMTP_HOST` | SMTP server for contact emails |
| `SMTP_PORT` | SMTP port (default: 587) |
| `SMTP_USER` | SMTP auth username |
| `SMTP_PASS` | SMTP auth password |
| `SMTP_SECURE` | "true" for TLS |
| `CONTACT_EMAIL` | Recipient for contact form emails |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics ID |

## Scraping Sources

| Source | URL | What |
|---|---|---|
| Scot Consultoria | `https://www.scotconsultoria.com.br/cotacoes/` | Pecuária (all regions) |
| Notícias Agrícolas | `https://www.noticiasagricolas.com.br/cotacoes/` | Grãos (all products, all states) |
| Yahoo Finance | CBOT futures (ZS=F, ZC=F, LE=F) | International commodity prices |

Note: The scraper dynamically constructs URLs per product/state from the base URL. The `sources` table stores the general base URL.
