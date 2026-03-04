# SidePilot Bridge Launcher 規格（Windows）

> 狀態：MVP Implemented  
> 日期：2026-03-05  
> 目的：提供 `sidepilot://start-bridge` 協定啟動本機 Bridge 的最小實作規格

---

## 1) 目標

1. 讓 Extension 在 SDK 模式下可按需喚起本機 Bridge。
2. 不讓協定啟動器執行任意命令。
3. 失敗時可診斷、可重試、可手動回退。

---

## 2) 安裝方式

### 2.1 Launcher 形式
1. `launcher.cmd + launcher.ps1` 組合（目前實作）。
2. 安裝路徑建議：
   - `%LOCALAPPDATA%\SidePilot\BridgeLauncher\`
3. 建議附加安裝腳本：
   - `install-launcher.ps1`
   - `uninstall-launcher.ps1`

### 2.2 已落地檔案（repo）
1. `scripts/bridge-launcher/windows/sidepilot-bridge-launcher.ps1`
2. `scripts/bridge-launcher/windows/install-launcher.ps1`
3. `scripts/bridge-launcher/windows/uninstall-launcher.ps1`
4. `scripts/bridge-launcher/windows/test-launcher.ps1`
5. `scripts/bridge-launcher/windows/README.md`

### 2.3 依賴
1. Node.js 18+
2. `C:\Dev\Projects\SidePilot\scripts\copilot-bridge` 可讀取

---

## 3) 協定註冊

註冊 `sidepilot://` 至 Launcher（Windows Registry）：

```reg
Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\sidepilot]
@="URL:SidePilot Protocol"
"URL Protocol"=""

[HKEY_CLASSES_ROOT\sidepilot\shell]

[HKEY_CLASSES_ROOT\sidepilot\shell\open]

[HKEY_CLASSES_ROOT\sidepilot\shell\open\command]
@="\"%LOCALAPPDATA%\\SidePilot\\BridgeLauncher\\sidepilot-bridge-launcher.exe\" \"%1\""
```

說明：
1. 只接受 `sidepilot://start-bridge` 路徑。
2. 非 allowlist 參數直接拒絕（exit code 非 0）。

---

## 4) 啟動命令

### 4.1 Launcher 內部固定命令
1. 工作目錄：
   - `C:\Dev\Projects\SidePilot\scripts\copilot-bridge`
2. 啟動命令（MVP）：
   - `npm run dev`
3. 或可切為生產：
   - `npm start`

### 4.2 互斥策略
1. 啟動前先檢查 `31031` 埠口。
2. 若已有 SidePilot Bridge，直接成功返回，不重複啟動。
3. 加入本機 mutex（例如 `Global\SidePilotBridgeLauncherLock`）。

---

## 5) 安全限制（必須）

1. 不接受外部傳入 command/path。
2. 僅允許：
   - path: `start-bridge`
   - query keys: `source`, `v`
3. query value 長度限制（例如 <= 32）。
4. 啟動器禁止 shell 拼接（避免 command injection）。
5. 記錄安全 log（不含敏感資訊）：
   - 啟動時間、來源、結果、錯誤碼。

---

## 6) 回傳與錯誤碼

建議 Launcher 內部錯誤碼：

1. `LCH-001` 協定 path 不合法
2. `LCH-002` query 參數不合法
3. `LCH-003` 無法存取 bridge 工作目錄
4. `LCH-004` npm/node 不可用
5. `LCH-005` Bridge 啟動失敗
6. `LCH-006` 已在執行（視為成功）

Extension 對應：
1. `BRG-AUTO-001` 協定喚起失敗/被阻擋
2. `BRG-AUTO-002` 喚起後等待 Bridge 就緒逾時
3. `BRG-AUTO-003` 冷卻中

---

## 7) 故障排除

### 7.1 點擊啟動無反應
1. 檢查 `sidepilot://` 註冊是否存在。
2. 重新執行 `install-launcher.ps1`。
3. 確認瀏覽器未封鎖外部協定提示。

### 7.2 協定有觸發但 Bridge 仍未就緒
1. 手動執行：
   - `cd /d C:\Dev\Projects\SidePilot\scripts\copilot-bridge`
   - `npm install`
   - `npm run dev`
2. 使用 `Invoke-RestMethod http://localhost:31031/health` 檢查。
3. 檢查埠口是否被其他程式占用。

### 7.3 啟動器路徑錯誤
1. 查看 Registry `command` 路徑是否正確。
2. 確認 Launcher 執行檔仍在安裝目錄。

---

## 8) 驗收

1. 在瀏覽器開啟 `sidepilot://start-bridge?source=manual&v=1` 可觸發啟動。
2. Bridge 未啟動時，12 秒內可回到 `GET /health = ok`。
3. 連續觸發不會產生多個 Bridge 進程。
4. 非法路徑（例如 `sidepilot://foo`）會被拒絕並記錄。

---

## 9) 本次實作測試紀錄（2026-03-05）

1. `test-launcher.ps1`：4 個 case 全部 PASS（`LCH-001/LCH-002/OK-DRYRUN`）。
2. `install-launcher.ps1`：已完成註冊  
   `HKCU\Software\Classes\sidepilot\shell\open\command` 正確指向：
   `"C:\Users\miles\AppData\Local\SidePilot\BridgeLauncher\sidepilot-bridge-launcher.cmd" "%1"`
3. 以 `.cmd` 直接觸發 `sidepilot://start-bridge` 後，`/health` 回應 `status=ok`。
4. 重複觸發回應 `LCH-006: Bridge already running`。
