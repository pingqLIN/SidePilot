<p align="center">
  <img src="docs/banner.webp" width="1000" alt="SidePilot — GitHub Copilot browser side panel extension">
</p>

<h1 align="center">SidePilot</h1>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/Version-0.5.0-blue?style=flat-square">
  <img alt="Chrome" src="https://img.shields.io/badge/Chrome-114+-4285F4?style=flat-square&logo=google-chrome&logoColor=white">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Manifest-V3-34a853?style=flat-square">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-24+-339933?style=flat-square&logo=node.js&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square">
</p>

<p align="center">
  <b>A Chrome extension that keeps GitHub Copilot in your browser side panel — so you can chat, capture, and keep context without leaving the page.</b>
</p>

<p align="center">
  <a href="#-what-is-sidepilot">Overview</a> &bull;
  <a href="#-product-preview">Preview</a> &bull;
  <a href="#-core-features-at-a-glance">Features</a> &bull;
  <a href="#-quick-start">Quick Start</a> &bull;
  <a href="#-documentation-tabs">Docs</a> &bull;
  <a href="docs/guide/api/README.md">API</a> &bull;
  <a href="docs/SCREENSHOTS.md">Screenshots</a>
</p>

<p align="center">
  <a href="README.zh-TW.md">繁體中文</a> &bull;
  <a href="docs/guide/README.md">Guide Hub</a> &bull;
  <a href="docs/guide/getting-started/README.md">Getting Started</a> &bull;
  <a href="docs/guide/concepts/README.md">Concepts</a> &bull;
  <a href="docs/SCREENSHOTS.md">Screenshot Gallery</a>
</p>

---

## 🧭 What Is SidePilot?

SidePilot is a **Chrome Extension** (Manifest V3) that puts GitHub Copilot AI into the browser side panel. Its goal is simple: **let you work with AI where you're already working**.

Instead of bouncing between tabs, apps, and terminals, you can keep Copilot beside the page you're reading — docs, pull requests, dashboards, or bug reports — and bring that context into the conversation instantly.

### Why it exists

- **No tab switching** — AI stays next to the page you're working on
- **Two modes** — start instantly with iframe mode, or unlock full power with SDK mode
- **Context-aware workflow** — capture page text, code blocks, and screenshots directly from the browser
- **Persistent memory** — keep tasks, notes, and references across sessions
- **Rules-driven behavior** — shape responses with templates and custom instructions
- **Local-first setup** — bridge stays on `localhost`, no extra cloud relay

### Best for

- developers researching in the browser
- people who want persistent AI context
- users who want gradual setup from simple to advanced
- local-tooling power users on Windows / WSL

---

## 📸 Product Preview

<table>
  <tr>
    <td width="33%" align="center">
      <img src="pic/01-iframe-mode.png" width="280" alt="iframe mode preview"><br>
      <b>Instant side-panel access</b><br>
      <sub>Open Copilot inside the browser side panel and start fast.</sub>
    </td>
    <td width="33%" align="center">
      <img src="pic/02-sdk-chat.png" width="280" alt="SDK chat preview"><br>
      <b>Streaming SDK chat</b><br>
      <sub>Switch to the local bridge for richer control, models, and streaming.</sub>
    </td>
    <td width="33%" align="center">
      <img src="pic/03-rules-tab.png" width="280" alt="Rules tab preview"><br>
      <b>Rules that shape behavior</b><br>
      <sub>Use templates and custom instructions to keep responses on-style.</sub>
    </td>
  </tr>
  <tr>
    <td width="33%" align="center">
      <img src="pic/06-page-capture-text.png" width="280" alt="Page capture preview"><br>
      <b>Capture what you're seeing</b><br>
      <sub>Pull text, code blocks, and screenshots straight from the page.</sub>
    </td>
    <td width="33%" align="center">
      <img src="pic/08-sdk-context.png" width="280" alt="Context injection preview"><br>
      <b>Context that stays sticky</b><br>
      <sub>Memory, rules, and captured context can travel with each SDK prompt.</sub>
    </td>
    <td width="33%" align="center">
      <img src="pic/09-sdk-initial.png" width="280" alt="Bridge onboarding preview"><br>
      <b>Bridge onboarding flow</b><br>
      <sub>Move from quick start to advanced mode without leaving the panel.</sub>
    </td>
  </tr>
</table>

> For the latest raw UI captures added on 2026-03-13, see [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md) or [pic/INDEX.md](pic/INDEX.md).

---

## 🎯 Core Features at a Glance

| Feature | What it gives you | Screenshot |
| --- | --- | --- |
| **Dual Mode** | iframe for zero-config use, SDK for streaming + advanced context | `pic/01-iframe-mode.png`, `pic/02-sdk-chat.png` |
| **Memory Bank** | reusable tasks, notes, references, and context injection | `pic/08-sdk-context.png` |
| **Rules & Templates** | Markdown instructions with built-in templates | `pic/03-rules-tab.png` |
| **Page Capture** | grab page text, code blocks, and screenshots without leaving the tab | `pic/06-page-capture-text.png` |
| **Bridge Auto-Start** | easier SDK startup with local launcher flow | `pic/09-sdk-initial.png` |

> Want the full walkthrough? Open [docs/FEATURES.md](docs/FEATURES.md).

---

## 🚀 Quick Start

### 1. Install

```bash
git clone https://github.com/pingqLIN/SidePilot.git
cd SidePilot
npm install
npm run build:vendor
```

### 2. Load into Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` folder

### 3. Choose a mode

| Mode | Setup cost | Best for |
| --- | --- | --- |
| **iframe** | almost none | fast access to Copilot web UI |
| **SDK** | local bridge required | streaming, memory, rules, advanced controls |

> Detailed setup lives in [docs/USAGE.md](docs/USAGE.md).

---

## 🗂️ Documentation Tabs

The README is intentionally kept short. Treat it like the front desk; the rest of the building lives in `docs/`.

| Tab | Best for | Link |
| --- | --- | --- |
| Usage Manual | installation, configuration, and daily operation | [docs/USAGE.md](docs/USAGE.md) |
| Getting Started | install, load the extension, and choose your first mode | [docs/guide/getting-started/README.md](docs/guide/getting-started/README.md) |
| Concepts | understand modes, memory, rules, and the local bridge model | [docs/guide/concepts/README.md](docs/guide/concepts/README.md) |
| API | bridge auth, chat, permission, and backup endpoints | [docs/guide/api/README.md](docs/guide/api/README.md) |
| Feature Guide | modes, modules, and behavior details | [docs/FEATURES.md](docs/FEATURES.md) |
| Guide Hub | organized doc landing page | [docs/guide/README.md](docs/guide/README.md) |
| Screenshots | UI walkthrough and visual references | [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md) |
| Screenshot Index | curated screenshots + latest raw captures | [pic/INDEX.md](pic/INDEX.md) |

## 🧩 Pick a mode

- **iframe mode** if you want SidePilot running in under a minute.
- **SDK mode** if you want the real power features and don't mind a local bridge.

## 🔎 Recommended reading path

1. Read this page for product overview
2. Open [docs/guide/getting-started/README.md](docs/guide/getting-started/README.md) for the fastest setup path
3. Open [docs/guide/concepts/README.md](docs/guide/concepts/README.md) for the product mental model
4. Open [docs/FEATURES.md](docs/FEATURES.md) for the full feature tour
5. Open [docs/guide/api/README.md](docs/guide/api/README.md) if you work with the bridge or tooling integration

---

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

**Quick Start:**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test locally
4. Commit with clear messages
5. Open a Pull Request

---

## ⚠️ Legal Notice

> This extension embeds the GitHub Copilot web interface (iframe mode) and uses the official Copilot CLI SDK (SDK mode). Use at your own risk and ensure you comply with [GitHub's Terms of Service](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service).

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

## 🤖 AI-Assisted Development

This project was developed with AI assistance.

**AI Models Used:**

- Claude (Anthropic) — Architecture design, code generation, documentation
- GPT-5 (OpenAI Codex) — Code generation, debugging
- Gemini (Google DeepMind) — Documentation, visual assets

> **Disclaimer:** While the author has made every effort to review and validate the AI-generated code, no guarantee can be made regarding its correctness, security, or fitness for any particular purpose. Use at your own risk.
