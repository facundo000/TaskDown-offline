/**
 * Content script for syncing extension storage with web app localStorage
 * This script runs in the context of the web page and can sync data
 * between chrome.storage and localStorage
 */

console.log('🔌 Content sync script loaded');

// Track if we've set up the message listener
let messageListenerReady = false;

// Listen for messages posted from the page (window.postMessage)
// This is the PRIMARY way to receive task changes from Angular
window.addEventListener('message', (event) => {
  // Only accept messages from same window
  if (!event || event.source !== window || !event.data) return;

  const msg = event.data;
  console.log('📬 Message received by content script:', msg.type);

  // Ignore messages we sent ourselves (e.g., TASKDOWN_EXTENSION_STORAGE_CHANGED)
  if (msg && msg.origin === 'extension') {
    console.log('ℹ️ Ignoring message from extension (already processed)');
    return;
  }

  if (msg && msg.type === 'TASKDOWN_SAVE_TASKS') {
    console.log('📥 ✓ Received TASKDOWN_SAVE_TASKS from page - forwarding to background');
    try {
      const tasks = msg.tasks || [];
      console.log('   Tasks count:', tasks.length);

      // Forward to background to persist tasks (keeping MV3 lifecycle safe)
      chrome.runtime.sendMessage({ action: 'saveTasks', tasks, origin: 'web' }, (resp) => {
        if (chrome.runtime.lastError) {
          console.warn('⚠️ Could not forward tasks to background:', chrome.runtime.lastError.message);
        } else {
          console.log('✓ ✓ Tasks forwarded to background (page -> content -> background -> storage)');
        }
      });
    } catch (err) {
      if (err.message && err.message.includes('Extension context invalidated')) {
        console.warn('⚠️ Extension was reloaded. Please refresh the page to reconnect.');
      } else {
        console.error('Error handling TASKDOWN_SAVE_TASKS message:', err);
      }
    }
  }

  if (msg && msg.type === 'TASKDOWN_SET_LOCAL_LIMIT') {
    console.log('📥 ✓ Received TASKDOWN_SET_LOCAL_LIMIT from page with value:', msg.value);
    try {
      const value = msg.value;

      // Forward to background to update local task limit
      chrome.runtime.sendMessage({ action: 'setLocalLimit', value }, (resp) => {
        if (chrome.runtime.lastError) {
          console.warn('⚠️ Could not forward limit update to background:', chrome.runtime.lastError.message);
        } else {
          console.log('✓ Local limit forwarded to background (page -> content -> background -> storage):', value);
        }
      });
    } catch (err) {
      if (err.message && err.message.includes('Extension context invalidated')) {
        console.warn('⚠️ Extension was reloaded. Please refresh the page to reconnect.');
      } else {
        console.error('Error handling TASKDOWN_SET_LOCAL_LIMIT message:', err);
      }
    }
  }
});

console.log('✓ Message listener registered (will catch window.postMessage from page)');
messageListenerReady = true;

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📬 Content script received message:', request.action);
  // If storageChanged is broadcast from background, sync to page and notify
  if (request.action === 'storageChanged') {
    try {
      console.log('🔔 storageChanged received in content script - syncing data to page');
      const newValue = request.data;
      if (newValue) {
        try {
          localStorage.setItem('taskdown_local_tasks', typeof newValue === 'string' ? newValue : JSON.stringify(newValue));
          // Create a stable change id and include it in the posted message
          // ONLY when the change truly comes from the extension (origin === 'extension').
          // If origin is missing/undefined, avoid including __changeId to prevent
          // the page from thinking there's an extension-origin marker when there isn't.
          const origin = request.origin || undefined;
          if (origin === 'extension') {
            const cid = '__EXT' + Date.now();
            try {
              localStorage.setItem('__TASKDOWN_EXTENSION_CHANGE', cid);
            } catch (err) {
              console.debug('Could not set __TASKDOWN_EXTENSION_CHANGE marker:', err);
            }
            // Notify the page context so the web app can show a reminder
            window.postMessage({ type: 'TASKDOWN_EXTENSION_STORAGE_CHANGED', data: newValue, __changeId: cid, origin }, '*');
            console.log('✓ Posted TASKDOWN_EXTENSION_STORAGE_CHANGED to page with changeId:', cid, 'origin:', origin);
          } else {
            // Post without __changeId when origin is not explicitly 'extension'
            window.postMessage({ type: 'TASKDOWN_EXTENSION_STORAGE_CHANGED', data: newValue, origin }, '*');
            console.log('✓ Posted TASKDOWN_EXTENSION_STORAGE_CHANGED to page with origin:', origin);
          }
        } catch (err) {
          console.error('Error writing tasks to localStorage inside content script:', err);
        }
      }
      sendResponse({ success: true });
    } catch (err) {
      console.error('Error handling storageChanged message in content script:', err);
      sendResponse({ success: false });
    }
    return true;
  }

  if (request.action === 'syncLocalTasks') {
    // Get tasks from chrome.storage and sync to web localStorage
    console.log('🔄 Syncing tasks from extension to web...');
    chrome.storage.sync.get('taskdown_local_tasks', (items) => {
      if (chrome.runtime.lastError) {
        console.warn('⚠️ Storage error:', chrome.runtime.lastError.message);
        sendResponse({ success: false });
        return;
      }

      if (items && items.taskdown_local_tasks) {
        try {
          localStorage.setItem('taskdown_local_tasks', items.taskdown_local_tasks);
          console.log('✓ Tasks synced to web localStorage');
          sendResponse({ success: true });
        } catch (error) {
          console.error('Error updating localStorage:', error);
          sendResponse({ success: false });
        }
      } else {
        console.log('ℹ️ No tasks found in extension storage');
        sendResponse({ success: true });
      }
    });

    return true; // Keep channel open for async response
  }

  if (request.action === 'saveTasks') {
    // Save tasks from web app to chrome.storage
    console.log('💾 Saving tasks from web app to extension storage');
    try {
      const tasks = request.tasks || [];
      const tasksJson = typeof tasks === 'string' ? tasks : JSON.stringify(tasks);

      chrome.storage.sync.set({ 'taskdown_local_tasks': tasksJson }, () => {
        if (chrome.runtime.lastError) {
          console.warn('⚠️ Failed to save to sync storage, trying local:', chrome.runtime.lastError.message);
          chrome.storage.local.set({ 'taskdown_local_tasks': tasksJson }, () => {
            console.log('✓ Tasks saved to local storage');
            sendResponse({ success: true });
          });
        } else {
          console.log('✓ Tasks saved to sync storage');
          sendResponse({ success: true });
        }
      });
    } catch (error) {
      console.error('Error saving tasks:', error);
      sendResponse({ success: false });
    }

    return true; // Keep channel open for async response
  }
});

// Initial sync when page loads
console.log('📋 Performing initial sync on page load...');
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, syncing from extension storage to web');
    chrome.storage.sync.get('taskdown_local_tasks', (items) => {
      if (items && items.taskdown_local_tasks) {
        try {
          localStorage.setItem('taskdown_local_tasks', items.taskdown_local_tasks);
          console.log('✓ Initial sync completed');
        } catch (error) {
          console.error('Error during initial sync:', error);
        }
      }
    });
  });
} else {
  // DOM is already ready
  setTimeout(() => {
    chrome.storage.sync.get('taskdown_local_tasks', (items) => {
      if (items && items.taskdown_local_tasks) {
        try {
          localStorage.setItem('taskdown_local_tasks', items.taskdown_local_tasks);
          console.log('✓ Initial sync completed');
        } catch (error) {
          console.error('Error during initial sync:', error);
        }
      }
    });
  }, 500);
}