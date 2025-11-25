import { Injectable, inject } from '@angular/core';
import { Task } from '../models/task.model';
import { ToastService } from './toast.service';

declare const chrome: any;

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly TASKS_KEY = 'taskdown_local_tasks';
  private toastService = inject(ToastService);

  constructor() {
    this.setupExtensionMessageListener();
  }

  private setupExtensionMessageListener() {
    try {
      window.addEventListener('message', (event) => {
        if (!event || event.source !== window || !event.data) return;
        const msg = event.data;
        if (msg && msg.type === 'TASKDOWN_EXTENSION_STORAGE_CHANGED') {
          try {
            const newValue = msg.data;
            const json = typeof newValue === 'string' ? newValue : JSON.stringify(newValue || []);
            const current = localStorage.getItem(this.TASKS_KEY) || '';
            
              // Consider it from the extension when either origin is explicitly
              // 'extension' OR the content script saved a matching change id into
              // localStorage (see content.sync.js -> __TASKDOWN_EXTENSION_CHANGE).
              // This is robust against missing origin fields but avoids treating
              // every __changeId as extension-origin (it must match the marker).
              const marker = localStorage.getItem('__TASKDOWN_EXTENSION_CHANGE');
              const isFromExtension = (msg && msg.origin === 'extension') || (msg && msg.__changeId && marker === msg.__changeId);


            // If NOT from extension and data is identical, skip (it's an echo from web)
            if (!isFromExtension && current === json) {
              return;
            }

            // Update localStorage with latest value
            localStorage.setItem(this.TASKS_KEY, json);

            // If the change originated from the web (not extension), show a simple
            // success toast without action so the user gets confirmation but is
            // not prompted to refresh.
            if (!isFromExtension) {
              try {
                this.toastService.showToast({
                  type: 'success',
                  title: 'Guardado',
                  message: 'Los cambios se guardaron correctamente',
                  duration: 3000
                });
              } catch (err) {
              }
              return;
            }

            try {
              // Show a persistent toast with an action to refresh in-page
              this.toastService.showToast({
                type: 'info',
                title: 'Cambios desde la extensión',
                message: 'Se detectaron cambios en la extensión. Refresca la página para ver los últimos cambios.',
                // keep it until user acts
                duration: undefined,
                actionLabel: 'Refrescar ahora',
                action: () => {
                  // Request an in-page refresh; handled by dashboard (or any page) via message listener
                  window.postMessage({ type: 'TASKDOWN_REQUEST_REFRESH' }, '*');
                }
              });
            } catch (err) {
            }
            // Clear the last-extension-change marker so subsequent identical
            // storageChanged notifications won't be treated as new extension-origin
            // unless the content script writes a new matching __changeId.
            try {
              localStorage.removeItem('__TASKDOWN_EXTENSION_CHANGE');
            } catch (err) {
              // ignore
            }
          } catch (err) {
            console.error('Error handling TASKDOWN_EXTENSION_STORAGE_CHANGED message:', err);
          }
        }
      });
    } catch (err) {
    }
  }

  getLocalTasks(): Task[] {
    try {
      const tasksJson = localStorage.getItem(this.TASKS_KEY);
      if (!tasksJson) return [];

      const tasks = JSON.parse(tasksJson) as Task[];
      return tasks;
    } catch (error) {
      console.error('Error reading local tasks:', error);
      return [];
    }
  }

  saveLocalTasks(tasks: Task[]): void {
    try {
      const tasksJson = JSON.stringify(tasks);
      
      // Save to localStorage
      localStorage.setItem(this.TASKS_KEY, tasksJson);
      // Mark that the page initiated this save so we can ignore the resulting extension->page echo
      try {
        (window as any).__TASKDOWN_LAST_SAVE_TS = Date.now();
      } catch (err) {
        // ignore
      }
      
      // Notify the content script via window.postMessage (most reliable from page context)
      // The content script will then forward to the background
      try {
        window.postMessage({ type: 'TASKDOWN_SAVE_TASKS', tasks }, '*');
      } catch (err) {
      }
      
      // Also try direct chrome.runtime.sendMessage as fallback (if available)
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            action: 'saveTasks',
            tasks: tasks
          }, (response: any) => {
            if (chrome.runtime.lastError) {
            } else {
            }
          });
        }
      } catch (error) {
      }
      
    } catch (error) {
      console.error('Error saving local tasks:', error);
    }
  }

  addLocalTask(task: Task): void {
    const tasks = this.getLocalTasks();
    tasks.push(task);
    this.saveLocalTasks(tasks);
  }

  updateLocalTask(taskId: string, updates: Partial<Task>): void {
    const tasks = this.getLocalTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex !== -1) {
      tasks[taskIndex] = { ...tasks[taskIndex], ...updates, updated_at: new Date().toISOString() };
      this.saveLocalTasks(tasks);
    }
  }

  deleteLocalTask(taskId: string): void {
    const tasks = this.getLocalTasks();
    const filteredTasks = tasks.filter(t => t.id !== taskId);
    this.saveLocalTasks(filteredTasks);
  }

  clearLocalTasks(): void {
    localStorage.removeItem(this.TASKS_KEY);
    this.syncToChromeStorage(JSON.stringify([]));
  }

  hasLocalTasks(): boolean {
    return this.getLocalTasks().length > 0;
  }

  /**
   * Sync tasks to chrome.storage for extension integration
   * This allows changes in the web app to be reflected in the extension
   */
  private syncToChromeStorage(tasksJson: string): void {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Save to both sync and local storage
        chrome.storage.sync.set({ 'taskdown_local_tasks': tasksJson }, () => {
          if (chrome.runtime.lastError) {
            // Fallback to local storage
            chrome.storage.local.set({ 'taskdown_local_tasks': tasksJson });
          } else {
          }
        });
      }
    } catch (error) {
    }
  }
}