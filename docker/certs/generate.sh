#!/bin/bash
# Gera certificados para uso local com Docker.
# Usa mkcert (recomendado — confiável no browser) ou openssl como fallback.
set -e

cd "$(dirname "$0")"

DOMAINS_MAIN="agrocomm.local www.agrocomm.local localhost 127.0.0.1"
DOMAINS_CDN="cdn.agrocomm.local localhost 127.0.0.1"

if command -v mkcert &>/dev/null; then
    echo "▶ Usando mkcert..."
    mkcert -install 2>/dev/null || true

    mkcert -cert-file fullchain.pem -key-file privkey.pem $DOMAINS_MAIN
    mkcert -cert-file cdn-fullchain.pem -key-file cdn-privkey.pem $DOMAINS_CDN
else
    echo "▶ mkcert não encontrado — gerando certificados auto-assinados com openssl..."
    echo "  (instale mkcert para certificados confiáveis no browser)"

    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout privkey.pem -out fullchain.pem \
        -subj "/CN=agrocomm.local" \
        -addext "subjectAltName=DNS:agrocomm.local,DNS:www.agrocomm.local,DNS:localhost,IP:127.0.0.1"

    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout cdn-privkey.pem -out cdn-fullchain.pem \
        -subj "/CN=cdn.agrocomm.local" \
        -addext "subjectAltName=DNS:cdn.agrocomm.local,DNS:localhost,IP:127.0.0.1"
fi

echo "✓ Certificados gerados em docker/certs/"
