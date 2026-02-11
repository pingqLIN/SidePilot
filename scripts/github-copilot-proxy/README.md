# GitHub Copilot Proxy Server

OpenAI-compatible API proxy for GitHub Copilot, enabling SidePilot extension's SDK mode.

## Features

- ✅ OpenAI Chat Completions API compatible
- ✅ Streaming support (Server-Sent Events)
- ✅ Message format conversion (OpenAI ↔ Copilot)
- ✅ TypeScript with Express
- ✅ CORS enabled for local development

## Quick Start

```powershell
# Install dependencies
npm install

# Create .env file
echo "COPILOT_TOKEN=your_token_here" > .env
echo "PORT=3000" >> .env

# Development mode (auto-reload)
npm run dev

# Production build
npm run build
npm start
```

## Documentation

- **[Complete Setup Guide](./SETUP.md)** - Token extraction, configuration, API usage, and troubleshooting
- **Original Project**: [BjornMelin/github-copilot-proxy](https://github.com/BjornMelin/github-copilot-proxy)
- **API Specification**: See `/docs/COPILOT_API_SPECIFICATION_ZH-TW_.txt` in project root

## Endpoints

| Endpoint               | Method | Description                |
| ---------------------- | ------ | -------------------------- |
| `/health`              | GET    | Health check               |
| `/v1/chat/completions` | POST   | OpenAI-compatible chat API |

## SidePilot Integration

When running on `localhost:3000`, the SidePilot extension automat ically detects and switches to SDK mode.

## License

MIT
