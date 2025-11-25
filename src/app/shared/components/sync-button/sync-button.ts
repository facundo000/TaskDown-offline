/**
 * Sync Button Component for TaskDown Web App
 * Provides manual synchronization with extension tasks
 */

declare const chrome: any;

export class SyncButtonComponent {
  container: HTMLElement;
  element: HTMLButtonElement | null = null;
  isLoading: boolean = false;

  constructor(container: HTMLElement | null = null) {
    this.container = container || document.body;
    this.init();
  }

  init(): void {
    // Create sync button element
    this.element = document.createElement('button');
    if (!this.element) return;
    
    this.element.id = 'taskdown-sync-btn';
    this.element.className = 'taskdown-sync-btn';
    this.element.title = 'Refrescar página';
    this.element.innerHTML = '🔄';
    
    // Add styles
    this.element.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #6965db;
      color: white;
      border: none;
      cursor: pointer;
      font-size: 20px;
      display: flex !important;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
      font-weight: 600;
    `;

    // Add hover effects
    this.element.addEventListener('mouseenter', () => {
      if (this.element && !this.isLoading) {
        this.element.style.transform = 'scale(1.1)';
        this.element.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      }
    });

    this.element.addEventListener('mouseleave', () => {
      if (!this.isLoading && this.element) {
        this.element.style.transform = 'scale(1)';
        this.element.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      }
    });

    // Click handler
    this.element.addEventListener('click', () => this.sync());

    // Append to container - ensure it's visible
    this.container.appendChild(this.element);
    
    
    // Verify button is visible
    setTimeout(() => {
      const computedStyle = window.getComputedStyle(this.element!);
    }, 100);
  }

  sync(): void {
    if (this.isLoading || !this.element) return;

    this.isLoading = true;

    // Show loading state
    this.element.style.animation = 'spin 1s linear infinite';
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    if (!document.querySelector('style[data-sync-animation]')) {
      style.setAttribute('data-sync-animation', 'true');
      document.head.appendChild(style);
    }

    // Simply reload the page after a short delay for visual feedback
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  completedSync(): void {
    if (!this.element) return;
    
    this.isLoading = false;
    this.element.style.animation = 'none';
    this.element.style.transform = 'scale(1)';
    
    // Show success feedback
    const originalContent = this.element.innerHTML;
    this.element.innerHTML = '✓';
    this.element.style.background = '#28a745';
    
    setTimeout(() => {
      if (this.element) {
        this.element.innerHTML = originalContent;
        this.element.style.background = '#6965db';
      }
    }, 1500);
    
  }

  remove(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

// Note: This component is no longer auto-initialized. If you need to
// instantiate it manually for debugging, import and create `SyncButtonComponent`
// from the desired entry point. Automatic creation was removed to avoid
// unused UI in production builds.
