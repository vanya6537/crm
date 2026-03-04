#!/usr/bin/env bash
set -euo pipefail

: "${PORT:=10000}"

# php-fpm socket directory
mkdir -p /var/run/php
chown -R www-data:www-data /var/run/php || true
chmod -R ug+rwX /var/run/php || true

# Render nginx config with PORT
envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Ensure writable dirs
mkdir -p \
  storage \
  storage/framework/views \
  storage/framework/cache \
  storage/framework/sessions \
  storage/logs \
  bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache || true
chmod -R ug+rwX storage bootstrap/cache || true

# SQLite database file (optional, for DB_CONNECTION=sqlite)
if [[ "${DB_CONNECTION:-}" == "sqlite" || "${DATABASE_URL:-}" == sqlite:* ]]; then
  db_path="${DB_DATABASE:-database/database.sqlite}"
  if [[ "${db_path}" != ":memory:" ]]; then
    if [[ "${db_path}" != /* ]]; then
      db_path="/var/www/html/${db_path}"
    fi
    mkdir -p "$(dirname "${db_path}")"
    touch "${db_path}"
    chown www-data:www-data "${db_path}" || true
    chmod ug+rw "${db_path}" || true
  fi
fi

# Laravel optimizations (only if APP_KEY is set)
if [[ -n "${APP_KEY:-}" ]]; then
  php artisan package:discover --ansi --no-interaction || {
    echo "[entrypoint] package:discover failed" >&2
    exit 1
  }

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
