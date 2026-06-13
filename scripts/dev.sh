#!/usr/bin/env bash

SESSION="agro"

if tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux attach-session -t "$SESSION"
  exit 0
fi

tmux new-session -d -s "$SESSION" "pnpm dev"
tmux set-option -t "$SESSION" remain-on-exit on
tmux new-window -t "$SESSION"
tmux new-window -t "$SESSION" "ssh root@psique ; cd /var/www/agrocomm"
tmux attach-session -t "$SESSION"
