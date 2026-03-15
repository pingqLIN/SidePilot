# Changelog

All notable changes to SidePilot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased] — Systematic Infrastructure Fixes

### Analysis: Systematic Errors in PR History

A review of all pull requests (#1–#41) revealed three recurring patterns that
caused the same bugs to be introduced, fixed, re-introduced, and re-fixed
multiple times:

**Error 1 — Copilot-agent fix/regress/re-fix cycle**
Each Copilot coding-agent session starts stateless and without awareness of what
previous agents have already fixed.  This caused:
- The integrity-seal digest length to be fixed three times (PRs #5, #12, #26):
  PR #12 raised `DIGEST_LENGTH` 8 → 16 hex chars, PR #5's merge-conflict
  resolution silently reverted the runtime validators in `background.js` /
  `sidepanel.js` back to `{8}`, and PR #26 was required to reconcile the
  mismatch again.
- The CORS / 127.0.0.1 binding to be fixed twice (PRs #4, #7).
- Full-page-screenshot page-state cleanup to be fixed twice (PRs #5, #25).
- The Jest test suite (ESM support, import paths) to be fixed twice (PRs #16,
  #17), producing a merge conflict resolved by PR #23.

**Error 2 — Debug/test artifact committed to CI config ("OH.NO" branch)**
An agent committed the string `"OH.NO"` into the `push.branches` list of
`ci.yml` while testing a workflow change.  The branch does not exist, so every
push to `main` triggered a CI run that immediately failed with a missing-ref
error.  Fixed by PR #39; PR #40 would revert that fix — do **not** merge #40.

**Error 3 — CodeQL SARIF upload race condition and unnecessary Python scan**
The CodeQL workflow ran three parallel jobs (`actions`, `javascript-typescript`,
`python`) with no concurrency cap.  All three finished at similar times and
raced to upload their SARIF reports, causing intermittent
`RequestError: SARIF upload conflict` failures unrelated to any code change.
Additionally, the repository is JavaScript/TypeScript only; the single Python
test helper does not warrant a full Python CodeQL scan.
Fixed by PR #39: `max-parallel: 1` added, Python language removed.

### One-Time Resolution (this PR)

- **`.github/workflows/ci.yml`** — add explicit comment documenting that only
  `"main"` belongs in `branches` and why debug branch names must not be added.
- **`.github/workflows/codeql.yml`** — add inline comments explaining the
  `max-parallel: 1` setting and the intentional exclusion of Python, making it
  obvious to any future agent or reviewer that these choices are deliberate and
  must not be reverted.
- **`CHANGELOG.md`** — this entry, providing a permanent audit trail of what
  went wrong and why.

### Changed

- `.github/workflows/ci.yml`: add protective comment against debug branch names
- `.github/workflows/codeql.yml`: add protective comments explaining `max-parallel: 1` and Python exclusion

---

## [0.5.2] — 2026-03-15

### Added

- **Authenticated bridge event stream helper** — 以 `fetch()` + 自訂 header 取代帶 token 的 SSE URL，避免 bridge auth token 出現在串流網址、瀏覽器歷史或外部記錄中

### Changed

- **Dependencies** — 更新核心開發與 bridge 相依：`defuddle`、`esbuild`、`jest`、`@types/jest`、`jest-environment-jsdom`、`@types/chrome`、`@types/node`、`@agentclientprotocol/sdk`
- **Release tooling** — `scripts/bump-version.mjs` 現在會在版本升級後自動重新計算並驗證 integrity seal，並保留 `Unreleased` 區段在 changelog 頂部

### Fixed

- **Bridge streaming auth** — bridge stream 改用 `X-SidePilot-Token` / `X-SidePilot-Extension-Id` headers 驗證，不再回退到 query token
- **Regression coverage** — 新增 `tests/extension/bridge-event-stream.test.js`，覆蓋 authenticated SSE 與 reconnect/fresh-token 行為
- **CI / PR hygiene** — 清理 stale PR、重疊衝突分支並讓 `main` 回到全綠 workflow 狀態

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
