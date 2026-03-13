# SidePilot Copilot Bridge

輕量 HTTP 橋接服務，連接 SidePilot Chrome Extension 與 GitHub Copilot CLI SDK。

## 架構總覽

```
┌─────────────────────────────┐
│  Chrome Extension           │
│  (sdk-client.js)            │
└──────────┬──────────────────┘
           │ HTTP / SSE
           ▼
┌─────────────────────────────┐
│  Supervisor (supervisor.ts) │  ← 進程管理：心跳監控、自動重啟
│    └─ Worker (server.ts)    │  ← Express HTTP 伺服器
│         └─ SessionManager   │  ← ACP 連線管理
└──────────┬──────────────────┘
           │ JSON-RPC (stdio)
           ▼
┌─────────────────────────────┐
│  copilot --acp --stdio      │  ← GitHub Copilot CLI
└─────────────────────────────┘
```

**Supervisor / Worker 模式：** 生產環境透過 Supervisor 管理 Worker 生命週期，包含心跳偵測（10 秒間隔）、指數退避重啟（最大 30 秒）及快速重啟保護（60 秒內最多 5 次）。開發環境可直接啟動 Worker。

## 前置需求

- **Node.js** ≥ 24.0.0
- **GitHub Copilot CLI** 已安裝並加入 PATH（[安裝指南](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli)）

## 快速開始

```bash
# 安裝依賴
npm install

# 手動啟動前，先綁定 SidePilot extension id
export SIDEPILOT_EXTENSION_ID=<your-chrome-extension-id>

# 建議：直接 build + 啟動 Supervisor
npm start

# 開發模式（hot-reload, worker only）
npm run dev
```

## NPM Scripts

| 指令               | 說明                                 |
| ------------------ | ------------------------------------ |
| `npm run dev`      | 以 tsx watch 啟動 Worker（熱重載）   |
| `npm run dev:supervisor` | 以 tsx watch 啟動 Supervisor   |
| `npm run build`    | TypeScript 編譯至 `dist/`           |
| `npm start`        | 建議啟動方式：build 後啟動 Supervisor |
| `npm run start:worker` | 直接啟動 Worker（不含 Supervisor）|
| `npm run clean`    | 清除 `dist/` 輸出                    |

## 環境變數

可透過 `.env` 檔案或環境變數設定，參考 `.env.example`。

| 變數             | 預設值    | 說明                              |
| ---------------- | --------- | --------------------------------- |
| `PORT`           | `31031`   | HTTP 伺服器監聽埠                 |
| `SIDEPILOT_EXTENSION_ID` | — | 允許存取 bridge 的 Chrome extension id |
| `COPILOT_MODEL`  | `gpt-4.1` | 預設 AI 模型                     |
| `COPILOT_MODELS` | —         | 自訂模型清單（逗號分隔）          |
| `LOG_LEVEL`      | `info`    | 日誌等級（debug/info/warn/error） |

## API 端點

### `GET /health`

健康檢查，Extension 的 mode-manager 用此端點偵測 SDK 模式是否可用。

**回應範例：**
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
    "extensionOrigin": "chrome-extension://<your-chrome-extension-id>"
  }
}
```

### `POST /api/auth/bootstrap`

由已綁定的 SidePilot extension bootstrap loopback token。若 bridge 啟動時沒有設定 `SIDEPILOT_EXTENSION_ID`，或請求不是來自對應的 `chrome-extension://<id>`，會直接拒絕。之後所有 `/api/*` 請求都必須同時符合 extension origin 與 token 驗證。

---

### `GET /api/models`

列出可用的 AI 模型。

**回應範例：**
```json
{
  "success": true,
  "models": ["gpt-4.1", "gpt-5", "gpt-5.1", "gpt-5.2", "o4-mini", "claude-sonnet-4.5"]
}
```

---

### `POST /api/sessions`

建立新的對話 Session。每個 Session 對應一個獨立的 `copilot --acp --stdio` 子進程。

**Request Body：**
```json
{
  "model": "gpt-4.1",
  "systemMessage": "你是一個友善的助手"
}
```

**回應範例：**
```json
{ "success": true, "sessionId": "sess_abc123" }
```

---

### `GET /api/sessions`

列出所有活躍的 Session。

---

### `DELETE /api/sessions/:id`

刪除指定 Session 並終止對應的 Copilot CLI 子進程。

---

### `POST /api/chat`

傳送訊息並以 **Server-Sent Events (SSE)** 串流回應。

**Request Body：**
```json
{
  "sessionId": "sess_abc123",
  "prompt": "解釋什麼是 TypeScript",
  "model": "gpt-4.1"
}
```

**SSE 事件格式：**

| 事件名稱   | Data 格式                           | 說明                    |
| ---------- | ----------------------------------- | ----------------------- |
| `delta`    | `{ "content": "..." }`             | 串流文字片段            |
| `tool`     | `{ "name": "...", "status": "..." }` | 工具呼叫狀態          |
| `message`  | `{ "content": "..." }`             | 最終完整回應            |
| `error`    | `{ "message": "..." }`             | 錯誤訊息                |
| `done`     | `{}`                               | 串流結束                |

若未提供 `sessionId`，會自動建立新 Session。

---

### `POST /api/chat/sync`

同步傳送訊息，等待完成後回傳完整結果。

**Request Body：** 同 `/api/chat`

**回應範例：**
```json
{
  "success": true,
  "sessionId": "sess_abc123",
  "content": "TypeScript 是 JavaScript 的超集..."
}
```

## 原始碼結構

```
src/
├── supervisor.ts       # Supervisor 進程 — 管理 Worker 生命週期
├── server.ts           # Worker 進程 — Express HTTP 伺服器與路由
├── session-manager.ts  # ACP Session 管理器 — 操作 Copilot CLI 子進程
└── ipc-types.ts        # Supervisor ↔ Worker IPC 訊息型別定義
```

### IPC 協定（Supervisor ↔ Worker）

**Worker → Supervisor：**

| 訊息類型    | 欄位            | 說明                     |
| ----------- | --------------- | ------------------------ |
| `ready`     | `port: number`  | Worker 已啟動，回報監聽埠 |
| `heartbeat` | —               | 心跳信號（每 10 秒）     |
| `error`     | `message: string` | 錯誤回報               |

**Supervisor → Worker：**

| 訊息類型    | 說明               |
| ----------- | ------------------ |
| `shutdown`  | 通知 Worker 優雅關閉 |

## 技術細節

- **ACP (Agent Client Protocol)：** 透過 `@agentclientprotocol/sdk` 與 Copilot CLI 的 stdio 通道建立 JSON-RPC 連線
- **權限處理：** 自動選取第一個可用的權限選項（`selectPermissionOutcome`）
- **CORS：** 允許所有來源（`origin: '*'`），適用於 Chrome Extension 內容
- **優雅關閉：** 監聽 SIGINT/SIGTERM 信號，清理所有 Session 後退出
