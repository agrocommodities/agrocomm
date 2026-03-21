#!/usr/bin/env bash

PATH=$PATH:/home/nginx/.local/share/pnpm
NAME=agrocomm
SERVICE=$NAME.service
TEMP_DIR=/tmp/$NAME
PROJECT_DIR=/var/www/$NAME

[ -d "$TEMP_DIR" ] && rm -rf "$TEMP_DIR"
cp -a "$PROJECT_DIR" "$TEMP_DIR"
cd "$TEMP_DIR" || exit 1

git clean -fxd -e .env -e drizzle/agrocomm.db -e public/images/posts -e public/images/avatars -e public/images/classifieds
cp -f .env .env.production

pnpm install

#pnpm tsx scripts/create-reset-table.ts || exit 1

if pnpm run push; then
  pnpm run seed
  pnpm run scrape
  pnpm run build || exit 1
else
  echo "Erro ao executar push, abortando deploy"
  exit 1
fi

sudo /usr/bin/systemctl stop $SERVICE
rm -rf "$PROJECT_DIR"
mv "$TEMP_DIR" "$PROJECT_DIR"
sudo /usr/bin/systemctl start $SERVICE

# Aguardar serviço ficar saudável (até 60s)
for i in $(seq 1 12); do
  sleep 5
  if curl -s -f http://localhost:4000/api/health > /dev/null 2>&1; then
    echo "Serviço iniciado com sucesso"
    exit 0
  fi
  echo "Aguardando serviço... (tentativa $i/12)"
done

echo "Serviço não respondeu após 60s"
exit 1