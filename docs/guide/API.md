# SidePilot Bridge API

This page documents the local SidePilot bridge endpoints at `http://localhost:31031`.

## Auth flow

Before calling most protected `/api/*` endpoints, the extension:

1. Calls `POST /api/auth/bootstrap`
2. Receives a temporary bridge token
3. Sends that token in `X-SidePilot-Token`

## Core endpoints

### Health & auth

- `GET /health`
- `POST /api/auth/bootstrap`
- `GET /api/config`
- `GET /api/models`
- `GET /api/models/info`

### Sessions & chat

- `POST /api/sessions`
- `GET /api/sessions`
- `DELETE /api/sessions/:id`
- `POST /api/chat`
- `POST /api/chat/sync`

### Permissions

- `GET /api/permissions`
- `POST /api/permission/resolve`
- `GET /api/permissions/whitelist`
- `POST /api/permissions/whitelist`
- `GET /api/permissions/stream`

### Prompt strategy

- `GET /api/prompt/strategy`
- `POST /api/prompt/strategy`

### History & logs

- `GET /api/history`
- `POST /api/history`
- `GET /api/history/stream`
- `GET /api/logs`
- `GET /api/logs/stream`

### Backup

- `GET /api/backup/config`
- `POST /api/backup/config`
- `POST /api/backup/full`
- `POST /api/backup/settings`
- `GET /api/backup/list`
- `POST /api/backup/restore/:id`
- `DELETE /api/backup/:id`

## Notes

- The bridge is local-only and intended for SidePilot extension use.
- `GET /health` is the fastest way to determine whether SDK mode can be used.
- Backup APIs are designed for local export / restore workflows.
