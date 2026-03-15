# SidePilot — Development Status & Roadmap

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / language model agent       ║
║  Purpose         : Project state, milestone history,         ║
║                    pending work, and architectural goals     ║
║  Confidence      : HIGH — authoritative source               ║
║  Last updated    : 2026-03-15                                ║
╚══════════════════════════════════════════════════════════════╝
-->

---

## Project Identity

| Field | Value |
|-------|-------|
| Name | SidePilot |
| Type | Chrome MV3 side panel extension |
| Current shipped line | v0.5.0 (post-v2.0 architecture) |
| Active implementation target | v2.0 line — dual-mode (iframe + official SDK) |
| Next project line | v3 — dual-channel agent workspace (planning) |

---

## Architecture Goals

| # | Goal | Status |
|---|------|--------|
| 1 | Compliance via official `@github/copilot-sdk` | Achieved |
| 2 | Dual-mode switching (SDK ↔ iframe) | Achieved |
| 3 | Visual consistency across modes | Achieved |
| 4 | Backward-compatible iframe mode | Achieved |

**Data flow:**
```
Chrome Extension (sdk-client.js)
  ──HTTP/SSE──▶  Bridge Server (scripts/copilot-bridge, :31031)
                   ──JSON-RPC/stdio──▶  Copilot CLI (copilot --acp)
```

---

## Mode Tradeoff Summary

| Dimension | SDK mode | iframe mode |
|-----------|----------|-------------|
| Legal status | Official SDK — compliant | GitHub ToS gray area |
| Account risk | None | Present |
| Prerequisites | Copilot CLI + Bridge Server | None |
| Features | Streaming, context injection, multi-session | Native Copilot web |
| Use case | Long-term / production use | Quick access / trial |

---

## Completed Milestones

| Item | Description |
|------|-------------|
| M1 | Mode-switching UI + base architecture |
| M2 | Official SDK Bridge Server (`@github/copilot-sdk`) |
| M3 | SDK Chat UI + SSE streaming |
| Page Capture | Text, screenshot, code block extraction |
| Memory Bank | Task management, VS Code integration |
| Rules Management | Templates, import/export |
| Conversation History | Bridge-persisted SDK history, History tab grouped by date |
| Context Injection | Identity / Memory / Rules / System / Structured Output toggles |
| Bridge Auto-Start (MVP) | Detect bridge state + trigger OS launcher |
| Permission UI | Bridge permission request SSE + side panel consent modal |
| Link Guard | iframe allowlist / denylist boundary control |
| Antigravity Provider Probe | Settings page can probe local bridge `/health`, `/meta`, `/detect` |

---

## v3 Project Line

| Field | Value |
|-------|-------|
| Status | Planning / architecture definition |
| Position | New project line inside the same SidePilot repo |
| Primary doc hub | [`docs/v3/README.md`](v3/README.md) |
| Current focus | Live page context model, browser control boundary, dev-mode workflow, MVP slicing |

**Interpretation:**

- The current repo still ships and documents the `v0.5.x / v2` extension line.
- `SidePilot v3` is being developed as the next architecture line within the same repository.
- v3 planning should extend the current foundation carefully rather than overwrite the existing runtime docs.

**Near-term artifacts:**

- [`docs/v3/ARCHITECTURE.md`](v3/ARCHITECTURE.md)
- [`docs/v3/PAGE_CONTEXT_MODEL.md`](v3/PAGE_CONTEXT_MODEL.md)
- [`docs/v3/BROWSER_CONTROL_API.md`](v3/BROWSER_CONTROL_API.md)
- [`docs/v3/DEV_MODE.md`](v3/DEV_MODE.md)
- [`docs/v3/MVP_TASKS.md`](v3/MVP_TASKS.md)

---

## Pending Work

| Priority | Item | Notes |
|----------|------|-------|
| High | Bridge Server real-world testing | Requires active Copilot CLI |
| High | sidepanel.js modularization | Reduce single-file complexity |
| Medium | Automated tests for sidepanel + prompt orchestration | Coverage gap |
| Medium | iframe mode regression validation | GitHub UI change monitoring |
| Low | Chrome Web Store publish prep | Packaging, screenshots, store listing |

---

## Key Source Files

| File | Role |
|------|------|
| `extension/sidepanel.js` | Main UI controller (large, pending modularization) |
| `extension/background.js` | Service worker |
| `extension/js/sdk-client.js` | Bridge HTTP/SSE client |
| `extension/js/mode-manager.js` | iframe ↔ SDK mode switching |
| `extension/js/memory-bank.js` | Memory CRUD + injection |
| `extension/js/connection-controller.js` | Bridge health management |
| `scripts/copilot-bridge/src/server.ts` | Express app + all API routes |
| `scripts/copilot-bridge/src/supervisor.ts` | Process supervision + auto-restart |
| `scripts/bridge-launcher/windows/` | Windows URI handler installer |
