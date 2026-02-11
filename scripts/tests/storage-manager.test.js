/**
 * Storage Manager Tests
 * Tests for StorageManager module
 * 
 * NOTE: These tests are designed to run in browser context.
 * Tests requiring Chrome APIs will gracefully skip if unavailable.
 */

import * as StorageManager from '../../extension/js/storage-manager.js';

/**
 * Register all StorageManager tests with the harness
 * @param {TestHarness} harness - Test harness instance
 */
function registerStorageManagerTests(harness) {
  
  // Test 1: getStatus returns expected structure
  harness.addTest('StorageManager - getStatus returns initialized state', () => {
    const status = StorageManager.getStatus();
    
    if (typeof status !== 'object' || status === null) {
      throw new Error(`Expected status to be object, got ${typeof status}`);
    }
    
    if (!('initialized' in status)) {
      throw new Error('Expected status to have "initialized" property');
    }
    
    if (typeof status.initialized !== 'boolean') {
      throw new Error(`Expected initialized to be boolean, got ${typeof status.initialized}`);
    }
  });

  // Test 2: onStorageChange returns unsubscribe function
  harness.addTest('StorageManager - onStorageChange returns unsubscribe function', () => {
    const callback = (changes) => {
      console.log('Storage changed:', changes);
    };
    
    const unsubscribe = StorageManager.onStorageChange(callback);
    
    if (typeof unsubscribe !== 'function') {
      throw new Error(`Expected unsubscribe to be function, got ${typeof unsubscribe}`);
    }
    
    // Call unsubscribe to cleanup
    unsubscribe();
  });

  // Test 3: onStorageChange with invalid callback returns empty function
  harness.addTest('StorageManager - onStorageChange with invalid callback returns noop', () => {
    const unsubscribe = StorageManager.onStorageChange('not a function');
    
    if (typeof unsubscribe !== 'function') {
      throw new Error(`Expected unsubscribe to be function, got ${typeof unsubscribe}`);
    }
  });

  // Test 4: Init and cleanup (requires Chrome APIs - will skip gracefully)
  harness.addTest('StorageManager - init and cleanup work correctly', async () => {
    try {
      // Check if chrome.storage is available
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('⚠️  Chrome storage API not available - test skipped (requires extension context)');
        return; // Skip test gracefully
      }

      // Test init
      await StorageManager.init();
      let status = StorageManager.getStatus();
      
      if (!status.initialized) {
        throw new Error('Expected initialized to be true after init');
      }

      // Test cleanup
      StorageManager.cleanup();
      status = StorageManager.getStatus();
      
      if (status.initialized) {
        throw new Error('Expected initialized to be false after cleanup');
      }
    } catch (error) {
      if (error.message.includes('chrome is not defined')) {
        console.log('⚠️  Chrome APIs not available - test skipped');
        return;
      }
      throw error;
    }
  });

  // Test 5: Save/load roundtrip (requires Chrome APIs)
  harness.addTest('StorageManager - save and load roundtrip', async () => {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('⚠️  Chrome storage API not available - test skipped (requires extension context)');
        return;
      }

      await StorageManager.init();

      const testKey = 'test.key';
      const testValue = { data: 'test data', number: 42 };

      // Save
      const saveResult = await StorageManager.save(testKey, testValue);
      
      if (!saveResult) {
        throw new Error('Expected save to return true');
      }

      // Load
      const loadResult = await StorageManager.load(testKey);
      
      if (JSON.stringify(loadResult) !== JSON.stringify(testValue)) {
        throw new Error(`Expected ${JSON.stringify(testValue)}, got ${JSON.stringify(loadResult)}`);
      }

      // Cleanup
      await StorageManager.remove(testKey);
      StorageManager.cleanup();
    } catch (error) {
      if (error.message.includes('chrome is not defined')) {
        console.log('⚠️  Chrome APIs not available - test skipped');
        return;
      }
      throw error;
    }
  });

  // Test 6: getBytesInUse (requires Chrome APIs)
  harness.addTest('StorageManager - getBytesInUse returns number', async () => {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('⚠️  Chrome storage API not available - test skipped (requires extension context)');
        return;
      }

      await StorageManager.init();
      const bytes = await StorageManager.getBytesInUse();
      
      if (typeof bytes !== 'number') {
        throw new Error(`Expected bytes to be number, got ${typeof bytes}`);
      }
      
      // Should be >= 0 or -1 for error
      if (bytes < -1) {
        throw new Error(`Expected bytes >= -1, got ${bytes}`);
      }

      StorageManager.cleanup();
    } catch (error) {
      if (error.message.includes('chrome is not defined')) {
        console.log('⚠️  Chrome APIs not available - test skipped');
        return;
      }
      throw error;
    }
  });
}

// Auto-register if harness exists globally
if (typeof harness !== 'undefined') {
  registerStorageManagerTests(harness);
}

// Export for manual registration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { registerStorageManagerTests };
}

export { registerStorageManagerTests };
