#!/usr/bin/env bash
# Plugin Check on the dev tree, excluding files listed in .distignore.
set -euo pipefail

cd "$(dirname "$0")/.."

EXCLUDE_DIRS="tests,scripts,.github,.claude,node_modules,src"
EXCLUDE_FILES=".wp-env.json,.eslintrc.json,.gitignore,.distignore,.plugin-check.json,docker-compose.yml,package.json,package-lock.json,README.md"

npx @wordpress/env run cli -- wp plugin check beepbeep-titles \
	--exclude-directories="${EXCLUDE_DIRS}" \
	--exclude-files="${EXCLUDE_FILES}" \
	--format=table
