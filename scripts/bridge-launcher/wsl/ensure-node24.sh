#!/usr/bin/env bash
set -euo pipefail

TARGET_MAJOR="${TARGET_MAJOR:-24}"
NVM_VERSION="${NVM_VERSION:-v0.40.3}"
NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
PROFILE_PATH="${PROFILE_PATH:-$HOME/.profile}"
MARKER_LINE="# sidepilot-nvm"

log() {
  printf '[wsl-node] %s\n' "$*"
}

require_bin() {
  local bin_name
  bin_name="$1"
  if ! command -v "$bin_name" >/dev/null 2>&1; then
    printf '[wsl-node] missing required tool: %s\n' "$bin_name" >&2
    exit 1
  fi
}

ensure_profile_block() {
  mkdir -p "$(dirname "$PROFILE_PATH")"
  touch "$PROFILE_PATH"

  local tmp
  tmp="$(mktemp)"
  awk -v marker="$MARKER_LINE" '
    $0 == marker { skip = 2; next }
    skip > 0 { skip--; next }
    { print }
  ' "$PROFILE_PATH" > "$tmp"

  printf '\n%s\nexport NVM_DIR="%s"\n[ -s "%s/nvm.sh" ] && . "%s/nvm.sh"\n' \
    "$MARKER_LINE" "$NVM_DIR" "$NVM_DIR" "$NVM_DIR" >> "$tmp"
  mv "$tmp" "$PROFILE_PATH"
}

main() {
  require_bin bash
  require_bin curl

  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    log "installing nvm ${NVM_VERSION} into ${NVM_DIR}"
    PROFILE=/dev/null curl -fsSL "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" | bash
  fi

  ensure_profile_block

  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
  nvm install "$TARGET_MAJOR"
  nvm alias default "$TARGET_MAJOR" >/dev/null
  nvm use "$TARGET_MAJOR" >/dev/null

  log "node=$(node --version)"
  log "npm=$(npm --version)"
  log "node_path=$(command -v node)"
}

main "$@"
