#!/usr/bin/env bash
# Plugin Check against the same file set shipped in a release zip (.distignore).
exec "$(dirname "$0")/plugin-check-dev.sh"
