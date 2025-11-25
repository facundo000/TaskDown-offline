import { ChangeDetectionStrategy, Component, input, output, signal, inject, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Task } from '../../../core/models/task.model';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-task-card',
  imports: [FormsModule, ProgressBarComponent],
  template: `
    <div class="bg-white rounded-lg shadow-md p-4 sm:p-6 border-2 border-gray-200 hover:border-indigo-300 transition-colors">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">
          {{ task().title }}
        </h3>
        <div class="flex space-x-1 sm:space-x-2">
          <button
            (click)="viewDetail.emit()"
            class="text-gray-400 hover:text-indigo-600 p-2 sm:p-1 touch-manipulation"
            title="Ver detalles"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
          </button>
          <button
            (click)="edit.emit()"
            class="text-gray-400 hover:text-indigo-600 p-2 sm:p-1 touch-manipulation"
            title="Editar tarea"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
          <button
            (click)="delete.emit()"
            class="text-gray-400 hover:text-red-600 p-2 sm:p-1 touch-manipulation"
            title="Eliminar tarea"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>

      @if (task().description) {
        <div class="mb-4">
          <p class="text-gray-600 text-sm line-clamp-3">
            {{ task().description }}
          </p>
        </div>
      }

      @if (task().url) {
        <div class="mb-4">
          <a
            [href]="task().url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-indigo-600 hover:text-indigo-800 text-sm underline break-all"
          >
            {{ task().url }}
          </a>
        </div>
      }

      <div class="mb-4">
        <app-progress-bar
          [currentValue]="task().current_count"
          [maxValue]="task().initial_count"
        ></app-progress-bar>
      </div>

      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <button
            (click)="decrement.emit()"
            [disabled]="task().current_count <= 0 || isLoading()"
            class="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation min-h-[44px]"
          >
            @if (!isLoading()) {
              <span>-1</span>
            } @else {
              <span class="animate-spin">⟳</span>
            }
          </button>

          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900">
              {{ task().current_count }}
            </div>
            <div class="text-xs text-gray-500">
              {{ task().completed ? 'Completada' : 'Pendiente' }}
            </div>
          </div>

          <button
            (click)="resetToInitial.emit()"
            [disabled]="isLoading()"
            class="px-3 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 touch-manipulation min-h-[44px]"
            title="Restablecer al valor inicial"
          >
            ↻
          </button>
        </div>

        <div class="flex space-x-2">
          <input
            type="number"
            [(ngModel)]="customResetValue"
            [disabled]="isLoading()"
            min="0"
            placeholder="Valor numérico"
            class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 touch-manipulation min-h-[44px]"
          />
          <button
            (click)="resetToCustom.emit(customResetValue!)"
            [disabled]="!customResetValue || customResetValue < 0 || isLoading()"
            class="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[44px]"
            title="Restablecer a valor personalizado"
          >
            ✓
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
  private router = inject(Router);

  task = input.required<Task>();
  isLoading = input<boolean>(false);

  edit = output<void>();
  delete = output<void>();
  decrement = output<void>();
  resetToInitial = output<void>();
  resetToCustom = output<number>();
  viewDetail = output<void>();

  customResetValue: number | null = null;
  private previousCount = 0;

  constructor() {
    effect(() => {
      const currentTask = this.task();
      const currentCount = currentTask.current_count;

      if (this.previousCount > 0 && currentCount === 0 && currentTask.completed) {
        this.triggerConfetti();
      }

      this.previousCount = currentCount;
    });
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
    const task = this.task();
    if (task.initial_count === 0) return 0;
    const percentage = ((task.initial_count - task.current_count) / task.initial_count) * 100;
    return Math.min(100, Math.max(0, percentage));
  }
}