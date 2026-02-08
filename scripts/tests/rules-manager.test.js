/**
 * Rules Manager Tests
 * Tests for RulesManager module
 * 
 * NOTE: These tests are designed to run in browser context.
 * Tests requiring Chrome APIs will gracefully skip if unavailable.
 */

import * as RulesManager from '../js/rules-manager.js';

/**
 * Register all RulesManager tests with the harness
 * @param {TestHarness} harness - Test harness instance
 */
function registerRulesManagerTests(harness) {
  
  // Test 1: getStatus returns expected structure
  harness.addTest('RulesManager - getStatus returns initialized state', () => {
    const status = RulesManager.getStatus();
    
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

  // Test 2: getTemplates returns array with expected templates
  harness.addTest('RulesManager - getTemplates returns array with 3 templates', () => {
    const templates = RulesManager.getTemplates();
    
    if (!Array.isArray(templates)) {
      throw new Error(`Expected templates to be array, got ${typeof templates}`);
    }
    
    if (templates.length !== 3) {
      throw new Error(`Expected 3 templates, got ${templates.length}`);
    }
    
    // Verify each template has required properties
    templates.forEach((template, idx) => {
      if (!template.id) {
        throw new Error(`Template at index ${idx} missing 'id' property`);
      }
      if (!template.name) {
        throw new Error(`Template at index ${idx} missing 'name' property`);
      }
      if (!template.description) {
        throw new Error(`Template at index ${idx} missing 'description' property`);
      }
    });
  });

  // Test 3: getTemplates includes expected template IDs
  harness.addTest('RulesManager - getTemplates includes default, typescript, react', () => {
    const templates = RulesManager.getTemplates();
    const templateIds = templates.map(t => t.id);
    
    const expectedIds = ['default', 'typescript', 'react'];
    
    expectedIds.forEach(expectedId => {
      if (!templateIds.includes(expectedId)) {
        throw new Error(`Expected template '${expectedId}' not found in templates`);
      }
    });
  });

  // Test 4: Template objects have correct structure
  harness.addTest('RulesManager - Template objects have correct structure', () => {
    const templates = RulesManager.getTemplates();
    
    templates.forEach(template => {
      if (typeof template.id !== 'string') {
        throw new Error(`Expected template.id to be string, got ${typeof template.id}`);
      }
      if (typeof template.name !== 'string') {
        throw new Error(`Expected template.name to be string, got ${typeof template.name}`);
      }
      if (typeof template.description !== 'string') {
        throw new Error(`Expected template.description to be string, got ${typeof template.description}`);
      }
    });
  });

  // Test 5: Init and cleanup (requires Chrome APIs)
  harness.addTest('RulesManager - init and cleanup work correctly', async () => {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('⚠️  Chrome storage API not available - test skipped (requires extension context)');
        return;
      }

      await RulesManager.init();
      let status = RulesManager.getStatus();
      
      if (!status.initialized) {
        throw new Error('Expected initialized to be true after init');
      }

      RulesManager.cleanup();
      status = RulesManager.getStatus();
      
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

  // Test 6: loadRules returns expected structure (requires Chrome APIs)
  harness.addTest('RulesManager - loadRules returns expected structure', async () => {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('⚠️  Chrome storage API not available - test skipped (requires extension context)');
        return;
      }

      await RulesManager.init();
      const rules = await RulesManager.loadRules();
      
      if (typeof rules !== 'object' || rules === null) {
        throw new Error(`Expected rules to be object, got ${typeof rules}`);
      }
      
      if (!('content' in rules)) {
        throw new Error('Expected rules to have "content" property');
      }
      
      if (!('lastModified' in rules)) {
        throw new Error('Expected rules to have "lastModified" property');
      }
      
      if (!('version' in rules)) {
        throw new Error('Expected rules to have "version" property');
      }

      RulesManager.cleanup();
    } catch (error) {
      if (error.message.includes('chrome is not defined')) {
        console.log('⚠️  Chrome APIs not available - test skipped');
        return;
      }
      throw error;
    }
  });

  // Test 7: applyTemplate with invalid ID returns error (requires Chrome APIs)
  harness.addTest('RulesManager - applyTemplate with invalid ID returns error', async () => {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.runtime) {
        console.log('⚠️  Chrome APIs not available - test skipped (requires extension context)');
        return;
      }

      await RulesManager.init();
      const result = await RulesManager.applyTemplate('nonexistent-template');
      
      if (result.success) {
        throw new Error('Expected applyTemplate to fail with invalid template ID');
      }
      
      if (!result.error) {
        throw new Error('Expected result to have error property');
      }
      
      if (typeof result.error !== 'string') {
        throw new Error(`Expected error to be string, got ${typeof result.error}`);
      }

      RulesManager.cleanup();
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
  registerRulesManagerTests(harness);
}

// Export for manual registration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { registerRulesManagerTests };
}

export { registerRulesManagerTests };
