import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'task/:id',
    loadComponent: () => import('./features/task/task-detail/task-detail').then(m => m.TaskDetailComponent),
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
