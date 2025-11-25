// TaskDown Extension Background Script
// Handles background tasks and service worker functionality

console.log('TaskDown extension background script loaded');

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('TaskDown extension installed');

  // Set up context menu (optional) - only if API is available
  if (chrome.contextMenus) {
    try {
      chrome.contextMenus.create({
        id: 'open-taskdown',
        title: 'Abrir TaskDown',
        contexts: ['action']
      });
    } catch (error) {
      console.log('Context menu not available:', error);
    }
  }
  // Ensure a sensible default for the local task limit is present in storage.
  try {
    chrome.storage.sync.get(['taskdown_local_limit'], (res) => {
      const val = res && res.taskdown_local_limit;
      // If limit is set to 200 (old default), migrate it to 20
      if (val === 200) {
        console.log('Migrating local task limit from 200 to 20');
        chrome.storage.sync.set({ taskdown_local_limit: 20 }, () => {
          console.log('Local task limit migrated to 20');
        });
        return;
      }

      if (typeof val === 'number' && isFinite(val) && val > 0) {
        console.log('Local task limit already configured in storage:', val);
        return;
      }
      // Set default limit to 20 if not present
      chrome.storage.sync.set({ taskdown_local_limit: 20 }, () => {
        if (chrome.runtime.lastError) {
          console.warn('Could not set default taskdown_local_limit in sync storage:', chrome.runtime.lastError.message);
          // Try local as fallback
          chrome.storage.local.set({ taskdown_local_limit: 20 }, () => {
            console.log('Default taskdown_local_limit set in local storage to 20');
          });
        } else {
          console.log('Default taskdown_local_limit set in sync storage to 20');
        }
      });
    });
  } catch (err) {
    console.warn('Error while initializing task limit storage:', err);
  }
});

// Handle context menu clicks - only if API is available
if (chrome.contextMenus && chrome.contextMenus.onClicked) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'open-taskdown') {
      chrome.tabs.create({ url: 'https://your-taskdown-app.com' });
    }
  });
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'syncLocalTasks') {
    // Handle sync request - relay to all open web pages
    console.log('Background: Syncing local tasks');

    // Get all tabs and send message to matching ones
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && (tab.url.includes('localhost') || tab.url.includes('your-taskdown-app.com'))) {
          chrome.tabs.sendMessage(tab.id, { action: 'syncLocalTasks' }).catch(() => {
            // Tab might not have content script loaded, ignore error
          });
        }
      });
    });

    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'saveTasks') {
    // Save tasks from the web app directly into chrome.storage
    console.log('Background: Received saveTasks from web app');
    try {
      const tasks = request.tasks || [];
      const tasksJson = typeof tasks === 'string' ? tasks : JSON.stringify(tasks);
      // Store both the tasks payload and a last-origin marker in storage
      // so that the unified chrome.storage.onChanged listener can include
      // the origin when broadcasting to tabs. This avoids doing an
      // immediate manual broadcast here which produced duplicate messages
      // (one from this block and another from the storage.onChanged event).
      const payload = {
        'taskdown_local_tasks': tasksJson,
        'taskdown_last_origin': request.origin || 'web'
      };

      chrome.storage.sync.set(payload, () => {
        if (chrome.runtime.lastError) {
          console.warn('⚠️ chrome.storage.sync failed, trying local:', chrome.runtime.lastError.message);
          chrome.storage.local.set(payload, () => {
            console.log('✓ Saved tasks and origin to chrome.storage.local');
            // Let chrome.storage.onChanged handle broadcasting to tabs
            try {
              sendResponse({ success: true });
            } catch (err) {
              console.warn('⚠️ Could not send response (context invalidated):', err.message);
            }
          });
        } else {
          console.log('✓ Saved tasks and origin to chrome.storage.sync');
          // Let chrome.storage.onChanged handle broadcasting to tabs
          try {
            sendResponse({ success: true });
          } catch (err) {
            console.warn('⚠️ Could not send response (context invalidated):', err.message);
          }
        }
      });
    } catch (error) {
      console.error('Error saving tasks:', error);
      try {
        sendResponse({ success: false, error: error.message });
      } catch (err) {
        console.warn('⚠️ Could not send error response (context invalidated):', err.message);
      }
    }
    return true; // async response
  }

  if (request.action === 'setLocalLimit') {
    // Update the local task limit in chrome.storage (typically from web app)
    console.log('Background: Received setLocalLimit request with value:', request.value);
    try {
      const value = request.value;
      if (typeof value === 'number' && isFinite(value) && value > 0) {
        chrome.storage.sync.set({ taskdown_local_limit: value }, () => {
          if (chrome.runtime.lastError) {
            console.warn('⚠️ Failed to set limit in sync storage, trying local:', chrome.runtime.lastError.message);
            chrome.storage.local.set({ taskdown_local_limit: value }, () => {
              console.log('✓ Local task limit updated in local storage to:', value);
              try {
                sendResponse({ success: true, limit: value });
              } catch (err) {
                console.warn('⚠️ Could not send response (context invalidated):', err.message);
              }
            });
          } else {
            console.log('✓ Local task limit updated in sync storage to:', value);
            try {
              sendResponse({ success: true, limit: value });
            } catch (err) {
              console.warn('⚠️ Could not send response (context invalidated):', err.message);
            }
          }
        });
      } else {
        console.warn('Invalid limit value:', value);
        try {
          sendResponse({ success: false, error: 'Invalid limit value' });
        } catch (err) {
          console.warn('⚠️ Could not send error response (context invalidated):', err.message);
        }
      }
    } catch (error) {
      console.error('Error setting local limit:', error);
      try {
        sendResponse({ success: false, error: error.message });
      } catch (err) {
        console.warn('⚠️ Could not send error response (context invalidated):', err.message);
      }
    }
    return true; // async response
  }
});

// Listen for storage changes and notify content scripts
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' || areaName === 'local') {
    if (changes['taskdown_local_tasks']) {
      console.log('🔔 Storage changed in', areaName, '- notifying content scripts...');

      // Get all tabs and notify them. We attempt to retrieve a last-origin
      // marker from storage because the `changes` object doesn't always
      // include multiple keys in the same event reliably across storage areas.
      const newValue = changes['taskdown_local_tasks'].newValue;
      // First try to use any origin present in the changes object
      const originChange = changes['taskdown_last_origin'];
      let originFromChange = originChange ? originChange.newValue : undefined;

      // Retrieve origin from storage (sync preferred, fallback to local)
      const readOriginAndBroadcast = (resolve) => {
        try {
          chrome.storage.sync.get('taskdown_last_origin', (items) => {
            if (!chrome.runtime.lastError && items && typeof items.taskdown_last_origin !== 'undefined') {
              resolve(items.taskdown_last_origin);
            } else {
              // fallback to local storage
              chrome.storage.local.get('taskdown_last_origin', (localItems) => {
                if (!chrome.runtime.lastError && localItems && typeof localItems.taskdown_last_origin !== 'undefined') {
                  resolve(localItems.taskdown_last_origin);
                } else {
                  resolve(originFromChange);
                }
              });
            }
          });
        } catch (err) {
          resolve(originFromChange);
        }
      };

      readOriginAndBroadcast((resolvedOrigin) => {
        const origin = typeof resolvedOrigin !== 'undefined' ? resolvedOrigin : undefined;
        chrome.tabs.query({}, (tabs) => {
          console.log('📢 Broadcasting update to', tabs.length, 'tabs (origin:', origin, ')');
          tabs.forEach(tab => {
            if (tab.url && (tab.url.includes('localhost') || tab.url.includes('your-taskdown-app.com'))) {
              console.log('📤 Sending message to tab:', tab.url);
              chrome.tabs.sendMessage(tab.id, {
                action: 'storageChanged',
                data: newValue,
                origin
              }).catch((error) => {
                // Tab might not have content script loaded, ignore error
                console.debug('Tab message failed (expected if no content script):', error.message);
              });
            }
          });
        });
      });
    }
  }
});

// Basic keep-alive to prevent service worker from being terminated
setInterval(() => {
  console.log('TaskDown background script active');
}, 300000); // Every 5 minutes