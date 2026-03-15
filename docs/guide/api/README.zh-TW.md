# SidePilot API 導覽

> SDK 模式所使用的本地 bridge 控制平面快速地圖。

---

## 這裡整理什麼

SidePilot bridge 跑在 `http://localhost:31031`，主要負責：

- 驗證 bootstrap
- Session 生命週期
- 串流與同步對話
- 權限決策
- Prompt 策略
- 歷史 / 日誌串流
- 備份與還原

## 什麼時候該看這裡

| 目標 | 連結 |
| --- | --- |
| 理解 auth bootstrap 流程 | [../API.zh-TW.md](../API.zh-TW.md) |
| 先理解 SDK 模式心智模型 | [../concepts/README.zh-TW.md](../concepts/README.zh-TW.md) |
| 呼叫 bridge 前先完成設定 | [../getting-started/README.zh-TW.md](../getting-started/README.zh-TW.md) |

## 快速檢查

- 用 `GET /health` 確認 bridge 是否活著
- 用 `GET /api/status` 取得 Bridge Setup / SDK 狀態列使用的完整快照
- 測試受保護端點前，先用 `SIDEPILOT_EXTENSION_ID=<你的 extension id>` 啟動 bridge
- 在呼叫受保護的 `/api/*` 前先執行 `POST /api/auth/bootstrap`
- 在高風險本地調整前，先用 backup 端點做備份

## 下一步

打開完整端點參考：[../API.zh-TW.md](../API.zh-TW.md)
