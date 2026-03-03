# SidePilot 技術對話紀錄

> 日期：2026-03-03  
> Session ID：`42dda620-eb4d-41b1-9d56-7526b0862b14`  
> AI 模型：Claude Opus 4.6（透過 GitHub Copilot CLI）

---

## 1. 連線方式

```
瀏覽器 Side Panel (SidePilot Extension)
        │
        │  HTTP POST + SSE 串流
        │  (包裝為 sidepilot.turn-packet.v1)
        ▼
   SDK Bridge (Node.js, localhost:31031)
        │
        │  解析 turn-packet，轉發至 Copilot CLI
        ▼
   GitHub Copilot CLI (copilot --acp --stdio)
        │
        │  JSON-RPC over stdio
        ▼
   Claude Opus 4.6
        │
        │  AI 回應
        ▼
   Bridge 包裝回應為結構化輸出
   (sidepilot_packet + assistant_response)
        │
        │  SSE 串流回傳
        ▼
   SidePilot Extension 渲染顯示
```

| 項目 | 說明 |
|------|------|
| **模式** | SDK 模式 |
| **Bridge 位址** | `localhost:31031` |
| **通訊協議（請求）** | `sidepilot.turn-packet.v1` |
| **通訊協議（回應）** | `sidepilot.sandbox.v1`（`sidepilot_packet` + `assistant_response`） |
| **AI 模型** | Claude Opus 4.6（透過 GitHub Copilot） |
| **工作目錄** | `C:\Dev\Projects\SidePilot\scripts\copilot-bridge` |

---

## 2. Session 隔離機制（No Cross-Contamination）

### 2.1 獨立 Session 隔離

每個 SidePilot 對話對應一個**獨立的 Copilot CLI 程序（process）**，擁有：
- 獨立的 Session ID
- 獨立的工作目錄（working directory）
- 獨立的對話歷史上下文

### 2.2 Bridge 路由機制

```
SidePilot Tab A ──┐
                  ├──▶ Bridge ──▶ CLI Process A (session-abc)
SidePilot Tab B ──┘         ──▶ CLI Process B (session-xyz)
```

- 每個請求透過 session 識別碼路由到對應的 CLI process
- Bridge 維護 **session → process 的映射表**
- 不同 session 的訊息不會被送到錯誤的 CLI

### 2.3 Turn-Packet 自帶上下文

`sidepilot.turn-packet.v1` 每次請求都完整攜帶 identity、rules、memory，不依賴伺服器端狀態（stateless-friendly）。

### 2.4 無共享記憶體

```
CLI Process A          CLI Process B
┌──────────────┐      ┌──────────────┐
│ 獨立 stdin   │      │ 獨立 stdin   │
│ 獨立 stdout  │      │ 獨立 stdout  │
│ 獨立 env     │      │ 獨立 env     │
└──────────────┘      └──────────────┘
     ❌ 無共享通道
```

**總結：** OS 層級 process 隔離 + Bridge session 路由 + 協議 stateless 設計

---

## 3. Copilot Bridge 完整介紹

### 3.1 原始碼結構（4 個檔案）

| 檔案 | 角色 | 說明 |
|------|------|------|
| `supervisor.ts` | 🛡️ Supervisor | 進程管理：fork Worker、心跳監控（10s）、crash 自動重啟（指數退避，最大 30s）、快速重啟保護（60s 內最多 5 次） |
| `server.ts` | 🚀 Worker | Express HTTP 伺服器（port 31031），定義所有 API 路由，處理 SSE 串流、歷史紀錄、日誌 |
| `session-manager.ts` | 🔗 Session Manager | 管理 `copilot --acp --stdio` 子進程，透過 ACP SDK 建立 JSON-RPC 連線 |
| `ipc-types.ts` | 📋 型別定義 | Supervisor ↔ Worker 的 IPC 訊息介面 |

### 3.2 API 端點

| 端點 | 方法 | 功能 |
|------|------|------|
| `/health` | GET | 健康檢查 |
| `/api/models` | GET | 列出可用模型 |
| `/api/sessions` | GET/POST | 列出/建立 Session |
| `/api/sessions/:id` | DELETE | 刪除 Session |
| `/api/chat` | POST | **SSE 串流對話**（核心） |
| `/api/chat/sync` | POST | 同步對話 |
| `/api/logs` | GET | 取得日誌 |
| `/api/logs/stream` | GET | SSE 即時日誌串流 |
| `/api/history` | GET/POST | 歷史紀錄 CRUD |
| `/api/history/stream` | GET | SSE 歷史即時推送 |

### 3.3 關鍵技術

- **通訊協議：** ACP (Agent Client Protocol) — `@agentclientprotocol/sdk`
- **串流：** NDJson over stdio → SSE over HTTP
- **預設模型：** `gpt-4.1`（可透過 `COPILOT_MODEL` 環境變數覆寫）
- **可用模型：** gpt-4.1, gpt-5, gpt-5.1, gpt-5.2, o4-mini, claude-sonnet-4.5
- **權限處理：** 自動選取第一個可用選項
- **CORS：** `origin: '*'` 允許 Chrome Extension 存取

### 3.4 IPC 協定（Supervisor ↔ Worker）

**Worker → Supervisor：**

| 訊息類型 | 欄位 | 說明 |
|----------|------|------|
| `ready` | `port: number` | Worker 已啟動，回報監聽埠 |
| `heartbeat` | — | 心跳信號（每 10 秒） |
| `error` | `message: string` | 錯誤回報 |

**Supervisor → Worker：**

| 訊息類型 | 說明 |
|----------|------|
| `shutdown` | 通知 Worker 優雅關閉 |
