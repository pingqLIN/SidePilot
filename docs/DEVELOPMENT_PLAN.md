# SidePilot — Development Status & Roadmap

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / language model agent       ║
║  Purpose         : Project state, milestone history,         ║
║                    pending work, and architectural goals     ║
║  Confidence      : HIGH — authoritative source               ║
║  Last updated    : 2026-03-14                                ║
╚══════════════════════════════════════════════════════════════╝
-->

---

## Project Identity

| Field | Value |
|-------|-------|
| Name | SidePilot |
| Type | Chrome MV3 side panel extension |
| Current milestone | v0.5.0 (post-v2.0 architecture) |
| Version target | v2.0 — dual-mode (iframe + official SDK) |

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
