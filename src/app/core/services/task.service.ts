import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { LocalStorageService } from './local-storage.service';
import { Task } from '../models/task.model';
import { HistoryEntry } from '../models/history.model';
import { Observable, from, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private localStorageService = inject(LocalStorageService);

  constructor() { }


  private generateLocalTaskId(): string {
    return 'local_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async getTasks(): Promise<Task[]> {
    return this.localStorageService.getLocalTasks();
  }

  async getTaskById(id: string): Promise<Task | null> {
    // Get task from localStorage
    const tasks = this.localStorageService.getLocalTasks();
    return tasks.find(t => t.id === id) || null;
  }

  async createTask(task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Task> {

    // Check local tasks limit (configurable via environment.localTaskLimit)
    const localTasks = this.localStorageService.getLocalTasks();
    const limit = environment.localTaskLimit || 50;
    if (localTasks.length >= limit) {
      throw new Error(`Has alcanzado el límite de ${limit} tareas para usuarios no registrados. Regístrate para crear más tareas.`);
    }

    // Create task in localStorage
    const now = new Date().toISOString();
    const localTask: Task = {
      ...task,
      id: this.generateLocalTaskId(),
      user_id: 'local_user', // Placeholder for local tasks
      created_at: now,
      updated_at: now
    };

    this.localStorageService.addLocalTask(localTask);
    return localTask;
  }

  async updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Task> {
    // Update task in localStorage
    this.localStorageService.updateLocalTask(id, updates);
    const tasks = this.localStorageService.getLocalTasks();
    const updatedTask = tasks.find(t => t.id === id);
    if (!updatedTask) throw new Error('Task not found');
    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    // Delete task from localStorage
    this.localStorageService.deleteLocalTask(id);
  }

  async decrementTask(id: string): Promise<Task> {
    // Decrement task in localStorage
    const tasks = this.localStorageService.getLocalTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');

    if (task.current_count <= 0) throw new Error('Task already completed');

    const newCount = task.current_count - 1;
    const completed = newCount === 0;

    this.localStorageService.updateLocalTask(id, {
      current_count: newCount,
      completed
    });

    return { ...task, current_count: newCount, completed };
  }

  async resetTask(id: string, value?: number): Promise<Task> {
    // Reset task in localStorage
    const tasks = this.localStorageService.getLocalTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');

    const newValue = value !== undefined ? value : task.initial_count;
    if (newValue < 0) throw new Error('Value cannot be negative');

    const completed = newValue === 0;

    // If custom value, update both initial_count (new goal) and current_count (reset progress)
    // If regular reset, just reset current_count to initial_count
    const updatePayload = value !== undefined
      ? { initial_count: newValue, current_count: newValue, completed }
      : { current_count: newValue, completed };

    this.localStorageService.updateLocalTask(id, updatePayload);

    return { ...task, ...updatePayload };
  }


  hasLocalTasks(): boolean {
    return this.localStorageService.hasLocalTasks();
  }

  subscribeToTaskUpdates(callback: (task: Task) => void): () => void {
    // Return a no-op unsubscribe function since we're not using realtime updates
    return () => { };
  }
}
