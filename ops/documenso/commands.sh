#!/usr/bin/env bash
set -euo pipefail

ROOT="${DOCUMENSO_HOME:-$HOME/Services/documenso}"
cd "$ROOT"

case "${1:-status}" in
  up)
    docker compose --env-file .env -f compose.yml up -d
    ;;
  down)
    docker compose --env-file .env -f compose.yml down
    ;;
  restart)
    docker compose --env-file .env -f compose.yml restart
    ;;
  logs)
    if [[ -n "${2:-}" ]]; then
      docker compose --env-file .env -f compose.yml logs -f "$2"
    else
      docker compose --env-file .env -f compose.yml logs -f
    fi
    ;;
  pull)
    docker compose --env-file .env -f compose.yml pull
    ;;
  upgrade)
    docker compose --env-file .env -f compose.yml pull
    docker compose --env-file .env -f compose.yml up -d
    ;;
  backup)
    mkdir -p backups
    docker compose --env-file .env -f compose.yml exec -T database \
      pg_dump -U documenso documenso > "backups/documenso-$(date +%Y%m%d-%H%M%S).sql"
    ;;
  status)
    docker compose --env-file .env -f compose.yml ps
    ;;
  *)
    printf 'Uso: %s {up|down|restart|logs|pull|upgrade|backup|status}\n' "$0" >&2
    exit 2
    ;;
esac
