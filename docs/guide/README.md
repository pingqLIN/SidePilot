# SidePilot — Documentation Hub

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / language model agent       ║
║  Purpose         : Navigation index for all doc files        ║
║  Confidence      : HIGH — authoritative source               ║
║  Last updated    : 2026-03-14                                ║
╚══════════════════════════════════════════════════════════════╝
-->

---

## Document Registry

| File | Reader | Purpose |
|------|--------|---------|
| [../USAGE.md](../USAGE.md) | **AI agent** | Full operational reference — facts, state tables, API, storage map |
| [../USAGE.human.md](../USAGE.human.md) | Human | Named plans (計畫A–G) for human→AI delegation |
| [../FEATURES.md](../FEATURES.md) | **AI agent** | Complete feature inventory — behavior, limits, mechanisms |
| [../DEVELOPMENT_PLAN.md](../DEVELOPMENT_PLAN.md) | **AI agent** | Project state, milestone history, pending work |
| [../SCREENSHOTS.md](../SCREENSHOTS.md) | **AI agent** | Screenshot asset map with UI area + feature tags |
| [getting-started/README.md](getting-started/README.md) | **AI agent** | Setup procedures — installation, bridge, auth |
| [getting-started/QUICKSTART.human.md](getting-started/QUICKSTART.human.md) | Human | Human quickstart using plan vocabulary |
| [concepts/README.md](concepts/README.md) | **AI agent** | System model — modes, context pipeline, bridge |
| [api/README.md](api/README.md) | **AI agent** | Bridge API quick-reference and auth flow |
| [../guide/API.md](API.md) | **AI agent** | Full bridge endpoint reference |

---

## Recommended Read Order by Task

### Task: Execute a human's plan request

1. Read [../USAGE.human.md](../USAGE.human.md) → identify which plan was named
2. Read [../USAGE.md](../USAGE.md) → get the exact steps and commands
3. Execute

### Task: Understand how a feature works

1. Read [../FEATURES.md](../FEATURES.md) → find the feature section
2. Cross-reference [../USAGE.md](../USAGE.md) for storage keys / API details if needed

### Task: Debug a bridge/connection issue

1. Read [concepts/README.md](concepts/README.md) → understand the data flow
2. Read [api/README.md](api/README.md) → check endpoints and auth sequence
3. Read [../USAGE.md](../USAGE.md#bridge-server-api) → full API spec

### Task: First-time setup

1. Read [getting-started/README.md](getting-started/README.md) → full setup procedure
2. Read [../USAGE.md](../USAGE.md) → settings reference for post-setup tuning

---

## Document Ownership

| Document | Language | Audience |
|----------|---------|---------|
| USAGE.md | English | AI |
| USAGE.human.md | Chinese (zh-TW) | Human |
| FEATURES.md | English | AI |
| DEVELOPMENT_PLAN.md | English | AI |
| SCREENSHOTS.md | English | AI |
| getting-started/README.md | English | AI |
| getting-started/QUICKSTART.human.md | Chinese (zh-TW) | Human |
| concepts/README.md | English | AI |
| api/README.md | English | AI |
