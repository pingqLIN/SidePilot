# SidePilot 開發計畫書

## 專案名稱

SidePilot - Chrome 側邊欄 AI 助手

## 版本目標

v2.0 - 雙模式架構（iframe + 官方 SDK）

---

## 目標

### 主要目標

提供「官方 SDK 模式」與「網頁嵌入模式」雙軌切換，透過 `@github/copilot-sdk` 接入官方 Copilot CLI。

### 具體目標

| #   | 目標           | 說明                                  |
| --- | -------------- | ------------------------------------- |
| 1   | **合規化**     | 透過官方 Copilot SDK 提供合法存取管道 |
| 2   | **雙模式切換** | 用戶可自由選擇 SDK 或 iframe 模式     |
| 3   | **視覺一致性** | 兩種模式維持相同外觀與操作體驗        |
| 4   | **向下相容**   | 保留現有 iframe 模式供快速使用        |

---

## 架構

```text
Chrome Extension (sdk-client.js)
       ↓ HTTP / SSE
  Copilot Bridge (scripts/copilot-bridge)
       ↓ JSON-RPC
  Copilot CLI (managed by @github/copilot-sdk)
```

## 模式比較

| 面向     | 🔒 SDK 模式                         | ⚡ iframe 模式 |
| -------- | ----------------------------------- | -------------- |
| 法律地位 | ✅ 官方支援                         | ⚠️ 灰色地帶    |
| 帳號風險 | ✅ 無                               | ⚠️ 有風險      |
| 前置需求 | Copilot CLI + Bridge Server         | 無             |
| 功能     | Streaming, Custom Tools, 多 Session | 網頁原生功能   |
| 適用場景 | 長期使用                            | 快速體驗       |

---

## 已完成

- [x] **M1**: 模式切換 UI 與基礎架構
- [x] **M2**: 官方 SDK Bridge Server（`@github/copilot-sdk`）
- [x] **M3**: SDK Chat UI + SSE Streaming 支援
- [x] **擷取功能**: 頁面內容、截圖、程式碼區塊擷取
- [x] **Memory Bank**: 任務管理、VS Code 整合
- [x] **Rules 管理**: 模板、匯入匯出

## 待完成

- [ ] Bridge Server 實測（需 Copilot CLI）
- [ ] `npm install` 依賴安裝（copilot-bridge）
- [ ] 對話歷史持久化（SDK 模式）
- [ ] 手動模式切換 UI 完善
- [ ] Context Injection（Memory ↔ Copilot 整合）
- [ ] Chrome Web Store 發布準備

---

_最後更新: 2026-02-13_
