#!/bin/bash

# Define o arquivo .env padrão
ENV_FILE=".env.production"
DISTRO=$(lsb_release -is 2>/dev/null || echo "Unknown")

if [ "$DISTRO" == "Unknown" ]; then
    [ "$(sw_vers -productName 2> /dev/null)" == "macOS" ] && DISTRO="macOS" || DISTRO="Unknown"
fi

if [ "$DISTRO" == "void" ] || [ "$DISTRO" == "arch" ] || [ "$DISTRO" == "macOS" ]; then
    [ -f ".env" ] && ENV_FILE=".env"
fi

# Verifica se o arquivo existe
if [ ! -f "$ENV_FILE" ]; then
    echo "Erro: Arquivo $ENV_FILE não encontrado."
    exit 1
fi

# Lê a variável DATABASE_URL do arquivo .env
DB_URL=$(grep -E "^DATABASE_URL=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")

# Verifica se encontrou a variável
if [ -z "$DB_URL" ]; then
    echo "Erro: DATABASE_URL não encontrada no arquivo $ENV_FILE."
    exit 1
fi

DB_USER=$(echo "$DB_URL" | sed -n 's/^postgres:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DB_URL" | sed -n 's/^postgres:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "$DB_URL" | sed -n 's/^postgres:\/\/[^@]*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DB_URL" | sed -n 's/^postgres:\/\/[^:]*:[^@]*@[^:]*:\([^/]*\)\/.*/\1/p')
DB_NAME=$(echo "$DB_URL" | sed -n 's/^postgres:\/\/[^/]*\/\([^?]*\).*/\1/p')

export DB_USER
export DB_PASS
export DB_HOST
export DB_PORT
export DB_NAME
export ENV_FILE