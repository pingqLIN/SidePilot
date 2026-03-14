# SidePilot — 快速上手（人類版）

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR HUMAN                                                   ║
║  Primary reader  : 使用者（搭配 AI 助手一起工作）             ║
║  AI companion    : 必要 — 細節步驟請交給 AI 執行              ║
║  Last updated    : 2026-03-14                                ║
║  AI 技術文件     : docs/guide/getting-started/README.md      ║
╚══════════════════════════════════════════════════════════════╝
-->

> **怎麼用這份文件：**
> 你選好要做什麼，然後把對應的指令貼給 AI。
> AI 會查技術文件，幫你完成所有細節步驟。

---

<p align="center">
  <img src="../../../pic/22-browser-usage-demo.png" width="860" alt="SidePilot 瀏覽器使用示意">
  <br>
  <sub>SidePilot 開啟後，你就可以在任何頁面旁邊直接與 AI 對話</sub>
</p>

---

## 我想要什麼？

### 只是想快速試用

告訴 AI：
> 「執行計畫A：首次安裝」

完成後就能用 iframe 模式（直接在 Chrome 側邊欄開 GitHub Copilot）。
**不需要任何額外設定。**

---

### 我想要完整功能（記憶、規則、串流）

告訴 AI：
> 「執行計畫A：首次安裝，然後執行計畫B：SDK設定」

完成後你會有：
- 記憶庫（跨對話保存資訊）
- 規則系統（告訴 AI 怎麼回應你）
- 即時串流回應
- 多模型切換

<p align="center">
  <img src="../../../pic/23-github-readme-context.png" width="860" alt="SDK 模式下擷取 GitHub 頁面並傳入對話">
  <br>
  <sub>SDK 模式開啟後，可以直接把頁面內容傳入 AI 對話</sub>
</p>

---

### Bridge 沒有自動啟動

告訴 AI：
> 「執行計畫C：啟動Bridge」

AI 會根據你的環境（Windows / macOS / WSL）給你確切的啟動指令。

---

### 出現錯誤

告訴 AI：
> 「執行計畫G：故障排除 — [描述你看到的錯誤訊息]」

---

## 頁面截圖擷取

SidePilot 支援拖曳選取網頁區域截圖，直接傳入對話：

<p align="center">
  <img src="../../../pic/24-page-capture-crop-detail.png" width="860" alt="頁面截圖擷取功能">
  <br>
  <sub>「頁面內容擷取」面板 — 拖曳選取範圍 → 下載截圖 或 傳送到對話</sub>
</p>

---

## 之後每天怎麼用

```
開 Chrome → SidePilot 圖示 → 確認右上角是 SDK → 開始聊
```

Bridge 設定完成後會自動啟動，不用再開終端機。

---

## 想知道更多

不用自己翻文件。直接問 AI：

> 「SidePilot 的記憶庫怎麼運作？」
> 「我要怎麼設定規則？」
> 「頁面擷取功能怎麼用？」
