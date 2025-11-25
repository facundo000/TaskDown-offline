import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TaskService } from '../../core/services/task.service';
import { LocalStorageService } from '../../core/services/local-storage.service';
import { Task } from '../../core/models/task.model';
import { HeaderComponent } from '../../shared/components/header/header';
import { TaskCardComponent } from './task-card/task-card';
import { TaskFormComponent } from '../task/task-form/task-form';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    HeaderComponent,
    TaskCardComponent,
    TaskFormComponent,
    ConfirmationDialogComponent,
    ToastContainerComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-header></app-header>

      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900">Mis Tareas</h2>
              <p class="mt-2 text-sm text-gray-600">Gestiona tus tareas de manera eficiente</p>
            </div>
            <button
              (click)="openTaskForm()"
              [disabled]="localTasksCount() >= localTaskLimit"
              class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Nueva Tarea
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" *ngIf="tasks().length > 0; else emptyState">
            @for (task of tasks(); track task.id) {
              <app-task-card
                [task]="task"
                [isLoading]="isTaskLoading(task.id)"
                (edit)="editTask(task)"
                (delete)="confirmDeleteTask(task)"
                (decrement)="decrementTask(task)"
                (resetToInitial)="resetTaskToInitial(task)"
                (resetToCustom)="resetTaskToCustom(task, $event)"
                (viewDetail)="viewTaskDetail(task)"
              />
            }
          </div>

          <ng-template #emptyState>
            <div class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No hay tareas</h3>
              <p class="mt-1 text-sm text-gray-500">Comienza creando tu primera tarea.</p>
              <div class="mt-6">
                <button
                  (click)="openTaskForm()"
                  [disabled]="localTasksCount() >= localTaskLimit"
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Crear primera tarea
                </button>
                @if (localTasksCount() >= localTaskLimit) {
                  <p class="mt-2 text-sm text-gray-500">
                    Has alcanzado el límite de {{ localTaskLimit }} tareas.
                  </p>
                }
              </div>
            </div>
          </ng-template>
        </div>
      </main>

      <!-- Task Form Modal -->
      <app-task-form
        [isOpen]="isTaskFormOpen()"
        [task]="editingTask()"
        [isLoading]="isLoading()"
        (taskSaved)="onTaskSaved($event)"
        (cancelled)="closeTaskForm()"
      ></app-task-form>

      <!-- Confirmation Dialog -->
      <app-confirmation-dialog
        [isOpen]="isDeleteDialogOpen()"
        title="Eliminar Tarea"
        message="¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        (confirm)="deleteTask()"
        (cancel)="cancelDelete()"
      ></app-confirmation-dialog>

      <!-- Toast Notifications -->
      <app-toast-container></app-toast-container>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  private taskService = inject(TaskService);
  private localStorageService = inject(LocalStorageService);
  private toastService = inject(ToastService);
  private router = inject(Router);


  tasks = signal<Task[]>([]);
  isTaskFormOpen = signal(false);
  isDeleteDialogOpen = signal(false);
  editingTask = signal<Task | null>(null);
  taskToDelete = signal<Task | null>(null);
  isLoading = signal(false);
  loadingTasks = signal<Set<string>>(new Set());
  localTasksCount = signal(0);
  // Expose configured local task limit to template
  localTaskLimit = environment.localTaskLimit || 200;
  private unsubscribeRealtime: (() => void) | null = null;
  private refreshMessageHandler = (event: MessageEvent) => {
    try {
      if (!event || event.source !== window || !event.data) return;
      const msg = event.data;
      if (msg && msg.type === 'TASKDOWN_REQUEST_REFRESH') {
        this.loadTasks();
        // Dismiss the extension reminder toast(s) that included the action button
        try {
          const currentToasts = this.toastService.toasts();
          currentToasts.forEach(t => {
            if (t.actionLabel === 'Refrescar ahora' || (t.title && t.title.includes('Cambios desde la extensión'))) {
              this.toastService.dismissToast(t.id);
            }
          });
        } catch (err) {
        }

        this.toastService.showSuccess('Actualizado', 'Se han cargado los cambios desde la extensión');
      }
    } catch (err) {
      console.error('Error handling TASKDOWN_REQUEST_REFRESH message:', err);
    }
  };


  async ngOnInit() {
    this.updateLocalTasksCount();
    await this.loadTasks();
    this.setupRealtimeUpdates();
    // Listen for explicit refresh requests from actionable toasts
    try {
      window.addEventListener('message', this.refreshMessageHandler);
    } catch (err) {
    }
  }

  ngOnDestroy() {
    if (this.unsubscribeRealtime) {
      this.unsubscribeRealtime();
    }
    try {
      window.removeEventListener('message', this.refreshMessageHandler);
    } catch (err) {
      // ignore
    }
  }

  private setupRealtimeUpdates() {
    this.unsubscribeRealtime = this.taskService.subscribeToTaskUpdates((updatedTask: Task) => {
      this.tasks.update(tasks =>
        tasks.map(task => task.id === updatedTask.id ? updatedTask : task)
      );
    });
  }

  async loadTasks() {
    try {
      const tasks = await this.taskService.getTasks();
      this.tasks.set(tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.toastService.showError(
        'Error al cargar tareas',
        'No se pudieron cargar tus tareas. Inténtalo de nuevo.'
      );
    }
  }


  openTaskForm() {
    this.editingTask.set(null);
    this.isTaskFormOpen.set(true);
  }

  editTask(task: Task) {
    this.editingTask.set(task);
    this.isTaskFormOpen.set(true);
  }

  closeTaskForm() {
    this.isTaskFormOpen.set(false);
    this.editingTask.set(null);
  }

  async onTaskSaved(savedTask: Task) {
    this.closeTaskForm();
    await this.loadTasks(); // Reload tasks to show changes
    this.updateLocalTasksCount(); // Update task counter
    this.toastService.showSuccess(
      'Tarea guardada',
      `La tarea "${savedTask.title}" se ha guardado correctamente.`
    );
  }

  confirmDeleteTask(task: Task) {
    this.taskToDelete.set(task);
    this.isDeleteDialogOpen.set(true);
  }

  async deleteTask() {
    const task = this.taskToDelete();
    if (!task) return;

    try {
      await this.taskService.deleteTask(task.id);
      this.tasks.update(tasks => tasks.filter(t => t.id !== task.id));
      this.isDeleteDialogOpen.set(false);
      this.taskToDelete.set(null);
      this.toastService.showSuccess(
        'Tarea eliminada',
        `La tarea "${task.title}" se ha eliminado correctamente.`
      );
    } catch (error) {
      console.error('Error deleting task:', error);
      this.toastService.showError(
        'Error al eliminar tarea',
        'No se pudo eliminar la tarea. Inténtalo de nuevo.'
      );
    }
  }

  cancelDelete() {
    this.isDeleteDialogOpen.set(false);
    this.taskToDelete.set(null);
  }

  isTaskLoading(taskId: string): boolean {
    return this.loadingTasks().has(taskId);
  }

  async decrementTask(task: Task) {
    this.loadingTasks.update(set => new Set(set).add(task.id));
    try {
      const updatedTask = await this.taskService.decrementTask(task.id);
      this.tasks.update(tasks =>
        tasks.map(t => t.id === task.id ? updatedTask : t)
      );

      if (updatedTask.completed) {
        this.toastService.showSuccess(
          '¡Tarea completada!',
          `Has completado "${task.title}". ¡Felicitaciones!`
        );
      }
    } catch (error) {
      console.error('Error decrementing task:', error);
      this.toastService.showError(
        'Error al decrementar tarea',
        'No se pudo actualizar la tarea. Inténtalo de nuevo.'
      );
    } finally {
      this.loadingTasks.update(set => {
        const newSet = new Set(set);
        newSet.delete(task.id);
        return newSet;
      });
    }
  }

  async resetTaskToInitial(task: Task) {
    this.loadingTasks.update(set => new Set(set).add(task.id));
    try {
      const updatedTask = await this.taskService.resetTask(task.id);
      this.tasks.update(tasks =>
        tasks.map(t => t.id === task.id ? updatedTask : t)
      );
      this.toastService.showInfo(
        'Tarea restablecida',
        `La tarea "${task.title}" se ha restablecido a su valor inicial.`
      );
    } catch (error) {
      console.error('Error resetting task:', error);
      this.toastService.showError(
        'Error al restablecer tarea',
        'No se pudo restablecer la tarea. Inténtalo de nuevo.'
      );
    } finally {
      this.loadingTasks.update(set => {
        const newSet = new Set(set);
        newSet.delete(task.id);
        return newSet;
      });
    }
  }

  async resetTaskToCustom(task: Task, value: number) {
    this.loadingTasks.update(set => new Set(set).add(task.id));
    try {
      const updatedTask = await this.taskService.resetTask(task.id, value);
      this.tasks.update(tasks =>
        tasks.map(t => t.id === task.id ? updatedTask : t)
      );
      this.toastService.showInfo(
        'Tarea restablecida',
        `La tarea "${task.title}" se ha restablecido al valor ${value}.`
      );
    } catch (error) {
      console.error('Error resetting task to custom value:', error);
      this.toastService.showError(
        'Error al restablecer tarea',
        'No se pudo restablecer la tarea. Inténtalo de nuevo.'
      );
    } finally {
      this.loadingTasks.update(set => {
        const newSet = new Set(set);
        newSet.delete(task.id);
        return newSet;
      });
    }
  }

  viewTaskDetail(task: Task) {
    this.router.navigate(['/task', task.id]);
  }



  private updateLocalTasksCount() {
    const localTasks = this.localStorageService.getLocalTasks();
    this.localTasksCount.set(localTasks.length);
  }
}
