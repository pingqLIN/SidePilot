# SidePilot — Setup Procedures

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / language model agent       ║
║  Purpose         : Authoritative setup and installation      ║
║                    procedures for executing on behalf of     ║
║                    a human user                              ║
║  Confidence      : HIGH — authoritative source               ║
║  Last updated    : 2026-03-14                                ║
║  Human companion : QUICKSTART.human.md                       ║
╚══════════════════════════════════════════════════════════════╝
-->

> **Operational reference:** [../../USAGE.md](../../USAGE.md) · **Human guide:** [QUICKSTART.human.md](QUICKSTART.human.md)

---

## Decision Tree: What Does the Human Need?

```
Human wants to use SidePilot
├── "Just try it / quick chat" → iframe mode only → execute Plan A (steps 1–3)
└── "Full features / Memory / Rules / streaming" → SDK mode → execute Plan A + Plan B
```

---

## Plan A: Install Extension (always required)

### Prerequisites

| Requirement | Check |
|-------------|-------|
| Chrome ≥ 114 | `chrome://settings/help` |
| GitHub account + Copilot subscription | github.com/features/copilot |

### Steps

**1. Clone repo**

```bash
git clone https://github.com/pingqLIN/SidePilot.git
cd SidePilot
npm install
npm run build:vendor
```

**2. Load into Chrome**

1. Navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle, top-right)
3. Click **Load unpacked** → select `<repo-root>/extension/`
4. Note the extension ID shown below the name (format: 32 lowercase letters)

**3. Open side panel**

- Click SidePilot icon in toolbar, OR
- Press `Alt+Shift+P` (Windows/Linux) / `Opt+Shift+P` (macOS)

Panel opens in **iframe mode** — immediately usable for basic Copilot chat.

→ **Stop here if iframe mode is sufficient.**

---

## Plan B: SDK Mode Setup (for full feature access)

### Prerequisites

| Requirement | Verify |
|-------------|--------|
| Node.js ≥ 24 | `node --version` → must show `v24.x.x` or higher |
| GitHub Copilot CLI | `copilot --version` and `copilot auth status` |
| Plan A complete | Extension loaded and ID noted |

**Install Copilot CLI if missing:**
See [GitHub Copilot CLI documentation](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-the-command-line)

### Step B1: Install Bridge Launcher (Windows only)

Run from **repo root** (not from inside `scripts/`):

```powershell
npm run bridge-launcher:install:win
```

Registers `sidepilot://` URI protocol in `HKCU:\Software\Classes\sidepilot`. No admin required. Enables one-click bridge auto-start from the extension UI.

**macOS / Linux:** Auto-start launcher not available — use manual bridge start (Step B3 fallback).

### Step B2: Switch to SDK Mode and Complete Login Guide

1. Click mode toggle (panel top-right) → select **SDK**
2. Extension runs `ensureSDKBridgeReadyWithAutoStart`:
   - Checks `GET http://localhost:31031/health`
   - If bridge not running → sends `sidepilot://` URI to OS → waits ≤10 s
3. If first SDK switch: `maybeShowSDKLoginGuideOnFirstUse` shows login guide modal (one-time)
4. Click **Open GitHub Login** → sign in → return to panel

### Step B3: Manual Bridge Start (fallback if auto-start fails)

**Option 1 — Quick Setup (from Settings › Bridge Setup › Copy Quick Setup):**

```bash
cd scripts/copilot-bridge
npm install
export SIDEPILOT_EXTENSION_ID=<your-extension-id>   # macOS/Linux
# $env:SIDEPILOT_EXTENSION_ID="<id>"               # Windows PowerShell
npm start
```

**Option 2 — Dev mode (hot-reload):**

```bash
cd scripts/copilot-bridge
export SIDEPILOT_EXTENSION_ID=<your-extension-id>
npm run dev
```

`SIDEPILOT_EXTENSION_ID` is mandatory — bridge binds auth to this Chrome extension origin.

### Step B4: Authenticate Copilot CLI (once per machine)

```bash
copilot auth login
```

### Step B5: Verify Connection

**From extension:** Settings → Bridge Setup → Click **Health Check** → indicator must be green.

**From terminal:**

```bash
curl http://localhost:31031/health
```

Expected: `{ "status": "ok", ... }`

---

## Troubleshooting Decision Table

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| SDK mode shows error immediately | Bridge not running | Run Step B3 |
| Memory/Rules have no effect | Still in iframe mode | Check mode toggle (top-right) |
| `npm start` fails with Node version error | Node.js too old | Install Node.js 24+ |
| Bridge starts but chat returns auth errors | Copilot CLI not authenticated | Run Step B4 |
| Bridge Setup shows Offline after bridge started | Wrong repo root path in Settings | Settings → Bridge Setup → SidePilot Repo Root → set to repo root (not a subfolder) |
| WSL bridge fails to start | Wrong WSL distro configured | Settings → Bridge Setup → WSL Distro → match the distro where repo lives |
| Auto-start never triggers | Bridge Launcher not installed | Run Step B1 |

---

## Path Lookup: Common Mistakes

| Wrong path entered | Correct path |
|-------------------|-------------|
| `C:\Dev\SidePilot\scripts\copilot-bridge` | `C:\Dev\SidePilot` |
| `C:\Dev\SidePilot\extension` | `C:\Dev\SidePilot` |
| Windows path in WSL context | Linux path inside WSL (e.g., `/home/user/SidePilot`) |

---

## Bridge Health Check Response Schema

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
    "extensionOrigin": "chrome-extension://<extension-id>"
  }
}
```

If `sdk` is not `"ready"` or `extensionBindingConfigured` is `false`, the bridge started without `SIDEPILOT_EXTENSION_ID` set.
