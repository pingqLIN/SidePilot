# GitHub Copilot Proxy for Antigravity

此專案是一個本地 Proxy Server，用於將 Google Antigravity IDE (或任何支援 OpenAI API 格式的編輯器) 連接到 GitHub Copilot API。

## 功能

- **API 轉換**: 將 OpenAI Chat格式 (`/v1/chat/completions`) 轉換為 GitHub Copilot 格式。
- **串流支援**: 完整支援 SSE (Server-Sent Events) 串流回應。
- **認證管理**: 透過環境變數或請求標頭傳遞 GitHub Copilot Token。

## 安裝

1. 安裝依賴:

   ```bash
   npm install
   ```

2. 建置專案:

   ```bash
   npm run build
   ```

## 設定

複製 `.env.example` 到 `.env` 並填入您的 GitHub Copilot Token:

```bash
cp .env.example .env
```

在 `.env` 中:

```env
COPILOT_TOKEN=ghu_xxxxxxxxxxxx  # 您的 GitHub Copilot Token
PORT=3000
```

## 啟動

開發模式:

```bash
npm run dev
```

生產模式:

```bash
npm start
```

## 在 Antigravity 中使用

在 Antigravity 的模型設定中，新增一個自定義 OpenAI 提供者:

- **Base URL**: `http://localhost:3000/v1`
- **Model**: `gpt-4` (或任意名稱，Proxy 會轉發給 Copilot)
- **API Key**: 任意值 (如果已在 .env 設定 Token) 或您的 Copilot Token
