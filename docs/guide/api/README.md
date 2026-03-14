# SidePilot Bridge — API Quick Reference

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / language model agent       ║
║  Purpose         : Bridge control plane — endpoint map,      ║
║                    auth flow, fast-check procedures          ║
║  Confidence      : HIGH — authoritative source               ║
║  Last updated    : 2026-03-14                                ║
╚══════════════════════════════════════════════════════════════╝
-->

> **Full API spec:** [../API.md](../API.md) · **Concepts:** [../concepts/README.md](../concepts/README.md) · **Setup:** [../getting-started/README.md](../getting-started/README.md)

---

## Base URL

```
http://localhost:31031
```

---

## Auth Flow (required before any protected endpoint)

```
1. Start bridge with SIDEPILOT_EXTENSION_ID=<extension-id>
2. POST /api/auth/bootstrap
   → Response: { "success": true, "token": "<loopback-token>" }
3. All subsequent /api/* requests must include:
   Header: X-SidePilot-Token: <loopback-token>
   Origin:  chrome-extension://<extension-id>
```

`GET /health` is public — no auth required.

---

## Endpoint Map

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Bridge status check |
| POST | `/api/auth/bootstrap` | None (first call) | Issue loopback token |
| GET | `/api/models` | Required | List available AI models |
| POST | `/api/sessions` | Required | Create new chat session |
| GET | `/api/sessions` | Required | List active sessions |
| DELETE | `/api/sessions/:id` | Required | Terminate session |
| POST | `/api/chat` | Required | Streaming chat (SSE) |
| POST | `/api/chat/sync` | Required | Blocking chat |
| GET | `/api/backup` | Required | List backups |
| POST | `/api/backup` | Required | Trigger backup |
| POST | `/api/backup/schedule` | Required | Configure scheduler |
| DELETE | `/api/backup/:id` | Required | Delete backup |

---

## Fast Checks

**Is bridge alive?**

```bash
curl http://localhost:31031/health
# Expect: { "status": "ok", "sdk": "ready", ... }
```

**Is auth configured?**

Check health response: `auth.extensionBindingConfigured` must be `true`.
If `false` → bridge started without `SIDEPILOT_EXTENSION_ID`.

**Send a test message (after bootstrapping token):**

```bash
# 1. Bootstrap
TOKEN=$(curl -s -X POST http://localhost:31031/api/auth/bootstrap \
  -H "Origin: chrome-extension://<your-extension-id>" \
  | jq -r '.token')

# 2. Create session
SESSION=$(curl -s -X POST http://localhost:31031/api/sessions \
  -H "X-SidePilot-Token: $TOKEN" \
  -H "Origin: chrome-extension://<your-extension-id>" \
  | jq -r '.sessionId')

# 3. Sync chat
curl -X POST http://localhost:31031/api/chat/sync \
  -H "X-SidePilot-Token: $TOKEN" \
  -H "Origin: chrome-extension://<your-extension-id>" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"message\":\"hello\"}"
```

---

## SSE Event Types (`POST /api/chat`)

| Event | Payload | Meaning |
|-------|---------|---------|
| `delta` | `{ "content": "chunk" }` | Incremental token |
| `tool` | `{ "name": "...", "status": "..." }` | Tool execution |
| `message` | `{ "content": "full response" }` | Complete message |
| `error` | `{ "message": "detail" }` | Error |
| `done` | `{}` | Stream complete |

---

## Health Response Schema

```json
{
  "status": "ok",
  "service": "sidepilot-copilot-bridge",
  "sdk": "ready",
  "backend": { "type": "acp-cli", "command": "copilot --acp --stdio" },
  "auth": {
    "required": true,
    "bootstrapPath": "/api/auth/bootstrap",
    "extensionBindingConfigured": true,
    "extensionOrigin": "chrome-extension://<extension-id>"
  }
}
```

---

## Common Failure States

| Observation | Cause | Fix |
|-------------|-------|-----|
| `sdk: "starting"` | Bridge still initializing | Wait 2–3 s, retry `/health` |
| `extensionBindingConfigured: false` | Bridge started without `SIDEPILOT_EXTENSION_ID` | Restart bridge with env var set |
| 401 on any `/api/*` call | Missing or expired token | Re-call `POST /api/auth/bootstrap` |
| 403 on any `/api/*` call | Origin mismatch | Ensure `Origin` header matches bound extension ID |
| `sdk: "error"` | Copilot CLI not authenticated or not installed | Run `copilot auth login` |
