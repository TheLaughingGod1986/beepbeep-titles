#!/usr/bin/env bash
# Smoke test: php -l every shipped PHP file, then a production JS build.
# Exits non-zero on the first failure.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "== PHP lint =="
php -l beepbeep-titles.php
php -l uninstall.php
while IFS= read -r -d '' file; do
    php -l "$file"
done < <(find includes -name '*.php' -print0)

echo "== JS build =="
npm run build

echo "SMOKE OK"
