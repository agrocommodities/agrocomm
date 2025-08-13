#!/usr/bin/env bash

DELETE=""

if [ "$(lsb_release -is)" == "Arch" ] || [ "$(lsb_release -is)" == "VoidLinux" ]; then
  rsync -avzz $DELETE $HOME/cdn/agrocomm/ nginx@psique:/var/www/cdn.agrocomm.com.br/
fi