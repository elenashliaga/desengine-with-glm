#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-}"

if [[ -z "$ROOT" ]]; then
  echo "Usage: $0 /path/to/root"
  exit 1
fi

if [[ ! -d "$ROOT" ]]; then
  echo "Error: not a directory: $ROOT"
  exit 1
fi

for dir in "$ROOT"/*/; do
  [[ -d "$dir" ]] || continue

  levels_dir="${dir}levels"
  mkdir -p "$levels_dir"

  for n in {1..20}; do
    level_dir="${levels_dir}/level-${n}"
    mkdir -p "$level_dir"
    touch "${level_dir}/tip.md"
  done
done