#!/usr/bin/env bash
set -euo pipefail

: "${PORT:=10000}"

# Render nginx config with PORT
envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Ensure writable dirs
mkdir -p storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache || true
chmod -R ug+rwX storage bootstrap/cache || true

# Laravel optimizations (only if APP_KEY is set)
if [[ -n "${APP_KEY:-}" ]]; then
  # If enabled, run DB migrations at container start (DB must be configured).
  if [[ "${RUN_MIGRATIONS:-}" == "true" || "${RUN_MIGRATIONS:-}" == "1" ]]; then
    php artisan migrate --force --no-interaction || {
      echo "[entrypoint] Migrations failed" >&2
      exit 1
    }
  fi

  php artisan storage:link || true
  php artisan config:cache || true
  php artisan route:cache || true
  php artisan view:cache || true
fi

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
