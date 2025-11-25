import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  // Optional action shown as a button on the toast
  actionLabel?: string;
  action?: () => void;
}

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  template: `
    <div
      class="fixed top-4 right-4 z-50 max-w-sm w-full"
      [class]="getPositionClasses()"
    >
      <div
        class="bg-white border rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out"
        [class]="getToastClasses()"
      >
        <div class="flex items-start">
          <div class="shrink-0">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center"
              [class]="getIconClasses()"
            >
              <span class="text-sm font-medium">{{ getIcon() }}</span>
            </div>
          </div>

          <div class="ml-3 flex-1">
            <h4 class="text-sm font-medium text-gray-900">
              {{ toast().title }}
            </h4>
            @if (toast().message) {
              <p class="mt-1 text-sm text-gray-600">
                {{ toast().message }}
              </p>
            }
          </div>

          <div class="ml-4 shrink-0 flex">
            <button
              (click)="dismiss.emit(toast().id)"
              class="inline-flex text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Progress bar for auto-dismiss -->
        @if (toast().duration) {
          <div class="mt-3 bg-gray-200 rounded-full h-1">
            <div
              class="bg-current h-1 rounded-full transition-all duration-100 ease-linear"
              [style.width.%]="progress()"
            ></div>
          </div>
        }
        
        <!-- Action button -->
        @if (toast().actionLabel) {
          <div class="mt-3 text-right">
            <button
              (click)="invokeAction()"
              class="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm"
            >
              {{ toast().actionLabel }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .toast-enter {
      transform: translateX(100%);
      opacity: 0;
    }

    .toast-enter-active {
      transform: translateX(0);
      opacity: 1;
    }

    .toast-exit {
      transform: translateX(0);
      opacity: 1;
    }

    .toast-exit-active {
      transform: translateX(100%);
      opacity: 0;
    }

    .toast-success {
      border-color: #10b981;
      background-color: #f0fdf4;
    }

    .toast-error {
      border-color: #ef4444;
      background-color: #fef2f2;
    }

    .toast-warning {
      border-color: #f59e0b;
      background-color: #fffbeb;
    }

    .toast-info {
      border-color: #3b82f6;
      background-color: #eff6ff;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  toast = input.required<ToastMessage>();
  progress = input<number>(100);

  dismiss = output<string>();

  invokeAction() {
    const fn = this.toast().action;
    if (typeof fn === 'function') {
      try {
        fn();
      } catch (err) {
        console.error('Error invoking toast action:', err);
      }
    }
  }

  getPositionClasses(): string {
    // Ensure toast is visible by default; animations previously kept it off-screen
    return 'translate-x-0 opacity-100';
  }

  getToastClasses(): string {
    const baseClasses = 'border-l-4';
    const typeClass = `toast-${this.toast().type}`;
    return `${baseClasses} ${typeClass}`;
  }

  getIconClasses(): string {
    const type = this.toast().type;
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-600';
      case 'error':
        return 'bg-red-100 text-red-600';
      case 'warning':
        return 'bg-yellow-100 text-yellow-600';
      case 'info':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  getIcon(): string {
    const type = this.toast().type;
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  }
}