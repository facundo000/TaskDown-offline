import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChromeSyncService } from './core/services/chrome-sync.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('task-down');
  // Inject ChromeSyncService to ensure it runs on app startup and syncs the local limit
  private readonly _chromeSync = inject(ChromeSyncService);

  ngOnInit() {
    // Sync button has been removed from auto-init to avoid unused UI.
    // If you need manual sync integration for debugging, instantiate
    // `SyncButtonComponent` from a development-only entry point.
  }
}

