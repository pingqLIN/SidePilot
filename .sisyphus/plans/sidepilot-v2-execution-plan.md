# SidePilot v2.0 Execution Plan

## TL;DR

> **Quick Summary**: Rewrite SidePilot Chrome Extension to v2.0 dual-mode architecture (SDK + iframe) with multi-Agent coordination. Includes bug fixes, mode management, SDK integration, Rules persistence, Memory Bank, Chat UI unification, and test infrastructure.
> 
> **Deliverables**:
> - Bug-free baseline (Part 0: HTML encoding, CSS selectors, JS spacing)
> - Mode Manager module (`js/mode-manager.js`)
> - SDK Client module (`js/sdk-client.js`)
> - Storage Manager module (`js/storage-manager.js`)
> - Rules Manager module (`js/rules-manager.js`)
> - Memory Bank module (`js/memory-bank.js`)
> - VS Code Connector module (`js/vscode-connector.js`)
> - Unified Chat UI in sidepanel.js
> - Test infrastructure + manual verification procedures
> 
> **Estimated Effort**: 40-50 hours
> **Parallel Execution**: YES - 6 waves
> **Critical Path**: Part 0 → M1 → M2 → M3 → M4

**Project Path**: `C:/dev/Projects/SidePilot/`

---

## Context

### Original Request
Rewrite SidePilot's DEVELOPMENT_PLAN.md into an actionable execution plan with multi-Agent coordination, review, and correction mechanisms for v2.0 dual-mode architecture.

### Interview Summary
**Key Discussions**:
- **Execution Order**: Part 0 (Bug Fixes) → M1 → [M2 + Part 1 + Part 2 parallel] → M3 → M4
- **Review Intensity**: Medium (review after each Task completion)
- **Testing Strategy**: Manual verification for M1-M3, build test infrastructure in M4
- **Agent Strategy**: Hybrid mode (full-stack Agents for core features, specialized Agents for review/testing)

**Research Findings**:
- Copilot SDK uses `copilot --server --port 4321` for external server mode
- Chrome Extension can communicate via background.js → SDK client → localhost
- VS Code integration via URI protocol (`vscode://sidepilot.vscode-extension?action=createTask`)
- MV3 service worker has lifecycle constraints affecting persistent connections

### Metis Review
**Identified Gaps** (addressed):
1. **Copilot SDK stability**: Added graceful degradation and fallback mechanism
2. **Storage schema conflicts**: Defined upfront schema with namespaced keys
3. **Interface contracts**: Added explicit module exports to each task
4. **MV3 service worker limitations**: Added connection persistence considerations
5. **Missing timeout values**: Specified explicit timeouts (5s, 30s)
6. **Scope creep risks**: Added explicit "Must NOT do" guardrails to every task

---

## Work Objectives

### Core Objective
Transform SidePilot into a dual-mode Chrome Extension that can operate via official Copilot SDK (primary) or iframe fallback (secondary), with persistent rules management and cross-platform memory bank.

### Concrete Deliverables
| Deliverable | Type | Location |
|-------------|------|----------|
| Bug-free baseline | Fix | sidepanel.html, styles.css, background.js, sidepanel.js |
| Mode Manager | New Module | js/mode-manager.js |
| SDK Client | New Module | js/sdk-client.js |
| Storage Manager | New Module | js/storage-manager.js |
| Rules Manager | New Module | js/rules-manager.js |
| Memory Bank | New Module | js/memory-bank.js |
| VS Code Connector | New Module | js/vscode-connector.js |
| Automation | New Module | js/automation.js |
| Unified Chat UI | Update | sidepanel.html, sidepanel.js |
| Tab Navigation | Update | sidepanel.html, styles.css |
| Test Infrastructure | New | tests/, test-harness.js |
| Default Rules Template | New | templates/default-rules.md |

### Definition of Done
- [ ] Extension loads without console errors
- [ ] All 14 CSS selector bugs fixed (verified via grep)
- [ ] HTML encoding issue resolved (visible correct Unicode)
- [ ] Mode Manager detects SDK availability correctly
- [ ] SDK Client can send/receive messages when CLI available
- [ ] Rules persist across browser restarts
- [ ] Memory Bank stores/retrieves entries
- [ ] Chat UI works in both SDK and iframe modes
- [ ] Test harness runs with single command

### Must Have
- Dual-mode operation (SDK primary, iframe fallback)
- Persistent rules storage
- Memory bank with VS Code export
- Tab-based UI navigation (Copilot / Rules / Memory)
- Manual verification procedures for all features

### Must NOT Have (Guardrails)
- TypeScript migration (stay Vanilla JS)
- Build tooling (webpack, rollup, etc.)
- External dependencies beyond Chrome APIs
- Bidirectional VS Code sync (URI protocol only)
- Rule engine with conditions/priorities (simple key-value only)
- Full test coverage (infrastructure only in M4)
- Real-time collaboration features
- Telemetry or error reporting services
- Any refactoring during bug fix phase

---

## Storage Schema (Pre-defined)

> **CRITICAL**: This schema MUST be respected by Part 1 and Part 2 to avoid conflicts.

```javascript
// Namespace: sidepilot.*
{
  // Mode Manager (M1)
  "sidepilot.mode.active": "sdk" | "iframe",
  "sidepilot.mode.lastCheck": 1705632000000,
  
  // Rules Manager (Part 1)
  "sidepilot.rules.content": "# Project Instructions\n...",
  "sidepilot.rules.lastModified": 1705632000000,
  "sidepilot.rules.version": 1,
  "sidepilot.rules.templates": [
    { "id": "default", "name": "Default", "content": "..." }
  ],
  
  // Memory Bank (Part 2)
  "sidepilot.memory.entries": {
    "mem_001": {
      "id": "mem_001",
      "type": "task",
      "title": "...",
      "content": "...",
      "tags": [],
      "createdAt": 1705632000000,
      "status": "pending"
    }
  },
  "sidepilot.memory.index": {
    "byStatus": { "pending": ["mem_001"] }
  },
  
  // Automation (Part 1)
  "sidepilot.automation.settings": {
    "autoInjectContext": false,
    "contextMaxLength": 5000
  }
}
```

---

## Module Interface Contracts (Pre-defined)

> **CRITICAL**: Each module MUST export these interfaces. Consumers depend on them.

### ModeManager (M1)
```javascript
export {
  init(),           // Initialize module, run detection
  cleanup(),        // Cleanup resources
  getStatus(),      // { initialized: bool, mode: string }
  detectMode(),     // Returns 'sdk' | 'iframe'
  getActiveMode(),  // Returns current mode
  setMode(mode),    // Manually override mode
  onModeChange(cb)  // Subscribe to mode changes
}
```

### SDKClient (M2)
```javascript
export {
  init(),           // Initialize, attempt connection
  cleanup(),        // Close connection
  getStatus(),      // { initialized: bool, connected: bool, port: number }
  isConnected(),    // Boolean
  connect(port),    // Connect to SDK server (default: 4321)
  disconnect(),     // Close connection
  sendMessage(msg), // Send message, returns Promise<response>
  onConnectionChange(cb) // Subscribe to connection state
}
```

### StorageManager (Part 1)
```javascript
export {
  init(),
  cleanup(),
  getStatus(),
  save(key, value),     // Save to chrome.storage.local
  load(key),            // Load from storage
  delete(key),          // Remove key
  getBytesInUse(),      // Quota check
  onStorageChange(cb)   // Subscribe to changes
}
```

### RulesManager (Part 1)
```javascript
export {
  init(),
  cleanup(),
  getStatus(),
  saveRules(content),
  loadRules(),
  exportAsFile(),       // Trigger download
  importFromFile(file), // Parse uploaded file
  getTemplates(),
  applyTemplate(id)
}
```

### MemoryBank (Part 2)
```javascript
export {
  init(),
  cleanup(),
  getStatus(),
  createEntry(entry),
  getEntry(id),
  updateEntry(id, data),
  deleteEntry(id),
  listEntries(filter),
  searchEntries(query)  // Simple text search only
}
```

### VSCodeConnector (Part 2)
```javascript
export {
  init(),
  cleanup(),
  getStatus(),
  isVSCodeAvailable(),  // Check URI protocol
  sendToVSCode(memory), // Open vscode:// URI
  formatForVSCode(entry) // Convert memory to VS Code format
}
```

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO
- **User wants tests**: Manual-only for M1-M3, build infra in M4
- **Framework**: None (manual verification)
- **QA approach**: Exhaustive manual verification with evidence

### Manual QA Standards

**For each task, verification includes:**

| Deliverable Type | Verification Method | Evidence Required |
|-----------------|---------------------|-------------------|
| Bug fix | grep command + visual inspection | Command output showing 0 matches |
| New JS module | Load extension, console check | Console screenshot, no errors |
| UI change | Browser interaction | Screenshot sequence |
| Storage operation | DevTools Application tab | Storage state screenshot |
| VS Code integration | URI trigger test | VS Code opens with correct params |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 0 (Start Immediately):
└── Part 0: Bug Fixes (TASK-0.1 → 0.3)
    - BUG-001: HTML encoding
    - BUG-006-008: CSS selectors
    - BUG-002-005: JS optional chaining
    [GATE-0: Bug fix verification]

Wave 1 (After Wave 0):
└── M1: Mode Manager (TASK-1.1 → 1.3)
    - mode-manager.js
    - Background service integration
    - Mode detection + persistence
    [GATE-1: Mode Manager verification]

Wave 2 (After Wave 1 - PARALLEL):
├── M2: SDK Client (TASK-2.1 → 2.4)
│   - sdk-client.js
│   - Connection handling
│   - Message protocol
│   - Graceful degradation
│
├── Part 1: Rules System (TASK-P1.1 → P1.5)
│   - storage-manager.js
│   - rules-manager.js
│   - manifest.json permissions
│   - Default templates
│   - automation.js
│
└── Part 2: Memory Bank (TASK-P2.1 → P2.4)
    - memory-bank.js
    - vscode-connector.js
    - Memory entry CRUD
    - VS Code URI integration
    [GATE-2: Parallel features verification]

Wave 3 (After Wave 2):
└── M3: Chat UI Unification (TASK-3.1 → 3.4)
    - Tab navigation UI
    - Dual-mode rendering
    - Rules tab UI
    - Memory tab UI
    [GATE-3: UI integration verification]

Wave 4 (After Wave 3):
└── M4: Testing & Documentation (TASK-4.1 → 4.3)
    - Test harness
    - Example tests
    - Manual test procedures
    [GATE-FINAL: Full verification]
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| TASK-0.1 | None | TASK-0.2 | None |
| TASK-0.2 | TASK-0.1 | TASK-0.3 | None |
| TASK-0.3 | TASK-0.2 | M1 | None |
| TASK-1.1 | Part 0 | TASK-1.2 | None |
| TASK-1.2 | TASK-1.1 | TASK-1.3 | None |
| TASK-1.3 | TASK-1.2 | Wave 2 | None |
| TASK-2.1-2.4 | M1 | M3 | Part 1, Part 2 |
| TASK-P1.1-P1.5 | M1 | M3 | M2, Part 2 |
| TASK-P2.1-P2.4 | M1 | M3 | M2, Part 1 |
| TASK-3.1-3.4 | Wave 2 | M4 | None |
| TASK-4.1-4.3 | M3 | None | None |

---

## TODOs

### Part 0: Bug Fixes

---

- [ ] TASK-0.1: Fix HTML Encoding Issue (BUG-001)

  **What to do**:
  - Open `sidepanel.html` line 129
  - Replace malformed Unicode `✅ ��援程式碼區塊` with `✅ 支援程式碼區塊`
  - Save file with UTF-8 encoding

  **Must NOT do**:
  - Change any other HTML content
  - Refactor surrounding code
  - Modify HTML structure

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single-line fix, trivial complexity
  - **Skills**: `[]`
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 0, first)
  - **Blocks**: TASK-0.2
  - **Blocked By**: None

  **References**:
  - `sidepanel.html:129` - Location of malformed Unicode
  - `.sisyphus/plans/sidepilot-enhancement-plan.md:18` - BUG-001 specification

  **Acceptance Criteria**:
  - [ ] Line 129 shows correct Unicode: `✅ 支援程式碼區塊`
  - [ ] File encoding is UTF-8 (no BOM)
  - [ ] Extension loads without encoding warnings

  **Manual Verification**:
  ```bash
  # Verify fix (run in project directory)
  grep "支援程式碼區塊" sidepanel.html
  # Expected: 1 match with correct Chinese characters
  
  # Verify no malformed characters remain
  grep "��" sidepanel.html
  # Expected: 0 matches
  ```

  **Commit**: YES
  - Message: `fix(html): correct malformed Unicode in sidepanel.html`
  - Files: `sidepanel.html`

---

- [ ] TASK-0.2: Fix CSS Selector Spacing Errors (BUG-006-008)

  **What to do**:
  - Fix all 14 CSS selector spacing errors in `styles.css`
  - Complete list:
    ```
    Line 11:  `: root` → `:root`
    Line 56:  `. toolbar` → `.toolbar`
    Line 118: `.btn-primary: disabled` → `.btn-primary:disabled`
    Line 156: `.btn-icon. active` → `.btn-icon.active`
    Line 166: `. btn-close` → `.btn-close`
    Line 189: `.page-info. visible` → `.page-info.visible`
    Line 256: `.loading-overlay. hidden` → `.loading-overlay.hidden`
    Line 257: `.error-overlay. hidden` → `.error-overlay.hidden`
    Line 365: `. capture-loading` → `.capture-loading`
    Line 430: `.capture-item-value. truncated` → `.capture-item-value.truncated`
    Line 435: `. capture-empty` → `.capture-empty`
    Line 441: `. capture-error` → `.capture-error`
    Line 501: `.welcome-overlay. hidden` → `.welcome-overlay.hidden`
    Line 565: `: :-webkit-scrollbar-track` → `::-webkit-scrollbar-track`
    ```

  **Must NOT do**:
  - Change any CSS property values
  - Add new styles
  - Refactor CSS structure
  - Change class names

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Repetitive find-replace, no logic changes
  - **Skills**: `[]`
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 0, second)
  - **Blocks**: TASK-0.3
  - **Blocked By**: TASK-0.1

  **References**:
  - `styles.css` - All 14 locations listed above
  - `.sisyphus/plans/sidepilot-enhancement-plan.md:44-61` - Complete fix list

  **Acceptance Criteria**:
  - [ ] All 14 selectors fixed
  - [ ] No CSS parsing errors
  - [ ] Extension styles render correctly

  **Manual Verification**:
  ```bash
  # Verify no space-prefixed selectors remain
  grep -E "^\s*:\s+root" styles.css          # Expected: 0 matches
  grep -E "\.\s+[a-z]" styles.css            # Expected: 0 matches (class with space)
  grep -E ":\s+disabled" styles.css          # Expected: 0 matches
  grep -E ":\s+:-webkit" styles.css          # Expected: 0 matches
  
  # Count total fixes (should be 14 correct selectors now)
  grep -c ":root" styles.css                 # Expected: 1
  grep -c "\.toolbar" styles.css             # Expected: at least 1
  ```

  **Commit**: YES
  - Message: `fix(css): correct 14 selector spacing errors in styles.css`
  - Files: `styles.css`

---

- [ ] TASK-0.3: Fix JavaScript Optional Chaining Spacing (BUG-002-005)

  **What to do**:
  - Fix all optional chaining spacing errors in `background.js` and `sidepanel.js`
  - Pattern: `?. ` → `?.` (remove space after optional chaining)
  - Known locations in background.js:
    - Line 76: `results[0]?. result` → `results[0]?.result`
    - Line 81, 97, 105: `err. message` → `err.message`
    - Line 101: spacing issues
  - Scan `sidepanel.js` for similar patterns

  **Must NOT do**:
  - Change any logic
  - Refactor code structure
  - Add error handling
  - Modify function signatures

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Find-replace pattern, no logic changes
  - **Skills**: `[]`
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 0, last)
  - **Blocks**: M1 (all of Wave 1)
  - **Blocked By**: TASK-0.2

  **References**:
  - `background.js:76,81,97,101,105` - Known spacing issues
  - `sidepanel.js` - Scan for similar patterns
  - `.sisyphus/plans/sidepilot-enhancement-plan.md:19-22` - BUG-002 to BUG-005

  **Acceptance Criteria**:
  - [ ] No `?. ` patterns remain (space after optional chaining)
  - [ ] No `err. ` patterns remain (space after property access)
  - [ ] Extension loads without JS errors
  - [ ] All existing functionality preserved

  **Manual Verification**:
  ```bash
  # Verify no spacing issues remain
  grep -E "\?\.\s+" background.js sidepanel.js
  # Expected: 0 matches
  
  grep -E "err\.\s+message" background.js
  # Expected: 0 matches
  
  # Load extension and check console
  # Expected: No syntax errors
  ```

  **Commit**: YES
  - Message: `fix(js): correct optional chaining spacing in background.js and sidepanel.js`
  - Files: `background.js`, `sidepanel.js`

---

### Quality Gate 0: Bug Fix Verification

**Trigger**: After TASK-0.3 completion

**Checklist**:
- [ ] `grep "��" sidepanel.html` returns 0 matches
- [ ] `grep -E "\.\s+[a-z]" styles.css` returns 0 matches
- [ ] `grep -E "\?\.\s+" *.js` returns 0 matches
- [ ] Extension loads in Chrome without console errors
- [ ] UI renders correctly (visual inspection)

**Pass Criteria**: ALL checks must pass before proceeding to M1

---

### M1: Mode Manager

---

- [ ] TASK-1.1: Create Mode Manager Module

  **What to do**:
  - Create `js/mode-manager.js`
  - Implement ModeManager class with interface:
    ```javascript
    export {
      init(),
      cleanup(),
      getStatus(),
      detectMode(),     // Check if Copilot CLI available
      getActiveMode(),  // Returns 'sdk' | 'iframe'
      setMode(mode),    // Manual override
      onModeChange(cb)  // Event subscription
    }
    ```
  - Detection logic:
    1. Check if `copilot` command exists (via background.js native messaging or localhost check)
    2. Check if port 4321 responds to health check
    3. If SDK available → 'sdk', else → 'iframe'
  - Persist mode preference to `sidepilot.mode.active`

  **Must NOT do**:
  - Implement SDK communication (that's M2)
  - Create UI for mode selection (that's M3)
  - Add auto-switching between modes during session
  - Add complex retry logic (simple detect only)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: New module with moderate complexity, requires Chrome API knowledge
  - **Skills**: `[]`
    - No special skills needed, standard Chrome Extension patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 1, first)
  - **Blocks**: TASK-1.2
  - **Blocked By**: Quality Gate 0 (all Part 0)

  **References**:
  - `background.js` - Service worker patterns to follow
  - `manifest.json` - Current permissions
  - `sidepilot-enhancement-plan.md:69-79` - SDK research findings

  **Acceptance Criteria**:
  - [ ] `js/mode-manager.js` exists with all exported functions
  - [ ] `ModeManager.init()` runs without errors
  - [ ] `ModeManager.detectMode()` returns 'sdk' or 'iframe'
  - [ ] Mode persists after sidepanel close/reopen
  - [ ] `onModeChange` callback fires when mode changes

  **Manual Verification**:
  ```javascript
  // In browser console (extension context)
  await ModeManager.init();
  console.log(ModeManager.getStatus());
  // Expected: { initialized: true, mode: 'sdk' | 'iframe' }
  
  ModeManager.onModeChange(m => console.log('Mode changed:', m));
  ModeManager.setMode('iframe');
  // Expected: Console shows "Mode changed: iframe"
  ```

  **Commit**: YES
  - Message: `feat(mode): add ModeManager module for SDK/iframe detection`
  - Files: `js/mode-manager.js`

---

- [ ] TASK-1.2: Integrate Mode Manager with Background Service

  **What to do**:
  - Update `background.js` to import and initialize ModeManager
  - Add message handler for mode queries:
    ```javascript
    case 'getMode':
      return ModeManager.getActiveMode();
    case 'setMode':
      return ModeManager.setMode(request.mode);
    case 'detectMode':
      return ModeManager.detectMode();
    ```
  - Add SDK availability check via localhost:4321 health endpoint

  **Must NOT do**:
  - Implement SDK communication protocol
  - Add persistent connection handling
  - Modify existing message handlers
  - Add complex error recovery

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Adding message handlers to existing pattern
  - **Skills**: `[]`
    - Standard Chrome Extension patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 1, second)
  - **Blocks**: TASK-1.3
  - **Blocked By**: TASK-1.1

  **References**:
  - `background.js:1-256` - Existing message handler patterns
  - `js/mode-manager.js` - Module to integrate

  **Acceptance Criteria**:
  - [ ] Background service imports ModeManager
  - [ ] `chrome.runtime.sendMessage({type: 'getMode'})` returns mode
  - [ ] Health check to localhost:4321 implemented with 5s timeout
  - [ ] No regression in existing background.js functionality

  **Manual Verification**:
  ```javascript
  // From sidepanel context
  const mode = await chrome.runtime.sendMessage({type: 'getMode'});
  console.log('Current mode:', mode);
  // Expected: 'sdk' or 'iframe'
  ```

  **Commit**: YES
  - Message: `feat(mode): integrate ModeManager with background service worker`
  - Files: `background.js`

---

- [ ] TASK-1.3: Add Mode Detection Pre-flight Check

  **What to do**:
  - Add startup check in `sidepanel.js` to detect mode on load
  - Display mode indicator in UI (temporary, for debugging)
  - If SDK unavailable, log warning but continue with iframe mode
  - Store detection result for M2 to use

  **Must NOT do**:
  - Create mode switch UI (that's M3)
  - Implement fallback logic during requests
  - Add retry loop for SDK detection
  - Block UI on detection failure

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple initialization code addition
  - **Skills**: `[]`
    - Standard patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 1, last)
  - **Blocks**: Wave 2 (M2, Part 1, Part 2)
  - **Blocked By**: TASK-1.2

  **References**:
  - `sidepanel.js:1-50` - Initialization patterns
  - `js/mode-manager.js` - Module API

  **Acceptance Criteria**:
  - [ ] Mode detected on sidepanel load
  - [ ] Console shows detected mode
  - [ ] No blocking if detection fails
  - [ ] Graceful fallback to iframe mode

  **Manual Verification**:
  ```
  1. Open Chrome DevTools on sidepanel
  2. Reload extension
  3. Check console for mode detection log
  Expected: "SidePilot: Detected mode: [sdk|iframe]"
  ```

  **Commit**: YES
  - Message: `feat(mode): add mode pre-flight check on sidepanel load`
  - Files: `sidepanel.js`

---

### Quality Gate 1: Mode Manager Verification

**Trigger**: After TASK-1.3 completion

**Checklist**:
- [ ] `js/mode-manager.js` exists and exports all interface functions
- [ ] Mode detection works (returns 'sdk' or 'iframe')
- [ ] Mode persists in chrome.storage.local
- [ ] Background service responds to mode queries
- [ ] No console errors on extension load

**Pass Criteria**: ALL checks must pass before proceeding to Wave 2

---

### M2: SDK Client

---

- [ ] TASK-2.1: Create SDK Client Module

  **What to do**:
  - Create `js/sdk-client.js`
  - Implement SDKClient class with interface:
    ```javascript
    export {
      init(),
      cleanup(),
      getStatus(),
      isConnected(),
      connect(port = 4321),
      disconnect(),
      sendMessage(msg),
      onConnectionChange(cb)
    }
    ```
  - Connection handling:
    - Connect timeout: 5 seconds
    - Request timeout: 30 seconds
    - Health check interval: 30 seconds

  **Must NOT do**:
  - Handle UI rendering
  - Implement conversation persistence
  - Add features not in Copilot SDK
  - Implement retry logic beyond single reconnect attempt

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Network communication, async handling, error states
  - **Skills**: `[]`
    - Standard async patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Part 1, Part 2)
  - **Blocks**: TASK-2.2
  - **Blocked By**: Quality Gate 1

  **References**:
  - `sidepilot-enhancement-plan.md:69-79` - SDK architecture research
  - `background.js` - Existing fetch patterns

  **Acceptance Criteria**:
  - [ ] `js/sdk-client.js` exists with all exported functions
  - [ ] `SDKClient.connect()` attempts connection to localhost:4321
  - [ ] `SDKClient.sendMessage()` returns Promise<response>
  - [ ] Connection timeout after 5 seconds
  - [ ] Request timeout after 30 seconds
  - [ ] `onConnectionChange` fires on connect/disconnect

  **Manual Verification**:
  ```javascript
  // With Copilot CLI running
  await SDKClient.init();
  await SDKClient.connect();
  console.log(SDKClient.isConnected()); // true
  
  const response = await SDKClient.sendMessage({type: 'ping'});
  console.log(response);
  
  // Without Copilot CLI
  await SDKClient.connect(); // Should timeout after 5s
  console.log(SDKClient.isConnected()); // false
  ```

  **Commit**: YES
  - Message: `feat(sdk): add SDKClient module for Copilot CLI communication`
  - Files: `js/sdk-client.js`

---

- [ ] TASK-2.2: Implement SDK Message Protocol

  **What to do**:
  - Add message formatting for Copilot SDK protocol
  - Implement request/response matching (correlation IDs)
  - Handle streaming responses if supported
  - Add message types: `chat`, `ping`, `status`

  **Must NOT do**:
  - Implement custom message types beyond SDK spec
  - Add message persistence
  - Add message encryption
  - Handle UI updates (that's M3)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Protocol implementation, well-defined spec
  - **Skills**: `[]`
    - Standard async patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO (within M2)
  - **Parallel Group**: Wave 2 (M2 internal sequence)
  - **Blocks**: TASK-2.3
  - **Blocked By**: TASK-2.1

  **References**:
  - `js/sdk-client.js` - Base module
  - Copilot CLI documentation (external)

  **Acceptance Criteria**:
  - [ ] Messages have unique correlation IDs
  - [ ] Response correctly matched to request
  - [ ] `chat` message type sends user input, receives AI response
  - [ ] `ping` message type for health check
  - [ ] Timeout on no response

  **Manual Verification**:
  ```javascript
  const response = await SDKClient.sendMessage({
    type: 'chat',
    content: 'Hello, what is 2+2?'
  });
  console.log(response.content); // Should contain answer
  ```

  **Commit**: YES
  - Message: `feat(sdk): implement SDK message protocol with correlation IDs`
  - Files: `js/sdk-client.js`

---

- [ ] TASK-2.3: Add Graceful Degradation to SDK Client

  **What to do**:
  - Add automatic fallback detection
  - Emit events when SDK becomes unavailable
  - Provide clear error messages for different failure modes:
    - SDK not installed
    - SDK not running
    - Port conflict
    - Connection timeout
    - Request timeout

  **Must NOT do**:
  - Auto-switch to iframe mode (that's M3 responsibility)
  - Retry indefinitely
  - Hide errors from user
  - Implement workarounds for SDK bugs

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Error handling additions to existing module
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (within M2)
  - **Parallel Group**: Wave 2 (M2 internal sequence)
  - **Blocks**: TASK-2.4
  - **Blocked By**: TASK-2.2

  **References**:
  - `js/sdk-client.js` - Module to enhance
  - `js/mode-manager.js` - Event patterns to follow

  **Acceptance Criteria**:
  - [ ] Clear error messages for each failure mode
  - [ ] `onConnectionChange` fires with error details
  - [ ] No unhandled promise rejections
  - [ ] getStatus() returns error state when applicable

  **Manual Verification**:
  ```javascript
  // Stop Copilot CLI, then:
  try {
    await SDKClient.connect();
  } catch (e) {
    console.log(e.code); // 'CONNECTION_TIMEOUT'
    console.log(e.message); // Human-readable message
  }
  ```

  **Commit**: YES
  - Message: `feat(sdk): add graceful degradation with clear error messages`
  - Files: `js/sdk-client.js`

---

- [ ] TASK-2.4: Integrate SDK Client with Background Service

  **What to do**:
  - Update `background.js` to import and initialize SDKClient
  - Add message handlers:
    ```javascript
    case 'sdkConnect':
      return SDKClient.connect();
    case 'sdkSend':
      return SDKClient.sendMessage(request.message);
    case 'sdkStatus':
      return SDKClient.getStatus();
    case 'sdkDisconnect':
      return SDKClient.disconnect();
    ```
  - Coordinate with ModeManager for mode-aware routing

  **Must NOT do**:
  - Duplicate SDK logic in background.js
  - Add auto-reconnect daemon
  - Implement message queueing
  - Handle UI updates

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Adding handlers to existing pattern
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (within M2)
  - **Parallel Group**: Wave 2 (M2 final)
  - **Blocks**: M3
  - **Blocked By**: TASK-2.3

  **References**:
  - `background.js` - Existing handlers
  - `js/sdk-client.js` - Module to integrate
  - `js/mode-manager.js` - Mode coordination

  **Acceptance Criteria**:
  - [ ] Background imports SDKClient
  - [ ] All SDK message handlers working
  - [ ] Mode-aware: only uses SDK when mode is 'sdk'
  - [ ] No regression in existing functionality

  **Manual Verification**:
  ```javascript
  // From sidepanel
  await chrome.runtime.sendMessage({type: 'sdkConnect'});
  const status = await chrome.runtime.sendMessage({type: 'sdkStatus'});
  console.log(status); // { connected: true/false, ... }
  ```

  **Commit**: YES
  - Message: `feat(sdk): integrate SDKClient with background service worker`
  - Files: `background.js`

---

### Part 1: Rules System (Parallel with M2, Part 2)

---

- [ ] TASK-P1.1: Create Storage Manager Module

  **What to do**:
  - Create `js/storage-manager.js`
  - Implement StorageManager class:
    ```javascript
    export {
      init(),
      cleanup(),
      getStatus(),
      save(key, value),
      load(key),
      delete(key),
      getBytesInUse(),
      onStorageChange(cb)
    }
    ```
  - Use `chrome.storage.local` as backend
  - Namespace all keys with `sidepilot.` prefix
  - Handle quota errors gracefully

  **Must NOT do**:
  - Implement sync storage (chrome.storage.sync)
  - Add encryption
  - Add compression
  - Implement caching layer

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Standard Chrome storage wrapper
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with M2, Part 2)
  - **Blocks**: TASK-P1.2
  - **Blocked By**: Quality Gate 1

  **References**:
  - `manifest.json` - Add "storage" permission
  - Chrome Storage API docs

  **Acceptance Criteria**:
  - [ ] `js/storage-manager.js` exists
  - [ ] save/load/delete work correctly
  - [ ] Keys namespaced with `sidepilot.`
  - [ ] Quota check returns bytes in use
  - [ ] Storage change events fire

  **Manual Verification**:
  ```javascript
  await StorageManager.init();
  await StorageManager.save('test.key', {foo: 'bar'});
  const value = await StorageManager.load('test.key');
  console.log(value); // {foo: 'bar'}
  
  // Check in DevTools > Application > Storage
  // Key should be "sidepilot.test.key"
  ```

  **Commit**: YES
  - Message: `feat(storage): add StorageManager module for chrome.storage.local`
  - Files: `js/storage-manager.js`

---

- [ ] TASK-P1.2: Update Manifest Permissions

  **What to do**:
  - Add `"storage"` permission for data persistence
  - Add `"downloads"` permission for file export
  - Verify no breaking changes to existing permissions

  **Must NOT do**:
  - Add unnecessary permissions
  - Change existing permissions
  - Add host permissions

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file, minimal change
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (within Part 1)
  - **Parallel Group**: Wave 2 (Part 1 internal)
  - **Blocks**: TASK-P1.3
  - **Blocked By**: TASK-P1.1

  **References**:
  - `manifest.json:5-15` - Current permissions
  - `.sisyphus/plans/sidepilot-enhancement-plan.md:103-115`

  **Acceptance Criteria**:
  - [ ] `"storage"` in permissions array
  - [ ] `"downloads"` in permissions array
  - [ ] Extension still loads correctly
  - [ ] No new permission warnings on install

  **Manual Verification**:
  ```bash
  grep -E "storage|downloads" manifest.json
  # Expected: Both present in permissions array
  ```

  **Commit**: YES (group with TASK-P1.1)
  - Message: `feat(storage): add storage and downloads permissions`
  - Files: `manifest.json`

---

- [ ] TASK-P1.3: Create Rules Manager Module

  **What to do**:
  - Create `js/rules-manager.js`
  - Implement RulesManager class:
    ```javascript
    export {
      init(),
      cleanup(),
      getStatus(),
      saveRules(content),
      loadRules(),
      exportAsFile(),
      importFromFile(file),
      getTemplates(),
      applyTemplate(id)
    }
    ```
  - Storage keys:
    - `sidepilot.rules.content`
    - `sidepilot.rules.lastModified`
    - `sidepilot.rules.version`
  - Export format: `.github/copilot-instructions.md` compatible

  **Must NOT do**:
  - Implement rule engine/conditions
  - Add rule validation
  - Add rule inheritance
  - Implement rule priorities

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: CRUD operations, file handling
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (within Part 1)
  - **Parallel Group**: Wave 2 (Part 1 internal)
  - **Blocks**: TASK-P1.4
  - **Blocked By**: TASK-P1.2

  **References**:
  - `js/storage-manager.js` - Dependency
  - `.sisyphus/plans/sidepilot-enhancement-plan.md:82-99` - Storage schema
  - GitHub Copilot custom instructions format

  **Acceptance Criteria**:
  - [ ] `js/rules-manager.js` exists
  - [ ] Rules save/load correctly via StorageManager
  - [ ] Export triggers file download
  - [ ] Import parses markdown file
  - [ ] Templates retrievable

  **Manual Verification**:
  ```javascript
  await RulesManager.init();
  await RulesManager.saveRules('# My Rules\n- Use TypeScript');
  const rules = await RulesManager.loadRules();
  console.log(rules); // '# My Rules\n- Use TypeScript'
  
  // Export
  await RulesManager.exportAsFile();
  // Expected: File download starts
  ```

  **Commit**: YES
  - Message: `feat(rules): add RulesManager module for copilot instructions`
  - Files: `js/rules-manager.js`

---

- [ ] TASK-P1.4: Create Default Rules Templates

  **What to do**:
  - Create `templates/default-rules.md` with general-purpose template
  - Add TypeScript project template content
  - Add React project template content
  - Register templates in RulesManager

  **Must NOT do**:
  - Create complex template system
  - Add template variables/substitution
  - Add more than 3 templates

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation/template content
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (within Part 1)
  - **Parallel Group**: Wave 2 (Part 1 internal)
  - **Blocks**: TASK-P1.5
  - **Blocked By**: TASK-P1.3

  **References**:
  - GitHub Copilot instructions format
  - `.sisyphus/plans/sidepilot-enhancement-plan.md:117-130`

  **Acceptance Criteria**:
  - [ ] `templates/default-rules.md` exists
  - [ ] At least 3 templates available
  - [ ] Templates follow GitHub Copilot format
  - [ ] `RulesManager.getTemplates()` returns all templates

  **Manual Verification**:
  ```javascript
  const templates = await RulesManager.getTemplates();
  console.log(templates.length >= 3); // true
  console.log(templates[0].name); // 'Default'
  ```

  **Commit**: YES
  - Message: `feat(rules): add default copilot instruction templates`
  - Files: `templates/default-rules.md`, `templates/typescript-rules.md`, `templates/react-rules.md`

---

- [ ] TASK-P1.5: Create Automation Module

  **What to do**:
  - Create `js/automation.js`
  - Implement context auto-injection:
    ```javascript
    export {
      init(),
      cleanup(),
      getStatus(),
      capturePageContext(),
      formatAsContext(pageData),
      getSettings(),
      updateSettings(settings)
    }
    ```
  - Settings stored at `sidepilot.automation.settings`
  - Context max length: 5000 chars (configurable)

  **Must NOT do**:
  - Auto-capture without user action
  - Implement complex context parsing
  - Add AI-based summarization
  - Run automatically on page load

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Page content extraction, formatting
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (within Part 1)
  - **Parallel Group**: Wave 2 (Part 1 final)
  - **Blocks**: M3
  - **Blocked By**: TASK-P1.4

  **References**:
  - `sidepanel.js` - Existing page capture logic
  - `background.js:50-100` - Content script execution

  **Acceptance Criteria**:
  - [ ] `js/automation.js` exists
  - [ ] Page context captures correctly
  - [ ] Context formatted for Copilot
  - [ ] Settings persist
  - [ ] Max length enforced

  **Manual Verification**:
  ```javascript
  await Automation.init();
  const context = await Automation.capturePageContext();
  console.log(context.length <= 5000); // true
  console.log(Automation.formatAsContext(context));
  ```

  **Commit**: YES
  - Message: `feat(automation): add context capture and injection module`
  - Files: `js/automation.js`

---

### Part 2: Memory Bank (Parallel with M2, Part 1)

---

- [ ] TASK-P2.1: Create Memory Bank Module

  **What to do**:
  - Create `js/memory-bank.js`
  - Implement MemoryBank class:
    ```javascript
    export {
      init(),
      cleanup(),
      getStatus(),
      createEntry(entry),
      getEntry(id),
      updateEntry(id, data),
      deleteEntry(id),
      listEntries(filter),
      searchEntries(query)
    }
    ```
  - Entry structure per storage schema
  - Simple text search (no full-text indexing)
  - Storage at `sidepilot.memory.entries`

  **Must NOT do**:
  - Implement complex search/indexing
  - Add tags system
  - Add entry linking
  - Implement sync across devices

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: CRUD + search, moderate complexity
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with M2, Part 1)
  - **Blocks**: TASK-P2.2
  - **Blocked By**: Quality Gate 1

  **References**:
  - `js/storage-manager.js` - Dependency
  - `.sisyphus/plans/sidepilot-enhancement-plan.md:246-271` - Memory schema
  - Storage schema defined above

  **Acceptance Criteria**:
  - [ ] `js/memory-bank.js` exists
  - [ ] CRUD operations work
  - [ ] Entries persist across restarts
  - [ ] Simple search by title/content works
  - [ ] List with filter works

  **Manual Verification**:
  ```javascript
  await MemoryBank.init();
  const id = await MemoryBank.createEntry({
    type: 'task',
    title: 'Test Task',
    content: 'Test content'
  });
  const entry = await MemoryBank.getEntry(id);
  console.log(entry.title); // 'Test Task'
  
  const results = await MemoryBank.searchEntries('Test');
  console.log(results.length > 0); // true
  ```

  **Commit**: YES
  - Message: `feat(memory): add MemoryBank module for task/note storage`
  - Files: `js/memory-bank.js`

---

- [ ] TASK-P2.2: Create VS Code Connector Module

  **What to do**:
  - Create `js/vscode-connector.js`
  - Implement VSCodeConnector:
    ```javascript
    export {
      init(),
      cleanup(),
      getStatus(),
      isVSCodeAvailable(),
      sendToVSCode(memory),
      formatForVSCode(entry)
    }
    ```
  - URI format: `vscode://sidepilot.vscode-extension?action=createTask&data=...`
  - Handle URI encoding/decoding

  **Must NOT do**:
  - Implement bidirectional sync
  - Create VS Code extension
  - Add native messaging
  - Implement file watching

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: URI construction, simple module
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (within Part 2)
  - **Parallel Group**: Wave 2 (Part 2 internal)
  - **Blocks**: TASK-P2.3
  - **Blocked By**: TASK-P2.1

  **References**:
  - `.sisyphus/plans/sidepilot-enhancement-plan.md:277-298` - VS Code URI spec

  **Acceptance Criteria**:
  - [ ] `js/vscode-connector.js` exists
  - [ ] URI correctly formatted
  - [ ] Data properly encoded
  - [ ] Clicking "Send to VS Code" opens VS Code
  - [ ] Graceful failure if VS Code not available

  **Manual Verification**:
  ```javascript
  const entry = { title: 'Test', content: 'Task content' };
  const uri = VSCodeConnector.formatForVSCode(entry);
  console.log(uri.startsWith('vscode://')); // true
  
  await VSCodeConnector.sendToVSCode(entry);
  // Expected: VS Code opens (if installed)
  ```

  **Commit**: YES
  - Message: `feat(memory): add VSCodeConnector for URI-based task export`
  - Files: `js/vscode-connector.js`

---

- [ ] TASK-P2.3: Integrate Memory Bank with Storage Manager

  **What to do**:
  - Wire MemoryBank to use StorageManager for persistence
  - Implement index updates on CRUD operations
  - Add storage migration logic for version changes
  - Handle storage quota warnings

  **Must NOT do**:
  - Implement complex indexing
  - Add background sync
  - Add data compression
  - Implement conflict resolution

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Integration code, straightforward
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (within Part 2)
  - **Parallel Group**: Wave 2 (Part 2 internal)
  - **Blocks**: TASK-P2.4
  - **Blocked By**: TASK-P2.2

  **References**:
  - `js/memory-bank.js` - Module to update
  - `js/storage-manager.js` - Dependency

  **Acceptance Criteria**:
  - [ ] Memory entries persist to chrome.storage.local
  - [ ] Index updates on create/delete
  - [ ] Quota warning at 80% usage
  - [ ] Data survives extension update

  **Manual Verification**:
  ```javascript
  // Create entry
  await MemoryBank.createEntry({title: 'Persistent Test'});
  
  // Reload extension
  // Verify entry still exists
  const entries = await MemoryBank.listEntries();
  console.log(entries.some(e => e.title === 'Persistent Test')); // true
  ```

  **Commit**: YES (group with TASK-P2.2)
  - Message: `feat(memory): integrate MemoryBank with StorageManager`
  - Files: `js/memory-bank.js`

---

- [ ] TASK-P2.4: Add Memory Entry Types and Status

  **What to do**:
  - Define entry types: `task`, `note`, `context`, `reference`
  - Define status values: `pending`, `in_progress`, `done`
  - Add type/status filtering to listEntries
  - Add status update function

  **Must NOT do**:
  - Add custom types
  - Add status transitions/workflows
  - Add notifications
  - Add due dates/reminders

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Enum additions and filter logic
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (within Part 2)
  - **Parallel Group**: Wave 2 (Part 2 final)
  - **Blocks**: M3
  - **Blocked By**: TASK-P2.3

  **References**:
  - `js/memory-bank.js` - Module to update
  - `.sisyphus/plans/sidepilot-enhancement-plan.md:249-260`

  **Acceptance Criteria**:
  - [ ] Entry types enforced
  - [ ] Status values enforced
  - [ ] Filter by type works
  - [ ] Filter by status works
  - [ ] Status update persists

  **Manual Verification**:
  ```javascript
  await MemoryBank.createEntry({type: 'task', status: 'pending', ...});
  const tasks = await MemoryBank.listEntries({type: 'task'});
  const pending = await MemoryBank.listEntries({status: 'pending'});
  console.log(tasks.length > 0, pending.length > 0); // true, true
  ```

  **Commit**: YES
  - Message: `feat(memory): add entry types and status filtering`
  - Files: `js/memory-bank.js`

---

### Quality Gate 2: Parallel Features Verification

**Trigger**: After M2, Part 1, and Part 2 all complete

**Checklist**:
- [ ] M2: SDKClient connects when CLI available
- [ ] M2: SDKClient gracefully handles unavailable SDK
- [ ] Part 1: Rules save and persist
- [ ] Part 1: Rules export downloads file
- [ ] Part 2: Memory entries persist
- [ ] Part 2: VS Code URI opens correctly
- [ ] No storage key conflicts (all namespaced)
- [ ] All modules initialize without errors

**Pass Criteria**: ALL checks must pass before proceeding to M3

---

### M3: Chat UI Unification

---

- [ ] TASK-3.1: Add Tab Navigation UI

  **What to do**:
  - Update `sidepanel.html` with tab bar:
    ```html
    <div class="tab-bar">
      <button class="tab active" data-tab="copilot">Copilot</button>
      <button class="tab" data-tab="rules">Rules</button>
      <button class="tab" data-tab="memory">Memory</button>
    </div>
    <div class="tab-content" id="copilot-tab">...</div>
    <div class="tab-content hidden" id="rules-tab">...</div>
    <div class="tab-content hidden" id="memory-tab">...</div>
    ```
  - Add tab switching logic to `sidepanel.js`

  **Must NOT do**:
  - Add animations
  - Change existing Copilot tab content
  - Add keyboard shortcuts
  - Implement tab persistence

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI changes, tab interactions
  - **Skills**: `["frontend-ui-ux"]`
    - UI/UX design considerations

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 3, first)
  - **Blocks**: TASK-3.2
  - **Blocked By**: Quality Gate 2

  **References**:
  - `sidepanel.html` - Current structure
  - `sidepanel.js` - Event handling patterns
  - `styles.css` - Existing button styles
  - `.sisyphus/plans/sidepilot-enhancement-plan.md:136-151` - UI mockup

  **Acceptance Criteria**:
  - [ ] Tab bar visible at top
  - [ ] Clicking tab switches content
  - [ ] Active tab visually indicated
  - [ ] Content areas show/hide correctly
  - [ ] No layout shift on tab switch

  **Manual Verification**:
  1. Open sidepanel
  2. Click "Rules" tab → Rules content shows
  3. Click "Memory" tab → Memory content shows
  4. Click "Copilot" tab → Chat content shows
  5. Active tab has visual indicator

  **Commit**: YES
  - Message: `feat(ui): add tab navigation for Copilot/Rules/Memory`
  - Files: `sidepanel.html`, `sidepanel.js`

---

- [ ] TASK-3.2: Add Rules Tab UI

  **What to do**:
  - Create Rules editor area in `sidepanel.html`:
    ```html
    <div id="rules-tab" class="tab-content hidden">
      <textarea id="rules-editor" placeholder="# Project Instructions..."></textarea>
      <div class="rules-toolbar">
        <button id="save-rules">Save</button>
        <button id="export-rules">Export</button>
        <button id="import-rules">Import</button>
        <select id="template-select">...</select>
      </div>
    </div>
    ```
  - Wire buttons to RulesManager
  - Add file input for import

  **Must NOT do**:
  - Implement Monaco editor
  - Add syntax highlighting
  - Add markdown preview
  - Add auto-save

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Form UI, file handling
  - **Skills**: `["frontend-ui-ux"]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 3, second)
  - **Blocks**: TASK-3.3
  - **Blocked By**: TASK-3.1

  **References**:
  - `js/rules-manager.js` - Module to integrate
  - `.sisyphus/plans/sidepilot-enhancement-plan.md:136-151`

  **Acceptance Criteria**:
  - [ ] Textarea shows rules content
  - [ ] Save button persists rules
  - [ ] Export button triggers download
  - [ ] Import button accepts .md file
  - [ ] Template dropdown applies template

  **Manual Verification**:
  1. Switch to Rules tab
  2. Type rules content
  3. Click Save → Reload → Content persists
  4. Click Export → File downloads
  5. Click Import → Select file → Content loads
  6. Select template → Content replaces

  **Commit**: YES
  - Message: `feat(ui): add Rules tab with editor and toolbar`
  - Files: `sidepanel.html`, `sidepanel.js`, `styles.css`

---

- [ ] TASK-3.3: Add Memory Tab UI

  **What to do**:
  - Create Memory list area in `sidepanel.html`:
    ```html
    <div id="memory-tab" class="tab-content hidden">
      <div class="memory-toolbar">
        <button id="add-memory">+ Add</button>
        <input type="search" id="memory-search" placeholder="Search...">
        <select id="memory-filter">
          <option value="">All</option>
          <option value="task">Tasks</option>
          <option value="note">Notes</option>
        </select>
      </div>
      <div id="memory-list"></div>
    </div>
    ```
  - Wire to MemoryBank
  - Add entry card template
  - Add "Send to VS Code" button per entry

  **Must NOT do**:
  - Add drag-and-drop reordering
  - Add bulk actions
  - Add entry nesting
  - Add rich text editing

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: List UI, search/filter interactions
  - **Skills**: `["frontend-ui-ux"]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 3, third)
  - **Blocks**: TASK-3.4
  - **Blocked By**: TASK-3.2

  **References**:
  - `js/memory-bank.js` - Module to integrate
  - `js/vscode-connector.js` - VS Code integration
  - `.sisyphus/plans/sidepilot-enhancement-plan.md:318-333`

  **Acceptance Criteria**:
  - [ ] Memory list renders entries
  - [ ] Add button opens create form
  - [ ] Search filters list in real-time
  - [ ] Filter dropdown works
  - [ ] "Send to VS Code" opens VS Code
  - [ ] Entry shows status badge

  **Manual Verification**:
  1. Switch to Memory tab
  2. Click Add → Create entry → Entry appears in list
  3. Type in search → List filters
  4. Select filter → List filters
  5. Click "Send to VS Code" → VS Code opens
  6. Change status → Badge updates

  **Commit**: YES
  - Message: `feat(ui): add Memory tab with list, search, and VS Code export`
  - Files: `sidepanel.html`, `sidepanel.js`, `styles.css`

---

- [ ] TASK-3.4: Add Mode Indicator and Dual-Mode Rendering

  **What to do**:
  - Add mode indicator to UI:
    ```html
    <div class="mode-indicator">
      <span class="mode-badge" id="mode-badge">SDK</span>
    </div>
    ```
  - Update Copilot tab to work with both modes:
    - SDK mode: Use SDKClient for messages
    - iframe mode: Use existing iframe approach
  - Mode indicator updates based on ModeManager

  **Must NOT do**:
  - Add mode switch UI (auto-detect only for now)
  - Implement mid-conversation mode switching
  - Add fallback retry logic
  - Change iframe implementation

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration of multiple modules, conditional rendering
  - **Skills**: `["frontend-ui-ux"]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 3, last)
  - **Blocks**: M4
  - **Blocked By**: TASK-3.3

  **References**:
  - `js/mode-manager.js` - Mode state
  - `js/sdk-client.js` - SDK communication
  - `sidepanel.js` - Existing iframe logic

  **Acceptance Criteria**:
  - [ ] Mode badge shows current mode
  - [ ] Badge updates when mode changes
  - [ ] Chat works in SDK mode
  - [ ] Chat works in iframe mode
  - [ ] Mode-specific UI elements show/hide

  **Manual Verification**:
  1. Start with Copilot CLI running → Badge shows "SDK"
  2. Send message → Receives response from SDK
  3. Stop Copilot CLI → Reload → Badge shows "iframe"
  4. Send message → Receives response from iframe
  5. Mode indicator is always visible

  **Commit**: YES
  - Message: `feat(ui): add mode indicator and dual-mode chat rendering`
  - Files: `sidepanel.html`, `sidepanel.js`, `styles.css`

---

### Quality Gate 3: UI Integration Verification

**Trigger**: After TASK-3.4 completion

**Checklist**:
- [ ] Tab navigation works without errors
- [ ] Rules tab saves/exports/imports correctly
- [ ] Memory tab creates/lists/searches entries
- [ ] Mode indicator reflects actual mode
- [ ] Chat works in SDK mode (if CLI available)
- [ ] Chat works in iframe mode (fallback)
- [ ] No visual regressions in existing UI
- [ ] No console errors during normal use

**Pass Criteria**: ALL checks must pass before proceeding to M4

---

### M4: Testing & Documentation

---

- [ ] TASK-4.1: Create Test Harness

  **What to do**:
  - Create `tests/test-harness.js`:
    ```javascript
    class TestHarness {
      constructor() { this.tests = []; this.results = []; }
      addTest(name, fn) { this.tests.push({name, fn}); }
      async run() { /* execute all tests */ }
      report() { /* console output */ }
    }
    ```
  - Create `tests/run-tests.html` to load harness in browser
  - Support async tests
  - Output pass/fail with details

  **Must NOT do**:
  - Use external test frameworks (Jest, Mocha)
  - Add TypeScript
  - Add code coverage
  - Add CI/CD integration

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Simple test runner implementation
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 4, first)
  - **Blocks**: TASK-4.2
  - **Blocked By**: Quality Gate 3

  **References**:
  - Standard test harness patterns
  - `.sisyphus/plans/sidepilot-enhancement-plan.md:387-403`

  **Acceptance Criteria**:
  - [ ] `tests/test-harness.js` exists
  - [ ] `tests/run-tests.html` loads harness
  - [ ] Tests can be added via `addTest()`
  - [ ] `run()` executes all tests
  - [ ] `report()` outputs results
  - [ ] Async tests supported

  **Manual Verification**:
  ```javascript
  const harness = new TestHarness();
  harness.addTest('simple', () => { if (1 !== 1) throw 'fail'; });
  harness.addTest('async', async () => { await Promise.resolve(); });
  await harness.run();
  harness.report();
  // Expected: "2 passed, 0 failed"
  ```

  **Commit**: YES
  - Message: `feat(test): add test harness infrastructure`
  - Files: `tests/test-harness.js`, `tests/run-tests.html`

---

- [ ] TASK-4.2: Add Example Tests

  **What to do**:
  - Create `tests/storage-manager.test.js` with 3+ tests
  - Create `tests/rules-manager.test.js` with 3+ tests
  - Create `tests/memory-bank.test.js` with 3+ tests
  - Demonstrate harness usage patterns

  **Must NOT do**:
  - Achieve full coverage
  - Test UI components
  - Add mock framework
  - Test third-party integrations

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Writing test cases, straightforward
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 4, second)
  - **Blocks**: TASK-4.3
  - **Blocked By**: TASK-4.1

  **References**:
  - `js/storage-manager.js` - Module to test
  - `js/rules-manager.js` - Module to test
  - `js/memory-bank.js` - Module to test
  - `tests/test-harness.js` - Test runner

  **Acceptance Criteria**:
  - [ ] 3+ tests for StorageManager
  - [ ] 3+ tests for RulesManager
  - [ ] 3+ tests for MemoryBank
  - [ ] All tests pass
  - [ ] Tests demonstrate harness patterns

  **Manual Verification**:
  1. Open `tests/run-tests.html`
  2. Click "Run Tests"
  3. Expected: 9+ tests pass, 0 fail

  **Commit**: YES
  - Message: `feat(test): add example tests for storage, rules, and memory modules`
  - Files: `tests/storage-manager.test.js`, `tests/rules-manager.test.js`, `tests/memory-bank.test.js`

---

- [ ] TASK-4.3: Create Manual Test Procedures Document

  **What to do**:
  - Create `tests/MANUAL_TESTS.md`
  - Document step-by-step verification for each feature:
    - Mode detection
    - SDK connection
    - Rules CRUD
    - Memory CRUD
    - VS Code export
    - Tab navigation
    - Error scenarios
  - Include expected results for each step
  - Include screenshots locations

  **Must NOT do**:
  - Create video tutorials
  - Add automated screenshot capture
  - Duplicate test harness tests
  - Include developer-only tests

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation task
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 4, last)
  - **Blocks**: None (final task)
  - **Blocked By**: TASK-4.2

  **References**:
  - All acceptance criteria from previous tasks
  - `.sisyphus/plans/sidepilot-enhancement-plan.md:421-428`

  **Acceptance Criteria**:
  - [ ] `tests/MANUAL_TESTS.md` exists
  - [ ] All major features have test procedures
  - [ ] Steps are numbered and clear
  - [ ] Expected results are specific
  - [ ] Error scenarios included

  **Manual Verification**:
  - Read document
  - Follow first test procedure
  - Verify it's clear and accurate

  **Commit**: YES
  - Message: `docs(test): add manual test procedures document`
  - Files: `tests/MANUAL_TESTS.md`

---

### Quality Gate Final: Complete Verification

**Trigger**: After TASK-4.3 completion

**Checklist**:
- [ ] All bug fixes verified (Part 0)
- [ ] Mode detection works (M1)
- [ ] SDK connection works when CLI available (M2)
- [ ] Rules persist and export correctly (Part 1)
- [ ] Memory entries persist and export to VS Code (Part 2)
- [ ] Tab UI works without errors (M3)
- [ ] Test harness runs all tests successfully (M4)
- [ ] Manual test procedures document complete
- [ ] No console errors in normal operation
- [ ] Extension loads and functions in fresh Chrome profile

**Pass Criteria**: ALL checks must pass for v2.0 release readiness

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| TASK-0.1 | `fix(html): correct malformed Unicode in sidepanel.html` | sidepanel.html |
| TASK-0.2 | `fix(css): correct 14 selector spacing errors in styles.css` | styles.css |
| TASK-0.3 | `fix(js): correct optional chaining spacing in background.js and sidepanel.js` | background.js, sidepanel.js |
| TASK-1.1 | `feat(mode): add ModeManager module for SDK/iframe detection` | js/mode-manager.js |
| TASK-1.2 | `feat(mode): integrate ModeManager with background service worker` | background.js |
| TASK-1.3 | `feat(mode): add mode pre-flight check on sidepanel load` | sidepanel.js |
| TASK-2.1 | `feat(sdk): add SDKClient module for Copilot CLI communication` | js/sdk-client.js |
| TASK-2.2 | `feat(sdk): implement SDK message protocol with correlation IDs` | js/sdk-client.js |
| TASK-2.3 | `feat(sdk): add graceful degradation with clear error messages` | js/sdk-client.js |
| TASK-2.4 | `feat(sdk): integrate SDKClient with background service worker` | background.js |
| TASK-P1.1-P1.2 | `feat(storage): add StorageManager module and permissions` | js/storage-manager.js, manifest.json |
| TASK-P1.3 | `feat(rules): add RulesManager module for copilot instructions` | js/rules-manager.js |
| TASK-P1.4 | `feat(rules): add default copilot instruction templates` | templates/*.md |
| TASK-P1.5 | `feat(automation): add context capture and injection module` | js/automation.js |
| TASK-P2.1 | `feat(memory): add MemoryBank module for task/note storage` | js/memory-bank.js |
| TASK-P2.2-P2.3 | `feat(memory): add VSCodeConnector and integrate with StorageManager` | js/vscode-connector.js, js/memory-bank.js |
| TASK-P2.4 | `feat(memory): add entry types and status filtering` | js/memory-bank.js |
| TASK-3.1 | `feat(ui): add tab navigation for Copilot/Rules/Memory` | sidepanel.html, sidepanel.js |
| TASK-3.2 | `feat(ui): add Rules tab with editor and toolbar` | sidepanel.html, sidepanel.js, styles.css |
| TASK-3.3 | `feat(ui): add Memory tab with list, search, and VS Code export` | sidepanel.html, sidepanel.js, styles.css |
| TASK-3.4 | `feat(ui): add mode indicator and dual-mode chat rendering` | sidepanel.html, sidepanel.js, styles.css |
| TASK-4.1 | `feat(test): add test harness infrastructure` | tests/test-harness.js, tests/run-tests.html |
| TASK-4.2 | `feat(test): add example tests for storage, rules, and memory modules` | tests/*.test.js |
| TASK-4.3 | `docs(test): add manual test procedures document` | tests/MANUAL_TESTS.md |

---

## Success Criteria

### Verification Commands
```bash
# Run from C:/dev/Projects/SidePilot/

# Bug fixes verified
grep "��" sidepanel.html                    # Expected: 0 matches
grep -E "\.\s+[a-z]" styles.css             # Expected: 0 matches
grep -E "\?\.\s+" *.js                      # Expected: 0 matches

# New files exist
ls js/mode-manager.js js/sdk-client.js js/storage-manager.js js/rules-manager.js js/memory-bank.js js/vscode-connector.js js/automation.js
# Expected: All files exist

# Extension loads
# Load unpacked extension, open sidepanel
# Expected: No console errors

# Tests pass
# Open tests/run-tests.html
# Expected: All tests pass
```

### Final Checklist
- [ ] All "Must Have" features present
- [ ] All "Must NOT Have" guardrails respected
- [ ] All 34 tasks completed
- [ ] All 6 quality gates passed
- [ ] Test harness operational
- [ ] Manual test procedures documented
- [ ] No TypeScript, no build tooling, no external dependencies
- [ ] Extension functions in fresh Chrome profile

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Copilot SDK API changes | Graceful degradation to iframe mode |
| MV3 service worker limits | Health check intervals, reconnect logic |
| Storage quota exceeded | Quota warnings at 80%, cleanup recommendations |
| VS Code not installed | Clear error message, manual copy option |
| Mode detection fails | Default to iframe mode, no blocking |

---

## References

- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)
- [Chrome Service Workers (MV3)](https://developer.chrome.com/docs/extensions/mv3/service_workers/)
- [GitHub Copilot Custom Instructions](https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)
- [VS Code URI Handler](https://code.visualstudio.com/api/references/vscode-api#window.registerUriHandler)
- Internal: `C:/dev/Projects/SidePilot/.sisyphus/plans/sidepilot-enhancement-plan.md`
