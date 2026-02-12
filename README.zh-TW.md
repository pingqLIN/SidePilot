# SidePilot

[English](README.md)

> 🚧 **開發中** - 目前處於 v2.0 架構重構階段

**SidePilot** 是一個 Chrome 擴充功能，讓 GitHub Copilot 常駐於瀏覽器側邊欄，提供持續的 AI 協助，不會因為切換分頁而中斷。

![Chrome](https://img.shields.io/badge/Chrome-114+-4285F4?style=flat&logo=google-chrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ 功能特色

- **🎯 雙模式架構**
  - **iframe 模式**: 直接嵌入 GitHub Copilot 網頁（需登入 GitHub）
  - **SDK 模式**: 透過本地 Proxy Server 連接 Copilot API（開發中）
- **📝 Rules 管理**: 自訂 AI 行為規則，支援匯入/匯出與模板
- **🧠 Memory Bank**: 儲存任務、筆記、參考資料，支援一鍵傳送至 VS Code
- **📋 頁面擷取**: 底部浮動按鈕一鍵擷取當前頁面的標題、內容、程式碼區塊
- **⌨️ 快捷鍵**: `Alt+Shift+P` 快速開啟側邊欄
- **✈️ 飛行員風格**: 專屬飛行員 Logo，GitHub Dark Theme 介面

---

## 🚀 快速開始

### 安裝擴充功能

1. **下載或克隆專案**

   ```powershell
   git clone https://github.com/yourusername/SidePilot.git
   cd SidePilot
   ```

2. **在 Chrome 中載入**
   - 開啟 `chrome://extensions/`
   - 啟用「開發人員模式」
   - 點擊「載入未封裝項目」
   - 選擇 `SidePilot/extension` 目錄

3. **開啟側邊欄**
   - 點擊擴充功能圖示，或
   - 按下 `Alt+Shift+P`（Windows/Linux）或 `Opt+Shift+P`（Mac）

---

## 🔧 SDK 模式設定（選用）

SDK 模式需要本地 Proxy Server 將 Copilot API 轉換為 OpenAI 相容格式。

### 啟動 Proxy Server

```powershell
# 1. 進入 proxy server 目錄
cd scripts/github-copilot-proxy

# 2. 安裝依賴
npm install

# 3. 設定 GitHub Copilot Token（詳見 SETUP.md）
# 推薦使用 OAuth Device Flow:
gh auth login
gh api /copilot_internal/v2/token --jq '.token' > .env-token
echo "COPILOT_TOKEN=$(cat .env-token)" > .env
echo "PORT=3000" >> .env

# 4. 啟動 server
npm run dev
```

完整設定教學請參考 [scripts/github-copilot-proxy/SETUP.md](scripts/github-copilot-proxy/SETUP.md)

---

## 📚 專案結構

```text
SidePilot/
├── extension/              # Chrome Extension 主體
│   ├── manifest.json      # 擴充功能配置
│   ├── sidepanel.html     # 側邊欄 UI（3 tabs: Copilot, Rules, Memory）
│   ├── sidepanel.js       # 主要邏輯
│   ├── styles.css         # 樣式（GitHub dark theme）
│   ├── background.js      # Service Worker
│   ├── rules.json         # Header 剝除規則（iframe 模式）
│   └── js/                # 功能模組
│       ├── mode-manager.js       # 模式偵測與切換
│       ├── sdk-client.js         # SDK API 客戶端
│       ├── rules-manager.js      # 規則管理
│       ├── memory-bank.js        # 記憶庫
│       ├── storage-manager.js    # Chrome Storage 封裝
│       ├── automation.js         # 自動化腳本注入
│       └── vscode-connector.js   # VS Code 整合
│
├── scripts/
│   ├── github-copilot-proxy/  # OpenAI-compatible Proxy Server
│   │   ├── SETUP.md           # 詳細設定教學
│   │   ├── src/
│   │   │   ├── server.ts      # Express 主程式
│   │   │   ├── routes/        # API 路由
│   │   │   ├── services/      # Copilot API 服務
│   │   │   └── utils/         # 訊息格式轉換
│   │   └── package.json
│   │
│   └── tests/                 # 單元測試（Vanilla JS）
│       ├── run-tests.html     # 測試執行器
│       ├── storage-manager.test.js
│       ├── rules-manager.test.js
│       └── memory-bank.test.js
│
├── docs/
│   └── DEVELOPMENT_PLAN.md    # v2.0 開發計畫（4 階段里程碑）
│
└── README.md
```

---

## 🧪 測試

### 單元測試（瀏覽器）

```powershell
# 在瀏覽器中開啟測試執行器
start chrome "file:///C:/Dev/Projects/SidePilot/scripts/tests/run-tests.html"
```

點擊「Run Tests」按鈕執行 18 個測試（storage, rules, memory bank）。

### 手動測試

參考 [scripts/tests/MANUAL_TESTS.md](scripts/tests/MANUAL_TESTS.md) 進行完整的手動驗證流程。

---

## 📖 功能說明

### 1️⃣ Copilot Tab

- **iframe 模式**（預設）：直接嵌入 `github.com/copilot`
- **SDK 模式**（需啟動 proxy）：自動偵測 `localhost:3000` 並切換
- **Mode Badge**：tab-bar 右側顯示當前模式（SDK=綠色 / iframe=藍色）
- **浮動擷取按鈕**：底部中央的擷取按鈕，一鍵擷取當前頁面內容

### 2️⃣ Rules Tab

- 編輯 AI 行為規則（Markdown 格式）
- 套用內建模板（Web 開發、程式碼審查等）
- 匯入/匯出 `.txt` 規則檔案

### 3️⃣ Memory Tab

- 建立四種類型條目：Task / Note / Context / Reference
- 搜尋與篩選功能
- 一鍵傳送至 VS Code（透過 `vscode://` 協議）

---

## ⚠️ 法律聲明

> **重要**: SidePilot 透過移除 HTTP Header 的方式嵌入 GitHub Copilot 網頁介面，此行為可能違反 GitHub 服務條款。使用本擴充功能需**自行承擔風險**，包括但不限於帳號停用、服務中斷等可能後果。
>
> 本專案僅供教育與研究用途，不建議用於生產環境。

---

## 🛠️ 開發狀態

當前版本：**v2.0 Alpha**

### ✅ 已完成（Phase 1: 穩定化 + UI 重設計）

- [x] 修復 `renderMemoryList` 重複定義
- [x] 補齊 CSS 變數定義（GitHub dark theme）
- [x] 統一 SDK port 為 3000
- [x] 建立 `.gitignore`
- [x] UI 重設計：簡化工具列、飛行員 Logo、浮動擷取按鈕
- [x] 修復 manifest `type: module`（關鍵 Bug）
- [x] 註冊鍵盤快捷鍵 `Alt+Shift+P`
- [x] Memory Tab 加入「Send to VS Code」按鈕
- [x] Mode Badge 移至 tab-bar 右側

### 🚧 進行中（Phase 2: SDK 模式）

- [ ] Proxy Server 實測（需 GitHub Copilot Token）
- [ ] 實作 SDK Chat UI（取代 iframe）
- [ ] 對話歷史管理
- [ ] 手動模式切換 UI

### 📅 規劃中

- **Phase 3**: Context Injection、Memory ↔ Copilot 整合、VS Code Extension
- **Phase 4**: 自動化測試、Chrome Web Store 發布

詳見 [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md)

---

## 🤝 貢獻

歡迎提交 Issue 與 Pull Request！

開發規範：

- 使用 TypeScript（Proxy Server）與 Vanilla JavaScript（Extension）
- 遵循 ES6+ 模組化設計
- 所有 Chrome API 調用需錯誤處理
- 新增功能需補充單元測試

---

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE) 檔案

---

## 🙏 致謝

- **GitHub Copilot** - AI 核心引擎
- **[BjornMelin/github-copilot-proxy](https://github.com/BjornMelin/github-copilot-proxy)** - Proxy Server 基礎架構
- **Chrome Extensions API** - MV3 平台支援

---

## 📮 聯絡

如有問題或建議，歡迎開 Issue 或 Email 至 `your-email@example.com`

---

_最後更新: 2026-02-11_ <!-- last updated -->
