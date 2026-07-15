#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"
git config core.hooksPath .githooks
echo "Frontend hooks installed for repo: $ROOT_DIR"
