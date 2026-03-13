<p align="center">
  <img src="docs/banner.webp" width="1000" alt="SidePilot — 瀏覽器側邊欄 GitHub Copilot 擴充">
</p>

<h1 align="center">SidePilot</h1>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/Version-0.5.0-blue?style=flat-square">
  <img alt="Chrome" src="https://img.shields.io/badge/Chrome-114+-4285F4?style=flat-square&logo=google-chrome&logoColor=white">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Manifest-V3-34a853?style=flat-square">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-24+-339933?style=flat-square&logo=node.js&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square">
</p>

<p align="center">
  <b>一個把 GitHub Copilot 放進瀏覽器側邊欄的 Chrome 擴充功能 —— 讓你在原本的工作頁面旁邊，直接完成對話、擷取與上下文協作。</b>
</p>

<p align="center">
  <a href="#-sidepilot-是什麼">簡介</a> &bull;
  <a href="#-產品畫面預覽">預覽</a> &bull;
  <a href="#-核心功能一覽">功能</a> &bull;
  <a href="#-快速安裝">安裝</a> &bull;
  <a href="#-文件分頁">文件</a> &bull;
  <a href="docs/guide/api/README.zh-TW.md">API</a> &bull;
  <a href="docs/SCREENSHOTS.md">截圖</a>
</p>

<p align="center">
  <a href="README.md">English</a> &bull;
  <a href="docs/guide/README.zh-TW.md">文件導覽中心</a> &bull;
  <a href="docs/guide/getting-started/README.zh-TW.md">快速開始</a> &bull;
  <a href="docs/guide/concepts/README.zh-TW.md">核心觀念</a> &bull;
  <a href="docs/SCREENSHOTS.md">截圖導覽</a>
</p>

---

## 🧭 SidePilot 是什麼？

SidePilot 是一個 **Chrome 擴充功能**（Manifest V3），把 GitHub Copilot AI 助手放進瀏覽器的側邊面板。核心目標很簡單：**讓你在原本工作的地方就能跟 AI 協作。**

你在看文件、審 PR、查問題、逛後台頁面時，不需要一直切分頁或跳工具；SidePilot 會待在旁邊，並把目前頁面的內容更快帶進對話裡。

### 它解決什麼問題

- **不用切分頁** — AI 就在目前頁面旁邊
- **雙模式工作流** — 先用 iframe 模式快速上手，再升級到 SDK 模式
- **上下文擷取更直接** — 從瀏覽器直接抓文字、程式碼區塊、截圖
- **記憶可持續** — 任務、筆記、參考資料可以跨 Session 保存
- **規則可塑形** — 用樣板與規則約束 AI 行為
- **本機優先** — bridge 跑在 `localhost`，資料流更容易掌握

### 適合誰

- 在瀏覽器裡做研究與開發的人
- 需要持久上下文的重度 AI 使用者
- 想先零設定、之後再升級的人
- 使用 Windows / WSL 本機工具鏈的進階使用者

---

## 📸 產品畫面預覽

<table>
  <tr>
    <td width="33%" align="center">
      <img src="pic/01-iframe-mode.png" width="280" alt="iframe 模式預覽"><br>
      <b>側邊欄立即可用</b><br>
      <sub>把 Copilot 放進瀏覽器側邊欄，快速開始。</sub>
    </td>
    <td width="33%" align="center">
      <img src="pic/02-sdk-chat.png" width="280" alt="SDK 對話預覽"><br>
      <b>SDK 串流對話</b><br>
      <sub>切到本地 bridge 後，取得更完整的模型、串流與控制力。</sub>
    </td>
    <td width="33%" align="center">
      <img src="pic/03-rules-tab.png" width="280" alt="Rules 預覽"><br>
      <b>規則可塑形</b><br>
      <sub>用樣板與自訂指令，讓 AI 回應更貼近你的工作方式。</sub>
    </td>
  </tr>
  <tr>
    <td width="33%" align="center">
      <img src="pic/06-page-capture-text.png" width="280" alt="頁面擷取預覽"><br>
      <b>所見即所擷取</b><br>
      <sub>直接從網頁抓文字、程式碼區塊與截圖。</sub>
    </td>
    <td width="33%" align="center">
      <img src="pic/08-sdk-context.png" width="280" alt="上下文注入預覽"><br>
      <b>上下文更黏著</b><br>
      <sub>把記憶、規則與擷取內容一起帶進每次 SDK 提示。</sub>
    </td>
    <td width="33%" align="center">
      <img src="pic/09-sdk-initial.png" width="280" alt="Bridge 引導預覽"><br>
      <b>進階模式也不難</b><br>
      <sub>從快速上手自然過渡到 bridge 工作流。</sub>
    </td>
  </tr>
</table>

> 2026-03-13 新補的最新版 UI 截圖，已登錄在 [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md) 與 [pic/INDEX.md](pic/INDEX.md)。

---

## 🎯 核心功能一覽

| 功能 | 你會得到什麼 | 對應截圖 |
| --- | --- | --- |
| **雙模式** | iframe 免設定、SDK 進階串流與上下文能力 | `pic/01-iframe-mode.png`, `pic/02-sdk-chat.png` |
| **記憶庫** | 任務、筆記、參考與上下文可重複利用 | `pic/08-sdk-context.png` |
| **規則與樣板** | 用 Markdown 指令穩定 AI 回應風格 | `pic/03-rules-tab.png` |
| **頁面擷取** | 直接從瀏覽器抓文字、程式碼、截圖 | `pic/06-page-capture-text.png` |
| **Bridge 自動啟動** | SDK 模式更容易拉起本地 bridge | `pic/09-sdk-initial.png` |

> 想看完整巡覽，請打開 [docs/FEATURES.md](docs/FEATURES.md)。

---

## 🚀 快速安裝

### 1. 安裝

```bash
git clone https://github.com/pingqLIN/SidePilot.git
cd SidePilot
npm install
npm run build:vendor
```

### 2. 載入到 Chrome

1. 開啟 `chrome://extensions/`
2. 啟用 **開發人員模式**
3. 點擊 **載入未封裝項目**
4. 選擇 `extension/` 資料夾

### 3. 選擇模式

| 模式 | 設定成本 | 最適合 |
| --- | --- | --- |
| **iframe** | 幾乎零設定 | 想快速開始使用 Copilot |
| **SDK** | 需要本地 bridge | 需要串流、記憶、規則與進階控制 |

> 詳細設定請看 [docs/USAGE.zh-TW.md](docs/USAGE.zh-TW.md)。

---

## 🗂️ 文件分頁

README 現在刻意維持精簡，定位成入口頁。真正的詳細內容請往 `docs/` 走。

| 分頁 | 適合用途 | 連結 |
| --- | --- | --- |
| 使用手冊 | 安裝、設定與日常操作 | [docs/USAGE.zh-TW.md](docs/USAGE.zh-TW.md) |
| 快速開始 | 安裝、載入擴充與第一次選模式 | [docs/guide/getting-started/README.zh-TW.md](docs/guide/getting-started/README.zh-TW.md) |
| 核心觀念 | 理解 modes、memory、rules 與本地 bridge 模型 | [docs/guide/concepts/README.zh-TW.md](docs/guide/concepts/README.zh-TW.md) |
| API | bridge 的 auth、chat、permission、backup 端點 | [docs/guide/api/README.zh-TW.md](docs/guide/api/README.zh-TW.md) |
| 功能總覽 | 模式、模組與能力拆解 | [docs/FEATURES.md](docs/FEATURES.md) |
| 文件導覽中心 | 文件首頁與分類索引 | [docs/guide/README.zh-TW.md](docs/guide/README.zh-TW.md) |
| 截圖導覽 | UI 走讀與視覺展示 | [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md) |
| 截圖索引 | 精選截圖與最新版原始擷圖 | [pic/INDEX.md](pic/INDEX.md) |

## 🧩 先選模式

- **iframe 模式**：你想一分鐘內開始用，就選它。
- **SDK 模式**：你想把功能開滿，就選它。

## 🔎 建議閱讀順序

1. 先看這份 README，理解產品定位
2. 打開 [docs/guide/getting-started/README.zh-TW.md](docs/guide/getting-started/README.zh-TW.md) 走最快設定路線
3. 打開 [docs/guide/concepts/README.zh-TW.md](docs/guide/concepts/README.zh-TW.md) 建立心智模型
4. 打開 [docs/FEATURES.md](docs/FEATURES.md) 看完整功能巡覽
5. 若要碰 bridge 或工具整合，再看 [docs/guide/api/README.zh-TW.md](docs/guide/api/README.zh-TW.md)

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
