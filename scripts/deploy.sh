#!/usr/bin/env bash

set -Eeuo pipefail

PATH=$PATH:/home/nginx/.local/share/pnpm
NAME=agrocomm
SERVICE=$NAME.service
TEMP_DIR=/tmp/$NAME
PROJECT_DIR=/var/www/$NAME
BACKUP_DIR=/var/backups/$NAME

[ -d "$TEMP_DIR" ] && rm -rf "$TEMP_DIR"
cp -a "$PROJECT_DIR" "$TEMP_DIR"
cd "$TEMP_DIR" || exit 1

git clean -fxd -e .env -e drizzle/agrocomm.db -e public/images/posts -e public/images/avatars -e public/images/classifieds -e .next
cp -f .env .env.production

pnpm install

# Antes de qualquer alteração de schema:
# - valida a integridade do SQLite;
# - cria um backup fora do diretório do projeto;
# - adiciona de forma idempotente colunas ausentes em bancos legados.
PROJECT_DIR="$TEMP_DIR" \
ENV_FILE="$TEMP_DIR/.env.production" \
BACKUP_DIR="$BACKUP_DIR" \
bash "$TEMP_DIR/scripts/prepare-legacy-database.sh"

#pnpm tsx scripts/create-reset-table.ts || exit 1

if pnpm run push; then
  #pnpm tsx scripts/fix-city-slugs.ts
  pnpm run seed
  pnpm run scrape
  pnpm run build || exit 1
  sudo /usr/bin/systemctl stop "$SERVICE"
  rm -rf "$PROJECT_DIR"
  mv "$TEMP_DIR" "$PROJECT_DIR"
  sudo /usr/bin/systemctl start "$SERVICE"
else
  echo "Erro ao executar push, abortando deploy"
  exit 1
fi

# Aguardar serviço ficar saudável (até 30s)
for i in $(seq 1 6); do
  sleep 5
  if curl -s -f http://localhost:4000/api/health > /dev/null 2>&1; then
    echo "Serviço iniciado com sucesso"
    exit 0
  fi
  echo "Aguardando serviço... (tentativa $i/6)"
done

echo "Serviço não respondeu após 30s"
exit 1
