# SidePilot Enhancement Plan

## Executive Summary

本計劃涵蓋三大工作區塊：
1. **原始碼糾錯** - 修復現有程式碼中的語法錯誤和亂碼
2. **Feature 1: Copilot Rules 持久化與自動化任務** - 管理 `.github/copilot-instructions.md`
3. **Feature 2: 跨平台記憶庫** - Web ↔ 本地 IDE 任務同步

---

## Part 0: Code Review & Bug Fixes

### 發現的問題清單

| ID | 檔案 | 行號 | 問題描述 | 嚴重性 |
|----|------|------|----------|--------|
| BUG-001 | `sidepanel.html` | 129 | 亂碼字元 `✅ ��援程式碼區塊` | **HIGH** |
| BUG-002 | `background.js` | 76 | 多餘空格 `results[0]?. result` | LOW |
| BUG-003 | `background.js` | 81, 97, 105 | 多餘空格 `err. message` | LOW |
| BUG-004 | `background.js` | 101 | 多餘空格 `success: true` | LOW |
| BUG-005 | `sidepanel.js` | 多處 | Optional chaining 前多餘空格 `?. ` | LOW |
| BUG-006 | `styles.css` | 11 | 錯誤選擇器 `: root` (應為 `:root`) | **MEDIUM** |
| BUG-007 | `styles.css` | 56 | 錯誤選擇器 `. toolbar` | **MEDIUM** |
| BUG-008 | `styles.css` | 多處 | 多處選擇器有錯誤空格 | **MEDIUM** |

### 修復任務

```
[ ] TASK-0.1: Fix sidepanel.html 亂碼 (line 129)
    - 修正: "✅ ��援程式碼區塊" → "✅ 支援程式碼區塊"
    
[ ] TASK-0.2: Fix styles.css 選擇器錯誤
    - `: root` → `:root`
    - `. toolbar` → `.toolbar`
    - `.btn-icon. active` → `.btn-icon.active`
    - (完整清單見下方)
    
[ ] TASK-0.3: Fix JS 檔案多餘空格
    - background.js: 修復 optional chaining 空格
    - sidepanel.js: 修復 optional chaining 空格
```

### styles.css 完整修復清單

```css
/* Line 11 */  `: root` → `:root`
/* Line 56 */  `. toolbar` → `.toolbar`
/* Line 118 */ `.btn-primary: disabled` → `.btn-primary:disabled`
/* Line 156 */ `.btn-icon. active` → `.btn-icon.active`
/* Line 166 */ `. btn-close` → `.btn-close`
/* Line 189 */ `.page-info. visible` → `.page-info.visible`
/* Line 256 */ `.loading-overlay. hidden` → `.loading-overlay.hidden`
/* Line 257 */ `.error-overlay. hidden` → `.error-overlay.hidden`
/* Line 365 */ `. capture-loading` → `.capture-loading`
/* Line 430 */ `.capture-item-value. truncated` → `.capture-item-value.truncated`
/* Line 435 */ `. capture-empty` → `.capture-empty`
/* Line 441 */ `. capture-error` → `.capture-error`
/* Line 501 */ `.welcome-overlay. hidden` → `.welcome-overlay.hidden`
/* Line 565 */ `: :-webkit-scrollbar-track` → `::-webkit-scrollbar-track`
```

---

## Part 1: Copilot Rules 持久化與自動化任務

### 1.1 功能需求

| 需求 ID | 描述 | 優先級 |
|---------|------|--------|
| REQ-1.1 | 在側邊欄提供 Rules 編輯器 UI | HIGH |
| REQ-1.2 | 使用 `chrome.storage.local` 持久化規則 | HIGH |
| REQ-1.3 | 支援匯出為 `.github/copilot-instructions.md` | HIGH |
| REQ-1.4 | 支援從檔案匯入規則 | MEDIUM |
| REQ-1.5 | 提供預設規則範本 | MEDIUM |
| REQ-1.6 | 自動化任務：頁面擷取 → 自動注入 context | LOW |

### 1.2 技術設計

#### 1.2.1 儲存架構

```javascript
// chrome.storage.local 資料結構
{
  "copilot_rules": {
    "content": "# Project Instructions\n...",
    "lastModified": 1705632000000,
    "version": 1
  },
  "rules_templates": [
    { "id": "default", "name": "Default", "content": "..." },
    { "id": "typescript", "name": "TypeScript Project", "content": "..." }
  ],
  "automation_settings": {
    "autoInjectContext": false,
    "contextMaxLength": 5000
  }
}
```

#### 1.2.2 manifest.json 權限更新

```json
{
  "permissions": [
    "sidePanel",
    "activeTab", 
    "scripting",
    "tabs",
    "declarativeNetRequest",
    "storage",           // 新增：持久化儲存
    "downloads"          // 新增：匯出檔案
  ]
}
```

#### 1.2.3 新增檔案結構

```
SidePilot/
├── js/
│   ├── storage-manager.js    # 儲存抽象層
│   ├── rules-manager.js      # Rules CRUD 邏輯
│   └── automation.js         # 自動化任務邏輯
├── templates/
│   └── default-rules.md      # 預設規則範本
├── sidepanel.html            # 更新：新增 Rules 分頁
├── sidepanel.js              # 更新：整合 Rules UI
└── styles.css                # 更新：Rules 編輯器樣式
```

### 1.3 UI 設計

#### 側邊欄分頁結構

```
┌─────────────────────────────────┐
│ [Copilot] [Rules] [Memory]      │  ← Tab Bar
├─────────────────────────────────┤
│                                 │
│  Rules 編輯器區域               │
│  ┌─────────────────────────┐   │
│  │ # My Project Rules      │   │
│  │                         │   │
│  │ ## Code Style           │   │
│  │ - Use TypeScript        │   │
│  │ - 4-space indentation   │   │
│  └─────────────────────────┘   │
│                                 │
│  [儲存] [匯出] [匯入] [範本▼]   │
└─────────────────────────────────┘
```

### 1.4 實作任務清單

```
[ ] TASK-1.1: 建立 storage-manager.js
    - 實作 StorageManager class
    - 方法: save(), load(), delete(), getBytesInUse()
    - 支援 chrome.storage.local 和 chrome.storage.sync
    
[ ] TASK-1.2: 建立 rules-manager.js
    - 實作 RulesManager class
    - 方法: saveRules(), loadRules(), exportAsFile(), importFromFile()
    - 整合 StorageManager
    
[ ] TASK-1.3: 更新 manifest.json
    - 新增 storage, downloads 權限
    
[ ] TASK-1.4: 建立預設規則範本
    - templates/default-rules.md
    - 參考 GitHub Copilot 官方 instructions 格式
    
[ ] TASK-1.5: 更新 sidepanel.html
    - 新增 Tab Bar UI
    - 新增 Rules 編輯器區域
    - 新增工具列按鈕
    
[ ] TASK-1.6: 更新 styles.css
    - Tab Bar 樣式
    - Rules 編輯器樣式 (monaco-editor-like)
    - 工具列按鈕樣式
    
[ ] TASK-1.7: 更新 sidepanel.js
    - 整合 Tab 切換邏輯
    - 整合 RulesManager
    - 實作匯出/匯入功能
    
[ ] TASK-1.8: 建立 automation.js
    - 自動擷取頁面 context
    - 格式化為 Copilot 可用格式
```

---

## Part 2: 跨平台記憶庫 (Web ↔ IDE)

### 2.1 功能需求

| 需求 ID | 描述 | 優先級 |
|---------|------|--------|
| REQ-2.1 | 記憶庫儲存：任務、筆記、context | HIGH |
| REQ-2.2 | 記憶庫搜尋：按標籤、分類、時間 | HIGH |
| REQ-2.3 | 匯出到本地 IDE (VS Code) | HIGH |
| REQ-2.4 | 從 IDE 接收任務 (選項 A: URI Protocol) | HIGH |
| REQ-2.5 | 雙向同步 (選項 B: Native Messaging) | MEDIUM |
| REQ-2.6 | 跨裝置同步 (chrome.storage.sync) | LOW |

### 2.2 架構選項比較

#### 選項 A: URI Protocol (推薦起步方案)

```
┌──────────────┐   vscode://   ┌──────────────┐
│ SidePilot    │ ──────────► │ VS Code      │
│ (Chrome)     │              │ Extension    │
└──────────────┘              └──────────────┘
         │                           │
         │ chrome.storage            │ workspace.fs
         ▼                           ▼
    ┌─────────┐               ┌─────────────┐
    │ Memory  │               │ .tasks/     │
    │ Bank    │               │ files       │
    └─────────┘               └─────────────┘
```

**優點**: 無需安裝 Native Host，實作簡單
**缺點**: 單向通訊 (Chrome → VS Code)

#### 選項 B: Native Messaging (完整雙向方案)

```
┌──────────────┐   stdio    ┌──────────────┐   IPC    ┌──────────────┐
│ SidePilot    │ ────────► │ Native Host  │ ───────► │ VS Code      │
│ (Chrome)     │ ◄──────── │ (Node.js)    │ ◄─────── │ Extension    │
└──────────────┘           └──────────────┘          └──────────────┘
```

**優點**: 完整雙向通訊
**缺點**: 需要安裝 Native Host 和 VS Code Extension

### 2.3 實作方案 (分階段)

#### Phase 2A: 記憶庫核心 (Chrome Extension Only)

```javascript
// memory-bank 資料結構
{
  "memories": {
    "mem_001": {
      "id": "mem_001",
      "type": "task",           // task, note, context, reference
      "title": "Fix login bug",
      "content": "User reported...",
      "tags": ["bug", "auth"],
      "project": "my-app",
      "createdAt": 1705632000000,
      "updatedAt": 1705632000000,
      "status": "pending",       // pending, in_progress, done
      "source": {
        "url": "https://github.com/...",
        "title": "Issue #123"
      }
    }
  },
  "memory_index": {
    "byTag": { "bug": ["mem_001"], "auth": ["mem_001"] },
    "byProject": { "my-app": ["mem_001"] },
    "byStatus": { "pending": ["mem_001"] }
  }
}
```

#### Phase 2B: VS Code 整合 (URI Protocol)

```javascript
// Chrome Extension: 發送任務到 VS Code
function sendToVSCode(memory) {
  const uri = `vscode://sidepilot.vscode-extension?` +
    `action=createTask&` +
    `data=${encodeURIComponent(JSON.stringify(memory))}`;
  window.open(uri, '_blank');
}
```

```typescript
// VS Code Extension: 接收任務
vscode.window.registerUriHandler({
  async handleUri(uri: vscode.Uri) {
    const params = new URLSearchParams(uri.query);
    const action = params.get('action');
    const data = JSON.parse(params.get('data') || '{}');
    
    if (action === 'createTask') {
      await createTaskFile(data);
    }
  }
});
```

#### Phase 2C: Native Messaging (選配)

```
sidepilot-native-host/
├── package.json
├── host.js              # Native Messaging Host
├── install.js           # 安裝腳本 (寫 Registry/config)
└── com.sidepilot.host.json  # Host manifest
```

### 2.4 實作任務清單

```
[ ] TASK-2.1: 建立 memory-bank.js
    - MemoryEntry class
    - MemoryBank class (CRUD, search, indexing)
    - 整合 StorageManager
    
[ ] TASK-2.2: 更新 sidepanel.html
    - 新增 Memory 分頁
    - 記憶列表 UI
    - 新增/編輯記憶表單
    - 搜尋/篩選 UI
    
[ ] TASK-2.3: 更新 styles.css
    - Memory 列表樣式
    - Memory 表單樣式
    - 狀態標籤樣式
    
[ ] TASK-2.4: 更新 sidepanel.js
    - Memory 分頁邏輯
    - 整合 MemoryBank
    
[ ] TASK-2.5: 建立 vscode-connector.js
    - sendToVSCode() function
    - URI 編碼/解碼
    
[ ] TASK-2.6: [Optional] 建立 VS Code Extension
    - sidepilot-vscode/ 專案
    - URI Handler
    - Task Provider
    - Workspace storage
    
[ ] TASK-2.7: [Optional] 建立 Native Messaging Host
    - sidepilot-native-host/ 專案
    - stdio protocol 實作
    - 跨平台安裝腳本
```

---

## Part 3: 新增檔案完整清單

### 3.1 Chrome Extension 新增檔案

| 檔案路徑 | 用途 | 依賴 |
|----------|------|------|
| `js/storage-manager.js` | 儲存抽象層 | - |
| `js/rules-manager.js` | Rules CRUD | storage-manager.js |
| `js/memory-bank.js` | Memory CRUD | storage-manager.js |
| `js/automation.js` | 自動化任務 | rules-manager.js |
| `js/vscode-connector.js` | VS Code 整合 | memory-bank.js |
| `templates/default-rules.md` | 預設規則範本 | - |
| `templates/typescript-rules.md` | TS 專案範本 | - |

### 3.2 VS Code Extension (Optional)

| 檔案路徑 | 用途 |
|----------|------|
| `sidepilot-vscode/package.json` | Extension manifest |
| `sidepilot-vscode/src/extension.ts` | Main entry |
| `sidepilot-vscode/src/uriHandler.ts` | URI Handler |
| `sidepilot-vscode/src/taskProvider.ts` | Task Provider |

### 3.3 Native Host (Optional)

| 檔案路徑 | 用途 |
|----------|------|
| `sidepilot-native-host/package.json` | Node.js config |
| `sidepilot-native-host/host.js` | Native Host |
| `sidepilot-native-host/install.js` | Installer |
| `sidepilot-native-host/com.sidepilot.host.json` | Host manifest |

---

## Part 4: 測試計劃

### 4.1 單元測試

```
[ ] TEST-1: StorageManager
    - save/load 正確性
    - quota 檢查
    
[ ] TEST-2: RulesManager
    - CRUD 操作
    - 匯出/匯入
    
[ ] TEST-3: MemoryBank
    - CRUD 操作
    - 搜尋/篩選
    - Index 更新
```

### 4.2 整合測試

```
[ ] TEST-4: Tab 切換
    - Copilot / Rules / Memory 分頁正常切換
    - 狀態保持
    
[ ] TEST-5: Rules 流程
    - 編輯 → 儲存 → 重載 → 內容一致
    - 匯出檔案可正常下載
    
[ ] TEST-6: Memory 流程
    - 新增 → 編輯 → 搜尋 → 刪除
    - 傳送到 VS Code 正常開啟
```

### 4.3 驗收標準

| 功能 | 驗收標準 |
|------|----------|
| Bug Fixes | 所有 CSS 選擇器正常運作，無亂碼 |
| Rules 編輯 | 可編輯、儲存、匯出 copilot-instructions.md |
| Memory Bank | 可新增、搜尋、匯出任務到本地 |
| VS Code 整合 | 點擊「Send to VS Code」可開啟 VS Code |

---

## Part 5: 實作順序 (建議)

### Milestone 1: Bug Fixes (Day 1)
1. TASK-0.1: Fix HTML 亂碼
2. TASK-0.2: Fix CSS 選擇器
3. TASK-0.3: Fix JS 空格

### Milestone 2: Storage Infrastructure (Day 1-2)
1. TASK-1.1: StorageManager
2. TASK-1.3: manifest.json 權限

### Milestone 3: Rules Feature (Day 2-3)
1. TASK-1.4: 預設範本
2. TASK-1.2: RulesManager
3. TASK-1.5: HTML UI
4. TASK-1.6: CSS 樣式
5. TASK-1.7: JS 整合

### Milestone 4: Memory Bank (Day 3-4)
1. TASK-2.1: MemoryBank
2. TASK-2.2: HTML UI
3. TASK-2.3: CSS 樣式
4. TASK-2.4: JS 整合

### Milestone 5: VS Code Integration (Day 4-5)
1. TASK-2.5: vscode-connector.js
2. TASK-2.6: VS Code Extension (optional)

### Milestone 6: Advanced Features (Day 5+)
1. TASK-1.8: Automation
2. TASK-2.7: Native Messaging (optional)

---

## References

- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)
- [GitHub Copilot Custom Instructions](https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Chrome Native Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging)
- [AGENTS.md Specification](https://agents.md)
