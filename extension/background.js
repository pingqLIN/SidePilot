'use strict';

import * as ModeManager from './js/mode-manager.js';
import * as SDKClient from './js/sdk-client.js';
import * as RulesManager from './js/rules-manager.js';
import * as MemoryBank from './js/memory-bank.js';
import * as VSCodeConnector from './js/vscode-connector.js';

// ============================================
// 常數
// ============================================

const COPILOT_URL = 'https://github.com/copilot';

// ============================================
// Initialize Modules
// ============================================

ModeManager.init().catch(err => 
  console.error('[SidePilot] Failed to initialize ModeManager:', err)
);

SDKClient.init().catch(err => 
  console.error('[SidePilot] Failed to initialize SDKClient:', err)
);

RulesManager.init().catch(err => 
  console.error('[SidePilot] Failed to initialize RulesManager:', err)
);

MemoryBank.init().catch(err => 
  console.error('[SidePilot] Failed to initialize MemoryBank:', err)
);

VSCodeConnector.init().catch(err => 
  console.error('[SidePilot] Failed to initialize VSCodeConnector:', err)
);

// ============================================
// Side Panel 控制
// ============================================

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch(err => console.error('Failed to set panel behavior:', err));

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (err) {
    console.error('Failed to open side panel:', err);
  }
});

// ============================================
// 訊息處理
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'getPageContent':
      handleGetPageContent(sendResponse);
      return true;

    case 'getSelectedText':
      handleGetSelectedText(sendResponse);
      return true;

    case 'openCopilotWindow':
      handleOpenCopilotWindow(sendResponse);
      return true;

    case 'getMode':
      sendResponse({ success: true, mode: ModeManager.getActiveMode() });
      return false;

    case 'setMode':
      ModeManager.setMode(message.mode).then(() => {
        sendResponse({ success: true, mode: message.mode });
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true;

    case 'detectMode':
      ModeManager.detectMode().then(mode => {
        sendResponse({ success: true, mode });
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true;

    case 'sdkConnect':
      SDKClient.connect(message.port).then(() => {
        sendResponse({ success: true });
      }).catch(err => {
        sendResponse({ success: false, error: err.message, code: err.code });
      });
      return true;

    case 'sdkDisconnect':
      SDKClient.disconnect();
      sendResponse({ success: true });
      return false;

    case 'sdkSend':
      SDKClient.sendMessage(message.data).then(response => {
        sendResponse({ success: true, data: response });
      }).catch(err => {
        sendResponse({ success: false, error: err.message, code: err.code });
      });
      return true;

    case 'sdkStatus':
      sendResponse({ success: true, status: SDKClient.getStatus() });
      return false;

    // Rules Manager
    case 'rules.save':
      RulesManager.saveRules(message.content)
        .then(success => sendResponse({ success }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'rules.load':
      RulesManager.loadRules()
        .then(result => sendResponse({ success: true, ...result }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'rules.export':
      RulesManager.exportAsFile()
        .then(success => sendResponse({ success }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'rules.getTemplates':
      sendResponse({ success: true, templates: RulesManager.getTemplates() });
      return false;

    case 'rules.applyTemplate':
      RulesManager.applyTemplate(message.templateId)
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    // Memory Bank
    case 'memory.create':
      MemoryBank.createEntry(message.entry)
        .then(entry => sendResponse({ success: true, entry }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'memory.get':
      sendResponse({ success: true, entry: MemoryBank.getEntry(message.id) });
      return false;

    case 'memory.update':
      MemoryBank.updateEntry(message.id, message.data)
        .then(entry => sendResponse({ success: true, entry }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'memory.delete':
      MemoryBank.deleteEntry(message.id)
        .then(success => sendResponse({ success }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'memory.list':
      sendResponse({ success: true, entries: MemoryBank.listEntries(message.filter) });
      return false;

    case 'memory.search':
      sendResponse({ success: true, entries: MemoryBank.searchEntries(message.query) });
      return false;

    // VS Code Connector
    case 'vscode.send': {
      const entry = MemoryBank.getEntry(message.id);
      if (!entry) {
        sendResponse({ success: false, error: '找不到此條目' });
        return false;
      }
      VSCodeConnector.sendToVSCode(entry).then(result => {
        sendResponse({ success: result });
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true;
    }

    default:
      return false;
  }
});

// 取得頁面內容
async function handleGetPageContent(sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      sendResponse({ success: false, error: '找不到使用中的分頁' });
      return;
    }

    const url = tab.url || '';

    // 檢查受限頁面
    if (isRestrictedUrl(url)) {
      sendResponse({
        success: false,
        error: '無法在此頁面擷取內容（瀏覽器內部頁面）',
        pageInfo: { title: tab.title, url: url }
      });
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractPageContent
    });

    sendResponse({
      success: true,
      content: results[0]?.result || null,
      url: tab.url,
      title: tab.title
    });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

// 取得選取文字
async function handleGetSelectedText(sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || isRestrictedUrl(tab.url)) {
      sendResponse({ success: false, selectedText: '' });
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => window.getSelection()?.toString() || ''
    });

    sendResponse({
      success: true,
      selectedText: results[0]?.result || ''
    });
  } catch (err) {
    sendResponse({ success: false, error: err.message, selectedText: '' });
  }
}

// 開啟 Copilot 獨立視窗
async function handleOpenCopilotWindow(sendResponse) {
  try {
    await chrome.windows.create({
      url: COPILOT_URL,
      type: 'popup',
      width: 450,
      height: 700
    });
    sendResponse({ success: true });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

// 檢查是否為受限 URL
function isRestrictedUrl(url) {
  if (!url) return true;
  const restrictedPrefixes = [
    'chrome://', 'chrome-extension://', 'about:',
    'edge://', 'brave://', 'opera://', 'vivaldi://',
    'file://', 'data:', 'blob:'
  ];
  return restrictedPrefixes.some(prefix => url.startsWith(prefix));
}

// ============================================
// 頁面內容擷取（注入到目標頁面執行）
// ============================================

function extractPageContent() {
  const content = {
    title: document.title || '',
    url: window.location.href,
    text: '',
    headings: [],
    codeBlocks: [],
    meta: {}
  };

  try {
    // 主要內容選擇器
    const mainSelectors = [
      'main', 'article', '[role="main"]',
      '.content', '#content', '.main',
      '.post-content', '.article-content', '.entry-content',
      '.markdown-body', '.prose'
    ];

    let mainContent = null;
    for (const selector of mainSelectors) {
      mainContent = document.querySelector(selector);
      if (mainContent) break;
    }
    mainContent = mainContent || document.body;

    // 複製並清理內容
    const clone = mainContent.cloneNode(true);
    const removeSelectors = [
      'script', 'style', 'nav', 'footer', 'header',
      '.sidebar', '.advertisement', '.ads', 'aside',
      '[role="banner"]', '[role="navigation"]', '[role="contentinfo"]',
      '.nav', '.menu', '.comment', '.comments'
    ];

    removeSelectors.forEach(sel => {
      clone.querySelectorAll(sel).forEach(el => el.remove());
    });

    content.text = (clone.innerText || '')
      .replace(/[\t ]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .substring(0, 12000);

    // 標題結構
    document.querySelectorAll('h1, h2, h3, h4').forEach(h => {
      const text = h.innerText?.trim();
      if (text && text.length > 0 && text.length < 200) {
        content.headings.push({
          level: h.tagName,
          text: text
        });
      }
    });
    content.headings = content.headings.slice(0, 20);

    // 程式碼區塊
    const seenCode = new Set();
    document.querySelectorAll('pre code, pre, .highlight, [class*="language-"]').forEach(code => {
      const text = code.innerText?.trim();
      if (text && text.length > 10 && text.length < 5000 && !seenCode.has(text)) {
        seenCode.add(text);

        // 偵測語言
        const classNames = (code.className || '') + ' ' + (code.parentElement?.className || '');
        const langMatch = classNames.match(/language-(\w+)|lang-(\w+)/);
        const language = langMatch?.[1] || langMatch?.[2] || 'plaintext';

        content.codeBlocks.push({ language, code: text });
      }
    });
    content.codeBlocks = content.codeBlocks.slice(0, 5);

    // Meta 資訊
    document.querySelectorAll('meta[name], meta[property]').forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const value = meta.getAttribute('content');
      if (name && value && ['description', 'keywords', 'author', 'og:title', 'og:description'].includes(name)) {
        content.meta[name] = value.substring(0, 300);
      }
    });

  } catch (e) {
    console.error('Content extraction error:', e);
  }

  return content;
}

// ============================================
// 分頁事件監聽
// ============================================

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.runtime.sendMessage({
      action: 'tabUpdated',
      tabId,
      url: tab.url,
      title: tab.title
    }).catch(() => {});
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    chrome.runtime.sendMessage({
      action: 'tabActivated',
      tabId: activeInfo.tabId,
      url: tab.url,
      title: tab.title
    }).catch(() => {});
  } catch (e) {
    // 忽略錯誤
  }
});