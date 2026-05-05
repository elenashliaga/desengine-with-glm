#!/usr/bin/env bash

set -euo pipefail

SRC_DIR="/Users/op/Library/CloudStorage/Dropbox/! I N B O X/versions"    # каталог с исходными png
OUT_DIR="/Users/op/dev/olgapavlova/desengine/lab/tasks"    # каталог, где создаются подкаталоги <name>/
BASE_DIR="/Users/op/Library/CloudStorage/Dropbox/! I N B O X/base"   # каталог с файлами *-base.png

find "$SRC_DIR" -type f -name "*.png" -print0 |
while IFS= read -r -d '' src; do
    filename="$(basename "$src")"
    name="${filename%.png}"

    clean_name="$name"

    if [[ "$clean_name" == *-variants ]]; then
        clean_name="${clean_name%-variants}"
    elif [[ "$clean_name" == *-states ]]; then
        clean_name="${clean_name%-states}"
    else
        continue
    fi

    subdir="$OUT_DIR/$clean_name"
    base_src="$BASE_DIR/${clean_name}-base.png"

    mkdir -p "$subdir"

    cp "$src" "$subdir/variants.png"

    if [[ -f "$base_src" ]]; then
        cp "$base_src" "$subdir/base.png"
    else
        printf "base not found: %s\n" "$base_src" >&2
    fi
done
