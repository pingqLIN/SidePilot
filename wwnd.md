# SidePilot WWND：擴充最小邊界規格（MVP）

> 狀態：Active  
> 最後更新：2026-03-03

---

## 1) 核心決策（不過度開發）

SidePilot 的本體是本地 LLM CLI/Bridge。  
Chrome 擴充只負責「因擴充型態才需要」的能力，不承擔重型治理系統。

---

## 2) 邊界定義

### 2.1 擴充應該做（In Scope）
1. Side Panel UI 與使用者互動。
2. Chrome 專屬能力：頁面讀取、截圖、storage、tab 操作。
3. 最小安全閘：啟動鎖、封印狀態顯示、失敗回退。
4. 本機 Bridge 轉接（呼叫 API、顯示連線狀態）。
5. 規則/記憶來源標示（系統 baseline vs 使用者自建）。

### 2.2 擴充不應該做（Out of Scope）
1. 複雜策略引擎或多層治理編排。
2. 長期監控平台（watchdog/告警系統）本體。
3. 與 CLI 重複的業務決策與任務編排邏輯。
4. 高耦合、不可回滾的大型安全子系統。

---

## 3) MVP 必備能力（已收斂）

### 3.1 啟動保護（L3）
1. 僅在 `selfIterationEnabled=true` 時啟動鎖生效。
2. 啟用時必須通過：
   - manifest seal 格式
   - `selfIterationFirstSealDone=true`
   - settings digest 與 manifest digest 一致
   - 外部完整性驗證 `POST /api/integrity/verify`
3. 任一失敗即 `locked=true`，阻止主要功能啟動。

### 3.2 首次啟用自我疊代
1. `false -> true` 首次切換時執行 `auto-seal`。
2. 成功條件：可解析 digest 且 verify PASS。
3. 失敗時自動回退為停用，不允許半啟用狀態。

### 3.3 狀態可見性
1. 自我疊代開關旁顯示：
   - `已封印`
   - `未封印`
   - `上次失敗原因`
2. Rules 顯示來源：
   - `系統 baseline`
   - `使用者自建`
3. Memory 每筆條目顯示來源：
   - `系統 baseline`
   - `使用者自建`

### 3.4 Baseline 補植（僅一次、不可覆蓋既有資料）
1. Rules：首次且規則為空時，自動套用 `templates/default-rules.md`。
2. Memory：首次啟用自我疊代且記憶為空時，補一筆 `Self-Iteration Baseline`。
3. 若使用者已有內容，禁止覆寫。

---

## 4) 外部腳本最小契約

### 4.1 Integrity
1. `scripts/seal-integrity.mjs`：寫入 `manifest.version_name`。
2. `scripts/verify-integrity.mjs`：回傳 PASS/FAIL/NO SEAL。
3. seal/verify 規則必須同構（manifest 計算均排除 `version_name`）。

### 4.2 Control Plane
1. `scripts/verify-control-plane.mjs` 檢查：
   - `/health`
   - `/api/config`
   - `/api/permissions*`
   - `/api/prompt/strategy`
   - `/api/integrity/verify`

---

## 5) Deferred（先不做）

以下先標記為延後，避免擴充層膨脹：
1. one-time token/nonce 的完整授權框架（目前先用 extension origin 限制）。
2. 長時間連續監控與告警平台。
3. 複雜紅隊行為探針自動化系統。
4. 供應鏈簽章與密鑰生命週期系統。
5. 超出擴充責任範圍的策略治理引擎。

---

## 6) 開發原則（WWND）

1. 先問：這是否是「擴充型態獨有需求」？
2. 若 CLI 可處理，優先放 CLI，不在擴充重做。
3. 每次新增功能需附：
   - 可回滾點
   - 驗證命令
   - 不增加跨模組耦合的理由
4. 預設小步改動，不做一次性大改架構。

---

## 7) 日常命令

```bash
npm run integrity:seal
npm run integrity:verify
npm run control:verify
npm run basw:verify
```

---

## 8) 驗收（MVP）

1. 關閉自我疊代時：擴充正常使用，不套用啟動鎖。
2. 首次啟用自我疊代：
   - seal+verify 成功才啟用。
   - 失敗必回退停用。
3. Rules/Memory 可清楚分辨 `系統 baseline` 與 `使用者自建`。
4. `verify-integrity` 與 `verify-control-plane` 皆可穩定 PASS。

---

## 9) 變更記錄（本次收斂）

1. 文件由 `basw.md` 更名為 `wwnd.md`。
2. 規格改為擴充最小邊界版本，進階治理需求改列 `Deferred`。
3. 新增 Bridge 自動啟動 MVP 設計：`docs/BRIDGE_AUTO_START_DESIGN.md`（採協定啟動器方案）。
4. 新增 Windows 啟動器規格：`docs/BRIDGE_LAUNCHER_SPEC_WINDOWS.md`（安裝/註冊/安全限制/故障排除）。
