# Chrome 擴充程式開發：可做 / 不可做事項（精簡版）

> 依你的要求，僅保留「作為 Chrome 擴充程式開發過程，可能額外碰觸到的事項」；其餘已刪除。

## 可做（可以）

1. 可以修改 Extension 主體檔案
- 範圍：`extension/sidepanel.js`、`extension/sidepanel.html`、`extension/styles.css`、`extension/background.js`、`extension/js/*`
- 來源：`extension/templates/extension-dev-rules.md`

2. 可以修改 Bridge Server，但改完要重建
- 規則：修改 `scripts/copilot-bridge/src/server.ts` 後，需執行 `npm run build`
- 來源：`extension/templates/extension-dev-rules.md`

3. 可以新增 UI 元素，但要同步 DOM 初始化
- 規則：新增 HTML 元素後，要在 `init()` 補上 DOM reference
- 來源：`extension/templates/extension-dev-rules.md`

4. 可以做 iframe 顯示切換，但用 `display:none`
- 規則：iframe 切換用 `display:none`，不要用 `visibility:hidden`
- 來源：`extension/templates/extension-dev-rules.md`

5. 可以在 Windows spawn 外部命令，但需 `shell: true`
- 來源：`extension/templates/extension-dev-rules.md`

6. 可以做功能修改，但要補測試並跑完整測試
- 規則：新功能要有測試案例，並執行完整測試套件；Chrome API 以 `jest.fn()` mock
- 來源：`extension/templates/extension-dev-rules.md`

## 不可做（不可以）

1. 不可任意擴大「移除網站安全標頭」的影響範圍
- 現有規則只針對 `*://github.com/*` + `sub_frame`，移除 `X-Frame-Options` 與 `Content-Security-Policy`
- 不可在未審查下擴大 `urlFilter`、`resourceTypes` 或新增其他網域
- 來源：`extension/rules.json`

2. 不可把「header 移除規則」當作通用解法濫用
- 僅限 extension 既有設計目的（GitHub 子框架顯示）
- 非必要場景不可新增同類規則
- 來源：`extension/rules.json` + `extension/templates/extension-dev-rules.md`（專案脈絡）

## 備註
- 本文件只保留 Chrome 擴充程式開發特有條目。
- 一般通用安全治理（例如高風險同意、憑證保護、推送流程）已依你的指示不再重述。

