#!/bin/bash
set -e

export CI=true

echo "▶ Installing dependencies..."
pnpm install --frozen-lockfile

echo "▶ Building Next.js app..."
pnpm build

DB_PATH="${DB_FILE_NAME:-file:drizzle/agrocomm.db}"
DB_PATH="${DB_PATH#file:}"

if [ ! -f "$DB_PATH" ]; then
    echo "▶ First run — applying schema and seeding database..."
    mkdir -p "$(dirname "$DB_PATH")"
    pnpm push
    pnpm seed
fi

echo "▶ Starting AgroComm on port 4000..."
exec pnpm start
