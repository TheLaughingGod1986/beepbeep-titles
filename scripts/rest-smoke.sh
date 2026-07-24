#!/usr/bin/env bash
# REST route smoke test: lint Rest/*.php, then verify routes respond when wp-env is up.
# A 401/403 proves the route is registered; 404 means it is missing.
set -euo pipefail

cd "$(dirname "$0")/.."
BASE="${BEEPTI_REST_BASE:-http://localhost:8890/wp-json/beepbeep-titles/v1}"

echo "== REST PHP lint =="
while IFS= read -r -d '' file; do
    php -l "$file"
done < <(find includes/Rest -name '*.php' -print0)
php -l includes/RestApi.php

echo "== REST route registration (optional wp-env) =="
if ! curl -sf --max-time 2 "http://localhost:${WP_ENV_PORT:-8890}/wp-json/" -o /dev/null 2>/dev/null; then
    echo "SKIP: wp-env not reachable at ${BASE} (start with: npx wp-env start)"
    echo "REST SMOKE OK (lint only)"
    exit 0
fi

check_route() {
    local method="$1"
    local path="$2"
    local code
    code=$(curl -s -o /dev/null -w '%{http_code}' -X "$method" "${BASE}${path}" --max-time 5)
    if [[ "$code" == "404" ]]; then
        echo "FAIL: ${method} ${path} returned 404 (route not registered)"
        exit 1
    fi
    echo "OK: ${method} ${path} -> ${code}"
}

check_route GET  "/quota"
check_route GET  "/pages"
check_route GET  "/settings"
check_route GET  "/billing/plans"
check_route GET  "/billing/info"
check_route POST "/generate"
check_route POST "/jobs"
check_route POST "/scan"

echo "REST SMOKE OK"
