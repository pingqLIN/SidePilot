<p align="center">
  <img src="docs/banner.png" width="1000" alt="SidePilot 橫幅">
</p>

<h1 align="center">SidePilot</h1>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/Version-1.0.0-blue?style=flat-square">
  <img alt="Chrome" src="https://img.shields.io/badge/Chrome-114+-4285F4?style=flat-square&logo=google-chrome&logoColor=white">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Manifest-V3-34a853?style=flat-square">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square">
</p>

<p align="center">
  <b>GitHub Copilot，隨時在你身邊 — 瀏覽器側邊欄的持久 AI 助手。</b>
</p>

<p align="center">
  <a href="#-螢幕截圖">螢幕截圖</a> &bull;
  <a href="#-功能特色">功能特色</a> &bull;
  <a href="#-快速開始">快速開始</a> &bull;
  <a href="#-使用指南">使用指南</a> &bull;
  <a href="#%EF%B8%8F-設定">設定</a> &bull;
  <a href="#-api-參考">API 參考</a> &bull;
  <a href="#-安全設置">安全設置</a> &bull;
  <a href="#-常見問題">常見問題</a>
</p>

<p align="center">
  <a href="README.md">English</a>
</p>

---

## ✨ 螢幕截圖

<table>
  <tr>
    <td align="center"><b>iframe 模式</b><br><img src="docs/screenshots/iframe-mode.png" height="340" alt="iframe 模式"></td>
    <td align="center"><b>SDK 模式</b><br><img src="docs/screenshots/sdk-chat.png" height="340" alt="SDK 模式對話"></td>
  </tr>
</table>

<details>
<summary><b>更多螢幕截圖</b></summary>
<br>

| 功能 | 螢幕截圖 |
|------|----------|
| **規則分頁** — 管理行為指示並與 GitHub 搭配使用 | <img src="docs/screenshots/rules-tab.png" height="200" alt="規則分頁"> |
| **設定面板** — 可折疊的區塊，方便存取所有設定 | <img src="docs/screenshots/settings-panel.png" height="200" alt="設定面板"> |
| **SDK 設定** — 記憶庫／規則注入、儲存路徑 | <img src="docs/screenshots/settings-sdk.png" height="200" alt="SDK 設定"> |
| **頁面擷取（文字）** — 擷取頁面內容至對話 | <img src="docs/screenshots/page-capture-text.png" height="200" alt="頁面擷取文字"> |
| **頁面擷取（截圖）** — 局部截圖擷取 | <img src="docs/screenshots/page-capture-screenshot.png" height="200" alt="頁面擷取截圖"> |
| **SDK + 上下文** — 在 SDK 模式中使用擷取的頁面上下文 | <img src="docs/screenshots/sdk-context.png" height="200" alt="SDK 搭配上下文"> |

</details>

---

## ✨ 功能特色

- **雙模式架構** — iframe 模式使用網頁版 Copilot，SDK 模式使用官方 Copilot CLI Bridge
- **記憶庫** — 儲存任務、筆記、上下文與參考資料，支援狀態追蹤與搜尋
- **規則管理** — 定義行為指示，內建範本（Default、TypeScript、React）
- **頁面擷取** — 擷取頁面文字、全頁或局部截圖，搭配垂直浮動按鈕
- **連結守衛** — 以允許清單或拒絕清單控制 iframe 內的連結導航
- **設定同步** — 同步模型、主題、推理層級至 `~/.copilot/config.json`
- **上下文注入** — 在送出提示前自動注入記憶項目與規則（SDK 模式）
- **串流回應** — SDK 模式下透過 SSE 即時串流回應，支援工具執行

---

## 🚀 快速開始

### 1. 安裝擴充功能

1. 在 Chrome 中開啟 `chrome://extensions/`
2. 啟用右上角的**開發者模式**
3. 點擊**載入未封裝項目**
4. 選擇 `SidePilot/extension` 資料夾

### 2. 開啟側邊欄

| 平台 | 快捷鍵 |
|------|--------|
| Windows / Linux | `Alt + Shift + P` |
| macOS | `Opt + Shift + P` |

或者點擊工具列上的 SidePilot 擴充功能圖示。

### 3. 選擇你的模式

| 模式 | 設定方式 | 適合用途 |
|------|----------|----------|
| **iframe** | 無需設定 — 立即可用 | 快速存取 Copilot 網頁 UI |
| **SDK** | 需要 Bridge 伺服器（見下方說明） | 官方 API、串流、上下文注入 |

<details>
<summary><b>SDK 模式設定（Bridge 伺服器）</b></summary>

#### 前置需求

- 已安裝 **Node.js 18+**
- 已安裝並完成驗證的 **GitHub Copilot CLI**

```bash
# 確認 Copilot CLI 可用
copilot --version
```

#### 啟動 Bridge 伺服器

```bash
cd scripts/copilot-bridge
npm install
npm run dev          # 開發模式，支援熱重載
```

正式環境：

```bash
npm run build
npm start            # 以 Supervisor 啟動（自動重啟）
```

Bridge 伺服器執行於 `http://localhost:31031`。在側邊欄切換至 **SDK** 模式即可開始對話。

#### 首次 GitHub 登入

1. 在側邊欄切換至 SDK 模式
2. 登入指南會自動顯示
3. 點擊 **Open GitHub Login Page** 進行驗證
4. 驗證完成後，點擊 **Test Bridge Connection** 確認連線

</details>

---

## 📖 使用指南

> 如需所有功能的詳細操作說明，請參閱 **[docs/USAGE.zh-TW.md](docs/USAGE.zh-TW.md)**。

<details>
<summary><b>iframe 模式</b></summary>

#### 運作方式

iframe 模式將 GitHub Copilot 網頁介面直接嵌入側邊欄中，無需伺服器。

#### 使用 Copilot 對話

1. 開啟側邊欄並確認已選擇 **IFRAME** 模式
2. Copilot 網頁 UI 會載入面板中
3. 像平常一樣對話、使用代理（Task、Create Issue、Spark）並瀏覽工作階段
4. 頁面左側邊緣會出現浮動**擷取按鈕**，可用來擷取頁面內容

#### 連結守衛

在 iframe 內點擊的連結由連結守衛控制：

- **允許清單模式**（預設）— 僅符合允許清單的 URL 保留在 iframe 中；其餘在新分頁開啟
- **拒絕清單模式** — 符合拒絕清單的 URL 在新分頁開啟；其餘保留

在 **設定 > iframe 模式** 中配置網址規則。

> **注意：** iframe 模式透過 Chrome 的 Declarative Net Request API 移除 `X-Frame-Options` 和 CSP 標頭以啟用嵌入功能。

</details>

<details>
<summary><b>SDK 模式</b></summary>

#### 運作方式

SDK 模式透過本地 Bridge 伺服器，使用官方 `@github/copilot-sdk` 連接 GitHub Copilot。

```
Extension ←→ HTTP/SSE ←→ Bridge Server ←→ Copilot CLI (ACP)
```

#### 對話

1. 確認 Bridge 伺服器已啟動（`npm run dev`）
2. 在側邊欄切換至 **SDK** 模式
3. 從下拉選單選擇模型（例如 `gpt-5.2`）
4. 輸入訊息後點擊 **Send** 或按 Enter
5. 回應透過 Server-Sent Events 即時串流顯示

#### 上下文注入

在設定中啟用後，SidePilot 會自動在訊息前加入：

- **記憶項目** — 最多 5 筆最相關的項目（最多 3,600 字元）
- **規則** — 你的有效行為指示（最多 2,200 字元）

讓 Copilot 持續掌握你的專案上下文，無需重複說明。

#### 工作階段管理

- 每段對話是一個獨立的 Copilot CLI 工作階段
- 工作階段在第一則訊息時建立
- 對話匯出會儲存至設定的路徑（預設：`~/copilot/chat-exports/`）

</details>

<details>
<summary><b>記憶庫</b></summary>

#### 概述

記憶庫儲存結構化項目，跨工作階段持久保存。共有四種項目類型：

| 類型 | 圖示 | 權重 | 用途 |
|------|------|------|------|
| 任務 | `[T]` | 1 | 可追蹤的工作項目，附帶狀態 |
| 筆記 | `[N]` | 2 | 快速想法與觀察記錄 |
| 上下文 | `[C]` | 4 | 專案上下文與環境資訊 |
| 參考 | `[R]` | 3 | 連結、文件與外部資源 |

#### 建立項目

1. 前往**記憶**分頁
2. 點擊 **Add Entry**
3. 選擇類型、輸入內容、設定狀態（Pending / In Progress / Done）
4. 點擊 **Save**

#### 搜尋與篩選

- 使用搜尋欄位對所有項目進行全文搜尋
- 依類型（任務、筆記、上下文、參考）或狀態篩選
- 項目依權重排序，次依建立日期排序

#### VS Code 整合

點擊任何項目上的 VS Code 圖示，即可透過自訂 URI scheme（`vscode://` / `cursor://`）傳送至 VS Code。

</details>

<details>
<summary><b>規則管理</b></summary>

#### 概述

規則是長篇行為指示，傳送給 Copilot 以塑造其回應方式（僅限 SDK 模式）。

#### 內建範本

| 範本 | 說明 |
|------|------|
| Default | 通用程式設計助手指示 |
| TypeScript | TypeScript 專用慣例與最佳實踐 |
| React | React 元件模式與 Hooks 指南 |

#### 撰寫規則

1. 前往**規則**分頁
2. 選擇範本或從頭開始
3. 以 Markdown 格式撰寫指示
4. 點擊 **Save Rules**（最多 2,200 字元）

#### 匯入／匯出

- **匯出** — 下載規則為 `.md` 檔案
- **匯入** — 從 Markdown 檔案載入規則

</details>

<details>
<summary><b>頁面擷取</b></summary>

#### 浮動擷取按鈕

每個頁面左側邊緣都會出現一個垂直按鈕，提供以下功能：

| 動作 | 說明 |
|------|------|
| **文字內容** | 擷取完整頁面文字，保留結構 |
| **程式碼區塊** | 偵測並擷取頁面中的 Markdown 程式碼區塊 |
| **全頁截圖** | 擷取可見視窗範圍 |
| **局部截圖** | 選取區域進行擷取 |

#### 使用方式

1. 點擊浮動**擷取按鈕**（頁面左側邊緣）
2. 從彈出選單中選擇擷取類型
3. 擷取的內容會顯示在側邊欄中
4. 將內容拖曳或貼上至對話輸入框

#### 調整按鈕尺寸

前往 **設定 > 擷取**，調整按鈕寬度（1–128 px）。

</details>

---

## ⚙️ 設定

所有設定皆可從側邊欄的**設定**分頁存取。各區塊可折疊，方便瀏覽。

<details>
<summary><b>完整設定參考</b></summary>

### 引導與歡迎

| 設定項目 | 類型 | 說明 |
|----------|------|------|
| 每次開啟播放 | 開關 | 每次工作階段重播引導動畫 |
| 顯示警告 | 開關 | 啟動時顯示風險聲明 |

### Bridge 設定 (SDK)

| 設定項目 | 類型 | 說明 |
|----------|------|------|
| 健康檢查 | 按鈕 | 測試 Bridge 伺服器連線 |
| 複製啟動指令 | 按鈕 | 複製 `npm run dev` 指令 |
| 複製健康檢查 | 按鈕 | 複製 `curl localhost:31031/health` |

### SDK 模式

| 設定項目 | 類型 | 說明 |
|----------|------|------|
| 首次登入指南 | 開關 | 首次切換至 SDK 時顯示登入指南 |
| 在提示中包含記憶 | 開關 | 在訊息前自動注入記憶項目 |
| 在提示中包含規則 | 開關 | 在訊息前自動注入規則 |
| 顯示儲存位置 | 開關 | 在 UI 中顯示對話儲存路徑 |
| Session-state 路徑 | 文字 | 本地 `.copilot/session-state/` 目錄 |
| 對話匯出路徑 | 文字 | 對話匯出的目錄 |
| 截圖路徑 | 文字 | 已儲存截圖的目錄 |

### Copilot CLI 同步

| 設定項目 | 類型 | 選項 | 說明 |
|----------|------|------|------|
| 同步模型 | 開關 | — | 將選取的模型同步至 CLI 設定 |
| 同步主題 | 開關 | auto / dark / light | 同步色彩主題偏好 |
| 同步橫幅 | 開關 | always / once / never | 同步橫幅顯示頻率 |
| 同步推理層級 | 開關 | low / medium / high | 同步推理層級 |

### iframe 模式

| 設定項目 | 類型 | 說明 |
|----------|------|------|
| 連結守衛模式 | 選擇 | `allow`（允許清單）或 `deny`（拒絕清單） |
| URL 規則 | 文字區域 | 每行一個 URL 前綴 |

### 擷取

| 設定項目 | 類型 | 範圍 | 說明 |
|----------|------|------|------|
| 按鈕寬度 | 滑桿 | 1–128 px | 浮動擷取按鈕寬度 |

</details>

---

## 🔌 API 參考

Bridge 伺服器在 `http://localhost:31031` 上提供 REST + SSE API。

<details>
<summary><b>Bridge 伺服器端點</b></summary>

### 健康檢查

```bash
GET /health
```

```json
{
  "status": "ok",
  "service": "copilot-bridge",
  "sdk": "ready",
  "backend": "acp-cli"
}
```

### 模型

```bash
GET /api/models
```

回傳目前 Copilot 訂閱可用的 AI 模型。

### 工作階段

```bash
POST /api/sessions          # 建立新的對話工作階段
GET  /api/sessions          # 列出使用中的工作階段
DELETE /api/sessions/:id    # 終止工作階段
```

### 對話（串流）

```bash
POST /api/chat
Content-Type: application/json

{
  "sessionId": "abc-123",
  "message": "Explain this code"
}
```

回傳 Server-Sent Events 串流：

| 事件 | 內容 | 說明 |
|------|------|------|
| `delta` | `{ content }` | 文字片段更新 |
| `tool` | `{ name, status }` | 工具執行進度 |
| `message` | `{ content }` | 完整回應 |
| `error` | `{ message }` | 錯誤詳情 |
| `done` | `{}` | 串流結束 |

### 對話（同步）

```bash
POST /api/chat/sync
Content-Type: application/json

{
  "sessionId": "abc-123",
  "message": "Explain this code"
}
```

在完整回應完成後回傳 `{ success: true, content: "..." }`。

</details>

---

## 🔒 安全設置

> 本節內容特別適用於**自行架設或疊代開發** SidePilot 的情況。在將 Bridge 伺服器暴露於本機以外的環境前，請仔細閱讀每個主題。

<details>
<summary><b>開發安全確認清單</b></summary>

在任何共用或 CI 環境中執行 Bridge 伺服器前，請確認以下事項：

- [ ] 瞭解 Bridge 伺服器預設會綁定至所有網路介面；在共用環境中請主動將 `app.listen()` 改為綁定 `127.0.0.1`（例如 `app.listen(PORT, '127.0.0.1')`），或以防火牆 / VPN 限制僅能本機存取
- [ ] 連接埠 `31031` 無法從機器外部存取（防火牆 / VPN）
- [ ] 未將 GitHub Token 或憑證提交至原始碼控管
- [ ] `COPILOT_CONFIG_PATH` 環境變數（若有設定）指向非公開目錄
- [ ] 已為你的 Fork 套用分支保護規則（請參閱下方[分支保護](#分支保護)）
- [ ] 已閱讀關於 iframe 標頭移除的[法律聲明](#%EF%B8%8F-法律聲明)

</details>

<details>
<summary><b>Bridge 伺服器安全</b></summary>

#### 網路綁定

Bridge 伺服器（`scripts/copilot-bridge`）預期僅供本機使用，預設監聽 `http://localhost:31031`；實際綁定位址則取決於程式碼中 `app.listen()` 設定的 hostname。

> **警告：** 除非你已設定防火牆規則或帶有驗證機制的反向代理保護連接埠 `31031`，否則請勿將 `app.listen()` 的 hostname 改為 `0.0.0.0` 或移除 hostname 參數。

#### CORS 政策

**重要：** `origin: '*'` 並不會因為伺服器只綁在 `localhost` 就自動安全。任何開在瀏覽器裡的網頁都可以對 `http://localhost:PORT` 發送請求；如果你同時允許任何來源讀取回應，且沒有額外驗證機制，就可能在你不知情的情況下洩漏資料或觸發動作。

Bridge 預設採用寬鬆的 CORS 設定是為了方便本機開發與配合瀏覽器擴充功能（例如 `chrome-extension://...`），但**建議只在你信任本機環境、且清楚了解風險時使用**。若你將 Bridge 用於其他場景（例如被網頁直接呼叫），請同時：

- 限制允許的 `Origin`
- 或加入驗證機制（例如 API token / header）

下面是一個較安全、同時支援擴充功能與特定網頁來源的範例：

```typescript
// scripts/copilot-bridge/src/server.ts
app.use(cors({
  origin(origin, callback) {
    const allowedWebOrigins = [
      'http://localhost:YOUR_PORT', // 將此處替換為你實際使用的網頁來源
      // 如有需要，可在此加入其他受信任的 web Origin
    ];

    // 擴充功能來源，例如 chrome-extension://<id>
    const isExtensionOrigin = typeof origin === 'string' && origin.startsWith('chrome-extension://');

    // 視需求決定是否允許沒有 Origin 的請求（如 curl、本機程式）
    if (!origin) {
      return callback(null, true);
    }

    if (isExtensionOrigin || allowedWebOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'], // 建議搭配自訂 Token 做驗證
}));
```

#### 連接埠設定

你可以在啟動 Bridge 前設定 `PORT` 環境變數來變更預設連接埠：

```bash
PORT=32000 npm run dev
```

請同步更新擴充功能設定中 **Bridge 設定** 的 URL。

#### 設定檔路徑

Bridge 讀取並寫入 `~/.copilot/config.json`。可使用環境變數覆寫路徑：

```bash
COPILOT_CONFIG_PATH=/path/to/your/config.json npm run dev
```

</details>

<details>
<summary><b>權限系統（檔案存取）</b></summary>

SDK 模式包含一個權限系統，用於管控 Copilot 代理發起的檔案系統操作。當代理請求檔案系統動作時，Bridge 會呼叫 `requestPermission`，並依照結果決定是否執行操作。

#### 允許清單操作

以下操作**無需提示即可執行**：

| 操作 | 說明 |
|------|------|
| `readTextFile` | 以純文字讀取檔案 |
| `listDirectory` | 列出目錄內容 |

#### 權限解析方式

當 Copilot 代理請求不在允許清單上的操作時，Bridge 會呼叫 `resolvePermission()`。預設選取 SDK 回傳的**第一個選項**（通常為「核准一次」）。你可以修改 `scripts/copilot-bridge/src/session-manager.ts` 中的 `selectPermissionOutcome` 來實作更嚴格的政策：

```typescript
// 範例：拒絕所有不在允許清單上的操作
function selectPermissionOutcome(options: any[] = []): any {
  return { outcome: { outcome: 'cancelled' } };
}
```

若你想引入執行期允許清單或 REST 權限 API，需要：
- 在 `scripts/copilot-bridge/src/session-manager.ts` 的 ACP 客戶端中啟用相關 fs 功能，並
- 在 `scripts/copilot-bridge/src/server.ts` 中實作對應的 `/api/permission/*` 路由。

</details>

<details>
<summary><b>設定金鑰允許清單</b></summary>

當擴充功能將設定同步至 `~/.copilot/config.json` 時，僅會寫入以下允許清單中的金鑰。擴充功能傳送的未知金鑰會被靜默忽略：

| 金鑰 | 說明 |
|------|------|
| `model` | 選取的 AI 模型 |
| `reasoning_effort` | 推理層級（`low` / `medium` / `high`） |
| `render_markdown` | Markdown 渲染開關 |
| `theme` | UI 主題（`auto` / `dark` / `light`） |
| `banner` | 橫幅顯示頻率 |

此機制可防止意外或惡意寫入無關的設定金鑰。

</details>

<details id="分支保護">
<summary><b>分支保護</b></summary>

本儲存庫在 `.github/branch-protection-ruleset.json` 提供了一份可重複使用的 GitHub Ruleset 定義。將其套用至你的 Fork 以強制執行：

- 預設分支禁止直接推送（封鎖刪除與非快進合併）
- 需要線性歷史記錄
- 合併前至少需要 **1 位審查者核准**
- 合併前所有審查討論串必須解決

#### 套用規則集

1. 前往你的 Fork → **Settings → Rules → Rulesets**
2. 點擊 **New ruleset → Import ruleset**
3. 上傳 `.github/branch-protection-ruleset.json`
4. 將 **Enforcement** 設為 `Active` 並儲存

</details>

---

## 🏗️ 架構

<details>
<summary><b>系統架構</b></summary>

```
┌──────────────────────────────────────────────────────────┐
│  Chrome Extension (Manifest V3)                          │
│                                                          │
│  ┌──────────┬──────────┬──────────┬──────────┐          │
│  │ Copilot  │  Rules   │  Memory  │ Settings │  Tabs    │
│  └──────────┴──────────┴──────────┴──────────┘          │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────────┐           │
│  │   iframe Mode   │  │     SDK Mode        │           │
│  │  (Copilot Web)  │  │  (sdk-client.js)    │           │
│  └────────┬────────┘  └────────┬────────────┘           │
│           │                    │ HTTP / SSE              │
│  ┌────────┴────────┐          │                          │
│  │   Link Guard    │          │                          │
│  │ (content script) │          │                          │
│  └─────────────────┘          │                          │
└───────────────────────────────┼──────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │   Copilot Bridge      │
                    │   (Express.js)        │
                    │   localhost:31031     │
                    │                       │
                    │  ┌─────────────────┐  │
                    │  │   Supervisor    │  │
                    │  │  (auto-restart) │  │
                    │  └────────┬────────┘  │
                    │           │            │
                    │  ┌────────┴────────┐  │
                    │  │     Worker      │  │
                    │  │ (HTTP + Sessions)│  │
                    │  └────────┬────────┘  │
                    └───────────┼───────────┘
                                │ JSON-RPC / stdio
                    ┌───────────┴───────────┐
                    │   Copilot CLI         │
                    │   (copilot --acp)     │
                    └───────────────────────┘
```

### 核心模組

| 模組 | 檔案 | 職責 |
|------|------|------|
| SDK Client | `js/sdk-client.js` | Bridge HTTP/SSE 通訊 |
| SDK Chat | `js/sdk-chat.js` | SDK 模式 UI 與串流顯示 |
| Mode Manager | `js/mode-manager.js` | 模式偵測與切換 |
| Memory Bank | `js/memory-bank.js` | 記憶 CRUD、搜尋、篩選 |
| Rules Manager | `js/rules-manager.js` | 指示、範本、匯入／匯出 |
| Link Guard | `js/link-guard.js` | iframe 邊界控制 |
| VS Code Connector | `js/vscode-connector.js` | URI scheme 整合 |
| Automation | `js/automation.js` | 頁面擷取與內容提取 |
| Storage Manager | `js/storage-manager.js` | Chrome Storage 抽象層 |
| Background | `background.js` | Service Worker、IPC 路由 |

### 技術堆疊

| 層級 | 技術 |
|------|------|
| 擴充功能 UI | Vanilla JS (ES Modules)、HTML、CSS |
| 樣式 | CSS Variables、GitHub Dark 主題 |
| Bridge 伺服器 | TypeScript、Express.js 5.x |
| SDK | `@github/copilot-sdk` ^0.1.8 |
| 協定 | HTTP REST + Server-Sent Events |
| 程序管理 | Supervisor/Worker 模式 |
| 儲存 | Chrome Storage API (`chrome.storage.local`) |

</details>

---

## ❓ 常見問題

<details>
<summary><b>Q：Bridge 伺服器無法啟動 — 該檢查什麼？</b></summary>

1. 確認已安裝 Node.js 18+：`node --version`
2. 確認已安裝 Copilot CLI：`copilot --version`
3. 確認已完成驗證：`copilot auth status`
4. 檢查連接埠 31031 是否已被佔用
5. 嘗試在 `scripts/copilot-bridge/` 中執行 `npm run dev` 並查看主控台輸出

</details>

<details>
<summary><b>Q：SDK 模式顯示「Bridge not connected」— 如何修復？</b></summary>

1. 前往 **設定 > Bridge 設定** 並點擊 **健康檢查**
2. 若失敗，啟動 Bridge 伺服器：`cd scripts/copilot-bridge && npm run dev`
3. 等待主控台顯示 `Server listening on port 31031`
4. 再次點擊 **健康檢查** — 應顯示綠色狀態

</details>

<details>
<summary><b>Q：iframe 模式顯示空白頁面或登入畫面</b></summary>

- 確認你已在同一個 Chrome 設定檔中登入 GitHub
- Copilot 網頁 UI 需要有效的 GitHub Copilot 訂閱
- 若頁面仍無法載入，請嘗試重新整理（點擊首頁圖示）

</details>

<details>
<summary><b>Q：記憶庫和規則有什麼不同？</b></summary>

| 面向 | 記憶庫 | 規則 |
|------|--------|------|
| 用途 | 具體資料 — 任務、筆記、上下文 | 行為指示 — 語氣、慣例 |
| 注入方式 | 最多 5 筆項目，依權重排序 | 單一 Markdown 指示區塊 |
| 最大長度 | 共 3,600 字元（每筆 700 字元） | 2,200 字元 |
| 使用情境 | 「目前衝刺任務」、「API 端點參考」 | 「始終使用 TypeScript strict 模式」 |

</details>

<details>
<summary><b>Q：iframe 模式安全嗎？</b></summary>

iframe 模式透過移除特定 HTTP 標頭來嵌入 GitHub Copilot 網頁介面。這在 GitHub 服務條款方面屬於灰色地帶。**SDK 模式**使用官方 `@github/copilot-sdk`，是建議用於正式環境的方式。

</details>

<details>
<summary><b>Q：SidePilot 可以搭配 VS Code 或 Cursor 使用嗎？</b></summary>

SidePilot 內建 VS Code 連接器，可產生自訂 URI。你可以點擊任何記憶項目上的 IDE 圖示，將其傳送至 VS Code 或 Cursor。支援的 URI scheme：`vscode://`、`cursor://`、`windsurf://`。

</details>

---

## 🧭 疑難排解

| 症狀 | 解決方式 |
|------|----------|
| Bridge 伺服器無法使用 | 啟動 `scripts/copilot-bridge` 並確認 `copilot --acp` 可用 |
| SDK 回傳 HTTP 404 | 確認 Bridge 在連接埠 `31031` 上執行中 |
| iframe 空白／白色畫面 | 在同一個 Chrome 設定檔中登入 GitHub |
| 擷取按鈕不可見 | 檢查設定 > 擷取 > 按鈕寬度（增加至 32+ px） |
| 記憶未被注入 | 在設定 > SDK 模式中啟用「在提示中包含記憶」 |
| 模型同步無效 | 在設定 > Copilot CLI 同步中啟用對應的同步開關 |

---

## 🤝 貢獻

歡迎貢獻！請先開啟 **Issue** 來討論你的變更提案。

1. Fork 此儲存庫
2. 建立功能分支：`git checkout -b feature/my-feature`
3. 以清晰的訊息提交變更
4. 開啟 Pull Request

---

## ⚠️ 法律聲明

> 此擴充功能嵌入 GitHub Copilot 網頁介面（iframe 模式）並使用官方 Copilot CLI SDK（SDK 模式）。使用風險自負，請確保遵守 [GitHub 服務條款](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)。

---

## 📜 授權條款

本專案採用 [MIT 授權條款](LICENSE) 授權。

---

## 🤖 AI 輔助開發

本專案在 AI 的協助下開發。

**使用的 AI 模型：**
- Claude (Anthropic) — 架構設計、程式碼生成、文件撰寫
- GPT-5 (OpenAI Codex) — 程式碼生成、除錯

> **免責聲明：** 雖然作者已盡力審查與驗證 AI 生成的程式碼，但無法保證其正確性、安全性或適用於任何特定用途。使用風險自負。
