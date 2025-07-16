#!/usr/bin/env bash

if [ -f /etc/arch-release ]; then
  ssh nginx@tyche 'mkdir -p /var/www/cdn.agrocomm.com.br/'
  rsync -avzz --delete $HOME/cdn/agrocomm/ nginx@tyche:/var/www/cdn.agrocomm.com.br/
fi