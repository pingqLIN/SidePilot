# SidePilot Copilot Bridge — API 呼叫手冊

> **Base URL:** `http://localhost:31031`
> 瀏覽器端透過 HTTP 呼叫本機 Bridge 服務，橋接 GitHub Copilot CLI (ACP)。

---

## 目錄

| # | 端點 | 方法 | 用途 |
|---|------|------|------|
| 1 | [`/health`](#1-health) | GET | 健康檢查 |
| 2 | [`/api/models`](#2-apimodels) | GET | 列出可用模型 |
| 3 | [`/api/sessions`](#3-apisessions---建立) | POST | 建立 Session |
| 4 | [`/api/sessions`](#4-apisessions---列出) | GET | 列出所有 Sessions |
| 5 | [`/api/sessions/:id`](#5-apisessionsid---刪除) | DELETE | 刪除 Session |
| 6 | [`/api/chat`](#6-apichat---sse-串流) | POST | 對話（SSE 串流回應） |
| 7 | [`/api/chat/sync`](#7-apichatsync---同步) | POST | 對話（同步回應） |
| 8 | [`/api/logs`](#8-apilogs) | GET | 取得近期 Log |
| 9 | [`/api/logs/stream`](#9-apilogsstream) | GET | 即時 Log 串流 (SSE) |
| 10 | [`/api/history`](#10-apihistory---列出) | GET | 列出歷史檔案 |
| 11 | [`/api/history/:filename`](#11-apihistoryfilename---讀取) | GET | 讀取特定日期歷史 |
| 12 | [`/api/history`](#12-apihistory---寫入) | POST | 寫入歷史紀錄 |
| 13 | [`/api/history/stream`](#13-apihistorystream) | GET | 即時歷史串流 (SSE) |

---

## 1. `/health`

**健康檢查** — 判斷 Bridge 是否可用、SDK 狀態。

```
GET /health
```

**回應範例：**
```json
{
  "status": "ok",
  "service": "sidepilot-copilot-bridge",
  "sdk": "ready",
  "backend": {
    "type": "acp-cli",
    "command": "copilot --acp --stdio"
  }
}
```

**瀏覽器端呼叫：**
```js
const res = await fetch('http://localhost:31031/health');
const data = await res.json();
// data.status === 'ok' → Bridge 可用
// data.sdk → 'idle' | 'ready' | 'connected'
```

---

## 2. `/api/models`

**列出可用模型**

```
GET /api/models
```

**回應範例：**
```json
{
  "success": true,
  "models": ["gpt-4.1", "gpt-5", "gpt-5.1", "gpt-5.2", "o4-mini", "claude-sonnet-4.5"]
}
```

**瀏覽器端呼叫：**
```js
const res = await fetch('http://localhost:31031/api/models');
const { models } = await res.json();
```

---

## 3. `/api/sessions` - 建立

**建立新 ACP Session** — 每個 Session 對應一個 `copilot --acp --stdio` 子程序。

```
POST /api/sessions
Content-Type: application/json
```

**Request Body：**
```json
{
  "model": "gpt-4.1",           // 可選，預設讀取環境變數 COPILOT_MODEL 或 gpt-4.1
  "systemMessage": "你是助手"    // 可選，初始 System Prompt
}
```

**回應範例：**
```json
{
  "success": true,
  "sessionId": "abc-123-def"
}
```

**瀏覽器端呼叫：**
```js
const res = await fetch('http://localhost:31031/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'gpt-4.1', systemMessage: '你是 SidePilot 助手' })
});
const { sessionId } = await res.json();
```

---

## 4. `/api/sessions` - 列出

**列出所有活躍 Sessions**

```
GET /api/sessions
```

**回應範例：**
```json
{
  "success": true,
  "sessions": [
    { "sessionId": "abc-123-def" },
    { "sessionId": "xyz-456-ghi" }
  ]
}
```

**瀏覽器端呼叫：**
```js
const res = await fetch('http://localhost:31031/api/sessions');
const { sessions } = await res.json();
```

---

## 5. `/api/sessions/:id` - 刪除

**刪除指定 Session** — 同時終止對應的 copilot 子程序。

```
DELETE /api/sessions/:id
```

**回應範例：**
```json
{ "success": true }
```

**瀏覽器端呼叫：**
```js
await fetch(`http://localhost:31031/api/sessions/${sessionId}`, {
  method: 'DELETE'
});
```

---

## 6. `/api/chat` - SSE 串流

**傳送訊息，以 Server-Sent Events 串流回應** — 主要用於即時顯示 AI 打字效果。

```
POST /api/chat
Content-Type: application/json
```

**Request Body：**
```json
{
  "sessionId": "abc-123-def",   // 可選，若不傳會自動建立新 Session
  "prompt": "你好",              // 必填
  "model": "gpt-4.1",           // 可選
  "images": [                    // 可選，圖片陣列
    { "mimeType": "image/png", "data": "<base64>" }
  ]
}
```

**SSE 事件格式：**

| event | data | 說明 |
|-------|------|------|
| `delta` | `{ "content": "部分文字" }` | 文字片段（逐步串流） |
| `tool` | `{ "name": "...", "status": "start" }` | 工具呼叫開始/更新 |
| `message` | `{ "content": "完整回應文字" }` | 最終完整回應 |
| `error` | `{ "message": "錯誤訊息" }` | 錯誤 |
| `done` | `{}` | 串流結束 |

**瀏覽器端呼叫：**
```js
const res = await fetch('http://localhost:31031/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId, prompt: '你好' })
});

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      const eventType = line.slice(7);
      // 下一行是 data:
    }
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      // 處理 data...
    }
  }
}
```

---

## 7. `/api/chat/sync` - 同步

**傳送訊息，等待完整回應後回傳** — 簡單用法，無串流。

```
POST /api/chat/sync
Content-Type: application/json
```

**Request Body：**
```json
{
  "sessionId": "abc-123-def",   // 可選
  "prompt": "解釋什麼是 ACP",    // 必填
  "model": "gpt-4.1",           // 可選
  "images": [                    // 可選
    { "mimeType": "image/png", "data": "<base64>" }
  ]
}
```

**回應範例：**
```json
{
  "success": true,
  "sessionId": "abc-123-def",
  "content": "ACP (Agent Client Protocol) 是一個..."
}
```

**瀏覽器端呼叫：**
```js
const res = await fetch('http://localhost:31031/api/chat/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId, prompt: '解釋什麼是 ACP' })
});
const { content } = await res.json();
```

---

## 8. `/api/logs`

**取得近期 Bridge 日誌** — 預設回傳最近 200 筆，最多 500 筆。

```
GET /api/logs?count=100
```

**回應範例：**
```json
{
  "success": true,
  "logs": [
    { "ts": "2026-03-03T08:00:00.000Z", "level": "info", "message": "[ACP] Session created: ..." },
    { "ts": "2026-03-03T08:00:01.000Z", "level": "warn", "message": "[ACP stderr] ..." }
  ]
}
```

**瀏覽器端呼叫：**
```js
const res = await fetch('http://localhost:31031/api/logs?count=100');
const { logs } = await res.json();
```

---

## 9. `/api/logs/stream`

**即時 Log 串流 (SSE)** — 持續接收新日誌，連線時會先推送最近 50 筆。

```
GET /api/logs/stream
```

**瀏覽器端呼叫：**
```js
const evtSource = new EventSource('http://localhost:31031/api/logs/stream');

evtSource.onmessage = (event) => {
  const entry = JSON.parse(event.data);
  // entry: { ts, level, message } 或 { connected: true }
  console.log(`[${entry.level}] ${entry.message}`);
};

// 斷線時關閉
evtSource.onerror = () => evtSource.close();
```

---

## 10. `/api/history` - 列出

**列出所有歷史紀錄檔案** — 按日期分檔，格式為 `history_YYYY-MM-DD.jsonl`。

```
GET /api/history
```

**回應範例：**
```json
{
  "success": true,
  "files": [
    { "name": "history_2026-03-03.jsonl", "path": "...", "date": "2026-03-03" },
    { "name": "history_2026-03-02.jsonl", "path": "...", "date": "2026-03-02" }
  ]
}
```

**瀏覽器端呼叫：**
```js
const res = await fetch('http://localhost:31031/api/history');
const { files } = await res.json();
```

---

## 11. `/api/history/:filename` - 讀取

**讀取特定日期的歷史訊息**

```
GET /api/history/history_2026-03-03.jsonl
```

**回應範例：**
```json
{
  "success": true,
  "messages": [
    { "role": "user", "content": "你好", "timestamp": "2026-03-03T08:00:00.000Z" },
    { "role": "assistant", "content": "你好！", "timestamp": "2026-03-03T08:00:01.000Z" }
  ]
}
```

**瀏覽器端呼叫：**
```js
const res = await fetch('http://localhost:31031/api/history/history_2026-03-03.jsonl');
const { messages } = await res.json();
```

---

## 12. `/api/history` - 寫入

**寫入一筆歷史紀錄** — 自動附加 `timestamp` 並推送至 SSE 客戶端。

```
POST /api/history
Content-Type: application/json
```

**Request Body：**
```json
{
  "role": "user",
  "content": "你好",
  "session": "my-session-id",
  "tags": ["general"]
}
```

**回應範例：**
```json
{ "success": true }
```

**瀏覽器端呼叫：**
```js
await fetch('http://localhost:31031/api/history', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ role: 'user', content: '你好', session: sessionId })
});
```

---

## 13. `/api/history/stream`

**即時歷史串流 (SSE)** — 當有新歷史寫入時即時推送。

```
GET /api/history/stream
```

**瀏覽器端呼叫：**
```js
const evtSource = new EventSource('http://localhost:31031/api/history/stream');

evtSource.onmessage = (event) => {
  const entry = JSON.parse(event.data);
  // 新的歷史訊息
};
```

---

## 錯誤處理

所有 API 在失敗時回傳統一格式：

```json
{
  "success": false,
  "error": "錯誤描述訊息"
}
```

HTTP 狀態碼：
- `400` — 參數錯誤（如缺少 `prompt`）
- `500` — 伺服器內部錯誤

---

## 環境變數

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `PORT` | `31031` | Bridge 服務埠 |
| `COPILOT_MODEL` | `gpt-4.1` | 預設模型 |
| `COPILOT_MODELS` | *(空)* | 自訂模型清單（逗號分隔） |

---

## 典型使用流程

```
瀏覽器                         Bridge (localhost:31031)
  │                                    │
  ├── GET /health ──────────────────►  │  ① 確認 Bridge 可用
  │◄──── { status: "ok" } ────────────┤
  │                                    │
  ├── GET /api/models ──────────────►  │  ② 取得可用模型
  │◄──── { models: [...] } ──────────┤
  │                                    │
  ├── POST /api/sessions ───────────►  │  ③ 建立 Session
  │   { model: "gpt-4.1" }            │
  │◄──── { sessionId: "xxx" } ───────┤
  │                                    │
  ├── POST /api/chat ───────────────►  │  ④ 傳送訊息 (SSE 串流)
  │   { sessionId, prompt }            │
  │◄──── event: delta ───────────────┤  ← 文字片段
  │◄──── event: delta ───────────────┤  ← 文字片段
  │◄──── event: tool  ───────────────┤  ← 工具呼叫
  │◄──── event: message ─────────────┤  ← 完整回應
  │◄──── event: done  ───────────────┤  ← 結束
  │                                    │
  ├── DELETE /api/sessions/xxx ─────►  │  ⑤ 結束 Session
  │◄──── { success: true } ──────────┤
```
