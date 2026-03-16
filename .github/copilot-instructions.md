# Copilot Instructions

## Database

- This project uses **Drizzle ORM** with **libsql/SQLite**.
- **Never use `drizzle-kit migrate`**. Always use `pnpm drizzle-kit push` to apply schema changes to the database.
