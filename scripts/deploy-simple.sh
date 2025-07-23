#!/usr/bin/env bash

NAME="agrocomm"
SERVICE="${NAME}.service"
PATH=$PATH:/home/nginx/.bun/bin

git clean -fxd -e '.env.production'
cp .env.production .env

sudo /usr/bin/systemctl stop ${SERVICE}

bun install

bun run db:push
bun run db:seed
bun run db:scrape
bun run db:news

bun run build

sudo /usr/bin/systemctl start ${SERVICE}