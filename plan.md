# SidePilot 擴充程式 — Session 6 Checkpoint

## 專案概況
SidePilot 是 Chrome Extension (MV3) 側邊面板 AI 助手，透過 SDK Bridge (localhost:31031) 橋接 GitHub Copilot CLI，支援 SDK 模式（直接 API）與 iframe 模式（嵌入 Copilot UI）。

## 本 Session 完成項目 (Checkpoint 006)

### 1. 整頁截圖縮圖更新 + 標籤
- `renderCaptureContent()` 根據 `state.currentFullPageScreenshot` 判斷顯示「整頁截圖」或「可見範圍」標籤
- 副標題隨截圖類型動態切換

### 2. History 分頁圖示更換
- `📜` → `🗂️`（tab button + toolbar title）

### 3. 擷取按鈕 hover 寬度修正
- mouseenter: 寬度 <20px 時自動擴展到 20px，移除 `capture-compact`
- mouseleave: 延遲 1s 恢復原始設定寬度
- CSS 加入 `width 0.3s ease` transition

### 4. System Identity 自述系統（完整實作）
- `SIDEPILOT_SYSTEM_IDENTITY` 常數定義自我認知/目標/環境/工具/權限
- **Memory 分頁**：固定 📌 卡片在列表頂部（藍色邊框、漸層背景、pre-wrap）
- **Settings 分頁**：「📌 擴充自述」摺疊區段，含可編輯 textarea + 模塊 chips + 即時預覽
- **12 個模塊 tokens**：`{{BROWSER}}` `{{BRIDGE_PORT}}` `{{BRIDGE_URL}}` `{{EXTENSION_ID}}` `{{EXT_VERSION}}` `{{MANIFEST_V}}` `{{STORAGE_PATH}}` `{{BRIDGE_DIR}}` `{{PERMISSIONS}}` `{{LANG}}` `{{SCREEN}}` `{{TIMESTAMP}}`
- 儲存時 tokens 自動解析為實際值，存入 `chrome.storage.local`
- 啟動時載入已儲存模板並解析
- **Context 注入**：Identity toggle 控制是否注入 `buildMemoryInjectedPrompt` 的 `context.identity`
- `refreshSDKMemorySummary()` 包含 `id` 標記

### 5. Bridge 心跳間隔調整
- `sidepanel.js` `startSdkHealthPolling()`: 30s → 3s
- `sdk-client.js` `startHealthCheck()`: 30s → 3s
- Settings section polling 維持 1s（已有 jitter fix）

### 6. SDK API 端點資訊（進行中 — HTML 已加，CSS 未完成）
- Settings → SDK 模式 → 新增「API 端點」subsection
- 顯示 `/api/chat/sync` → 404 → `/api/chat` fallback 策略
- CSS `.settings-endpoint-info` `.endpoint-badge` 樣式尚未加入

## 未完成 / 進行中

| 項目 | 狀態 | 說明 |
|------|------|------|
| API 端點 CSS | 🔶 進行中 | `.endpoint-badge` `.endpoint-arrow` 樣式需加入 styles.css |
| 8 個舊 pending todos | ⚪ 重複 | 與 r5-* done 完全重複，可清除 |

## 兩個連線端架構

### A. SDK Bridge（HTTP REST + SSE）
- **端點**：`http://localhost:31031`
- **模組**：`sdk-client.js` → `server.ts` → `session-manager.ts` → Copilot CLI
- **API**：`/health`, `/api/chat/sync`, `/api/chat` (SSE), `/api/history`, `/api/logs/stream`
- **安全**：localhost-only、sessionId 隔離、無 CORS 開放

### B. VS Code Connector（URI Protocol）
- **端點**：`vscode://sidepilot.vscode-extension`
- **模組**：`vscode-connector.js`，單向 fire-and-forget
- **安全**：URI 長度限制 2000 字元、無回傳通道

兩通道完全獨立，無共享狀態。

## 關鍵檔案變更清單

```
extension/sidepanel.js        (+1074) — 核心邏輯：Identity 系統、模塊 tokens、hover 按鈕、心跳調整
extension/sidepanel.html       (+289) — Identity 編輯區、API 端點資訊、Identity toggle
extension/styles.css           (+945) — 固定卡片樣式、Identity editor/chips、hover transition
extension/background.js        (+317) — Defuddle+Turndown 注入、fixed/sticky 元素隱藏
extension/js/sdk-client.js      (+21) — 心跳 3s、images 支援
scripts/copilot-bridge/src/server.ts     (+187) — 20mb body、images passthrough
scripts/copilot-bridge/src/session-manager.ts (+66) — images prompt blocks
package.json                    (+12) — build:vendor、defuddle/turndown/esbuild devDeps
```

## 技術備註
- **Model list**: `session-manager.ts` `DEFAULT_MODELS` 硬編碼 + env vars，非動態查詢
- **Font stack**: `'JetBrains Mono', 'Fira Code', 'IBM Plex Mono', 'Cascadia Code', 'Consolas', 'SF Mono', 'Noto Sans TC', 'Source Han Sans TC', 'Microsoft JhengHei', 'PingFang TC', monospace, sans-serif`
- **Build commands**: Tests: `$env:NODE_OPTIONS="--experimental-vm-modules"; npx jest --no-cache` / Bridge: `cd scripts\copilot-bridge && npm run build` / Vendor: `npm run build:vendor`
- **Tests**: 21 pass (3 suites)
- **Branch**: `backup/pre-restore-20260303-2` = `main`，所有變更未 commit

---

# SidePilot 開發計畫（Microsoft Agent Framework 對照）
更新日期：2026-03-03

## 1) 目標與範圍
- 目標：補齊 SidePilot 與 Microsoft Agent Framework 文件的核心落差，優先處理安全與穩定性，再做功能增強。
- 範圍：Bridge（Node/TS）、Extension Sidepanel UI、Session 管理與設定層。
- 非本期範圍：雲端部署、多租戶後端、複雜外部工具市集。

## 2) 優先級與里程碑

### P0（高優先，1-2 週）
1. Permission 前端確認（取代自動 approve）
2. Request Timeout（避免 CLI 卡死）
3. MCP Server 配置（stdio/HTTP）

### P1（中優先，1-2 週）
4. 環境變數完整支援
5. Model 列表動態化
6. Session resume
7. 調整 Prompt 策略（Prompt Engineering）
8. SSE 串流效能優化（MV3 / Windows）

## 3) 工作包拆解與驗收標準

### WP-01 Permission 前端確認（P0）
現況
- selectPermissionOutcome 直接選第一個選項，等同預設同意。

目標
- 所有高風險權限請求改為「前端彈窗 + 使用者明確 approve/deny」。
- 支援白名單（可選）：僅限低風險請求自動同意。

實作要點
- Bridge 新增 permission_required 事件，攜帶 request id、scope、reason、options。
- Sidepanel 新增 permission modal（含 timeout 倒數、拒絕預設）。
- 回傳 API：POST /api/permission/resolve。
- 設定頁新增白名單（command pattern / file scope）。

驗收標準
- 未經使用者點擊不得執行高風險權限操作。
- deny 後 session 正常回傳可理解錯誤，不崩潰。
- E2E 測試覆蓋 approve 與 deny 兩條路徑。

---

### WP-02 Request Timeout（P0）
現況
- Bridge spawn 無 session-level timeout；CLI 卡住會讓請求掛起。

目標
- 每個請求具可配置 timeout（預設 120s），逾時可中止並回傳標準錯誤。

實作要點
- AbortController + child process kill tree。
- SSE 與 sync API 都要統一 timeout/error schema。
- timeout 來源優先序：request override > env > default。

驗收標準
- 模擬 CLI 卡住時，120s 內收到 timeout 錯誤。
- 逾時後同 session 可繼續下一次請求。
- 觀測到 timeout metric 與結束日志（含 request id）。

---

### WP-03 MCP Server 配置（P0）
現況
- 尚未實作 MCP config 透傳。

目標
- 支援在 SidePilot 設定 MCP servers（stdio/HTTP），並注入到 CLI session。

實作要點
- 設計 mcpServers 設定 schema（name/type/command|url/env/headers）。
- Bridge 啟動 session 時載入並驗證配置。
- 設定頁提供：新增/編輯/測試連線/啟停顯示。
- 安全：敏感欄位 masked；headers/token 不寫入明文日志。

驗收標準
- 至少 1 個 stdio MCP 與 1 個 HTTP MCP 可成功連線。
- MCP 工具可在聊天流程中被呼叫並回傳結果。
- 配置錯誤時有可讀錯誤提示，不影響主流程。

---

### WP-04 環境變數完整支援（P1）
目標
- 支援：GITHUB_COPILOT_CLI_PATH、GITHUB_COPILOT_TIMEOUT、GITHUB_COPILOT_LOG_LEVEL。

實作要點
- 建立集中式 config resolver（env + settings + default）。
- 啟動時印出 sanitized effective config（不含 secrets）。

驗收標準
- 修改 env 後重啟可生效。
- CLI path 錯誤時可明確提示 fallback 行為。

---

### WP-05 Model 列表動態化（P1）
目標
- 從 CLI --list-models（或等價 API）抓可用模型，失敗時 fallback 硬編碼清單。

實作要點
- 啟動快取模型清單（TTL，例如 10 分鐘）。
- UI 顯示來源：dynamic | fallback。

驗收標準
- 支援新增模型（如 gpt-5.2 / claude-sonnet-4.5）無需改碼。
- CLI 查詢失敗時不影響聊天可用性。

---

### WP-06 Session Resume（P1）
目標
- 支援 extension reload / bridge restart 後恢復 session context。

實作要點
- Session state 持久化（本機檔案或 storage），包含 session id、summary、last N turns。
- 加入版本號與過期策略（例如 24h）。

驗收標準
- 重新開啟 Sidepanel 可看到可恢復 session。
- 恢復後第一輪回應能引用先前上下文。

---

### WP-07 調整 Prompt 策略（Prompt Engineering）（P1）
目標
- 降低 SSE 傳輸 Token 與整體延遲。
- 改善首字時間（TTFT）與平均回應時間。

實作要點
- 預設提示策略加入精簡約束：Be concise，並提供可選 Answer in 1 sentence 模式。
- Settings 新增輸出策略切換（normal / concise / one-sentence）。
- 上下文控管：限制歷史輪數與 token budget，超限時做摘要或裁切。
- 提供 /clear 快捷清理對話快取，並在 UI 提示長對話會拖慢 TTFT。

驗收標準
- 基準測試下平均 Output Tokens 下降（目標 >= 30%）。
- 基準測試下 TTFT 或總回應時間改善（目標 >= 20%）。
- one-sentence 模式下，一般問答回覆為單句比例 > 90%。
- 關閉精簡模式後可恢復既有輸出品質與格式。

---

### WP-08 SSE 串流效能優化（MV3 / Windows）（P1）
目標
- 降低串流延遲與 UI 卡頓，提升長輸出時的流暢度與穩定性。

實作要點
- 傳輸層去緩衝：後端回應加入 X-Accel-Buffering: no、Cache-Control: no-transform，避免中介層暫存。
- 串流解析路徑：優先採用 fetch + ReadableStream + TextDecoderStream，確保「邊收邊畫」。
- UI 批次渲染：採 buffer queue + requestAnimationFrame，避免每個 token 觸發一次 re-render。
- MV3 生命周期：SSE 期間用 chrome.runtime.connect 保持連線活性，降低 Service Worker 休眠中斷。
- 架構優化：SSE 連線由 Background Service Worker 承接，再透過 message 傳給 Side Panel。
- Windows/網路優化：伺服器啟用 TCP_NODELAY；部署層優先 HTTP/2，減少連線排隊與標頭開銷。
- 前端渲染控管：避免全域 MutationObserver；動態容器使用 contain: strict 與必要的 will-change。

驗收標準
- 與基準相比，串流 TTFT 改善 >= 20%，整體回覆完成時間改善 >= 15%。
- 長輸出（>= 1500 tokens）時，UI 無明顯掉幀卡頓（主執行緒長任務次數顯著下降）。
- 連續 10 分鐘串流測試中，無因 SW 休眠造成的中斷。
- Header 驗證通過：回應可觀測到 X-Accel-Buffering: no 與 Cache-Control: no-transform。

## 4) 建議時程（可直接落地）
- Week 1
1. WP-01 Permission flow（後端事件 + 前端 modal + resolve API）
2. WP-02 Timeout（sync + SSE + kill/recovery）

- Week 2
1. WP-03 MCP config（schema、UI、連線測試、錯誤處理）
2. P0 整體回歸測試與文件更新

- Week 3
1. WP-04 Env support
2. WP-05 Dynamic model list + fallback

- Week 4
1. WP-06 Session resume
2. WP-07 Prompt strategy（concise / one-sentence / context trimming）

- Week 5
1. WP-08 SSE performance（buffering / stream parser / rAF batching / SW keep-alive）
2. 穩定性驗證、指標看板、release candidate

## 5) 測試策略
- 單元測試
- permission 決策機制、timeout resolver、config parser、model list fallback、prompt policy builder、stream parser。

- 整合測試
- CLI 卡死/慢回應、MCP connect/disconnect、session restore、長對話上下文裁切、SSE 連續串流穩定性。

- E2E 測試
- 前端 approve/deny、設定變更生效、重啟恢復流程、concise/one-sentence 模式切換、長文本串流流暢度。

- 效能測試
- TTFT、每秒 token 顯示速率、完成時間、主執行緒長任務、10 分鐘穩定串流。

## 6) 風險與對策
- MCP 配置複雜度高
- 對策：先做最小 schema + 嚴格驗證 + 範本配置。

- Timeout 誤殺長任務
- 對策：提供 per-request override；SSE 心跳與進度訊號。

- Permission UX 過度打擾
- 對策：白名單 + 可審計日志 + 安全預設拒絕。

- Prompt 過度壓縮造成回答品質下降
- 對策：提供 normal/concise/one-sentence 切換，並保留一鍵回復 normal。

- MV3 Keep-alive 造成資源耗用上升
- 對策：僅在串流期間啟用 keep-alive，結束後立即釋放 Port。

- HTTP/2/TCP 參數受部署環境限制
- 對策：將網路層優化設為可選能力，無法啟用時保留功能相容路徑。

## 7) Release Gate（出版前必過）
- P0 項目全部完成且測試通過。
- 不再有「未授權自動同意」路徑。
- timeout 發生時可恢復且不殘留僵屍程序。
- 至少 2 種 MCP 連線模式實測成功。
- Prompt 策略優化有可量測成效（Token 與 TTFT）。
- SSE 串流優化有可量測成效（TTFT、完成時間、穩定性）。

## 8) 本週可執行 TODO
1. 建立 permission event schema 與前端 modal wireframe
2. 在 session-manager 加入 timeout + abort 機制
3. 定義 mcpServers 設定 JSON schema 與設定頁欄位
4. 補 6 條關鍵測試（approve/deny/timeout/recover/mcp-ok/mcp-fail）
5. 新增 prompt 策略切換（normal / concise / one-sentence）與 /clear 提示
6. 建立 Token/TTFT 基準量測腳本（變更前後對照）
7. 串流改為 ReadableStream + rAF 批次渲染 PoC
8. 驗證並補齊 SSE 防緩衝 Header（X-Accel-Buffering / Cache-Control）
