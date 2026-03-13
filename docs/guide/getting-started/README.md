# Getting Started with SidePilot

> For first-time visitors: everything you need to install, understand, and start using SidePilot — without needing to know how it works internally.

---

## Contents

- [Do I Need the Bridge?](#do-i-need-the-bridge)
- [Two Ways to Use SidePilot](#two-ways-to-use-sidepilot)
- [What the Bridge Actually Is](#what-the-bridge-actually-is)
- [Where the Bridge Lives on Disk](#where-the-bridge-lives-on-disk)
- [What Path You Should Enter](#what-path-you-should-enter)
- [How to Tell Whether the Extension Is Connected](#how-to-tell-whether-the-extension-is-connected)
- [Recommended First-Time Path](#recommended-first-time-path)
- [Common First-Time Mistakes](#common-first-time-mistakes)

---

## Do I Need the Bridge?

**Short answer: no, not to get started.**

SidePilot has two modes. One works without any extra setup. The other needs a local server (the "Bridge") running on your machine.

| What you want to do | Do you need the Bridge? |
| --- | --- |
| Open SidePilot and start chatting with Copilot | **No** |
| Try it for the first time | **No** |
| Use streaming responses, Memory Bank, or Rules | **Yes** |
| Inject page context or run advanced prompts | **Yes** |

Start without the Bridge. Add it later when you want the extra features.

---

## Two Ways to Use SidePilot

### iframe mode — no setup required

SidePilot embeds the GitHub Copilot web page directly inside the browser side panel. This is the same Copilot you'd use at `github.com/copilot`, just always visible while you browse.

**What you get:**
- Full Copilot chat interface
- Quick actions (Task, Spark, Git, Pull Requests)
- Always-on side panel while browsing

**What you need:**
- The Chrome extension installed
- A GitHub account with a Copilot subscription
- Nothing else

### SDK mode — Bridge required

SidePilot connects to GitHub Copilot through the official SDK, using a local server (the Bridge) that runs on your machine. This unlocks features that the web interface alone cannot provide.

**What you get, additionally:**
- Streaming responses (text appears as it's generated)
- Memory Bank (persistent tasks, notes, references injected into prompts)
- Rules (custom instructions that travel with every message)
- Page capture context injection
- Full control over model selection

**What you need, additionally:**
- Node.js 24 or later
- GitHub Copilot CLI installed and authenticated
- The Bridge running (the extension can start it automatically)

---

## What the Bridge Actually Is

The Bridge is a small local HTTP server written in Node.js. It sits between the Chrome extension and the GitHub Copilot CLI, translating messages between them.

**Key points:**

- It is **not a separate product** — it is a folder inside this repo
- It does **not send your data to any third-party cloud** — all traffic goes directly to GitHub's servers via the official SDK
- It runs only on `localhost:31031` — nothing is exposed to the network
- It starts and stops with your computer session; nothing installs as a persistent background service unless you use the optional Bridge Launcher

---

## Where the Bridge Lives on Disk

The Bridge is always at: `<repo root>/scripts/copilot-bridge/`

Examples:

| If you cloned the repo to… | The Bridge is at… |
| --- | --- |
| `C:\Dev\SidePilot` | `C:\Dev\SidePilot\scripts\copilot-bridge` |
| `C:\Users\alice\Projects\SidePilot` | `C:\Users\alice\Projects\SidePilot\scripts\copilot-bridge` |
| `/home/user/SidePilot` | `/home/user/SidePilot/scripts/copilot-bridge` |

**You do not choose where to install the Bridge.** It is already there when you clone the repo.

---

## What Path You Should Enter

In the extension's **Settings → Bridge Setup** page, you will see a field called **SidePilot Repo Root**.

Fill in the path to the **repo root folder** — not the Bridge folder, and not the extension folder.

| Your setup | What to enter |
| --- | --- |
| Repo cloned to `C:\Dev\SidePilot` | `C:\Dev\SidePilot` |
| Repo cloned to `/home/user/SidePilot` | `/home/user/SidePilot` |
| Running inside WSL | the **Linux path** (e.g., `/home/user/SidePilot`), not the Windows path |

The extension figures out where `scripts/copilot-bridge/` is from there. You only need to tell it where the repo lives.

### WSL note

If you are using Windows Subsystem for Linux (WSL), the repo path you enter should be the path **inside your Linux environment**, not the Windows path.

| Setup | Correct path |
| --- | --- |
| Repo at `/home/user/SidePilot` in Ubuntu | `/home/user/SidePilot` |
| Repo at `/home/user/SidePilot` in Debian | `/home/user/SidePilot` |

Do **not** enter a path like `C:\Users\...` or `\\wsl$\Ubuntu\...` — that is a Windows path, not what the WSL runtime expects.

If you have more than one WSL distribution installed, also verify that **WSL Distro** in Settings → Bridge Setup matches the distribution where your repo lives.

---

## How to Tell Whether the Extension Is Connected

### Indicator 1 — Bridge Setup panel

Go to **Settings → Bridge Setup**. The status indicator shows:

| Status | What it means |
| --- | --- |
| 🟢 **Ready** / **Healthy** | Bridge is running and the extension is connected |
| 🔴 **Offline** / **Disconnected** | Bridge is not running, or the repo root path is wrong |
| 🟡 **Starting** | The extension sent a launch signal; wait a few seconds |

### Indicator 2 — Health check

Click **Health Check** in Settings → Bridge Setup. A green result means the connection is working.

### Indicator 3 — Terminal check

Open a terminal and run:

```bash
curl http://localhost:31031/health
```

If you see a JSON response with `"status": "ok"`, the Bridge is running.

### Indicator 4 — SDK chat works

Switch to SDK mode and send a message. If you receive a response, everything is connected. If you see an error message instead, check the indicators above.

### If the Bridge is not connected, can I still use SidePilot?

Yes. Switch back to **iframe mode** using the mode toggle in the top-right corner of the panel. iframe mode does not require the Bridge and is always available.

---

## Recommended First-Time Path

Follow these steps in order. Stop at any point if you have what you need.

### Step 1 — Clone the repo

```bash
git clone https://github.com/pingqLIN/SidePilot.git
cd SidePilot
npm install
npm run build:vendor
```

### Step 2 — Load the extension into Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder inside the repo

> **Find the extension ID:** After loading, Chrome shows an ID below the extension name (e.g., `abcdefghijklmnopqrstuvwxyz123456`). You'll need this later.

### Step 3 — Open the side panel

Click the SidePilot icon in the toolbar, or press `Alt + Shift + P`.

The panel opens in **iframe mode**. You can start using Copilot immediately.

→ **If iframe mode is enough for you, stop here.** Steps 4–7 are only needed for SDK mode.

### Step 4 — Install the Bridge Launcher (Windows)

Run this from the repo root (not from inside `scripts/`):

```powershell
npm run bridge-launcher:install:win
```

This registers a `sidepilot://` URI handler in Windows. The extension uses this URI to start the Bridge automatically when you switch to SDK mode. You only need to do this once per machine.

> **macOS / Linux users:** Auto-start is not yet available. Use the manual startup command in Step 6 instead.

### Step 5 — Switch to SDK mode

Click the mode toggle in the side panel (top-right corner, shows **IFRAME** / **SDK**). Select **SDK**.

The extension will:
1. Check if the Bridge is running at `localhost:31031`
2. If not, send a launch signal via the Bridge Launcher
3. Wait up to ~10 seconds for the Bridge to start
4. Show a one-time login guide if this is your first time

### Step 6 — Start the Bridge manually (if auto-start fails)

If the Bridge doesn't start automatically, copy the Quick Setup command:

**Settings → Bridge Setup → Copy Quick Setup** — then paste and run it in a terminal.

Or run it manually:

```bash
cd scripts/copilot-bridge
npm install          # First time only
npm start
```

On Windows PowerShell, also set the Extension ID before starting:

```powershell
$env:SIDEPILOT_EXTENSION_ID = "your-extension-id-here"
npm start
```

### Step 7 — Sign in to GitHub

A login guide dialog appears the first time. Click **Open GitHub Login** and sign in. You need a GitHub account with an active [Copilot subscription](https://github.com/features/copilot).

After signing in, return to the side panel. The connection check runs automatically. Once the Bridge shows **Ready**, you can start chatting in SDK mode.

---

## Common First-Time Mistakes

### 1. Wrong repo root path

**Symptom:** Bridge Setup shows Offline even though you started the Bridge.

**Fix:** In Settings → Bridge Setup → SidePilot Repo Root, check that the path points to the repo root, not a subfolder.

| Wrong | Correct |
| --- | --- |
| `C:\Dev\SidePilot\scripts\copilot-bridge` | `C:\Dev\SidePilot` |
| `C:\Dev\SidePilot\extension` | `C:\Dev\SidePilot` |

### 2. Bridge never started

**Symptom:** SDK mode shows an error immediately.

**Fix:** The Bridge must be running before the extension can connect. Either install the Bridge Launcher (Step 4 above) or run `npm start` in `scripts/copilot-bridge/` manually.

### 3. Node.js version too old

**Symptom:** `npm start` fails with a Node version error.

**Fix:** The Bridge requires Node.js 24 or later.

```bash
node --version    # Should show v24.x.x or higher
```

Download Node.js 24 from [nodejs.org](https://nodejs.org/).

### 4. Copilot CLI not authenticated

**Symptom:** Bridge starts but SDK chat returns auth errors.

**Fix:** Authenticate the Copilot CLI:

```bash
copilot auth login
```

Or sign in via the login guide in the extension (Settings → SDK Mode → Open Login Guide).

### 5. WSL distro is wrong or empty

**Symptom:** Bridge Launcher finds the repo but fails to start.

**Fix:** In Settings → Bridge Setup → WSL Distro, make sure the value matches the distribution name where your repo lives (e.g., `Ubuntu`, `Debian`). If it is blank, the launcher may use the wrong environment.

### 6. You're still in iframe mode and don't realize it

**Symptom:** Memory Bank and Rules don't seem to do anything.

**Fix:** Check the mode toggle in the top-right corner of the panel. Memory and Rules only work in **SDK mode**. The toggle label shows which mode is currently active.

---

## Next steps

- [Usage Manual](../../USAGE.md) — full settings reference and API docs
- [Concepts Guide](../concepts/README.md) — mental model for modes, memory, and the bridge
- [Bridge Server README](../../../scripts/copilot-bridge/README.md) — advanced bridge configuration
