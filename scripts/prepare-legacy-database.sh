#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(pwd)}"
ENV_FILE="${ENV_FILE:-$PROJECT_DIR/.env.production}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/agrocomm}"

log() {
  printf '[database] %s\n' "$*"
}

fail() {
  printf '[database] ERRO: %s\n' "$*" >&2
  exit 1
}

command -v sqlite3 >/dev/null 2>&1 || fail "sqlite3 não está instalado."

if [[ ! -f "$ENV_FILE" ]]; then
  ENV_FILE="$PROJECT_DIR/.env"
fi

[[ -f "$ENV_FILE" ]] || fail "Arquivo .env não encontrado em $PROJECT_DIR."

raw_db_path="$({
  grep -E '^DB_FILE_NAME=' "$ENV_FILE" || true
} | tail -n 1 | cut -d= -f2-)"

raw_db_path="${raw_db_path%$'\r'}"
raw_db_path="${raw_db_path#\"}"
raw_db_path="${raw_db_path%\"}"
raw_db_path="${raw_db_path#\'}"
raw_db_path="${raw_db_path%\'}"

[[ -n "$raw_db_path" ]] || fail "DB_FILE_NAME não está definido em $ENV_FILE."

case "$raw_db_path" in
  file:*) db_path="${raw_db_path#file:}" ;;
  *) db_path="$raw_db_path" ;;
esac

if [[ "$db_path" != /* ]]; then
  db_path="$PROJECT_DIR/$db_path"
fi

db_path="$(readlink -m "$db_path")"
[[ -f "$db_path" ]] || fail "Banco SQLite não encontrado em $db_path."

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

integrity="$(sqlite3 "$db_path" 'PRAGMA integrity_check;' | head -n 1)"
[[ "$integrity" == "ok" ]] || fail "Falha na integridade do banco: $integrity"

backup_path="$BACKUP_DIR/agrocomm-$(date +%Y%m%d-%H%M%S).db"
log "Criando backup externo em $backup_path"
sqlite3 "$db_path" ".backup '$backup_path'"
chmod 600 "$backup_path"

backup_integrity="$(sqlite3 "$backup_path" 'PRAGMA integrity_check;' | head -n 1)"
[[ "$backup_integrity" == "ok" ]] || fail "O backup criado falhou no teste de integridade."

add_column() {
  local table="$1"
  local column="$2"
  local definition="$3"

  local table_exists
  table_exists="$(sqlite3 "$db_path" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='$table';")"
  [[ "$table_exists" == "1" ]] || fail "A tabela $table não existe no banco restaurado."

  local column_exists
  column_exists="$(sqlite3 "$db_path" "SELECT COUNT(*) FROM pragma_table_info('$table') WHERE name='$column';")"

  if [[ "$column_exists" == "1" ]]; then
    log "Coluna já existente: $table.$column"
    return
  fi

  log "Adicionando coluna: $table.$column"
  sqlite3 "$db_path" "ALTER TABLE \"$table\" ADD COLUMN \"$column\" $definition;"
}

log "Aplicando ajustes idempotentes para bancos legados"
add_column users phone_country_code "TEXT"
add_column users phone_national_number "TEXT"
add_column users phone_e164 "TEXT"
add_column users phone_verified_at "TEXT"
add_column users country_id "INTEGER"
add_column users geo_state_id "INTEGER"
add_column users geo_city_id "INTEGER"
add_column users bulletin_opt_out "INTEGER NOT NULL DEFAULT 0"

final_integrity="$(sqlite3 "$db_path" 'PRAGMA integrity_check;' | head -n 1)"
[[ "$final_integrity" == "ok" ]] || fail "O banco falhou no teste de integridade após os ajustes."

log "Banco preparado com sucesso: $db_path"
log "Backup preservado fora do projeto: $backup_path"
