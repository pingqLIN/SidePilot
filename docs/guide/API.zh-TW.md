# SidePilot Bridge API

本頁整理 SidePilot 本地 bridge 在 `http://localhost:31031` 提供的主要端點。

## 驗證流程

呼叫多數受保護的 `/api/*` 端點前，擴充會先：

1. 呼叫 `POST /api/auth/bootstrap`
2. 取得暫時性的 bridge token
3. 在後續請求帶上 `X-SidePilot-Token`

## 主要端點

### 健康檢查與驗證

- `GET /health`
- `POST /api/auth/bootstrap`
- `GET /api/config`
- `GET /api/models`
- `GET /api/models/info`

### Sessions 與對話

- `POST /api/sessions`
- `GET /api/sessions`
- `DELETE /api/sessions/:id`
- `POST /api/chat`
- `POST /api/chat/sync`

### 權限管理

- `GET /api/permissions`
- `POST /api/permission/resolve`
- `GET /api/permissions/whitelist`
- `POST /api/permissions/whitelist`
- `GET /api/permissions/stream`

### Prompt 策略

- `GET /api/prompt/strategy`
- `POST /api/prompt/strategy`

### 歷史與日誌

- `GET /api/history`
- `POST /api/history`
- `GET /api/history/stream`
- `GET /api/logs`
- `GET /api/logs/stream`

### 備份

- `GET /api/backup/config`
- `POST /api/backup/config`
- `POST /api/backup/full`
- `POST /api/backup/settings`
- `GET /api/backup/list`
- `POST /api/backup/restore/:id`
- `DELETE /api/backup/:id`

## 備註

- Bridge 僅在本機使用，設計上就是給 SidePilot 擴充呼叫。
- `GET /health` 是判斷 SDK 模式可不可用的最快方式。
- Backup API 主要用於本機匯出、備份與還原工作流。
