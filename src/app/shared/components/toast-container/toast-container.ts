import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, effect, EffectRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastComponent, ToastMessage } from '../toast/toast';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [CommonModule, ToastComponent],
  template: `
    @for (toast of toasts(); track toast.id) {
      <app-toast
        [toast]="toast"
        [progress]="getProgress(toast)"
        (dismiss)="dismissToast(toast.id)"
      />
    }
  `,
  styles: [`
    :host {
      position: fixed;
      top: 0;
      right: 0;
      z-index: 1000;
      pointer-events: none;
    }

    :host > * {
      pointer-events: auto;
    }

    @keyframes toast-enter {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .animate-toast-enter {
      animation: toast-enter 0.3s ease-out;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  private toastService = inject(ToastService);

  toasts = this.toastService.toasts;
  private progressIntervals = new Map<string, number>();
  private _toastsEffectDisposer: EffectRef | null = null;

  ngOnInit() {
    console.log('ToastContainerComponent initialized, current toasts:', this.toasts());
    // Debug: react to changes in the toasts signal and log them
    try {
      this._toastsEffectDisposer = effect(() => {
        const current = this.toasts();
        console.log('ToastContainer: toasts signal changed, count=', current.length, current);
        // start progress tracking for any auto-dismiss toasts that appear after init
        current.forEach(toast => {
          if (toast.duration && !this.progressIntervals.has(toast.id)) {
            this.startProgressTracking(toast);
          }
        });
      });
    } catch (err) {
      console.debug('Could not create effect for toasts debugging:', err);
    }
    // Start progress tracking for auto-dismissing toasts
    this.toasts().forEach(toast => {
      if (toast.duration) {
        this.startProgressTracking(toast);
      }
    });
  }

  ngOnDestroy() {
    // Clear all progress intervals
    this.progressIntervals.forEach(interval => clearInterval(interval));
    this.progressIntervals.clear();
    try {
      if (this._toastsEffectDisposer) {
        this._toastsEffectDisposer.destroy();
        this._toastsEffectDisposer = null;
      }
    } catch (err) {
      // ignore
    }
  }

  dismissToast(toastId: string) {
    this.toastService.dismissToast(toastId);
    this.clearProgressTracking(toastId);
  }

  private startProgressTracking(toast: ToastMessage) {
    if (!toast.duration) return;

    const startTime = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, toast.duration! - elapsed);

      if (remaining <= 0) {
        this.dismissToast(toast.id);
      }
    }, 100);

    this.progressIntervals.set(toast.id, interval);
  }

  private clearProgressTracking(toastId: string) {
    const interval = this.progressIntervals.get(toastId);
    if (interval) {
      clearInterval(interval);
      this.progressIntervals.delete(toastId);
    }
  }

  getProgress(toast: ToastMessage): number {
    if (!toast.duration) return 100;

    const interval = this.progressIntervals.get(toast.id);
    if (!interval) return 100;

    // Calculate progress based on remaining time
    // This is a simplified version - in a real implementation,
    // you'd track the start time and calculate remaining percentage
    return 100; // Placeholder - implement proper progress calculation
  }
}