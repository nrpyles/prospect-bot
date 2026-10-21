#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v node >/dev/null || ! command -v pnpm >/dev/null; then
  echo 'Install Node 24 and pnpm, then run this file again.'
  read -r -p 'Press Return to close.'
  exit 1
fi
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo 'Fill in .env.local using the README, then run this file again.'
  open -e .env.local
  exit 1
fi
if [ ! -x node_modules/.bin/next ]; then
  pnpm install --frozen-lockfile
fi
pnpm worker >worker.log 2>&1 &
crm_worker_pid=$!
trap 'kill "$crm_worker_pid" 2>/dev/null || true' EXIT INT TERM
echo 'Open http://localhost:3000 after the server is ready. Worker messages are in worker.log.'
pnpm dev
