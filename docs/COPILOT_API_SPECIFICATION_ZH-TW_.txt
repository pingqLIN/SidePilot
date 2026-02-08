# GitHub Copilot Proxy 輸出規格文案
## 供 Google Antigravity IDE 整合參考

**版本**:  1.0  
**更新日期**: 2026-01-19  
**來源專案**: [BjornMelin/github-copilot-proxy](https://github.com/BjornMelin/github-copilot-proxy)

---

## 📋 文件概覽

本文件詳細說明 **github-copilot-proxy** 與 GitHub Copilot API 之間的資料交換格式，包含請求結構、回應格式、串流輸出規格，以便於移植至 Google Antigravity IDE。

---

## 🔐 1. 認證機制

### 1.1 Token 結構

```typescript
// GitHub Copilot Token 結構
interface CopilotToken {
  token: string;           // JWT Bearer Token
  expires_at: number;      // Unix timestamp (秒)
  refresh_in:  number;      // 建議刷新時間 (秒)
  chat_enabled: boolean;   // 是否啟用聊天功能
  sku:  string;             // 訂閱方案識別碼
  telemetry:  string;       // 遙測配置
  tracking_id: string;     // 追蹤識別碼
}
```

### 1.2 Token 取得端點

| 項目 | 值 |
|------|-----|
| **端點 URL** | `https://api.github.com/copilot_internal/v2/token` |
| **方法** | `GET` |
| **認證** | `Authorization: token {github_oauth_token}` |

### 1.3 必要請求標頭

```http
Authorization: token {github_oauth_token}
Editor-Version:  Cursor-IDE/1.0.0
Editor-Plugin-Version: copilot-cursor/1.0.0
```

---

## 📤 2. Copilot Completions API 輸入格式

### 2.1 端點資訊

| 項目 | 值 |
|------|-----|
| **端點 URL** | `https://copilot-proxy.githubusercontent.com/v1/engines/copilot-codex/completions` |
| **方法** | `POST` |
| **Content-Type** | `application/json` |

### 2.2 請求標頭 (Headers)

```http
Content-Type: application/json
Authorization: Bearer {copilot_token}
X-Request-Id: {uuid-v4}
Machine-Id: {machine_identifier}
User-Agent: GitHubCopilotChat/0.12.0
Editor-Version: Cursor-IDE/1.0.0
Editor-Plugin-Version: copilot-cursor/1.0.0
Openai-Organization: github-copilot
Openai-Intent:  copilot-ghost
```

### 2.3 請求主體 (Request Body)

```typescript
interface CopilotCompletionRequest {
  prompt: string;          // 轉換後的提示文字
  suffix:  string;          // 後綴文字 (聊天模式通常為空)
  max_tokens: number;      // 最大 Token 數量 (預設:  500)
  temperature: number;     // 溫度參數 (預設: 0.7)
  top_p: number;           // Top-P 採樣 (預設: 1)
  n: number;               // 回應數量 (預設: 1)
  stream: boolean;         // 是否啟用串流
  stop: string[];          // 停止序列 (預設: ["\n\n"])
  extra:  {
    language:  string;           // 程式語言識別 (如 "typescript")
    next_indent: number;        // 下一行縮排層級 (預設: 0)
    trim_by_indentation: boolean; // 依縮排修剪 (預設: true)
  }
}
```

### 2.4 範例請求

```json
{
  "prompt": "User: 請幫我寫一個 TypeScript 函數來計算費波那契數列\n\nAssistant: ",
  "suffix": "",
  "max_tokens": 500,
  "temperature": 0.7,
  "top_p": 1,
  "n": 1,
  "stream": true,
  "stop": ["\n\n"],
  "extra": {
    "language": "typescript",
    "next_indent": 0,
    "trim_by_indentation": true
  }
}
```

---

## 📥 3. Copilot API 輸出格式 (非串流)

### 3.1 回應結構

```typescript
interface CopilotCompletionResponse {
  id:  string;              // 回應識別碼
  object: string;          // 物件類型 (如 "text_completion")
  created: number;         // 建立時間 (Unix timestamp)
  model: string;           // 模型名稱
  choices: CopilotCompletionChoice[];
  usage?:  {
    prompt_tokens: number;      // 提示 Token 數
    completion_tokens: number;  // 完成 Token 數
    total_tokens: number;       // 總 Token 數
  }
}

interface CopilotCompletionChoice {
  text: string;            // ⭐ 生成的文字內容
  index: number;           // 選項索引
  logprobs:  null;          // 對數機率 (通常為 null)
  finish_reason: string | null;  // 結束原因 ("stop" | "length" | null)
}
```

### 3.2 範例回應

```json
{
  "id": "cmpl-abc123",
  "object": "text_completion",
  "created": 1704672000,
  "model": "copilot-codex",
  "choices": [
    {
      "text": "function fibonacci(n:  number): number {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}",
      "index": 0,
      "logprobs":  null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens":  48,
    "total_tokens":  73
  }
}
```

---

## 🌊 4. Copilot API 串流輸出格式 (Server-Sent Events)

### 4.1 串流事件格式

```
data: {"choices":[{"text":"function","index":0,"logprobs": null,"finish_reason": null}]}

data: {"choices":[{"text":" fibonacci","index":0,"logprobs": null,"finish_reason": null}]}

data: {"choices":[{"text":"(n:  number)","index":0,"logprobs":null,"finish_reason": null}]}

data: [DONE]
```

### 4.2 單一串流事件結構

```typescript
interface CopilotStreamChunk {
  choices: [{
    text: string;              // ⭐ 增量文字片段
    index: number;
    logprobs: null;
    finish_reason: string | null;
  }]
}
```

### 4.3 重要說明

| 項目 | 說明 |
|------|------|
| **協定** | Server-Sent Events (SSE) |
| **Content-Type** | `text/event-stream` |
| **結束標記** | `data: [DONE]` |
| **每個區塊** | 以 `data: ` 開頭，後接 JSON |

---

## 🔄 5. 格式轉換對照表

### 5.1 OpenAI ↔ Copilot 訊息格式轉換

| OpenAI 格式 | Copilot Prompt 格式 |
|-------------|---------------------|
| `{"role": "system", "content": "... "}` | 直接加入提示開頭 |
| `{"role": "user", "content": "..."}` | `User: {content}\n\n` |
| `{"role": "assistant", "content": "... "}` | `Assistant: {content}\n\n` |

### 5.2 轉換邏輯程式碼

```typescript
function convertMessagesToCopilotPrompt(messages: OpenAIMessage[]): string {
  let systemPrompt = '';
  let userPrompts = '';
  let assistantResponses = '';
  
  for (const message of messages) {
    switch (message.role) {
      case 'system':
        systemPrompt += message.content + '\n\n';
        break;
      case 'user':
        userPrompts += 'User: ' + message.content + '\n\n';
        break;
      case 'assistant':
        assistantResponses += 'Assistant: ' + message. content + '\n\n';
        break;
    }
  }
  
  const lastMessage = messages[messages.length - 1];
  const needsAssistantPrompt = lastMessage.role !== 'user';
  
  return systemPrompt + userPrompts + assistantResponses + 
         (needsAssistantPrompt ? '' : 'Assistant: ');
}
```

---

## 🔃 6. Proxy 輸出格式 (OpenAI 相容)

### 6.1 非串流回應

```typescript
interface OpenAICompletion {
  id: string;                    // 格式: "chatcmpl-{uuid}"
  object: "chat.completion";
  created: number;               // Unix timestamp (秒)
  model: string;                 // 如 "gpt-4"
  choices:  [{
    index: number;
    message: {
      role: "assistant";
      content: string;           // ⭐ 來自 Copilot choices[]. text
    };
    finish_reason: string;       // "stop" | "length"
  }];
  usage?:  {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }
}
```

### 6.2 串流回應 (SSE Chunk)

```typescript
interface OpenAIStreamChunk {
  id: string;                    // 格式: "chatcmpl-{uuid}"
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: [{
    index: number;
    delta: {
      content: string;           // ⭐ 來自 Copilot choices[].text
    };
    finish_reason: string | null;
  }]
}
```

---

## 📊 7. 資料流程圖

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        資料流程概覽                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    OpenAI 格式     ┌──────────────────┐    Copilot 格式
│   Client     │ ─────────────────► │  Proxy Server    │ ─────────────────►
│ (Antigravity)│   POST /v1/chat/   │ (github-copilot- │   POST /v1/engines/
│              │   completions      │      proxy)      │   copilot-codex/
└──────────────┘                    └──────────────────┘   completions
       ▲                                    │                    │
       │                                    │                    ▼
       │                                    │           ┌────────────────┐
       │         OpenAI 格式                │           │ GitHub Copilot │
       │◄───────────────────────────────────┤◄──────────│      API       │
       │     chat. completion 或             │  Copilot  └────────────────┘
       │     chat.completion.chunk          │  格式回應
       │                                    │
```

---

## 🎯 8. Antigravity 整合建議

### 8.1 作為自定義模型提供者

```typescript
// Antigravity 配置範例 (概念性)
const copilotProvider = {
  name: "github-copilot",
  baseUrl: "http://localhost:3000/v1",  // Proxy 位址
  models: ["gpt-4", "gpt-4o", "gpt-3.5-turbo"],
  headers: {
    "Authorization": "Bearer ${PROXY_API_KEY}"  // 如需額外認證
  },
  capabilities: {
    chat: true,
    streaming: true,
    functionCalling: false  // Copilot 不原生支援
  }
};
```

### 8.2 關鍵整合點

| 整合項目 | 說明 |
|----------|------|
| **端點** | `/v1/chat/completions` (OpenAI 相容) |
| **認證** | OAuth Device Flow 預先完成 |
| **串流** | 標準 SSE 格式 |
| **模型名稱** | `gpt-4`, `gpt-4o`, `gpt-3.5-turbo` |

### 8.3 整合步驟建議

1. **階段一：外部服務模式**
   - 啟動 github-copilot-proxy 作為獨立服務
   - 在 Antigravity 中配置為自定義 OpenAI 端點
   - 驗證基本功能（聊天、程式碼補全）

2. **階段二：深度整合**
   - 研究 Antigravity 的擴展 API
   - 將認證流程整合至 Antigravity UI
   - 實作原生的模型選擇器

3. **階段三：最佳化**
   - 實作多使用者 Token 管理
   - 加入使用量追蹤儀表板
   - 優化串流效能

---

## 📁 9. 源碼參考

| 檔案 | 說明 | 連結 |
|------|------|------|
| `src/routes/openai. ts` | API 路由與串流處理 | [查看](https://github.com/BjornMelin/github-copilot-proxy/blob/main/src/routes/openai.ts) |
| `src/services/copilot-service.ts` | Copilot API 呼叫邏輯 | [查看](https://github.com/BjornMelin/github-copilot-proxy/blob/main/src/services/copilot-service.ts) |
| `src/services/auth-service.ts` | OAuth 認證服務 | [查看](https://github.com/BjornMelin/github-copilot-proxy/blob/main/src/services/auth-service.ts) |
| `src/types/openai.ts` | OpenAI 型別定義 | [查看](https://github.com/BjornMelin/github-copilot-proxy/blob/main/src/types/openai. ts) |
| `src/types/github.ts` | GitHub/Copilot 型別定義 | [查看](https://github.com/BjornMelin/github-copilot-proxy/blob/main/src/types/github.ts) |
| `src/config/index.ts` | 配置與端點定義 | [查看](https://github.com/BjornMelin/github-copilot-proxy/blob/main/src/config/index.ts) |

---

## 🔍 10. 關鍵實作細節

### 10.1 串流處理邏輯

在 `src/routes/openai.ts` 中的串流處理 (第 210-248 行)：

```typescript
onmessage(msg) {
  if (msg.data === '[DONE]') {
    res.write('data: [DONE]\n\n');
    return;
  }
  
  try {
    // 解析 Copilot 回應
    const data = JSON.parse(msg.data);
    
    // 轉換為 OpenAI 格式
    const openAiFormatted = {
      id: `chatcmpl-${uuidv4()}`,
      object: 'chat.completion. chunk',
      created: Math. floor(Date.now() / 1000),
      model,
      choices: [{
        index: 0,
        delta: {
          content: data. choices[0].text  // ⭐ 關鍵欄位
        },
        finish_reason: data. choices[0].finish_reason || null
      }]
    };
    
    res.write(`data: ${JSON.stringify(openAiFormatted)}\n\n`);
  } catch (error) {
    logger.error('Error parsing stream message:', error);
  }
}
```

### 10.2 語言偵測機制

`src/services/copilot-service.ts` 中的語言偵測 (第 57-99 行)：

```typescript
export function detectLanguageFromMessages(messages: OpenAIMessage[]): string {
  const lastUserMessage = [... messages].reverse().find(m => m.role === 'user');
  if (!lastUserMessage?. content) return 'javascript';
  
  const content = lastUserMessage.content;
  
  // 檢查 Markdown 程式碼區塊
  const codeBlockMatch = content.match(/```(\w+)/);
  if (codeBlockMatch? .[1]) {
    return codeBlockMatch[1]. toLowerCase();
  }
  
  // 檢查副檔名
  const fileExtensionMatch = content.match(/\.([a-zA-Z0-9]+)(?:\s|"|')/);
  if (fileExtensionMatch?.[1]) {
    const ext = fileExtensionMatch[1].toLowerCase();
    const extToLang = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      // ...  更多對照
    };
    return extToLang[ext] || 'javascript';
  }
  
  return 'javascript';
}
```

---

## ⚠️ 11. 已知限制與注意事項

### 11.1 功能限制

| 項目 | 說明 |
|------|------|
| **Function Calling** | Copilot API 不支援 OpenAI 的 function calling |
| **Vision** | 不支援圖像輸入 |
| **多輪對話** | 需透過 prompt 轉換維持上下文 |
| **Token 計數** | 串流模式下使用估算值 (字元數 ÷ 4) |

### 11.2 安全建議

- 🔒 不要在公開網路暴露 proxy 端點
- 🔑 妥善保管 GitHub OAuth token
- 📊 實作請求速率限制
- 🚫 避免記錄敏感的使用者輸入

---

## 📖 12. 附錄：完整型別定義

### OpenAI 格式

```typescript
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string | null;
  name?: string;
  function_call?: {
    name:  string;
    arguments: string;
  };
}

interface OpenAICompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?:  number;
  top_p?:  number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
}
```

### GitHub Copilot 格式

```typescript
interface CopilotToken {
  token: string;
  expires_at: number;
  refresh_in: number;
  chat_enabled: boolean;
  sku: string;
  telemetry: string;
  tracking_id: string;
}

interface CopilotCompletionChoice {
  text: string;
  index: number;
  logprobs: null;
  finish_reason: string | null;
}

interface CopilotCompletionResponse {
  id:  string;
  object: string;
  created: number;
  model: string;
  choices:  CopilotCompletionChoice[];
  usage?:  {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }
}
```

---

## 📞 支援與回饋

- **原始專案**:  [BjornMelin/github-copilot-proxy](https://github.com/BjornMelin/github-copilot-proxy)
- **授權**:  MIT License
- **問題回報**: 請至原專案 Issues 頁面

---

**文件結束**