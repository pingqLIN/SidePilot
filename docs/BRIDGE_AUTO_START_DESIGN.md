# SidePilot Bridge 自動啟動方案設計（MVP）

> 狀態：Proposed  
> 日期：2026-03-04  
> 範圍：Chrome Extension + 本機 Bridge 啟動流程（不改動核心 AI 邏輯）

---

## 1) 目標與限制

### 1.1 目標
1. 使用者進入 SDK 模式時，Bridge 能盡量自動就緒。
2. 失敗時提供可診斷、可重試、可回退的流程。
3. 以最小開發量落地，符合 WWND「不過度開發」原則。

### 1.2 已知限制
1. Chrome Extension 無法直接啟動任意本機執行檔。
2. 真正「無感全自動」通常需要 Native Host 或常駐服務。
3. 我們優先採「按需自動啟動 + 失敗可手動修復」的中間方案。

---

## 2) 候選方案比較

| 方案 | 自動程度 | 開發量 | 優點 | 缺點 |
|---|---|---:|---|---|
| A. 開機常駐（Task Scheduler / Service） | 高 | 低-中 | 最穩定、切 SDK 幾乎秒連線 | 吃常駐資源、安裝與權限成本高 |
| B. 自訂協定啟動器（`sidepilot://start-bridge`） | 中-高 | 中 | 按需啟動、對現有架構侵入小 | 首次需安裝啟動器；部分瀏覽器情境需使用者手勢 |
| C. Native Messaging Host | 高 | 高 | 體驗最佳、可雙向控制 | 安裝/簽章/維護成本最高 |
| D. 全手動（現況） | 低 | 低 | 開發最少 | 使用摩擦最大、失敗率高 |

### 推薦
採 **B（自訂協定啟動器）** 作為 MVP；若未來追求更高自動化再升級 C。

---

## 3) 推薦架構（方案 B）

```text
SidePilot Extension (SDK tab)
  -> GET /health
    -> ready: continue
    -> not ready: trigger sidepilot://start-bridge
      -> local launcher starts bridge supervisor
      -> extension polls /health (10~15s)
        -> ready: continue
        -> fail: show reason + fallback actions
```

### 3.1 新增元件
1. **Bridge Launcher（外部小工具）**
   - 單一職責：接收 `sidepilot://start-bridge`，啟動 `npm start`（或既有 supervisor 命令）。
   - 具互斥鎖：若 Bridge 已在啟動中/運行中，直接返回成功。
2. **Extension AutoStart Controller（sidepanel/background）**
   - 健康檢查、冷卻、重試、狀態回報。
   - 不持有高權限，不直接執行本機命令。

### 3.2 既有元件重用
1. `GET /health`（Bridge 既有）
2. Settings 既有 Bridge 區塊（檢查、複製啟動指令、測試連線）
3. 現有狀態提示（status + toast + log）

---

## 4) 事件流程（MVP）

### 4.1 觸發時機
1. 切換至 SDK 模式時。
2. SDK 首次送訊息前（保底觸發）。

### 4.2 流程
1. 檢查 `autoStartBridgeEnabled` 是否開啟（預設：開）。
2. 呼叫 `GET /health`。
3. 若 Bridge 不可用：
   - 判斷冷卻期（例如 60 秒）是否已過。
   - 未過：不重複觸發，直接提示等待/手動按鈕。
   - 已過：導航到 `sidepilot://start-bridge?source=extension&v=1`。
4. 啟動後輪詢 `/health`（每 1 秒，最多 12 次）。
5. 成功：SDK 流程繼續。
6. 失敗：顯示錯誤原因與修復動作（重試、打開登入頁、複製指令）。

### 4.3 失敗不阻塞原則
1. 只阻塞「SDK 呼叫」；不鎖整個 extension。
2. 允許使用者切回 iframe 模式。

---

## 5) 設定與狀態欄位

建議新增 settings：

```json
{
  "autoStartBridgeEnabled": true,
  "autoStartBridgeCooldownMs": 60000,
  "autoStartBridgeLastAttemptAt": 0,
  "autoStartBridgeLastResult": "idle",
  "autoStartBridgeLastError": ""
}
```

說明：
1. `enabled`：主開關。
2. `cooldown`：避免連續喚起協定。
3. `last*`：UI 診斷顯示與後續分析。

---

## 6) 錯誤碼設計（Extension 層）

| 代碼 | 說明 | 建議動作 |
|---|---|---|
| `BRG-AUTO-001` | 協定啟動被瀏覽器阻擋 | 顯示「點擊啟動 Bridge」按鈕（使用者手勢） |
| `BRG-AUTO-002` | 協定已觸發但健康檢查逾時 | 顯示複製指令與重試 |
| `BRG-AUTO-003` | 冷卻中，略過重複觸發 | 顯示剩餘秒數 |
| `BRG-AUTO-004` | 啟動器回報參數不合法 | 記錄 log，提示更新啟動器 |
| `BRG-AUTO-005` | Bridge 已啟動但狀態異常 | 提示查看 Bridge log / 重啟 |

---

## 7) UI 文案鍵（i18n 預留）

建議新增 key（先可只做 zh-TW / en）：

1. `settings.bridge.autostart.title`
2. `settings.bridge.autostart.desc`
3. `settings.bridge.autostart.status.starting`
4. `settings.bridge.autostart.status.ready`
5. `settings.bridge.autostart.status.failed`
6. `settings.bridge.autostart.action.retry`
7. `settings.bridge.autostart.action.launch`
8. `settings.bridge.autostart.action.copyCmd`

---

## 8) 安全邊界

1. 協定啟動器不得接受任意命令字串。
2. 協定參數只允許固定 allowlist（`source`, `v` 等）。
3. 啟動器固定橋接目錄與啟動命令，不做 shell 拼接。
4. Extension 僅做健康檢查與狀態顯示，不持有額外系統權限。

---

## 9) 驗收條件（MVP）

1. 啟用自動啟動時，SDK 模式下 Bridge 未啟動可自動觸發一次。
2. 12 秒內 Bridge ready，SDK 對話可正常送出。
3. 若啟動失敗，UI 能顯示錯誤碼與至少 2 個修復動作。
4. 冷卻期間不連續觸發協定（避免啟動風暴）。
5. 關閉自動啟動後，行為回到手動模式，不影響其他功能。

---

## 10) 實作分期

### Phase 1（本次建議）
1. Settings 增加 `Auto Start Bridge` 開關。
2. 加入 AutoStart Controller（health + cooldown + poll）。
3. 協定觸發 + 錯誤碼 + 基本 UI 提示。

### Phase 2（可選）
1. Launcher 回報更細緻結果（例如已在執行/剛啟動/啟動失敗）。
2. 將 Bridge log 摘要串到設定頁。

### Phase 3（長期）
1. 評估升級 Native Messaging Host，追求更高自動化。

---

## 11) 風險與對策

1. **風險**：外部協定在某些情境需使用者手勢。  
   **對策**：保留「一鍵啟動」按鈕，並在自動失敗後引導點擊。

2. **風險**：啟動器版本漂移導致參數不相容。  
   **對策**：保留 `v` 版本參數與 `BRG-AUTO-004`。

3. **風險**：重複觸發造成反覆啟動。  
   **對策**：冷卻 + 健康檢查前置 + 啟動器互斥鎖。

---

## 12) 結論

在「不過度開發」前提下，**方案 B** 可用中等成本換取接近自動化體驗，且保留清楚的升級路線（Native Host）。  
建議先完成 Phase 1，快速降低 SDK 模式的連線摩擦。

