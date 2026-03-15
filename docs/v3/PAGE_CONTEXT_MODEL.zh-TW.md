# SidePilot v3 — 頁面上下文模型

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / language model agent       ║
║  Purpose         : 定義 SidePilot v3 可實作的即時頁面        ║
║                    上下文 schema                             ║
║  Confidence      : HIGH — 可落地 schema 草案               ║
║  Last updated    : 2026-03-15                                ║
╚══════════════════════════════════════════════════════════════╝
-->

> **相關文件：** [ARCHITECTURE.md](ARCHITECTURE.md) · [BROWSER_CONTROL_API.md](BROWSER_CONTROL_API.md) · [DEV_MODE.md](DEV_MODE.md) · [../../v3/shared/schemas/page-context.v1.schema.json](../../v3/shared/schemas/page-context.v1.schema.json)

---

## 目的

這份文件把 v3 的頁面上下文想法，收斂成工程端可以直接實作、驗證、版本化與注入提示的 schema，而不是讓欄位語意在各處自由生長。

這個封包應該要同時滿足：

- 足夠精簡，能安全放進 prompt
- 足夠穩定，能被程式與測試依賴
- 足夠可檢視，能在 UI 中預覽
- 足夠明確，能被瀏覽器驗證與 dev mode 共用

目標不是鏡像整個 DOM，而是把目前頁面狀態整理成一份有邊界、可檢閱、對 Agent 有用的標準化摘要。

---

## 設計目標

| 目標 | 說明 |
| ---- | ---- |
| Ambient | 常見的頁面上下文應該能在不必每次手動擷取的情況下取得 |
| Structured | Agent 接收的應該是具名欄位，而不是原始文字傾倒 |
| Compact | 輸出應優先保留摘要、選取區塊與重點區域，而不是整頁完整複製 |
| Inspectable | 使用者應能預覽哪些上下文將被注入 |
| Fresh | 上下文應暴露其觀測時間，以及它可能有多過期 |
| Bounded | 敏感或高噪音資料在注入前應先被過濾或受控 |
| Versioned | 欄位演進必須透過明確版本，而不是靜默漂移 |

---

## Schema 狀態

| 欄位 | 值 |
| ---- | ---- |
| 正式 schema ID | `sidepilot.page-context/v1` |
| 機器可讀 schema | `v3/shared/schemas/page-context.v1.schema.json` |
| JSON Schema 方言 | Draft 2020-12 |
| 預期產生端 | extension · bridge · hybrid pipeline |
| 預期消費端 | prompt 組裝 · side panel 預覽 · browser control · dev mode |

---

## 實作輪廓

### MVP 輪廓

MVP 產生端應輸出下列所有頂層欄位；就算某些值是 `null`、空陣列或保守預設值，也不應省略。

| 欄位 | 必填 | 備註 |
| ---- | ---- | ---- |
| `schemaVersion` | 是 | 必須等於 `sidepilot.page-context/v1` |
| `packetId` | 是 | 供快取、追蹤與 action log 使用 |
| `source` | 是 | 封包由誰、用什麼方式產生 |
| `pageIdentity` | 是 | 基本頁面識別資訊 |
| `semanticSummary` | 是 | 有邊界的頁面語意摘要 |
| `selectedRegion` | 是 | 沒有高訊號選取時為 `null` |
| `notableBlocks` | 是 | 浮出的區塊陣列，可為空 |
| `pageIntentGuess` | 是 | 若信心不足可為 `null` |
| `freshness` | 是 | 擷取時間、失效原因、TTL |
| `privacy` | 是 | 遮罩與審閱中繼資料 |

### 與現行實作的對齊

目前 `extension/sidepanel.js` 的 live packet builder，已經輸出接近 v3 的子集合：

- `pageIdentity`
- `semanticSummary`
- `selectedRegion`
- `notableBlocks`
- `pageIntentGuess`
- `freshness`

要升級到 v3 schema，主要還需要補上：

- `schemaVersion`
- `packetId`
- `source`
- `privacy`
- 穩定化的列舉值與正規化規則

---

## 擬議輸入來源

| 來源 | 範例 | 備註 |
| ---- | ---- | ---- |
| 分頁識別 | tab ID、URL、origin、route、title | 每個封包的基礎識別資訊 |
| 導航事件 | route change、reload、history update | 用於讓過期摘要失效 |
| 頁面結構 | headings、sections、paragraphs、lists、tables | 會被提煉成語義摘要 |
| 程式碼區域 | `pre`、`code`、diff blocks、snippets | 只抽取重點或被選取的區塊 |
| 選取 / 焦點 | selected text、focused input、active element | 高訊號的使用者意圖來源 |
| 視窗範圍狀態 | scroll segment、visible region hints | 用來回答「我現在正在看哪裡？」 |
| 使用者註記 | pinned notes、task tags、manual hints | 由使用者提供的可選附加層 |

---

## 正式封包結構

### 頂層契約

| 欄位 | 型別 | 用途 |
| ---- | ---- | ---- |
| `schemaVersion` | string | schema 名稱與版本 |
| `packetId` | string | 封包唯一識別碼 |
| `source` | object | 產生通道、擷取模式與 extractor 資訊 |
| `pageIdentity` | object | 標準頁面識別資訊 |
| `semanticSummary` | object | 頁面與主要區段摘要 |
| `selectedRegion` | object or `null` | 目前最具訊號的選取 / 焦點區域 |
| `notableBlocks` | array | 值得浮出的程式碼、表格或 UI 片段 |
| `pageIntentGuess` | string or `null` | 標準化後的頁面用途推測 |
| `freshness` | object | 擷取時間、失效原因、TTL、是否過期 |
| `privacy` | object | 遮罩層級、受控欄位、是否需要審閱 |

### 穩定列舉值

#### `source.channel`

- `extension`
- `bridge`
- `hybrid`

#### `source.captureMode`

- `ambient`
- `manual_capture`
- `selection_refresh`
- `route_refresh`
- `dev_verify`

#### `pageIntentGuess`

- `general_page_review`
- `read_documentation`
- `read_source_file`
- `review_code_changes`
- `triage_issue`
- `change_settings`

#### `selectedRegion.kind`

- `selection`
- `focused_input`
- `code_block`
- `diff_hunk`
- `table_region`

#### `notableBlocks[].kind`

- `code`
- `table`
- `list`
- `form`
- `diff_hunk`
- `ui_fragment`

#### `freshness.reason`

- `initial_capture`
- `same_route_same_selection`
- `route_changed`
- `selection_changed`
- `visible_ui_changed`
- `manual_refresh`
- `live_observation_disabled`

#### `privacy.redactionLevel`

- `none`
- `standard`
- `strict`

---

## 欄位定義

### `source`

| 欄位 | 型別 | 必填 | 備註 |
| ---- | ---- | ---- | ---- |
| `channel` | enum | 是 | `extension`、`bridge`、`hybrid` |
| `captureMode` | enum | 是 | 封包是怎麼產生的 |
| `extractor` | string | 否 | 例如 `basic`、`defuddle`、`readability` |
| `observerVersion` | string | 否 | 方便追 extraction regression |

### `pageIdentity`

| 欄位 | 型別 | 必填 | 備註 |
| ---- | ---- | ---- | ---- |
| `title` | string | 是 | 正規化後最長 160 字元 |
| `url` | string | 是 | 完整頁面 URL |
| `origin` | string | 是 | URL origin；若拿不到可為空字串 |
| `routeHint` | string or `null` | 否 | 例如 `github.pull_request` |
| `tabId` | integer or `null` | 否 | extension 端的 tab ID |
| `extractor` | string or `null` | 否 | 為了貼近現行實作而暫時保留 |

### `semanticSummary`

| 欄位 | 型別 | 必填 | 備註 |
| ---- | ---- | ---- | ---- |
| `kind` | string or `null` | 否 | 例如 `code_review`、`docs_page` |
| `summary` | string or `null` | 是 | 最長 1200 字元 |
| `sections` | string[] | 是 | 最多 12 個 section label，每個最多 80 字元 |
| `wordCount` | integer | 是 | 可為 `0` |
| `charCount` | integer | 是 | 可為 `0` |
| `confidence` | number or `null` | 否 | 範圍 `0..1` |

### `selectedRegion`

若存在，應該描述目前最具訊號的單一活動區域。

| 欄位 | 型別 | 必填 | 備註 |
| ---- | ---- | ---- | ---- |
| `kind` | enum | 是 | `selectedRegion.kind` 中的其中一個值 |
| `label` | string or `null` | 否 | 給預覽介面顯示的名稱 |
| `text` | string | 是 | 正規化後最長 2000 字元 |
| `selectorHint` | string or `null` | 否 | 選用的 DOM selector hint |

### `notableBlocks[]`

| 欄位 | 型別 | 必填 | 備註 |
| ---- | ---- | ---- | ---- |
| `kind` | enum | 是 | `notableBlocks[].kind` 中的其中一個值 |
| `label` | string | 是 | 最長 80 字元 |
| `language` | string or `null` | 否 | 主要用在 code / diff 區塊 |
| `preview` | string or `null` | 否 | 最長 500 字元 |
| `selectorHint` | string or `null` | 否 | 選用的 DOM selector hint |

### `freshness`

| 欄位 | 型別 | 必填 | 備註 |
| ---- | ---- | ---- | ---- |
| `capturedAt` | date-time string | 是 | 主要觀測時間 |
| `lastValidatedAt` | date-time string or `null` | 否 | 後續驗證時間 |
| `stale` | boolean | 是 | 是否已被視為過期 |
| `reason` | enum | 是 | 為什麼被標成目前這個狀態 |
| `ttlMs` | integer | 是 | 建議的 freshness window |

### `privacy`

| 欄位 | 型別 | 必填 | 備註 |
| ---- | ---- | ---- | ---- |
| `reviewRequired` | boolean | 是 | 是否應先經過預覽 / 審閱 |
| `redactionLevel` | enum | 是 | `none`、`standard`、`strict` |
| `gatedFields` | string[] | 是 | 需要更強審閱的欄位或區域 |

---

## 正規化規則

這些規則是 schema 契約的一部分，不是可有可無的 producer 行為。

1. 預覽型文字欄位要壓縮重複空白。
2. 所有字串欄位在輸出前都要 trim。
3. 選用語意欄位優先使用 `null`，不要用空字串混淆語意。
4. 陣列欄位優先輸出空陣列，而不是直接省略。
5. 太長的摘要、選取內容與 preview 應在封包輸出前截斷。
6. 不可把明顯的帳密或秘密值直接放進 `selectedRegion.text` 或 `notableBlocks[].preview`。

---

## 建議預算

| 欄位 | 建議上限 |
| ---- | -------- |
| `pageIdentity.title` | 160 字元 |
| `semanticSummary.summary` | 1200 字元 |
| `semanticSummary.sections` | 12 筆 |
| `selectedRegion.text` | 2000 字元 |
| `notableBlocks` | 8 筆 |
| `notableBlocks[].preview` | 500 字元 |

這些上限是依照 prompt 成本設計的；producer 可以更保守，但不應在不升版的情況下放寬。

---

## 範例封包

```json
{
  "schemaVersion": "sidepilot.page-context/v1",
  "packetId": "page-context:active:2026-03-15T10:20:00.000Z",
  "source": {
    "channel": "extension",
    "captureMode": "ambient",
    "extractor": "defuddle",
    "observerVersion": "v3-mvp"
  },
  "pageIdentity": {
    "title": "SidePilot Pull Request Review",
    "url": "https://github.com/pingqLIN/SidePilot/pull/123",
    "origin": "https://github.com",
    "routeHint": "github.pull_request",
    "tabId": 417,
    "extractor": "defuddle"
  },
  "semanticSummary": {
    "kind": "code_review",
    "summary": "Open pull request with changed extension and bridge files.",
    "sections": ["description", "changed files", "review comments"],
    "wordCount": 842,
    "charCount": 5114,
    "confidence": 0.86
  },
  "selectedRegion": {
    "kind": "diff_hunk",
    "label": "extension/sidepanel.js",
    "text": "Selected lines from the active diff",
    "selectorHint": null
  },
  "notableBlocks": [
    {
      "kind": "code",
      "label": "mode-manager.js diff",
      "language": "javascript",
      "preview": "Highlighted changes in mode detection and bridge probing.",
      "selectorHint": null
    }
  ],
  "pageIntentGuess": "review_code_changes",
  "freshness": {
    "capturedAt": "2026-03-15T10:20:00Z",
    "lastValidatedAt": null,
    "stale": false,
    "reason": "same_route_same_selection",
    "ttlMs": 30000
  },
  "privacy": {
    "reviewRequired": false,
    "redactionLevel": "standard",
    "gatedFields": []
  }
}
```

---

## 新鮮度與失效條件

這個封包應該要能揭露它是否仍忠實反映目前頁面。

| 觸發條件 | 預期行為 |
| -------- | -------- |
| URL 或 route 改變 | 重建封包識別與語義摘要 |
| 選取內容改變 | 優先更新 `selectedRegion` |
| 可見 UI 發生實質變化 | 將摘要標記為 stale，並要求重新觀測 |
| 使用者停用即時觀測 | 凍結封包並停止背景更新 |

新鮮度判定仍應保持輕量；這個封包只需要提供足夠的中繼資料，讓 Agent 與使用者判斷上下文是否可信。

---

## 隱私與遮罩

預設行為應偏向「最小擷取」。

| 規則 | 用途 |
| ---- | ---- |
| 預設避免原始整頁傾倒 | 降低提示噪音與意外擷取敏感資訊的風險 |
| 將表單與可編輯欄位視為受控區域 | 需要更強的審閱或顯式納入 |
| 將使用者生成的密碼或憑證標記為遮罩目標 | 絕不把明顯祕密直接注入提示 |
| 在 side panel 提供預覽介面 | 讓觀測過程保持可見、可理解 |

---

## 整合期望

- 擴充功能應以作用中的分頁上下文為單位，快取最近一次有效的封包。
- 提示組裝應注入具名的 `[Live Page Context]` 區塊，而不是未結構化的大型文字塊。
- 瀏覽器控制與 dev-mode 工作流應能引用同一份封包，作為共享證據來源。
- 產生端應在封包進入 UI 或 prompt 前，先通過 `page-context.v1.schema.json` 驗證。

---

## Schema 演進規則

1. 新增必填欄位需要升版。
2. 新增選填欄位只要不破壞相容性，可以維持同一主版本。
3. 收緊列舉值需要升版。
4. Prompt 組裝應根據 `schemaVersion` 決定行為，而不是靠猜欄位是否存在。

---

## 目前待決問題

1. 哪些欄位永遠適合自動注入，哪些應只在預覽後才納入？
2. 頁面文字應保留多少原文，多少應先摘要化？
3. 封包生成應採 extension-only、bridge-assisted，或在較重摘要情境下採 hybrid 模式？
