import { Injectable, signal } from '@angular/core';
import { ToastMessage } from '../../shared/components/toast/toast';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private _toasts = signal<ToastMessage[]>([]);

  get toasts() {
    return this._toasts.asReadonly();
  }

  showToast(toast: Omit<ToastMessage, 'id'>) {
    const id = this.generateId();
    const toastWithId: ToastMessage = { ...toast, id };

    console.log('ToastService.showToast called:', toastWithId);
    this._toasts.update(toasts => [...toasts, toastWithId]);

    // Auto-dismiss if duration is specified
    if (toast.duration) {
      setTimeout(() => {
        this.dismissToast(id);
      }, toast.duration);
    }

    return id;
  }

  dismissToast(toastId: string) {
    console.log('ToastService.dismissToast called:', toastId);
    this._toasts.update(toasts => toasts.filter(toast => toast.id !== toastId));
  }

  clearAllToasts() {
    this._toasts.set([]);
  }

  // Convenience methods
  showSuccess(title: string, message?: string, duration = 5000) {
    return this.showToast({ type: 'success', title, message, duration });
  }

  showError(title: string, message?: string, duration = 7000) {
    return this.showToast({ type: 'error', title, message, duration });
  }

  showWarning(title: string, message?: string, duration = 6000) {
    return this.showToast({ type: 'warning', title, message, duration });
  }

  showInfo(title: string, message?: string, duration = 5000) {
    return this.showToast({ type: 'info', title, message, duration });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}