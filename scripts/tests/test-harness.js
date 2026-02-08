/**
 * TestHarness - Minimal test runner for Chrome Extension testing
 * 
 * Usage:
 *   const harness = new TestHarness();
 *   harness.addTest('Test Name', async () => {
 *     // Test code here
 *     if (condition !== expected) {
 *       throw new Error('Test failed: reason');
 *     }
 *   });
 *   await harness.run();
 *   const summary = harness.report();
 */
class TestHarness {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  /**
   * Add a test to the test suite
   * @param {string} name - Test name/description
   * @param {Function} fn - Test function (can be sync or async)
   */
  addTest(name, fn) {
    this.tests.push({ name, fn });
  }

  /**
   * Run all registered tests
   * @returns {Promise<void>}
   */
  async run() {
    this.results = [];
    console.log(`Running ${this.tests.length} test(s)...`);
    console.log('='.repeat(60));

    for (const test of this.tests) {
      const startTime = performance.now();
      let result = {
        name: test.name,
        passed: false,
        error: null,
        duration: 0
      };

      try {
        // Execute test (handle both sync and async)
        await Promise.resolve(test.fn());
        result.passed = true;
        result.duration = performance.now() - startTime;
        console.log(`✓ ${test.name} (${result.duration.toFixed(2)}ms)`);
      } catch (error) {
        result.passed = false;
        result.error = error.message || String(error);
        result.duration = performance.now() - startTime;
        console.error(`✗ ${test.name} (${result.duration.toFixed(2)}ms)`);
        console.error(`  Error: ${result.error}`);
        if (error.stack) {
          console.error(`  Stack: ${error.stack}`);
        }
      }

      this.results.push(result);
    }

    console.log('='.repeat(60));
  }

  /**
   * Generate and return test report summary
   * @returns {{ passed: number, failed: number, total: number, results: Array }}
   */
  report() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    const summary = {
      passed,
      failed,
      total,
      results: this.results
    };

    // Console output
    console.log(`\nTest Summary:`);
    console.log(`  Total:  ${total}`);
    console.log(`  Passed: ${passed} ✓`);
    console.log(`  Failed: ${failed} ✗`);

    if (failed > 0) {
      console.log(`\nFailed Tests:`);
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.name}`);
          console.log(`    ${r.error}`);
        });
    }

    return summary;
  }

  /**
   * Clear all tests and results
   */
  reset() {
    this.tests = [];
    this.results = [];
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestHarness;
}
