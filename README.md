# SidePilot

[中文版](README.zh-TW.md)

> 🚧 **Work in Progress** - Currently in v2.0 architecture refactoring phase

**SidePilot** is a Chrome extension that keeps GitHub Copilot accessible in your browser's side panel, providing continuous AI assistance without interruption when switching tabs.

![Chrome](https://img.shields.io/badge/Chrome-114+-4285F4?style=flat&logo=google-chrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

- **🎯 Dual-Mode Architecture**
  - **iframe Mode**: Directly embeds GitHub Copilot web interface (requires GitHub login)
  - **SDK Mode**: Connects to Copilot API via local proxy server (under development)
- **📝 Rules Management**: Customize AI behavior rules with import/export and template support
- **🧠 Memory Bank**: Store tasks, notes, and references with one-click send to VS Code
- **📋 Page Capture**: Floating bottom button to capture current page's title, content, and code blocks
- **⌨️ Keyboard Shortcuts**: `Alt+Shift+P` to quickly open side panel
- **✈️ Pilot Style**: Exclusive pilot logo with GitHub Dark Theme interface

---

## 🚀 Quick Start

### Installing the Extension

1. **Download or clone the project**

   ```powershell
   git clone https://github.com/pingqLIN/SidePilot.git
   cd SidePilot
   ```

2. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `SidePilot/extension` directory

3. **Open the side panel**
   - Click the extension icon, or
   - Press `Alt+Shift+P` (Windows/Linux) or `Opt+Shift+P` (Mac)

---

## 🔧 SDK Mode Setup (Optional)

SDK mode requires a local proxy server to convert Copilot API to OpenAI-compatible format.

### Starting the Proxy Server

```powershell
# 1. Navigate to proxy server directory
cd scripts/github-copilot-proxy

# 2. Install dependencies
npm install

# 3. Configure GitHub Copilot Token (see SETUP.md for details)
# Recommended: Use OAuth Device Flow
gh auth login
gh api /copilot_internal/v2/token --jq '.token' > .env-token
echo "COPILOT_TOKEN=$(cat .env-token)" > .env
echo "PORT=3000" >> .env

# 4. Start server
npm run dev
```

For complete setup instructions, see [scripts/github-copilot-proxy/SETUP.md](scripts/github-copilot-proxy/SETUP.md)

---

## 📚 Project Structure

```text
SidePilot/
├── extension/              # Chrome Extension core
│   ├── manifest.json      # Extension configuration
│   ├── sidepanel.html     # Side panel UI (3 tabs: Copilot, Rules, Memory)
│   ├── sidepanel.js       # Main logic
│   ├── styles.css         # Styles (GitHub dark theme)
│   ├── background.js      # Service Worker
│   ├── rules.json         # Header removal rules (iframe mode)
│   └── js/                # Feature modules
│       ├── mode-manager.js       # Mode detection and switching
│       ├── sdk-client.js         # SDK API client
│       ├── rules-manager.js      # Rules management
│       ├── memory-bank.js        # Memory bank
│       ├── storage-manager.js    # Chrome Storage wrapper
│       ├── automation.js         # Automation script injection
│       └── vscode-connector.js   # VS Code integration
│
├── scripts/
│   ├── github-copilot-proxy/  # OpenAI-compatible Proxy Server
│   │   ├── SETUP.md           # Detailed setup guide
│   │   ├── src/
│   │   │   ├── server.ts      # Express main program
│   │   │   ├── routes/        # API routes
│   │   │   ├── services/      # Copilot API service
│   │   │   └── utils/         # Message format conversion
│   │   └── package.json
│   │
│   └── tests/                 # Unit tests (Vanilla JS)
│       ├── run-tests.html     # Test runner
│       ├── storage-manager.test.js
│       ├── rules-manager.test.js
│       └── memory-bank.test.js
│
├── docs/
│   └── DEVELOPMENT_PLAN.md    # v2.0 development plan (4-phase milestones)
│
└── README.md
```

---

## 🧪 Testing

### Unit Tests (Browser)

```powershell
# Open test runner in browser
start chrome "file:///C:/Dev/Projects/SidePilot/scripts/tests/run-tests.html"
```

Click "Run Tests" button to execute 18 tests (storage, rules, memory bank).

### Manual Testing

Refer to [scripts/tests/MANUAL_TESTS.md](scripts/tests/MANUAL_TESTS.md) for complete manual verification workflow.

---

## 📖 Feature Overview

### 1️⃣ Copilot Tab

- **iframe Mode** (default): Directly embeds `github.com/copilot`
- **SDK Mode** (requires proxy): Auto-detects `localhost:3000` and switches
- **Mode Badge**: Displayed on the right side of tab-bar (SDK=green / iframe=blue)
- **Floating Capture Button**: Bottom center capture button for one-click page content extraction

### 2️⃣ Rules Tab

- Edit AI behavior rules (Markdown format)
- Apply built-in templates (Web development, code review, etc.)
- Import/export `.txt` rule files

### 3️⃣ Memory Tab

- Create four types of entries: Task / Note / Context / Reference
- Search and filter functionality
- One-click send to VS Code (via `vscode://` protocol)

---

## ⚠️ Legal Disclaimer

> **Important**: SidePilot embeds the GitHub Copilot web interface by removing HTTP headers. This behavior may violate GitHub's Terms of Service. Use this extension **at your own risk**, including but not limited to potential account suspension or service interruption.
>
> This project is for educational and research purposes only and is not recommended for production use.

---

## 🛠️ Development Status

Current Version: **v2.0 Alpha**

### ✅ Completed (Phase 1: Stabilization + UI Redesign)

- [x] Fixed `renderMemoryList` duplicate definition
- [x] Added missing CSS variables (GitHub dark theme)
- [x] Unified SDK port to 3000
- [x] Created `.gitignore`
- [x] UI redesign: simplified toolbar, pilot logo, floating capture button
- [x] Fixed manifest `type: module` (critical bug)
- [x] Registered keyboard shortcut `Alt+Shift+P`
- [x] Added "Send to VS Code" button in Memory Tab
- [x] Moved Mode Badge to right side of tab-bar

### 🚧 In Progress (Phase 2: SDK Mode)

- [ ] Proxy server testing (requires GitHub Copilot Token)
- [ ] Implement SDK Chat UI (replace iframe)
- [ ] Conversation history management
- [ ] Manual mode switching UI

### 📅 Planned

- **Phase 3**: Context Injection, Memory ↔ Copilot integration, VS Code Extension
- **Phase 4**: Automated testing, Chrome Web Store publishing

See [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) for details

---

## 🤝 Contributing

Issues and Pull Requests are welcome!

Development guidelines:

- Use TypeScript (Proxy Server) and Vanilla JavaScript (Extension)
- Follow ES6+ modular design
- All Chrome API calls require error handling
- New features require unit tests

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

**Official License**: [MIT License](https://opensource.org/licenses/MIT)

---

## 🤖 AI-Assisted Development

This project was developed with AI assistance.

**AI Models/Services Used:**

- Google Gemini 2.5 Pro
- Claude 4.5 Sonnet

> ⚠️ **Disclaimer:** While the author has made every effort to review and validate the AI-generated code, no guarantee can be made regarding its correctness, security, or fitness for any particular purpose. Use at your own risk.

---

## 🙏 Acknowledgments

- **GitHub Copilot** - AI core engine
- **[BjornMelin/github-copilot-proxy](https://github.com/BjornMelin/github-copilot-proxy)** - Proxy server foundation
- **Chrome Extensions API** - MV3 platform support

---

## 📮 Contact

For questions or suggestions, please open an Issue.

---

_Last updated: 2026-02-12_ <!-- last updated -->
