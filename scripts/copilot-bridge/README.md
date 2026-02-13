# SidePilot Copilot Bridge

Lightweight HTTP bridge between SidePilot Chrome Extension and GitHub Copilot CLI SDK.

## Prerequisites

- Node.js >= 18.0.0
- [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) installed and in PATH

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (with hot-reload)
npm run dev

# Or build and run production
npm run build
npm start
```

## API Endpoints

| Method | Path                | Description                                     |
| ------ | ------------------- | ----------------------------------------------- |
| GET    | `/health`           | Health check (used by extension mode detection) |
| GET    | `/api/models`       | List available models                           |
| POST   | `/api/sessions`     | Create new session                              |
| GET    | `/api/sessions`     | List active sessions                            |
| DELETE | `/api/sessions/:id` | Delete a session                                |
| POST   | `/api/chat`         | Send message (SSE streaming response)           |
| POST   | `/api/chat/sync`    | Send message (wait for complete response)       |

## Environment Variables

| Variable        | Default   | Description   |
| --------------- | --------- | ------------- |
| `PORT`          | `3000`    | Server port   |
| `COPILOT_MODEL` | `gpt-4.1` | Default model |
| `LOG_LEVEL`     | `info`    | Log level     |

## Architecture

```
Chrome Extension (sdk-client.js)
       ↓ HTTP / SSE
  Copilot Bridge (this server)
       ↓ JSON-RPC
  Copilot CLI (managed by SDK)
```
