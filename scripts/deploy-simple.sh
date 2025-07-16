#!/usr/bin/env bash

PATH=$PATH:/home/nginx/.bun/bin

[ -f .env.production ] && cp .env.production /tmp/env.agrocomm

git clean -fxd

[ -f /tmp/env.agrocomm ] && cp /tmp/env.agrocomm .env.production

sudo /usr/bin/systemctl stop agrocomm
bun install
bun run build
sudo /usr/bin/systemctl start agrocomm