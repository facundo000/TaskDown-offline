# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at localhost:4200
npm run build      # Production build → dist/task-down/
npm run watch      # Build in watch mode
npm test           # Run unit tests via Karma/Jasmine
```

No lint script is configured. TypeScript strict mode is enforced at compile time.

## Architecture

**TaskDown** is an offline-first Angular 20 task-counter app with a companion Chrome extension (Manifest V3). There is no backend — all data lives in `localStorage`.

### Layers

- **`src/app/core/`** — Services and models consumed across the whole app:
  - `TaskService` — CRUD and decrement/reset logic for tasks
  - `LocalStorageService` — Reads/writes `taskdown_local_tasks` in `localStorage`; also proxies reads/writes to the Chrome extension storage
  - `ChromeSyncService` — Injected at root app startup; establishes bidirectional sync via `window.postMessage` between the web app and the extension content scripts
  - `ToastService` — Manages in-app notifications

- **`src/app/features/`** — Lazy-loaded route modules (dashboard, task detail, privacy)

- **`src/app/shared/`** — Reusable UI components (task-card, toast, confirmation-dialog, progress-bar, sync-button, time-ago pipe)

### Chrome Extension (`extension/`)

The extension targets `https://taskdown-offline.vercel.app/*` (and localhost for dev).

| File | Role |
|------|------|
| `background.js` | Service worker; manages `chrome.storage`, handles messages (`syncLocalTasks`, `saveTasks`, `setLocalLimit`), broadcasts storage changes to all matching tabs |
| `content.js` + `content.sync.js` | Injected into the web app page; bridge between `window.postMessage` and `chrome.runtime.sendMessage` |
| `config.js` | Injects `window.TASKDOWN_CONFIG` (app URL) into the page |
| `popup/` | Compact task list with quick decrement buttons |

**IPC message types** (web ↔ extension):
- `TASKDOWN_SAVE_TASKS` — web → extension (persist to chrome.storage)
- `TASKDOWN_EXTENSION_STORAGE_CHANGED` — extension → web (notify of external changes)
- `TASKDOWN_SET_LOCAL_LIMIT` — web → extension (update task limit)
- `TASKDOWN_REQUEST_REFRESH` — triggered by actionable toasts

The sync layer uses an origin flag to prevent echo loops when the same change would otherwise bounce back and forth.

### Key Data Models

```typescript
// Task
{ id, user_id, title, description?, url?, initial_count, current_count, completed, created_at, updated_at }

// HistoryEntry
{ id, task_id, action: 'decrement'|'reset'|'custom_reset', previous_value, new_value, created_at }
```

### Environment Config

- `environment.ts` (prod) — `localTaskLimit: 20`
- `environment.development.ts` — `localTaskLimit: 5`

### Routing

```
/ → /dashboard (default)
/dashboard → DashboardComponent
/task/:id → TaskDetailComponent
/privacy → PrivacyComponent
** → /dashboard
```

### State Management

The app uses Angular signals (not NgRx). `TaskService` exposes signals that components read directly. `ChromeSyncService` is initialized once in the root `App` component constructor.
