# TaskDown

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Browser Extension

TaskDown includes a Chrome extension for quick task management. The extension allows you to view and manage your tasks directly from your browser toolbar.

### 🔄 Extension & Web Synchronization

The extension and web app work together with **bidirectional task synchronization**:

#### How It Works

1. **Create Task in Extension** → Automatically appears in web app
2. **Edit Task in Web** → Automatically updates in extension
3. **Complete Task in Web** → Automatically removed from extension
4. **All changes persist** even after page reload or browser restart

#### Architecture

- **Extension Popup**: Stores tasks locally using localStorage and chrome.storage
- **Content Script** (`content.sync.js`): Bridges between extension storage and web localStorage
- **Web App**: Uses localStorage to persist tasks and syncs with extension via content script
- **Background Script**: Monitors chrome.storage changes and notifies all contexts

#### Configuration

For the synchronization to work on `http://localhost:4200`:

1. The extension manifest includes localhost in content scripts:
   ```json
   "matches": ["http://localhost:4200/*", "http://127.0.0.1:4200/*"]
   ```

2. Make sure you're accessing the app at exactly `http://localhost:4200`
   - Not `http://localhost:4200/dashboard` (the route is automatic)
   - Not `http://127.0.0.1:4200` (unless using that for dev)

3. Verify the content script is loaded:
   - Open DevTools on the web app (F12)
   - Go to Console tab
   - Look for: `🔌 Content sync script loaded`

### Building the Extension

1. Build the project:
```bash
npm run build
```

2. The extension files will be available in `dist/extension/`

### Loading the Extension for Development

1. Build the project (or just use the `extension/` folder directly):
```bash
npm run build
```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right

4. Click "Load unpacked" and select the `extension/` folder from the project root

5. The TaskDown extension will appear in your toolbar

**After loading the extension**, you need to reload the web app:
- Go to `http://localhost:4200` and refresh (F5)
- DevTools should show: `🔌 Content sync script loaded`
- Now synchronization is ready! ✅

### Testing Synchronization

1. **Create a task in the extension**:
   - Click the TaskDown icon
   - Click the "+" button
   - Fill in task details and click "Crear"
   - Task appears in extension popup

2. **See it in the web app**:
   - Go to web app (`http://localhost:4200`)
   - Click the 🔄 sync button (bottom-right)
   - Task should appear immediately ✅

3. **Edit in web app**:
   - Click "-1" to decrease task count
   - Check extension popup - it should update automatically ✅

4. **Complete in web app**:
   - Click "✓" to complete a task
   - Task disappears from both web and extension ✅

5. **Reload web app**:
   - Press F5 to reload
   - Tasks should still be there - no data loss ✅

### If Synchronization Isn't Working

**Check these things**:

1. **Content script is loaded**:
   - Open DevTools on web app (F12)
   - Console should show: `🔌 Content sync script loaded`
   - If not: reload the extension in `chrome://extensions/`

2. **Extension is enabled**:
   - Go to `chrome://extensions/`
   - Verify TaskDown is enabled (blue toggle)
   - No "Errors" badge should appear

3. **URL is correct**:
   - You must be at `http://localhost:4200` exactly
   - Not `http://localhost:4200/dashboard`
   - Not `http://127.0.0.1:4200` (unless you configured it for that)

4. **localStorage has data**:
   - Open DevTools → Application → Local Storage → http://localhost:4200
   - Should see `taskdown_local_tasks` key with task data
   - If empty, create a task first

5. **chrome.storage has data**:
   - Open DevTools → Application → chrome.storage → sync
   - Should have same task data as localhost localStorage

6. **Still not working?**:
   - Try: Hard reload (Ctrl+Shift+R) on web app
   - Reload extension: `chrome://extensions/` → click refresh button
   - Close all localhost:4200 tabs and reopen
   - Restart Chrome completely

### Creating Tasks from the Extension

1. Click the **"+" button** in the extension popup header
2. Fill in the task details:
   - **Title** (required): Brief task name
   - **Description** (optional): Detailed description
   - **URL** (optional): Link related to the task
   - **Initial Count** (required): Starting number (minimum 1)
3. Click **"Crear Tarea"** to save
4. The task will appear in your task list immediately

### Synchronization Between Extension and Web App

TaskDown uses **localStorage as the common data source** for seamless synchronization:

#### How Sync Works
1. **Extension ↔ Web App**: Both store tasks in `localStorage['taskdown_local_tasks']`
2. **Chrome Storage**: Tasks are also synced to `chrome.storage.sync` for cross-device sync
3. **Real-time Updates**: Changes in one are reflected in the other instantly

#### Manual Sync Button
- **Location**: Fixed button in bottom-right corner of web app
- **Function**: Forces immediate synchronization from extension to web
- **Icon**: 🔄 (spins during sync)
- **Feedback**: Turns green ✓ when complete

#### Automatic Sync
- **On Page Load**: Web app automatically loads tasks from extension
- **Live Updates**: Changes in extension popup sync to web in real-time
- **Bidirectional**: Changes in web app sync back to extension

#### Testing Sync
1. Create a task in the extension popup
2. Click the sync button (🔄) in the web app
3. Task should appear immediately in the web dashboard
4. Make changes in web app → they sync back to extension

### Extension Features

- **View Tasks**: See your pending tasks with progress indicators
- **Create Tasks**: Add new tasks directly from the extension popup
- **Decrement Counter**: Click "-1" to reduce task count with animations
- **Reset Tasks**: Use the "↻" button to reset tasks to initial count
- **Quick Access**: Click any task to open its details in the web app
- **Local Mode**: Works offline with localStorage when not authenticated
- **Form Validation**: Real-time validation for task creation

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
