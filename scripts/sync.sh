#!/usr/bin/env bash

DELETE=""

if [ -f /etc/arch-release ] || [ "$(lsb_release -is)" == "VoidLinux" ]; then
  # ssh nginx@tyche 'mkdir -p /var/www/cdn.agrocomm.com.br/'
  rsync -avzz $DELETE $HOME/cdn/agrocomm/ nginx@tyche:/var/www/cdn.agrocomm.com.br/
fi