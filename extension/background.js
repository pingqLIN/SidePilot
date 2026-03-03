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
      handleGetPageContent(message, sendResponse);
      return true;

    case 'getSelectedText':
      handleGetSelectedText(message, sendResponse);
      return true;

    case 'captureVisibleScreenshot':
      handleCaptureVisibleScreenshot(message, sendResponse);
      return true;

    case 'capturePartialScreenshot':
      handleCapturePartialScreenshot(message, sendResponse);
      return true;

    case 'captureFullPageScreenshot':
      handleCaptureFullPageScreenshot(message, sendResponse);
      return true;

    case 'openCopilotWindow':
      handleOpenCopilotWindow(sendResponse);
      return true;

    case 'openExternalLink':
      handleOpenExternalLink(message.url, sendResponse);
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

    case 'sdkModels':
      SDKClient.listModels().then(models => {
        sendResponse({ success: true, models });
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true;

    case 'bridgeHealth':
      handleBridgeHealth(message, sendResponse);
      return true;

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

async function handleBridgeHealth(message, sendResponse) {
  const port = Number(message?.port) || 31031;
  const timeoutMs = Number(message?.timeoutMs) || 3000;
  const url = `http://localhost:${port}/health`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    const text = await response.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!response.ok) {
      sendResponse({
        success: false,
        url,
        status: response.status,
        error: data?.error || `HTTP ${response.status}`,
        data,
      });
      return;
    }

    const isBridge = data?.service === 'sidepilot-copilot-bridge' && data?.status === 'ok';
    sendResponse({
      success: true,
      url,
      status: response.status,
      data,
      isBridge,
    });
  } catch (err) {
    const errMessage = err?.name === 'AbortError' ? 'timeout' : (err?.message || 'unknown error');
    sendResponse({ success: false, url, error: errMessage });
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================
// Capture Tab Helper
// ============================================

async function getCaptureTab(message) {
  let tabs;
  if (message?.windowId) {
    tabs = await chrome.tabs.query({ active: true, windowId: message.windowId });
  }
  if (!tabs || tabs.length === 0) {
    tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  }
  return tabs[0] || null;
}

// 取得頁面內容
async function handleGetPageContent(message, sendResponse) {
  try {
    const tab = await getCaptureTab(message);

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

    // Inject vendor bundle (Defuddle + Turndown) then extract content
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['js/vendor-content-cleaner.js']
      });
    } catch {
      // Vendor injection may fail on some pages; fall back to basic extraction
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
async function handleGetSelectedText(message, sendResponse) {
  try {
    const tab = await getCaptureTab(message);

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

// 擷取可見範圍截圖
async function handleCaptureVisibleScreenshot(message, sendResponse) {
  try {
    const tab = await getCaptureTab(message);

    if (!tab || isRestrictedUrl(tab.url)) {
      sendResponse({ success: false, error: '無法在此頁面擷取截圖' });
      return;
    }

    const dataUrl = await captureVisibleTabDataUrl(tab.windowId);
    sendResponse({ success: true, dataUrl });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

// 擷取部分截圖（選取區域）
async function handleCapturePartialScreenshot(message, sendResponse) {
  try {
    const tab = await getCaptureTab(message);

    if (!tab || isRestrictedUrl(tab.url)) {
      sendResponse({ success: false, error: '無法在此頁面擷取截圖' });
      return;
    }

    const selectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: selectCaptureRegion
    });

    const region = selectionResults?.[0]?.result;
    if (!region) {
      sendResponse({ success: false, error: '已取消擷取' });
      return;
    }

    const dataUrl = await captureVisibleTabDataUrl(tab.windowId);
    const croppedUrl = await cropImageDataUrl(dataUrl, region);
    sendResponse({ success: true, dataUrl: croppedUrl });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

// 整頁截圖（scroll-and-stitch）
async function handleCaptureFullPageScreenshot(message, sendResponse) {
  const CAPTURE_DELAY = 350;
  const MAX_STEPS = 50;
  const FIXED_HIDE_CLASS = '__sidepilot_hide_fixed__';

  try {
    const tab = await getCaptureTab(message);

    if (!tab || isRestrictedUrl(tab.url)) {
      sendResponse({ success: false, error: '無法在此頁面擷取整頁截圖' });
      return;
    }

    // 1. Get page dimensions, force instant scroll, and hide fixed/sticky elements
    const dimResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: (hideClass) => {
        const orig = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';

        // Inject a style rule to hide position:fixed and position:sticky elements
        const style = document.createElement('style');
        style.id = hideClass;
        style.textContent = `.${hideClass} { visibility: hidden !important; }`;
        document.head.appendChild(style);

        // Find and mark all fixed/sticky elements
        const allEls = document.querySelectorAll('*');
        let hiddenCount = 0;
        for (const el of allEls) {
          const cs = window.getComputedStyle(el);
          if (cs.position === 'fixed' || cs.position === 'sticky') {
            el.classList.add(hideClass);
            hiddenCount++;
          }
        }

        return {
          fullHeight: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
          scrollY: window.scrollY,
          devicePixelRatio: window.devicePixelRatio || 1,
          origScrollBehavior: orig || '',
          hiddenCount
        };
      },
      args: [FIXED_HIDE_CLASS]
    });

    const dims = dimResults?.[0]?.result;
    if (!dims) {
      sendResponse({ success: false, error: '無法取得頁面尺寸' });
      return;
    }

    const { fullHeight, viewportHeight, scrollY: origScrollY, devicePixelRatio: dpr } = dims;

    if (fullHeight <= viewportHeight) {
      // Page fits in one viewport — restore and capture once
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: (hideClass) => {
          document.querySelectorAll(`.${hideClass}`).forEach(el => el.classList.remove(hideClass));
          document.getElementById(hideClass)?.remove();
        },
        args: [FIXED_HIDE_CLASS]
      });
      const dataUrl = await captureVisibleTabDataUrl(tab.windowId);
      sendResponse({ success: true, dataUrl });
      return;
    }

    // 2. Calculate scroll positions — sequential, non-overlapping except last strip
    const maxScrollY = fullHeight - viewportHeight;
    const scrollPositions = [];
    for (let y = 0; y < maxScrollY; y += viewportHeight) {
      scrollPositions.push(y);
    }
    scrollPositions.push(maxScrollY);

    if (scrollPositions.length > MAX_STEPS) {
      scrollPositions.length = MAX_STEPS;
    }

    // 3. Scroll-and-capture loop (fixed/sticky elements are already hidden)
    const captures = [];
    for (let i = 0; i < scrollPositions.length; i++) {
      const targetY = scrollPositions[i];

      const scrollResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: (y) => {
          window.scrollTo({ top: y, behavior: 'instant' });
          return window.scrollY;
        },
        args: [targetY]
      });

      const actualScrollY = scrollResults?.[0]?.result ?? targetY;
      await new Promise(r => setTimeout(r, CAPTURE_DELAY));

      const dataUrl = await captureVisibleTabDataUrl(tab.windowId);
      captures.push({ dataUrl, scrollY: actualScrollY, index: i });
    }

    // 4. Restore: unhide fixed/sticky elements, scroll position, scroll behavior
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: (y, origBehavior, hideClass) => {
        document.querySelectorAll(`.${hideClass}`).forEach(el => el.classList.remove(hideClass));
        document.getElementById(hideClass)?.remove();
        window.scrollTo({ top: y, behavior: 'instant' });
        document.documentElement.style.scrollBehavior = origBehavior;
      },
      args: [origScrollY, dims.origScrollBehavior, FIXED_HIDE_CLASS]
    });

    // 5. Deduplicate by rounded scrollY, keep order
    const uniqueCaptures = [];
    const seenY = new Set();
    for (const cap of captures) {
      const key = Math.round(cap.scrollY);
      if (!seenY.has(key)) {
        seenY.add(key);
        uniqueCaptures.push(cap);
      }
    }

    uniqueCaptures.sort((a, b) => a.scrollY - b.scrollY);

    // 6. Stitch on OffscreenCanvas
    const canvasW = Math.round(dims.viewportWidth * dpr);
    const canvasH = Math.round(fullHeight * dpr);
    const canvas = new OffscreenCanvas(canvasW, canvasH);
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < uniqueCaptures.length; i++) {
      const resp = await fetch(uniqueCaptures[i].dataUrl);
      const blob = await resp.blob();
      const bitmap = await createImageBitmap(blob);

      const drawY = Math.round(uniqueCaptures[i].scrollY * dpr);
      const nextDrawY = (i < uniqueCaptures.length - 1)
        ? Math.round(uniqueCaptures[i + 1].scrollY * dpr)
        : canvasH;

      const stripH = Math.min(bitmap.height, nextDrawY - drawY);

      if (i === uniqueCaptures.length - 1) {
        // Last strip: align bottom of bitmap to bottom of canvas
        const remaining = canvasH - drawY;
        if (remaining > 0 && remaining < bitmap.height) {
          const srcY = bitmap.height - remaining;
          ctx.drawImage(bitmap, 0, srcY, bitmap.width, remaining, 0, drawY, bitmap.width, remaining);
        } else {
          ctx.drawImage(bitmap, 0, drawY);
        }
      } else if (stripH > 0) {
        ctx.drawImage(bitmap, 0, 0, bitmap.width, stripH, 0, drawY, bitmap.width, stripH);
      }

      bitmap.close();
    }

    const stitchedBlob = await canvas.convertToBlob({ type: 'image/png' });
    const buffer = await stitchedBlob.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    sendResponse({ success: true, dataUrl: `data:image/png;base64,${base64}` });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

function captureVisibleTabDataUrl(windowId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(dataUrl);
    });
  });
}

async function cropImageDataUrl(dataUrl, region) {
  if (!dataUrl || !region || typeof OffscreenCanvas === 'undefined') {
    return dataUrl;
  }

  const scale = region.devicePixelRatio || 1;
  const sx = Math.max(0, Math.round(region.x * scale));
  const sy = Math.max(0, Math.round(region.y * scale));
  const sw = Math.max(1, Math.round(region.width * scale));
  const sh = Math.max(1, Math.round(region.height * scale));

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  const maxWidth = Math.max(1, Math.min(sw, bitmap.width - sx));
  const maxHeight = Math.max(1, Math.min(sh, bitmap.height - sy));

  const canvas = new OffscreenCanvas(maxWidth, maxHeight);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, sx, sy, maxWidth, maxHeight, 0, 0, maxWidth, maxHeight);

  const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });
  const buffer = await croppedBlob.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  return `data:image/png;base64,${base64}`;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// 注入頁面：顯示選取框並回傳選取區域
function selectCaptureRegion() {
  return new Promise(resolve => {
    const existing = document.getElementById('sidepilot-capture-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'sidepilot-capture-overlay';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:2147483647',
      'background:rgba(0,0,0,0.35)',
      'cursor:crosshair'
    ].join(';');

    const hint = document.createElement('div');
    hint.textContent = '拖曳選取區域，按 Esc 取消';
    hint.style.cssText = [
      'position:absolute',
      'top:16px',
      'left:16px',
      'padding:6px 10px',
      'background:rgba(13,17,23,0.85)',
      'color:#fff',
      'font-size:12px',
      'border:1px solid rgba(255,255,255,0.2)',
      'border-radius:6px'
    ].join(';');

    const box = document.createElement('div');
    box.style.cssText = [
      'position:absolute',
      'border:2px solid #58a6ff',
      'background:rgba(88,166,255,0.15)',
      'border-radius:4px',
      'display:none'
    ].join(';');

    overlay.appendChild(hint);
    overlay.appendChild(box);
    document.documentElement.appendChild(overlay);

    let startX = 0;
    let startY = 0;
    let isDragging = false;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    function cleanup(result) {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('mousemove', onMouseMove, true);
      window.removeEventListener('mouseup', onMouseUp, true);
      overlay.removeEventListener('mousedown', onMouseDown, true);
      overlay.remove();
      document.body.style.userSelect = previousUserSelect;
      resolve(result);
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        cleanup(null);
      }
    }

    function onMouseDown(event) {
      event.preventDefault();
      isDragging = true;
      startX = event.clientX;
      startY = event.clientY;
      box.style.display = 'block';
      box.style.left = `${startX}px`;
      box.style.top = `${startY}px`;
      box.style.width = '0px';
      box.style.height = '0px';
    }

    function onMouseMove(event) {
      if (!isDragging) return;
      const currentX = event.clientX;
      const currentY = event.clientY;
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      box.style.left = `${x}px`;
      box.style.top = `${y}px`;
      box.style.width = `${width}px`;
      box.style.height = `${height}px`;
    }

    function onMouseUp(event) {
      if (!isDragging) return;
      isDragging = false;
      const endX = event.clientX;
      const endY = event.clientY;
      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);

      if (width < 10 || height < 10) {
        cleanup(null);
        return;
      }

      cleanup({
        x,
        y,
        width,
        height,
        devicePixelRatio: window.devicePixelRatio || 1
      });
    }

    overlay.addEventListener('mousedown', onMouseDown, true);
    window.addEventListener('mousemove', onMouseMove, true);
    window.addEventListener('mouseup', onMouseUp, true);
    window.addEventListener('keydown', onKeyDown, true);
  });
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

async function handleOpenExternalLink(url, sendResponse) {
  try {
    if (!url || typeof url !== 'string') {
      sendResponse({ success: false, error: 'Invalid URL' });
      return;
    }

    await chrome.tabs.create({ url, active: true });

    chrome.runtime.sendMessage({
      action: 'externalLinkRedirected',
      url
    }).catch(() => {});

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
    markdown: '',
    paragraphs: [],
    wordCount: 0,
    charCount: 0,
    headings: [],
    codeBlocks: [],
    meta: {},
    extractor: 'basic'
  };

  try {
    // Try Defuddle + Turndown for high-quality extraction
    if (typeof __SidePilotVendor !== 'undefined' && __SidePilotVendor.Defuddle) {
      try {
        const Defuddle = __SidePilotVendor.Defuddle;
        const TurndownService = __SidePilotVendor.TurndownService;

        const defuddled = new Defuddle(document).parse();

        content.title = defuddled.title || content.title;
        content.extractor = 'defuddle';

        if (defuddled.author) content.meta.author = defuddled.author;
        if (defuddled.description) content.meta.description = defuddled.description;
        if (defuddled.site) content.meta.site = defuddled.site;
        if (defuddled.published) content.meta.published = defuddled.published;
        if (defuddled.wordCount) content.wordCount = defuddled.wordCount;

        // Convert cleaned HTML to Markdown
        if (defuddled.content && TurndownService) {
          const td = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-',
          });
          // Skip images to save tokens
          td.addRule('skipImages', {
            filter: 'img',
            replacement: () => ''
          });
          const md = td.turndown(defuddled.content);
          content.markdown = md.substring(0, 15000);
          content.text = md.substring(0, 12000);
        } else if (defuddled.content) {
          // Turndown unavailable — strip HTML tags for plain text
          const div = document.createElement('div');
          div.innerHTML = defuddled.content;
          content.text = (div.innerText || '').replace(/[\t ]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().substring(0, 12000);
        }

        content.charCount = content.text ? content.text.replace(/\s+/g, '').length : 0;
        if (!content.wordCount) {
          content.wordCount = content.text ? content.text.split(/\s+/).length : 0;
        }

        // Extract paragraphs from markdown
        if (content.markdown) {
          content.paragraphs = content.markdown.split(/\n{2,}/).filter(p => p.trim().length > 20).slice(0, 120);
        }

        // Extract headings from markdown
        const headingRe = /^(#{1,4})\s+(.+)$/gm;
        let hMatch;
        while ((hMatch = headingRe.exec(content.markdown)) !== null && content.headings.length < 20) {
          content.headings.push({ level: `H${hMatch[1].length}`, text: hMatch[2].trim() });
        }

        // Extract code blocks from markdown
        const codeRe = /```(\w*)\n([\s\S]*?)```/g;
        let cMatch;
        while ((cMatch = codeRe.exec(content.markdown)) !== null && content.codeBlocks.length < 5) {
          if (cMatch[2].trim().length > 10) {
            content.codeBlocks.push({ language: cMatch[1] || 'plaintext', code: cMatch[2].trim() });
          }
        }

        // Fill remaining meta from document
        document.querySelectorAll('meta[name], meta[property]').forEach(meta => {
          const name = meta.getAttribute('name') || meta.getAttribute('property');
          const value = meta.getAttribute('content');
          if (name && value && ['description', 'keywords', 'og:title', 'og:description'].includes(name) && !content.meta[name]) {
            content.meta[name] = value.substring(0, 300);
          }
        });

        return content;
      } catch (defuddleErr) {
        console.warn('[SidePilot] Defuddle extraction failed, falling back:', defuddleErr);
        content.extractor = 'basic-fallback';
      }
    }

    // Fallback: basic extraction (original logic)
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

    const clone = mainContent.cloneNode(true);
    const removeSelectors = [
      'script', 'style', 'nav', 'footer', 'header',
      '.sidebar', '.advertisement', '.ads', 'aside',
      '.promo', '.sponsor', '.banner', '.cookie', '.consent',
      '.newsletter', '.subscribe', '.share', '.social',
      '.nav', '.menu', '.comment', '.comments', '.related',
      '[role="banner"]', '[role="navigation"]', '[role="contentinfo"]',
      '[aria-label*="advert"]', '[aria-label*="ad"]', '[id*="ad-"]', '[class*="ad-"]'
    ];

     removeSelectors.forEach(sel => {
       clone.querySelectorAll(sel).forEach(el => {
         el.remove();
       });
     });

    const noisePattern = /(ad-|ads|advert|promo|sponsor|cookie|consent|subscribe|newsletter|share|social|comment|breadcrumb|related|recommend|popup|modal|banner|toolbar|nav|footer|header)/i;

    clone.querySelectorAll('*').forEach(el => {
      const idClass = `${el.id || ''} ${el.className || ''}`;
      if (noisePattern.test(idClass)) {
        el.remove();
        return;
      }

      const text = el.innerText?.trim() || '';
      const links = el.querySelectorAll?.('a')?.length || 0;
      if (text.length > 0 && text.length < 80 && links >= 4) {
        el.remove();
      }
    });

    const paragraphs = [];
    const seenParagraphs = new Set();
    clone.querySelectorAll('p, li').forEach(el => {
      const text = el.innerText?.trim();
      if (!text || text.length < 30 || text.length > 2000) return;
      if (seenParagraphs.has(text)) return;
      seenParagraphs.add(text);
      paragraphs.push(text);
    });

    const cleanedText = (paragraphs.length > 0 ? paragraphs.join('\n\n') : clone.innerText || '')
      .replace(/[\t ]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    content.text = cleanedText.substring(0, 12000);
    content.paragraphs = paragraphs.slice(0, 120);
    content.wordCount = cleanedText ? cleanedText.split(/\s+/).length : 0;
    content.charCount = cleanedText ? cleanedText.replace(/\s+/g, '').length : 0;

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
