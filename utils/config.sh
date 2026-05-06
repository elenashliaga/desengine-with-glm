#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="/Users/op/dev/olgapavlova/desengine/tasks"

TEMPLATE="config.tmpl"

if [[ ! -f "$TEMPLATE" ]]; then
    echo "Template not found: $TEMPLATE" >&2
    exit 1
fi

find "$ROOT_DIR" -mindepth 1 -maxdepth 1 -type d -print0 |
while IFS= read -r -d '' dir; do
	echo $dir
    variants_file="$dir/variants.png"
    base_file="$dir/base.png"
    output_file="$dir/config.json"

    if [[ ! -f "$variants_file" ]]; then
        echo "variants.png not found: $dir" >&2
        continue
    fi

    if [[ ! -f "$base_file" ]]; then
        echo "base.png not found: $dir" >&2
        continue
    fi

	dims_variants="$(magick identify -format "%w %h" "$variants_file")"
	width_variants="${dims_variants%% *}"
	height_variants="${dims_variants##* }"

	dims_base="$(magick identify -format "%w %h" "$base_file")"
	width_base="${dims_base%% *}"
	height_base="${dims_base##* }"


    sed \
        -e "s/<width_variants>/$width_variants/g" \
        -e "s/<height_variants>/$height_variants/g" \
        -e "s/<width_base>/$width_base/g" \
        -e "s/<height_base>/$height_base/g" \
        "$TEMPLATE" > "$output_file"

    echo "created: $output_file"
done
