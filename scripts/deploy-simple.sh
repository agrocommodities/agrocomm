#!/usr/bin/env bash

NAME="agrocomm"
SERVICE="${NAME}.service"

PATH=$PATH:/home/nginx/.bun/bin

[ -f .env.production ] && cp .env.production /tmp/env.agrocomm

git clean -fxd

[ -f /tmp/env.agrocomm ] && cp /tmp/env.agrocomm .env.production
cp .env.production .env

sudo /usr/bin/systemctl stop ${SERVICE}

bun install
bun run db:push
bun run db:seed
bun run build

sudo /usr/bin/systemctl start ${SERVICE}