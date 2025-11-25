import { ChangeDetectionStrategy, Component, inject, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Task } from '../../../core/models/task.model';
import { TaskService } from '../../../core/services/task.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-task-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" *ngIf="isOpen()">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            {{ task() ? 'Editar Tarea' : 'Nueva Tarea' }}
          </h3>

          <form [formGroup]="taskForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700">
                Título *
              </label>
              <input
                type="text"
                id="title"
                formControlName="title"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ingresa el título de la tarea"
              />
              <div *ngIf="taskForm.get('title')?.invalid && taskForm.get('title')?.touched" class="mt-1 text-sm text-red-600">
                <span *ngIf="taskForm.get('title')?.errors?.['required']">El título es requerido</span>
                <span *ngIf="taskForm.get('title')?.errors?.['minlength']">El título debe tener al menos 1 carácter</span>
                <span *ngIf="taskForm.get('title')?.errors?.['maxlength']">El título no puede tener más de 100 caracteres</span>
              </div>
            </div>

            <div>
              <label for="description" class="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                id="description"
                formControlName="description"
                rows="3"
                maxlength="500"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Descripción opcional de la tarea"
              ></textarea>
              <div class="mt-1 text-xs text-gray-500 text-right">
                {{ taskForm.get('description')?.value?.length || 0 }}/500 caracteres
              </div>
              <div *ngIf="taskForm.get('description')?.invalid && taskForm.get('description')?.touched" class="mt-1 text-sm text-red-600">
                <span *ngIf="taskForm.get('description')?.errors?.['maxlength']">La descripción no puede tener más de 500 caracteres</span>
              </div>
            </div>

            <div>
              <label for="url" class="block text-sm font-medium text-gray-700">
                URL
              </label>
              <input
                type="url"
                id="url"
                formControlName="url"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://ejemplo.com"
              />
              <div *ngIf="taskForm.get('url')?.invalid && taskForm.get('url')?.touched" class="mt-1 text-sm text-red-600">
                <span *ngIf="taskForm.get('url')?.errors?.['pattern']">URL inválida (debe comenzar con http:// o https://)</span>
              </div>
            </div>

            <div>
              <label for="initialCount" class="block text-sm font-medium text-gray-700">
                Cantidad Inicial *
              </label>
              <input
                type="number"
                id="initialCount"
                formControlName="initialCount"
                min="1"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="1"
              />
              <div *ngIf="taskForm.get('initialCount')?.invalid && taskForm.get('initialCount')?.touched" class="mt-1 text-sm text-red-600">
                <span *ngIf="taskForm.get('initialCount')?.errors?.['required']">La cantidad inicial es requerida</span>
                <span *ngIf="taskForm.get('initialCount')?.errors?.['min']">Debe ser mayor a 0</span>
                <span *ngIf="taskForm.get('initialCount')?.errors?.['max']">No puede ser mayor a 10,000</span>
              </div>
            </div>

            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                (click)="onCancel()"
                class="px-4 py-2 bg-gray-300 text-gray-900 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="taskForm.invalid || isLoading() || (isCreatingNew() && atLimit)"
                class="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isLoading() ? 'Guardando...' : (task() ? 'Actualizar' : 'Crear') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormComponent {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private toastService = inject(ToastService);

  isOpen = input.required<boolean>();
  task = input<Task | null>(null);
  isLoading = input<boolean>(false);

  taskSaved = output<Task>();
  cancelled = output<void>();

  taskForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    url: ['', [Validators.pattern(/^https?:\/\/.+/)]],
    initialCount: [1, [Validators.required, Validators.min(1), Validators.max(10000)]],
  });

  // local limit handling
  atLimit = false;
  private localTaskLimit = environment.localTaskLimit || 200;

  constructor() {
    // Use effect to react to changes in the task signal
    effect(() => {
      const currentTask = this.task();
      if (currentTask) {
        // Populate form with task data when task changes
        this.taskForm.patchValue({
          title: currentTask.title || '',
          description: currentTask.description || '',
          url: currentTask.url || '',
          initialCount: currentTask.initial_count || 1,
        });
      } else {
        // Reset form when no task is selected (creating new task)
        this.taskForm.reset({
          title: '',
          description: '',
          url: '',
          initialCount: 1,
        });
      }
    });

    // Effect to reset form when modal closes
    effect(() => {
      const isCurrentlyOpen = this.isOpen();
      // When modal closes, reset the form for next time
      if (!isCurrentlyOpen) {
        this.taskForm.reset({
          title: '',
          description: '',
          url: '',
          initialCount: 1,
        });
      }
    });

    // update limit state initially
    this.updateLimitState();
  }

  isCreatingNew(): boolean {
    return !this.task();
  }

  private updateLimitState() {
    try {
      const raw = localStorage.getItem('taskdown_local_tasks');
      const arr = raw ? JSON.parse(raw) : [];
      const count = Array.isArray(arr) ? arr.length : 0;
      this.atLimit = count >= (this.localTaskLimit || 200);
    } catch (err) {
      this.atLimit = false;
    }
  }

  async onSubmit() {
    // refresh limit state before submit
    this.updateLimitState();

    if (this.taskForm.valid) {
      try {
        const formValue = this.taskForm.value;
        let savedTask: Task;

        if (this.task()) {
          // Update existing task
          savedTask = await this.taskService.updateTask(this.task()!.id, {
            title: formValue.title,
            description: formValue.description,
            url: formValue.url,
            initial_count: formValue.initialCount,
          });
        } else {
          // Create new task
          savedTask = await this.taskService.createTask({
            title: formValue.title,
            description: formValue.description,
            url: formValue.url,
            initial_count: formValue.initialCount,
            current_count: formValue.initialCount,
            completed: false,
          });
        }

        this.taskSaved.emit(savedTask);
        // Reset form after successful save
        this.taskForm.reset({
          title: '',
          description: '',
          url: '',
          initialCount: 1,
        });
      } catch (error: any) {
        console.error('Error saving task:', error);
        const msg = error?.message || 'No se pudo guardar la tarea. Verifica los datos e inténtalo de nuevo.';
        this.toastService.showError('Error al guardar tarea', msg);
      }
    }
  }

  onCancel() {
    this.cancelled.emit();
  }
}