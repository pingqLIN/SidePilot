<p align="center">
  <img src="docs/banner.png" width="1000" alt="SidePilot banner">
</p>

<h1 align="center">SidePilot</h1>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/Version-0.5.0-blue?style=flat-square">
  <img alt="Chrome" src="https://img.shields.io/badge/Chrome-114+-4285F4?style=flat-square&logo=google-chrome&logoColor=white">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Manifest-V3-34a853?style=flat-square">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square">
</p>

<p align="center">
  <b>GitHub Copilot 隨時待命 — 瀏覽器側邊欄的持久 AI 對話助手</b>
</p>

<p align="center">
  <a href="#-截圖展示">截圖</a> &bull;
  <a href="#-功能亮點">功能</a> &bull;
  <a href="#-快速安裝">安裝</a> &bull;
  <a href="#-雙模式使用指南">雙模式</a> &bull;
  <a href="#-功能模組">模組</a> &bull;
  <a href="#%EF%B8%8F-系統架構">架構</a> &bull;
  <a href="#-api-參考">API</a> &bull;
  <a href="#-常見問題">FAQ</a>
</p>

<p align="center">
  <a href="README.md">English</a> &bull;
  <a href="docs/FEATURES.md">完整功能指南</a> &bull;
  <a href="docs/SCREENSHOTS.md">截圖導覽</a>
</p>

---

## 📸 截圖展示

<table>
  <tr>
    <td align="center">
      <b>iframe 模式</b><br>
      <img src="pic/01-iframe-mode.png" height="280" alt="iframe 模式 — 嵌入 GitHub Copilot 網頁介面">
      <br><sub>嵌入 Copilot 網頁，零設定</sub>
    </td>
    <td align="center">
      <b>SDK 模式</b><br>
      <img src="pic/02-sdk-chat.png" height="280" alt="SDK 模式 — 即時串流對話">
      <br><sub>官方 API，即時串流回應</sub>
    </td>
    <td align="center">
      <b>Rules 管理</b><br>
      <img src="pic/03-rules-tab.png" height="280" alt="規則管理與樣板">
      <br><sub>行為指令與樣板系統</sub>
    </td>
    <td align="center">
      <b>上下文注入</b><br>
      <img src="pic/08-sdk-context.png" height="280" alt="SDK 上下文注入">
      <br><sub>自動注入記憶與規則至對話</sub>
    </td>
  </tr>
</table>

<details>
<summary><b>📷 更多截圖</b></summary>
<br>

| 功能                 | 截圖                                                                       | 說明                                              |
| -------------------- | -------------------------------------------------------------------------- | ------------------------------------------------- |
| **Rules 管理**       | <img src="pic/03-rules-tab.png" height="200" alt="Rules 分頁">             | 行為指令編輯器，支援樣板套用與匯入匯出            |
| **Settings 面板**    | <img src="pic/04-settings-panel.png" height="200" alt="設定面板">          | 可折疊式設定區塊，所有偏好一目了然                |
| **SDK 設定**         | <img src="pic/05-settings-sdk.png" height="200" alt="SDK 設定">            | Context Injection 開關、Prompt 策略、API 端點設定 |
| **頁面擷取（文字）** | <img src="pic/06-page-capture-text.png" height="200" alt="文字擷取">       | 保留結構的全頁文字內容萃取                        |
| **頁面擷取（截圖）** | <img src="pic/07-page-capture-screenshot.png" height="200" alt="截圖擷取"> | 框選任意區域進行截圖                              |
| **SDK + 上下文注入** | <img src="pic/08-sdk-context.png" height="200" alt="SDK 上下文">           | 擷取的頁面上下文自動注入 SDK 對話                 |
| **SDK 登入引導**     | <img src="pic/09-sdk-initial.png" height="200" alt="SDK 登入引導">         | 首次使用的 GitHub 認證設定精靈                    |

</details>

> 🖼️ **所有截圖都收錄在 [`pic/`](pic/) 目錄**，詳見[截圖索引](pic/INDEX.md)。

---

## ✨ 功能亮點

<p align="center">
  <img src="pic/11-feature-highlights.png" width="480" alt="SidePilot 功能亮點">
</p>

|     | 功能                               | 說明                                                        |
| --- | ---------------------------------- | ----------------------------------------------------------- |
| 🔄  | **雙模式架構**                     | iframe 模式即開即用 · SDK 模式提供完整 API 功能             |
| 🧠  | **記憶庫 (Memory Bank)**           | 儲存任務、筆記、上下文、參考資料，支援狀態追蹤、搜尋與篩選  |
| 📋  | **規則管理 (Rules)**               | 定義行為指令，內建 6 種樣板，支援 Markdown 匯入匯出         |
| 📸  | **頁面擷取 (Page Capture)**        | 透過浮動按鈕擷取頁面文字、程式碼區塊，或全頁/部分截圖       |
| 🔗  | **連結守衛 (Link Guard)**          | 以白名單或黑名單控制 iframe 內的連結導航邊界                |
| 💉  | **上下文注入 (Context Injection)** | 自動在每次提示前注入 Identity、記憶、規則與系統指令         |
| ⚡  | **串流回應 (Streaming)**           | SDK 模式透過 Server-Sent Events 即時串流，支援工具執行顯示  |
| 🔧  | **設定同步 (Config Sync)**         | 將模型、主題、推理深度等設定同步至 `~/.copilot/config.json` |

---

## 🚀 快速安裝

### 1. 安裝擴充

```bash
git clone https://github.com/pingqLIN/SidePilot.git
cd SidePilot
npm install
npm run build:vendor    # 建置 vendor bundle（首次需要）
```

載入至 Chrome：

1. 開啟 `chrome://extensions/`
2. 右上角啟用「**開發人員模式**」
3. 點擊「**載入未封裝項目**」→ 選擇 `extension/` 資料夾
4. 工具列出現 SidePilot 圖示 ✅

### 2. 開啟側邊面板

| 平台            | 快捷鍵            |
| --------------- | ----------------- |
| Windows / Linux | `Alt + Shift + P` |
| macOS           | `Opt + Shift + P` |

或直接點擊工具列的 SidePilot 圖示。

### 3. 選擇模式

| 模式       | 設定需求                                          | 最適合                           |
| ---------- | ------------------------------------------------- | -------------------------------- |
| **iframe** | 免設定，即開即用                                  | 快速使用 Copilot 網頁介面        |
| **SDK**    | 需啟動 Bridge Server（[設定指南](#sdk-模式設定)） | 完整功能：串流、上下文注入、記憶 |

---

## 📖 雙模式使用指南

### iframe 模式

iframe 模式將 GitHub Copilot 網頁介面直接嵌入側邊面板。**無需任何伺服器。**

<img src="pic/01-iframe-mode.png" width="360" alt="iframe 模式">

**使用方式：**

1. 開啟側邊面板 → 選擇 **IFRAME** 模式
2. Copilot 網頁介面會載入面板中
3. 像平常一樣對話、使用 Agents、瀏覽歷史
4. 點擊左側邊緣的浮動**擷取按鈕**可擷取頁面內容

**連結守衛：** iframe 內點擊的連結受規則控制：

- **白名單模式**（預設）— 只有符合前綴的 URL 留在 iframe 內；其他在新分頁開啟
- **黑名單模式** — 符合前綴的 URL 在新分頁開啟；其他留在 iframe 內

> **注意：** iframe 模式透過 Chrome 的 Declarative Net Request API 移除 `X-Frame-Options` 和 CSP 標頭。

---

### SDK 模式

SDK 模式透過官方 `@github/copilot-sdk`，經由本地 Bridge Server 連線至 GitHub Copilot。

<img src="pic/02-sdk-chat.png" width="360" alt="SDK 模式對話">

```
擴充  ←→  HTTP/SSE  ←→  Bridge Server  ←→  Copilot CLI (ACP)  ←→  AI 模型
```

<details>
<summary><b id="sdk-模式設定">🔧 SDK 模式設定（Bridge Server）</b></summary>

#### 前置需求

- **Node.js 18+**
- **GitHub Copilot CLI** 已安裝並認證

```bash
# 安裝 GitHub CLI 與 Copilot 擴充
gh auth login
gh extension install github/gh-copilot
gh copilot --version    # 驗證安裝
```

#### 啟動 Bridge Server

```bash
cd scripts/copilot-bridge
npm install
npm run build           # TypeScript 編譯
npm run dev             # 開發模式（port 31031）
```

正式環境：

```bash
npm start               # 以 Supervisor 啟動（crash 自動重啟）
```

#### 首次登入

1. 切換至 **SDK** 模式
2. 自動彈出登入引導
3. 點擊「立即開啟 GitHub 登入頁」進行認證
4. 前往「設定 > Bridge 安裝助手」→ 點擊「檢查狀態」確認 ✅

<img src="pic/09-sdk-initial.png" width="360" alt="SDK 登入引導">

</details>

#### SDK 模式使用

1. 確認 Bridge Server 正在運行（`npm run dev`）
2. 頂部工具列切換至 **SDK** 模式
3. 從下拉選單選擇模型（如 `gpt-5.2`、`claude-sonnet-4.5`）
4. 輸入訊息 → 點擊 **Send** 或按 Enter
5. 回應透過 Server-Sent Events 即時串流

---

## 🧩 功能模組

<details>
<summary><b>🧠 記憶庫 (Memory Bank)</b></summary>

記憶庫儲存結構化條目，跨 Session 持久保存，並自動注入 SDK 對話的提示中。

#### 條目類型

| 類型   | 圖示 | 權重 | 用途                                         |
| ------ | ---- | ---- | -------------------------------------------- |
| 任務   | `📌` | 1    | 可追蹤的待辦事項（待處理 / 進行中 / 已完成） |
| 筆記   | `📝` | 2    | 想法、觀察與發現                             |
| 上下文 | `🧩` | 4    | 專案技術背景資訊                             |
| 參考   | `📎` | 3    | 連結、文件與外部資源                         |

#### 操作

- **新增** — 在記憶分頁點擊「+ 新增」，選擇類型、填寫內容、儲存
- **搜尋** — 對所有條目進行全文搜尋
- **篩選** — 依類型（任務/筆記/上下文/參考）或狀態篩選
- **排序** — 自動依權重、再依建立時間排序
- **VS Code 整合** — 點擊 IDE 圖示透過 URI Scheme 傳送（`vscode://` / `cursor://` / `windsurf://`）

#### 上下文注入（SDK 模式）

啟用後，SidePilot 會在每次訊息前自動帶入最多 **5 筆最相關條目**（上限 3,600 字元）。

<img src="pic/08-sdk-context.png" width="360" alt="SDK 上下文注入">

</details>

<details>
<summary><b>📋 規則管理 (Rules)</b></summary>

規則是發送給 Copilot 的行為指令，用於塑造回應風格（僅 SDK 模式）。

#### 內建樣板

| 樣板          | 說明                        |
| ------------- | --------------------------- |
| 🔧 預設       | 通用編碼助手指令            |
| 📘 TypeScript | TypeScript 最佳實踐與慣例   |
| ⚛️ React      | React 元件模式與 Hooks 指引 |
| 🔄 自我疊代   | AI 主動建議記憶/規則更新    |
| 🧩 擴充開發   | SidePilot 專案開發慣例      |
| 🛡️ 絕對安全   | 嚴格變更控制與風險分級      |

#### 使用方式

1. 前往 **Rules** 分頁
2. 選擇樣板或從空白開始撰寫（Markdown 格式）
3. 點擊「儲存規則」（上限 2,200 字元）
4. 可匯入/匯出 `.md` 檔案

<img src="pic/03-rules-tab.png" width="360" alt="規則管理">

</details>

<details>
<summary><b>📸 頁面擷取 (Page Capture)</b></summary>

每個頁面左側邊緣會出現垂直浮動按鈕，提供即時內容擷取：

| 動作           | 說明                                   |
| -------------- | -------------------------------------- |
| **文字內容**   | 保留結構的全頁文字萃取                 |
| **程式碼區塊** | 偵測並萃取頁面中的 Markdown 程式碼區塊 |
| **全頁截圖**   | 擷取可見視窗範圍                       |
| **部分截圖**   | 拖曳框選區域                           |

**使用方式：**

1. 點擊浮動**擷取按鈕**（頁面左側邊緣）
2. 從彈出選單選擇擷取類型
3. 擷取的內容會顯示在側邊面板中
4. 拖曳或貼上至對話輸入框

<table>
  <tr>
    <td align="center"><img src="pic/06-page-capture-text.png" height="200" alt="文字擷取"><br><sub>文字內容</sub></td>
    <td align="center"><img src="pic/07-page-capture-screenshot.png" height="200" alt="截圖擷取"><br><sub>部分截圖</sub></td>
  </tr>
</table>

> **提示：** 在「設定 > 擷取按鍵」中調整按鈕寬度（2–100 px）。

</details>

<details>
<summary><b>🔗 連結守衛 (Link Guard)</b></summary>

連結守衛控制哪些 URL 留在 iframe 內、哪些在新分頁開啟。

| 模式               | 行為                               |
| ------------------ | ---------------------------------- |
| **白名單**（預設） | 只有符合指定前綴的 URL 留在 iframe |
| **黑名單**         | 符合指定前綴的 URL 在新分頁開啟    |

在「設定 > iframe 模式」中設定 URL 前綴，每行一個。

</details>

<details>
<summary><b>💉 上下文注入 (Context Injection)</b></summary>

SDK 模式支援多層上下文注入 — 在每次提示前自動帶入背景資訊：

| 層級                    | 開關                      | 說明                                       |
| ----------------------- | ------------------------- | ------------------------------------------ |
| **Identity**            | `sdkIncludeIdentity`      | AI 自我認知與能力描述                      |
| **Memory**              | `sdkIncludeMemoryEntries` | 最多 5 筆最相關記憶條目（上限 3,600 字元） |
| **Rules**               | `sdkIncludeRules`         | 現行行為指令（上限 2,200 字元）            |
| **System Instructions** | `sdkIncludeSystemMsg`     | Sandbox 系統訊息，引導結構化輸出           |

所有層級可在「設定 > SDK 模式 > Context Injection」中獨立開關。

<img src="pic/05-settings-sdk.png" width="360" alt="上下文注入設定">

</details>

<details>
<summary><b>⚡ Prompt 策略</b></summary>

控制 AI 回應的詳細程度：

| 策略                      | 說明             |
| ------------------------- | ---------------- |
| **一般 (Normal)**         | 完整、詳盡的回應 |
| **精簡 (Concise)**        | 較短、聚焦的回答 |
| **一句話 (One-Sentence)** | 超精簡，單句回覆 |

在「設定 > SDK 模式 > Prompt 策略」中切換。

</details>

---

## 🏗️ 系統架構

<p align="center">
  <img src="pic/10-architecture-diagram.png" width="700" alt="SidePilot 系統架構圖">
</p>

```
┌──────────────────────────────────────────────────────────────┐
│  Chrome Extension (Manifest V3)                              │
│                                                              │
│  ┌──────────┬──────────┬──────────┬────────┬────────┬──────┐ │
│  │ Copilot  │  Rules   │  Memory  │  Logs  │History │ Set. │ │
│  └──────────┴──────────┴──────────┴────────┴────────┴──────┘ │
│                                                              │
│  ┌─────────────────┐    ┌──────────────────────────┐         │
│  │   iframe 模式   │    │       SDK 模式           │         │
│  │  (Copilot Web)  │    │  (sdk-client.js)         │         │
│  └────────┬────────┘    └────────┬─────────────────┘         │
│           │                      │ HTTP / SSE                │
│  ┌────────┴────────┐             │                           │
│  │   Link Guard    │             │                           │
│  │ (content script) │             │                           │
│  └─────────────────┘             │                           │
└──────────────────────────────────┼───────────────────────────┘
                                   │
                       ┌───────────┴───────────┐
                       │   Copilot Bridge      │
                       │   (Express.js + TS)   │
                       │   localhost:31031      │
                       │                       │
                       │  ┌─────────────────┐  │
                       │  │   Supervisor    │  │
                       │  │  (自動重啟)     │  │
                       │  └────────┬────────┘  │
                       │           │            │
                       │  ┌────────┴────────┐  │
                       │  │     Worker      │  │
                       │  │ (HTTP + Sessions)│ │
                       │  └────────┬────────┘  │
                       └───────────┼───────────┘
                                   │ JSON-RPC / stdio
                       ┌───────────┴───────────┐
                       │   Copilot CLI         │
                       │   (copilot --acp)     │
                       └───────────────────────┘
```

### 核心模組

| 模組              | 檔案                     | 職責                              |
| ----------------- | ------------------------ | --------------------------------- |
| SDK Client        | `js/sdk-client.js`       | Bridge HTTP/SSE 通訊              |
| SDK Chat          | `js/sdk-chat.js`         | SDK 模式 UI 與串流顯示            |
| Mode Manager      | `js/mode-manager.js`     | 模式偵測與切換邏輯                |
| Memory Bank       | `js/memory-bank.js`      | 記憶 CRUD、搜尋、篩選             |
| Rules Manager     | `js/rules-manager.js`    | 指令、樣板、匯入匯出              |
| Link Guard        | `js/link-guard.js`       | iframe 邊界控制（content script） |
| VS Code Connector | `js/vscode-connector.js` | URI Scheme 整合                   |
| Automation        | `js/automation.js`       | 頁面擷取與內容萃取                |
| Storage Manager   | `js/storage-manager.js`  | Chrome Storage API 抽象層         |
| Background        | `background.js`          | Service Worker、IPC 路由          |

### 技術堆疊

| 層級          | 技術                                        |
| ------------- | ------------------------------------------- |
| 擴充 UI       | Vanilla JS (ES Modules)、HTML5、CSS3        |
| 樣式          | CSS Variables · GitHub Dark Theme           |
| Bridge Server | TypeScript · Express.js 5.x                 |
| SDK           | `@github/copilot-sdk` ^0.1.8                |
| 通訊協議      | HTTP REST + Server-Sent Events (SSE)        |
| 程序管理      | Supervisor/Worker 模式 + 心跳監控           |
| 儲存          | Chrome Storage API (`chrome.storage.local`) |
| 國際化        | Chrome i18n API (`_locales/`)               |

### Bridge Server 原始碼

| 檔案                 | 角色               | 說明                                                                      |
| -------------------- | ------------------ | ------------------------------------------------------------------------- |
| `supervisor.ts`      | 🛡️ Supervisor      | 程序管理：fork Worker、10s 心跳監控、crash 自動重啟（指數退避，最大 30s） |
| `server.ts`          | 🚀 Worker          | Express HTTP 伺服器，所有 API 路由、SSE 串流、歷史、日誌                  |
| `session-manager.ts` | 🔗 Session Manager | 管理 `copilot --acp --stdio` 子程序，透過 ACP SDK 建立 JSON-RPC 連線      |
| `ipc-types.ts`       | 📋 型別定義        | Supervisor ↔ Worker 的 IPC 訊息介面                                       |

---

## 🔌 API 參考

Bridge Server 在 `http://localhost:31031` 提供 REST + SSE API。

<details>
<summary><b>完整端點列表</b></summary>

### 健康檢查 & 設定

```bash
GET /health              # 伺服器健康檢查
GET /api/config          # 伺服器設定（環境變數、路徑）
GET /api/models          # 可用 AI 模型（10 分鐘快取）
GET /api/models/info     # 詳細模型資訊與能力
```

### Sessions

```bash
POST /api/sessions       # 建立新對話 Session
GET  /api/sessions       # 列出進行中的 Sessions
DELETE /api/sessions/:id # 終止 Session
```

### 對話（串流）

```bash
POST /api/chat
Content-Type: application/json

{
  "sessionId": "abc-123",
  "message": "解釋這段程式碼"
}
```

回傳 Server-Sent Events 串流：

| 事件      | 資料               | 說明         |
| --------- | ------------------ | ------------ |
| `delta`   | `{ content }`      | 增量文字片段 |
| `tool`    | `{ name, status }` | 工具執行進度 |
| `message` | `{ content }`      | 完整回應     |
| `error`   | `{ message }`      | 錯誤訊息     |
| `done`    | `{}`               | 串流結束     |

### 對話（同步）

```bash
POST /api/chat/sync
Content-Type: application/json

{
  "sessionId": "abc-123",
  "message": "解釋這段程式碼"
}
```

回傳 `{ success: true, content: "..." }`（等待完整回應後才回傳）。

### 權限 API

```bash
GET  /api/permissions            # 列出待處理的權限請求
POST /api/permission/resolve     # 核准或拒絕權限
GET  /api/permissions/whitelist  # 取得自動放行清單
POST /api/permissions/whitelist  # 更新白名單
GET  /api/permissions/stream     # SSE 即時通知串流
```

### Prompt 策略

```bash
GET  /api/prompt/strategy        # 取得目前策略（normal/concise/one-sentence）
POST /api/prompt/strategy        # 更新策略
```

### 歷史 & 日誌

```bash
GET  /api/history                # 列出對話歷史
POST /api/history                # 儲存對話
GET  /api/history/stream         # SSE 即時歷史推送
GET  /api/logs                   # 取得日誌
GET  /api/logs/stream            # SSE 即時日誌串流
```

</details>

---

## ⚙️ 設定參考

所有設定都可在側邊面板的「**設定**」分頁中存取，區塊可折疊以方便瀏覽。

<details>
<summary><b>完整設定參考</b></summary>

### 語言

| 設定     | 類型     | 說明                   |
| -------- | -------- | ---------------------- |
| 介面語言 | 下拉選單 | 介面語言（zh-TW / en） |

### Bridge 安裝助手（SDK）

| 設定            | 類型 | 說明                                           |
| --------------- | ---- | ---------------------------------------------- |
| 自動啟動 Bridge | 開關 | 偵測不到 Bridge 時嘗試透過 `sidepilot://` 啟動 |
| 檢查狀態        | 按鈕 | 測試 Bridge Server 連線                        |
| 啟動 Bridge     | 按鈕 | 觸發 Bridge 啟動                               |
| 複製啟動指令    | 按鈕 | 複製 `npm run dev` 指令                        |
| 驗證連線        | 按鈕 | 複製 `curl localhost:31031/health`             |

### 啟動畫面

| 設定         | 類型 | 說明                      |
| ------------ | ---- | ------------------------- |
| 每次播放動畫 | 開關 | 每次開啟都播放 Intro 動畫 |
| 顯示風險提示 | 開關 | 開啟時顯示歡迎與風險聲明  |

### SDK 模式

| 設定                        | 類型   | 說明                                                |
| --------------------------- | ------ | --------------------------------------------------- |
| 首次登入引導                | 開關   | 第一次切換 SDK 時顯示登入提示                       |
| 自我疊代保護                | 開關   | 啟用 BASW 啟動檢測 + SEAL                           |
| Context Injection（主開關） | 開關   | 控制是否注入上下文                                  |
| ├ Identity                  | 開關   | 注入 AI 自述                                        |
| ├ Memory                    | 開關   | 注入記憶庫條目                                      |
| ├ Rules                     | 開關   | 注入行為指令                                        |
| └ System Instructions       | 開關   | 注入 Sandbox 結構化輸出格式                         |
| Structured Output           | 開關   | 使用 `sidepilot_packet` / `assistant_response` 格式 |
| Only Assistant Block        | 開關   | 僅顯示 assistant 回覆區塊                           |
| Prompt 策略                 | 按鈕組 | 一般 / 精簡 / 一句話                                |

### iframe 模式

| 設定     | 類型       | 說明                       |
| -------- | ---------- | -------------------------- |
| URL 前綴 | 文字輸入區 | 白名單前綴清單（每行一個） |

### 擷取按鍵

| 設定     | 類型 | 範圍     | 說明             |
| -------- | ---- | -------- | ---------------- |
| 按鍵寬度 | 滑桿 | 2–100 px | 浮動擷取按鈕寬度 |

### 對話紀錄

| 設定            | 類型 | 說明                      |
| --------------- | ---- | ------------------------- |
| SDK 紀錄路徑    | 文字 | Bridge 對話匯出目錄       |
| iframe 預設 URL | 文字 | iframe 模式的預設頁面 URL |

<img src="pic/04-settings-panel.png" width="360" alt="設定面板總覽">

</details>

---

## ❓ 常見問題

<details>
<summary><b>Q: iframe 和 SDK 模式有什麼差別？</b></summary>

| 面向       | iframe 模式       | SDK 模式                   |
| ---------- | ----------------- | -------------------------- |
| 設定       | 免設定            | 需要 Bridge Server         |
| API        | 嵌入 Copilot 網頁 | 官方 `@github/copilot-sdk` |
| 記憶注入   | ❌                | ✅                         |
| 規則系統   | ❌                | ✅                         |
| 上下文注入 | ❌                | ✅                         |
| 串流       | 網頁原生          | 自定 SSE 實作              |
| 推薦       | 快速使用          | 完整功能                   |

</details>

<details>
<summary><b>Q: iframe 模式安全嗎？</b></summary>

iframe 模式透過移除某些 HTTP 標頭（`X-Frame-Options`、CSP）來嵌入 GitHub Copilot 網頁。這在 GitHub 服務條款上是灰色地帶。**SDK 模式**使用官方 SDK，是推薦的使用方式。

</details>

<details>
<summary><b>Q: Bridge Server 無法啟動怎麼辦？</b></summary>

1. 確認 Node.js 18+：`node --version`
2. 確認 Copilot CLI：`gh copilot --version`
3. 確認已認證：`gh auth status`
4. 檢查端口 31031：`netstat -ano | findstr 31031`
5. 完整重建：`cd scripts/copilot-bridge && rm -rf node_modules dist && npm install && npm run build && npm run dev`

</details>

<details>
<summary><b>Q: SDK 模式顯示「Bridge not connected」</b></summary>

1. 前往「設定 > Bridge 安裝助手」→ 點擊「檢查狀態」
2. 若失敗，啟動 Bridge：`cd scripts/copilot-bridge && npm run dev`
3. 等待終端機顯示 `Server listening on port 31031`
4. 再次點擊「檢查狀態」— 應顯示 ✅

</details>

<details>
<summary><b>Q: iframe 模式顯示空白頁面</b></summary>

- 確認在同一個 Chrome 設定檔中已登入 GitHub
- 需要有效的 GitHub Copilot 訂閱（Free tier 亦可）
- 嘗試重新整理（點擊工具列的首頁圖示）

</details>

<details>
<summary><b>Q: 我的資料儲存在哪裡？</b></summary>

| 資料               | 位置                                 | 隱私           |
| ------------------ | ------------------------------------ | -------------- |
| 設定 / 記憶 / 規則 | `chrome.storage.local`（瀏覽器沙箱） | 僅本機         |
| 對話歷史           | `~/copilot/history/`（可設定）       | 僅本機         |
| Bridge Server      | `localhost:31031`                    | 不離開你的電腦 |

**不會將任何資料傳送至第三方伺服器。**

</details>

<details>
<summary><b>Q: 可以搭配 VS Code 或 Cursor 使用嗎？</b></summary>

可以！點擊任何記憶條目上的 IDE 圖示，即可透過 URI Scheme 傳送。支援：`vscode://`、`cursor://`、`windsurf://`。

</details>

<details>
<summary><b>Q: Memory 和 Rules 有什麼區別？</b></summary>

| 面向 | Memory                             | Rules                            |
| ---- | ---------------------------------- | -------------------------------- |
| 用途 | 具體資料 — 任務、筆記、上下文      | 行為指令 — 語氣、慣例            |
| 注入 | 最多 5 筆，依權重排序              | 單一 Markdown 區塊               |
| 上限 | 總計 3,600 字元（每筆 700）        | 2,200 字元                       |
| 範例 | 「目前衝刺任務」、「API 端點參考」 | 「一律使用 TypeScript 嚴格模式」 |

</details>

---

## 🧭 故障排除

| 症狀                            | 解決方式                                                                    |
| ------------------------------- | --------------------------------------------------------------------------- |
| Bridge Server 無法使用          | 啟動 `scripts/copilot-bridge`（`npm run dev`），確認 `copilot --acp` 可執行 |
| SDK 回傳 HTTP 404               | 確認 Bridge 正在 port `31031` 運行                                          |
| iframe 空白畫面                 | 在同一 Chrome 設定檔登入 GitHub                                             |
| 擷取按鈕不可見                  | 設定 > 擷取按鍵 > 調大按鍵寬度（20+ px）                                    |
| 記憶未注入                      | 啟用「設定 > SDK 模式 > Include Context」主開關                             |
| `EADDRINUSE: port 31031`        | 關閉佔用程序或改 port：`PORT=31032 npm run dev`                             |
| Windows: `spawn copilot ENOENT` | Bridge 已處理 `.cmd` shim（`shell: true`）；確認 `gh copilot` 在 PATH 中    |
| Windows: PowerShell 執行原則    | 執行 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`                  |

---

## 🤝 貢獻

歡迎貢獻！詳見 [Contributing Guide](CONTRIBUTING.md)。

**快速開始：**

1. Fork 此倉庫
2. 建立 feature branch：`git checkout -b feature/my-feature`
3. 在本機修改並測試
4. 以清楚的訊息 commit
5. 開啟 Pull Request

---

## ⚠️ 法律聲明

> 本擴充嵌入 GitHub Copilot 網頁介面（iframe 模式）並使用官方 Copilot CLI SDK（SDK 模式）。使用風險自負，請確認遵守 [GitHub 服務條款](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)。

---

## 📜 授權

本專案採用 [MIT 授權條款](LICENSE)。

---

## 🤖 AI 輔助開發

本專案在 AI 輔助下開發。

**使用的 AI 模型：**

- Claude (Anthropic) — 架構設計、程式碼生成、文件撰寫
- GPT-5 (OpenAI Codex) — 程式碼生成、除錯
- Gemini (Google DeepMind) — 文件撰寫、視覺素材

> **免責聲明：** 作者已盡力審查驗證 AI 生成的程式碼，但無法保證其正確性、安全性或適用於特定用途。使用風險自負。
