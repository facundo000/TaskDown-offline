import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HistoryEntry } from '../../../core/models/history.model';
import { TimeAgoPipe } from '../../../shared/components/pipes/time-ago.pipe';

@Component({
  selector: 'app-task-history',
  imports: [TimeAgoPipe],
  template: `
    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Historial de Acciones</h3>

      @if (history().length > 0) {
        <div class="space-y-3">
          @for (entry of history(); track entry.id) {
            <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div class="flex-shrink-0">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center"
                  [class]="getActionIconClass(entry.action)"
                >
                  <span class="text-sm font-medium">{{ getActionIcon(entry.action) }}</span>
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">
                  {{ getActionText(entry.action) }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ entry.created_at | appTimeAgo }}
                </p>
              </div>

              <div class="flex-shrink-0 text-right">
                <div class="text-sm font-medium text-gray-900">
                  {{ entry.new_value }}
                </div>
                <div class="text-xs text-gray-500">
                  Antes: {{ entry.previous_value }}
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">Sin historial</h3>
          <p class="mt-1 text-sm text-gray-500">Las acciones aparecerán aquí cuando interactúes con la tarea.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .bg-decrement {
      background-color: #fee2e2;
      color: #dc2626;
    }
    .bg-reset {
      background-color: #dbeafe;
      color: #2563eb;
    }
    .bg-custom-reset {
      background-color: #dcfce7;
      color: #16a34a;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskHistoryComponent {
  history = input.required<HistoryEntry[]>();

  getActionIcon(action: string): string {
    switch (action) {
      case 'decrement':
        return '−';
      case 'reset':
        return '↻';
      case 'custom_reset':
        return '✓';
      default:
        return '?';
    }
  }

  getActionIconClass(action: string): string {
    switch (action) {
      case 'decrement':
        return 'bg-red-100 text-red-600';
      case 'reset':
        return 'bg-blue-100 text-blue-600';
      case 'custom_reset':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  getActionText(action: string): string {
    switch (action) {
      case 'decrement':
        return 'Contador decrementado';
      case 'reset':
        return 'Reiniciado al valor inicial';
      case 'custom_reset':
        return 'Reiniciado a valor personalizado';
      default:
        return 'Acción desconocida';
    }
  }
}