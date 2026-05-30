#!/usr/bin/env bash
# Usado pelo GitHub Actions: o código já foi copiado para STAGING pelo scp-action.
# Este script copia os arquivos persistentes da produção, faz o build e troca.

PATH=$PATH:/home/nginx/.local/share/pnpm
NAME=agrocomm
SERVICE=$NAME.service
STAGING=/tmp/$NAME-ci
PROJECT_DIR=/var/www/$NAME

cd "$STAGING" || exit 1

# Copiar arquivos persistentes da produção (não versionados)
cp -f "$PROJECT_DIR/.env" . || { echo "Arquivo .env não encontrado em $PROJECT_DIR"; exit 1; }
cp -f .env .env.production

mkdir -p drizzle
cp -f "$PROJECT_DIR/drizzle/agrocomm.db" drizzle/ 2>/dev/null || true

for dir in posts avatars classifieds; do
  mkdir -p "public/images/$dir"
  cp -rf "$PROJECT_DIR/public/images/$dir/." "public/images/$dir/" 2>/dev/null || true
done

pnpm install

if pnpm run push; then
  pnpm run seed
  pnpm run scrape
  pnpm run build || exit 1
  sudo /usr/bin/systemctl stop $SERVICE
  rm -rf "$PROJECT_DIR"
  mv "$STAGING" "$PROJECT_DIR"
  sudo /usr/bin/systemctl start $SERVICE
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
