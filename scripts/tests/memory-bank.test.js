/**
 * Memory Bank Tests
 * Tests for MemoryBank module
 * 
 * NOTE: These tests are designed to run in browser context.
 * Tests requiring Chrome APIs will gracefully skip if unavailable.
 */

import * as MemoryBank from '../js/memory-bank.js';

/**
 * Register all MemoryBank tests with the harness
 * @param {TestHarness} harness - Test harness instance
 */
function registerMemoryBankTests(harness) {
  
  // Test 1: getStatus returns expected structure with entry count
  harness.addTest('MemoryBank - getStatus returns entry count', () => {
    const status = MemoryBank.getStatus();
    
    if (typeof status !== 'object' || status === null) {
      throw new Error(`Expected status to be object, got ${typeof status}`);
    }
    
    if (!('initialized' in status)) {
      throw new Error('Expected status to have "initialized" property');
    }
    
    if (!('entryCount' in status)) {
      throw new Error('Expected status to have "entryCount" property');
    }
    
    if (typeof status.initialized !== 'boolean') {
      throw new Error(`Expected initialized to be boolean, got ${typeof status.initialized}`);
    }
    
    if (typeof status.entryCount !== 'number') {
      throw new Error(`Expected entryCount to be number, got ${typeof status.entryCount}`);
    }
  });

  // Test 2: listEntries returns array
  harness.addTest('MemoryBank - listEntries returns array', () => {
    const entries = MemoryBank.listEntries();
    
    if (!Array.isArray(entries)) {
      throw new Error(`Expected entries to be array, got ${typeof entries}`);
    }
  });

  // Test 3: createEntry requires type and title (should throw)
  harness.addTest('MemoryBank - createEntry requires type and title', async () => {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('⚠️  Chrome storage API not available - test skipped (requires extension context)');
        return;
      }

      await MemoryBank.init();

      // Test without type and title - should throw
      let errorThrown = false;
      try {
        await MemoryBank.createEntry({});
      } catch (error) {
        errorThrown = true;
        if (!error.message.includes('type') && !error.message.includes('title')) {
          throw new Error(`Expected error about type/title, got: ${error.message}`);
        }
      }
      
      if (!errorThrown) {
        throw new Error('Expected createEntry to throw error without type and title');
      }

      // Test with only type - should throw
      errorThrown = false;
      try {
        await MemoryBank.createEntry({ type: 'task' });
      } catch (error) {
        errorThrown = true;
        if (!error.message.includes('title')) {
          throw new Error(`Expected error about title, got: ${error.message}`);
        }
      }
      
      if (!errorThrown) {
        throw new Error('Expected createEntry to throw error without title');
      }

      MemoryBank.cleanup();
    } catch (error) {
      if (error.message.includes('chrome is not defined')) {
        console.log('⚠️  Chrome APIs not available - test skipped');
        return;
      }
      throw error;
    }
  });

  // Test 4: createEntry with invalid type throws error
  harness.addTest('MemoryBank - createEntry with invalid type throws error', async () => {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('⚠️  Chrome storage API not available - test skipped (requires extension context)');
        return;
      }

      await MemoryBank.init();

      let errorThrown = false;
      try {
        await MemoryBank.createEntry({ 
          type: 'invalid-type', 
          title: 'Test Entry' 
        });
      } catch (error) {
        errorThrown = true;
        if (!error.message.includes('Invalid entry type')) {
          throw new Error(`Expected error about invalid type, got: ${error.message}`);
        }
      }
      
      if (!errorThrown) {
        throw new Error('Expected createEntry to throw error with invalid type');
      }

      MemoryBank.cleanup();
    } catch (error) {
      if (error.message.includes('chrome is not defined')) {
        console.log('⚠️  Chrome APIs not available - test skipped');
        return;
      }
      throw error;
    }
  });

  // Test 5: createEntry and getEntry roundtrip
  harness.addTest('MemoryBank - createEntry and getEntry roundtrip', async () => {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('⚠️  Chrome storage API not available - test skipped (requires extension context)');
        return;
      }

      await MemoryBank.init();

      const testEntry = {
        type: 'note',
        title: 'Test Note',
        content: 'This is test content',
        tags: ['test', 'demo']
      };

      const created = await MemoryBank.createEntry(testEntry);
      
      if (!created.id) {
        throw new Error('Expected created entry to have id');
      }
      
      if (created.type !== testEntry.type) {
        throw new Error(`Expected type ${testEntry.type}, got ${created.type}`);
      }
      
      if (created.title !== testEntry.title) {
        throw new Error(`Expected title ${testEntry.title}, got ${created.title}`);
      }

      // Get the entry
      const retrieved = MemoryBank.getEntry(created.id);
      
      if (!retrieved) {
        throw new Error('Expected getEntry to return entry');
      }
      
      if (retrieved.id !== created.id) {
        throw new Error(`Expected id ${created.id}, got ${retrieved.id}`);
      }

      // Cleanup
      await MemoryBank.deleteEntry(created.id);
      MemoryBank.cleanup();
    } catch (error) {
      if (error.message.includes('chrome is not defined')) {
        console.log('⚠️  Chrome APIs not available - test skipped');
        return;
      }
      throw error;
    }
  });

  // Test 6: searchEntries with no query returns empty array
  harness.addTest('MemoryBank - searchEntries with no query returns empty array', () => {
    const results = MemoryBank.searchEntries('');
    
    if (!Array.isArray(results)) {
      throw new Error(`Expected results to be array, got ${typeof results}`);
    }
    
    if (results.length !== 0) {
      throw new Error(`Expected empty array, got ${results.length} items`);
    }
  });

  // Test 7: listEntries with invalid filter returns empty array
  harness.addTest('MemoryBank - listEntries with invalid type filter returns empty', () => {
    const results = MemoryBank.listEntries({ type: 'invalid-type' });
    
    if (!Array.isArray(results)) {
      throw new Error(`Expected results to be array, got ${typeof results}`);
    }
    
    if (results.length !== 0) {
      throw new Error(`Expected empty array for invalid type, got ${results.length} items`);
    }
  });

  // Test 8: Task entry has status property
  harness.addTest('MemoryBank - Task entry has status property', async () => {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('⚠️  Chrome storage API not available - test skipped (requires extension context)');
        return;
      }

      await MemoryBank.init();

      const taskEntry = {
        type: 'task',
        title: 'Test Task',
        content: 'Task content'
      };

      const created = await MemoryBank.createEntry(taskEntry);
      
      if (!created.status) {
        throw new Error('Expected task entry to have status property');
      }
      
      if (created.status !== 'pending') {
        throw new Error(`Expected default status 'pending', got '${created.status}'`);
      }

      // Cleanup
      await MemoryBank.deleteEntry(created.id);
      MemoryBank.cleanup();
    } catch (error) {
      if (error.message.includes('chrome is not defined')) {
        console.log('⚠️  Chrome APIs not available - test skipped');
        return;
      }
      throw error;
    }
  });

  // Test 9: getEntry with invalid ID returns null
  harness.addTest('MemoryBank - getEntry with invalid ID returns null', () => {
    const result = MemoryBank.getEntry('nonexistent-id');
    
    if (result !== null) {
      throw new Error(`Expected null for invalid ID, got ${typeof result}`);
    }
  });
}

// Auto-register if harness exists globally
if (typeof harness !== 'undefined') {
  registerMemoryBankTests(harness);
}

// Export for manual registration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { registerMemoryBankTests };
}

export { registerMemoryBankTests };
