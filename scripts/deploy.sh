#!/usr/bin/env bash

PATH=$PATH:/home/nginx/.bun/bin
NAME=agrocomm
SERVICE=$NAME.service
TEMP_DIR=/tmp/$NAME
PROJECT_DIR=/var/www/$NAME

[ -d "$TEMP_DIR" ] && rm -rf "$TEMP_DIR"
cp -a "$PROJECT_DIR" "$TEMP_DIR"
cd "$TEMP_DIR" || exit 1

git clean -fxd -e .env.production -e drizzle/local.db
cp -f .env.production .env
sudo /usr/bin/systemctl stop $SERVICE

bun install
#bun run db:reset
bun run db:push
bun run db:seed
bun run db:scrape
bun run build || {
  sudo /usr/bin/systemctl start $SERVICE
  exit 1
}

rm -rf "$PROJECT_DIR"
mv "$TEMP_DIR" "$PROJECT_DIR"

sudo /usr/bin/systemctl start $SERVICE