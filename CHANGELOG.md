# Changelog

All notable changes to SidePilot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.5.1] — 2026-03-13

### Added

- **iframe Opt-in Gate** — iframe 模式預設鎖定，需於「設定 › iframe 模式」手動開啟
  - 新增 `iframeEnabled` 設定項（預設 `false`）
  - iframe 模式按鈕顯示 🔒 鎖定標示，點擊時自動導引至設定區塊
  - 符合 ToS 灰色地帶的知情同意原則

### Changed

- **Legal Notice** — README 拆分 SDK / iframe 模式的法律聲明，更精確描述安全標頭移除行為與風險範疇
- **Third-Party Licenses** — README 新增第三方授權聲明（extension vendor bundle + bridge runtime）
- **USAGE.md** — 補全文件缺口：`vendor-content-cleaner.js`、`connection-controller.js`、`backup-manager.ts`、Bridge Launcher、Backup/Restore API 端點、Bridge 開發指令
- **Bridge README** — 加入 `SIDEPILOT_EXTENSION_ID` 環境變數說明與手動啟動指引

### Fixed

- `.env.example` PORT 錯誤值 `3000` 修正為 `31031`
- `GET /health` 文件回應範例與實際 bridge 輸出一致（`service`、`backend`、`auth` 欄位）

### Removed

- `docs/COPILOT_API_SPECIFICATION_ZH-TW_.md` — 移除內部研究文件（含 GitHub 非公開 API 端點說明，不適合公開倉庫）
- `docs/banner.png` — 舊版 banner（已由 `banner.webp` 取代）

---

## [0.5.0] — 2026-03-04

### Added

- **Permission API (WP-01)** — Asynchronous permission approval queue with whitelist mechanism
  - Auto-approve safe operations (`readTextFile`, `listDirectory`)
  - 60-second timeout with auto-deny
  - SSE real-time push for permission requests
  - Permission modal in side panel UI
- **Request Timeout (WP-02)** — CLI hang protection
  - `AbortController` + `Promise.race()` pattern
  - Zombie process cleanup (`taskkill` / `SIGKILL`) on timeout (default: 120s)
- **Config & Environment Variables (WP-04)** — Server-side env parsing
  - `GITHUB_COPILOT_CLI_PATH`, `GITHUB_COPILOT_TIMEOUT`, etc.
  - `GET /api/config` endpoint
- **Dynamic Model List (WP-05)** — CLI-based model discovery
  - Spawn CLI to fetch model list with 10-minute TTL cache
  - Fallback to hardcoded list on failure
  - `GET /api/models/info` endpoint
- **Prompt Strategy (WP-07)** — Output verbosity control
  - Three modes: `normal`, `concise`, `one-sentence`
  - Strategy suffix auto-appended before prompt
  - `GET/POST /api/prompt/strategy` endpoints
  - Strategy toggle buttons in Settings UI
- **Bridge Auto-Start** — `sidepilot://` URI scheme launcher support
- **Self-Iteration Protection** — BASW startup detection + SEAL integrity check
- **Context Injection Toggles** — Independent toggles for Identity, Memory, Rules, System Instructions
- **Structured Output** — `sidepilot_packet` + `assistant_response` format parsing
- **i18n Support** — Chrome i18n API with `_locales/zh_TW` and `_locales/en`
- **Prompt Strategy UI** — Strategy buttons in Settings > SDK Mode

### Changed

- Bridge Server upgraded to Express.js 5.x
- Session Manager refactored for ACP SDK compatibility
- Model selection now uses dynamic list with fallback
- Settings panel restructured with collapsible sections
- README fully rewritten with comprehensive documentation

### Fixed

- Windows `.cmd` shim handling for Copilot CLI (`shell: true`)
- Port conflict detection and error messaging
- SDK endpoint fallback (`/api/chat/sync` → `/api/chat`)

---

## [0.4.0] — 2026-02-17

### Added

- **SDK Mode** — Official GitHub Copilot SDK integration via Bridge Server
- **Memory Bank** — Persistent structured storage with 4 entry types
- **Rules Management** — 6 built-in templates, import/export
- **Page Capture** — Text, code blocks, full/partial screenshot capture
- **Link Guard** — Allowlist/denylist url pattern control
- **VS Code Connector** — URI scheme integration (`vscode://`, `cursor://`, `windsurf://`)
- **Config Sync** — Sync model/theme/reasoning settings to CLI config
- **Chat History** — Bridge-side conversation export and history browsing
- **Supervisor/Worker** — Auto-restart bridge server on crash

### Changed

- Migrated from Manifest V2 to Manifest V3
- Side Panel API replaces browser action popup

---

## [0.3.0] — 2026-02-11

### Added

- Initial iframe mode embedding GitHub Copilot web UI
- Basic toolbar with mode switch
- Floating capture button on page edges
- Settings panel with basic configuration

---

## [0.1.0] — 2026-01-xx

### Added

- Initial project setup
- Chrome Extension scaffold (Manifest V3)
- Basic side panel implementation
