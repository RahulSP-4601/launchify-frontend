#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

run_limits() {
  python3 "$ROOT_DIR/scripts/guardian_limits.py" "$ROOT_DIR/src"
}

run_lint() {
  npm run lint -- --max-warnings=0
}

run_typecheck() {
  npx tsc --noEmit
}

run_build() {
  npx next build --webpack
}

main() {
  echo "Running frontend guardian..."
  cd "$ROOT_DIR"
  run_limits
  run_lint
  run_typecheck
  run_build
  echo "Frontend guardian passed."
}

main "$@"
