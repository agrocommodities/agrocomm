#!/usr/bin/env bash

# ansible-vault create ansible/roles/postgres/vars/vault.yml
# agrocomm_db_password: "password"

export ANSIBLE_VAULT_PASSWORD_FILE=./.vault_pass

ROOT=$(dirname "$(readlink -f "$0")")
DISTRO=$(lsb_release -c | awk '{print $2}' 2>/dev/null | tr -d ' ')

echo "Running Ansible playbook for $DISTRO"

if [ "$DISTRO" == "void" ]; then
  ANSIBLE_PYTHON_INTERPRETER=auto_silent \
  ANSIBLE_CONFIG="${ROOT}/../ansible/ansible.cfg" \
  ansible-playbook -e "ansible_port=2200" "${ROOT}/../ansible/main.yml" --ask-vault-pass -i tyche,
elif [ "$DISTRO" == "arch" ]; then
  ANSIBLE_PYTHON_INTERPRETER=auto_silent \
  ANSIBLE_CONFIG="${ROOT}/../ansible/ansible.cfg" \
  ansible-playbook -e "ansible_port=2200" "${ROOT}/../ansible/main.yml" --ask-vault-pass -i tyche,
else
  ANSIBLE_PYTHON_INTERPRETER=auto_silent \
  ANSIBLE_CONFIG="${ROOT}/../ansible/ansible.cfg" \
  ansible-playbook --connection=local -e "ansible_port=2200" "${ROOT}/../ansible/main.yml" --ask-vault-pass -i localhost,
fi