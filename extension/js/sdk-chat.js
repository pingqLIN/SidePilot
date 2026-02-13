// ============================================
// SDK Chat Functions
// Handles SDK mode UI: messaging, streaming, indicators
// ============================================

let sdkMessages = []; // Chat history

/**
 * Switch UI mode between iframe and SDK
 */
function switchToMode(mode) {
  if (mode === 'sdk') {
    dom.copilotFrame?.classList.add('hidden');
    dom.sdkChat?.classList.remove('hidden');
  } else {
    dom.copilotFrame?.classList.remove('hidden');
    dom.sdkChat?.classList.add('hidden');
  }
}

/**
 * Send message via SDK (with streaming support)
 */
async function sendSDKMessage() {
  const input = dom.sdkInput;
  const content = input.value.trim();

  if (!content) return;

  // Add user message to UI
  addMessageToUI('user', content);
  input.value = '';
  dom.sdkSendBtn.disabled = true;

  // Show typing indicator → will be replaced by streaming content
  const typingId = addTypingIndicator();

  try {
    // Import SDKClient dynamically
    const SDKClient = await import('./js/sdk-client.js');

    // Create a placeholder for streaming content
    removeTypingIndicator(typingId);
    const streamEl = addStreamingMessage();

    // Use streaming API
    const finalContent = await SDKClient.sendMessageStreaming(
      { content },
      // onDelta: append each chunk to the streaming message
      (delta) => {
        appendToStreamingMessage(streamEl, delta);
      },
      // onTool: show tool execution status
      (tool) => {
        showToolIndicator(streamEl, tool);
      }
    );

    // Finalize the streaming message
    finalizeStreamingMessage(streamEl, finalContent);

  } catch (err) {
    removeTypingIndicator(typingId);
    console.error('[SDK Chat] Send error:', err);
    addMessageToUI('assistant', `❌ Error: ${err.message}`);
  } finally {
    dom.sdkSendBtn.disabled = false;
    input.focus();
  }
}

/**
 * Add message to UI
 */
function addMessageToUI(role, content) {
  const msg = {
    role,
    content,
    timestamp: Date.now()
  };

  sdkMessages.push(msg);

  const msgEl = document.createElement('div');
  msgEl.className = `sdk-message ${role}`;

  const contentEl = document.createElement('div');
  contentEl.className = 'sdk-message-content';
  contentEl.textContent = content;

  const timeEl = document.createElement('div');
  timeEl.className = 'sdk-message-time';
  const time = new Date(msg.timestamp);
  timeEl.textContent = time.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

  msgEl.appendChild(contentEl);
  msgEl.appendChild(timeEl);
  dom.sdkMessages?.appendChild(msgEl);

  scrollToBottom();
}

/**
 * Add a streaming message placeholder (assistant)
 * @returns {HTMLElement} - The message element for appending chunks
 */
function addStreamingMessage() {
  const msgEl = document.createElement('div');
  msgEl.className = 'sdk-message assistant streaming';

  const contentEl = document.createElement('div');
  contentEl.className = 'sdk-message-content';
  contentEl.textContent = '';

  const timeEl = document.createElement('div');
  timeEl.className = 'sdk-message-time';
  timeEl.textContent = '...';

  msgEl.appendChild(contentEl);
  msgEl.appendChild(timeEl);
  dom.sdkMessages?.appendChild(msgEl);

  scrollToBottom();
  return msgEl;
}

/**
 * Append text chunk to a streaming message
 * @param {HTMLElement} msgEl
 * @param {string} delta
 */
function appendToStreamingMessage(msgEl, delta) {
  const contentEl = msgEl.querySelector('.sdk-message-content');
  if (contentEl) {
    contentEl.textContent += delta;
  }
  scrollToBottom();
}

/**
 * Show tool execution indicator within streaming message
 * @param {HTMLElement} msgEl
 * @param {{name: string, status: string, result?: string}} tool
 */
function showToolIndicator(msgEl, tool) {
  const indicator = msgEl.querySelector('.sdk-tool-indicator') || (() => {
    const el = document.createElement('div');
    el.className = 'sdk-tool-indicator';
    msgEl.insertBefore(el, msgEl.querySelector('.sdk-message-content'));
    return el;
  })();

  if (tool.status === 'start') {
    indicator.textContent = `🔧 Running: ${tool.name}...`;
    indicator.classList.add('active');
  } else {
    indicator.textContent = `✅ ${tool.name}`;
    indicator.classList.remove('active');
  }
}

/**
 * Finalize streaming message — set final content and timestamp
 * @param {HTMLElement} msgEl
 * @param {string} finalContent
 */
function finalizeStreamingMessage(msgEl, finalContent) {
  msgEl.classList.remove('streaming');

  const contentEl = msgEl.querySelector('.sdk-message-content');
  if (contentEl && finalContent) {
    contentEl.textContent = finalContent;
  }

  const timeEl = msgEl.querySelector('.sdk-message-time');
  if (timeEl) {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  }

  // Store in history
  sdkMessages.push({
    role: 'assistant',
    content: finalContent,
    timestamp: Date.now(),
  });
}

/**
 * Add typing indicator
 */
function addTypingIndicator() {
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
  dom.sdkMessages?.appendChild(msgEl);

  scrollToBottom();
  return id;
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

/**
 * Scroll messages to bottom
 */
function scrollToBottom() {
  if (dom.sdkMessages) {
    dom.sdkMessages.scrollTop = dom.sdkMessages.scrollHeight;
  }
}

/**
 * Setup SDK chat event listeners
 */
function setupSDKChat() {
  if (!dom.sdkSendBtn || !dom.sdkInput) return;

  // Send button
  dom.sdkSendBtn.addEventListener('click', sendSDKMessage);

  // Enter to send (Shift+Enter for newline)
  dom.sdkInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendSDKMessage();
    }
  });

  // Update mode UI based on detected mode
  if (state.detectedMode === 'sdk') {
    switchToMode('sdk');
  } else {
    switchToMode('iframe');
  }
}

// Export for use in init
window.setupSDKChat = setupSDKChat;
window.switchToMode = switchToMode;
