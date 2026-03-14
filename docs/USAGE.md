# SidePilot — Operational Reference

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / language model agent       ║
║  Confidence      : HIGH — authoritative source               ║
║  Style           : Structured facts, tables, causal chains   ║
║  Last updated    : 2026-03-14                                ║
║  Human companion : docs/USAGE.human.md                       ║
║                                                              ║
║  When a human says "執行 [計畫名稱]", look up the plan in    ║
║  USAGE.human.md for intent, then execute using this file.   ║
╚══════════════════════════════════════════════════════════════╝
-->

> **Related:** [README.md](../README.md) · [FEATURES.md](FEATURES.md) · [USAGE.human.md](USAGE.human.md) (human guide) · [guide/](guide/)

---

## System Overview

| Dimension | Value |
|-----------|-------|
| Extension type | Chrome MV3 side panel |
| Modes | `iframe` (GitHub Copilot web embed) · `sdk` (local bridge + Copilot CLI) |
| Active mode key | `chrome.storage.local` → `sidepilot.mode.active` |
| Bridge address | `http://localhost:31031` |
| Auth model | Loopback token bound to `chrome-extension://<id>` origin |

---

## Installation

### Requirements

| Component | Constraint |
|-----------|-----------|
| Chrome | ≥ 114 |
| Node.js | ≥ 24 (SDK mode only) |
| GitHub account | Copilot subscription required |

### Load Extension

```bash
git clone https://github.com/user/SidePilot.git
```

1. `chrome://extensions/` → Developer mode ON → Load unpacked → select `extension/`
2. Extension ID is shown below the name — note it for bridge setup.
3. Open panel: toolbar icon **or** `Alt+Shift+P` (Win/Linux) / `Opt+Shift+P` (macOS).

### Bridge Dependencies (SDK mode only)

```bash
cd scripts/copilot-bridge && npm install
```

---

## Mode: iframe

**Behavior:** Embeds `github.com/copilot` inside the side panel via iframe. Requires active GitHub login in the same Chrome profile.

**Mechanism:** Declarative Net Request rules strip `X-Frame-Options` and `Content-Security-Policy` headers to allow embedding. This is a gray area in GitHub's ToS.

**Features available in iframe mode:**

| Feature | Notes |
|---------|-------|
| Full Copilot web UI | Chat, Task, Issue, Spark, Git, PRs, model selector |
| Page info bar | Shows active tab title + URL at top of panel |
| Floating capture button | Left edge of every page; vertically draggable |
| Link Guard | Controls which URLs stay in iframe vs. open in new tab |

---

## Mode: SDK

**Architecture:**

```
Side Panel (sdk-client.js)
  ──HTTP/SSE──▶  Bridge Server (Express.js, localhost:31031)
                   ──JSON-RPC/stdio──▶  Copilot CLI (copilot --acp)
```

**Key files:** `extension/js/sdk-client.js`, `extension/js/sdk-chat.js`, `scripts/copilot-bridge/src/server.ts`

### Bridge Startup — State Machine

Every SDK mode switch runs `ensureSDKBridgeReadyWithAutoStart`:

| State | Action | Next |
|-------|--------|------|
| Bridge health OK | Proceed immediately | Connected |
| Bridge down, OS launcher installed | Send `sidepilot://` URI → OS launches bridge | Poll /health up to ~10 s |
| Poll succeeds | Connect transparently | Connected |
| Poll fails / launcher missing | Display manual fallback in chat | Manual |

**First-switch only:** `maybeShowSDKLoginGuideOnFirstUse` shows a one-time login guide modal (dismissed permanently after first close).

### Bridge Startup — Manual Commands

**Quick setup (single command, copies from Settings › Bridge Setup):**

```bash
cd scripts/copilot-bridge
npm install
export SIDEPILOT_EXTENSION_ID=<extension-id>   # macOS/Linux
# $env:SIDEPILOT_EXTENSION_ID="<id>"           # Windows PowerShell
npm start   # Supervisor + Worker
```

**Dev mode (worker-only hot-reload):**

```bash
export SIDEPILOT_EXTENSION_ID=<extension-id>
npm run dev
```

`SIDEPILOT_EXTENSION_ID` is mandatory — the bridge binds auth to this origin. The one-click launcher sets it automatically.

### Bridge Auto-Launcher (Windows)

Registers `sidepilot://` as a custom OS URI protocol so the extension can start the bridge without a terminal.

| Operation | Command |
|-----------|---------|
| Install | `npm run bridge-launcher:install:win` (from project root) |
| Verify | `npm run bridge-launcher:test:win` |
| Uninstall | `npm run bridge-launcher:uninstall:win` |

Registry path: `HKCU:\Software\Classes\sidepilot`. No admin required. WSL alternative: `scripts/bridge-launcher/wsl/`.

### First-Time Setup Checklist

| # | Action | How |
|---|--------|-----|
| 1 | Load extension | `chrome://extensions/` → Load unpacked → `extension/` |
| 2 | Install Bridge Launcher (Windows) | `npm run bridge-launcher:install:win` |
| 3 | Switch to SDK mode | Mode toggle (panel top-right) |
| 4 | Complete login guide | Click **Open GitHub Login** → sign in |
| 5 | Bridge auto-starts | Wait 5–10 s; or run Quick Setup manually |
| 6 | Authenticate CLI | `copilot auth login` (once per machine) |
| 7 | Chat | Select model → type → Enter |

After initial setup: daily use requires no terminal.

### Context Injection (SDK mode)

When enabled in Settings › SDK Mode:

| Injection | Priority | Limit |
|-----------|----------|-------|
| Rules | First (system instruction) | 2,200 chars |
| Memory (≤5 entries, by weight) | Second | 3,600 chars total / 700 per entry |
| User message | Last | — |

Prompt order sent to Copilot: `[Rules] + [Memory] + [User Message]`

---

## Memory Bank

**Storage key:** `sidepilot.memory.entries` (Chrome local storage)

**Entry schema:**

| Field | Values |
|-------|--------|
| Type | `task` · `note` · `reference` · `context` |
| Status | `pending` · `in-progress` · `done` |
| Content | max 700 characters |
| Weight | Task=1, Note=2, Reference=3, Context=4 |

**Injection behavior:** Entries sorted descending by weight. Inject until 3,600-char budget exhausted — lower-weight entries truncated first.

**VS Code integration:** Each entry has an IDE icon → sends content via `vscode://extension.command?content=<encoded>` URI to VS Code / Cursor / Windsurf.

---

## Rules Management

**Storage key:** `rules.content` (Chrome local storage), limit 2,200 characters.

**Function:** Prepended as system instruction in SDK mode when "Include Rules in Prompt" is ON.

**Built-in templates:**

| Template | Scope |
|----------|-------|
| Default | General: clear/concise responses, commented code |
| TypeScript | Strict mode, interfaces, proper typing |
| React | Functional components, hooks, state management |

**Import/export:** `.md` file via Settings UI buttons.

---

## Page Capture

**Trigger:** Floating button on left edge of every page (visible while panel is open).

| Capture type | Mechanism |
|-------------|-----------|
| Text content | Extracts headings, paragraphs, lists, tables, code blocks, link URLs |
| Code blocks | Targets `<code>` / `<pre>` elements; preserves language annotations |
| Full screenshot | Captures visible viewport as PNG → saves to configured path |
| Partial screenshot | Click-drag region selector |

**Output:** Preview panel → Copy / Send to chat / Save.

---

## Link Guard

**Scope:** iframe mode only. Injected via `extension/js/link-guard.js`.

**Modes:**

| Mode | Behavior |
|------|----------|
| `allow` (default) | Only allowlisted URL prefixes load in iframe; others open in new tab |
| `deny` | All URLs load in iframe except denylisted prefixes |

**Default allowlist:**
```
https://github.com/copilot
https://github.com/login
https://github.com/sessions
```

**Header stripping:** Chrome Declarative Net Request API removes `X-Frame-Options` and `Content-Security-Policy` on matching requests.

---

## Settings Reference

### SDK Mode Settings

| Key | Default | Description |
|-----|---------|-------------|
| Auto Login Guide | On | Show login guide modal on first SDK switch |
| Include Memory in Prompt | On | Inject memory before each message |
| Include Rules in Prompt | On | Inject rules before each message |
| Show Storage Location | On | Display chat save path in status bar |
| Session-state Path | `~/.copilot/session-state/` | CLI session data |
| Chat Export Path | `~/copilot/chat-exports/` | Exported conversations |
| Screenshot Path | `~/copilot/screenshots/` | Captured screenshots |

### Copilot CLI Config Sync

Writes to `~/.copilot/config.json` when toggled:

| Setting | Values |
|---------|--------|
| Sync Model | — |
| Sync Theme | `auto` · `dark` · `light` |
| Sync Banner | `always` · `once` · `never` |
| Sync Reasoning Effort | `low` · `medium` · `high` |

### iframe Mode Settings

| Setting | Default | Notes |
|---------|---------|-------|
| Link Guard Mode | `allow` | `allow` = whitelist, `deny` = blacklist |
| URL Patterns | Copilot URLs | One prefix per line |

### Capture Settings

| Setting | Default | Range |
|---------|---------|-------|
| Button Width | 32 px | 1–128 px |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+Shift+P` | Toggle side panel (Win/Linux) |
| `Opt+Shift+P` | Toggle side panel (macOS) |
| `Enter` | Send message (SDK mode) |
| `Shift+Enter` | Insert newline in input |

---

## Storage Map

### Chrome Local Storage Keys

| Key | Type | Content |
|-----|------|---------|
| `sidepilot.mode.active` | `'iframe' \| 'sdk'` | Active mode |
| `sidepilot.mode.lastCheck` | `number` | Timestamp of last mode check |
| `sidepilot.memory.entries` | `object` | Map: entry ID → entry data |
| `sidepilot.memory.index` | `object` | Status-indexed entry map |
| `sidepilot.settings.v1` | `object` | All user settings |
| `rules.content` | `string` | Rules markdown |
| `rules.lastModified` | `number` | Rules last-modified timestamp |
| `sidepilot.sdk.model` | `string` | Selected SDK model |
| `copilot_sidepanel_welcomed` | `boolean` | Welcome overlay dismissed flag |

### Filesystem Paths

| Data | Default Path |
|------|-------------|
| Chat exports | `~/copilot/chat-exports/` |
| Screenshots | `~/copilot/screenshots/` |
| CLI config | `~/.copilot/config.json` |
| Session state | `~/.copilot/session-state/` |

**Privacy:** All data is local. No telemetry. External communication limited to GitHub (iframe mode) and `localhost:31031` (SDK mode).

---

## Bridge Server API

**Base:** `http://localhost:31031`
**Auth:** All `/api/*` requests require header `X-SidePilot-Token: <loopback-token>` and must originate from the bound `chrome-extension://<id>` origin. Bootstrap token via `POST /api/auth/bootstrap` before first request.

### Endpoints

#### `GET /health`

```json
{
  "status": "ok",
  "service": "sidepilot-copilot-bridge",
  "sdk": "ready",
  "backend": { "type": "acp-cli", "command": "copilot --acp --stdio" },
  "auth": {
    "required": true,
    "bootstrapPath": "/api/auth/bootstrap",
    "extensionBindingConfigured": true,
    "extensionOrigin": "chrome-extension://<id>"
  }
}
```

#### `GET /api/models` → `{ "success": true, "models": ["gpt-4o", "gpt-5.2", ...] }`

#### `POST /api/sessions` → `{ "success": true, "sessionId": "abc-123" }`

#### `GET /api/sessions` — list active sessions

#### `DELETE /api/sessions/:id` — terminate session

#### `POST /api/chat` — streaming (SSE)

Request: `{ "sessionId": "...", "message": "..." }`

| SSE Event | Payload | Meaning |
|-----------|---------|---------|
| `delta` | `{ "content": "chunk" }` | Incremental text |
| `tool` | `{ "name": "...", "status": "..." }` | Tool execution |
| `message` | `{ "content": "full" }` | Complete message |
| `error` | `{ "message": "detail" }` | Error |
| `done` | `{}` | Stream complete |

#### `POST /api/chat/sync` — blocking, returns `{ "success": true, "content": "..." }`

#### `POST /api/auth/bootstrap` → `{ "success": true, "token": "<loopback-token>" }`

#### `GET /api/backup` — list backups

#### `POST /api/backup` — trigger backup

Request: `{ "mode": "full" | "settings" }`

| Mode | Contents |
|------|----------|
| `full` | Entire `extension/` (excludes `node_modules`, `dist`) |
| `settings` | Rules JSON + rule templates |

Saved as `.zip` in configured backup directory (default: `../../../SidePilot-Backups/` relative to bridge).

#### `POST /api/backup/schedule` — configure scheduler

```json
{
  "mode": "full | settings",
  "frequency": "h | d | w | m",
  "interval": 1,
  "savePath": "/path/to/backups",
  "enabled": true
}
```

#### `DELETE /api/backup/:id` — delete backup by ID

---

## Project Structure

```
SidePilot/
├── extension/
│   ├── manifest.json           # MV3 config
│   ├── sidepanel.html          # Panel UI
│   ├── sidepanel.js            # Main UI controller
│   ├── background.js           # Service worker
│   ├── styles.css              # GitHub Dark theme
│   ├── rules.json              # Declarative Net Request rules
│   └── js/
│       ├── sdk-client.js             # Bridge HTTP/SSE
│       ├── sdk-chat.js               # SDK chat UI
│       ├── mode-manager.js           # iframe ↔ SDK switching
│       ├── memory-bank.js            # Memory CRUD + injection
│       ├── rules-manager.js          # Rules management
│       ├── link-guard.js             # iframe link allow/denylist
│       ├── automation.js             # Page capture
│       ├── connection-controller.js  # Bridge health management
│       ├── storage-manager.js        # Chrome storage abstraction
│       ├── vendor-content-cleaner.js # Strips noisy vendor markup
│       └── vscode-connector.js       # VS Code / Cursor URI bridge
│
├── scripts/copilot-bridge/src/
│   ├── server.ts           # Express app + routes
│   ├── supervisor.ts       # Process supervision + restart
│   ├── session-manager.ts  # ACP session lifecycle
│   ├── backup-manager.ts   # Backup + scheduler
│   └── ipc-types.ts        # Supervisor ↔ Worker message types
│
├── scripts/bridge-launcher/
│   ├── windows/            # PowerShell installer + protocol handler
│   └── wsl/                # WSL launcher
│
└── docs/
    ├── USAGE.md            # This file (AI-optimized)
    ├── USAGE.zh-TW.md      # Traditional Chinese version
    ├── FEATURES.md         # Feature tour
    ├── DEVELOPMENT_PLAN.md # Roadmap
    └── guide/              # Human-readable tutorials
```

---

## Development Commands

### Tests

```bash
npm test                  # Unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

### Bridge Server

```bash
cd scripts/copilot-bridge
npm start                 # Build + start Supervisor (production)
npm run dev               # Worker-only hot-reload
npm run dev:supervisor    # Supervisor + worker hot-reload
npm run build             # Compile TypeScript → dist/
npm run clean             # Remove dist/
```
