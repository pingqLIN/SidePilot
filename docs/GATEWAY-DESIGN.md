# SidePilot Multi-Provider Gateway — 架構設計與開發計畫

> **版本**：Draft v1 ｜ **日期**：2026-03-03  
> **目標**：讓 SidePilot 從「Copilot 專用擴充」演進為「多 LLM 後端通用擴充」

---

## 目錄

1. [現況分析](#1-現況分析)
2. [架構方案選擇](#2-架構方案選擇)
3. [Gateway 架構設計](#3-gateway-架構設計)
4. [Provider API 契約](#4-provider-api-契約)
5. [耦合分析與改動清單](#5-耦合分析與改動清單)
6. [外部 Bridge 規格](#6-外部-bridge-規格)
7. [前端整合](#7-前端整合)
8. [開發計畫](#8-開發計畫)
9. [風險與對策](#9-風險與對策)

---

## 1. 現況分析

### 1.1 現行架構

```
Chrome Extension (Side Panel)
        │
        │  HTTP + SSE
        ▼
   Copilot Bridge (localhost:31031)
        │
        │  ACP SDK (JSON-RPC over stdio)
        ▼
   copilot --acp --stdio
        │
        ▼
   GitHub Copilot → LLM (GPT / Claude)
```

### 1.2 耦合清單

| 檔案 | 耦合程度 | 問題描述 |
|------|----------|----------|
| `session-manager.ts` | 🔴 CRITICAL | ACP SDK、`copilot` CLI spawn、事件名稱硬編碼 |
| `server.ts` | 🟠 HIGH | SSE 事件解析 (`agent_message_chunk`, `tool_call`) 綁定 ACP |
| `sdk-client.js` | 🟡 MEDIUM | 假設單一 Bridge、固定 port、固定 SSE 事件格式 |
| `sidepanel.js` | 🟢 LOW | 透過 sdk-client 間接存取，幾乎無直接耦合 |

### 1.3 問題陳述

- 新增一個 CLI 後端（如 Codex CLI、Ollama）需要改動 session-manager.ts 核心邏輯
- ACP 協議細節散佈在 session-manager + server 兩處
- 無法同時使用多個 LLM 後端
- Model 列表硬編碼，不同後端無法動態提供

---

## 2. 架構方案選擇

### 2.1 方案比較

| 項目 | A: 重寫 Bridge | B: 每 CLI 獨立 Bridge | C: 混合 Gateway (✅ 選定) |
|------|----------------|----------------------|--------------------------|
| **核心想法** | 抽象 Provider 介面 | 各 CLI 獨立進程 | Copilot 內建 + 外部 proxy |
| **Copilot 影響** | 大幅重構 | 無 | 零改動 |
| **新後端整合** | 改 Bridge 程式碼 | 獨立開發 | 獨立開發 + Gateway 註冊 |
| **穩定性風險** | 高（核心重寫） | 低（隔離） | 最低（漸進式） |
| **工作量** | ~25h | ~15h | ~10h |
| **同時多後端** | ✅ | ✅ | ✅ |
| **統一 API** | ✅ | ❌ 各自分散 | ✅ Gateway 統一 |

### 2.2 決策：混合 Gateway 方案

**理由：**
1. Copilot Bridge 已穩定運行，零改動＝零風險
2. 新後端（Codex、Ollama）獨立開發，不影響現有功能
3. Gateway 層提供統一 API，前端只改 routing 邏輯
4. 漸進式演進，每個階段都可獨立交付

---

## 3. Gateway 架構設計

### 3.1 整體架構圖

```
Chrome Extension (Side Panel)
        │
        │  HTTP + SSE
        ▼
┌─────────────────────────────────────────┐
│         Gateway (localhost:31031)        │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  Provider    │  │  Provider       │   │
│  │  Registry    │  │  Router         │   │
│  │  (config)    │  │  (request → P)  │   │
│  └─────────────┘  └─────────────────┘   │
│                                         │
│  ┌────────────────────────────────────┐  │
│  │  Internal Providers               │  │
│  │  ┌──────────┐                     │  │
│  │  │ Copilot  │ (現有 ACP 邏輯)     │  │
│  │  │ Provider │                     │  │
│  │  └──────────┘                     │  │
│  └────────────────────────────────────┘  │
│                                         │
│  ┌────────────────────────────────────┐  │
│  │  External Provider Proxy          │  │
│  │  → http://localhost:31032 (Codex) │  │
│  │  → http://localhost:31033 (Ollama)│  │
│  └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
        │                    │
        ▼                    ▼
  copilot --acp         External Bridges
  (內建,不變)           (獨立進程)
```

### 3.2 核心元件

#### Provider Registry

```typescript
interface ProviderConfig {
  id: string;           // e.g. 'copilot', 'codex', 'ollama'
  name: string;         // 顯示名稱
  type: 'internal' | 'external';
  endpoint?: string;    // external: http://localhost:PORT
  models: string[];     // 可用模型列表
  enabled: boolean;
  features: {
    streaming: boolean;
    images: boolean;
    tools: boolean;
    permissions: boolean;
  };
}
```

#### Provider Interface (Internal)

```typescript
interface IProvider {
  readonly id: string;
  readonly name: string;

  // Lifecycle
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  getHealth(): Promise<{ status: 'ok' | 'error'; message?: string }>;

  // Models
  listModels(): Promise<string[]>;

  // Chat
  sendPrompt(
    sessionId: string,
    prompt: string,
    onUpdate?: (update: ProviderUpdate) => void,
    images?: Array<{ mimeType: string; data: string }>,
    timeoutMs?: number
  ): Promise<{ sessionId: string; content: string }>;

  // Session
  createSession(config: SessionConfig): Promise<{ sessionId: string }>;
  deleteSession(sessionId: string): Promise<void>;
  listSessions(): Promise<Array<{ sessionId: string }>>;
}

// 統一的更新事件格式
interface ProviderUpdate {
  type: 'delta' | 'tool' | 'permission' | 'error' | 'done';
  content?: string;
  tool?: { name: string; status: string; result?: any };
  permission?: PendingPermission;
  error?: string;
}
```

#### Provider Router

```typescript
class ProviderRouter {
  private registry: Map<string, ProviderConfig>;
  private internalProviders: Map<string, IProvider>;

  // 根據 model 名稱路由到對應 Provider
  resolveProvider(model?: string): { provider: IProvider | string; config: ProviderConfig };

  // 根據 providerId 直接路由
  getProvider(providerId: string): IProvider | string;
}
```

### 3.3 路由策略

```
請求帶 model 參數
    │
    ├─ model 在 Copilot models 中 → Copilot Provider (internal)
    ├─ model 在 Codex models 中   → Proxy to localhost:31032
    ├─ model 在 Ollama models 中  → Proxy to localhost:31033
    └─ model 未知                 → 回傳錯誤 + 可用模型列表
```

### 3.4 Provider 組態檔

`~/.sidepilot/providers.json`：

```json
{
  "version": 1,
  "providers": [
    {
      "id": "copilot",
      "name": "GitHub Copilot",
      "type": "internal",
      "enabled": true,
      "models": ["gpt-4.1", "gpt-5", "claude-sonnet-4.5"],
      "features": {
        "streaming": true,
        "images": true,
        "tools": true,
        "permissions": true
      }
    },
    {
      "id": "codex",
      "name": "Codex CLI",
      "type": "external",
      "endpoint": "http://localhost:31032",
      "enabled": false,
      "models": [],
      "features": {
        "streaming": true,
        "images": false,
        "tools": true,
        "permissions": false
      }
    },
    {
      "id": "ollama",
      "name": "Ollama (Local)",
      "type": "external",
      "endpoint": "http://localhost:31033",
      "enabled": false,
      "models": [],
      "features": {
        "streaming": true,
        "images": true,
        "tools": false,
        "permissions": false
      }
    }
  ]
}
```

---

## 4. Provider API 契約

所有 Provider（internal 或 external bridge）必須實作以下 4 個端點：

### 4.1 `GET /api/health`

```json
// Response
{
  "status": "ok",
  "service": "sidepilot-codex-bridge",  // 識別服務
  "provider": "codex",                   // provider ID
  "version": "0.1.0"
}
```

### 4.2 `GET /api/models`

```json
// Response
{
  "success": true,
  "models": ["codex-mini", "codex-full"],
  "default": "codex-mini"
}
```

### 4.3 `POST /api/chat` (SSE Streaming)

```
// Request Body
{
  "sessionId": "optional-session-id",
  "prompt": "Hello, world",
  "model": "codex-mini",
  "images": [{ "mimeType": "image/png", "data": "base64..." }]  // optional
}

// Response: text/event-stream
event: delta
data: {"content": "Hello"}

event: delta
data: {"content": "! How can I help?"}

event: tool
data: {"name": "read_file", "status": "start"}

event: tool
data: {"name": "read_file", "status": "done", "result": {...}}

event: message
data: {"content": "Hello! How can I help?"}

event: done
data: {}
```

### 4.4 `POST /api/chat/sync` (Non-streaming)

```json
// Request Body (same as /api/chat)

// Response
{
  "success": true,
  "sessionId": "session-123",
  "content": "Hello! How can I help?"
}
```

### 4.5 事件格式規範

| SSE Event | 用途 | data 結構 |
|-----------|------|-----------|
| `delta` | 文字增量 | `{ content: string }` |
| `tool` | 工具執行 | `{ name: string, status: 'start'\|'update'\|'done', result?: any }` |
| `permission` | 權限請求 | `{ id, scope, reason, options }` |
| `message` | 最終完整回應 | `{ content: string }` |
| `error` | 錯誤 | `{ message: string }` |
| `done` | 串流結束 | `{}` |

> **關鍵原則：** 外部 Bridge 負責將其 CLI 的原生事件轉換為上述統一格式。Gateway 不做事件轉換，只做 proxy。

---

## 5. 耦合分析與改動清單

### Phase 1: Gateway 骨架 (不改動 Copilot Bridge)

| 改動 | 影響範圍 | 說明 |
|------|----------|------|
| 新增 `provider-registry.ts` | 新檔案 | Provider 組態管理 |
| 新增 `provider-router.ts` | 新檔案 | 模型→Provider 路由 |
| 修改 `server.ts` | 低 | `/api/chat` 路由前加 Router 分流 |
| 修改 `sdk-client.js` | 低 | `listModels()` 合併多 Provider |
| 新增 `GET /api/providers` | 新 route | 前端列出可用 Provider |

### Phase 2: External Bridge Proxy

| 改動 | 影響範圍 | 說明 |
|------|----------|------|
| 新增 `external-proxy.ts` | 新檔案 | HTTP proxy for external bridges |
| 修改 `provider-router.ts` | 低 | 加入 external routing 邏輯 |
| 新增前端 Provider Selector | UI | 下拉選單切換 Provider |

### Phase 3: 範例 External Bridge (Codex)

| 改動 | 影響範圍 | 說明 |
|------|----------|------|
| 新增 `bridges/codex/` | 獨立專案 | Codex CLI bridge 實作 |
| 新增 Provider 組態 | 設定檔 | `~/.sidepilot/providers.json` |

---

## 6. 外部 Bridge 規格

### 6.1 Codex CLI Bridge 範例結構

```
bridges/codex/
├── package.json
├── tsconfig.json
├── src/
│   ├── server.ts       # Express (port 31032)
│   ├── codex-adapter.ts # Codex CLI spawn + 事件轉換
│   └── models.ts       # Model 列表
└── README.md
```

### 6.2 事件轉換範例

```typescript
// codex-adapter.ts (概念)
class CodexAdapter {
  async sendPrompt(prompt: string, onUpdate: (update: ProviderUpdate) => void) {
    const child = spawn('codex', ['--full-auto', prompt]);

    child.stdout.on('data', (chunk) => {
      // Codex 原生輸出 → 統一 ProviderUpdate
      const text = chunk.toString();
      onUpdate({ type: 'delta', content: text });
    });

    child.on('close', () => {
      onUpdate({ type: 'done' });
    });
  }
}
```

### 6.3 Ollama Bridge 範例

```typescript
// ollama-adapter.ts (概念)
class OllamaAdapter {
  private baseUrl = 'http://localhost:11434';

  async listModels(): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/api/tags`);
    const data = await res.json();
    return data.models.map((m: any) => m.name);
  }

  async sendPrompt(prompt: string, model: string, onUpdate: (update: ProviderUpdate) => void) {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      }),
    });

    const reader = res.body!.getReader();
    // ... NDJson → ProviderUpdate 轉換
  }
}
```

---

## 7. 前端整合

### 7.1 sdk-client.js 修改

```javascript
// 新增: 列出所有 Provider
async function listProviders() {
  const response = await fetch(`${getBaseUrl()}/api/providers`);
  const data = await response.json();
  return data.providers; // [{ id, name, type, enabled, models, features }]
}

// 修改: listModels 合併多 Provider
async function listModels() {
  const providers = await listProviders();
  const allModels = [];
  for (const p of providers.filter(p => p.enabled)) {
    for (const m of p.models) {
      allModels.push({ model: m, provider: p.id, providerName: p.name });
    }
  }
  return allModels;
}
```

### 7.2 前端 UI — Provider 選擇器

模型下拉選單分組顯示：

```
┌─────────────────────────┐
│ GitHub Copilot           │
│   ├─ gpt-4.1            │
│   ├─ gpt-5              │
│   └─ claude-sonnet-4.5  │
│ Codex CLI                │
│   ├─ codex-mini          │
│   └─ codex-full          │
│ Ollama (Local)           │
│   ├─ llama3.3            │
│   └─ qwen3               │
└─────────────────────────┘
```

### 7.3 功能降級處理

不同 Provider 支援不同功能。前端需根據 `features` 欄位調整 UI：

| 功能 | 不支援時的處理 |
|------|---------------|
| `images` | 隱藏截圖按鈕 |
| `tools` | 隱藏工具執行狀態區塊 |
| `permissions` | 不監聽 `/api/permissions/stream` |
| `streaming` | 使用 `/api/chat/sync` 替代 |

---

## 8. 開發計畫

### Phase 1: Gateway 基礎 (~4h)

- [ ] **P1-1** 建立 `provider-registry.ts` — 組態載入與 CRUD
- [ ] **P1-2** 建立 `provider-router.ts` — 模型路由解析
- [ ] **P1-3** 建立 `IProvider` 介面定義
- [ ] **P1-4** 包裝現有 `SessionManager` 為 `CopilotProvider` (implements IProvider)
- [ ] **P1-5** `server.ts` 加入 Router 分流（`/api/chat` 前插入 Router）
- [ ] **P1-6** 新增 `GET /api/providers` 端點
- [ ] **P1-7** `sdk-client.js` 加入 `listProviders()` 函式
- [ ] **P1-8** 測試：現有功能不受影響（regression）

### Phase 2: External Proxy (~3h)

- [ ] **P2-1** 建立 `external-proxy.ts` — HTTP 反向代理
- [ ] **P2-2** Provider Router 整合 external proxy
- [ ] **P2-3** 健康檢查：定期 ping 外部 Bridge
- [ ] **P2-4** 前端：模型下拉選單分組顯示
- [ ] **P2-5** 前端：功能降級 UI 邏輯
- [ ] **P2-6** 端到端測試（mock external bridge）

### Phase 3: 範例 Bridge — Codex CLI (~3h)

- [ ] **P3-1** `bridges/codex/` 專案初始化
- [ ] **P3-2** Codex CLI adapter (spawn + 事件轉換)
- [ ] **P3-3** Express server (4 端點)
- [ ] **P3-4** 預設 `providers.json` 包含 Codex 設定
- [ ] **P3-5** 端到端測試（Extension → Gateway → Codex Bridge）
- [ ] **P3-6** README 文件

### Phase 4: 穩定化 & 文件 (~2h)

- [ ] **P4-1** Error handling: proxy timeout、Bridge crash 恢復
- [ ] **P4-2** Supervisor 擴展：管理外部 Bridge 進程生命週期
- [ ] **P4-3** 完整 API 文件
- [ ] **P4-4** Provider 開發者指南 (如何寫一個新 Bridge)

### 總估算

| Phase | 內容 | 風險 |
|-------|------|------|
| 1 | Gateway 骨架 + CopilotProvider 封裝 | 低（新程式碼，不改核心） |
| 2 | 外部代理 + UI 整合 | 低（新功能，降級安全） |
| 3 | Codex Bridge 範例 | 中（依賴 Codex CLI 穩定性） |
| 4 | 穩定化 | 低 |

---

## 9. 風險與對策

### 9.1 技術風險

| 風險 | 機率 | 影響 | 對策 |
|------|------|------|------|
| Copilot Bridge 重構影響穩定性 | 低 | 高 | CopilotProvider 只是 wrapper，不改內部邏輯 |
| 外部 Bridge crash | 中 | 中 | Gateway 健康檢查 + 自動停用失效 Provider |
| SSE 事件格式不一致 | 中 | 中 | Provider API 契約嚴格定義 + 驗證中間層 |
| Port 衝突 | 低 | 低 | 組態檔可調整 + 啟動時檢測 |
| Codex CLI API 變動 | 中 | 中 | Adapter 層隔離，只改 adapter 不影響 Gateway |

### 9.2 設計原則

1. **零改動原則**：Copilot Bridge 內部邏輯不做任何修改
2. **契約優先**：先定義 Provider API 契約，再實作
3. **降級安全**：外部 Bridge 不可用時，不影響 Copilot 功能
4. **漸進交付**：每個 Phase 獨立可交付，可隨時暫停

### 9.3 未來擴展

- **MCP Server 整合**：Gateway 可同時管理 MCP Server 連線
- **多模型並行**：同一個 prompt 發給多個 Provider，比較回應
- **Provider Marketplace**：社群開發的 Bridge 可透過組態一鍵整合
- **雲端 Provider**：直接呼叫 OpenAI API / Anthropic API（無需本地 CLI）

---

## 附錄 A：現有 Bridge 完整 API 映射

| 現有端點 | Gateway 處理方式 |
|----------|-----------------|
| `GET /health` | Gateway 直接回應（合併所有 Provider 狀態） |
| `GET /api/models` | 合併所有 enabled Provider 的 models |
| `POST /api/sessions` | 路由到對應 Provider |
| `GET /api/sessions` | 聚合所有 Provider 的 sessions |
| `DELETE /api/sessions/:id` | 路由到對應 Provider |
| `POST /api/chat` | 路由到對應 Provider（依 model 或 providerId） |
| `POST /api/chat/sync` | 同上 |
| `GET /api/logs` | 維持不變（Bridge 層級） |
| `GET /api/history` | 維持不變（Gateway 層級，所有 Provider 共用） |
| `GET/POST /api/permissions` | 僅 Copilot Provider 使用 |
| `GET/POST /api/prompt/strategy` | Gateway 層級，所有 Provider 共用 |
| `GET /api/providers` | **新增** — 列出所有已註冊 Provider |

---

## 附錄 B：Provider 開發快速指南

建立一個新的外部 Bridge 只需 3 步：

### Step 1: 建立 Express Server

```bash
mkdir bridges/my-provider && cd bridges/my-provider
npm init -y && npm i express cors
```

### Step 2: 實作 4 個端點

```javascript
import express from 'express';
const app = express();
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ status: 'ok', provider: 'my-provider' }));
app.get('/api/models', (_, res) => res.json({ success: true, models: ['my-model-v1'] }));
app.post('/api/chat', (req, res) => { /* SSE streaming */ });
app.post('/api/chat/sync', (req, res) => { /* sync response */ });

app.listen(31099);
```

### Step 3: 註冊到 providers.json

```json
{
  "id": "my-provider",
  "type": "external",
  "endpoint": "http://localhost:31099",
  "enabled": true,
  "models": ["my-model-v1"]
}
```

啟動後 Gateway 會自動探測並整合。
