# SidePilot — 人類使用手冊

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR HUMAN                                                   ║
║  Primary reader  : 使用者（搭配 AI 助手一起工作）             ║
║  AI companion    : 必要 — 細節步驟請交給 AI 執行              ║
║  Last updated    : 2026-03-14                                ║
║  AI 技術文件     : docs/USAGE.md                             ║
╚══════════════════════════════════════════════════════════════╝
-->

> **這份文件怎麼用：**
> 你看這份文件，了解「有哪些事情可以做」。
> 細節步驟你不用記 — 直接告訴 AI：**「執行 [計畫名稱]」**，AI 會查技術文件幫你完成。

---

## SidePilot 是什麼

Chrome 瀏覽器側邊欄 AI 助手，讓你在任何網頁旁邊隨時跟 GitHub Copilot 對話。

<p align="center">
  <img src="../pic/22-browser-usage-demo.png" width="860" alt="SidePilot 在瀏覽器旁邊直接對話">
  <br>
  <sub>在 GitHub 旁邊直接與 AI 協作 — 不需要切換分頁</sub>
</p>

兩種模式：

| 模式 | 適合誰 | 需要什麼 |
|------|--------|---------|
| **iframe 模式** | 快速試用、簡單對話 | 只要 GitHub 帳號 |
| **SDK 模式** | 正式開發工作、需要記憶與規則 | Node.js + Copilot CLI |

---

## 計畫清單

> 每個計畫都有名字。跟 AI 說「執行 [計畫名稱]」，AI 就知道要做什麼。

### 計畫A：首次安裝

**你想要：** 第一次把 SidePilot 裝進 Chrome。

告訴 AI：
> 「執行計畫A：首次安裝」

AI 會做的事：clone 專案 → 載入 Chrome 擴充 → 開啟側邊欄。

---

### 計畫B：SDK 模式完整設定

**你想要：** 啟用完整功能（記憶注入、規則、串流回應）。

告訴 AI：
> 「執行計畫B：SDK設定」

AI 會做的事：安裝 Bridge Launcher → 切換 SDK 模式 → 引導 GitHub 登入 → 驗證連線。

**前提條件：** 已完成計畫A。

---

### 計畫C：啟動 Bridge 伺服器

**你想要：** 手動啟動或重新啟動 Bridge。

告訴 AI：
> 「執行計畫C：啟動Bridge」

AI 會做的事：找到正確的啟動指令，依你的環境（Windows / macOS / WSL）給你貼上就能跑的命令。

---

### 計畫D：記憶庫管理

**你想要：** 新增、編輯、搜尋記憶條目；或調整注入設定。

告訴 AI：
> 「執行計畫D：記憶庫 — [你想做的事，例如：新增一筆 Context 條目]」

記憶類型速查：

| 類型 | 放什麼 |
|------|--------|
| Task（任務） | 待辦工作、Bug 追蹤 |
| Note（筆記） | 臨時發現、觀察 |
| Reference（參考） | API 連結、文件網址 |
| Context（上下文） | 環境資訊、專案技術棧 |

---

### 計畫E：規則設定

**你想要：** 設定 AI 的回應風格、編碼慣例。

告訴 AI：
> 「執行計畫E：規則設定 — [描述你的需求，例如：套用 TypeScript 樣板]」

內建樣板：Default / TypeScript / React / 自我疊代 / 絕對安全

---

### 計畫F：頁面擷取

**你想要：** 把目前網頁內容傳給 AI 分析。

<p align="center">
  <img src="../pic/23-github-readme-context.png" width="860" alt="SidePilot 擷取 GitHub README 頁面內容">
  <br>
  <sub>直接把頁面內容擷取傳進對話 — 文字、程式碼、表格都支援</sub>
</p>

做法：點擊網頁左側浮動按鈕 → 選擇擷取方式 → 傳入對話。

你也可以框選截圖區域，直接把局部截圖傳給 AI：

<p align="center">
  <img src="../pic/24-page-capture-crop-detail.png" width="860" alt="頁面截圖擷取 — 拖曳選取區域並傳送到對話">
  <br>
  <sub>拖曳選取範圍 → 預覽 → 下載截圖或傳送到對話</sub>
</p>

如果按鈕找不到，告訴 AI：
> 「執行計畫F：頁面擷取設定」

---

### 計畫G：故障排除

**你遇到：** Bridge 連不上、SDK 模式出錯、登入失敗等問題。

告訴 AI：
> 「執行計畫G：故障排除 — [描述你看到的錯誤]」

常見問題速查：

| 症狀 | 可能原因 |
|------|---------|
| SDK 模式顯示錯誤 | Bridge 沒有在跑 |
| 記憶/規則沒作用 | 你還在 iframe 模式 |
| Bridge 啟動失敗 | Node.js 版本太舊（需要 v24+） |
| 連線顯示 Offline | Repo 路徑設定錯誤 |

---

## 日常工作流程

```
開 Chrome → 點 SidePilot 圖示 → 確認 SDK 模式 → 開始對話
```

Bridge 第一次設定完成後，之後開 Chrome 就會自動啟動，不需要開終端機。

---

## 設定在哪裡

側邊欄 → **Settings 分頁** → 找對應區塊調整。

| 想調整 | 去哪裡 |
|--------|--------|
| Bridge 連線狀態 | Settings → Bridge 安裝助手 |
| 記憶/規則注入開關 | Settings → SDK 模式 |
| 連結守衛規則 | Settings → iframe 模式 |
| 擷取按鈕大小 | Settings → 擷取按鍵 |

---

## 鍵盤快捷鍵

| 動作 | Windows/Linux | macOS |
|------|--------------|-------|
| 開/關側邊欄 | `Alt + Shift + P` | `Opt + Shift + P` |
| 送出訊息 | `Enter` | `Enter` |
| 換行 | `Shift + Enter` | `Shift + Enter` |

---

## 想了解更多

不用自己去翻技術文件 — 直接問 AI：

> 「SidePilot 的 [功能名稱] 是怎麼運作的？」

AI 會查 `docs/USAGE.md`、`docs/FEATURES.md` 等技術文件來回答你。
