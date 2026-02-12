// ============================================
// SDK Chat Functions
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
 * Send message via SDK
 */
async function sendSDKMessage() {
  const input = dom.sdkInput;
  const content = input.value.trim();
  
  if (!content) return;
  
  // Add user message to UI
  addMessageToUI('user', content);
  input.value = '';
  dom.sdkSendBtn.disabled = true;
  
  // Show typing indicator
  const typingId = addTypingIndicator();
  
  try {
    // Import SDKClient dynamically
    const SDKClient = await import('./js/sdk-client.js');
    
    const response = await SDKClient.sendMessage({
      type: 'chat',
      content: content
    });
    
    removeTypingIndicator(typingId);
    
    if (response.success && response.content) {
      addMessageToUI('assistant', response.content);
    } else {
      addMessageToUI('assistant', '❌ Failed to get response from Copilot');
    }
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
  
  // Scroll to bottom
  if (dom.sdkMessages) {
    dom.sdkMessages.scrollTop = dom.sdkMessages.scrollHeight;
  }
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
  
  if (dom.sdkMessages) {
    dom.sdkMessages.scrollTop = dom.sdkMessages.scrollHeight;
  }
  
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
