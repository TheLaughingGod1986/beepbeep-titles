#!/usr/bin/env bash
# Build a WordPress.org-ready release zip (respects .distignore).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SLUG="beepbeep-titles"
VERSION="$(grep "define( 'BEEPTI_VERSION'" "$ROOT/beepbeep-titles.php" | sed -E "s/.*'([0-9.]+)'.*/\1/")"
DIST="$ROOT/dist"
STAGE="$DIST/$SLUG"
ZIP="$DIST/${SLUG}-${VERSION}.zip"

cd "$ROOT"

if [[ ! -d build ]]; then
	echo "Missing build/ — run: npm run build" >&2
	exit 1
fi

if [[ ! -f readme.txt ]]; then
	echo "Missing readme.txt" >&2
	exit 1
fi

mkdir -p "$DIST"
rm -rf "$STAGE"
mkdir -p "$STAGE"

# Copy everything except .distignore patterns (and the dist folder itself).
while IFS= read -r line || [[ -n "$line" ]]; do
	line="${line%%#*}"
	line="$(echo "$line" | xargs)"
	[[ -z "$line" ]] && continue
	EXCLUDES+=( "--exclude=$line" )
done < "$ROOT/.distignore"

rsync -a "${EXCLUDES[@]}" --exclude='dist' "$ROOT/" "$STAGE/"

if find "$STAGE" -type f \( -name 'screenshot-*.png' -o -name '.DS_Store' -o -name '.env' -o -name '.env.*' \) -print -quit | grep -q .; then
	echo "Release staging contains a forbidden file" >&2
	exit 1
fi

rm -f "$ZIP"
(
	cd "$DIST"
	zip -r -q "$(basename "$ZIP")" "$SLUG"
)

echo "Release zip: $ZIP"
echo "Version:     $VERSION"
du -h "$ZIP"
