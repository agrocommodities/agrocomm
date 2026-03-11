#!/usr/bin/env bash
# Executa o playbook Ansible a partir da raiz do projeto.
# Uso: ./scripts/ansible.sh [--check] [opções extras do ansible-playbook]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANSIBLE_DIR="$SCRIPT_DIR/../ansible"

command -v ansible-playbook >/dev/null 2>&1 || {
  echo "Erro: ansible-playbook não encontrado. Instale o Ansible antes de continuar." >&2
  exit 1
}

cd "$ANSIBLE_DIR"

ansible-playbook -i inventory.ini playbook.yml "$@"
