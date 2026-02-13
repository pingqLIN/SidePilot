'use strict';

// ============================================
// 常數與狀態
// ============================================

const STORAGE_KEY = 'copilot_sidepanel_welcomed';
const STORAGE_KEY_DECLINED = 'copilot_sidepanel_declined';
const FRAME_LOAD_TIMEOUT = 15000;

const state = {
  currentPageContent: null,
  currentPageScreenshot: null,
  currentPartialScreenshot: null,
  currentPageError: null,
  isCapturePanelOpen: false,
  frameLoaded: false,
  loadTimeout: null,
  detectedMode: null
};

// ============================================
// DOM 元素
// ============================================

const dom = {};

// ============================================
// 初始化
// ============================================

function init() {
  // 取得所有 DOM 元素
  dom.copilotFrame = document.getElementById('copilotFrame');
  dom.loadingOverlay = document.getElementById('loadingOverlay');
  dom.errorOverlay = document.getElementById('errorOverlay');
  dom.errorMessage = document.getElementById('errorMessage');
  dom.floatingCaptureBtn = document.getElementById('floatingCaptureBtn');
  dom.pageInfo = document.getElementById('pageInfo');
  dom.pageTitle = document.getElementById('pageTitle');
  dom.pageUrl = document.getElementById('pageUrl');
  dom.capturePanel = document.getElementById('capturePanel');
  dom.captureContent = document.getElementById('captureContent');
  dom.closeCaptureBtn = document.getElementById('closeCaptureBtn');
  dom.retryBtn = document.getElementById('retryBtn');
  dom.openWindowBtn = document.getElementById('openWindowBtn');
  dom.toast = document.getElementById('toast');
  dom.welcomeOverlay = document.getElementById('welcomeOverlay');
  dom.welcomeCloseBtn = document.getElementById('welcomeCloseBtn');
  dom.welcomeDeclineBtn = document.getElementById('welcomeDeclineBtn');
  dom.welcomeSuppressCheckbox = document.getElementById('welcomeSuppressCheckbox');

  // Intro Video
  dom.introContainer = document.getElementById('introContainer');
  dom.introVideo = document.getElementById('introVideo');
  dom.skipIntroBtn = document.getElementById('skipIntroBtn');

  // Tab navigation
  dom.tabBar = document.querySelector('.tab-bar');
  dom.tabs = document.querySelectorAll('.tab');
  dom.tabContents = document.querySelectorAll('.tab-content');
  dom.modeBadge = document.getElementById('modeBadge');

  // SDK Chat elements
  dom.sdkChat = document.getElementById('sdkChat');
  dom.sdkMessages = document.getElementById('sdkMessages');
  dom.sdkInput = document.getElementById('sdkInput');
  dom.sdkSendBtn = document.getElementById('sdkSendBtn');

  // Rules tab
  dom.rulesEditor = document.getElementById('rulesEditor');
  dom.saveRulesBtn = document.getElementById('saveRulesBtn');
  dom.exportRulesBtn = document.getElementById('exportRulesBtn');
  dom.importRulesBtn = document.getElementById('importRulesBtn');
  dom.rulesFileInput = document.getElementById('rulesFileInput');
  dom.templateSelect = document.getElementById('templateSelect');
  dom.rulesStatus = document.getElementById('rulesStatus');

  // Memory tab
  dom.memoryList = document.getElementById('memoryList');
  dom.memorySearch = document.getElementById('memorySearch');
  dom.memoryFilter = document.getElementById('memoryFilter');
  dom.addMemoryBtn = document.getElementById('addMemoryBtn');
  dom.memoryModal = document.getElementById('memoryModal');
  dom.closeMemoryModal = document.getElementById('closeMemoryModal');
  dom.saveMemoryBtn = document.getElementById('saveMemoryBtn');
  dom.cancelMemoryBtn = document.getElementById('cancelMemoryBtn');
  dom.entryType = document.getElementById('entryType');
  dom.entryTitle = document.getElementById('entryTitle');
  dom.entryContent = document.getElementById('entryContent');
  dom.entryStatus = document.getElementById('entryStatus');
  dom.memoryModalTitle = document.getElementById('memoryModalTitle');
  dom.sendToVSCodeBtn = document.getElementById('sendToVSCodeBtn');

  // 驗證必要元素
  const required = ['copilotFrame', 'loadingOverlay', 'capturePanel', 'toast'];
  for (const key of required) {
    if (!dom[key]) {
      console.error(`Missing required element: ${key}`);
      return;
    }
  }

   setupEventListeners();
   setupFrameLoadDetection();
   loadCurrentPageInfo();
   checkIntroVideo();
 
   // Detect mode on startup (non-blocking)
   detectModeOnStartup();
}

// ============================================
// Mode Detection
// ============================================

async function detectModeOnStartup() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'detectMode' });
    if (response?.success) {
      state.detectedMode = response.mode;
      console.log('[SidePilot] Detected mode:', response.mode);
    } else {
      state.detectedMode = 'iframe';
      console.warn('[SidePilot] Mode detection failed, defaulting to iframe');
    }
    updateModeBadge();
  } catch (err) {
    state.detectedMode = 'iframe';
    console.warn('[SidePilot] Mode detection error, defaulting to iframe:', err.message);
    updateModeBadge();
  }
}

function updateModeBadge() {
  if (!dom.modeBadge) return;
  
  const mode = state.detectedMode || 'iframe';
  dom.modeBadge.textContent = mode;
  dom.modeBadge.className = `mode-badge ${mode}`;
  
  // Switch UI mode
  if (mode === 'sdk') {
    dom.copilotFrame?.classList.add('hidden');
    dom.sdkChat?.classList.remove('hidden');
  } else {
    dom.copilotFrame?.classList.remove('hidden');
    dom.sdkChat?.classList.add('hidden');
  }
}

// ============================================
// Tab Navigation
// ============================================

function switchTab(tabId) {
  // Update tab buttons
  dom.tabs.forEach(tab => {
    if (tab.dataset.tab === tabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Update tab content
  dom.tabContents.forEach(content => {
    if (content.id === `${tabId}-tab`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });

  // Load content if needed
  if (tabId === 'rules') {
    loadRules();
    loadTemplates();
  } else if (tabId === 'memory') {
    loadMemoryEntries();
  }
}

// ============================================
// Rules Management
// ============================================

async function loadRules() {
  chrome.runtime.sendMessage({ action: 'rules.load' }, (response) => {
    if (response?.success && dom.rulesEditor) {
      dom.rulesEditor.value = response.content || '';
      updateRulesStatus('Loaded', 'success');
    } else {
      updateRulesStatus('Failed to load', 'error');
    }
  });
}

async function saveRules() {
  if (!dom.rulesEditor) return;
  
  updateRulesStatus('Saving...', 'pending');
  const content = dom.rulesEditor.value;
  
  chrome.runtime.sendMessage({ action: 'rules.save', content }, (response) => {
    if (response?.success) {
      updateRulesStatus('Saved', 'success');
      showToast('Rules saved successfully');
    } else {
      updateRulesStatus('Save failed', 'error');
      showToast('Failed to save rules', 'error');
    }
  });
}

function exportRules() {
  chrome.runtime.sendMessage({ action: 'rules.export' }, (response) => {
    if (response?.success) {
      showToast('Rules exported');
    } else {
      showToast('Export failed', 'error');
    }
  });
}

function importRules(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const content = event.target.result;
    if (dom.rulesEditor) {
      dom.rulesEditor.value = content;
      saveRules(); // Auto-save after import
      showToast('Rules imported');
    }
  };
  reader.readAsText(file);
  
  // Reset input
  e.target.value = '';
}

function loadTemplates() {
  chrome.runtime.sendMessage({ action: 'rules.getTemplates' }, (response) => {
    if (response?.success && dom.templateSelect) {
      // Keep first option
      const firstOption = dom.templateSelect.options[0];
      dom.templateSelect.innerHTML = '';
      dom.templateSelect.appendChild(firstOption);
      
      response.templates.forEach(tpl => {
        const option = document.createElement('option');
        option.value = tpl.id;
        option.textContent = tpl.name;
        dom.templateSelect.appendChild(option);
      });
    }
  });
}

function applyTemplate(templateId) {
  if (!confirm('This will overwrite current rules. Continue?')) {
    if (dom.templateSelect) dom.templateSelect.value = '';
    return;
  }

  chrome.runtime.sendMessage({ action: 'rules.applyTemplate', templateId }, (response) => {
    if (response?.success && dom.rulesEditor) {
      dom.rulesEditor.value = response.content || '';
      updateRulesStatus('Template applied', 'success');
      showToast('Template applied');
    } else {
      showToast('Failed to apply template', 'error');
    }
    if (dom.templateSelect) dom.templateSelect.value = '';
  });
}

function updateRulesStatus(text, type) {
  if (!dom.rulesStatus) return;
  dom.rulesStatus.textContent = text;
  dom.rulesStatus.className = `rules-status ${type}`;
}

// ============================================
// Memory Management
// ============================================

let currentEditingId = null;

function loadMemoryEntries() {
  const filter = {};
  if (dom.memoryFilter && dom.memoryFilter.value) {
    const val = dom.memoryFilter.value;
    if (['task', 'note', 'context', 'reference'].includes(val)) {
      filter.type = val;
    }
  }

  chrome.runtime.sendMessage({ action: 'memory.list', filter }, (response) => {
    if (response?.success) {
      renderMemoryList(response.entries);
    }
  });
}

function searchMemory(query) {
  if (!query) {
    loadMemoryEntries();
    return;
  }

  chrome.runtime.sendMessage({ action: 'memory.search', query }, (response) => {
    if (response?.success) {
      renderMemoryList(response.entries);
    }
  });
}

// Render memory entries list with proper event delegation
function renderMemoryList(entries) {
  if (!dom.memoryList) return;
  
  if (!entries || entries.length === 0) {
    dom.memoryList.innerHTML = '<div class="memory-empty">No entries found.</div>';
    return;
  }

  dom.memoryList.innerHTML = entries.map(entry => `
    <div class="memory-entry" data-id="${entry.id}">
      <div class="memory-entry-header">
        <span class="memory-entry-title">${escapeHtml(entry.title)}</span>
        <span class="memory-entry-type">${entry.type}</span>
      </div>
      <div class="memory-entry-content">${escapeHtml(entry.content)}</div>
      <div class="memory-entry-footer">
        <span>${new Date(entry.updatedAt).toLocaleDateString()}</span>
        ${entry.type === 'task' ? `<span class="memory-entry-status ${entry.status}">${entry.status.replace('_', ' ')}</span>` : ''}
      </div>
    </div>
  `).join('');
}

// Add this to init or setupEventListeners
// I'll add a separate setupMemoryListeners function and call it.

function setupMemoryListeners() {
  if (dom.memoryList) {
    dom.memoryList.addEventListener('click', (e) => {
      const entryDiv = e.target.closest('.memory-entry');
      if (entryDiv) {
        editMemoryEntry(entryDiv.dataset.id);
      }
    });
  }
}

function openMemoryModal(entry = null) {
  currentEditingId = entry ? entry.id : null;
  
  if (dom.memoryModalTitle) dom.memoryModalTitle.textContent = entry ? 'Edit Entry' : 'New Entry';
  if (dom.entryType) dom.entryType.value = entry ? entry.type : 'task';
  if (dom.entryTitle) dom.entryTitle.value = entry ? entry.title : '';
  if (dom.entryContent) dom.entryContent.value = entry ? entry.content : '';
  if (dom.entryStatus) {
    dom.entryStatus.value = entry && entry.status ? entry.status : 'pending';
    dom.entryStatus.style.display = (entry ? entry.type : 'task') === 'task' ? 'block' : 'none';
  }
  
  // Add delete button if editing
  const footer = dom.memoryModal.querySelector('.modal-footer');
  const existingDelete = footer.querySelector('.btn-delete');
  if (existingDelete) existingDelete.remove();
  
  if (entry) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-icon btn-delete';
    deleteBtn.innerHTML = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75Zm4.5 0V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.75 1.75 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 6.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75Zm3 0a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75Z"/></svg>';
    deleteBtn.style.marginRight = 'auto';
    deleteBtn.onclick = () => deleteMemoryEntry(entry.id);
    footer.insertBefore(deleteBtn, footer.firstChild);
  }

  dom.memoryModal.classList.remove('hidden');
}

function closeMemoryModal() {
  dom.memoryModal.classList.add('hidden');
  currentEditingId = null;
}

function editMemoryEntry(id) {
  chrome.runtime.sendMessage({ action: 'memory.get', id }, (response) => {
    if (response?.success && response.entry) {
      openMemoryModal(response.entry);
    }
  });
}

function saveMemoryEntry() {
  const entry = {
    type: dom.entryType.value,
    title: dom.entryTitle.value,
    content: dom.entryContent.value,
    status: dom.entryStatus.value
  };

  if (!entry.title) {
    showToast('Title is required', 'error');
    return;
  }

  if (currentEditingId) {
    chrome.runtime.sendMessage({ action: 'memory.update', id: currentEditingId, data: entry }, (response) => {
      if (response?.success) {
        closeMemoryModal();
        loadMemoryEntries();
        showToast('Entry updated');
      } else {
        showToast('Failed to update: ' + response.error, 'error');
      }
    });
  } else {
    chrome.runtime.sendMessage({ action: 'memory.create', entry }, (response) => {
      if (response?.success) {
        closeMemoryModal();
        loadMemoryEntries();
        showToast('Entry created');
      } else {
        showToast('Failed to create: ' + response.error, 'error');
      }
    });
  }
}

function deleteMemoryEntry(id) {
  if (!confirm('Are you sure you want to delete this entry?')) return;
  
  chrome.runtime.sendMessage({ action: 'memory.delete', id }, (response) => {
    if (response?.success) {
      closeMemoryModal();
      loadMemoryEntries();
      showToast('Entry deleted');
    } else {
      showToast('Failed to delete', 'error');
    }
  });
}

// 傳送目前編輯中的條目到 VS Code
function sendEntryToVSCode() {
  if (!currentEditingId) {
    showToast('請先選取一個條目', 'error');
    return;
  }
  chrome.runtime.sendMessage({ action: 'vscode.send', id: currentEditingId }, (response) => {
    if (response?.success) {
      showToast('已傳送到 VS Code');
    } else {
      showToast('傳送失敗: ' + (response?.error || '未知錯誤'), 'error');
    }
  });
}

// ============================================
// 事件監聽器設置
// ============================================

function setupEventListeners() {
  // 底部浮動擷取按鈕
  dom.floatingCaptureBtn?.addEventListener('click', toggleCapturePanel);

  // 擷取面板
  dom.closeCaptureBtn?.addEventListener('click', closeCapturePanel);
  dom.captureContent?.addEventListener('click', handleCaptureContentClick);

  // 錯誤處理
  dom.retryBtn?.addEventListener('click', refreshFrame);
  dom.openWindowBtn?.addEventListener('click', openCopilotWindow);

  // 歡迎畫面
  dom.welcomeCloseBtn?.addEventListener('click', closeWelcome);
  dom.welcomeDeclineBtn?.addEventListener('click', declineAndClose);

  // 監聽來自 background 的訊息
  chrome.runtime.onMessage.addListener(handleBackgroundMessage);

  // Tab Navigation
  dom.tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Rules Tab
  dom.saveRulesBtn?.addEventListener('click', saveRules);
  dom.exportRulesBtn?.addEventListener('click', exportRules);
  dom.importRulesBtn?.addEventListener('click', () => dom.rulesFileInput?.click());
  dom.rulesFileInput?.addEventListener('change', importRules);
  dom.templateSelect?.addEventListener('change', (e) => {
    if (e.target.value) applyTemplate(e.target.value);
  });

  // Memory Tab
  dom.addMemoryBtn?.addEventListener('click', () => openMemoryModal());
  dom.closeMemoryModal?.addEventListener('click', closeMemoryModal);
  dom.cancelMemoryBtn?.addEventListener('click', closeMemoryModal);
  dom.saveMemoryBtn?.addEventListener('click', saveMemoryEntry);
  dom.memorySearch?.addEventListener('input', (e) => searchMemory(e.target.value));
  dom.memoryFilter?.addEventListener('change', () => loadMemoryEntries());
  dom.entryType?.addEventListener('change', (e) => {
    // Show/hide status based on type
    if (dom.entryStatus) {
      dom.entryStatus.style.display = e.target.value === 'task' ? 'block' : 'none';
    }
  });
  dom.sendToVSCodeBtn?.addEventListener('click', sendEntryToVSCode);
  
  setupMemoryListeners();
  
  // SDK Chat
  dom.sdkSendBtn?.addEventListener('click', async () => {
    const content = dom.sdkInput?.value?.trim();
    if (!content) return;
    
    dom.sdkInput.value = '';
    dom.sdkSendBtn.disabled = true;
    
    // Add user message
    addSDKMessage('user', content);
    
    // Add typing indicator
    const typingId = addSDKTypingIndicator();
    
    try {
      const SDKClient = await import('./js/sdk-client.js');
      const response = await SDKClient.sendMessage({ type: 'chat', content });
      
      removeSDKTypingIndicator(typingId);
      
      if (response.success && response.content) {
        addSDKMessage('assistant', response.content);
      } else {
        addSDKMessage('assistant', '❌ Failed to get response');
      }
    } catch (err) {
      removeSDKTypingIndicator(typingId);
      console.error('[SDK Chat]', err);
      addSDKMessage('assistant', `❌ Error: ${err.message}`);
    } finally {
      dom.sdkSendBtn.disabled = false;
      dom.sdkInput?.focus();
    }
  });
  
  dom.sdkInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      dom.sdkSendBtn?.click();
    }
  });
}

// ============================================
// iframe 載入偵測
// ============================================

function setupFrameLoadDetection() {
  // 清除之前的 timeout，避免重複設置
  if (state.loadTimeout) {
    clearTimeout(state.loadTimeout);
    state.loadTimeout = null;
  }

  // 載入成功
  dom.copilotFrame.addEventListener('load', () => {
    if (state.loadTimeout) {
      clearTimeout(state.loadTimeout);
      state.loadTimeout = null;
    }
    state.frameLoaded = true;
    dom.loadingOverlay.classList.add('hidden');
    dom.errorOverlay.classList.add('hidden');
  });

  // 載入超時
  state.loadTimeout = setTimeout(() => {
    if (!state.frameLoaded) {
      showFrameError('載入超時，請檢查網路連線');
    }
    state.loadTimeout = null;
  }, FRAME_LOAD_TIMEOUT);

  // iframe 錯誤偵測
  dom.copilotFrame.addEventListener('error', () => {
    showFrameError('無法載入 GitHub Copilot');
  });
}

function showFrameError(message) {
  dom.loadingOverlay.classList.add('hidden');
  dom.errorOverlay.classList.remove('hidden');
  if (dom.errorMessage) {
    dom.errorMessage.textContent = message;
  }
}

function refreshFrame() {
  // 清除之前的 timeout
  if (state.loadTimeout) {
    clearTimeout(state.loadTimeout);
    state.loadTimeout = null;
  }
  
  state.frameLoaded = false;
  dom.loadingOverlay.classList.remove('hidden');
  dom.errorOverlay.classList.add('hidden');
  dom.copilotFrame.src = dom.copilotFrame.src;
  
  // 重新設置載入超時（事件監聽器已在 init 時設置，不需重複綁定）
  state.loadTimeout = setTimeout(() => {
    if (!state.frameLoaded) {
      showFrameError('載入超時，請檢查網路連線');
    }
    state.loadTimeout = null;
  }, FRAME_LOAD_TIMEOUT);
}

function openCopilotWindow() {
  chrome.runtime.sendMessage({ action: 'openCopilotWindow' });
}

// ============================================
// 首次使用者檢查
// ============================================

function checkIntroVideo() {
  // 檢查是否已拒絕過
  const declined = localStorage.getItem(STORAGE_KEY_DECLINED);
  if (declined) {
    showDeclinedState();
    return;
  }

  const introPlayed = localStorage.getItem('intro_played');
  
  if (!introPlayed && dom.introContainer && dom.introVideo) {
    // Play video
    dom.introContainer.classList.remove('hidden');
    dom.introVideo.play().catch(err => {
        console.error("Video play failed", err);
        finishIntro();
    });
    
    dom.introVideo.onended = finishIntro;
    dom.skipIntroBtn.onclick = finishIntro;
  } else {
    checkWarningStatus();
  }
}

function finishIntro() {
  if (!dom.introContainer) return;
  
  dom.introContainer.classList.add('fade-out');
  
  // Stop video to save resources
  if (dom.introVideo) {
    dom.introVideo.pause();
  }

  setTimeout(() => {
    dom.introContainer.classList.add('hidden');
    localStorage.setItem('intro_played', 'true');
    checkWarningStatus();
  }, 1000);
}

function checkWarningStatus() {
  const isSuppressed = localStorage.getItem('copilot_warning_suppressed');
  
  if (!isSuppressed && dom.welcomeOverlay) {
    dom.welcomeOverlay.classList.remove('hidden');
    // 觸發淡入動畫
    requestAnimationFrame(() => {
      dom.welcomeOverlay.classList.add('visible');
    });
  }
}

function showDeclinedState() {
  // 不載入 iframe
  if (dom.copilotFrame) {
    dom.copilotFrame.src = 'about:blank';
  }
  
  dom.loadingOverlay?.classList.add('hidden');
  dom.welcomeOverlay?.classList.remove('visible');
  dom.welcomeOverlay?.classList.add('hidden');
  
  if (dom.errorOverlay) {
    dom.errorOverlay.classList.remove('hidden');
    if (dom.errorMessage) {
      dom.errorMessage.innerHTML = '您已拒絕使用條款。<br><br>如需使用 SidePilot，請重新開啟擴充功能並接受相關風險聲明。<br><br><button id="resetDeclineBtn" class="btn btn-secondary" style="margin-top: 12px;">重新選擇</button>';
    }
    
    // 綁定重置按鈕
    setTimeout(() => {
      const resetBtn = document.getElementById('resetDeclineBtn');
      resetBtn?.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY_DECLINED);
        location.reload();
      });
    }, 0);
  }
}

function closeWelcome() {
  localStorage.setItem(STORAGE_KEY, 'true');
  
  if (dom.welcomeSuppressCheckbox && dom.welcomeSuppressCheckbox.checked) {
    localStorage.setItem('copilot_warning_suppressed', 'true');
  }

  // 先淡出，再隱藏
  dom.welcomeOverlay?.classList.remove('visible');
  setTimeout(() => {
    dom.welcomeOverlay?.classList.add('hidden');
  }, 300);
}

function declineAndClose() {
  // 使用者拒絕條款，記錄拒絕狀態
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(STORAGE_KEY_DECLINED, 'true');
  
  // 顯示拒絕狀態
  showDeclinedState();
  showToast('您已拒絕使用條款。如需使用，請點擊「重新選擇」。', 'warning');
}

// ============================================
// 頁面資訊
// ============================================

function loadCurrentPageInfo() {
  chrome.runtime.sendMessage({ action: 'getPageContent' }, (response) => {
    if (chrome.runtime.lastError) return;

    if (response?.success || response?.pageInfo) {
      updatePageInfo(
        response.title || response.pageInfo?.title,
        response.url || response.pageInfo?.url
      );
    }
  });
}

function updatePageInfo(title, url) {
  if (dom.pageTitle) dom.pageTitle.textContent = title || '無標題';
  if (dom.pageUrl) dom.pageUrl.textContent = url || '';
  dom.pageInfo?.classList.add('visible');
}

// ============================================
// 擷取面板
// ============================================

function toggleCapturePanel() {
  if (state.isCapturePanelOpen) {
    closeCapturePanel();
  } else {
    openCapturePanel();
  }
}

async function openCapturePanel() {
  state.isCapturePanelOpen = true;
  dom.capturePanel?.classList.add('visible');
  dom.floatingCaptureBtn?.classList.add('active');

  await loadPageContent();
}

function closeCapturePanel() {
  state.isCapturePanelOpen = false;
  dom.capturePanel?.classList.remove('visible');
  dom.floatingCaptureBtn?.classList.remove('active');
}

async function loadPageContent() {
  if (!dom.captureContent) return;

  renderCaptureLoading();
  state.currentPageError = null;
  state.currentPartialScreenshot = null;

  const [pageResult, screenshotResult] = await Promise.all([
    requestPageContent(),
    requestVisibleScreenshot()
  ]);

  if (pageResult?.success && pageResult.content) {
    state.currentPageContent = pageResult.content;
    state.currentPageError = null;
    updatePageInfo(pageResult.title, pageResult.url);
  } else {
    state.currentPageContent = null;
    state.currentPageError = pageResult?.error || '無法取得頁面內容';
  }

  if (screenshotResult?.success && screenshotResult.dataUrl) {
    state.currentPageScreenshot = screenshotResult.dataUrl;
  } else {
    state.currentPageScreenshot = null;
  }

  renderCaptureContent();
}

function renderCaptureLoading() {
  if (!dom.captureContent) return;
  dom.captureContent.innerHTML = `
    <div class="capture-grid">
      ${['A', 'B', 'C'].map(() => `
        <div class="capture-card loading">
          <div class="capture-card-header">
            <div class="capture-card-title">載入中</div>
            <div class="capture-card-subtitle">請稍候</div>
          </div>
          <div class="capture-card-body">
            <div class="capture-loading">載入中...</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderCaptureContent() {
  if (!dom.captureContent) return;

  const content = state.currentPageContent;
  const previewText = buildTextPreview(content);
  const statsText = buildTextStats(content);
  const title = content?.title ? escapeHtml(content.title) : '無標題';
  const url = content?.url ? escapeHtml(content.url) : '';
  const descriptionRaw = content?.meta?.description || content?.meta?.['og:description'] || '';
  const description = descriptionRaw ? escapeHtml(descriptionRaw) : '';

  const textBodyHtml = content
    ? `
        <div class="capture-text-meta">
          <div class="capture-meta-row">
            <span class="capture-meta-label">標題</span>
            <span class="capture-meta-value">${title}</span>
          </div>
          ${url ? `
          <div class="capture-meta-row">
            <span class="capture-meta-label">網址</span>
            <span class="capture-meta-value">${url}</span>
          </div>` : ''}
          ${description ? `
          <div class="capture-meta-row">
            <span class="capture-meta-label">描述</span>
            <span class="capture-meta-value">${description}</span>
          </div>` : ''}
        </div>
        <div class="capture-text-preview">${escapeHtml(previewText)}</div>
      `
    : `<div class="capture-error">${escapeHtml(state.currentPageError || '沒有可用的內容')}</div>`;

  const fullShot = state.currentPageScreenshot;
  const partialShot = state.currentPartialScreenshot;

  const fullThumbAction = fullShot ? 'open-full' : 'refresh-full';
  const partialThumbAction = partialShot ? 'open-partial' : 'capture-partial';

  const fullThumbHtml = fullShot
    ? `<img src="${escapeAttr(fullShot)}" alt="頁面截圖">
       <div class="capture-thumb-label">可見範圍</div>
       <div class="capture-thumb-action" data-action="refresh-full">重新擷取</div>`
    : `<div>點擊擷取頁面縮圖</div>`;

  const partialThumbHtml = partialShot
    ? `<img src="${escapeAttr(partialShot)}" alt="部分截圖">
       <div class="capture-thumb-label">選取範圍</div>
       <div class="capture-thumb-action" data-action="capture-partial">重新選取</div>`
    : `<div>點擊選取範圍</div>`;

  dom.captureContent.innerHTML = `
    <div class="capture-grid">
      <div class="capture-card">
        <div class="capture-card-header">
          <div class="capture-card-title">A 文字擷取</div>
          <div class="capture-card-subtitle">${statsText}</div>
        </div>
        <div class="capture-card-body">
          ${textBodyHtml}
        </div>
        <div class="capture-card-actions">
          <button class="btn-soft" data-action="copy-text">複製文字</button>
          <button class="btn-soft" data-action="copy-structured">複製結構化</button>
        </div>
      </div>

      <div class="capture-card">
        <div class="capture-card-header">
          <div class="capture-card-title">B 頁面截圖</div>
          <div class="capture-card-subtitle">自動擷取可見範圍</div>
        </div>
        <div class="capture-card-body">
          <div class="capture-thumb" data-action="${fullThumbAction}">${fullThumbHtml}</div>
        </div>
        <div class="capture-card-actions">
          <button class="btn-soft" data-action="refresh-full">重新擷取</button>
          <button class="btn-soft" data-action="download-full">下載截圖</button>
        </div>
      </div>

      <div class="capture-card">
        <div class="capture-card-header">
          <div class="capture-card-title">C 部分截圖</div>
          <div class="capture-card-subtitle">拖曳選取區域</div>
        </div>
        <div class="capture-card-body">
          <div class="capture-thumb" data-action="${partialThumbAction}">${partialThumbHtml}</div>
        </div>
        <div class="capture-card-actions">
          <button class="btn-soft" data-action="capture-partial">選取範圍</button>
          <button class="btn-soft" data-action="download-partial">下載截圖</button>
        </div>
      </div>
    </div>
  `;
}

function buildTextPreview(content) {
  if (!content) return '';
  const paragraphs = Array.isArray(content.paragraphs) && content.paragraphs.length
    ? content.paragraphs
    : (content.text || '').split(/\n{2,}/g).filter(Boolean);
  const preview = paragraphs.slice(0, 3).join('\n\n').trim();
  return preview || content.text || '';
}

function buildTextStats(content) {
  if (!content) return '尚無文字';
  const parts = [];
  if (content.charCount) {
    parts.push(`${content.charCount} 字`);
  } else if (content.wordCount) {
    parts.push(`${content.wordCount} 字`);
  }
  if (content.paragraphs?.length) parts.push(`${content.paragraphs.length} 段`);
  if (content.headings?.length) parts.push(`${content.headings.length} 標題`);
  if (content.codeBlocks?.length) parts.push(`${content.codeBlocks.length} 程式碼`);
  return parts.length > 0 ? parts.join(' · ') : '尚無文字';
}

function handleCaptureContentClick(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;
  switch (action) {
    case 'copy-text':
      copyAllContent();
      break;
    case 'copy-structured':
      copyStructuredContent();
      break;
    case 'refresh-full':
      refreshFullScreenshot();
      break;
    case 'capture-partial':
      refreshPartialScreenshot();
      break;
    case 'download-full':
      downloadScreenshot(state.currentPageScreenshot, 'sidepilot-page.png');
      break;
    case 'download-partial':
      downloadScreenshot(state.currentPartialScreenshot, 'sidepilot-partial.png');
      break;
    case 'open-full':
      openScreenshotInTab(state.currentPageScreenshot);
      break;
    case 'open-partial':
      openScreenshotInTab(state.currentPartialScreenshot);
      break;
    default:
      break;
  }
}

function requestPageContent() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ action: 'getPageContent' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { success: false, error: '無法取得頁面內容' });
    });
  });
}

function requestVisibleScreenshot() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ action: 'captureVisibleScreenshot' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { success: false, error: '無法擷取截圖' });
    });
  });
}

function requestPartialScreenshot() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ action: 'capturePartialScreenshot' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { success: false, error: '無法擷取部分截圖' });
    });
  });
}

async function refreshFullScreenshot() {
  showToast('擷取頁面截圖中...');
  const result = await requestVisibleScreenshot();
  if (result?.success && result.dataUrl) {
    state.currentPageScreenshot = result.dataUrl;
    renderCaptureContent();
    showToast('頁面截圖已更新');
  } else {
    showToast(result?.error || '擷取失敗', 'error');
  }
}

async function refreshPartialScreenshot() {
  showToast('請在頁面上拖曳選取區域...');
  const result = await requestPartialScreenshot();
  if (result?.success && result.dataUrl) {
    state.currentPartialScreenshot = result.dataUrl;
    renderCaptureContent();
    showToast('部分截圖已更新');
  } else if (result?.error) {
    showToast(result.error, 'error');
  }
}

function openScreenshotInTab(dataUrl) {
  if (!dataUrl) {
    showToast('尚無截圖可開啟', 'error');
    return;
  }
  chrome.tabs.create({ url: dataUrl });
}

function downloadScreenshot(dataUrl, filename) {
  if (!dataUrl) {
    showToast('尚無截圖可下載', 'error');
    return;
  }
  chrome.downloads.download({ url: dataUrl, filename, saveAs: true }, () => {
    if (chrome.runtime.lastError) {
      showToast('下載失敗: ' + chrome.runtime.lastError.message, 'error');
    } else {
      showToast('已開始下載');
    }
  });
}

// ============================================
// 複製功能
// ============================================

async function copyAllContent() {
  if (!state.currentPageContent) {
    showToast('沒有可複製的內容', 'error');
    return;
  }

  const markdown = formatAsMarkdown(state.currentPageContent);
  await copyToClipboard(markdown, '文字摘要已複製，可貼到 Copilot 對話中');
}

async function copyStructuredContent() {
  if (!state.currentPageContent) {
    showToast('沒有可複製的內容', 'error');
    return;
  }

  const structured = formatAsStructured(state.currentPageContent);
  await copyToClipboard(structured, '結構化資料已複製');
}

function formatAsMarkdown(content) {
  const lines = [];

  lines.push('# 頁面內容摘要');
  lines.push('');

  if (content.title) {
    lines.push(`**標題:** ${content.title}`);
  }
  if (content.url) {
    lines.push(`**網址:** ${content.url}`);
  }
  const description = content.meta?.description || content.meta?.['og:description'];
  if (description) {
    lines.push(`**描述:** ${description}`);
  }
  lines.push('');

  if (content.headings?.length > 0) {
    lines.push('## 頁面結構');
    content.headings.forEach(h => {
      const indent = '  '.repeat(parseInt(h.level.charAt(1)) - 1);
      lines.push(`${indent}- ${h.text}`);
    });
    lines.push('');
  }

  if (content.codeBlocks?.length > 0) {
    lines.push('## 程式碼區塊');
    content.codeBlocks.forEach((block, i) => {
      const code = typeof block === 'string' ? block : block.code;
      const lang = typeof block === 'object' ? block.language : '';
      lines.push(`\n### 程式碼 ${i + 1}`);
      lines.push('```' + lang);
      lines.push(code);
      lines.push('```');
    });
    lines.push('');
  }

  if (content.paragraphs?.length > 0) {
    lines.push('## 主要內容');
    lines.push(content.paragraphs.join('\n\n').substring(0, 5000));
  } else if (content.text) {
    lines.push('## 主要內容');
    lines.push(content.text.substring(0, 5000));
  }

  return lines.join('\n');
}

function formatAsStructured(content) {
  const payload = {
    title: content.title || '',
    url: content.url || '',
    meta: content.meta || {},
    headings: content.headings || [],
    paragraphs: content.paragraphs || [],
    codeBlocks: content.codeBlocks || [],
    wordCount: content.wordCount || 0,
    charCount: content.charCount || 0
  };
  return JSON.stringify(payload, null, 2);
}

async function copyToClipboard(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage || '已複製');
    return true;
  } catch (err) {
    showToast('複製失敗: ' + err.message, 'error');
    return false;
  }
}

// ============================================
// 背景訊息處理
// ============================================

function handleBackgroundMessage(message, sender, sendResponse) {
  if (message.action === 'tabUpdated' || message.action === 'tabActivated') {
    updatePageInfo(message.title, message.url);

    // 如果擷取面板開啟中，重新載入內容
    if (state.isCapturePanelOpen) {
      loadPageContent();
    }
  }
}

// ============================================
// Toast 通知
// ============================================

function showToast(message, type = 'success') {
  if (!dom.toast) return;

  dom.toast.textContent = message;
  dom.toast.className = 'toast visible' + (type !== 'success' ? ` ${type}` : '');

  setTimeout(() => {
    dom.toast.classList.remove('visible');
  }, 3000);
}

// ============================================
// 工具函數
// ============================================

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ============================================
// SDK Chat Helpers
// ============================================

function addSDKMessage(role, content) {
  if (!dom.sdkMessages) return;
  
  const msgEl = document.createElement('div');
  msgEl.className = `sdk-message ${role}`;
  
  const contentEl = document.createElement('div');
  contentEl.className = 'sdk-message-content';
  contentEl.textContent = content;
  
  const timeEl = document.createElement('div');
  timeEl.className = 'sdk-message-time';
  const time = new Date();
  timeEl.textContent = time.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  
  msgEl.appendChild(contentEl);
  msgEl.appendChild(timeEl);
  dom.sdkMessages.appendChild(msgEl);
  
  dom.sdkMessages.scrollTop = dom.sdkMessages.scrollHeight;
}

function addSDKTypingIndicator() {
  if (!dom.sdkMessages) return null;
  
  const id = `typing-${Date.now()}`;
  const msgEl = document.createElement('div');
  msgEl.className = 'sdk-message assistant loading';
  msgEl.id = id;
  
  const indicator = document.createElement('div');
  indicator.className = 'sdk-typing-indicator';
  indicator.innerHTML = '<span></span><span></span><span></span>';
  
  const contentEl = document.createElement('div');
  contentEl.className = 'sdk-message-content';
  contentEl.appendChild(indicator);
  
  msgEl.appendChild(contentEl);
  dom.sdkMessages.appendChild(msgEl);
  
  dom.sdkMessages.scrollTop = dom.sdkMessages.scrollHeight;
  return id;
}

function removeSDKTypingIndicator(id) {
  if (!id) return;
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ============================================
// 啟動
// ============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
