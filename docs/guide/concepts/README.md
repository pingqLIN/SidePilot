# SidePilot — System Concepts

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / language model agent       ║
║  Purpose         : System mental model — modes, context      ║
║                    pipeline, bridge, storage architecture    ║
║  Confidence      : HIGH — authoritative source               ║
║  Last updated    : 2026-03-14                                ║
╚══════════════════════════════════════════════════════════════╝
-->

> **Operational details:** [../../USAGE.md](../../USAGE.md) · **Feature inventory:** [../../FEATURES.md](../../FEATURES.md)

---

## Core Model

SidePilot is a Chrome MV3 side panel extension with two mutually exclusive operating modes. Mode is persisted in `chrome.storage.local` → `sidepilot.mode.active`.

```
┌──────────────────────────────────────────────────────────┐
│                    Side Panel UI                         │
│  [iframe tab] [SDK tab] [Memory] [Rules] [Settings] ...  │
└──────────┬───────────────────┬───────────────────────────┘
           │                   │
    iframe mode            SDK mode
           │                   │
    github.com/copilot    sdk-client.js
    (embedded via         ──HTTP/SSE──▶
    declarativeNetRequest)  Bridge (:31031)
                              ──JSON-RPC/stdio──▶
                              Copilot CLI (copilot --acp)
```

---

## Mode: iframe

**What it is:** Direct embed of `github.com/copilot` inside the side panel.

**How it works:**
- `declarativeNetRequest` rules strip `X-Frame-Options` + `Content-Security-Policy` response headers
- GitHub Copilot web UI renders inside an iframe
- Link Guard (`link-guard.js`) intercepts clicks and routes per allow/denylist

**Constraints:**
- No Memory injection
- No Rules injection
- No structured context pipeline
- GitHub ToS gray area

**Use case:** Zero-setup instant access. Fall back to this mode when Bridge is unavailable.

---

## Mode: SDK

**What it is:** A controlled local integration using `@github/copilot-sdk` via a local bridge process.

**Data flow:**

```
User types message
  → sdk-chat.js assembles prompt:
      [Identity] + [Rules] + [Memory entries] + [System] + [User message]
  → sdk-client.js POSTs to Bridge /api/chat
  → Bridge sends JSON-RPC to copilot --acp --stdio
  → Copilot CLI streams tokens back
  → Bridge SSE-streams delta events to extension
  → sdk-chat.js renders tokens in real time
```

**Key distinction from iframe:** The extension controls the entire prompt — context injection, model selection, structured output format, and streaming are all managed by the extension + bridge, not by GitHub's web UI.

---

## Context Pipeline

The prompt sent to Copilot is assembled in this order:

| Layer | Source | Limit | Toggle |
|-------|--------|-------|--------|
| Identity | Hardcoded string | — | Settings → SDK → Identity |
| Rules | `chrome.storage.local` → `rules.content` | 2,200 chars | Settings → SDK → Rules |
| Memory | `chrome.storage.local` → `sidepilot.memory.entries` | 5 entries / 3,600 chars | Settings → SDK → Memory |
| System | Structured output format spec | — | Settings → SDK → System |
| User message | Text input | — | Always present |

**Injection order is fixed.** Weight-based sorting applies only within the Memory layer (context=4 > reference=3 > note=2 > task=1).

---

## The Bridge

**What it is:** A local Express.js server that proxies between the Chrome extension and the Copilot CLI.

**Why it exists:** Chrome extensions cannot directly execute child processes or use Node.js APIs. The bridge provides a localhost HTTP/SSE control plane that the extension can reach.

**Process model:**

```
npm start
  → supervisor.ts spawns worker.ts
  → worker.ts starts Express server on :31031
  → Supervisor monitors worker, auto-restarts on crash
```

**Security model:**
- Binds to `localhost:31031` only — not exposed to network
- Requires `SIDEPILOT_EXTENSION_ID` at startup
- Extension calls `POST /api/auth/bootstrap` → receives loopback token
- All subsequent `/api/*` requests must include `X-SidePilot-Token` header AND originate from `chrome-extension://<bound-id>` origin
- Two-factor: token + origin binding

**Auto-start chain:**
1. User switches to SDK mode
2. Extension calls `GET http://localhost:31031/health`
3. If 404/timeout → sends `sidepilot://start-bridge` URI to OS
4. OS launcher (Windows: registered via PowerShell installer) starts bridge in background
5. Extension polls `/health` for up to ~10 s
6. On success → proceeds; on failure → shows manual fallback in chat

---

## Memory vs Rules

| Dimension | Memory Bank | Rules |
|-----------|-------------|-------|
| Storage key | `sidepilot.memory.entries` | `rules.content` |
| Format | Structured entries (type, status, weight, content) | Free-form markdown |
| Injection | Up to 5 entries, sorted by weight | Full text, prepended once |
| Limit | 700 chars/entry, 3,600 chars total | 2,200 chars |
| Purpose | Persistent facts about a project or task | Behavioral instructions for the AI |
| Analogy | Project notes / task list | System prompt |

---

## Page Capture

**What it is:** A mechanism to pull content from the active browser tab into the Copilot prompt.

**How it works:**
1. Floating button on left edge of every page (injected by content script)
2. User clicks → extension calls `chrome.tabs.captureVisibleTab()` (screenshot) or executes DOM extraction script (text/code)
3. Captured content appears in capture panel
4. "Send to chat" pastes content into SDK input (or clipboard for iframe mode)

**Not automatic:** Capture is always user-triggered. The captured content is not persisted to Memory unless the user explicitly adds it.

---

## Storage Architecture

All user data is local. No cloud sync. No telemetry.

| Data | Storage layer | Key / Path |
|------|--------------|-----------|
| Settings | Chrome local storage | `sidepilot.settings.v1` |
| Memory entries | Chrome local storage | `sidepilot.memory.entries` |
| Rules | Chrome local storage | `rules.content` |
| Active mode | Chrome local storage | `sidepilot.mode.active` |
| Chat exports | Filesystem | `~/copilot/chat-exports/` (configurable) |
| Screenshots | Filesystem | `~/copilot/screenshots/` (configurable) |
| CLI config | Filesystem | `~/.copilot/config.json` |
| Session state | Filesystem | `~/.copilot/session-state/` |
