#!/usr/bin/env bash

#rsync -avz nginx@psique:/var/www/cdn.agrocomm.com.br/ /home/lucas/cdn/agrocomm/
rsync -avz /home/lucas/cdn/agrocomm/ nginx@psique:/var/www/cdn.agrocomm.com.br/ --delete