# SidePilot 快速開始

> 給第一次看到這個專案的你：從安裝、理解到開始使用所需的一切 — 不需要先搞懂內部架構。

---

## 目錄

- [我需要 Bridge 嗎？](#我需要-bridge-嗎)
- [SidePilot 的兩種用法](#sidepilot-的兩種用法)
- [Bridge 到底是什麼](#bridge-到底是什麼)
- [Bridge 在電腦哪裡](#bridge-在電腦哪裡)
- [設定裡該填什麼路徑](#設定裡該填什麼路徑)
- [怎麼知道 extension 有沒有連上 Bridge](#怎麼知道-extension-有沒有連上-bridge)
- [建議的第一次安裝流程](#建議的第一次安裝流程)
- [新手常見錯誤](#新手常見錯誤)

---

## 我需要 Bridge 嗎？

**簡短回答：不需要，先試試看再說。**

SidePilot 有兩種模式。其中一種不需要任何額外設定就能用；另一種需要一個跑在本機的小型伺服器（也就是 Bridge）。

| 我想要… | 需要 Bridge 嗎？ |
| --- | --- |
| 打開 SidePilot 跟 Copilot 聊天 | **不需要** |
| 第一次安裝試用 | **不需要** |
| 使用串流回應、記憶庫或規則 | **需要** |
| 把頁面內容注入提示詞或執行進階功能 | **需要** |

先不用 Bridge 開始，等你想要進階功能時再加。

---

## SidePilot 的兩種用法

### iframe 模式 — 零設定

SidePilot 把 GitHub Copilot 的網頁介面直接嵌進瀏覽器側邊欄。你用到的就是和 `github.com/copilot` 一樣的 Copilot，只是它會一直掛在你瀏覽時的旁邊。

**你會得到：**
- 完整 Copilot 對話介面
- 快速操作（Task、Spark、Git、Pull Requests）
- 跨頁面持續顯示的側邊欄

**你需要：**
- 安裝 Chrome extension
- 有 Copilot 訂閱的 GitHub 帳號
- 沒別的了

### SDK 模式 — 需要 Bridge

SidePilot 透過官方 SDK 和 GitHub Copilot 溝通，中間透過一個跑在本機的伺服器（Bridge）轉接。這個模式能解鎖網頁介面做不到的功能。

**額外獲得：**
- 串流回應（字跑出來的那種即時感）
- 記憶庫（任務、筆記、參考資料可以自動注入提示詞）
- 規則（你的自訂指令會跟著每條訊息走）
- 頁面擷取內容注入
- 模型選擇完整控制

**額外需要：**
- Node.js 24 以上
- 已安裝並登入的 GitHub Copilot CLI
- 執行中的 Bridge（extension 可以自動幫你啟動）

---

## Bridge 到底是什麼

Bridge 是一個用 Node.js 寫的小型本機 HTTP 伺服器。它坐在 Chrome extension 和 GitHub Copilot CLI 之間，負責翻譯兩者的通訊格式。

**幾件重要的事：**

- 它**不是獨立產品** — 它就是 repo 裡面的一個資料夾
- 它**不會把你的資料傳到任何第三方雲端** — 所有流量都透過官方 SDK 直接走 GitHub 的伺服器
- 它只跑在 `localhost:31031` — 完全不對外暴露
- 它不會裝成系統服務一直在背景跑，除非你使用選配的 Bridge Launcher

---

## Bridge 在電腦哪裡

Bridge 永遠在：`<repo 根目錄>/scripts/copilot-bridge/`

範例：

| 如果你把 repo clone 到… | Bridge 就在… |
| --- | --- |
| `C:\Dev\SidePilot` | `C:\Dev\SidePilot\scripts\copilot-bridge` |
| `C:\Users\alice\Projects\SidePilot` | `C:\Users\alice\Projects\SidePilot\scripts\copilot-bridge` |
| `/home/user/SidePilot` | `/home/user/SidePilot/scripts/copilot-bridge` |

**你不需要選擇 Bridge 裝在哪裡。** Clone repo 的時候它就已經在那了。

---

## 設定裡該填什麼路徑

在 extension 的**設定 → Bridge Setup** 頁面，你會看到一個叫 **SidePilot Repo Root** 的欄位。

填入的是 **repo 根目錄的路徑** — 不是 Bridge 的資料夾，也不是 extension 的資料夾。

| 你的情況 | 應該填入 |
| --- | --- |
| Repo clone 到 `C:\Dev\SidePilot` | `C:\Dev\SidePilot` |
| Repo clone 到 `/home/user/SidePilot` | `/home/user/SidePilot` |
| 在 WSL 裡執行 | **Linux 路徑**（例如 `/home/user/SidePilot`），不是 Windows 路徑 |

Extension 會自己從那個路徑推算出 `scripts/copilot-bridge/` 在哪。你只需要告訴它 repo 放哪裡。

### WSL 注意事項

如果你用的是 Windows Subsystem for Linux（WSL），填的路徑應該是**你的 Linux 環境裡的路徑**，不是 Windows 路徑。

| 情況 | 正確路徑 |
| --- | --- |
| Repo 在 Ubuntu 的 `/home/user/SidePilot` | `/home/user/SidePilot` |
| Repo 在 Debian 的 `/home/user/SidePilot` | `/home/user/SidePilot` |

請**不要**填 `C:\Users\...` 或 `\\wsl$\Ubuntu\...` 這種 Windows 路徑 — WSL runtime 吃不到。

如果你裝了超過一個 WSL 發行版，也要確認設定 → Bridge Setup → **WSL Distro** 裡填的是 repo 所在的那個發行版名稱。

---

## 怎麼知道 extension 有沒有連上 Bridge

### 指標一 — Bridge Setup 面板

進入**設定 → Bridge Setup**，看狀態指示燈：

| 狀態 | 代表意思 |
| --- | --- |
| 🟢 **Bridge 已就緒** | Bridge 正在執行，extension 已連上 |
| 🔴 **Bridge 尚未連線** | Bridge 沒有在跑，或 repo root 路徑填錯了 |
| 🟡 **正在啟動 Bridge** | Extension 已送出啟動訊號，等幾秒看看 |

### 指標二 — Connection Details

看設定 → Bridge Setup 裡的 **Connection Details**：

- `Repo Root` 應該指向 SidePilot repo 根目錄
- `Runtime` 應該和你實際啟動 bridge 的環境一致
- `Bridge` 應該顯示版本與 `就緒`
- `CLI` 應該至少不是離線

### 指標三 — 終端機驗證

打開終端機，執行：

```bash
curl http://localhost:31031/health
```

如果看到 JSON 回應且裡面有 `"status": "ok"`，表示 Bridge 正在跑。

### 指標四 — SDK 對話有沒有回應

切到 SDK 模式，送一則訊息。如果有拿到回覆，代表全部連上了。如果看到錯誤訊息，回頭確認上面幾個指標。

### 如果沒連上，我還能繼續用嗎？

可以。用側邊欄右上角的模式切換按鈕切回 **iframe 模式**。iframe 模式不需要 Bridge，隨時可用。

---

## 建議的第一次安裝流程

按順序執行。有需要的話，做到哪個步驟夠用就停下來。

### 第一步 — Clone repo

```bash
git clone https://github.com/pingqLIN/SidePilot.git
cd SidePilot
npm install
npm run build:vendor
```

### 第二步 — 把 extension 載入 Chrome

1. 開啟 `chrome://extensions/`
2. 啟用 **開發人員模式**（右上角的切換開關）
3. 點擊 **載入未封裝項目**
4. 選擇 repo 裡的 `extension/` 資料夾

> **找到你的 Extension ID：** 載入後，Chrome 會在 extension 名稱下方顯示一串 ID（例如 `abcdefghijklmnopqrstuvwxyz123456`）。之後設定 Bridge 時會用到。

### 第三步 — 開啟側邊欄

點擊工具列的 SidePilot 圖示，或按 `Alt + Shift + P`。

側邊欄以 **iframe 模式** 開啟，可以立刻開始使用 Copilot。

→ **如果 iframe 模式對你來說夠用，到這裡就結束了。** 第四步以後只有要用 SDK 模式才需要繼續。

### 第四步 — 安裝 Bridge Launcher（Windows）

> **作業系統支援對照：**
>
> | 功能 | Windows | macOS | Linux |
> |------|---------|-------|-------|
> | Bridge 伺服器（手動啟動） | ✅ | ✅ | ✅ |
> | Bridge Launcher（一鍵自動啟動） | ✅ | ❌ | ❌ |
>
> **macOS / Linux 使用者：** Bridge 本身可以正常執行，只是需要手動啟動。請跳到第六步執行手動啟動指令，跳過本步驟。

在 repo 根目錄執行（不是在 `scripts/` 裡面）：

```powershell
npm run bridge-launcher:install:win
```

這會在 Windows 裡註冊一個 `sidepilot://` URI handler。Extension 切到 SDK 模式時，會用這個機制自動把 Bridge 拉起來。每台電腦只需要做一次。

### 第五步 — 切換到 SDK 模式

點擊側邊欄右上角的模式切換按鈕（顯示 **IFRAME** / **SDK**），選擇 **SDK**。

Extension 會自動：
1. 確認 Bridge 是否已在 `localhost:31031` 執行
2. 如果沒有，透過 Bridge Launcher 送出啟動訊號
3. 等待最多約 10 秒讓 Bridge 啟動
4. 如果是第一次，顯示一次性的登入引導對話框

### 第六步 — 手動啟動 Bridge（自動啟動失敗時）

如果 Bridge 沒有自動啟動，複製快速設定指令：

**設定 → Bridge Setup → Copy Quick Setup** — 貼到終端機執行。

或者手動執行：

```bash
cd scripts/copilot-bridge
npm install          # 第一次才需要
npm start
```

Windows PowerShell 使用者，啟動前記得設定 Extension ID：

```powershell
$env:SIDEPILOT_EXTENSION_ID = "你的-extension-id"
npm start
```

### 第七步 — 登入 GitHub

第一次使用時，會出現登入引導對話框。點擊 **Open GitHub Login**，用 GitHub 帳號登入。需要有有效的 [Copilot 訂閱](https://github.com/features/copilot)。

登入後回到側邊欄，Extension 會自動確認連線。Bridge Setup 顯示 **Bridge 已就緒** 之後，就可以在 SDK 模式裡正常聊天了。

---

## 新手常見錯誤

### 1. Repo root 路徑填錯

**症狀：** 明明 Bridge 已經跑起來了，Bridge Setup 還是顯示 Offline。

**修法：** 進設定 → Bridge Setup → SidePilot Repo Root，確認路徑指向的是 repo 根目錄，不是子資料夾。

| 錯誤 | 正確 |
| --- | --- |
| `C:\Dev\SidePilot\scripts\copilot-bridge` | `C:\Dev\SidePilot` |
| `C:\Dev\SidePilot\extension` | `C:\Dev\SidePilot` |

### 2. Bridge 根本沒跑起來

**症狀：** 切到 SDK 模式立刻出現錯誤。

**修法：** Extension 連線之前，Bridge 必須先跑起來。安裝 Bridge Launcher（第四步），或是手動在 `scripts/copilot-bridge/` 裡執行 `npm start`。

> **macOS / Linux 使用者注意：** Bridge 本身支援 Windows、macOS、Linux，可以正常手動啟動。但 Bridge Launcher（一鍵自動啟動）目前只有 Windows 版本。macOS / Linux 請直接跳第六步手動啟動，跳過第四步。
>
> | 功能 | Windows | macOS | Linux |
> |------|---------|-------|-------|
> | Bridge 伺服器（手動啟動） | ✅ | ✅ | ✅ |
> | Bridge Launcher（一鍵自動啟動） | ✅ | ❌ | ❌ |

### 3. Node.js 版本太舊

**症狀：** `npm start` 跑不起來，出現 Node 版本相關錯誤。

**修法：** Bridge 需要 Node.js 24 以上。

```bash
node --version    # 應該顯示 v24.x.x 或更高
```

從 [nodejs.org](https://nodejs.org/) 下載 Node.js 24。

### 4. Copilot CLI 沒有登入

**症狀：** Bridge 跑起來了，但 SDK 對話回傳 auth 錯誤。

**修法：** 認證 Copilot CLI：

```bash
copilot auth login
```

或者透過 extension 裡的引導登入（設定 → SDK Mode → Open Login Guide）。

### 5. WSL Distro 填錯或留空

**症狀：** Bridge Launcher 找得到 repo 但啟動失敗。

**修法：** 進設定 → Bridge Setup → WSL Distro，確認填的名稱和 repo 所在的發行版一致（例如 `Ubuntu`、`Debian`）。留空可能會讓啟動器用到錯誤的環境。

### 6. 其實還在 iframe 模式卻沒發現

**症狀：** 記憶庫和規則設定了，但感覺沒有用。

**修法：** 確認側邊欄右上角的模式切換按鈕顯示的是 **SDK**。記憶庫和規則只在 **SDK 模式**下有效；模式標籤會明確顯示目前是哪個模式。

---

## 下一步

- [使用手冊](../../USAGE.zh-TW.md) — 完整設定參考與 API 文件
- [核心觀念](../concepts/README.zh-TW.md) — 模式、記憶庫與 Bridge 的心智模型
- [Bridge Server README](../../../scripts/copilot-bridge/README.md) — Bridge 進階設定
