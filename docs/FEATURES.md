# SidePilot — 完整功能指南

> **適用版本**：v0.5.0 ｜ **最後更新**：2026-03-04

本文件詳細介紹 SidePilot 擴充的所有功能區域，搭配截圖說明，適合初次使用者與進階用戶參考。

---

## 目錄

1. [概覽](#概覽)
2. [iframe 模式](#iframe-模式)
3. [SDK 模式](#sdk-模式)
4. [記憶庫 (Memory Bank)](#記憶庫-memory-bank)
5. [規則管理 (Rules)](#規則管理-rules)
6. [頁面擷取 (Page Capture)](#頁面擷取-page-capture)
7. [連結守衛 (Link Guard)](#連結守衛-link-guard)
8. [上下文注入 (Context Injection)](#上下文注入-context-injection)
9. [Prompt 策略](#prompt-策略)
10. [Settings 面板](#settings-面板)
11. [Logs & History](#logs--history)
12. [VS Code 整合](#vs-code-整合)

---

## 概覽

SidePilot 是一個 Chrome 擴充功能，將 GitHub Copilot AI 對話助手嵌入瀏覽器的側邊欄，提供兩種運作模式：

| 模式       | 架構                                | 特色                           |
| ---------- | ----------------------------------- | ------------------------------ |
| **iframe** | 直接嵌入 Copilot 網頁               | 零設定、即開即用               |
| **SDK**    | 經由本地 Bridge Server 呼叫官方 API | 完整功能、串流回應、上下文注入 |

<img src="../pic/12-workflow-diagram.png" width="700" alt="使用流程">

---

## iframe 模式

### 運作原理

iframe 模式將 `github.com/copilot` 直接嵌入擴充的側邊面板中。擴充會透過 `declarativeNetRequest` API 移除 `X-Frame-Options` 和 CSP 標頭，使嵌入成為可能。

### 畫面展示

<img src="../pic/01-iframe-mode.png" width="400" alt="iframe 模式主畫面">

### 功能特點

- ✅ 零設定，安裝即用
- ✅ 完整的 Copilot 網頁功能（對話、Agents、Spark）
- ✅ 支援頁面擷取（浮動按鈕）
- ✅ Link Guard 連結控制
- ⚠️ 不支援記憶注入與規則系統
- ⚠️ GitHub ToS 灰色地帶

### 使用情境

- 快速存取 Copilot 對話
- 不需要自訂上下文或規則的簡單使用
- 不想設定 Bridge Server 的使用者

---

## SDK 模式

### 運作原理

SDK 模式透過本地 Bridge Server 與 GitHub Copilot CLI 通訊：

```
Extension ←→ HTTP/SSE ←→ Bridge (localhost:31031) ←→ CLI (copilot --acp) ←→ AI
```

### 畫面展示

<table>
  <tr>
    <td><img src="../pic/02-sdk-chat.png" width="300" alt="SDK 對話"><br><sub>SDK 模式對話畫面</sub></td>
    <td><img src="../pic/09-sdk-initial.png" width="300" alt="首次登入"><br><sub>首次登入引導</sub></td>
  </tr>
</table>

### 功能特點

- ✅ 官方 `@github/copilot-sdk` API
- ✅ 即時 SSE 串流回應
- ✅ 多模型切換（gpt-5.2、claude-sonnet-4.5 等）
- ✅ 記憶庫自動注入
- ✅ 規則系統
- ✅ 多層上下文注入
- ✅ Prompt 策略切換
- ✅ 對話歷史記錄
- ✅ 權限控制（Permission API）

### 使用情境

- 需要完整 AI 開發助手功能
- 需要持久化記憶與自訂行為指令
- 希望控制 AI 回應風格與詳細程度
- 專業開發工作流程

---

## 記憶庫 (Memory Bank)

### 概覽

記憶庫是 SidePilot 的核心功能之一，提供結構化的持久儲存，跨 Session 保存重要資訊。

### 四種條目類型

| 類型                 | 圖示 | 權重 | 用途範例                                |
| -------------------- | ---- | ---- | --------------------------------------- |
| **任務 (Task)**      | 📌   | 1    | 「實作 Login API」、「修復 CSS Bug」    |
| **筆記 (Note)**      | 📝   | 2    | 「發現 X 套件有記憶體洩漏」             |
| **上下文 (Context)** | 🧩   | 4    | 「Node.js 18, Express 5.x, TypeScript」 |
| **參考 (Reference)** | 📎   | 3    | 「API 文件：https://...」               |

### 操作流程

1. 前往 **Memory** 分頁
2. 點擊 **+ 新增**
3. 選擇類型、填寫標題與內容、設定狀態
4. 點擊 **儲存**

### 搜尋與篩選

- **搜尋** — 全文搜尋所有條目
- **類型篩選** — 僅顯示特定類型
- **狀態篩選** — 待處理 / 進行中 / 已完成

### 上下文注入

開啟「Include Memory」後，每次 SDK 對話會自動帶入最多 5 筆最相關條目（依權重排序），上限 3,600 字元。

<img src="../pic/08-sdk-context.png" width="400" alt="上下文注入效果">

---

## 規則管理 (Rules)

### 概覽

規則是長篇行為指令，用於引導 Copilot 的回應風格與內容（僅 SDK 模式）。

### 畫面展示

<img src="../pic/03-rules-tab.png" width="400" alt="Rules 管理介面">

### 內建樣板

| 樣板          | 說明                     | 適用場景            |
| ------------- | ------------------------ | ------------------- |
| 🔧 Default    | 通用編碼助手指令         | 一般開發            |
| 📘 TypeScript | TS 最佳實踐與慣例        | TypeScript 專案     |
| ⚛️ React      | React 元件模式與 Hooks   | React 前端開發      |
| 🔄 自我疊代   | AI 主動建議更新記憶/規則 | 持續改進工作流程    |
| 🧩 擴充開發   | SidePilot 專案開發慣例   | 開發 SidePilot 本身 |
| 🛡️ 絕對安全   | 嚴格變更控制與風險分級   | 高風險環境          |

### 匯入 / 匯出

- **匯出** — 將目前規則下載為 `.md` 檔案
- **匯入** — 從 `.md` 或 `.txt` 檔案載入規則
- 規則以 Markdown 格式撰寫，上限 2,200 字元

---

## 頁面擷取 (Page Capture)

### 概覽

頁面擷取功能透過每個網頁左側邊緣的浮動按鈕觸發，可將當前頁面的內容快速擷取並傳入 Copilot 對話。

### 四種擷取模式

| 模式           | 說明                   | 最適合                             |
| -------------- | ---------------------- | ---------------------------------- |
| **文字內容**   | 萃取全頁文字，保留結構 | 分析文章、文件內容                 |
| **程式碼區塊** | 偵測頁面中的程式碼區塊 | 分析 Stack Overflow、GitHub 程式碼 |
| **全頁截圖**   | 擷取可見視窗           | 記錄 UI 狀態                       |
| **部分截圖**   | 拖曳框選區域           | 擷取特定元素                       |

### 畫面展示

<table>
  <tr>
    <td><img src="../pic/06-page-capture-text.png" width="300" alt="文字擷取"><br><sub>文字內容擷取</sub></td>
    <td><img src="../pic/07-page-capture-screenshot.png" width="300" alt="截圖擷取"><br><sub>部分截圖擷取</sub></td>
  </tr>
</table>

### 擷取後操作

1. 擷取的內容會在側邊面板的擷取面板中顯示
2. 點擊「複製全部內容」即可複製
3. 直接貼到 Copilot 對話輸入框中使用

---

## 連結守衛 (Link Guard)

### 運作原理

Link Guard 是一個 Content Script (`js/link-guard.js`)，監控 iframe 內的連結點擊事件，根據設定決定連結是留在 iframe 內還是在新分頁開啟。

### 模式

| 模式                   | 預設規則            | 行為                       |
| ---------------------- | ------------------- | -------------------------- |
| **白名單 (Allowlist)** | GitHub Copilot URLs | 只有匹配的 URL 留在 iframe |
| **黑名單 (Denylist)**  | —                   | 匹配的 URL 在新分頁開啟    |

### 設定

在「設定 > iframe 模式」中設定 URL 前綴，每行一個。支援結尾萬用字元 `*`。

---

## 上下文注入 (Context Injection)

### 概覽

SDK 模式的核心差異化功能。在每次發送訊息給 Copilot 之前，自動帶入多層背景資訊。

### 注入層級

| 層級                    | 說明                                      | 預設    |
| ----------------------- | ----------------------------------------- | ------- |
| **Identity**            | AI 自我認知描述 — 「我是 SidePilot 助手」 | ✅ 開啟 |
| **Memory**              | 記憶庫條目（最多 5 筆，3,600 字元）       | ✅ 開啟 |
| **Rules**               | 行為指令（2,200 字元）                    | ✅ 開啟 |
| **System Instructions** | Sandbox 結構化輸出格式                    | ✅ 開啟 |

### 畫面展示

<img src="../pic/05-settings-sdk.png" width="400" alt="Context Injection 設定">

### 結構化輸出

啟用 Structured Output 後，AI 回應會包裝在 `sidepilot_packet` + `assistant_response` 格式中，擴充會解析並渲染。

---

## Prompt 策略

### 三種模式

| 策略   | API 值         | 後綴                       | 效果             |
| ------ | -------------- | -------------------------- | ---------------- |
| 一般   | `normal`       | 無                         | 完整、詳盡的回應 |
| 精簡   | `concise`      | 附加「請精簡回覆」指示     | 較短的重點回答   |
| 一句話 | `one-sentence` | 附加「僅用一句話回覆」指示 | 極簡回覆         |

### 設定位置

「設定 > SDK 模式 > Prompt 策略」中切換按鈕組。

---

## Settings 面板

### 概覽

所有偏好設定集中在「Settings」分頁，採用可折疊區塊設計。

### 畫面展示

<img src="../pic/04-settings-panel.png" width="400" alt="Settings 面板">

### 區塊列表

| 區塊            | 說明                           | 預設狀態 |
| --------------- | ------------------------------ | -------- |
| 語言            | 介面語言切換                   | 展開     |
| Bridge 安裝助手 | 健康檢查、啟動指令             | 展開     |
| 啟動畫面        | Intro 動畫、風險提示           | 折疊     |
| SDK 模式        | Context Injection、Prompt 策略 | 折疊     |
| iframe 模式     | Link Guard URL 前綴            | 折疊     |
| 擷取按鍵        | 浮動按鈕寬度                   | 折疊     |
| 對話紀錄        | 歷史路徑設定                   | 折疊     |

---

## Logs & History

### Logs 分頁

即時顯示 Bridge Server 的運行日誌，支援：

- 依等級篩選（Error / Warn / Info）
- 全文搜尋
- 複製與清除

### History 分頁

- **SDK 模式** — 顯示 Bridge Server 儲存的對話歷史，按日期分組
- **iframe 模式** — 顯示 Copilot Agents 連結

---

## VS Code 整合

### 運作原理

Memory Bank 的每筆條目都可透過 URI Scheme 傳送至 IDE。

### 支援的 IDE

| IDE      | URI Scheme    |
| -------- | ------------- |
| VS Code  | `vscode://`   |
| Cursor   | `cursor://`   |
| Windsurf | `windsurf://` |

### 使用方式

在記憶條目的 Modal 中，點擊下方的「VS Code」按鈕即可將條目內容傳送至 IDE。
