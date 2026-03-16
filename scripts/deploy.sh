#!/usr/bin/env bash

PATH=$PATH:/home/nginx/.local/share/pnpm
NAME=agrocomm
SERVICE=$NAME.service
TEMP_DIR=/tmp/$NAME
PROJECT_DIR=/var/www/$NAME

[ -d "$TEMP_DIR" ] && rm -rf "$TEMP_DIR"
cp -a "$PROJECT_DIR" "$TEMP_DIR"
cd "$TEMP_DIR" || exit 1

git clean -fxd -e .env -e drizzle/agrocomm.db -e public/images/posts
#git clean -fxd -e .env
cp -f .env .env.production

pnpm install
pnpm run push
pnpm run seed
pnpm run scrape
pnpm run build || exit 1

sudo /usr/bin/systemctl stop $SERVICE
rm -rf "$PROJECT_DIR"
mv "$TEMP_DIR" "$PROJECT_DIR"
sudo /usr/bin/systemctl start $SERVICE