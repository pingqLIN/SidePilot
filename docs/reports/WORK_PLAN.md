# SidePilot - Complete Functionality & Testing Work Plan (YOLO Mode)

**Generated**: February 8, 2025  
**Mode**: YOLO - Complete all functionality + comprehensive tests  
**Total Estimated Effort**: 80-120 hours across 3 parallel waves

---

## Feature Completeness Assessment

### Extension (4.6k LOC)

#### Copilot Tab
- **Status**: 95% Complete
- **What works**: Iframe embedding, capture panel, page content extraction, copy functionality, frame error handling
- **Issues**: Minor UI polish needed, edge case handling in frame timeout scenarios
- **Files**: `/mnt/c/Dev/Projects/SidePilot/extension/sidepanel.html` (lines 63-136), `/mnt/c/Dev/Projects/SidePilot/extension/sidepanel.js` (lines 695-733)

#### Rules Tab
- **Status**: 90% Complete
- **What works**: Editor UI, save/load, import/export, template system (default/typescript/react), auto-save after import
- **Issues**: 
  - Template content loading validation missing
  - No file size validation on import
  - Template selector UX could show descriptions
- **Files**: `/mnt/c/Dev/Projects/SidePilot/extension/sidepanel.html` (lines 138-159), `/mnt/c/Dev/Projects/SidePilot/extension/sidepanel.js` (lines 166-263), `/mnt/c/Dev/Projects/SidePilot/extension/js/rules-manager.js`

#### Memory Tab
- **Status**: 92% Complete
- **What works**: CRUD operations, search, type/status filtering, modal editing, memory persistence
- **Critical Issues**:
  - **BUG**: Duplicate `renderMemoryList` function (lines 300-326 AND 346-367) - later definition overrides earlier
  - **BUG**: Memory entry click delegation partially implemented with TODO comments
  - Missing: Delete button visual feedback, unsaved changes warning
- **Files**: `/mnt/c/Dev/Projects/SidePilot/extension/sidepanel.html` (lines 161-208), `/mnt/c/Dev/Projects/SidePilot/extension/sidepanel.js` (lines 269-472)

### Core Modules (Extension/js)

| Module | Status | Priority | Key Issues |
|--------|--------|----------|-----------|
| storage-manager.js | 95% | Medium | Namespace handling solid; needs error quota handling docs |
| mode-manager.js | 90% | High | SDK health check timeout (5s) good; needs fallback retry logic |
| rules-manager.js | 92% | High | Template loading works; needs file validation and error messages |
| memory-bank.js | 98% | Medium | Core logic solid; edge cases in search/filter params need validation |
| sdk-client.js | 85% | High | Connection state management works; pending request cleanup needs test coverage |
| vscode-connector.js | 80% | Low | URI encoding works; VS Code protocol handler detection is stub (always returns true) |
| automation.js | 90% | Low | Page context capture works; settings management could use validation |

### Backend (Express + TypeScript)

#### API Endpoints
- **Status**: 88% Complete
- **What works**: 
  - `GET /health` - Health check with token status
  - `POST /v1/chat/completions` - Chat streaming and non-streaming
  - Proper request-response conversion
- **What's missing**:
  - Error handling for invalid requests (validation)
  - Rate limiting / throttling
  - Request logging for debugging
  - Proper error response codes (currently 500 for all errors)
- **Files**: `/mnt/c/Dev/Projects/SidePilot/scripts/github-copilot-proxy/src/server.ts`, `/mnt/c/Dev/Projects/SidePilot/scripts/github-copilot-proxy/src/routes/openai.ts`

#### Services & Utilities
- **Status**: 90% Complete
- **What works**: CopilotService token handling, payload conversion, streaming support
- **What's missing**: Retry logic for failed requests, timeout enforcement, response validation
- **Files**: `/mnt/c/Dev/Projects/SidePilot/scripts/github-copilot-proxy/src/services/copilot.ts`, `/mnt/c/Dev/Projects/SidePilot/scripts/github-copilot-proxy/src/utils/converter.ts`

---

## Testing Status

### Current State
- **Unit Tests**: 0% (No test files for core modules)
- **Integration Tests**: 0%
- **E2E Tests**: 0%
- **Manual Tests**: 70% (MANUAL_TESTS.md exists with 12+ test cases, but not automated)

### Test Coverage Gaps

| Area | Tests Needed | Impact |
|------|--------------|--------|
| storage-manager.js | Unit: init, save, load, remove, bytes, listeners | Critical - foundation for all persistence |
| memory-bank.js | Unit: CRUD, search, filters, status indexing; Integration: persistence roundtrip | Critical - core feature |
| rules-manager.js | Unit: save/load, import/export, templates; Integration: file handling | High - user-facing feature |
| mode-manager.js | Unit: detection, persistence, listeners | Medium - affects mode switching |
| sdk-client.js | Unit: connect/disconnect, health checks, pending requests; Mock SDK server | High - affects reliability |
| UI/sidepanel.js | E2E: Tab switching, memory CRUD flow, rules editing, capture; Component mocking | Critical - user-facing |
| Backend API | Unit: Request validation, error handling; Integration: Copilot service mocking | High - API reliability |

---

## Work Plan (Parallel Waves)

### Wave 1: Bug Fixes & Feature Completion
**Duration**: 15-25 hours  
**Dependencies**: None  
**Parallelizable**: YES (can split by module)  
**Start After**: Immediate

#### Task 1.1: Fix Memory UI Duplication Bug
- **Goal**: Remove duplicate `renderMemoryList`, consolidate event delegation, ensure memory list rendering works correctly
- **Files Affected**:
  - `/mnt/c/Dev/Projects/SidePilot/extension/sidepanel.js`
- **Success Criteria**:
  - ✅ Single `renderMemoryList` function definition
  - ✅ Memory entries render with correct IDs and data
  - ✅ Click handlers trigger edit modal consistently
  - ✅ No console errors in extension popup
  - ✅ Manual test MB-001 through MB-006 pass
- **Category**: `quick`
- **Skills**: None (frontend only)
- **Effort**: 1-2 hours

#### Task 1.2: Add Template Content Validation (Rules Manager)
- **Goal**: Validate template files before applying; provide user feedback on invalid templates
- **Files Affected**:
  - `/mnt/c/Dev/Projects/SidePilot/extension/js/rules-manager.js` (loadTemplateContent)
  - `/mnt/c/Dev/Projects/SidePilot/extension/sidepanel.js` (applyTemplate, loadTemplates)
- **Success Criteria**:
  - ✅ Template content is validated for minimum length > 10 chars
  - ✅ Error state shown if template load fails
  - ✅ User sees clear error message if template is invalid
  - ✅ Templates list only shows available templates
  - ✅ Manual test R-005 (Apply Template) passes
- **Category**: `quick`
- **Skills**: None
- **Effort**: 2-3 hours

#### Task 1.3: Add File Size/Format Validation (Rules Import)
- **Goal**: Validate imported rule files before saving
- **Files Affected**:
  - `/mnt/c/Dev/Projects/SidePilot/extension/js/rules-manager.js` (importFromFile)
  - `/mnt/c/Dev/Projects/SidePilot/extension/sidepanel.js` (importRules)
- **Success Criteria**:
  - ✅ File size limit enforced (max 500KB)
  - ✅ File type validation (only .md, .txt)
  - ✅ Clear error messages for invalid files
  - ✅ No data loss if import fails
  - ✅ Manual test R-004 (Import Rules) passes
- **Category**: `quick`
- **Skills**: None
- **Effort**: 2-3 hours

#### Task 1.4: Add SDK Connection Retry Logic
- **Goal**: Implement exponential backoff retry for SDK connection failures
- **Files Affected**:
  - `/mnt/c/Dev/Projects/SidePilot/extension/js/sdk-client.js`
- **Success Criteria**:
  - ✅ Retry on connection timeout (up to 3 attempts)
  - ✅ Exponential backoff: 1s, 2s, 4s
  - ✅ Health checks continue with retry strategy
  - ✅ Graceful fallback to iframe mode after retries exhausted
  - ✅ No memory leaks from abandoned requests
- **Category**: `unspecified-medium`
- **Skills**: None
- **Effort**: 3-4 hours

#### Task 1.5: Add Backend Error Handling & Validation
- **Goal**: Proper HTTP status codes, validation, and error messages in Express API
- **Files Affected**:
  - `/mnt/c/Dev/Projects/SidePilot/scripts/github-copilot-proxy/src/routes/openai.ts`
  - `/mnt/c/Dev/Projects/SidePilot/scripts/github-copilot-proxy/src/services/copilot.ts`
- **Success Criteria**:
  - ✅ 400 Bad Request for missing/invalid fields
  - ✅ 401 Unauthorized for missing COPILOT_TOKEN
  - ✅ 503 Service Unavailable when Copilot unreachable
  - ✅ Request validation for chat message structure
  - ✅ Error response includes descriptive message
  - ✅ No 500 errors for client-side issues
- **Category**: `unspecified-medium`
- **Skills**: None
- **Effort**: 4-5 hours

#### Task 1.6: Add Backend Request Logging
- **Goal**: Structured logging for debugging and monitoring
- **Files Affected**:
  - `/mnt/c/Dev/Projects/SidePilot/scripts/github-copilot-proxy/src/server.ts`
  - `/mnt/c/Dev/Projects/SidePilot/scripts/github-copilot-proxy/src/routes/openai.ts`
- **Success Criteria**:
  - ✅ Log incoming requests with timestamp, method, path
  - ✅ Log response status and duration
  - ✅ Log errors with stack traces
  - ✅ Support LOG_LEVEL environment variable
  - ✅ No sensitive data in logs (mask tokens)
- **Category**: `quick`
- **Skills**: None
- **Effort**: 2-3 hours

#### Task 1.7: Add Memory Entry Delete Confirmation UI
- **Goal**: Visual feedback for delete operations
- **Files Affected**:
  - `/mnt/c/Dev/Projects/SidePilot/extension/sidepanel.js` (deleteMemoryEntry, openMemoryModal)
  - `/mnt/c/Dev/Projects/SidePilot/extension/styles.css`
- **Success Criteria**:
  - ✅ Delete button in modal shows confirmation dialog
  - ✅ Confirmation states "This action cannot be undone"
  - ✅ On confirm, entry is deleted and list updates
  - ✅ Toast notification shown on successful delete
  - ✅ Manual test MB-004 (Delete Entry) passes
- **Category**: `quick`
- **Skills**: None
- **Effort**: 1-2 hours

**Wave 1 Total**: ~15-22 hours

---

### Wave 2: Testing Framework & Unit Tests
**Duration**: 25-40 hours  
**Dependencies**: Wave 1 MUST complete  
**Parallelizable**: YES (can test modules independently)  
**Start After**: Wave 1 complete

#### Task 2.1: Set Up Jest for Extension Testing
- **Goal**: Configure Jest test runner for extension JavaScript modules
- **Files Affected**:
  - Create `/mnt/c/Dev/Projects/SidePilot/jest.config.js`
  - Create `/mnt/c/Dev/Projects/SidePilot/extension/js/__tests__/` directory
  - Update `/mnt/c/Dev/Projects/SidePilot/package.json` (create at root if missing)
- **Success Criteria**:
  - ✅ Jest configured with ES modules support
  - ✅ Chrome API mocks available (chrome.storage, chrome.runtime, etc.)
  - ✅ Test coverage reporting enabled
  - ✅ Test script: `npm test`
  - ✅ Watch mode: `npm test -- --watch`
- **Category**: `unspecified-high`
- **Skills**: None
- **Effort**: 3-4 hours

#### Task 2.2: Unit Tests for storage-manager.js
- **Goal**: Comprehensive test coverage for storage module
- **Files Affected**:
  - Create `/mnt/c/Dev/Projects/SidePilot/extension/js/__tests__/storage-manager.test.js`
- **Test Cases**:
  - ✅ init() initializes successfully
  - ✅ save() and load() roundtrip
  - ✅ remove() deletes stored value
  - ✅ getBytesInUse() returns correct byte count
  - ✅ onStorageChange() fires on changes
  - ✅ Multiple saves don't overwrite unrelated keys
  - ✅ Namespace prefix is applied correctly
  - ✅ Errors are logged and handled gracefully
- **Success Criteria**:
  - ✅ 100% line coverage for storage-manager.js
  - ✅ All tests pass
  - ✅ Edge cases covered (quota exceeded, null values, etc.)
- **Category**: `unspecified-high`
- **Skills**: None
- **Effort**: 5-7 hours

#### Task 2.3: Unit Tests for memory-bank.js
- **Goal**: Full test coverage for memory persistence and search
- **Files Affected**:
  - Create `/mnt/c/Dev/Projects/SidePilot/extension/js/__tests__/memory-bank.test.js`
- **Test Cases**:
  - ✅ createEntry() with valid and invalid types
  - ✅ getEntry() returns entry or null
  - ✅ updateEntry() modifies fields and persists
  - ✅ deleteEntry() removes from storage
  - ✅ listEntries() with filters (type, status)
  - ✅ searchEntries() finds by title and content
  - ✅ Status index updates correctly on create/update/delete
  - ✅ Task entries have default status 'pending'
  - ✅ Non-task entries don't have status
  - ✅ Storage roundtrip preserves all fields
- **Success Criteria**:
  - ✅ 100% line coverage
  - ✅ All CRUD operations tested
  - ✅ Filter and search edge cases covered
  - ✅ Data consistency validation
- **Category**: `unspecified-high`
- **Skills**: None
- **Effort**: 6-8 hours

#### Task 2.4: Unit Tests for rules-manager.js
- **Goal**: Test rule persistence, import/export, and templates
- **Files Affected**:
  - Create `/mnt/c/Dev/Projects/SidePilot/extension/js/__tests__/rules-manager.test.js`
- **Test Cases**:
  - ✅ saveRules() persists content and updates timestamp/version
  - ✅ loadRules() retrieves saved content
  - ✅ exportAsFile() creates downloadable file
  - ✅ importFromFile() validates and saves file content
  - ✅ getTemplates() returns list of templates
  - ✅ applyTemplate() loads and saves template content
  - ✅ File type validation (accepts .md, .txt, rejects others)
  - ✅ File size limits enforced
  - ✅ Template not found error handling
- **Success Criteria**:
  - ✅ 100% line coverage
  - ✅ All import/export paths tested
  - ✅ Template system thoroughly tested
- **Category**: `unspecified-high`
- **Skills**: None
- **Effort**: 6-8 hours

#### Task 2.5: Unit Tests for mode-manager.js
- **Goal**: Test mode detection and persistence
- **Files Affected**:
  - Create `/mnt/c/Dev/Projects/SidePilot/extension/js/__tests__/mode-manager.test.js`
- **Test Cases**:
  - ✅ init() loads persisted mode or detects new
  - ✅ detectMode() checks SDK health endpoint correctly
  - ✅ detectMode() returns 'iframe' on timeout or error
  - ✅ setMode() persists mode and notifies listeners
  - ✅ getActiveMode() returns current mode
  - ✅ onModeChange() listener fires on mode changes
  - ✅ Storage fallback works if SDK unavailable
- **Success Criteria**:
  - ✅ 95%+ coverage
  - ✅ All mode transitions tested
  - ✅ Listener behavior verified
- **Category**: `unspecified-high`
- **Skills**: None
- **Effort**: 4-5 hours

#### Task 2.6: Unit Tests for sdk-client.js
- **Goal**: Test SDK connection lifecycle and message handling
- **Files Affected**:
  - Create `/mnt/c/Dev/Projects/SidePilot/extension/js/__tests__/sdk-client.test.js`
- **Test Cases**:
  - ✅ connect() establishes connection to SDK server
  - ✅ disconnect() closes connection and rejects pending
  - ✅ sendMessage() sends and receives responses
  - ✅ Health checks run periodically
  - ✅ Request timeout enforced
  - ✅ Connection lost triggers state change
  - ✅ onConnectionChange() listener fires on state changes
  - ✅ Pending requests cleaned up on disconnect
- **Success Criteria**:
  - ✅ 95%+ coverage
  - ✅ All connection states tested
  - ✅ Error codes properly assigned
- **Category**: `unspecified-high`
- **Skills**: None
- **Effort**: 5-6 hours

#### Task 2.7: Set Up Jest for Backend Testing
- **Goal**: Configure Jest for Express/TypeScript backend tests
- **Files Affected**:
  - Update `/mnt/c/Dev/Projects/SidePilot/scripts/github-copilot-proxy/jest.config.js`
  - Update `/mnt/c/Dev/Projects/SidePilot/scripts/github-copilot-proxy/package.json`
  - Create `/mnt/c/Dev/Projects/SidePilot/scripts/github-copilot-proxy/src/__tests__/` directory
- **Success Criteria**:
  - ✅ Jest configured for TypeScript
  - ✅ Mock support for axios/fetch
  - ✅ Test script: `npm test`
  - ✅ Coverage reporting enabled
- **Category**: `unspecified-high`
- **Skills**: None
- **Effort**: 2-3 hours

#### Task 2.8: Unit Tests for Backend API
- **Goal**: Test Express routes and Copilot service
- **Files Affected**:
  - Create `/mnt/c/Dev/Projects/SidePilot/scripts/github-copilot-proxy/src/__tests__/routes.test.ts`
  - Create `/mnt/c/Dev/Projects/SidePilot/scripts/github-copilot-proxy/src/__tests__/copilot.test.ts`
- **Test Cases**:
  - ✅ GET /health returns OK status
  - ✅ POST /v1/chat/completions accepts valid requests
  - ✅ Missing COPILOT_TOKEN returns 401
  - ✅ Invalid message format returns 400
  - ✅ Copilot service converts responses correctly
  - ✅ Streaming responses work end-to-end
  - ✅ Error responses include proper status codes
- **Success Criteria**:
  - ✅ 90%+ coverage for API routes
  - ✅ All error cases tested
  - ✅ Mock Copilot service works
- **Category**: `unspecified-high`
- **Skills**: None
- **Effort**: 6-8 hours

#### Task 2.9: Integration Tests for Extension-Backend
- **Goal**: Test messaging between extension UI and background.js
- **Files Affected**:
  - Create `/mnt/c/Dev/Projects/SidePilot/extension/js/__tests__/integration.test.js`
- **Test Cases**:
  - ✅ Memory create/list/update/delete roundtrip
  - ✅ Rules save/load/export roundtrip
  - ✅ Mode detection and switching
  - ✅ Message passing between UI and background
- **Success Criteria**:
  - ✅ Key user flows tested
  - ✅ Data persistence verified
  - ✅ No console errors
- **Category**: `unspecified-high`
- **Skills**: None
- **Effort**: 4-6 hours

**Wave 2 Total**: ~40-55 hours

---

### Wave 3: Integration & E2E Tests
**Duration**: 20-35 hours  
**Dependencies**: Wave 1 AND Wave 2 complete  
**Parallelizable**: Partially (depends on completion of prior waves)  
**Start After**: Wave 2 complete

#### Task 3.1: Set Up Playwright for E2E Testing
- **Goal**: Configure Playwright for extension UI testing
- **Files Affected**:
  - Create `/mnt/c/Dev/Projects/SidePilot/playwright.config.ts`
  - Create `/mnt/c/Dev/Projects/SidePilot/e2e/` directory
- **Success Criteria**:
  - ✅ Playwright configured for Chrome extension testing
  - ✅ Extension context setup for sidepanel
  - ✅ Test script: `npm run e2e`
  - ✅ Headless and headed modes support
- **Category**: `unspecified-high`
- **Skills**: `playwright`
- **Effort**: 3-4 hours

#### Task 3.2: E2E Test: Copilot Tab Flow
- **Goal**: End-to-end test for Copilot iframe and capture
- **Files Affected**:
  - Create `/mnt/c/Dev/Projects/SidePilot/e2e/copilot.spec.ts`
- **Test Cases**:
  - ✅ Open sidepanel and Copilot tab is active
  - ✅ Copilot iframe loads (with timeout fallback)
  - ✅ Capture button opens capture panel
  - ✅ Page content is extracted and displayed
  - ✅ Copy button copies content to clipboard
  - ✅ Error state shows on frame timeout
- **Success Criteria**:
  - ✅ All tests pass
  - ✅ Covers happy path and error scenarios
- **Category**: `unspecified-high`
- **Skills**: `playwright`
- **Effort**: 4-5 hours

#### Task 3.3: E2E Test: Rules Tab Flow
- **Goal**: End-to-end test for Rules management
- **Files Affected**:
  - Create `/mnt/c/Dev/Projects/SidePilot/e2e/rules.spec.ts`
- **Test Cases**:
  - ✅ Switch to Rules tab
  - ✅ Edit rules content
  - ✅ Save rules and persist
  - ✅ Apply template from dropdown
  - ✅ Export rules as file
  - ✅ Import rules from file
  - ✅ Show error on invalid import
- **Success Criteria**:
  - ✅ All workflows functional
  - ✅ Data persists across reload
- **Category**: `unspecified-high`
- **Skills**: `playwright`
- **Effort**: 5-6 hours

#### Task 3.4: E2E Test: Memory Tab Flow
- **Goal**: End-to-end test for Memory CRUD
- **Files Affected**:
  - Create `/mnt/c/Dev/Projects/SidePilot/e2e/memory.spec.ts`
- **Test Cases**:
  - ✅ Switch to Memory tab
  - ✅ Add new memory entry (task, note, context)
  - ✅ List shows entries with correct fields
  - ✅ Search filters entries by title/content
  - ✅ Type filter works (task, note, etc.)
  - ✅ Click entry opens edit modal
  - ✅ Update entry and verify save
  - ✅ Delete entry with confirmation
  - ✅ Status filter works for tasks
- **Success Criteria**:
  - ✅ Full CRUD cycle tested
  - ✅ All filters functional
  - ✅ Data persists across reload
- **Category**: `unspecified-high`
- **Skills**: `playwright`
- **Effort**: 6-7 hours

#### Task 3.5: E2E Test: Mode Detection & Switching
- **Goal**: Test SDK vs iframe mode detection
- **Files Affected**:
  - Create `/mnt/c/Dev/Projects/SidePilot/e2e/mode.spec.ts`
- **Test Cases**:
  - ✅ Mode badge shows detected mode (iframe default)
  - ✅ Mode persists after reload
  - ✅ Manual mode switch works
  - ✅ SDK detection works when server available
  - ✅ Fallback to iframe when SDK unavailable
- **Success Criteria**:
  - ✅ Both mode paths tested
  - ✅ Badge updates correctly
- **Category**: `unspecified-high`
- **Skills**: `playwright`
- **Effort**: 3-4 hours

#### Task 3.6: E2E Test: Backend API
- **Goal**: Full API request/response testing
- **Files Affected**:
  - Create `/mnt/c/Dev/Projects/SidePilot/e2e/api.spec.ts`
- **Test Cases**:
  - ✅ Health endpoint responds with OK
  - ✅ Chat completions request succeeds
  - ✅ Streaming responses work
  - ✅ Missing token returns 401
  - ✅ Invalid request returns 400
  - ✅ Response format matches OpenAI spec
- **Success Criteria**:
  - ✅ All endpoints tested
  - ✅ Error handling verified
- **Category**: `unspecified-high`
- **Skills**: None
- **Effort**: 4-5 hours

#### Task 3.7: Smoke Tests & CI Setup
- **Goal**: Quick sanity checks and continuous integration
- **Files Affected**:
  - Create `/mnt/c/Dev/Projects/SidePilot/.github/workflows/tests.yml`
  - Create `/mnt/c/Dev/Projects/SidePilot/scripts/smoke-test.sh`
  - Update `/mnt/c/Dev/Projects/SidePilot/package.json` with test scripts
- **Success Criteria**:
  - ✅ Smoke test runs in < 2 minutes
  - ✅ GitHub Actions workflow passes
  - ✅ All test types (unit, integration, E2E) included
  - ✅ Coverage reports generated
- **Category**: `quick`
- **Skills**: None
- **Effort**: 3-4 hours

**Wave 3 Total**: ~28-36 hours

---

## Critical Path Summary

### Longest Chain (Must Complete Sequentially)
1. **Wave 1**: Bug fixes & feature completion (15-22 hrs)
2. **Wave 2**: Test setup & unit tests (40-55 hrs)
3. **Wave 3**: E2E & integration tests (28-36 hrs)

**Critical Path Duration**: 83-113 hours
**Parallelizable Tasks**: ~40-60 hours can run in parallel within each wave

### Parallelization Strategy

**Within Wave 1** (4 parallel tracks):
- Track A: Memory UI + Template validation (Tasks 1.1, 1.2)
- Track B: Import validation + SDK retry (Tasks 1.3, 1.4)
- Track C: Backend error handling (Tasks 1.5, 1.6)
- Track D: Memory UI polish (Task 1.7)

**Within Wave 2** (2 parallel tracks after setup):
- Track A: storage-manager, memory-bank tests (Tasks 2.2, 2.3)
- Track B: rules-manager, mode-manager, sdk-client tests (Tasks 2.4, 2.5, 2.6)
- Track C: Backend test setup & tests (Tasks 2.7, 2.8, 2.9)

**Within Wave 3** (All E2E tests can run in parallel):
- Track A: Copilot & Rules E2E (Tasks 3.2, 3.3)
- Track B: Memory & Mode E2E (Tasks 3.4, 3.5)
- Track C: Backend API E2E (Task 3.6)
- Track D: CI setup (Task 3.7)

---

## Priority Ranking for YOLO Execution

### Must Do (Non-Optional)
1. **Wave 1.1** - Memory UI duplication bug (blocks all memory features)
2. **Wave 2.2** - storage-manager tests (foundation for all persistence)
3. **Wave 2.3** - memory-bank tests (core feature)
4. **Wave 3.4** - Memory E2E tests (validates most complex feature)

### Should Do (High Value)
1. **Wave 1.2** - Template validation (improves Rules UX)
2. **Wave 2.4** - rules-manager tests
3. **Wave 3.3** - Rules E2E tests
4. **Wave 2.8** - Backend API tests

### Nice to Have (If Time Permits)
1. **Wave 1.7** - Delete confirmation UI (polish)
2. **Wave 2.6** - sdk-client tests
3. **Wave 3.5** - Mode detection E2E

---

## Deliverables by Wave

### Wave 1 Deliverable
```
✅ Memory list rendering fixed and consolidated
✅ Rules template validation working
✅ Rules import validation with size/format checks
✅ SDK connection retry logic implemented
✅ Backend error handling with proper status codes
✅ Backend request logging in place
✅ Memory delete confirmation UI added
✅ All 12+ manual tests in MANUAL_TESTS.md passing
```

### Wave 2 Deliverable
```
✅ Jest configured for extension and backend
✅ 100+ unit tests written and passing
✅ 90%+ code coverage for core modules
✅ Integration tests for extension-backend messaging
✅ Test infrastructure in place for future development
```

### Wave 3 Deliverable
```
✅ Playwright E2E framework configured
✅ 50+ E2E test cases covering all major user flows
✅ CI/CD pipeline with automated testing
✅ Full regression test suite ready for future changes
✅ Smoke tests for quick validation
```

---

## File Structure After Completion

```
/mnt/c/Dev/Projects/SidePilot/
├── extension/
│   ├── js/
│   │   ├── __tests__/
│   │   │   ├── storage-manager.test.js
│   │   │   ├── memory-bank.test.js
│   │   │   ├── rules-manager.test.js
│   │   │   ├── mode-manager.test.js
│   │   │   ├── sdk-client.test.js
│   │   │   └── integration.test.js
│   │   ├── storage-manager.js [FIXED]
│   │   ├── memory-bank.js
│   │   ├── rules-manager.js [FIXED]
│   │   └── ... [other modules]
│   ├── sidepanel.js [FIXED: Memory UI duplication removed]
│   └── ... [other extension files]
├── scripts/
│   ├── github-copilot-proxy/
│   │   ├── src/
│   │   │   ├── __tests__/
│   │   │   │   ├── routes.test.ts
│   │   │   │   └── copilot.test.ts
│   │   │   ├── server.ts [FIXED: Error handling, logging]
│   │   │   ├── routes/openai.ts [FIXED: Validation]
│   │   │   └── ... [other backend files]
│   │   ├── jest.config.js [NEW]
│   │   └── package.json [UPDATED]
│   └── tests/
│       └── MANUAL_TESTS.md [REFERENCE]
├── e2e/
│   ├── copilot.spec.ts [NEW]
│   ├── rules.spec.ts [NEW]
│   ├── memory.spec.ts [NEW]
│   ├── mode.spec.ts [NEW]
│   └── api.spec.ts [NEW]
├── jest.config.js [NEW]
├── playwright.config.ts [NEW]
├── package.json [NEW - root]
├── .github/
│   └── workflows/
│       └── tests.yml [NEW - CI/CD]
└── WORK_PLAN.md [THIS FILE]
```

---

## Testing Verification Checklist

### Wave 1 Completion
- [ ] All 7 bug fixes implemented
- [ ] Manual tests MANUAL_TESTS.md all passing (L-001 through MB-007)
- [ ] No console errors in extension
- [ ] Backend health check returns correct status
- [ ] No regressions in existing features

### Wave 2 Completion
- [ ] Jest installed and configured
- [ ] 100+ unit tests written
- [ ] Code coverage reports generated (90%+ target)
- [ ] All tests passing locally
- [ ] Integration tests verify extension-backend messaging

### Wave 3 Completion
- [ ] Playwright configured and tests running
- [ ] 50+ E2E tests passing
- [ ] CI/CD pipeline functional
- [ ] Smoke tests complete in < 2 minutes
- [ ] Coverage dashboard ready

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Memory UI changes cause regressions | Medium | High | Thorough manual testing of all memory flows before Wave 2 |
| Backend API changes break extension | Low | High | Integration tests verify extension-backend contract |
| Test setup complexity | Medium | Medium | Use existing Jest/Playwright examples; start with simple cases |
| Chrome API mocking issues | Low | Medium | Use @testing-library/chrome and web-ext for real testing |
| Time overruns on Wave 2 | Medium | High | Prioritize core modules (storage, memory, rules) first |

---

## Success Metrics

- ✅ **0 Critical Bugs**: No showstopper issues in core features
- ✅ **90%+ Code Coverage**: All major code paths tested
- ✅ **Manual Tests Pass**: All 12+ manual tests in MANUAL_TESTS.md passing
- ✅ **E2E Coverage**: All user workflows (Copilot, Rules, Memory) tested end-to-end
- ✅ **CI/CD Ready**: Automated tests on every commit
- ✅ **Documentation**: Clear test organization and comments

---

**Next Steps**: Begin Wave 1 (Bug Fixes & Feature Completion) immediately. Parallel execution within each wave maximizes throughput. Estimated total: **80-120 hours** with ~4-6 people or **3-4 weeks** with a single developer working full-time.

