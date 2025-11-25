import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  imports: [CommonModule],
  template: `
    <div class="progress-container">
      <div class="progress-bar-background">
        <div
          class="progress-bar-fill"
          [style.width.%]="progressPercentage()"
          [class.completed]="isCompleted()"
        ></div>
      </div>
      <div class="progress-text">
        <span class="progress-percentage">{{ progressPercentage() | number:'1.0-0' }}%</span>
        <span class="progress-values">{{ currentValue() }} / {{ maxValue() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .progress-container {
      width: 100%;
    }

    .progress-bar-background {
      width: 100%;
      height: 12px;
      background-color: #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
      position: relative;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #6965db 0%, #ffc58b 100%);
      border-radius: 6px;
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }

    .progress-bar-fill.completed {
      background: linear-gradient(90deg, #7bc863 0%, #5aa34c 100%);
      animation: pulse 0.6s ease-in-out;
    }

    .progress-bar-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.3) 50%,
        transparent 100%
      );
      animation: shimmer 2s infinite;
    }

    .progress-text {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      font-size: 14px;
      color: #6b7280;
    }

    .progress-percentage {
      font-weight: 600;
      color: #374151;
    }

    .progress-values {
      font-size: 12px;
      color: #9ca3af;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.8;
      }
    }

    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent {
  currentValue = input.required<number>();
  maxValue = input.required<number>();
  showPercentage = input<boolean>(true);
  showValues = input<boolean>(true);

  progressPercentage = computed(() => {
    const current = this.currentValue();
    const max = this.maxValue();
    if (max === 0) return 0;
    return Math.min(100, Math.max(0, ((max - current) / max) * 100));
  });

  isCompleted = computed(() => {
    return this.currentValue() === 0;
  });
}