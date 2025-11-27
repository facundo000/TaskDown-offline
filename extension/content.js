// TaskDown Extension Content Script
// Runs on web pages to provide integration with the TaskDown web app

// Only run on TaskDown app pages
if (window.location.hostname.includes('taskdown-offline.vercel.app') ||
  window.location.hostname === 'localhost') {


  // Listen for messages from the web app
  window.addEventListener('message', (event) => {
    // Only accept messages from the same origin
    if (event.origin !== window.location.origin) return;

    if (event.data.type === 'TASKDOWN_EXTENSION_READY') {
      // Web app is ready, we can send extension capabilities
      window.postMessage({
        type: 'TASKDOWN_WEBAPP_READY',
        extensionVersion: chrome.runtime.getManifest().version,
        capabilities: ['decrement', 'reset', 'sync']
      }, window.location.origin);
    }
  });

  // Notify the web app that the extension is available
  window.postMessage({
    type: 'TASKDOWN_EXTENSION_LOADED',
    version: chrome.runtime.getManifest().version
  }, window.location.origin);

  // Inject a small indicator that extension is active (optional)
  function addIndicator() {
    if (!document.body) {
      // Body not ready yet, wait for it
      setTimeout(addIndicator, 100);
      return;
    }

    const indicator = document.createElement('div');
    indicator.id = 'taskdown-extension-indicator';
    indicator.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      width: 8px;
      height: 8px;
      background: #6965db;
      border-radius: 50%;
      z-index: 9999;
      opacity: 0.7;
      title: 'TaskDown extension active';
    `;
    document.body.appendChild(indicator);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      indicator.style.opacity = '0';
      setTimeout(() => indicator.remove(), 300);
    }, 3000);
  }

  // Add indicator with delay to ensure DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addIndicator);
  } else {
    setTimeout(addIndicator, 100);
  }
}