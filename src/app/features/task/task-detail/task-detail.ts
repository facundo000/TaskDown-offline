import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Task } from '../../../core/models/task.model';
import { TaskService } from '../../../core/services/task.service';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar';
import { HeaderComponent } from '../../../shared/components/header/header';
import { TaskFormComponent } from '../task-form/task-form';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe, CommonModule } from '@angular/common';
import confetti from 'canvas-confetti';
import { ToastContainerComponent } from '../../../shared/components/toast-container/toast-container';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-task-detail',
  imports: [
    FormsModule,
    DecimalPipe,
    DatePipe,
    CommonModule,
    HeaderComponent,
    ProgressBarComponent,
    TaskFormComponent,
    ToastContainerComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-header></app-header>

      <main class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <!-- Back button -->
          <button
            (click)="goBack()"
            class="mb-6 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg class="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Volver al Dashboard
          </button>

          @if (task()) {
            <div class="bg-white shadow rounded-lg overflow-hidden">
              <div class="px-6 py-8">
                <!-- Task Header -->
                <div class="mb-8">
                  <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ task()!.title }}</h1>
                  <div class="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Creada: {{ task()!.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                    @if (task()!.completed) {
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completada
                      </span>
                    } @else {
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        En progreso
                      </span>
                    }
                  </div>
                </div>

                <!-- Description -->
                @if (task()!.description) {
                  <div class="mb-8">
                    <h2 class="text-lg font-semibold text-gray-900 mb-3">Descripción</h2>
                    <p class="text-gray-700 whitespace-pre-wrap">{{ task()!.description }}</p>
                  </div>
                }

                <!-- URL -->
                @if (task()!.url) {
                  <div class="mb-8">
                    <h2 class="text-lg font-semibold text-gray-900 mb-3">Enlace</h2>
                    
                    <a
                      [href]="task()!.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                    >
                      <svg class="-ml-1 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clip-rule="evenodd"></path>
                        <path fill-rule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clip-rule="evenodd"></path>
                      </svg>
                      Abrir enlace
                    </a>
                  </div>
                }

                <!-- Progress Section -->
                <div class="mb-8">
                  <h2 class="text-lg font-semibold text-gray-900 mb-4">Progreso</h2>
                  <div class="bg-gray-50 rounded-lg p-6">
                    <app-progress-bar
                      [currentValue]="task()!.current_count"
                      [maxValue]="task()!.initial_count"
                      class="mb-4"
                    ></app-progress-bar>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div class="text-center">
                        <div class="text-3xl font-bold text-gray-900">{{ task()!.current_count }}</div>
                        <div class="text-sm text-gray-500">Valor actual</div>
                      </div>
                      <div class="text-center">
                        <div class="text-3xl font-bold text-indigo-600">{{ task()!.initial_count }}</div>
                        <div class="text-sm text-gray-500">Valor inicial</div>
                      </div>
                      <div class="text-center">
                        <div class="text-3xl font-bold text-green-600">
                          {{ getProgressPercentage() | number:'1.0-0' }}%
                        </div>
                        <div class="text-sm text-gray-500">Completado</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="mb-8">
                  <h2 class="text-lg font-semibold text-gray-900 mb-4">Acciones</h2>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      (click)="decrementTask()"
                      [disabled]="task()!.current_count <= 0 || isLoading()"
                      class="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      @if (!isLoading()) {
                        <span>−1</span>
                      } @else {
                        <span class="animate-spin">⟳</span>
                      }
                      <span class="ml-2">Decrementar</span>
                    </button>

                    <div class="space-y-2">
                      <input
                        type="number"
                        [(ngModel)]="customDecrementValue"
                        [disabled]="isLoading()"
                        [max]="task()!.current_count - 1"
                        min="0"
                        placeholder="Decrementar a valor (ej: 5)"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                        (click)="decrementToCustom()"
                        [disabled]="!isValidCustomDecrement() || isLoading()"
                        class="w-full flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        @if (!isLoading()) {
                          <span>↓</span>
                        } @else {
                          <span class="animate-spin">⟳</span>
                        }
                        <span class="ml-2">Decrementar a valor</span>
                      </button>
                    </div>

                    <div class="space-y-2">
                      <input
                        type="number"
                        [(ngModel)]="customResetValue"
                        [disabled]="isLoading()"
                        min="0"
                        placeholder="Valor personalizado"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                        (click)="resetToCustom()"
                        [disabled]="!customResetValue || customResetValue < 0 || isLoading()"
                        class="w-full flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        @if (!isLoading()) {
                          <span>✓</span>
                        } @else {
                          <span class="animate-spin">⟳</span>
                        }
                        <span class="ml-2">Restablecer a valor</span>
                      </button>
                    </div>

                    <button
                      (click)="resetToInitial()"
                      [disabled]="isLoading()"
                      class="flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
                    >
                      @if (!isLoading()) {
                        <span>↻</span>
                      } @else {
                        <span class="animate-spin">⟳</span>
                      }
                      <span class="ml-2">Restablecer al inicial</span>
                    </button>

                    <button
                      (click)="openEditModal()"
                      class="flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      Editar tarea
                    </button>
                  </div>
                </div>
              </div>
            </div>
          } @else {
            <div class="bg-white shadow rounded-lg overflow-hidden">
              <div class="px-6 py-8 text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p class="text-gray-500">Cargando tarea...</p>
              </div>
            </div>
          }
        </div>
      </main>
      
      <!-- Edit Task Modal -->
      <app-task-form
        [isOpen]="isEditModalOpen()"
        [task]="task()"
        [isLoading]="isLoading()"
        (taskSaved)="onTaskUpdated($event)"
        (cancelled)="closeEditModal()"
      ></app-task-form>
      
      <app-toast-container></app-toast-container>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);
  private localStorageService = inject(LocalStorageService);
  private toastService = inject(ToastService);

  task = signal<Task | null>(null);
  isLoading = signal(false);
  isEditModalOpen = signal(false);
  customResetValue: number | null = null;
  customDecrementValue: number | null = null;
  private previousCount = 0;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTask(id);
    }
  }

  private async loadTask(id: string) {
    try {
      const task = await this.taskService.getTaskById(id);
      if (task) {
        this.task.set(task);
        this.previousCount = task.current_count;
      }
    } catch (error) {
      console.error('Error loading task:', error);
    }
  }



  goBack() {
    this.router.navigate(['/dashboard']);
  }

  openEditModal() {
    this.isEditModalOpen.set(true);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
  }

  async onTaskUpdated(updatedTask: Task) {
    this.task.set(updatedTask);
    this.closeEditModal();
    this.toastService.showSuccess(
      'Tarea actualizada',
      `La tarea "${updatedTask.title}" se ha actualizado correctamente.`
    );
  }

  async decrementTask() {
    const currentTask = this.task();
    if (!currentTask || currentTask.current_count <= 0) return;

    this.isLoading.set(true);
    try {
      const updatedTask = await this.taskService.decrementTask(currentTask.id);
      this.task.set(updatedTask);
      this.checkForCompletion(updatedTask);
    } catch (error) {
      console.error('Error decrementing task:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async resetToInitial() {
    const currentTask = this.task();
    if (!currentTask) return;

    this.isLoading.set(true);
    try {
      const updatedTask = await this.taskService.resetTask(currentTask.id);
      this.task.set(updatedTask);
    } catch (error) {
      console.error('Error resetting task:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async resetToCustom() {
    const currentTask = this.task();
    if (!currentTask || !this.customResetValue || this.customResetValue < 0) return;

    this.isLoading.set(true);
    try {
      const updatedTask = await this.taskService.resetTask(currentTask.id, this.customResetValue);
      this.task.set(updatedTask);
      this.customResetValue = null;
      this.toastService.showSuccess(
        'Tarea restablecida',
        `La tarea se ha restablecido al valor ${updatedTask.current_count}.`
      );
    } catch (error) {
      console.error('Error resetting task to custom value:', error);
      this.toastService.showError(
        'Error',
        'No se pudo restablecer la tarea. Inténtalo de nuevo.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  isValidCustomDecrement(): boolean {
    const currentTask = this.task();
    if (!currentTask || this.customDecrementValue === null || this.customDecrementValue === undefined) return false;

    // Must be 0 or greater
    if (this.customDecrementValue < 0) return false;

    // Must be less than current count (to actually decrement)
    if (this.customDecrementValue >= currentTask.current_count) return false;

    return true;
  }

  async decrementToCustom() {
    const currentTask = this.task();
    if (!currentTask || !this.isValidCustomDecrement()) return;

    this.isLoading.set(true);
    try {
      // Set current_count to the target value WITHOUT changing initial_count
      const targetValue = this.customDecrementValue!;
      const completed = targetValue === 0;

      // Use updateTask to only change current_count, not initial_count
      const updatedTask = await this.taskService.updateTask(currentTask.id, {
        current_count: targetValue,
        completed
      });

      this.task.set(updatedTask);
      this.checkForCompletion(updatedTask);

      this.toastService.showSuccess(
        'Tarea actualizada',
        `La tarea se ha establecido a ${updatedTask.current_count} de ${updatedTask.initial_count}.`
      );

      this.customDecrementValue = null;
    } catch (error) {
      console.error('Error decrementing task to custom value:', error);
      this.toastService.showError(
        'Error',
        'No se pudo actualizar la tarea. Inténtalo de nuevo.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private checkForCompletion(updatedTask: Task) {
    if (this.previousCount > 0 && updatedTask.current_count === 0 && updatedTask.completed) {
      this.triggerConfetti();
    }
    this.previousCount = updatedTask.current_count;
  }

  private triggerConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        particleCount,
        startVelocity: randomInRange(50, 100),
        spread: randomInRange(50, 70),
        origin: {
          x: randomInRange(0.1, 0.3),
          y: Math.random() - 0.2
        }
      });

      confetti({
        particleCount,
        startVelocity: randomInRange(50, 100),
        spread: randomInRange(50, 70),
        origin: {
          x: randomInRange(0.7, 0.9),
          y: Math.random() - 0.2
        }
      });
    }, 250);
  }

  getProgressPercentage(): number {
    const currentTask = this.task();
    if (!currentTask || currentTask.initial_count === 0) return 0;
    return ((currentTask.initial_count - currentTask.current_count) / currentTask.initial_count) * 100;
  }


}