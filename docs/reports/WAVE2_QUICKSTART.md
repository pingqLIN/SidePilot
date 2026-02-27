# 🚀 Quick Start: Wave 2 - Testing Framework Setup

**Status**: Wave 1 ✅ Complete | Wave 2 ⏳ Ready to Start
**Time Estimate**: 40-55 hours
**Complexity**: Medium

---

## What You Need to Know

### Wave 1 Summary
All bug fixes and feature enhancements are complete:
- ✅ Memory UI deduplication fixed
- ✅ File/template validation added  
- ✅ SDK retry logic implemented
- ✅ Backend error handling enhanced
- ✅ Structured logging added
- ✅ All TypeScript errors fixed

### Files Modified in Wave 1
1. `extension/sidepanel.js` - Memory UI fix
2. `extension/js/rules-manager.js` - Validation enhancements
3. `extension/js/sdk-client.js` - Retry logic
4. `scripts/github-copilot-proxy/src/routes/openai.ts` - Error handling
5. `scripts/github-copilot-proxy/src/server.ts` - Logging

---

## Wave 2 Overview: Unit Testing

### Phase 1: Testing Infrastructure (5-8 hours)

1. **Install Jest for Extension**
   ```bash
   cd /mnt/c/Dev/Projects/SidePilot/extension
   npm install --save-dev jest @testing-library/dom @babel/preset-env babel-jest
   ```

2. **Create jest.config.js (Extension)**
   ```javascript
   module.exports = {
     testEnvironment: 'jsdom',
     roots: ['<rootDir>/js'],
     testMatch: ['**/__tests__/**/*.test.js'],
     collectCoverageFrom: ['js/**/*.js'],
     coverageThreshold: { global: { statements: 80 } }
   };
   ```

3. **Install Jest for Backend**
   ```bash
   cd /mnt/c/Dev/Projects/SidePilot/scripts/github-copilot-proxy
   npm install --save-dev jest @types/jest ts-jest
   ```

4. **Create jest.config.js (Backend)**
   ```javascript
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'node',
     roots: ['<rootDir>/src'],
     testMatch: ['**/__tests__/**/*.test.ts'],
     collectCoverageFrom: ['src/**/*.ts']
   };
   ```

5. **Create __tests__ directories**
   ```bash
   mkdir -p extension/js/__tests__
   mkdir -p scripts/github-copilot-proxy/src/__tests__
   ```

### Phase 2: Unit Tests (30-45 hours)

**Priority Order**:

1. **storage-manager.js** (45+ tests)
   - Init/cleanup
   - Get/set operations
   - Quota enforcement
   - Namespace isolation
   - Error handling

2. **memory-bank.js** (35+ tests)
   - CRUD operations (create, read, update, delete)
   - Entry types validation (task, note, context, reference)
   - Task status transitions
   - Search/filter
   - Error cases

3. **rules-manager.js** (30+ tests)
   - File import validation (**NEW in Wave 1**)
   - File size limits (**NEW in Wave 1**)
   - Template loading (**NEW in Wave 1**)
   - Template content validation (**NEW in Wave 1**)
   - Export functionality
   - Error handling

4. **sdk-client.js** (25+ tests - CRITICAL)
   - Connection retry logic (**NEW in Wave 1**)
   - Exponential backoff verification
   - Max retry attempts
   - Timeout handling
   - Stream protocol
   - Message sending

5. **Backend API Tests** (25+ tests - CRITICAL)
   - Input validation (**NEW in Wave 1**)
   - HTTP status codes (**NEW in Wave 1**)
   - Token validation (**NEW in Wave 1**)
   - Stream handling
   - Error responses

### Test Examples

**Example: SDK Retry Logic Test**
```javascript
// extension/js/__tests__/sdk-client.test.js
describe('SDKClient.connect()', () => {
  it('should retry 3 times with exponential backoff', async () => {
    // Mock fetch to fail first 2 times, succeed on 3rd
    const mock = jest.fn();
    // Call 1: fail → wait 1s → Call 2: fail → wait 2s → Call 3: succeed
    
    const spy = jest.spyOn(global, 'fetch').mockImplementation(mock);
    // Assert: 3 calls made with proper delays
  });
  
  it('should throw after max retries exceeded', async () => {
    // Mock fetch to always fail
    // Assert: throws error after 3 attempts
  });
});
```

**Example: Validation Test**
```javascript
// extension/js/__tests__/rules-manager.test.js
describe('importFromFile()', () => {
  it('should reject files over 500KB', async () => {
    const largeFile = new File(['x'.repeat(600000)], 'large.md');
    const result = await importFromFile(largeFile);
    expect(result.success).toBe(false);
    expect(result.error).toContain('500KB');
  });
  
  it('should reject non-markdown files', async () => {
    const file = new File(['test'], 'file.exe');
    const result = await importFromFile(file);
    expect(result.success).toBe(false);
  });
});
```

---

## Test Coverage Goals

| Module | Tests | Coverage Goal | Focus Areas |
|--------|-------|---------------|-------------|
| storage-manager | 45+ | 100% | Init, quota, namespace |
| memory-bank | 35+ | 100% | CRUD, validation |
| rules-manager | 30+ | 100% | Import, validation, export |
| sdk-client | 25+ | 100% | Retry, connect, message |
| Backend API | 25+ | 100% | Validation, errors |
| **TOTAL** | **160+** | **95%+** | All critical paths |

---

## Success Criteria

### For Each Test Suite
- ✅ 95%+ line coverage
- ✅ All error cases tested
- ✅ All validation rules tested
- ✅ All async operations tested
- ✅ All retry logic verified

### Before Moving to Wave 3
- ✅ 160+ tests passing
- ✅ No flaky tests
- ✅ All critical paths covered
- ✅ Coverage reports generated

---

## Tools You'll Need

### Dependencies to Install

**Extension**:
```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "@testing-library/dom": "^9.0.0",
    "@babel/preset-env": "^7.20.0",
    "babel-jest": "^29.0.0"
  }
}
```

**Backend**:
```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

---

## Important References

- **Master Plan**: `/mnt/c/Dev/Projects/SidePilot/WORK_PLAN.md`
- **Wave 1 Details**: `/mnt/c/Dev/Projects/SidePilot/WAVE1_COMPLETED.md`
- **Wave 1 Summary**: `/mnt/c/Dev/Projects/SidePilot/WAVE1_SUMMARY.txt`
- **Status Report**: `/mnt/c/Dev/Projects/SidePilot/WAVE1_STATUS.md`

---

## Starting Wave 2

### Step 1: Install Dependencies
```bash
cd /mnt/c/Dev/Projects/SidePilot/extension
npm install --save-dev jest @testing-library/dom

cd /mnt/c/Dev/Projects/SidePilot/scripts/github-copilot-proxy
npm install --save-dev jest @types/jest ts-jest
```

### Step 2: Set Up Test Infrastructure
- Create jest.config.js files (extension + backend)
- Create __tests__ directories
- Set up test script in package.json

### Step 3: Write Tests in Priority Order
1. storage-manager (45+ tests)
2. memory-bank (35+ tests)
3. rules-manager (30+ tests)
4. sdk-client (25+ tests) - **CRITICAL: Test retry logic**
5. Backend API (25+ tests) - **CRITICAL: Test validation**

### Step 4: Verify Coverage
```bash
npm run test -- --coverage
```

---

## Key Metrics to Track

- Total tests written: 160+
- Line coverage: 95%+
- Test pass rate: 100%
- No flaky tests: Critical
- Execution time: <5 seconds

---

## Common Pitfalls to Avoid

❌ **Don't**: Skip testing the retry logic in sdk-client.js
✅ **Do**: Use fake timers to test exponential backoff properly

❌ **Don't**: Mock File objects incorrectly for size validation tests
✅ **Do**: Use real File/Blob APIs or proper mocks

❌ **Don't**: Test internal implementation details
✅ **Do**: Test behavior and contracts

❌ **Don't**: Write tests with hardcoded timeouts
✅ **Do**: Use fake timers or jest.useFakeTimers()

---

## Next Phase: Wave 3

After Wave 2 testing is complete:
- Integration tests (cross-module workflows)
- E2E tests (Playwright)
- CI/CD pipeline (GitHub Actions)

---

**Ready to begin Wave 2?** Start with Step 1 above!

*Last Updated: Feb 8, 2025*
