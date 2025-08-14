#!/usr/bin/env bash

#DELETE="--delete"
DATABASE=true

if [ "$(lsb_release -s)" == "Darwin" ] || \
  [ "$(lsb_release -is)" == "Arch" ] || \
  [ "$(lsb_release -is)" == "VoidLinux" ]; then
  rsync -avzz $HOME/cdn/agrocomm/ nginx@psique:/var/www/cdn.agrocomm.com.br/ $DELETE
fi

if [ $DATABASE == true ]; then
  scp $HOME/code/agrocomm/drizzle/local.db nginx@psique:/var/www/agrocomm/drizzle/
fi