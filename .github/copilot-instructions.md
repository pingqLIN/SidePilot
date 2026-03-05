# Copilot Instructions for SidePilot

## Project Overview

SidePilot is a Chrome extension (Manifest V3, Chrome 114+) that integrates GitHub Copilot into a persistent browser side panel. It supports two operational modes:

- **iframe mode** — Zero-config, embeds the Copilot web UI in a side panel.
- **SDK mode** — Full API integration via a local Node.js bridge server (`scripts/copilot-bridge/`), with streaming responses, context injection, memory bank, and rules management.

## Repository Layout

```
extension/          Chrome extension source (JavaScript, HTML, CSS)
  js/               Core modules (mode-manager, sdk-client, sdk-chat, memory-bank, rules-manager, …)
  manifest.json     Manifest V3 declaration
  sidepanel.html    Side panel UI entry point

scripts/
  copilot-bridge/   Bridge server (TypeScript / Node.js / Express)
    src/
      server.ts         HTTP API (port 31031), session & config routes
      supervisor.ts     Process supervisor that spawns the worker
      session-manager.ts Copilot session lifecycle, ACP client

tests/
  extension/        Jest test suite for the Chrome extension modules

docs/               Screenshots and supplementary documentation
templates/          Configuration file templates
```

## How to Build & Test

### Chrome Extension (root)

The extension consists of plain JavaScript files that are loaded directly by Chrome — no build step required.

Run extension tests:
```bash
# From repo root
npm install          # installs jest and types
npm test             # runs Jest against tests/extension/
```

### Bridge Server (scripts/copilot-bridge/)

```bash
cd scripts/copilot-bridge
npm ci               # install dependencies

npm run build        # tsc → dist/
npm start            # node dist/supervisor.js  (production)
npm run dev          # tsx watch src/server.ts  (development, hot-reload)
```

The CI pipeline (`ci.yml`) runs `npm ci && npm run build && npm test` inside `scripts/copilot-bridge/` on every push/PR to `main`.

## Coding Conventions

### JavaScript (Extension)

- Always include `'use strict';` at the top of every module.
- Use `UPPER_SNAKE_CASE` for module-level constants; `camelCase` for functions and variables.
- Prefix console log messages with the module name in brackets, e.g. `[ModeManager]`, `[SDKClient]`.
- Separate logical sections within a file with banner comments:
  ```js
  // ============================================================
  // SECTION NAME
  // ============================================================
  ```
- Document every exported/public function with JSDoc (`@param`, `@returns`).
- Use the Chrome storage API (`chrome.storage.local` / `chrome.storage.sync`) for persistence — never `localStorage`.

### TypeScript (Bridge Server)

- TypeScript strict mode is enabled (`tsconfig.json`).
- ESM modules (`"type": "module"` in `package.json`); use `.js` extensions in import paths.
- Follow the same `[ClassName]` console-log prefix convention.
- Bind the Express server to `127.0.0.1` (loopback only) — never `0.0.0.0`.
- Keep CORS restricted to known origins; avoid `origin: '*'` for sensitive endpoints.

### Testing

- Tests live in `tests/extension/` and use **Jest 29** with **jsdom**.
- Mirror the structure of the module being tested, one test file per source module.
- Use `createMockSessionManager()` or similar factory helpers to avoid duplicating setup logic.
- Do not remove or weaken existing tests; add new tests for every new or changed behaviour.

## Architecture Notes

- **Bridge port**: The bridge server listens on `http://127.0.0.1:31031` (hardcoded in both the extension and the server).
- **Mode detection**: `extension/js/mode-manager.js` probes `/health` on the bridge server with a 5 s timeout to decide which mode is active.
- **Streaming**: SDK-mode responses use Server-Sent Events (SSE) for real-time output.
- **Integrity seal**: `extension/manifest.json`'s `version_name` stores a SHA-256 digest (first 8 hex chars) over the extension's critical files. Scripts in `scripts/seal-integrity.mjs` and `scripts/verify-integrity.mjs` manage this seal; update it whenever critical extension files change.
- **Context injection**: Memory-bank entries and rules are prepended to the prompt before each SDK request.

## Pull Request Guidelines

- Keep PRs focused on a single concern.
- The CI build must pass (build + tests for the bridge server) before merging.
- Update `scripts/seal-integrity.mjs` (re-run the sealing script) whenever files covered by the integrity check are modified.
- Add or update tests for any logic that is changed or added.
