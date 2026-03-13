# Contributing to SidePilot

Thank you for considering contributing to SidePilot! 🎉

## Getting Started

### Prerequisites

- **Chrome 114+** with Developer mode enabled
- **Node.js 18+** (for bridge server and build tools)
- **Git**

### Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/pingqLIN/SidePilot.git
cd SidePilot

# 2. Install dependencies
npm install

# 3. Build vendor bundle
npm run build:vendor

# 4. Load extension in Chrome
#    - Open chrome://extensions/
#    - Enable Developer mode
#    - Click "Load unpacked" → select extension/

# 5. (Optional) Start the Bridge Server for SDK mode
cd scripts/copilot-bridge
npm install
npm run build
npm run dev
```

---

## Project Structure

```
SidePilot/
├── extension/               # Chrome Extension (frontend)
│   ├── manifest.json        # Manifest V3 configuration
│   ├── background.js        # Service worker
│   ├── sidepanel.html       # Main side panel UI
│   ├── sidepanel.js         # Side panel logic (~175KB)
│   ├── styles.css           # All styles (~58KB)
│   ├── js/                  # ES Module components
│   │   ├── sdk-client.js    # Bridge HTTP/SSE client
│   │   ├── sdk-chat.js      # SDK chat UI
│   │   ├── mode-manager.js  # Mode switching logic
│   │   ├── memory-bank.js   # Memory CRUD
│   │   ├── rules-manager.js # Rules management
│   │   ├── link-guard.js    # iframe link control
│   │   ├── automation.js    # Page capture
│   │   ├── storage-manager.js
│   │   └── vscode-connector.js
│   ├── icons/               # Extension icons
│   ├── templates/           # Rule templates
│   └── _locales/            # i18n strings
│
├── scripts/
│   └── copilot-bridge/      # Bridge Server (backend)
│       ├── supervisor.ts    # Process supervisor
│       ├── server.ts        # Express HTTP server
│       ├── session-manager.ts # CLI session management
│       └── ipc-types.ts     # IPC type definitions
│
├── docs/                    # Documentation
├── pic/                     # Screenshots & visual assets
├── tests/                   # Test files
└── README.md                # Main documentation
```

---

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/pingqLIN/SidePilot/issues) first
2. Open a new issue with:
   - Clear title describing the bug
   - Steps to reproduce
   - Expected vs. actual behavior
   - Chrome version, OS, and Node.js version
   - Console logs if applicable

### Suggesting Features

1. Open a new issue with the **Feature Request** label
2. Describe the use case and expected behavior
3. Include mockups or examples if possible

### Submitting Code

1. **Fork** the repository
2. **Create a branch:** `git checkout -b feature/my-feature`
3. **Make changes** following our coding guidelines
4. **Test locally** — load the extension and verify changes work
5. **Commit** with clear, descriptive messages
6. **Push** and open a **Pull Request**

---

## Coding Guidelines

### General

- Use **ES Modules** syntax (`import`/`export`)
- Follow existing code style and naming conventions
- Add comments for complex logic (in English or 繁體中文)
- Keep functions focused and small

### Extension (Frontend)

- Vanilla JS only — no frameworks
- Use CSS Variables for theming
- Follow the existing module pattern in `js/`
- Test in Chrome 114+ with Developer mode

### Bridge Server (Backend)

- TypeScript with strict mode
- Verify with `npx tsc --noEmit` before committing
- Follow Express.js best practices
- Handle errors gracefully with proper HTTP status codes

---

## Commit Messages

Follow a clear format:

```
type(scope): description

Examples:
feat(memory): add search by type filter
fix(bridge): handle CLI timeout gracefully
docs(readme): update installation steps
refactor(sdk-client): extract SSE parser
chore(deps): update @github/copilot-sdk to 0.1.9
```

---

## Questions?

Feel free to open an issue or start a discussion. We're happy to help! 🚀
