# 擴充端開發模式 (Extension Development Mode)

## 專案結構
- `extension/` — Chrome Extension 主體（MV3）
  - `sidepanel.js` — 主要前端邏輯
  - `sidepanel.html` — Side Panel UI
  - `styles.css` — 全域樣式（GitHub Dark 主題）
  - `background.js` — Service Worker
  - `js/` — 模組（sdk-client, rules-manager, memory-bank 等）
- `scripts/copilot-bridge/` — Bridge Server（TypeScript → dist/）
- `templates/` — 規則樣板檔案
- `tests/` — Jest 測試

## 開發指令
- 測試：`$env:NODE_OPTIONS="--experimental-vm-modules"; npx jest --no-cache`
- Bridge 編譯：`cd scripts/copilot-bridge && npm run build`
- Vendor 打包：`npm run build:vendor`

## 編碼慣例
- 使用 CSS 變數（`--bg-primary`, `--accent-blue` 等）
- DOM 參照統一存放於 `dom` 物件
- 事件監聽集中於 `setupEventListeners()`
- 模組匯出使用 named export
- Bridge API 路徑：`/api/chat`, `/api/chat/sync`, `/api/permissions/*`, `/api/prompt/strategy`

## 修改檢查清單
- [ ] 修改 server.ts 後必須重新 `npm run build`
- [ ] 新增 HTML 元素後在 `init()` 加入 DOM ref
- [ ] CSS 新增遵循既有區塊結構（有標題分隔）
- [ ] Windows 環境 spawn 外部命令需 `shell: true`
- [ ] iframe 切換用 `display:none` 不用 `visibility:hidden`

## 測試要求
- 修改後執行完整測試套件確認不破壞既有功能
- 新功能應有對應測試案例
- 使用 `jest.fn()` mock Chrome API
