# Extension Development Mode

## Project Structure
- `extension/` — Chrome Extension core (MV3)
  - `sidepanel.js` — Main frontend logic
  - `sidepanel.html` — Side Panel UI
  - `styles.css` — Global styles (GitHub Dark theme)
  - `background.js` — Service Worker
  - `js/` — Modules (sdk-client, rules-manager, memory-bank, etc.)
- `scripts/copilot-bridge/` — Bridge Server (TypeScript → dist/)
- `templates/` — Rules template files
- `tests/` — Jest tests

## Dev Commands
- Test: `$env:NODE_OPTIONS="--experimental-vm-modules"; npx jest --no-cache`
- Build Bridge: `cd scripts/copilot-bridge && npm run build`
- Bundle vendor: `npm run build:vendor`

## Coding Conventions
- Use CSS variables (`--bg-primary`, `--accent-blue`, etc.)
- Centralize DOM references in the `dom` object
- Register event listeners inside `setupEventListeners()`
- Use named exports for modules
- Bridge API paths: `/api/chat`, `/api/chat/sync`, `/api/permissions/*`, `/api/prompt/strategy`
- Any user-visible UI text or display change must preserve an English baseline in the same edit

## Modification Checklist
- [ ] After editing `server.ts`, always re-run `npm run build`
- [ ] After adding HTML elements, add the DOM ref in `init()`
- [ ] New CSS must follow the existing block structure (section comments as dividers)
- [ ] Windows `spawn` for external commands requires `shell: true`
- [ ] Use `display:none` (not `visibility:hidden`) when toggling iframe visibility
- [ ] If UI copy changed, confirm the English version exists and is updated in the same patch

## Test Requirements
- Run the full test suite after any change to confirm no regressions
- New features should have corresponding test cases
- Use `jest.fn()` to mock Chrome APIs
