# GitHub Copilot Proxy Server Setup

## 快速開始

### 1. 安裝依賴套件

```powershell
cd C:\Dev\Projects\SidePilot\scripts\github-copilot-proxy
npm install
```

### 2. 取得 GitHub Copilot Token

> **重要**: 您需要有效的 GitHub Copilot 訂閱才能執行此步驟。

> **認證方式說明**：GitHub Copilot 官方支援兩種認證方式：
>
> 1. **OAuth Device Flow**（推薦）：安全、穩定，token 有效期較長
> 2. **Session Token**：從瀏覽器提取，較不穩定且 token 會過期（1-8 小時）

#### 方式 A：OAuth Device Flow（推薦）

使用 GitHub CLI 進行 OAuth 認證：

```powershell
# 1. 安裝 GitHub CLI (如果尚未安裝)
# 下載: https://cli.github.com/
winget install GitHub.cli

# 2. 使用 GitHub CLI 登入
gh auth login
# 選擇: GitHub.com → HTTPS → Yes (authenticate Git) → Login with a web browser
# 會開啟瀏覽器進行 OAuth Device Flow

# 3. 取得 Copilot Token
# 方法 1: 透過 API (需要有 Copilot 權限)
gh api /copilot_internal/v2/token --jq '.token'

# 方法 2: 從 gh CLI session 提取 (需額外工具)
# 您的 gh auth token 可透過以下方式取得：
gh auth token
# 注意：這是 GitHub PAT，不是 Copilot Token
# Copilot Token 需要透過 API 端點取得 (方法 1)
```

**取得 Copilot Token 的完整步驟：**

```powershell
# 確認已登入 GitHub CLI
gh auth status

# 取得 Copilot Token (需要 copilot scope)
$token = gh api /copilot_internal/v2/token --jq '.token'
echo "COPILOT_TOKEN=$token" > .env
echo "PORT=3000" >> .env
```

#### 方式 B：從瀏覽器提取 Session Token（備用，不建議）

> ⚠️ **警告**：此 token 會在 1-8 小時後過期，需要重新提取。僅建議用於測試。

1. 在 Chrome 中開啟 [https://github.com/copilot](https://github.com/copilot)
2. 按 `F12` 打開開發者工具
3. 切換到 **Network** 標籤
4. 在 Copilot 介面中發送一條訊息
5. 在 Network 中搜尋 `completions` 或 `copilot`
6. 點擊該請求，查看 **Headers**
7. 在 **Request Headers** 中找到 `Authorization: Bearer ghu_xxxxx...`
8. 複製 `ghu_` 開頭的完整 token

### 3. 配置環境變數

在 `scripts/github-copilot-proxy/` 目錄下建立 `.env` 檔案：

```bash
COPILOT_TOKEN=ghu_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PORT=3000
```

> **注意**: `.env` 已被列入 `.gitignore`，不會被提交到 Git。

### 4. 啟動 Proxy Server

#### 開發模式（自動重新載入）

```powershell
npm run dev
```

#### 生產模式

```powershell
npm run build
npm start
```

### 5. 驗證 Server 是否正常運作

開啟新的 PowerShell 視窗：

```powershell
# 健康檢查
curl http://localhost:3000/health

# 預期輸出：
# {"status":"ok","service":"github-copilot-proxy"}

# 測試 Chat API (需要有效的 token)
curl -X POST http://localhost:3000/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'
```

---

## API 規格

### 端點：`POST /v1/chat/completions`

符合 OpenAI Chat Completions API 規格：

**Request Body:**

```json
{
  "model": "gpt-4",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello!" }
  ],
  "stream": false,
  "temperature": 0.7,
  "max_tokens": 500
}
```

**Response (非串流):**

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1704672000,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ]
}
```

**Response (串流):**

Server-Sent Events (SSE) 格式，每個 chunk：

```
data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1704672000,"model":"gpt-4","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: [DONE]
```

---

## 整合到 SidePilot Extension

### SDK 模式自動偵測

當 Proxy Server 在 `localhost:3000` 運作時，SidePilot 會自動偵測並切換到 SDK 模式：

1. `mode-manager.js` 每 30 秒檢查 `http://localhost:3000/health`
2. 若偵測成功，Mode badge 顯示 **SDK**（綠色）
3. 若失敗，自動 fallback 到 **iframe** 模式（藍色）

### 未來開發：SDK Chat UI (Phase 2)

目前 SDK 模式尚未實作自建 Chat UI，規劃內容：

- **P2-2**: 建立 SDK Chat UI（取代 iframe）
- **P2-3**: 多輪對話上下文管理
- **P2-4**: 手動模式切換開關

---

## 已知限制

### Q: 瀏覽器自動化測試

**狀態**: 內建 Playwright 因環境問題無法啟動，但可使用 `C:\Dev\chrome-headless-shell-win64` 進行 headless Chrome 自動化測試（需額外配置 Puppeteer）。

### Q: Token 有效期限

- **OAuth Device Flow Token**: 較長效，通常數天至數週
- **Session Token**: 1-8 小時後過期，需要重新提取

建議使用 OAuth 方式以獲得更穩定的使用體驗。

### Q: Server 無法啟動，報錯 `COPILOT_TOKEN` 未設定

**A**: 確認 `.env` 檔案存在且內容正確：

```bash
cat .env  # Windows: type .env
# 應顯示 COPILOT_TOKEN=ghu_...
```

### Q: 健康檢查正常，但 Chat API 回應 401

**A**: Token 可能已過期。GitHub Copilot Token 有效期約為 1-8 小時，需要重新取得。

### Q: Mode badge 一直顯示 iframe，沒有切換到 SDK

**A**: 檢查：

1. Proxy Server 是否在 port 3000 運作
2. Chrome Console 是否有 CORS 錯誤（應該沒有，server 已設定 CORS）
3. 重新載入 SidePilot extension (`chrome://extensions/`)

---

## 開發筆記

### 為什麼選擇 Port 3000？

- 原始設計使用 `4321`（見舊版 `mode-manager.js`）
- **Phase 1 已統一為 `3000`**，因為：
  - `server.ts` 預設 `PORT=3000`
  - 避免與其他常見開發工具衝突（Vite 通常用 5173、Next.js 用 3000）
  - 延續 GitHub Copilot Proxy 專案的預設配置

### 安全考量

- **不要公開暴露 Proxy Server**：僅在 `localhost` 使用
- **Token 管理**：`.env` 已加入 `.gitignore`，但仍需注意不要將 token 明文儲存在其他地方
- **多使用者環境**：目前設計為單使用者本地使用，若需多使用者需額外實作 token 池管理

---

_最後更新: 2026-02-11_
