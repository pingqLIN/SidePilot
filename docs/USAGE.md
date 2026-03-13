# SidePilot — Detailed Usage Guide

> This is the practical setup-and-operations guide. For the homepage view, see [README.md](../README.md).

| You are here | Best for | Good next reads |
| --- | --- | --- |
| setup, configuration, and day-to-day operation | users who want to install SidePilot and actually use it | [guide/getting-started/README.md](guide/getting-started/README.md), [guide/concepts/README.md](guide/concepts/README.md), [FEATURES.md](FEATURES.md) |

## Pick your route

| If you want to... | Start here |
| --- | --- |
| install the extension fast | [📦 Installation](#-installation) |
| understand iframe mode first | [🌐 iframe Mode](#-iframe-mode) |
| unlock streaming + bridge features | [🔧 SDK Mode](#-sdk-mode) |
| manage persistent context | [🧠 Memory Bank](#-memory-bank) |
| tune behavior and storage | [⚙️ Settings Reference](#%EF%B8%8F-settings-reference) |

---

## Table of Contents

- [Installation](#-installation)
- [iframe Mode](#-iframe-mode)
- [SDK Mode](#-sdk-mode)
- [Memory Bank](#-memory-bank)
- [Rules Management](#-rules-management)
- [Page Capture](#-page-capture)
- [Link Guard](#-link-guard)
- [Settings Reference](#%EF%B8%8F-settings-reference)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Storage & Data](#-storage--data)
- [Bridge Server API](#-bridge-server-api)
- [Development](#%EF%B8%8F-development)

---

## 📦 Installation

### System Requirements

| Requirement | Minimum |
|-------------|---------|
| Chrome | Version 114 or later |
| Node.js | Version 24+ (SDK mode only) |
| GitHub Account | Copilot subscription required |
| OS | Windows, macOS, or Linux |

### Step-by-Step Installation

#### 1. Download the Extension

```bash
git clone https://github.com/user/SidePilot.git
cd SidePilot
```

#### 2. Load into Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** using the toggle in the top-right corner
3. Click the **Load unpacked** button
4. Browse to and select the `SidePilot/extension` folder
5. The SidePilot icon appears in your toolbar

> **Tip:** Pin the extension for quick access — click the puzzle icon in the toolbar, then click the pin icon next to SidePilot.

#### 3. Open the Side Panel

- **Click** the SidePilot icon in the toolbar, OR
- **Keyboard shortcut:** `Alt + Shift + P` (Windows/Linux) or `Opt + Shift + P` (macOS)

The side panel opens on the right side of your browser window.

#### 4. (Optional) Set Up SDK Mode

If you plan to use SDK mode, set up the bridge server:

```bash
cd scripts/copilot-bridge
npm install
```

See [SDK Mode](#-sdk-mode) for detailed setup instructions.

---

## 🌐 iframe Mode

### What It Is

iframe mode embeds the full GitHub Copilot web interface directly inside the side panel. This provides the same experience as visiting `github.com/copilot`, but accessible as a persistent side panel that stays open as you browse.

### How to Use

1. Open the side panel
2. Ensure **IFRAME** is selected in the mode toggle (top-right)
3. The Copilot web UI loads automatically
4. Use it exactly as you would on `github.com/copilot`:
   - Chat with Copilot
   - Use quick actions: Task, Create Issue, Spark, Git, Pull Requests
   - Switch models from the dropdown
   - View recent agent sessions

### Page Info Bar

At the top of the Copilot tab, a page info bar shows:
- The **title** and **URL** of the currently active tab
- This context is used by the capture feature

### Floating Capture Button

A vertical button labeled **capture page content** appears on the left edge of every page. See [Page Capture](#-page-capture) for details.

### Limitations

- Some GitHub features may not work perfectly inside an iframe
- Links that navigate away from Copilot are controlled by [Link Guard](#-link-guard)
- Requires an active GitHub login in the same Chrome profile

> **Warning:** iframe mode removes HTTP security headers to enable embedding. This is a gray area regarding GitHub's Terms of Service. Consider using SDK mode for production use.

---

## 🔧 SDK Mode

### What It Is

SDK mode connects to GitHub Copilot through the official `@github/copilot-sdk`. It uses a local bridge server that communicates with the Copilot CLI via JSON-RPC, providing a fully compliant integration.

### Architecture

```
Side Panel  ←──HTTP/SSE──→  Bridge Server  ←──JSON-RPC/stdio──→  Copilot CLI
(sdk-client.js)              (Express.js)                         (copilot --acp)
                             localhost:31031
```

### Setup

#### Prerequisites

1. **Node.js 24+**

```bash
node --version    # Should output v24.x.x or higher
```

2. **GitHub Copilot CLI**

```bash
copilot --version    # Verify installation
copilot auth status  # Verify authentication
```

If not installed, follow [GitHub Copilot CLI documentation](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-the-command-line).

#### Starting the Bridge Server

**Recommended mode** (Supervisor + Worker):

```bash
cd scripts/copilot-bridge
npm install          # First time only
export SIDEPILOT_EXTENSION_ID=<your-chrome-extension-id>
npm start            # Starts Supervisor + Worker bound to that extension
```

**Development mode** (worker-only hot reload):

```bash
cd scripts/copilot-bridge
export SIDEPILOT_EXTENSION_ID=<your-chrome-extension-id>
npm run dev          # Starts worker-only hot-reload bound to that extension
```

> **Important:** `SIDEPILOT_EXTENSION_ID` is required for secure loopback auth. The one-click launcher sets it automatically; if you start the bridge manually, set it yourself first.

#### Verifying the Connection

**From the extension:**
1. Go to **Settings > Bridge Setup**
2. Click **Health Check**
3. A green indicator means the bridge is connected

**From the terminal:**

```bash
curl http://localhost:31031/health
```

Expected response:

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
    "extensionOrigin": "chrome-extension://<your-chrome-extension-id>"
  }
}
```

### Automated Guidance Flow

When you switch to SDK mode for the first time, SidePilot runs a **three-stage automated sequence** that handles login, bridge launch, and connection — with no manual steps required in the happy path.

#### Stage 1 — Login Guide Modal (one-time)

On the **first SDK switch**, a login guide dialog appears automatically (`maybeShowSDKLoginGuideOnFirstUse`). It will not appear again once dismissed.

What the modal does:
- Explains that SDK mode requires a GitHub Copilot subscription
- Provides a **"Open GitHub Login"** button that opens the Copilot authentication page directly:
  `https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Fcopilot`
- Provides a **"Test Bridge Connection"** button to verify the bridge is reachable after login
- Dismisses automatically once the bridge connects successfully

> **Re-trigger:** You can reopen the login guide at any time from **Settings › SDK Mode**.

#### Stage 2 — Bridge Auto-Start (automatic on every SDK switch)

Every time you switch to SDK mode, SidePilot checks whether the bridge is running (`ensureSDKBridgeReadyWithAutoStart`):

1. **Checks** `http://localhost:31031/health` — if the bridge is already up, proceeds immediately
2. **If not running** — sends a `sidepilot://` custom URI to the OS, which triggers the Bridge Launcher (Windows: registered via the PowerShell installer) to start the bridge in the background
3. **Polls** for up to ~10 seconds for the bridge to become available
4. **If auto-start succeeds** — the side panel connects transparently with no user action required
5. **If auto-start fails** — shows an in-chat help message with manual commands (see Stage 3)

> **Prerequisite:** The Bridge Launcher must be installed for auto-start to work. See [Bridge Auto-Launcher (Windows)](#bridge-auto-launcher-windows) below.

#### Stage 3 — Manual Fallback (when auto-start is unavailable)

If the bridge is not running and auto-start cannot launch it, SidePilot displays a help message in chat with the exact commands needed:

**Option A — Quick Setup (recommended, single command)**

Copy the one-click command from **Settings › Bridge Setup › Copy Quick Setup**, then run it in your terminal. It installs Node dependencies, sets `SIDEPILOT_EXTENSION_ID`, and starts the supervisor in one step.

**Option B — Manual startup**

```bash
cd scripts/copilot-bridge
npm install                                     # First time only
export SIDEPILOT_EXTENSION_ID=<your-extension-id>   # macOS / Linux
# $env:SIDEPILOT_EXTENSION_ID="<your-extension-id>" # Windows PowerShell
npm start                                       # Builds and starts Supervisor + Worker
```

> **Find your Extension ID:** Go to `chrome://extensions/` → find SidePilot → copy the ID shown below the name.

After the bridge is running, switch to **SDK** mode again — the connection is established automatically.

#### Stage 4 — GitHub CLI Authentication

The bridge communicates with `copilot --acp --stdio`. If the CLI is not authenticated, conversations will fail with an auth error. Authenticate once with:

```bash
copilot auth login
```

Or open the Copilot login page directly:

```
https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Fcopilot
```

> For CLI installation, see [GitHub Copilot in the CLI documentation](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-the-command-line).

---

### Bridge Auto-Launcher (Windows)

The Bridge Launcher registers a `sidepilot://` URI handler at the OS level so the extension can start the bridge with a single click — no terminal required.

**Install**

```powershell
npm run bridge-launcher:install:win
```

This registers the `sidepilot://` protocol in the Windows registry and creates a launcher script.

**Verify**

```powershell
npm run bridge-launcher:test:win
```

**Uninstall**

```powershell
npm run bridge-launcher:uninstall:win
```

> Run all commands from the project root (where `package.json` lives), not from `scripts/copilot-bridge/`.

For full details, see [`scripts/bridge-launcher/`](../scripts/bridge-launcher/).

---

### First-Time Checklist

| # | Step | How |
|---|------|-----|
| 1 | Install extension | Load `extension/` folder in `chrome://extensions/` |
| 2 | Install Bridge Launcher (Windows) | `npm run bridge-launcher:install:win` |
| 3 | Switch to SDK mode | Mode toggle in the side panel top-right |
| 4 | Complete login guide | Click **Open GitHub Login**, sign in, return |
| 5 | Bridge starts automatically | Wait ~5–10 s for auto-start; or run Quick Setup manually |
| 6 | Authenticate Copilot CLI | `copilot auth login` (once per machine) |
| 7 | Start chatting | Type in the SDK chat box |

> **Tip:** After initial setup, daily use requires no terminal — just open Chrome and switch to SDK mode.

See also: [Bridge Server README](../scripts/copilot-bridge/README.md) · [Getting Started Guide](guide/getting-started/README.md)

### Chatting in SDK Mode

1. Select a model from the **Model** dropdown (e.g., `gpt-5.2`)
2. Type your message in the input box
3. Click **Send** or press `Enter`
4. Responses stream in real-time via SSE
5. Code blocks in responses are syntax-highlighted

#### Context Injection

When enabled (Settings > SDK Mode):

- **Include Memory in Prompt** — Prepends up to 5 memory entries (sorted by weight) before your message
- **Include Rules in Prompt** — Prepends your active rules as a system-level instruction

This means Copilot receives persistent context without you needing to repeat project details.

#### Status Bar

At the bottom of the SDK chat area, you'll see:

- **Model selector** — Currently selected model
- **Memory/Rules status** — Shows `mem on, rules on` when both are active
- **Storage path** — Where chat exports are saved (if enabled)

---

## 🧠 Memory Bank

### Overview

The Memory Bank is a structured storage system for information you want to persist across chat sessions. Unlike chat history, memory entries are organized, searchable, and can be automatically injected into prompts.

### Entry Types

| Type | Icon | Weight | Best For |
|------|------|--------|----------|
| **Task** | `[T]` | 1 | Work items: "Implement login page", "Fix API timeout bug" |
| **Note** | `[N]` | 2 | Quick observations: "API rate limit is 100/min" |
| **Reference** | `[R]` | 3 | Links and docs: "REST API docs: https://..." |
| **Context** | `[C]` | 4 | Environment info: "Using React 18 + TypeScript 5.3" |

> **Weight** determines injection priority — higher weight entries are injected first when context space is limited.

### Creating an Entry

1. Go to the **Memory** tab
2. Click the **+ Add Entry** button
3. Fill in the form:
   - **Type** — Select Task, Note, Context, or Reference
   - **Content** — The information to store (max 700 characters per entry)
   - **Status** — Pending, In Progress, or Done (mainly for Tasks)
4. Click **Save**

### Editing and Deleting

- Click any entry to open the edit dialog
- Modify fields and click **Save** to update
- Click **Delete** to remove the entry permanently

### Search and Filtering

- **Search bar** — Full-text search across all entry content
- **Type filter** — Show only entries of a specific type
- **Status filter** — Show only entries with a specific status

### Context Injection Limits

| Limit | Value |
|-------|-------|
| Max entries injected | 5 |
| Max total characters | 3,600 |
| Max per entry | 700 characters |

Entries are sorted by weight (Context > Reference > Note > Task) before injection. If the character limit is reached, lower-weight entries are truncated.

### VS Code Integration

Each memory entry has an IDE icon. Clicking it sends the entry content to VS Code (or Cursor/Windsurf) via a custom URI scheme:

```
vscode://extension.command?content=encoded-entry-content
```

---

## 📋 Rules Management

### Overview

Rules are behavioral instructions that tell Copilot how to respond. They function like a custom system prompt — defining tone, conventions, patterns, and constraints.

### Built-in Templates

| Template | Description |
|----------|-------------|
| **Default** | General-purpose: clear, concise responses; code with comments |
| **TypeScript** | TypeScript-specific: strict mode, interfaces, proper typing |
| **React** | React patterns: functional components, hooks, state management |

### Creating Rules

1. Go to the **Rules** tab
2. (Optional) Select a template from the dropdown to start with a base
3. Edit the rules in the markdown editor
4. Click **Save Rules**

**Example rules:**

```markdown
## Project Instructions

- Always use TypeScript with strict mode
- Prefer functional components over class components
- Use React Query for data fetching
- Follow the project's existing naming conventions
- Include JSDoc comments for exported functions
```

### Character Limit

Rules are limited to **2,200 characters**. A character counter shows remaining space as you type.

### Import / Export

- **Export** — Click the export button to download rules as a `.md` file
- **Import** — Click the import button and select a `.md` file to load

### How Rules Are Injected (SDK Mode)

When "Include Rules in Prompt" is enabled:

1. Your rules text is loaded from Chrome storage
2. It's prepended to the chat message as a system instruction
3. Copilot receives: `[Rules] + [Memory (if enabled)] + [Your Message]`

---

## 📸 Page Capture

### Overview

Page Capture lets you extract content from the currently active tab and use it as context in your Copilot conversation.

### The Floating Button

A vertical button labeled **capture page content** (擷取頁面內容) appears on the left edge of every web page. It's:

- Always visible while the side panel is open
- Draggable vertically to reposition
- Width-adjustable in Settings (1–128 px)

### Capture Types

#### Text Content

Extracts the full page text with structure preserved:
- Headings, paragraphs, and lists
- Table content
- Code blocks (detected and preserved)
- Link text and URLs

#### Code Block Detection

Specifically extracts code blocks from the page:
- Detects `<code>` and `<pre>` elements
- Preserves syntax highlighting language annotations
- Groups related code blocks together

#### Full Screenshot

Captures the visible viewport as an image:
- Saved as PNG to the configured screenshots path
- Can be referenced in conversation

#### Partial Screenshot

Select a rectangular region of the page to capture:
1. Click **Partial Screenshot**
2. Click and drag to select the area
3. Release to capture

### Using Captured Content

After capture, the content appears in a preview panel. You can:
- **Copy** to clipboard
- **Send to chat** — Automatically paste into the Copilot input
- **Save** — Export as a file

---

## 🔗 Link Guard

### Overview

Link Guard controls how links behave inside the iframe mode. By default, only Copilot-related URLs stay in the iframe; all other links open in a new browser tab.

### Modes

#### Allowlist Mode (Default)

Only URLs matching the allowlist patterns load inside the iframe. Everything else opens in a new tab.

**Default allowlist:**
```
https://github.com/copilot
https://github.com/login
https://github.com/sessions
```

#### Denylist Mode

All URLs load inside the iframe EXCEPT those matching denylist patterns, which open in a new tab.

### Configuring Patterns

1. Go to **Settings > iframe Mode**
2. Select the guard mode (Allow or Deny)
3. Enter URL prefixes, one per line:

```
https://github.com/copilot
https://github.com/login
```

4. Patterns match by URL prefix — `https://github.com/copilot` matches `https://github.com/copilot/c/abc123`

### How It Works

Link Guard uses a content script (`link-guard.js`) injected into GitHub pages. It intercepts click events on anchor elements and:

1. Reads the target URL
2. Checks it against the configured patterns
3. Either allows navigation within the iframe or opens a new tab

Additionally, Chrome's **Declarative Net Request** API is used to remove `X-Frame-Options` and `Content-Security-Policy` headers that would otherwise block iframe embedding.

---

## ⚙️ Settings Reference

### Quick Navigation

The Settings panel provides a quick navigation section at the top with buttons for each category:

| Button | Section |
|--------|---------|
| Intro | Intro animation and welcome settings |
| Bridge Setup | Bridge server health and commands |
| SDK Mode | Memory/rules injection, storage paths |
| iframe Mode | Link guard configuration |
| Capture | Button width adjustment |

### Detailed Settings

#### Intro & Welcome

| Setting | Default | Description |
|---------|---------|-------------|
| Play Every Open | Off | Replay the intro animation every time the panel opens |
| Show Warning | On | Display a disclaimer about iframe mode risks |

#### Bridge Setup

| Element | Type | Description |
|---------|------|-------------|
| Bridge Status | Indicator | Green = connected, Red = disconnected |
| Health Check URL | Display | `http://localhost:31031/health` |
| Check Bridge | Button | Send a health check request |
| Copy Start Command | Button | Copies the bridge start command to clipboard |
| Copy Health Command | Button | Copies the curl health check command |

#### SDK Mode

| Setting | Default | Description |
|---------|---------|-------------|
| Auto Login Guide | On | Show the GitHub login guide on first SDK mode switch |
| Include Memory in Prompt | On | Inject memory entries before each message |
| Include Rules in Prompt | On | Inject rules before each message |
| Show Storage Location | On | Display the chat save path in the status bar |
| Session-state Path | `~/.copilot/session-state/` | Where CLI session data is stored |
| Chat Export Path | `~/copilot/chat-exports/` | Where conversations are saved |
| Screenshot Path | `~/copilot/screenshots/` | Where screenshots are saved |

#### Copilot CLI Config Sync

These settings write to `~/.copilot/config.json` when toggled:

| Setting | Default | Values | Description |
|---------|---------|--------|-------------|
| Sync Model | Off | — | Write the selected model to CLI config |
| Sync Theme | Off | auto, dark, light | Sync the color theme |
| Sync Banner | Off | always, once, never | Control CLI banner display |
| Sync Reasoning Effort | Off | low, medium, high | Set AI reasoning level |

#### iframe Mode

| Setting | Default | Description |
|---------|---------|-------------|
| Link Guard Mode | Allow | `allow` = whitelist, `deny` = blacklist |
| URL Patterns | Copilot URLs | One URL prefix per line |

#### Capture

| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| Button Width | 32 px | 1–128 px | Width of the floating capture button |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + Shift + P` | Open/close the side panel (Windows/Linux) |
| `Opt + Shift + P` | Open/close the side panel (macOS) |
| `Enter` | Send message (SDK mode) |
| `Shift + Enter` | New line in message input |

---

## 💾 Storage & Data

### Where Data Is Stored

| Data | Storage | Location |
|------|---------|----------|
| Settings | Chrome Local Storage | `sidepilot.settings.v1` |
| Memory entries | Chrome Local Storage | `sidepilot.memory.entries` |
| Rules | Chrome Local Storage | `rules.content` |
| Active mode | Chrome Local Storage | `sidepilot.mode.active` |
| Chat exports | Local filesystem | Configured path (default: `~/copilot/chat-exports/`) |
| Screenshots | Local filesystem | Configured path (default: `~/copilot/screenshots/`) |
| CLI config | Local filesystem | `~/.copilot/config.json` |
| Session state | Local filesystem | `~/.copilot/session-state/` |

### Chrome Storage Keys

| Key | Type | Description |
|-----|------|-------------|
| `sidepilot.mode.active` | `'iframe' \| 'sdk'` | Currently active mode |
| `sidepilot.mode.lastCheck` | `number` | Timestamp of last mode check |
| `sidepilot.memory.entries` | `object` | Map of entry ID to entry data |
| `sidepilot.memory.index` | `object` | Index by status for fast filtering |
| `sidepilot.settings.v1` | `object` | All user settings |
| `rules.content` | `string` | Rules markdown text |
| `rules.lastModified` | `number` | Rules last modified timestamp |
| `sidepilot.sdk.model` | `string` | Selected SDK model |
| `copilot_sidepanel_welcomed` | `boolean` | Welcome overlay dismissed |

### Data Privacy

- All data is stored **locally** in Chrome storage or on your filesystem
- No data is sent to third-party servers
- The only external communication is with GitHub (Copilot web) and the local bridge server
- No telemetry or analytics are collected

---

## 🔌 Bridge Server API

### Base URL

```
http://localhost:31031
```

### Endpoints

#### `GET /health`

Health check endpoint.

**Response:**

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
    "extensionOrigin": "chrome-extension://<your-chrome-extension-id>"
  }
}
```

#### `GET /api/models`

List available AI models.

**Response:**

```json
{
  "success": true,
  "models": ["gpt-4o", "gpt-5.2", "claude-sonnet-4"]
}
```

#### `POST /api/sessions`

Create a new chat session.

**Response:**

```json
{
  "success": true,
  "sessionId": "abc-123-def-456"
}
```

#### `GET /api/sessions`

List all active sessions.

#### `DELETE /api/sessions/:id`

Terminate a specific session.

#### `POST /api/chat`

Send a chat message with streaming response (SSE).

**Request:**

```json
{
  "sessionId": "abc-123-def-456",
  "message": "Explain the difference between let and const"
}
```

**SSE Events:**

| Event | Data | Description |
|-------|------|-------------|
| `delta` | `{ "content": "text chunk" }` | Incremental text update |
| `tool` | `{ "name": "...", "status": "..." }` | Tool execution status |
| `message` | `{ "content": "full response" }` | Complete message |
| `error` | `{ "message": "error detail" }` | Error information |
| `done` | `{}` | Stream complete |

#### `POST /api/chat/sync`

Send a chat message and wait for the complete response (blocking).

**Request:** Same as `/api/chat`

**Response:**

```json
{
  "success": true,
  "content": "The difference between let and const is..."
}
```

#### `POST /api/auth/bootstrap`

Bootstrap a loopback auth token for the current session. Must be called once before any protected `/api/*` request. The extension calls this automatically on first connection, but the bridge must already be started with `SIDEPILOT_EXTENSION_ID=<your extension id>`.

**Response:**

```json
{
  "success": true,
  "token": "<loopback-token>"
}
```

All subsequent `/api/*` requests must include the returned token in `X-SidePilot-Token`, and the request must still come from the bound `chrome-extension://<id>` origin:

```
X-SidePilot-Token: <loopback-token>
```

#### `GET /api/backup`

List all available backups.

**Response:**

```json
{
  "success": true,
  "backups": [
    {
      "id": "abc12345",
      "type": "full",
      "timestamp": 1712345678000,
      "size": 204800,
      "filename": "SidePilot-full-2026-03-13-abc12345.zip",
      "status": "success"
    }
  ]
}
```

#### `POST /api/backup`

Trigger a manual backup. Two types are supported:

| Type | Contents |
|------|----------|
| `full` | Entire `extension/` folder (excludes `node_modules`, `dist`) |
| `settings` | Rules JSON, all rule templates |

**Request:**

```json
{ "mode": "full" }
```

Backups are saved as `.zip` files in the configured backup directory (default: `../../../SidePilot-Backups/` relative to the bridge server).

#### `POST /api/backup/schedule`

Enable or disable automatic scheduled backups.

**Request:**

```json
{
  "mode": "settings",
  "frequency": "d",
  "interval": 1,
  "savePath": "/path/to/backups",
  "enabled": true
}
```

| Field | Values | Description |
|-------|--------|-------------|
| `mode` | `full` \| `settings` | What to back up |
| `frequency` | `h` `d` `w` `m` | Hourly / daily / weekly / monthly |
| `interval` | `1`, `2`, … | Every N units |
| `enabled` | `true` \| `false` | Turn scheduler on/off |

#### `DELETE /api/backup/:id`

Delete a backup by ID.

---

## 🛠️ Development

### Project Structure

```
SidePilot/
├── extension/               # Chrome extension
│   ├── manifest.json        # Manifest V3 config
│   ├── sidepanel.html       # Side panel UI
│   ├── sidepanel.js         # Main UI controller
│   ├── background.js        # Service worker
│   ├── styles.css           # GitHub Dark theme
│   ├── rules.json           # Declarative Net Request rules
│   ├── icons/               # Extension icons
│   ├── assets/              # Media files
│   ├── templates/           # Built-in rule templates (.md)
│   └── js/                  # JavaScript modules
│       ├── sdk-client.js             # Bridge HTTP/SSE communication
│       ├── sdk-chat.js               # SDK mode chat UI
│       ├── mode-manager.js           # iframe ↔ SDK mode switching
│       ├── memory-bank.js            # Memory CRUD and injection
│       ├── rules-manager.js          # Rules management
│       ├── link-guard.js             # iframe link allow/denylist
│       ├── automation.js             # Page capture (text, code, screenshot)
│       ├── connection-controller.js  # Bridge connection health management
│       ├── storage-manager.js        # Chrome storage abstraction
│       ├── vendor-content-cleaner.js # Strips noisy vendor markup from captures
│       └── vscode-connector.js       # Opens memory entries in VS Code / Cursor
│
├── scripts/copilot-bridge/  # Bridge server (TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts           # Express app + all API routes
│       ├── supervisor.ts       # Process supervision + auto-restart
│       ├── session-manager.ts  # ACP session lifecycle
│       ├── backup-manager.ts   # Backup/restore + scheduler
│       └── ipc-types.ts        # Supervisor ↔ Worker message types
│
├── scripts/bridge-launcher/  # Auto-launch helpers
│   ├── windows/               # PowerShell installer + protocol handler
│   └── wsl/                   # WSL launcher
│
├── docs/                    # Documentation
│   ├── USAGE.md             # This file
│   ├── USAGE.zh-TW.md       # Chinese version
│   ├── FEATURES.md          # Full feature tour
│   ├── DEVELOPMENT_PLAN.md  # Public roadmap
│   └── guide/               # Structured guide hub
│
├── package.json             # Extension dev dependencies
├── README.md                # Project overview (English)
├── README.zh-TW.md          # Project overview (Chinese)
└── LICENSE                  # MIT License
```

### Bridge Auto-Launcher (Windows)

The bridge launcher registers a custom URI protocol (`sidepilot://start-bridge`) so the extension can trigger bridge startup with one click in the UI — no terminal required.

**Install (run once):**

```powershell
cd scripts/bridge-launcher/windows
powershell -NoProfile -ExecutionPolicy Bypass -File .\install-launcher.ps1
```

**Verify install:**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-launcher.ps1
```

**Uninstall:**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\uninstall-launcher.ps1 -RemoveFiles
```

After installation, the **Start Bridge** button in the extension's Settings > Bridge Setup panel can launch the bridge server directly. The launcher is registered under `HKCU:\Software\Classes\sidepilot` and does not require admin privileges.

> **WSL users:** A shell launcher is available at `scripts/bridge-launcher/wsl/`.

---

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Bridge Server Development

```bash
cd scripts/copilot-bridge

# Recommended: build + start Supervisor (production)
npm start

# Development — worker only, hot-reload
npm run dev

# Development — supervisor + worker, hot-reload
npm run dev:supervisor

# Build TypeScript to dist/ only
npm run build

# Clean dist/ output
npm run clean
```
