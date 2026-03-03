# SidePilot — 安裝與設定指南 (PP)

> **適用版本**：v0.4.x ｜ **最後更新**：2026-03-03

---

## 目錄

1. [前置需求](#1-前置需求)
2. [下載與安裝擴充](#2-下載與安裝擴充)
3. [iframe 模式（零設定）](#3-iframe-模式零設定)
4. [SDK 模式設定](#4-sdk-模式設定)
5. [首次使用流程](#5-首次使用流程)
6. [常見問題 FAQ](#6-常見問題-faq)
7. [故障排除](#7-故障排除)

---

## 1. 前置需求

| 項目 | 最低要求 | 備註 |
|------|----------|------|
| Chrome 瀏覽器 | **114+** | 需支援 Manifest V3 + Side Panel API |
| 作業系統 | Windows / macOS / Linux | Windows 環境有額外注意事項（見 §7） |
| Node.js | **18.0.0+**（僅 SDK 模式） | 建議使用 LTS 版本（20.x / 22.x） |
| GitHub 帳號 | 需有 Copilot 授權 | Free / Pro / Enterprise 皆可 |
| GitHub CLI | 已安裝並登入（僅 SDK 模式） | `gh auth login` 完成 |

---

## 2. 下載與安裝擴充

### 步驟

1. **取得原始碼**
   ```bash
   git clone https://github.com/aspect-one/SidePilot.git
   cd SidePilot
   ```

2. **打包 Vendor 檔案**（首次需要）
   ```bash
   npm install
   npm run build:vendor
   ```
   > 產出 `extension/js/vendor-content-cleaner.js`（~118KB）

3. **載入擴充至 Chrome**
   - 開啟 `chrome://extensions/`
   - 右上角啟用「**開發人員模式**」
   - 點擊「**載入未封裝項目**」
   - 選擇專案中的 `extension/` 資料夾

4. **驗證安裝**
   - 工具列應出現 SidePilot 圖示
   - 按下 `Alt+Shift+P`（macOS：`Opt+Shift+P`）開啟側邊面板

### ⚠️ 可能遇到的問題

| 問題 | 原因 | 解法 |
|------|------|------|
| 「Manifest version not supported」 | Chrome 版本過舊 | 更新至 114 以上 |
| 載入後圖示未出現 | 擴充被停用 | `chrome://extensions/` 確認開關已啟用 |
| 「Service Worker registration failed」 | 路徑錯誤 | 確認選擇的是 `extension/` 資料夾，不是專案根目錄 |
| vendor 檔案找不到 | 未執行 build:vendor | 執行 `npm run build:vendor` 後重新載入擴充 |

---

## 3. iframe 模式（零設定）

安裝完成後即可使用 **iframe 模式**，無需額外設定。

- 側邊面板上方模式切換：選擇 `iframe`
- 直接嵌入 `github.com/copilot` 頁面
- 支援頁面內容擷取（浮動按鈕）

### ⚠️ 可能遇到的問題

| 問題 | 原因 | 解法 |
|------|------|------|
| iframe 顯示空白 | 未登入 GitHub | 先在新分頁登入 github.com |
| 「Refused to display in a frame」 | CSP 限制 | 擴充的 declarativeNetRequest 應自動處理；若仍有問題，重新載入擴充 |
| 打字時 iframe 不接受輸入 | 焦點問題 | 點擊 iframe 區域再開始輸入 |

---

## 4. SDK 模式設定

SDK 模式提供完整功能：記憶注入、規則系統、權限控制、歷史記錄。

### 4.1 安裝 Bridge Server

```bash
cd scripts/copilot-bridge
npm install
npm run build          # TypeScript 編譯
npm run dev            # 啟動（預設 port 31031）
```

> Bridge 啟動後會監聽 `http://localhost:31031`

### 4.2 GitHub Copilot CLI 認證

```bash
# 安裝 GitHub CLI（若尚未安裝）
# Windows: winget install GitHub.cli
# macOS: brew install gh

gh auth login          # 選擇 GitHub.com → HTTPS → 瀏覽器登入
gh extension install github/gh-copilot   # 安裝 Copilot 擴充
gh copilot --version   # 驗證安裝
```

### 4.3 擴充端設定

1. 側邊面板切換至 `sdk` 模式
2. 首次切換會彈出登入引導，點擊「立即開啟 GitHub 登入頁」
3. 進入「⚙️ 設定」分頁 →「Bridge 安裝助手」
   - 點擊「1. 檢查狀態」確認 Bridge 連線
   - 狀態應顯示 ✅ 綠色

### ⚠️ 可能遇到的問題

| 問題 | 原因 | 解法 |
|------|------|------|
| Bridge 檢查顯示 ❌ | Bridge 未啟動 | 確認終端機已執行 `npm run dev` |
| `EADDRINUSE: port 31031` | 端口被佔用 | 關閉佔用程序或改用 `PORT=31032 npm run dev` |
| `spawn copilot ENOENT` | Copilot CLI 未安裝 | 執行 `gh extension install github/gh-copilot` |
| Windows 下 CLI 啟動失敗 | npm 全域 .cmd shim | Bridge 已處理（`shell: true`），若仍失敗確認 PATH 設定 |
| 「Copilot session expired」 | Token 過期 | 重新 `gh auth login` |
| `npm run build` 報錯 | TypeScript 版本不符 | 刪除 `node_modules` 後重新 `npm install` |

---

## 5. 首次使用流程

### 5.1 基本對話
1. 開啟側邊面板（`Alt+Shift+P`）
2. 選擇模式（iframe / sdk）
3. 在輸入框輸入訊息 → 送出

### 5.2 功能分頁導覽

| 分頁 | 功能 | 備註 |
|------|------|------|
| 💬 Copilot | 對話主畫面 | iframe / SDK 雙模式 |
| 📋 規則 | 行為指令編輯 | 可套用樣板、匯入/匯出 |
| 🧠 記憶 | 上下文條目管理 | 自動注入對話 prompt |
| 📊 Logs | Bridge 運行日誌 | SDK 模式專用 |
| 🗂️ 歷史 | 對話歷史記錄 | 自動記錄、按日期分組 |
| ⚙️ 設定 | 偏好設定 | Bridge 助手、Identity 自述 |

### 5.3 上下文注入設定
- 設定分頁 →「Context Injection」區塊
- 主開關控制是否注入記憶/規則/Identity
- 各子項目可獨立開關

### 5.4 規則樣板

| 樣板 | 用途 |
|------|------|
| Default | 通用編碼規範 |
| TypeScript | TS 最佳實踐 |
| React | React 元件指引 |
| 🔄 自我疊代 | AI 主動建議記憶/規則更新 |
| 🧩 擴充開發 | SidePilot 專案開發慣例 |
| 🛡️ 絕對安全 | 嚴格變更控制與風險分級 |

---

## 6. 常見問題 FAQ

### Q: iframe 和 SDK 模式有什麼差別？
**iframe** 模式直接嵌入 GitHub Copilot 網頁，零設定即可使用，但功能受限（無記憶注入、無規則系統）。**SDK** 模式透過本地 Bridge Server 通訊，支援完整功能。

### Q: 需要付費嗎？
SidePilot 本身免費開源。但需要有效的 GitHub Copilot 訂閱（Free tier 亦可）。

### Q: 資料儲存在哪裡？
- 設定/記憶/規則：`chrome.storage.local`（瀏覽器本機沙箱）
- 對話歷史：`~/copilot/history/`（本機檔案系統，可透過環境變數 `SIDEPILOT_HISTORY_DIR` 修改）
- **不會上傳至任何第三方伺服器**

### Q: 可以同時開啟多個 SidePilot 嗎？
每個 Chrome 視窗可開啟一個側邊面板。多個面板共用同一個 Bridge Server 實例。

### Q: 如何更新擴充？
```bash
git pull origin main
npm run build:vendor           # 若 vendor 有更新
cd scripts/copilot-bridge && npm run build  # 若 bridge 有更新
```
然後在 `chrome://extensions/` 點擊擴充卡片上的 🔄 重新載入。

---

## 7. 故障排除

### 7.1 Bridge 無法啟動

```bash
# 檢查 Node 版本
node -v    # 應 >= 18.0.0

# 檢查端口佔用
# Windows:
netstat -ano | findstr 31031
# macOS/Linux:
lsof -i :31031

# 完整重建
cd scripts/copilot-bridge
rm -rf node_modules dist
npm install
npm run build
npm run dev
```

### 7.2 SDK 對話無回應

1. 確認 Bridge 狀態：設定 →「1. 檢查狀態」
2. 檢查 Copilot CLI：`gh copilot --version`
3. 檢查認證：`gh auth status`
4. 查看 Logs 分頁是否有錯誤訊息
5. 重啟 Bridge Server

### 7.3 擴充載入報錯

| 錯誤訊息 | 解法 |
|----------|------|
| `Cannot read properties of undefined` | 清除擴充儲存：`chrome.storage.local.clear()` 於 DevTools Console |
| `Uncaught SyntaxError` | 確認使用 Chrome 114+，不支援舊版語法 |
| `net::ERR_CONNECTION_REFUSED` | Bridge 未啟動或端口不符 |

### 7.4 Windows 特有問題

- **npm 全域指令找不到**：確認 `%APPDATA%\npm` 在 PATH 中
- **PowerShell 執行原則**：執行 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
- **長路徑限制**：啟用 Windows 長路徑支援或將專案放在短路徑下

### 7.5 macOS 特有問題

- **首次安裝 gh CLI**：若 `brew install gh` 失敗，嘗試 `brew update` 後重試
- **Keychain 彈窗**：`gh auth login` 時可能要求 Keychain 存取權限，請允許

---

## 附錄：快速檢查清單

```
□ Chrome 114+ 已安裝
□ extension/ 已載入為未封裝擴充
□ vendor bundle 已建置（npm run build:vendor）
□ 側邊面板可開啟（Alt+Shift+P）
□ iframe 模式可正常顯示 Copilot

--- 以下為 SDK 模式 ---
□ Node.js 18+ 已安裝
□ GitHub CLI 已安裝並登入（gh auth status）
□ Copilot CLI 擴充已安裝（gh copilot --version）
□ Bridge 已編譯（npm run build）
□ Bridge 已啟動（npm run dev → port 31031）
□ 設定分頁 Bridge 狀態顯示 ✅
□ SDK 模式可正常對話
```
