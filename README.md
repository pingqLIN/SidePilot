<p align="center">
  <img src="extension/icons/icon128.png" width="120" alt="SidePilot logo">
</p>

<h1 align="center">SidePilot</h1>

<p align="center">
  <img alt="Chrome" src="https://img.shields.io/badge/Chrome-114+-4285F4?style=flat&logo=google-chrome&logoColor=white">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Manifest-V3-green">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-blue">
</p>

<p align="center"><b>SidePilot — GitHub Copilot for your Browser Side Panel</b></p>

<p align="center">
  <a href="#screenshots">Screenshots</a> •
  <a href="#features">Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#sdk-mode-setup">SDK Mode</a> •
  <a href="#configuration">Configuration</a>
</p>

[中文版](README.zh-TW.md)

---

## ✨ Screenshots

### iframe Mode

![iframe mode](docs/screenshots/iframe-mode.png)

### SDK Mode

![SDK mode](docs/screenshots/sdk-mode.png)

---

## ✨ Features

- **Dual Modes**: iframe mode for web Copilot, SDK mode for Copilot CLI bridge
- **Rules & Memory**: manage behavioral rules and reusable memory entries
- **Page Capture**: vertical capture button with adjustable width
- **Sidecar Guard**: allowlist or denylist links for iframe navigation
- **Config Sync**: optional sync to `~/.copilot/config.json`

---

## 🚀 Getting Started

### Install the Extension

1. Open `chrome://extensions/` in Chrome
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `SidePilot/extension`

### Open the Side Panel

- Click the extension icon, or
- Press `Alt+Shift+P` (Windows/Linux) or `Opt+Shift+P` (macOS)

---

## 🔧 SDK Mode Setup

SDK mode connects to GitHub Copilot CLI through the local bridge.

### Requirements

- Node.js 18+
- GitHub Copilot CLI installed and logged in

### Start the Bridge

```powershell
cd scripts/copilot-bridge
npm install
npm run dev
```

Once running, switch to **SDK** mode in the side panel and start chatting.

---

## ⚙️ Configuration

| Area | Key Options | Description |
| --- | --- | --- |
| iframe mode | Allowlist / Denylist | Control which links stay in iframe | 
| Capture | Button width | Adjust vertical capture button size | 
| SDK mode | Include Memory / Rules | Inject context before sending prompts | 
| Copilot CLI | Config Sync | Sync model and settings to `~/.copilot/config.json` | 
| Storage | Paths | Default save locations for chat exports & screenshots | 

---

## 🧭 Troubleshooting

- **Bridge server not available**: start `scripts/copilot-bridge` and ensure `copilot --acp` works
- **HTTP 404 from SDK**: verify the bridge service is running on port `31031`

---

## ⚠️ Legal Notice

> This extension embeds the GitHub Copilot web interface and uses the Copilot CLI SDK. Use at your own risk and ensure you comply with GitHub’s Terms of Service.

---

## 🤝 Contributing

Contributions are welcome. Open an Issue first to discuss changes.

---

## 📜 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

## 🤖 AI-Assisted Development

This project was developed with AI assistance.

**AI Models/Services Used:**

- OpenAI GPT-5 (Codex)

> ⚠️ **Disclaimer:** While the author has made every effort to review and validate the AI-generated code, no guarantee can be made regarding its correctness, security, or fitness for any particular purpose. Use at your own risk.
