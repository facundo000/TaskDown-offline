import { Injectable, signal, inject } from '@angular/core';
import { Task } from '../models/task.model';
import { LocalStorageService } from './local-storage.service';
import { environment } from '../../../environments/environment';

declare const chrome: any;

@Injectable({
  providedIn: 'root'
})
export class ChromeSyncService {
  // Signal to notify components of changes from extension
  tasksChanged = signal<Task[]>([]);
  // Debounce timer to avoid rapid successive emits
  private debounceTimer: any = null;
  private readonly debounceMs = 300;
  
  constructor(private localStorageService: LocalStorageService) {
    this.initializeChromeStorageListener();
    // Sync the configured local task limit to the extension on app init
    this.syncLocalLimitToExtension();
  }

  /**
   * Sync the configured local task limit from environment to extension storage
   * This allows the extension popup to display the correct limit when the user
   * changes environment.localTaskLimit and rebuilds the app
   */
  private syncLocalLimitToExtension(): void {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        return;
      }

      const limit = environment.localTaskLimit || 200;

      // Send message to extension via window.postMessage to content script
      // The content script will forward it to the background service worker
      try {
        window.postMessage({ type: 'TASKDOWN_SET_LOCAL_LIMIT', value: limit }, '*');
      } catch (err) {
        // Fallback: try direct chrome.storage write if we're in an extension context
        this.directSetLimitInStorage(limit);
      }
    } catch (error) {
    }
  }

  /**
   * Direct write to chrome.storage (fallback if postMessage doesn't work)
   */
  private directSetLimitInStorage(limit: number): void {
    try {
      if (chrome && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ taskdown_local_limit: limit }, () => {
          if (chrome.runtime.lastError) {
            // Try local fallback
            chrome.storage.local.set({ taskdown_local_limit: limit }, () => {
            });
          } else {
          }
        });
      }
    } catch (err) {
    }
  }

  /**
   * Listen for changes in chrome.storage from the extension
   * When extension makes changes, they will be reflected in this signal
   */
  private initializeChromeStorageListener(): void {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        return;
      }

      // Listen for storage changes from the extension
      chrome.storage.onChanged.addListener((changes: any, areaName: string) => {
        
        if ((areaName === 'sync' || areaName === 'local') && changes['taskdown_local_tasks']) {
          
          try {
            const newValue = changes['taskdown_local_tasks'].newValue;
            let tasks: Task[] = [];
            
            // Parse the new value
            if (typeof newValue === 'string') {
              tasks = JSON.parse(newValue || '[]');
            } else if (Array.isArray(newValue)) {
              tasks = newValue;
            }
            
            // Update localStorage
            localStorage.setItem('taskdown_local_tasks', JSON.stringify(tasks));

            // Debounce notifications to subscribers to avoid rapid reloads
            if (this.debounceTimer) {
              clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = setTimeout(() => {
              this.tasksChanged.set(tasks);
              this.debounceTimer = null;
            }, this.debounceMs);
          } catch (error) {
            console.error('Error processing chrome.storage change:', error);
          }
        }
      });
      
    } catch (error) {
    }
  }
}
