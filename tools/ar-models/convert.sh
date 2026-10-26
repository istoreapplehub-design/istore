#!/bin/bash
# Convert generated GLB device models to ARKit-compliant USDZ using Apple's bundled USD tools.
# Usage: ./convert.sh [path/to/models/dir]  (run generate.mjs first)
set -euo pipefail
DIR="${1:-$(cd "$(dirname "$0")/../../backend/public/models" && pwd)}"
cd "$DIR"
for glb in *.glb; do
  base="${glb%.glb}"
  usdcat "$glb" -o "$base.usda"
  usdzip --arkitAsset "$base.usda" "$base.usdz"
  usdchecker --arkit "$base.usdz" >/dev/null && echo "usdz $base.usdz OK"
  rm -f "$base.usda"
done
