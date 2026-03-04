<p align="center">
  <img src="docs/banner.png" width="1000" alt="SidePilot banner">
</p>

<h1 align="center">SidePilot</h1>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/Version-0.5.0-blue?style=flat-square">
  <img alt="Chrome" src="https://img.shields.io/badge/Chrome-114+-4285F4?style=flat-square&logo=google-chrome&logoColor=white">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Manifest-V3-34a853?style=flat-square">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square">
</p>

<p align="center">
  <b>GitHub Copilot, always at your side — persistent AI chat in the browser side panel.</b>
</p>

<p align="center">
  <a href="#-screenshots">Screenshots</a> &bull;
  <a href="#-feature-highlights">Features</a> &bull;
  <a href="#-quick-start">Quick Start</a> &bull;
  <a href="#-dual-mode-guide">Dual Mode</a> &bull;
  <a href="#-feature-modules">Modules</a> &bull;
  <a href="#%EF%B8%8F-architecture">Architecture</a> &bull;
  <a href="#-api-reference">API</a> &bull;
  <a href="#-faq">FAQ</a>
</p>

<p align="center">
  <a href="README.zh-TW.md">繁體中文</a> &bull;
  <a href="docs/FEATURES.md">Full Feature Guide</a> &bull;
  <a href="docs/SCREENSHOTS.md">Screenshot Gallery</a>
</p>

---

## 📸 Screenshots

<table>
  <tr>
    <td align="center">
      <b>iframe Mode</b><br>
      <img src="pic/01-iframe-mode.png" height="280" alt="iframe mode — embedded GitHub Copilot web UI">
      <br><sub>Embedded Copilot web UI, zero config</sub>
    </td>
    <td align="center">
      <b>SDK Mode</b><br>
      <img src="pic/02-sdk-chat.png" height="280" alt="SDK mode — real-time streaming chat">
      <br><sub>Official API with real-time streaming</sub>
    </td>
    <td align="center">
      <b>Rules Management</b><br>
      <img src="pic/03-rules-tab.png" height="280" alt="Rules management with templates">
      <br><sub>Behavioral instructions & templates</sub>
    </td>
    <td align="center">
      <b>Context Injection</b><br>
      <img src="pic/08-sdk-context.png" height="280" alt="SDK context injection">
      <br><sub>Auto-inject memory & rules into chat</sub>
    </td>
  </tr>
</table>

<details>
<summary><b>📷 More screenshots</b></summary>
<br>

| Feature                       | Screenshot                                                                           | Description                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| **Rules Management**          | <img src="pic/03-rules-tab.png" height="200" alt="Rules tab">                        | Edit behavioral instructions with built-in templates, import/export support |
| **Settings Panel**            | <img src="pic/04-settings-panel.png" height="200" alt="Settings panel">              | Collapsible settings sections for all configuration options                 |
| **SDK Settings**              | <img src="pic/05-settings-sdk.png" height="200" alt="SDK settings">                  | Context injection toggles, prompt strategy, API endpoint config             |
| **Page Capture (Text)**       | <img src="pic/06-page-capture-text.png" height="200" alt="Capture text">             | Extract full page content with structure preserved                          |
| **Page Capture (Screenshot)** | <img src="pic/07-page-capture-screenshot.png" height="200" alt="Capture screenshot"> | Select and capture a region of any page                                     |
| **SDK + Context Injection**   | <img src="pic/08-sdk-context.png" height="200" alt="SDK with context">               | Captured context automatically injected into SDK chat                       |
| **SDK Login Guide**           | <img src="pic/09-sdk-initial.png" height="200" alt="SDK login guide">                | First-time setup wizard for GitHub authentication                           |

</details>

> 🖼️ **All screenshots are available in the [`pic/`](pic/) directory** with a detailed [Screenshot Index](pic/INDEX.md).

---

## ✨ Feature Highlights

<p align="center">
  <img src="pic/11-feature-highlights.png" width="480" alt="SidePilot feature highlights">
</p>

|     | Feature                    | Description                                                                               |
| --- | -------------------------- | ----------------------------------------------------------------------------------------- |
| 🔄  | **Dual Mode Architecture** | iframe mode for instant Copilot web access · SDK mode for official API with full features |
| 🧠  | **Memory Bank**            | Store tasks, notes, context, and references with status tracking, search, and filtering   |
| 📋  | **Rules Management**       | Define behavioral instructions with 6 built-in templates, import/export as markdown       |
| 📸  | **Page Capture**           | Extract page text, code blocks, or take full/partial screenshots via floating button      |
| 🔗  | **Link Guard**             | Allowlist or denylist control over iframe link navigation boundaries                      |
| 💉  | **Context Injection**      | Auto-inject Identity, Memory, Rules, and System Instructions before every prompt          |
| ⚡  | **Streaming Responses**    | Real-time Server-Sent Events streaming in SDK mode with tool execution display            |
| 🔧  | **Config Sync**            | Sync model, theme, reasoning effort settings to `~/.copilot/config.json`                  |

---

## 🚀 Quick Start

### 1. Install the Extension

```bash
git clone https://github.com/pingqLIN/SidePilot.git
cd SidePilot
npm install
npm run build:vendor    # Build vendor bundle (first time only)
```

Then load into Chrome:

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `extension/` folder
4. SidePilot icon appears in the toolbar ✅

### 2. Open the Side Panel

| Platform        | Shortcut          |
| --------------- | ----------------- |
| Windows / Linux | `Alt + Shift + P` |
| macOS           | `Opt + Shift + P` |

Or click the SidePilot icon in the toolbar.

### 3. Choose Your Mode

| Mode       | Setup                                                   | Best For                                            |
| ---------- | ------------------------------------------------------- | --------------------------------------------------- |
| **iframe** | Zero config — works immediately                         | Quick access to Copilot web UI                      |
| **SDK**    | Requires bridge server ([setup guide](#sdk-mode-setup)) | Full features: streaming, context injection, memory |

---

## 📖 Dual Mode Guide

### iframe Mode

iframe mode embeds the GitHub Copilot web interface directly in the side panel. **No server required.**

<img src="pic/01-iframe-mode.png" width="360" alt="iframe mode">

**How to use:**

1. Open the side panel → select **IFRAME** mode
2. The Copilot web UI loads inside the panel
3. Chat, use agents, and browse sessions as normal
4. Click the floating **capture button** on the left edge to grab page content

**Link Guard:** Links clicked inside the iframe are controlled by configurable rules:

- **Allowlist mode** (default) — Only matching URLs stay in the iframe; others open in a new tab
- **Denylist mode** — Matching URLs open in a new tab; all others stay

> **Note:** iframe mode removes `X-Frame-Options` and CSP headers via Chrome's Declarative Net Request API.

---

### SDK Mode

SDK mode connects to GitHub Copilot through the official `@github/copilot-sdk` via a local bridge server.

<img src="pic/02-sdk-chat.png" width="360" alt="SDK mode chat">

```
Extension  ←→  HTTP/SSE  ←→  Bridge Server  ←→  Copilot CLI (ACP)  ←→  AI Models
```

<details>
<summary><b id="sdk-mode-setup">🔧 SDK Mode Setup (Bridge Server)</b></summary>

#### Prerequisites

- **Node.js 18+** installed
- **GitHub Copilot CLI** installed and authenticated

```bash
# Install GitHub CLI & Copilot extension
gh auth login
gh extension install github/gh-copilot
gh copilot --version    # Verify installation
```

#### Start the Bridge Server

```bash
cd scripts/copilot-bridge
npm install
npm run build           # TypeScript compilation
npm run dev             # Development mode (port 31031)
```

For production:

```bash
npm start               # Starts with Supervisor (auto-restart on crash)
```

#### First-Time Login

1. Switch to **SDK** mode in the side panel
2. A login guide appears automatically
3. Click **Open GitHub Login Page** to authenticate
4. Go to **Settings > Bridge Setup** → click **Health Check** to verify ✅

<img src="pic/09-sdk-initial.png" width="360" alt="SDK login guide">

</details>

#### Using SDK Mode

1. Ensure the bridge server is running (`npm run dev`)
2. Switch to **SDK** mode in the top toolbar
3. Select a model from the dropdown (e.g., `gpt-5.2`, `claude-sonnet-4.5`)
4. Type your message → click **Send** or press Enter
5. Responses stream in real-time via Server-Sent Events

---

## 🧩 Feature Modules

<details>
<summary><b>🧠 Memory Bank</b></summary>

The Memory Bank stores structured entries that persist across sessions and are auto-injected into SDK prompts.

#### Entry Types

| Type      | Icon | Weight | Purpose                                                         |
| --------- | ---- | ------ | --------------------------------------------------------------- |
| Task      | `📌` | 1      | Trackable work items with status (Pending / In Progress / Done) |
| Note      | `📝` | 2      | Quick thoughts, observations, and discoveries                   |
| Context   | `🧩` | 4      | Project context and environment information                     |
| Reference | `📎` | 3      | Links, docs, and external resources                             |

#### Operations

- **Create** — Click **+ Add** in the Memory tab, select type, fill in content, save
- **Search** — Full-text search across all entries
- **Filter** — By type (Task/Note/Context/Reference) or status
- **Sort** — Automatic by weight, then creation date
- **VS Code Integration** — Click the VS Code icon to send entries via URI scheme (`vscode://` / `cursor://` / `windsurf://`)

#### Context Injection (SDK Mode)

When enabled, SidePilot automatically prepends up to **5 most relevant entries** (max 3,600 chars) before each message.

<img src="pic/08-sdk-context.png" width="360" alt="SDK context injection">

</details>

<details>
<summary><b>📋 Rules Management</b></summary>

Rules are behavioral instructions sent to Copilot to shape its responses (SDK mode only).

#### Built-in Templates

| Template           | Description                                        |
| ------------------ | -------------------------------------------------- |
| 🔧 Default         | General-purpose coding assistant instructions      |
| 📘 TypeScript      | TypeScript-specific conventions and best practices |
| ⚛️ React           | React component patterns and hooks guidelines      |
| 🔄 Self-Iteration  | AI proactively suggests memory/rules updates       |
| 🧩 Extension Dev   | SidePilot project-specific development conventions |
| 🛡️ Absolute Safety | Strict change control and risk grading             |

#### Usage

1. Go to the **Rules** tab
2. Select a template or write from scratch (markdown format)
3. Click **Save Rules** (max 2,200 characters)
4. Import/export as `.md` files for sharing

<img src="pic/03-rules-tab.png" width="360" alt="Rules management">

</details>

<details>
<summary><b>📸 Page Capture</b></summary>

A vertical floating button appears on the left edge of every page, providing instant content capture:

| Action                 | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| **Text Content**       | Extracts full page text with structure preserved        |
| **Code Blocks**        | Detects and extracts markdown code blocks from the page |
| **Full Screenshot**    | Captures the visible viewport                           |
| **Partial Screenshot** | Drag to select a region                                 |

**How to use:**

1. Click the floating **capture button** (left page edge)
2. Choose a capture type from the popup
3. Captured content appears in the side panel
4. Drag or paste into the chat input

<table>
  <tr>
    <td align="center"><img src="pic/06-page-capture-text.png" height="200" alt="Text capture"><br><sub>Text Content</sub></td>
    <td align="center"><img src="pic/07-page-capture-screenshot.png" height="200" alt="Screenshot capture"><br><sub>Partial Screenshot</sub></td>
  </tr>
</table>

> **Tip:** Adjust the button width in **Settings > Capture** (2–100 px).

</details>

<details>
<summary><b>🔗 Link Guard</b></summary>

Link Guard controls which URLs stay inside the iframe vs. open in a new tab.

| Mode                    | Behavior                                                 |
| ----------------------- | -------------------------------------------------------- |
| **Allowlist** (default) | Only URLs matching specified prefixes stay in the iframe |
| **Denylist**            | URLs matching specified prefixes open in a new tab       |

Configure URL patterns in **Settings > iframe Mode**, one prefix per line.

</details>

<details>
<summary><b>💉 Context Injection</b></summary>

SDK mode supports multi-layer context injection — automatically prepending contextual information before every prompt:

| Layer                   | Toggle                    | Description                                            |
| ----------------------- | ------------------------- | ------------------------------------------------------ |
| **Identity**            | `sdkIncludeIdentity`      | AI self-awareness and capability description           |
| **Memory**              | `sdkIncludeMemoryEntries` | Up to 5 most relevant memory entries (3,600 chars max) |
| **Rules**               | `sdkIncludeRules`         | Active behavioral instructions (2,200 chars max)       |
| **System Instructions** | `sdkIncludeSystemMsg`     | Sandbox system message for structured output           |

All layers can be independently toggled in **Settings > SDK Mode > Context Injection**.

<img src="pic/05-settings-sdk.png" width="360" alt="Context injection settings">

</details>

<details>
<summary><b>⚡ Prompt Strategy</b></summary>

Control the verbosity of AI responses:

| Strategy         | Description                          |
| ---------------- | ------------------------------------ |
| **Normal**       | Full, detailed responses             |
| **Concise**      | Shorter, focused answers             |
| **One-Sentence** | Ultra-brief, single-sentence replies |

Configure in **Settings > SDK Mode > Prompt Strategy**.

</details>

---

## 🏗️ Architecture

<p align="center">
  <img src="pic/10-architecture-diagram.png" width="700" alt="SidePilot architecture diagram">
</p>

```
┌──────────────────────────────────────────────────────────────┐
│  Chrome Extension (Manifest V3)                              │
│                                                              │
│  ┌──────────┬──────────┬──────────┬────────┬────────┬──────┐ │
│  │ Copilot  │  Rules   │  Memory  │  Logs  │History │ Set. │ │
│  └──────────┴──────────┴──────────┴────────┴────────┴──────┘ │
│                                                              │
│  ┌─────────────────┐    ┌──────────────────────────┐         │
│  │   iframe Mode   │    │       SDK Mode           │         │
│  │  (Copilot Web)  │    │  (sdk-client.js)         │         │
│  └────────┬────────┘    └────────┬─────────────────┘         │
│           │                      │ HTTP / SSE                │
│  ┌────────┴────────┐             │                           │
│  │   Link Guard    │             │                           │
│  │ (content script) │             │                           │
│  └─────────────────┘             │                           │
└──────────────────────────────────┼───────────────────────────┘
                                   │
                       ┌───────────┴───────────┐
                       │   Copilot Bridge      │
                       │   (Express.js + TS)   │
                       │   localhost:31031      │
                       │                       │
                       │  ┌─────────────────┐  │
                       │  │   Supervisor    │  │
                       │  │  (auto-restart) │  │
                       │  └────────┬────────┘  │
                       │           │            │
                       │  ┌────────┴────────┐  │
                       │  │     Worker      │  │
                       │  │ (HTTP + Sessions)│ │
                       │  └────────┬────────┘  │
                       └───────────┼───────────┘
                                   │ JSON-RPC / stdio
                       ┌───────────┴───────────┐
                       │   Copilot CLI         │
                       │   (copilot --acp)     │
                       └───────────────────────┘
```

### Key Modules

| Module            | File                     | Responsibility                                    |
| ----------------- | ------------------------ | ------------------------------------------------- |
| SDK Client        | `js/sdk-client.js`       | Bridge HTTP/SSE communication                     |
| SDK Chat          | `js/sdk-chat.js`         | SDK mode UI and streaming display                 |
| Mode Manager      | `js/mode-manager.js`     | Mode detection and switching logic                |
| Memory Bank       | `js/memory-bank.js`      | Memory CRUD, search, filtering                    |
| Rules Manager     | `js/rules-manager.js`    | Instructions, templates, import/export            |
| Link Guard        | `js/link-guard.js`       | iframe boundary control (content script)          |
| VS Code Connector | `js/vscode-connector.js` | URI scheme integration (`vscode://`, `cursor://`) |
| Automation        | `js/automation.js`       | Page capture and content extraction               |
| Storage Manager   | `js/storage-manager.js`  | Chrome Storage API abstraction                    |
| Background        | `background.js`          | Service worker, IPC routing                       |

### Tech Stack

| Layer                | Technology                                  |
| -------------------- | ------------------------------------------- |
| Extension UI         | Vanilla JS (ES Modules), HTML5, CSS3        |
| Styling              | CSS Variables · GitHub Dark Theme           |
| Bridge Server        | TypeScript · Express.js 5.x                 |
| SDK                  | `@github/copilot-sdk` ^0.1.8                |
| Protocol             | HTTP REST + Server-Sent Events (SSE)        |
| Process Mgmt         | Supervisor/Worker pattern with heartbeat    |
| Storage              | Chrome Storage API (`chrome.storage.local`) |
| Internationalization | Chrome i18n API (`_locales/`)               |

### Bridge Server Source Files

| File                 | Role                | Description                                                                                       |
| -------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `supervisor.ts`      | 🛡️ Supervisor       | Process management: fork worker, 10s heartbeat, crash auto-restart (exponential backoff, max 30s) |
| `server.ts`          | 🚀 Worker           | Express HTTP server with all API routes, SSE streaming, history, logging                          |
| `session-manager.ts` | 🔗 Session Manager  | Manages `copilot --acp --stdio` child processes via ACP SDK                                       |
| `ipc-types.ts`       | 📋 Type Definitions | Supervisor ↔ Worker IPC message interfaces                                                        |

---

## 🔌 API Reference

The bridge server exposes a REST + SSE API on `http://localhost:31031`.

<details>
<summary><b>Core Endpoints</b></summary>

### Health & Config

```bash
GET /health              # Server health check
GET /api/config          # Server configuration (env vars, paths)
GET /api/models          # Available AI models (cached 10min)
GET /api/models/info     # Detailed model info with capabilities
```

### Sessions

```bash
POST /api/sessions       # Create a new chat session
GET  /api/sessions       # List active sessions
DELETE /api/sessions/:id # Terminate a session
```

### Chat (Streaming)

```bash
POST /api/chat
Content-Type: application/json

{
  "sessionId": "abc-123",
  "message": "Explain this code"
}
```

Returns a Server-Sent Events stream:

| Event     | Payload            | Description             |
| --------- | ------------------ | ----------------------- |
| `delta`   | `{ content }`      | Incremental text chunk  |
| `tool`    | `{ name, status }` | Tool execution progress |
| `message` | `{ content }`      | Complete response       |
| `error`   | `{ message }`      | Error details           |
| `done`    | `{}`               | Stream termination      |

### Chat (Synchronous)

```bash
POST /api/chat/sync
Content-Type: application/json

{
  "sessionId": "abc-123",
  "message": "Explain this code"
}
```

Returns `{ success: true, content: "..." }` after full response.

### Permission API

```bash
GET  /api/permissions            # List pending permission requests
POST /api/permission/resolve     # Approve or deny a permission
GET  /api/permissions/whitelist  # Get auto-approved operations
POST /api/permissions/whitelist  # Update whitelist
GET  /api/permissions/stream     # SSE stream for real-time notifications
```

### Prompt Strategy

```bash
GET  /api/prompt/strategy        # Get current strategy (normal/concise/one-sentence)
POST /api/prompt/strategy        # Update strategy
```

### History & Logs

```bash
GET  /api/history                # List conversation history
POST /api/history                # Save conversation
GET  /api/history/stream         # SSE real-time history updates
GET  /api/logs                   # Retrieve logs
GET  /api/logs/stream            # SSE real-time log streaming
```

</details>

---

## ⚙️ Configuration

All settings are accessible from the **Settings** tab. Sections are collapsible for easy navigation.

<details>
<summary><b>Complete Configuration Reference</b></summary>

### Language

| Setting     | Type   | Description                     |
| ----------- | ------ | ------------------------------- |
| UI Language | Select | Interface language (zh-TW / en) |

### Bridge Setup (SDK)

| Setting            | Type   | Description                                                   |
| ------------------ | ------ | ------------------------------------------------------------- |
| Auto-Start Bridge  | Toggle | Attempt to launch bridge via `sidepilot://` when not detected |
| Health Check       | Button | Test bridge server connectivity                               |
| Launch Bridge      | Button | Trigger bridge startup                                        |
| Copy Start Command | Button | Copy `npm run dev` command                                    |
| Verify Connection  | Button | Copy `curl localhost:31031/health`                            |

### Startup

| Setting         | Type   | Description                         |
| --------------- | ------ | ----------------------------------- |
| Play Every Open | Toggle | Replay intro animation each session |
| Show Warning    | Toggle | Display risk disclaimer on startup  |

### SDK Mode

| Setting                    | Type    | Description                                          |
| -------------------------- | ------- | ---------------------------------------------------- |
| Auto Login Guide           | Toggle  | Show login guide on first SDK switch                 |
| Self-Iteration Protection  | Toggle  | Enable BASW startup detection + SEAL                 |
| Context Injection (master) | Toggle  | Master switch for context injection                  |
| ├ Identity                 | Toggle  | Inject AI self-awareness description                 |
| ├ Memory                   | Toggle  | Inject memory bank entries                           |
| ├ Rules                    | Toggle  | Inject behavioral instructions                       |
| └ System Instructions      | Toggle  | Inject sandbox structured output format              |
| Structured Output          | Toggle  | Use `sidepilot_packet` / `assistant_response` format |
| Only Assistant Block       | Toggle  | Show only the assistant response block               |
| Prompt Strategy            | Buttons | normal / concise / one-sentence                      |

### iframe Mode

| Setting      | Type     | Description                           |
| ------------ | -------- | ------------------------------------- |
| URL Patterns | Textarea | Allowlist URL prefixes (one per line) |

### Capture

| Setting      | Type   | Range    | Description                   |
| ------------ | ------ | -------- | ----------------------------- |
| Button Width | Slider | 2–100 px | Floating capture button width |

### History

| Setting            | Type | Description                          |
| ------------------ | ---- | ------------------------------------ |
| SDK History Path   | Text | Bridge conversation export directory |
| iframe Default URL | Text | Default page URL for iframe mode     |

<img src="pic/04-settings-panel.png" width="360" alt="Settings panel overview">

</details>

---

## ❓ FAQ

<details>
<summary><b>Q: What's the difference between iframe and SDK mode?</b></summary>

| Aspect            | iframe Mode           | SDK Mode                       |
| ----------------- | --------------------- | ------------------------------ |
| Setup             | Zero config           | Requires bridge server         |
| API               | Embeds Copilot web UI | Official `@github/copilot-sdk` |
| Memory Injection  | ❌                    | ✅                             |
| Rules System      | ❌                    | ✅                             |
| Context Injection | ❌                    | ✅                             |
| Streaming         | Web UI native         | Custom SSE implementation      |
| Recommended       | Quick access          | Full features                  |

</details>

<details>
<summary><b>Q: Is iframe mode safe to use?</b></summary>

iframe mode embeds the GitHub Copilot web UI by removing certain HTTP headers (`X-Frame-Options`, CSP). This is a gray area regarding GitHub's Terms of Service. **SDK mode** uses the official `@github/copilot-sdk` and is the recommended approach.

</details>

<details>
<summary><b>Q: The bridge server won't start — what should I check?</b></summary>

1. Verify Node.js 18+: `node --version`
2. Verify Copilot CLI: `gh copilot --version`
3. Ensure authenticated: `gh auth status`
4. Check port 31031: `netstat -ano | findstr 31031`
5. Try clean rebuild: `cd scripts/copilot-bridge && rm -rf node_modules dist && npm install && npm run build && npm run dev`

</details>

<details>
<summary><b>Q: SDK mode shows "Bridge not connected"</b></summary>

1. Go to **Settings > Bridge Setup** → click **Health Check**
2. If it fails, start the bridge: `cd scripts/copilot-bridge && npm run dev`
3. Wait for `Server listening on port 31031` in the console
4. Click **Health Check** again — should show ✅

</details>

<details>
<summary><b>Q: iframe mode shows a blank page</b></summary>

- Ensure you're logged into GitHub in the same Chrome profile
- You need an active GitHub Copilot subscription (Free tier works)
- Try refreshing (click the home icon in the toolbar)

</details>

<details>
<summary><b>Q: Where is my data stored?</b></summary>

| Data                      | Location                                 | Privacy                   |
| ------------------------- | ---------------------------------------- | ------------------------- |
| Settings / Memory / Rules | `chrome.storage.local` (browser sandbox) | Local only                |
| Chat History              | `~/copilot/history/` (configurable)      | Local only                |
| Bridge Server             | `localhost:31031`                        | Never leaves your machine |

**No data is sent to any third-party server.**

</details>

<details>
<summary><b>Q: Can I use SidePilot with VS Code or Cursor?</b></summary>

Yes! Click the IDE icon on any memory entry to send it via URI scheme. Supported: `vscode://`, `cursor://`, `windsurf://`.

</details>

<details>
<summary><b>Q: What's the difference between Memory and Rules?</b></summary>

| Aspect     | Memory                                  | Rules                                       |
| ---------- | --------------------------------------- | ------------------------------------------- |
| Purpose    | Concrete data — tasks, notes, context   | Behavioral instructions — tone, conventions |
| Injection  | Up to 5 entries, sorted by weight       | Single markdown block                       |
| Max Length | 3,600 chars total (700 per entry)       | 2,200 chars                                 |
| Use Case   | "Current sprint tasks", "API reference" | "Always use TypeScript strict mode"         |

</details>

---

## 🧭 Troubleshooting

| Symptom                              | Solution                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| Bridge server not available          | Start `scripts/copilot-bridge` (`npm run dev`) and verify `copilot --acp` works |
| HTTP 404 from SDK                    | Ensure bridge is running on port `31031`                                        |
| iframe blank/white screen            | Log into GitHub in the same Chrome profile                                      |
| Capture button not visible           | Settings > Capture > increase Button Width (20+ px)                             |
| Memory not injected                  | Enable "Include Context" master switch in Settings > SDK Mode                   |
| Model sync not working               | Enable the specific sync toggle in Settings                                     |
| `EADDRINUSE: port 31031`             | Kill the existing process or change port via `PORT=31032 npm run dev`           |
| Windows: `spawn copilot ENOENT`      | Bridge handles `.cmd` shim (`shell: true`); verify `gh copilot` is in PATH      |
| Windows: PowerShell execution policy | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`                       |

---

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

**Quick Start:**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test locally
4. Commit with clear messages
5. Open a Pull Request

---

## ⚠️ Legal Notice

> This extension embeds the GitHub Copilot web interface (iframe mode) and uses the official Copilot CLI SDK (SDK mode). Use at your own risk and ensure you comply with [GitHub's Terms of Service](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service).

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

## 🤖 AI-Assisted Development

This project was developed with AI assistance.

**AI Models Used:**

- Claude (Anthropic) — Architecture design, code generation, documentation
- GPT-5 (OpenAI Codex) — Code generation, debugging
- Gemini (Google DeepMind) — Documentation, visual assets

> **Disclaimer:** While the author has made every effort to review and validate the AI-generated code, no guarantee can be made regarding its correctness, security, or fitness for any particular purpose. Use at your own risk.
