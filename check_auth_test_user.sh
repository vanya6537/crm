#!/bin/sh

set -eu

EMAIL="${1:-test@example.com}"
PASSWORD="${AUTH_CHECK_PASSWORD:-Password123}"
BASE_URL="${AUTH_BASE_URL:-http://127.0.0.1:3000}"
COOKIE_JAR="$(mktemp -t auth-check-cookies.XXXXXX)"
LOGIN_HEADERS="$(mktemp -t auth-check-login.XXXXXX)"
LOGIN_BODY="$(mktemp -t auth-check-body.XXXXXX)"
STATUS_BODY="$(mktemp -t auth-check-status.XXXXXX)"

cleanup() {
    rm -f "$COOKIE_JAR" "$LOGIN_HEADERS" "$LOGIN_BODY" "$STATUS_BODY"
}

trap cleanup EXIT INT TERM

echo "== Auth diagnostic =="
echo "Base URL: $BASE_URL"
echo "Email: $EMAIL"
echo

echo "-- Database user check --"
php artisan tinker --execute="use App\\Models\\User; use Illuminate\\Support\\Facades\\Hash; \$user = User::where('email', '$EMAIL')->first(); echo json_encode([ 'exists' => \$user !== null, 'id' => \$user?->id, 'email' => \$user?->email, 'email_verified_at' => optional(\$user?->email_verified_at)->toISOString(), 'two_factor_confirmed_at' => optional(\$user?->two_factor_confirmed_at)->toISOString(), 'password_matches' => \$user ? Hash::check('$PASSWORD', \$user->password) : false ]);"
echo
echo

echo "-- CSRF bootstrap --"
CSRF_STATUS="$(curl -sS -o /dev/null -w '%{http_code}' -c "$COOKIE_JAR" "$BASE_URL/sanctum/csrf-cookie")"
echo "GET /sanctum/csrf-cookie => HTTP $CSRF_STATUS"

XSRF_TOKEN_ENCODED="$(awk 'BEGIN { token = "" } $6 == "XSRF-TOKEN" { token = $7 } END { print token }' "$COOKIE_JAR")"

if [ -z "$XSRF_TOKEN_ENCODED" ]; then
    echo "XSRF-TOKEN cookie not found."
    exit 1
fi

XSRF_TOKEN="$(php -r 'echo rawurldecode($argv[1]);' "$XSRF_TOKEN_ENCODED")"
echo "XSRF-TOKEN cookie detected."
echo

echo "-- Login attempt --"
LOGIN_STATUS="$(curl -sS -D "$LOGIN_HEADERS" -o "$LOGIN_BODY" -w '%{http_code}' -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST "$BASE_URL/login" -H 'Accept: application/json' -H 'Content-Type: application/json' -H 'X-Requested-With: XMLHttpRequest' -H "X-XSRF-TOKEN: $XSRF_TOKEN" --data "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"remember\":false}")"
echo "POST /login => HTTP $LOGIN_STATUS"
echo "Response body:"
cat "$LOGIN_BODY"
echo
echo

echo "-- Auth status after login --"
STATUS_CODE="$(curl -sS -o "$STATUS_BODY" -w '%{http_code}' -b "$COOKIE_JAR" -H 'Accept: application/json' "$BASE_URL/api/status")"
echo "GET /api/status => HTTP $STATUS_CODE"
cat "$STATUS_BODY"
echo