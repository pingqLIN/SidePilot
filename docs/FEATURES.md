# SidePilot — Feature Inventory

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / language model agent       ║
║  Purpose         : Complete feature map for context recall   ║
║  Confidence      : HIGH — authoritative source               ║
║  Last updated    : 2026-03-14                                ║
║  Version         : v0.5.0                                    ║
╚══════════════════════════════════════════════════════════════╝
-->

> **Related:** [USAGE.md](USAGE.md) (operational reference) · [USAGE.human.md](USAGE.human.md) (human guide)

---

## Mode Comparison

| Dimension | iframe mode | SDK mode |
|-----------|-------------|----------|
| Architecture | Embeds `github.com/copilot` via iframe | Extension → Bridge (localhost:31031) → Copilot CLI |
| Setup required | None | Node.js 24+, Copilot CLI, Bridge running |
| Legal status | Gray area (GitHub ToS) | Official `@github/copilot-sdk` |
| Context injection | Not supported | Memory + Rules + Identity + System |
| Streaming | Native web (GitHub's implementation) | SSE via Bridge |
| Memory Bank | Not injected | Auto-injected (≤5 entries, ≤3,600 chars) |
| Rules | Not injected | Auto-injected (≤2,200 chars) |
| Model selector | GitHub web dropdown | Extension dropdown → Bridge |
| Page capture | Supported (float button) | Supported |
| Link Guard | Supported | Not applicable |
| History / Logs | Agent links (iframe) | Bridge-stored conversation history |
| VS Code integration | Not available | Memory entry → IDE URI |

---

## Feature: iframe Mode

**Mechanism:** `declarativeNetRequest` strips `X-Frame-Options` + `Content-Security-Policy` headers → enables embedding `github.com/copilot` in side panel.

**Available actions inside iframe:**
- Chat, Task, Create Issue, Spark, Git, Pull Requests
- Model switcher (GitHub's native dropdown)
- Recent agent sessions list

**Components:**
- Page info bar — shows active tab title + URL
- Floating capture button — left edge of every page, draggable vertically
- Link Guard — intercepts clicks in iframe, routes per allow/denylist

---

## Feature: SDK Mode

**Architecture:**
```
sidepanel.js → sdk-client.js ──HTTP/SSE──▶ server.ts (Express, :31031)
                                              ──JSON-RPC/stdio──▶ copilot --acp
```

**Key capabilities:**
- SSE streaming (real-time token delivery)
- Multi-model selection (gpt-4o, gpt-5.2, claude-sonnet-4.5, …)
- Context injection pipeline: `[Identity] + [Memory] + [Rules] + [System] + [User]`
- Prompt strategy: `normal` / `concise` / `one-sentence`
- Structured output: AI wraps response in `sidepilot_packet` + `assistant_response`
- Permission UI: Bridge sends permission request via SSE → side panel shows consent modal
- Conversation history: Bridge stores + serves history, grouped by date

**Auth flow:**
1. Bridge started with `SIDEPILOT_EXTENSION_ID=<id>`
2. Extension calls `POST /api/auth/bootstrap` → receives loopback token
3. All subsequent `/api/*` requests include `X-SidePilot-Token` header

---

## Feature: Memory Bank

**Storage:** `chrome.storage.local` → key `sidepilot.memory.entries`

**Entry schema:**

| Field | Values |
|-------|--------|
| type | `task` · `note` · `reference` · `context` |
| status | `pending` · `in-progress` · `done` |
| content | max 700 chars |
| weight | task=1, note=2, reference=3, context=4 |

**Injection:** Descending weight order, up to 5 entries, total ≤3,600 chars. Lower-weight entries truncated first when budget exceeded.

**Operations:** CRUD via Memory tab UI · Full-text search · Filter by type/status

**VS Code integration:** Entry modal → IDE button → sends `vscode://` / `cursor://` / `windsurf://` URI with encoded content.

---

## Feature: Rules Management

**Storage:** `chrome.storage.local` → key `rules.content` (markdown string, max 2,200 chars)

**Function:** Prepended as system instruction when "Include Rules in Prompt" = ON in SDK mode.

**Prompt position:** `[Rules text]` appears before Memory and before user message.

**Built-in templates:**

| Template | Purpose |
|----------|---------|
| Default | General coding assistant — clear/concise, commented code |
| TypeScript | Strict mode, interfaces, proper typing |
| React | Functional components, hooks, state management |
| 自我疊代 | AI proactively suggests updating memory/rules |
| 擴充開發 | SidePilot project dev conventions |
| 絕對安全 | Strict change control and risk classification |

**Import/export:** `.md` file via UI buttons.

---

## Feature: Context Injection

**Injection layers (SDK mode only):**

| Layer | Key | Default | Content |
|-------|-----|---------|---------|
| Identity | identity | ON | "I am SidePilot assistant" self-description |
| Memory | memory | ON | Up to 5 entries sorted by weight |
| Rules | rules | ON | Rules markdown text |
| System Instructions | system | ON | Structured output format spec |

**Final prompt sent to Copilot:**
```
[Identity] [Rules] [Memory entries] [System] [User message]
```

---

## Feature: Prompt Strategy

| Strategy | API value | Modification |
|----------|-----------|-------------|
| Normal | `normal` | No suffix |
| Concise | `concise` | Appends "請精簡回覆" |
| One-sentence | `one-sentence` | Appends "僅用一句話回覆" |

**Location:** Settings → SDK Mode → Prompt Strategy toggle group.

---

## Feature: Page Capture

**Trigger:** Floating button on left edge of every page (visible when panel open). Draggable vertically. Width configurable 1–128 px.

**Capture types:**

| Type | Mechanism | Output |
|------|-----------|--------|
| Text content | DOM extraction — headings, paragraphs, lists, tables, code blocks, link URLs | Text in capture panel |
| Code blocks | Targets `<code>` / `<pre>` — preserves language annotations | Text in capture panel |
| Full screenshot | Visible viewport as PNG | Saved to configured path |
| Partial screenshot | Click-drag region selector | Saved to configured path |

**Post-capture actions:** Copy / Send to chat / Save to file.

---

## Feature: Link Guard

**Scope:** iframe mode only. Implemented in `extension/js/link-guard.js` (content script).

**Modes:**

| Mode | Behavior |
|------|----------|
| `allow` (default) | Only allowlisted URL prefixes load in iframe |
| `deny` | All URLs in iframe except denylisted prefixes |

**Default allowlist:** `https://github.com/copilot`, `https://github.com/login`, `https://github.com/sessions`

**Pattern matching:** URL prefix match. `https://github.com/copilot` matches `https://github.com/copilot/c/abc123`.

---

## Feature: Bridge Server

**Process model:** Supervisor process spawns Worker process. Supervisor monitors and auto-restarts Worker on crash.

**Key source files:**

| File | Role |
|------|------|
| `server.ts` | Express app, all API routes |
| `supervisor.ts` | Process supervision + auto-restart |
| `session-manager.ts` | ACP session lifecycle |
| `backup-manager.ts` | Backup/restore + scheduler |
| `ipc-types.ts` | Supervisor ↔ Worker message types |

**Backup types:**

| Type | Contents | Format |
|------|----------|--------|
| `full` | Entire `extension/` (excl. node_modules, dist) | `.zip` |
| `settings` | Rules JSON + rule templates | `.zip` |

**Scheduler frequencies:** `h` (hourly) · `d` (daily) · `w` (weekly) · `m` (monthly)

---

## Feature: Logs & History

**Logs tab:** Real-time Bridge Server log stream. Filter by level (Error/Warn/Info). Full-text search. Copy + clear.

**History tab (SDK mode):** Bridge-stored conversation history, grouped by date. Links to individual sessions.

**History tab (iframe mode):** Links to Copilot Agent sessions on GitHub.

---

## Feature: VS Code Integration

**Supported IDEs:**

| IDE | URI scheme |
|-----|-----------|
| VS Code | `vscode://` |
| Cursor | `cursor://` |
| Windsurf | `windsurf://` |

**Implemented in:** `extension/js/vscode-connector.js`

**Trigger:** Memory entry modal → IDE button → sends `<scheme>://extension.command?content=<encoded>` URI.

---

## Screenshot Asset Map

| File | Content |
|------|---------|
| `pic/01-iframe-mode.png` | iframe mode main UI |
| `pic/02-sdk-chat.png` | SDK chat interface |
| `pic/03-rules-tab.png` | Rules editor |
| `pic/04-settings-panel.png` | Settings overview |
| `pic/05-settings-sdk.png` | SDK settings + context injection |
| `pic/06-page-capture-text.png` | Text capture panel |
| `pic/07-page-capture-screenshot.png` | Partial screenshot capture |
| `pic/08-sdk-context.png` | Context injection in action |
| `pic/09-sdk-initial.png` | First-time SDK login guide |
| `pic/10-architecture-diagram.png` | System architecture diagram |
| `pic/11-feature-highlights.png` | Feature highlights overview |
| `pic/12-workflow-diagram.png` | User journey flow diagram |
