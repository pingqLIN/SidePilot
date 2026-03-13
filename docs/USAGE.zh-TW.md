# SidePilot — 詳細使用指南

> 這份文件偏向「實際安裝與操作手冊」。若要看首頁型介紹，請回到 [README.zh-TW.md](../README.zh-TW.md)。

| 你現在在看 | 最適合誰 | 延伸閱讀 |
| --- | --- | --- |
| 安裝、設定與日常操作 | 想把 SidePilot 實際跑起來的人 | [guide/getting-started/README.zh-TW.md](guide/getting-started/README.zh-TW.md)、[guide/concepts/README.zh-TW.md](guide/concepts/README.zh-TW.md)、[FEATURES.md](FEATURES.md) |

## 先選你的路線

| 如果你想... | 從這裡開始 |
| --- | --- |
| 先把擴充裝起來 | [📦 安裝](#-安裝) |
| 先理解 iframe 模式 | [🌐 iframe 模式](#-iframe-模式) |
| 解鎖 bridge / 串流 / SDK 功能 | [🔧 SDK 模式](#-sdk-模式) |
| 管理持久上下文 | [🧠 記憶庫](#-記憶庫) |
| 微調設定與儲存行為 | [⚙️ 設定參考](#%EF%B8%8F-設定參考) |

---

## 目錄

- [安裝](#-安裝)
- [iframe 模式](#-iframe-模式)
- [SDK 模式](#-sdk-模式)
- [記憶庫](#-記憶庫)
- [規則管理](#-規則管理)
- [頁面擷取](#-頁面擷取)
- [連結守衛](#-連結守衛)
- [設定參考](#%EF%B8%8F-設定參考)
- [鍵盤快捷鍵](#-鍵盤快捷鍵)
- [儲存與資料](#-儲存與資料)
- [Bridge 伺服器 API](#-bridge-伺服器-api)

---

## 📦 安裝

### 系統需求

| 需求 | 最低要求 |
|------|----------|
| Chrome | 版本 114 或更新版本 |
| Node.js | 版本 24+（僅 SDK 模式需要） |
| GitHub 帳號 | 需要 Copilot 訂閱 |
| 作業系統 | Windows、macOS 或 Linux |

### 逐步安裝

#### 1. 下載擴充功能

```bash
git clone https://github.com/user/SidePilot.git
cd SidePilot
```

#### 2. 載入至 Chrome

1. 開啟 Chrome 並前往 `chrome://extensions/`
2. 使用右上角的開關啟用**開發者模式**
3. 點擊**載入未封裝項目**按鈕
4. 瀏覽並選擇 `SidePilot/extension` 資料夾
5. SidePilot 圖示將出現在工具列中

> **提示：** 將擴充功能釘選以便快速存取——點擊工具列中的拼圖圖示，然後點擊 SidePilot 旁的釘選圖示。

#### 3. 開啟側邊欄

- **點擊**工具列中的 SidePilot 圖示，或
- **鍵盤快捷鍵：** `Alt + Shift + P`（Windows/Linux）或 `Opt + Shift + P`（macOS）

側邊欄會在瀏覽器視窗的右側開啟。

#### 4.（選用）設定 SDK 模式

如果您計劃使用 SDK 模式，請設定 Bridge 伺服器：

```bash
cd scripts/copilot-bridge
npm install
```

詳細設定說明請參閱 [SDK 模式](#-sdk-模式)。

---

## 🌐 iframe 模式

### 什麼是 iframe 模式

iframe 模式將完整的 GitHub Copilot 網頁介面直接嵌入側邊欄中。這提供與訪問 `github.com/copilot` 相同的體驗，但作為一個持久的側邊欄，在您瀏覽時保持開啟。

### 如何使用

1. 開啟側邊欄
2. 確認在模式開關（右上角）中選擇了 **IFRAME**
3. Copilot 網頁 UI 會自動載入
4. 使用方式與 `github.com/copilot` 完全相同：
   - 與 Copilot 聊天
   - 使用快速操作：Task、Create Issue、Spark、Git、Pull Requests
   - 從下拉選單切換模型
   - 檢視最近的 Agent 工作階段

### 頁面資訊列

在 Copilot 分頁的頂部，頁面資訊列顯示：
- 目前使用中分頁的**標題**和 **URL**
- 此資訊會被擷取功能使用

### 浮動擷取按鈕

每個頁面的左側邊緣會出現一個標有 **capture page content** 的垂直按鈕。詳情請參閱[頁面擷取](#-頁面擷取)。

### 限制

- 某些 GitHub 功能在 iframe 中可能無法完美運作
- 離開 Copilot 的連結由[連結守衛](#-連結守衛)控制
- 需要在同一 Chrome 設定檔中登入 GitHub

> **警告：** iframe 模式會移除 HTTP 安全標頭以啟用嵌入功能。這在 GitHub 服務條款方面屬於灰色地帶。建議在正式環境中使用 SDK 模式。

---

## 🔧 SDK 模式

### 什麼是 SDK 模式

SDK 模式透過官方 `@github/copilot-sdk` 連接 GitHub Copilot。它使用本地 Bridge 伺服器，透過 JSON-RPC 與 Copilot CLI 通訊，提供完全合規的整合方案。

### 架構

```
Side Panel  ←──HTTP/SSE──→  Bridge Server  ←──JSON-RPC/stdio──→  Copilot CLI
(sdk-client.js)              (Express.js)                         (copilot --acp)
                             localhost:31031
```

### 設定

#### 先決條件

1. **Node.js 24+**

```bash
node --version    # 應輸出 v24.x.x 或更高版本
```

2. **GitHub Copilot CLI**

```bash
copilot --version    # 驗證安裝
copilot auth status  # 驗證驗證狀態
```

如果尚未安裝，請參閱 [GitHub Copilot CLI 文件](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-the-command-line)。

#### 啟動 Bridge 伺服器

**建議模式**（Supervisor + Worker）：

```bash
cd scripts/copilot-bridge
npm install          # 僅首次需要
export SIDEPILOT_EXTENSION_ID=<你的 Chrome extension id>
npm start            # 啟動並綁定到該 extension
```

**開發模式**（僅 Worker 熱重載）：

```bash
cd scripts/copilot-bridge
export SIDEPILOT_EXTENSION_ID=<你的 Chrome extension id>
npm run dev          # 啟動僅 Worker 的熱重載，並綁定到該 extension
```

> **重要：** `SIDEPILOT_EXTENSION_ID` 是 loopback 驗證的一部分。使用一鍵 launcher 會自動帶入；若手動啟動 bridge，請先自行設定。

#### 驗證連線

**從擴充功能：**
1. 前往**設定 > Bridge Setup**
2. 點擊 **Health Check**
3. 綠色指示燈表示 Bridge 已連線

**從終端機：**

```bash
curl http://localhost:31031/health
```

預期回應：

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
    "extensionOrigin": "chrome-extension://<你的-chrome-extension-id>"
  }
}
```

### 首次登入

1. 在側邊欄中切換至 **SDK** 模式
2. 登入引導對話框會自動出現
3. 點擊 **Open GitHub Login Page** 透過 OAuth 進行驗證
4. 返回側邊欄並點擊 **Test Bridge Connection**
5. 連線成功後，引導對話框會自動關閉

> **提示：** 您可以從「設定 > SDK Mode」重新觸發登入引導。

### 在 SDK 模式中聊天

1. 從**模型**下拉選單中選擇模型（例如 `gpt-5.2`）
2. 在輸入框中輸入您的訊息
3. 點擊**傳送**或按 `Enter`
4. 回應會透過 SSE 即時串流
5. 回應中的程式碼區塊會語法高亮顯示

#### 上下文注入

啟用時（設定 > SDK Mode）：

- **Include Memory in Prompt** — 在您的訊息前附加最多 5 個記憶條目（依權重排序）
- **Include Rules in Prompt** — 將您的啟用規則作為系統層級指令附加

這意味著 Copilot 會接收持久化的上下文，無需您重複輸入專案細節。

#### 狀態列

在 SDK 聊天區域的底部，您會看到：

- **模型選擇器** — 目前選擇的模型
- **記憶庫/規則狀態** — 當兩者都啟用時顯示 `mem on, rules on`
- **儲存路徑** — 聊天匯出的儲存位置（如已啟用）

---

## 🧠 記憶庫

### 概述

記憶庫是一個結構化的儲存系統，用於保存您希望跨聊天工作階段持久保存的資訊。與聊天記錄不同，記憶條目是有組織的、可搜尋的，並且可以自動注入到提示詞中。

### 條目類型

| 類型 | 圖示 | 權重 | 適用場景 |
|------|------|------|----------|
| **Task（任務）** | `[T]` | 1 | 工作項目：「實作登入頁面」、「修復 API 逾時錯誤」 |
| **Note（筆記）** | `[N]` | 2 | 快速觀察：「API 速率限制為 100 次/分鐘」 |
| **Reference（參考）** | `[R]` | 3 | 連結和文件：「REST API 文件：https://...」 |
| **Context（上下文）** | `[C]` | 4 | 環境資訊：「使用 React 18 + TypeScript 5.3」 |

> **權重**決定注入優先順序——當上下文空間有限時，較高權重的條目會優先被注入。

### 建立條目

1. 前往**記憶庫**分頁
2. 點擊 **+ Add Entry** 按鈕
3. 填寫表單：
   - **類型** — 選擇 Task、Note、Context 或 Reference
   - **內容** — 要儲存的資訊（每個條目最多 700 個字元）
   - **狀態** — Pending、In Progress 或 Done（主要用於 Task）
4. 點擊 **Save**

### 編輯與刪除

- 點擊任何條目以開啟編輯對話框
- 修改欄位後點擊 **Save** 更新
- 點擊 **Delete** 永久刪除該條目

### 搜尋與篩選

- **搜尋列** — 全文搜尋所有條目內容
- **類型篩選** — 僅顯示特定類型的條目
- **狀態篩選** — 僅顯示特定狀態的條目

### 上下文注入限制

| 限制 | 數值 |
|------|------|
| 最大注入條目數 | 5 |
| 最大總字元數 | 3,600 |
| 每個條目最大 | 700 個字元 |

條目在注入前會依權重排序（Context > Reference > Note > Task）。如果達到字元限制，較低權重的條目會被截斷。

### VS Code 整合

每個記憶條目都有一個 IDE 圖示。點擊它會透過自訂 URI scheme 將條目內容發送至 VS Code（或 Cursor/Windsurf）：

```
vscode://extension.command?content=encoded-entry-content
```

---

## 📋 規則管理

### 概述

規則是行為指令，告訴 Copilot 如何回應。它們的功能類似於自訂系統提示——定義語氣、慣例、模式和約束。

### 內建範本

| 範本 | 說明 |
|------|------|
| **Default** | 通用：清晰簡潔的回應；帶有註解的程式碼 |
| **TypeScript** | TypeScript 專用：嚴格模式、介面、正確的型別定義 |
| **React** | React 模式：函式元件、Hooks、狀態管理 |

### 建立規則

1. 前往**規則**分頁
2.（選用）從下拉選單中選擇範本作為基礎
3. 在 Markdown 編輯器中編輯規則
4. 點擊 **Save Rules**

**規則範例：**

```markdown
## Project Instructions

- Always use TypeScript with strict mode
- Prefer functional components over class components
- Use React Query for data fetching
- Follow the project's existing naming conventions
- Include JSDoc comments for exported functions
```

### 字元限制

規則限制為 **2,200 個字元**。輸入時字元計數器會顯示剩餘空間。

### 匯入 / 匯出

- **匯出** — 點擊匯出按鈕將規則下載為 `.md` 檔案
- **匯入** — 點擊匯入按鈕並選擇 `.md` 檔案載入

### 規則注入方式（SDK 模式）

當「Include Rules in Prompt」啟用時：

1. 您的規則文字從 Chrome 儲存空間載入
2. 作為系統指令附加在聊天訊息之前
3. Copilot 接收到的內容為：`[Rules] + [Memory（如已啟用）] + [您的訊息]`

---

## 📸 頁面擷取

### 概述

頁面擷取讓您從目前使用中的分頁提取內容，並將其作為上下文用於您的 Copilot 對話。

### 浮動按鈕

每個網頁的左側邊緣會出現一個標有 **capture page content**（擷取頁面內容）的垂直按鈕。它具有以下特性：

- 側邊欄開啟時始終可見
- 可垂直拖曳以調整位置
- 寬度可在設定中調整（1–128 px）

### 擷取類型

#### 文字內容

提取完整的頁面文字並保留結構：
- 標題、段落和列表
- 表格內容
- 程式碼區塊（偵測並保留）
- 連結文字和 URL

#### 程式碼區塊偵測

專門從頁面提取程式碼區塊：
- 偵測 `<code>` 和 `<pre>` 元素
- 保留語法高亮語言標註
- 將相關的程式碼區塊分組

#### 完整截圖

擷取可見視窗的圖片：
- 以 PNG 格式儲存至設定的截圖路徑
- 可在對話中引用

#### 局部截圖

選擇頁面的矩形區域進行擷取：
1. 點擊**局部截圖**
2. 點擊並拖曳以選擇區域
3. 放開以完成擷取

### 使用擷取的內容

擷取後，內容會出現在預覽面板中。您可以：
- **複製**到剪貼簿
- **傳送到聊天** — 自動貼到 Copilot 輸入框中
- **儲存** — 匯出為檔案

---

## 🔗 連結守衛

### 概述

連結守衛控制 iframe 模式中連結的行為方式。預設情況下，只有 Copilot 相關的 URL 會留在 iframe 中；所有其他連結會在新的瀏覽器分頁中開啟。

### 模式

#### 白名單模式（預設）

只有符合白名單模式的 URL 會在 iframe 中載入。其他所有連結會在新分頁中開啟。

**預設白名單：**
```
https://github.com/copilot
https://github.com/login
https://github.com/sessions
```

#### 黑名單模式

所有 URL 都在 iframe 中載入，除了符合黑名單模式的 URL 會在新分頁中開啟。

### 設定模式

1. 前往**設定 > iframe Mode**
2. 選擇守衛模式（Allow 或 Deny）
3. 輸入 URL 前綴，每行一個：

```
https://github.com/copilot
https://github.com/login
```

4. 模式按 URL 前綴比對——`https://github.com/copilot` 會比對 `https://github.com/copilot/c/abc123`

### 運作方式

連結守衛使用注入到 GitHub 頁面的內容腳本（`link-guard.js`）。它攔截錨點元素上的點擊事件並：

1. 讀取目標 URL
2. 與設定的模式進行比對
3. 在 iframe 中允許導航或開啟新分頁

此外，Chrome 的 **Declarative Net Request** API 用於移除 `X-Frame-Options` 和 `Content-Security-Policy` 標頭，否則這些標頭會阻止 iframe 嵌入。

---

## ⚙️ 設定參考

### 快速導航

設定面板頂部提供快速導航區段，包含各類別的按鈕：

| 按鈕 | 區段 |
|------|------|
| Intro | 介紹動畫和歡迎設定 |
| Bridge Setup | Bridge 伺服器健康狀態和指令 |
| SDK Mode | 記憶庫/規則注入、儲存路徑 |
| iframe Mode | 連結守衛設定 |
| Capture | 按鈕寬度調整 |

### 詳細設定

#### 介紹與歡迎

| 設定 | 預設值 | 說明 |
|------|--------|------|
| Play Every Open | 關閉 | 每次開啟面板時重播介紹動畫 |
| Show Warning | 開啟 | 顯示關於 iframe 模式風險的免責聲明 |

#### Bridge Setup

| 元素 | 類型 | 說明 |
|------|------|------|
| Bridge Status | 指示燈 | 綠色 = 已連線，紅色 = 已斷線 |
| Health Check URL | 顯示 | `http://localhost:31031/health` |
| Check Bridge | 按鈕 | 發送健康檢查請求 |
| Copy Start Command | 按鈕 | 將 Bridge 啟動指令複製到剪貼簿 |
| Copy Health Command | 按鈕 | 複製 curl 健康檢查指令 |

#### SDK Mode

| 設定 | 預設值 | 說明 |
|------|--------|------|
| Auto Login Guide | 開啟 | 首次切換至 SDK 模式時顯示 GitHub 登入引導 |
| Include Memory in Prompt | 開啟 | 在每則訊息前注入記憶條目 |
| Include Rules in Prompt | 開啟 | 在每則訊息前注入規則 |
| Show Storage Location | 開啟 | 在狀態列中顯示聊天儲存路徑 |
| Session-state Path | `~/.copilot/session-state/` | CLI 工作階段資料的儲存位置 |
| Chat Export Path | `~/copilot/chat-exports/` | 對話的儲存位置 |
| Screenshot Path | `~/copilot/screenshots/` | 截圖的儲存位置 |

#### Copilot CLI 設定同步

這些設定在切換時會寫入 `~/.copilot/config.json`：

| 設定 | 預設值 | 選項 | 說明 |
|------|--------|------|------|
| Sync Model | 關閉 | — | 將選擇的模型寫入 CLI 設定 |
| Sync Theme | 關閉 | auto、dark、light | 同步色彩主題 |
| Sync Banner | 關閉 | always、once、never | 控制 CLI 橫幅顯示 |
| Sync Reasoning Effort | 關閉 | low、medium、high | 設定 AI 推理等級 |

#### iframe Mode

| 設定 | 預設值 | 說明 |
|------|--------|------|
| Link Guard Mode | Allow | `allow` = 白名單，`deny` = 黑名單 |
| URL Patterns | Copilot URL | 每行一個 URL 前綴 |

#### 擷取

| 設定 | 預設值 | 範圍 | 說明 |
|------|--------|------|------|
| Button Width | 32 px | 1–128 px | 浮動擷取按鈕的寬度 |

---

## ⌨️ 鍵盤快捷鍵

| 快捷鍵 | 動作 |
|--------|------|
| `Alt + Shift + P` | 開啟/關閉側邊欄（Windows/Linux） |
| `Opt + Shift + P` | 開啟/關閉側邊欄（macOS） |
| `Enter` | 傳送訊息（SDK 模式） |
| `Shift + Enter` | 在訊息輸入中換行 |

---

## 💾 儲存與資料

### 資料儲存位置

| 資料 | 儲存方式 | 位置 |
|------|----------|------|
| 設定 | Chrome 本地儲存 | `sidepilot.settings.v1` |
| 記憶條目 | Chrome 本地儲存 | `sidepilot.memory.entries` |
| 規則 | Chrome 本地儲存 | `rules.content` |
| 使用中的模式 | Chrome 本地儲存 | `sidepilot.mode.active` |
| 聊天匯出 | 本地檔案系統 | 設定的路徑（預設：`~/copilot/chat-exports/`） |
| 截圖 | 本地檔案系統 | 設定的路徑（預設：`~/copilot/screenshots/`） |
| CLI 設定 | 本地檔案系統 | `~/.copilot/config.json` |
| 工作階段狀態 | 本地檔案系統 | `~/.copilot/session-state/` |

### Chrome 儲存鍵值

| 鍵 | 類型 | 說明 |
|----|------|------|
| `sidepilot.mode.active` | `'iframe' \| 'sdk'` | 目前使用中的模式 |
| `sidepilot.mode.lastCheck` | `number` | 上次模式檢查的時間戳記 |
| `sidepilot.memory.entries` | `object` | 條目 ID 到條目資料的映射 |
| `sidepilot.memory.index` | `object` | 按狀態建立的索引，用於快速篩選 |
| `sidepilot.settings.v1` | `object` | 所有使用者設定 |
| `rules.content` | `string` | 規則 Markdown 文字 |
| `rules.lastModified` | `number` | 規則最後修改的時間戳記 |
| `sidepilot.sdk.model` | `string` | 選擇的 SDK 模型 |
| `copilot_sidepanel_welcomed` | `boolean` | 歡迎覆蓋層已關閉 |

### 資料隱私

- 所有資料都**存儲在本地** Chrome 儲存空間或您的檔案系統中
- 不會將任何資料發送到第三方伺服器
- 唯一的外部通訊是與 GitHub（Copilot 網頁）和本地 Bridge 伺服器
- 不收集任何遙測或分析資料

---

## 🔌 Bridge 伺服器 API

### 基礎 URL

```
http://localhost:31031
```

### 端點

#### `GET /health`

健康檢查端點。

**回應：**

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
    "extensionOrigin": "chrome-extension://<你的-chrome-extension-id>"
  }
}
```

#### `GET /api/models`

列出可用的 AI 模型。

**回應：**

```json
{
  "success": true,
  "models": ["gpt-4o", "gpt-5.2", "claude-sonnet-4"]
}
```

#### `POST /api/sessions`

建立新的聊天工作階段。

**回應：**

```json
{
  "success": true,
  "sessionId": "abc-123-def-456"
}
```

#### `GET /api/sessions`

列出所有使用中的工作階段。

#### `DELETE /api/sessions/:id`

終止特定的工作階段。

#### `POST /api/chat`

傳送聊天訊息並以串流回應（SSE）。

**請求：**

```json
{
  "sessionId": "abc-123-def-456",
  "message": "Explain the difference between let and const"
}
```

**SSE 事件：**

| 事件 | 資料 | 說明 |
|------|------|------|
| `delta` | `{ "content": "text chunk" }` | 增量文字更新 |
| `tool` | `{ "name": "...", "status": "..." }` | 工具執行狀態 |
| `message` | `{ "content": "full response" }` | 完整訊息 |
| `error` | `{ "message": "error detail" }` | 錯誤資訊 |
| `done` | `{}` | 串流完成 |

#### `POST /api/chat/sync`

傳送聊天訊息並等待完整回應（阻塞式）。

**請求：** 與 `/api/chat` 相同

**回應：**

```json
{
  "success": true,
  "content": "The difference between let and const is..."
}
```

---

## 🛠️ 開發

### 專案結構

```
SidePilot/
├── extension/               # Chrome 擴充功能
│   ├── manifest.json        # Manifest V3 設定
│   ├── sidepanel.html       # 側邊欄 UI
│   ├── sidepanel.js         # 主要 UI 控制器
│   ├── background.js        # Service Worker
│   ├── styles.css           # GitHub Dark 主題
│   ├── rules.json           # Declarative Net Request 規則
│   ├── icons/               # 擴充功能圖示
│   ├── assets/              # 媒體檔案
│   └── js/                  # JavaScript 模組
│       ├── sdk-client.js    # Bridge 通訊
│       ├── sdk-chat.js      # SDK 模式 UI
│       ├── mode-manager.js  # 模式切換
│       ├── memory-bank.js   # 記憶庫 CRUD
│       ├── rules-manager.js # 規則管理
│       ├── link-guard.js    # iframe 連結控制
│       ├── vscode-connector.js
│       ├── automation.js    # 頁面擷取
│       └── storage-manager.js
│
├── scripts/copilot-bridge/  # Bridge 伺服器
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts        # Express 應用程式 + 路由
│       ├── supervisor.ts    # 程序監控
│       ├── session-manager.ts
│       └── ipc-types.ts
│
├── docs/                    # 文件
│   ├── USAGE.md             # 使用指南（英文）
│   ├── USAGE.zh-TW.md      # 使用指南（繁體中文）
│   ├── DEVELOPMENT_PLAN.md  # 對外路線圖
│   └── screenshots/         # UI 截圖
│
├── package.json             # 擴充功能開發依賴
├── README.md                # 專案概覽（英文）
├── README.zh-TW.md          # 專案概覽（繁體中文）
└── LICENSE                  # MIT 授權
```

### 執行測試

```bash
# 單元測試
npm test

# 監看模式
npm run test:watch

# 含覆蓋率
npm run test:coverage
```

### Bridge 伺服器開發

```bash
cd scripts/copilot-bridge

# 建議：build + 啟動 Supervisor
npm start

# 開發模式（僅 Worker 熱重載）
npm run dev

# 僅建置 TypeScript
npm run build
```
