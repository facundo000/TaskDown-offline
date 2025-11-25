// TaskDown Browser Extension Popup
// Handles authentication, task listing, and decrement functionality

console.log('popup.js script loaded');

class TaskDownPopup {
  constructor() {
    console.log('TaskDownPopup constructor called');
    this.tasks = [];

    // Wait for DOM to be fully ready
    console.log('Document ready state:', document.readyState);
    console.log('Document body:', !!document.body);

    // DOM elements - with null checks
    this.loadingEl = document.getElementById('loading');
    this.authRequiredEl = document.getElementById('auth-required');
    this.localTasksInfoEl = document.getElementById('local-tasks-info');
    this.tasksContainerEl = document.getElementById('tasks-container');
    this.tasksListEl = document.getElementById('tasks-list');
    this.emptyStateEl = document.getElementById('empty-state');
    this.errorStateEl = document.getElementById('error-state');
    this.addTaskFormEl = document.getElementById('add-task-form');

    console.log('DOM elements found:', {
      loading: !!this.loadingEl,
      authRequired: !!this.authRequiredEl,
      tasksContainer: !!this.tasksContainerEl,
      addTaskForm: !!this.addTaskFormEl
    });

    // Detailed logging for debugging
    if (this.authRequiredEl) {
      console.log('authRequiredEl found:', this.authRequiredEl.id);
    } else {
      console.error('authRequiredEl NOT found - checking DOM...');
      const allScreens = document.querySelectorAll('.screen');
      console.log('All screen elements found:', allScreens.length);
      allScreens.forEach((el, idx) => {
        console.log(`  Screen ${idx}:`, el.id, el.className);
      });
    }

    // Buttons
    this.openWebAppBtn = document.getElementById('open-web-app');
    this.openWebAppLocalBtn = document.getElementById('open-web-app-local');
    this.useLocalModeBtn = document.getElementById('use-local-mode');
    this.openDashboardBtn = document.getElementById('open-dashboard');
    this.retryBtn = document.getElementById('retry-btn');
    this.addTaskBtn = document.getElementById('add-task-btn');
    this.cancelAddBtn = document.getElementById('cancel-add-btn');
    this.cancelFormBtn = document.getElementById('cancel-form-btn');

    // Form elements
    this.taskForm = document.getElementById('task-form');
    this.taskTitleInput = document.getElementById('task-title');
    this.taskDescriptionInput = document.getElementById('task-description');
    this.taskUrlInput = document.getElementById('task-url');
    this.taskCountInput = document.getElementById('task-count');

    this.init();
  }

  async init() {
    console.log('TaskDownPopup init() called');

    try {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        // Normalize keys: web may write under 'taskdown_local_tasks' (JSON string)
        // or under 'tasks' (array). Handle both and update popup accordingly.
        const key = changes['taskdown_local_tasks'] ? 'taskdown_local_tasks' : (changes['tasks'] ? 'tasks' : null);
        if ((areaName === 'sync' || areaName === 'local') && key) {
          console.log('🔄 Detected changes in chrome.storage from web (key):', key);
          try {
            const newValue = changes[key].newValue;
            // If value is a string (JSON), parse it; if it's an array/object, use directly
            let tasksArray = [];
            if (typeof newValue === 'string') {
              tasksArray = JSON.parse(newValue || '[]');
            } else if (Array.isArray(newValue)) {
              tasksArray = newValue;
            } else if (newValue && typeof newValue === 'object') {
              // Could be an object containing the JSON string in some setups
              try {
                tasksArray = JSON.parse(newValue.taskdown_local_tasks || JSON.stringify(newValue));
              } catch (err) {
                tasksArray = [];
              }
            }

            // Update popup's localStorage and UI
            try {
              localStorage.setItem('taskdown_local_tasks', JSON.stringify(tasksArray));
            } catch (err) {
              console.warn('Could not write to popup localStorage:', err);
            }

            this.renderTasks(tasksArray || []);
            console.log('✓ Popup tasks updated from chrome.storage change');
          } catch (error) {
            console.error('Error handling chrome.storage.onChanged update:', error);
          }
        }
      });

      // Setup event listeners
      this.setupEventListeners();

      // Load the latest tasks from extension storage (use unified key)
      chrome.storage.sync.get(['taskdown_local_tasks'], (result) => {
        try {
          const raw = result && result.taskdown_local_tasks;
          if (raw) {
            console.log('📥 Cargando tareas desde chrome.storage.sync (taskdown_local_tasks)');
            let tasks = [];
            if (typeof raw === 'string') {
              tasks = JSON.parse(raw || '[]');
            } else if (Array.isArray(raw)) {
              tasks = raw;
            }
            this.tasks = tasks || [];
            try {
              localStorage.setItem('taskdown_local_tasks', JSON.stringify(this.tasks));
              console.log('✓ Popup localStorage updated from chrome.storage.sync');
            } catch (err) {
              console.warn('Could not write popup localStorage:', err);
            }
            this.renderTasks();
            return;
          }
        } catch (err) {
          console.warn('Error parsing tasks from chrome.storage.sync:', err);
        }

        // Fallback to chrome.storage.local
        chrome.storage.local.get(['taskdown_local_tasks'], (localRes) => {
          try {
            const rawLocal = localRes && localRes.taskdown_local_tasks;
            if (rawLocal) {
              console.log('📥 Cargando tareas desde chrome.storage.local (fallback)');
              let tasks = [];
              if (typeof rawLocal === 'string') {
                tasks = JSON.parse(rawLocal || '[]');
              } else if (Array.isArray(rawLocal)) {
                tasks = rawLocal;
              }
              this.tasks = tasks || [];
              try {
                localStorage.setItem('taskdown_local_tasks', JSON.stringify(this.tasks));
                console.log('✓ Popup localStorage updated from chrome.storage.local');
              } catch (err) {
                console.warn('Could not write popup localStorage (local fallback):', err);
              }
              this.renderTasks();
              return;
            }
          } catch (err) {
            console.warn('Error parsing tasks from chrome.storage.local:', err);
          }

          // If no tasks found, render current this.tasks (likely empty)
          this.renderTasks();
        });
      });

      // Load tasks and render
      this.loadTasks();
      console.log('Popup initialization completed successfully');
    } catch (error) {
      console.error('Failed to initialize popup:', error);
      this.showError('Error al inicializar la extensión: ' + error.message);
    }
  }

  // Read configured local task limit. Priority: chrome.storage.sync -> manifest.taskdown.localTaskLimit -> fallback 200
  getLocalLimit() {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get(['taskdown_local_limit'], (res) => {
          try {
            const v = res && res.taskdown_local_limit;
            if (typeof v === 'number' && isFinite(v) && v > 0) return resolve(v);
            return resolve(20);
          } catch (err) {
            console.warn('Error reading local limit from storage:', err);
            resolve(20);
          }
        });
      } catch (err) {
        console.warn('chrome.storage.sync not available, falling back to default:', err);
        resolve(20);
      }
    });
  }

  async updateLocalLimitBanner(bannerEl) {
    try {
      const limit = await this.getLocalLimit();
      const titleEl = bannerEl.querySelector('.banner-title');
      const descEl = bannerEl.querySelector('.banner-description');
      if (titleEl) titleEl.textContent = `Límite de ${limit} tareas sin autenticación`;
      if (descEl) descEl.textContent = `Regístrate para crear tareas ilimitadas y sincronizar entre dispositivos`;
    } catch (err) {
      console.warn('Could not update local limit banner:', err);
    }
  }

  // Enable/disable the add-task button depending on the configured limit
  async updateAddButtonState() {
    try {
      const limit = await this.getLocalLimit();
      const tasks = this.getLocalTasks();
      const count = tasks ? tasks.length : 0;
      if (this.addTaskBtn) {
        this.addTaskBtn.disabled = count >= limit;
      }
      // If add-task form is open and now at limit, hide the form
      if (this.addTaskFormEl && this.addTaskFormEl.classList && (this.addTaskFormEl.classList.contains('hidden') === false)) {
        if (count >= limit) {
          // Close the form to prevent creating more tasks
          this.hideAddTaskForm();
        }
      }
    } catch (err) {
      console.warn('Could not update add button state:', err);
    }
  }


  setupEventListeners() {
    // Auth buttons
    this.openWebAppBtn?.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://your-taskdown-app.com' });
      window.close();
    });

    this.openWebAppLocalBtn?.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://your-taskdown-app.com' });
      window.close();
    });

    this.useLocalModeBtn?.addEventListener('click', () => {
      console.log('useLocalModeBtn clicked - showing add task form for local mode');
      this.showAddTaskForm();
    });

    // Task management buttons
    this.openDashboardBtn?.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://your-taskdown-app.com/dashboard' });
      window.close();
    });
    this.retryBtn?.addEventListener('click', () => this.loadTasks());

    // Add task buttons
    this.addTaskBtn?.addEventListener('click', () => this.showAddTaskForm());
    this.cancelAddBtn?.addEventListener('click', () => this.hideAddTaskForm());
    this.cancelFormBtn?.addEventListener('click', () => this.hideAddTaskForm());

    // Form submission
    this.taskForm?.addEventListener('submit', (e) => this.handleTaskSubmit(e));


  }



  setupStorageChangeListener() {
    // Listen for changes in chrome.storage from web app
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if ((areaName === 'sync' || areaName === 'local') && changes['taskdown_local_tasks']) {
        console.log('🔔 Detected storage change from web app:', changes['taskdown_local_tasks'].newValue);

        // Update local localStorage with the new data
        try {
          const newTasksJson = changes['taskdown_local_tasks'].newValue;
          if (newTasksJson) {
            localStorage.setItem('taskdown_local_tasks', newTasksJson);
            console.log('✓ Popup localStorage updated from chrome.storage');

            // Reload tasks in popup to show updated data
            if (this.tasksContainerEl && !this.tasksContainerEl.classList.contains('hidden')) {
              console.log('🔄 Refreshing tasks in popup due to web app changes');
              this.loadTasks();
            }
          }
        } catch (error) {
          console.error('Error updating popup localStorage:', error);
        }
      }
    });
  }

  async loadTasks() {
    try {
      // Always load from localStorage in offline mode
      this.tasks = this.getLocalTasks();
      this.renderTasks();
    } catch (error) {
      console.error('Failed to load tasks:', error);
      this.showError('Error al cargar las tareas');
    }
  }

  renderTasks(tasksToRender) {
    // Allow passing tasks as parameter for updates from chrome.storage
    const tasks = tasksToRender || this.tasks;

    // If no tasks, show empty state with option to add
    if (tasks.length === 0) {
      this.hideAll();
      if (this.tasksContainerEl) {
        this.tasksContainerEl.classList.remove('hidden');
      }
      if (this.tasksListEl) {
        this.tasksListEl.innerHTML = '';
      }
      // Show banner to encourage creating local task
      let banner = document.getElementById('local-limit-banner');
      if (!banner) {
        banner = this.createLocalLimitBanner();
        const tasksContainer = document.getElementById('tasks-container');
        if (tasksContainer) {
          tasksContainer.insertBefore(banner, tasksContainer.firstChild);
        }
      }
      banner.classList.remove('hidden');
      return;
    }

    // Update this.tasks if different
    if (tasksToRender && tasksToRender !== this.tasks) {
      this.tasks = tasksToRender;
    }

    if (!this.tasksListEl) {
      console.error('tasksListEl not found');
      return;
    }

    this.tasksListEl.innerHTML = '';

    tasks.forEach(task => {
      const taskElement = this.createTaskElement(task);
      this.tasksListEl.appendChild(taskElement);
    });

    // Show tasks container for local tasks
    this.hideAll();
    if (this.tasksContainerEl) {
      this.tasksContainerEl.classList.remove('hidden');
    }

    // Ensure banner exists for local mode
    let banner = document.getElementById('local-limit-banner');
    if (!banner) {
      banner = this.createLocalLimitBanner();
      if (this.tasksListEl) {
        this.tasksListEl.parentElement.insertBefore(banner, this.tasksListEl);
      }
    }
    banner.classList.remove('hidden');

    // Update add button enabled/disabled state after rendering
    try { this.updateAddButtonState().catch(() => { }); } catch (e) { }
  }

  createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item';
    if (task.completed) {
      taskDiv.classList.add('completed');
    }
    taskDiv.dataset.taskId = task.id;

    const progressPercentage = task.initial_count > 0
      ? ((task.initial_count - task.current_count) / task.initial_count) * 100
      : 0;

    taskDiv.innerHTML = `
      <div class="task-content">
        <div class="task-title">${this.escapeHtml(task.title)}</div>

        <div class="task-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
          </div>
          <div class="task-count">${task.current_count}/${task.initial_count}</div>
        </div>

        <div class="task-status">${task.completed ? 'Completada' : 'Pendiente'}</div>
      </div>

      <div class="task-actions">
        <div class="task-buttons">
          <button class="decrement-btn" data-task-id="${task.id}" ${task.current_count <= 0 ? 'disabled' : ''} title="Disminuir en 1">
            -1
          </button>
          <button class="reset-btn" data-task-id="${task.id}" title="Restablecer al valor inicial">
            ↻
          </button>
          <button class="delete-btn" data-task-id="${task.id}" title="Eliminar tarea">
            🗑️
          </button>
          <button class="details-btn" data-task-id="${task.id}" title="Ver detalles">
            ℹ️
          </button>
        </div>
      </div>
    `;

    // Add event listener for decrement button
    const decrementBtn = taskDiv.querySelector('.decrement-btn');
    decrementBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.decrementTask(task.id, decrementBtn);
    });

    // Add event listener for reset button
    const resetBtn = taskDiv.querySelector('.reset-btn');
    resetBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.resetTask(task.id, resetBtn);
    });

    // Add event listener for delete button
    const deleteBtn = taskDiv.querySelector('.delete-btn');
    deleteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteTask(task.id, deleteBtn);
    });

    // Add event listener for details button
    const detailsBtn = taskDiv.querySelector('.details-btn');
    detailsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      chrome.tabs.create({ url: `https://your-taskdown-app.com/task/${task.id}` });
      window.close();
    });

    return taskDiv;
  }

  async decrementTask(taskId, buttonElement) {
    let task = null;
    try {
      // Show loading state
      buttonElement.classList.add('loading');
      buttonElement.disabled = true;

      // Find the task
      task = this.tasks.find(t => t.id === taskId);
      if (!task || task.current_count <= 0) return;

      // Update task
      const newCount = task.current_count - 1;
      const completed = newCount === 0;

      // Update in localStorage
      this.updateLocalTask(taskId, { current_count: newCount, completed });

      // Update local task
      task.current_count = newCount;
      task.completed = completed;

      // Update UI
      this.updateTaskElement(taskId, task);

      // Show confetti when task is completed
      if (completed) {
        this.triggerConfetti();
      }

    } catch (error) {
      console.error('Failed to decrement task:', error);
      // Show error feedback
      buttonElement.classList.add('error');
      setTimeout(() => {
        buttonElement.classList.remove('error');
      }, 2000);
    } finally {
      buttonElement.classList.remove('loading');
      // Only disable if task exists and has count > 1
      if (task) {
        buttonElement.disabled = task.current_count <= 1;
      }
    }
  }

  async resetTask(taskId, buttonElement) {
    try {
      // Find the task
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) return;

      // Show confirmation dialog
      const confirmed = confirm(`¿Estás seguro de que deseas restablecer "${task.title}" al valor inicial (${task.initial_count})?\n\nEl progreso actual se perderá.`);
      if (!confirmed) return;

      // Show loading state
      buttonElement.classList.add('loading');
      buttonElement.disabled = true;

      // Reset in localStorage
      this.updateLocalTask(taskId, { current_count: task.initial_count, completed: false });

      // Update local task
      task.current_count = task.initial_count;
      task.completed = false;

      // Update UI
      this.updateTaskElement(taskId, task);

    } catch (error) {
      console.error('Failed to reset task:', error);
      // Show error feedback
      buttonElement.classList.add('error');
      setTimeout(() => {
        buttonElement.classList.remove('error');
      }, 2000);
    } finally {
      buttonElement.classList.remove('loading');
      buttonElement.disabled = false;
    }
  }

  async deleteTask(taskId, buttonElement) {
    try {
      // Show confirmation dialog
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) return;

      const confirmed = confirm(`¿Estás seguro de que deseas eliminar la tarea "${task.title}"?\n\nEsta acción no se puede deshacer.`);
      if (!confirmed) return;

      // Show loading state
      buttonElement.classList.add('loading');
      buttonElement.disabled = true;

      // Delete from localStorage
      this.deleteLocalTask(taskId);

      // Remove from local array and re-render
      this.tasks = this.tasks.filter(t => t.id !== taskId);
      this.renderTasks();
      console.log('✓ Task deleted:', taskId);

    } catch (error) {
      console.error('Failed to delete task:', error);
      // Show error feedback
      buttonElement.classList.add('error');
      setTimeout(() => {
        buttonElement.classList.remove('error');
      }, 2000);
    } finally {
      buttonElement.classList.remove('loading');
      buttonElement.disabled = false;
    }
  }

  updateTaskElement(taskId, updatedTask) {
    const taskElement = this.tasksListEl.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskElement) return;

    const progressPercentage = updatedTask.initial_count > 0
      ? ((updatedTask.initial_count - updatedTask.current_count) / updatedTask.initial_count) * 100
      : 0;

    // Update progress bar
    const progressFill = taskElement.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.width = `${progressPercentage}%`;
    }

    // Update count
    const countElement = taskElement.querySelector('.task-count');
    if (countElement) {
      countElement.textContent = updatedTask.current_count;
    }

    // Update status
    const statusElement = taskElement.querySelector('.task-status');
    if (statusElement) {
      statusElement.textContent = updatedTask.completed ? 'Completada' : 'Pendiente';
    }

    // Update button state
    const decrementBtn = taskElement.querySelector('.decrement-btn');
    if (decrementBtn) {
      decrementBtn.disabled = updatedTask.current_count <= 0;
    }

    // Update completed class
    if (updatedTask.completed) {
      taskElement.classList.add('completed');
    }
  }

  triggerConfetti() {
    // Simple confetti effect using CSS animations
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      const colors = ['#6965db', '#ffc58b', '#7bc863', '#e03c3c'];
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = (Math.random() * 0.5) + 's';
      confettiContainer.appendChild(confetti);
    }

    document.body.appendChild(confettiContainer);

    setTimeout(() => {
      document.body.removeChild(confettiContainer);
    }, 3000);
  }

  // UI State Management
  showLoading() {
    console.log('showLoading() called');
    console.log('loadingEl:', this.loadingEl);

    if (this.loadingEl) {
      console.log('Hiding all elements...');
      this.hideAll();
      console.log('Removing hidden class from loading element');
      this.loadingEl.classList.remove('hidden');
      console.log('Loading element shown, classList:', this.loadingEl.className);
      console.log('Loading element display:', window.getComputedStyle(this.loadingEl).display);
    } else {
      console.error('Loading element not found! Creating fallback...');
      // Fallback: create loading message directly
      document.body.innerHTML = '<div style="padding: 20px; text-align: center; font-family: sans-serif; background: #f8f9fa; min-height: 400px; display: flex; align-items: center; justify-content: center;"><div><div style="font-size: 32px; margin-bottom: 16px;">⏳</div><p>Cargando TaskDown...</p></div></div>';
    }
  }

  showAuthRequired() {
    console.log('showAuthRequired() called');
    console.log('authRequiredEl before hideAll:', !!this.authRequiredEl);

    // First hide everything
    this.hideAll();

    console.log('authRequiredEl after hideAll:', !!this.authRequiredEl);

    if (this.authRequiredEl) {
      // Make absolutely sure loading is hidden
      if (this.loadingEl && this.loadingEl.classList.contains('hidden') === false) {
        console.log('⚠️ Loading element is still visible! Adding hidden class');
        this.loadingEl.classList.add('hidden');
      }

      console.log('Removing hidden class from authRequiredEl');
      this.authRequiredEl.classList.remove('hidden');
      console.log('authRequiredEl classes after remove:', this.authRequiredEl.className);
      console.log('authRequiredEl display style:', window.getComputedStyle(this.authRequiredEl).display);
      console.log('authRequiredEl visibility:', window.getComputedStyle(this.authRequiredEl).visibility);
      console.log('authRequiredEl offsetHeight:', this.authRequiredEl.offsetHeight);
      console.log('authRequiredEl offsetWidth:', this.authRequiredEl.offsetWidth);
      console.log('authRequiredEl HTML:', this.authRequiredEl.innerHTML.substring(0, 100));

      // Extra verification
      setTimeout(() => {
        console.log('✓ After 100ms - authRequiredEl display:', window.getComputedStyle(this.authRequiredEl).display);
        console.log('✓ After 100ms - loadingEl display:', window.getComputedStyle(this.loadingEl).display);
      }, 100);
    } else {
      console.error('authRequiredEl not found!');
      // Try to find it manually
      const el = document.getElementById('auth-required');
      console.log('Manual search for auth-required:', !!el);
      if (el) {
        el.classList.remove('hidden');
      }
    }
  }

  showLocalTasksInfo(count) {
    console.log('showLocalTasksInfo() called with count:', count);
    this.hideAll();
    const countEl = document.getElementById('local-tasks-count');
    if (countEl) {
      countEl.textContent = count;
    }
    if (this.localTasksInfoEl) {
      this.localTasksInfoEl.classList.remove('hidden');
    } else {
      console.error('localTasksInfoEl not found');
    }
  }

  showLocalTasksWithBanner(count) {
    console.log('showLocalTasksWithBanner() called with count:', count);
    this.hideAll();

    // Show tasks container
    if (this.tasksContainerEl) {
      this.tasksContainerEl.classList.remove('hidden');
    }

    // Show limit banner
    let banner = document.getElementById('local-limit-banner');
    if (!banner) {
      banner = this.createLocalLimitBanner();
      const tasksContainer = document.getElementById('tasks-container');
      if (tasksContainer) {
        tasksContainer.insertBefore(banner, tasksContainer.firstChild);
      }
    }
    banner.classList.remove('hidden');

    // Load and render local tasks
    this.loadTasks();
  }

  createLocalLimitBanner() {
    const banner = document.createElement('div');
    banner.id = 'local-limit-banner';
    banner.className = 'local-limit-banner';
    banner.innerHTML = `
      <div class="banner-content">
        <div class="banner-info">
          <div class="banner-icon">🔒</div>
          <div class="banner-text">
            <p class="banner-title">Límite de — tareas sin autenticación</p>
            <p class="banner-description">Regístrate para crear tareas ilimitadas y sincronizar entre dispositivos</p>
          </div>
        </div>
        <button id="banner-signup-btn" class="btn btn-primary banner-btn">
          Registrarse
        </button>
      </div>
    `;

    // Add event listener
    const signupBtn = banner.querySelector('#banner-signup-btn');
    if (signupBtn) {
      signupBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://your-taskdown-app.com/auth/register' });
        window.close();
      });
    }

    // Update banner text asynchronously with the configured limit
    this.updateLocalLimitBanner(banner).catch(() => { });

    return banner;
  }

  showTasksContainer() {
    console.log('showTasksContainer() called');
    this.hideAll();
    if (this.tasksContainerEl) {
      this.tasksContainerEl.classList.remove('hidden');
    } else {
      console.error('tasksContainerEl not found');
    }
  }

  showEmptyState() {
    console.log('showEmptyState() called');
    this.hideAll();
    if (this.tasksListEl) this.tasksListEl.innerHTML = '';
    if (this.emptyStateEl) this.emptyStateEl.classList.remove('hidden');
    if (this.errorStateEl) this.errorStateEl.classList.add('hidden');
  }

  showError(message) {
    console.error('showError() called with message:', message);
    if (this.tasksListEl) this.tasksListEl.innerHTML = '';
    if (this.emptyStateEl) this.emptyStateEl.classList.add('hidden');
    if (this.errorStateEl) this.errorStateEl.classList.remove('hidden');

    const errorMsg = this.errorStateEl?.querySelector('p');
    if (errorMsg) {
      errorMsg.textContent = message;
    }
  }

  hideAll() {
    console.log('hideAll() called - hiding all screens');
    if (this.loadingEl) {
      this.loadingEl.classList.add('hidden');
      console.log('  Loading hidden');
    }
    if (this.authRequiredEl) {
      this.authRequiredEl.classList.add('hidden');
      console.log('  AuthRequired hidden');
    }
    if (this.localTasksInfoEl) {
      this.localTasksInfoEl.classList.add('hidden');
      console.log('  LocalTasksInfo hidden');
    }
    if (this.tasksContainerEl) {
      this.tasksContainerEl.classList.add('hidden');
      console.log('  TasksContainer hidden');
    }
    if (this.addTaskFormEl) {
      this.addTaskFormEl.classList.add('hidden');
      console.log('  AddTaskForm hidden');
    }
    if (this.emptyStateEl) {
      this.emptyStateEl.classList.add('hidden');
      console.log('  EmptyState hidden');
    }
    if (this.errorStateEl) {
      this.errorStateEl.classList.add('hidden');
      console.log('  ErrorState hidden');
    }
  }

  // Local storage methods
  getLocalTasks() {
    try {
      const tasksJson = localStorage.getItem('taskdown_local_tasks');
      if (!tasksJson) return [];

      const tasks = JSON.parse(tasksJson);
      return tasks.map(task => ({
        ...task,
        created_at: new Date(task.created_at),
        updated_at: new Date(task.updated_at)
      }));
    } catch (error) {
      console.error('Error reading local tasks:', error);
      return [];
    }
  }

  updateLocalTask(taskId, updates) {
    try {
      const tasks = this.getLocalTasks();
      const taskIndex = tasks.findIndex(t => t.id === taskId);

      if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...updates, updated_at: new Date().toISOString() };
        const tasksJson = JSON.stringify(tasks);

        // Save to localStorage
        localStorage.setItem('taskdown_local_tasks', tasksJson);

        // Notify background to persist tasks (centralized write)
        try {
          const tasksArr = tasks;
          chrome.runtime.sendMessage({ action: 'saveTasks', tasks: tasksArr, origin: 'extension' }, (resp) => {
            if (chrome.runtime.lastError) {
              console.warn('Warning sending tasks to background:', chrome.runtime.lastError.message);
            } else {
              console.log('✓ Background persisted updated tasks (updateLocalTask)');
            }
          });
        } catch (syncError) {
          console.warn('Could not send message to background to persist tasks:', syncError);
        }
        try { this.updateAddButtonState().catch(() => { }); } catch (e) { }
      }
    } catch (error) {
      console.error('Error updating local task:', error);
    }
  }

  deleteLocalTask(taskId) {
    try {
      const tasks = this.getLocalTasks();
      const filteredTasks = tasks.filter(t => t.id !== taskId);
      const tasksJson = JSON.stringify(filteredTasks);

      // Save to localStorage
      localStorage.setItem('taskdown_local_tasks', tasksJson);

      // Notify background to persist tasks (centralized write)
      try {
        chrome.runtime.sendMessage({ action: 'saveTasks', tasks: filteredTasks, origin: 'extension' }, (resp) => {
          if (chrome.runtime.lastError) {
            console.warn('Warning sending tasks to background:', chrome.runtime.lastError.message);
          } else {
            console.log('✓ Background persisted tasks after deletion (deleteLocalTask)');
          }
        });
      } catch (syncError) {
        console.warn('Could not send message to background to persist tasks:', syncError);
      }
      try { this.updateAddButtonState().catch(() => { }); } catch (e) { }
    } catch (error) {
      console.error('Error deleting local task:', error);
    }
  }

  // Sync local tasks to Supabase when user logs in
  async syncLocalTasksToSupabase() {
    if (!this.isAuthenticated || !this.currentUser) return;

    const localTasks = this.getLocalTasks();
    if (localTasks.length === 0) return;

    try {
      // Convert local tasks to Supabase format
      const supabaseTasks = localTasks.map(task => ({
        title: task.title,
        description: task.description,
        url: task.url,
        initial_count: task.initial_count,
        current_count: task.current_count,
        completed: task.completed,
        user_id: this.currentUser.id
      }));

      // Insert all tasks at once
      const { error } = await this.supabase
        .from('tasks')
        .insert(supabaseTasks);

      if (error) throw error;

      // Clear localStorage after successful sync
      localStorage.removeItem('taskdown_local_tasks');

      // Reload tasks to show synced ones
      await this.loadTasks();

    } catch (error) {
      console.error('Error syncing local tasks:', error);
    }
  }

  // Add task form methods
  async showAddTaskForm() {
    console.log('showAddTaskForm() called');

    // Check task limit for unauthenticated users
    if (!this.isAuthenticated) {
      const localTasks = this.getLocalTasks();
      const limit = await this.getLocalLimit();
      if (localTasks.length >= limit) {
        alert(`Límite de ${limit} tareas alcanzado. Regístrate para crear tareas ilimitadas.`);
        return;
      }
    }

    this.hideAll();
    if (this.addTaskFormEl) {
      this.addTaskFormEl.classList.remove('hidden');
    }
    // Focus on title input
    setTimeout(() => this.taskTitleInput?.focus(), 100);
  }

  hideAddTaskForm() {
    console.log('hideAddTaskForm() called');
    if (this.addTaskFormEl) {
      this.addTaskFormEl.classList.add('hidden');
    }
    // Clear form
    this.clearTaskForm();
    // Go back to tasks view or auth
    if (this.isAuthenticated) {
      this.loadTasks();
    } else {
      const localTasks = this.getLocalTasks();
      if (localTasks.length > 0) {
        this.showLocalTasksWithBanner(localTasks.length);
      } else {
        this.showAuthRequired();
      }
    }
  }

  clearTaskForm() {
    if (this.taskTitleInput) this.taskTitleInput.value = '';
    if (this.taskDescriptionInput) this.taskDescriptionInput.value = '';
    if (this.taskUrlInput) this.taskUrlInput.value = '';
    if (this.taskCountInput) this.taskCountInput.value = '1';
  }

  async handleTaskSubmit(event) {
    event.preventDefault();
    console.log('handleTaskSubmit() called');

    const title = this.taskTitleInput?.value?.trim();
    const description = this.taskDescriptionInput?.value?.trim();
    const url = this.taskUrlInput?.value?.trim();
    const count = parseInt(this.taskCountInput?.value || '1');

    // Validation
    if (!title) {
      alert('El título es obligatorio');
      this.taskTitleInput?.focus();
      return;
    }

    if (count < 1) {
      alert('La cantidad debe ser mayor a 0');
      this.taskCountInput?.focus();
      return;
    }

    // Check limit again before creating
    if (!this.isAuthenticated) {
      const localTasks = this.getLocalTasks();
      const limit = await this.getLocalLimit();
      if (localTasks.length >= limit) {
        alert(`Límite de ${limit} tareas alcanzado. Regístrate para crear tareas ilimitadas.`);
        return;
      }
    }

    try {
      // Create new task
      const newTask = {
        id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        title,
        description: description || null,
        url: url || null,
        initial_count: count,
        current_count: count,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Creating new task:', newTask);

      // Save to localStorage
      this.saveLocalTask(newTask);

      // Clear form and hide
      this.clearTaskForm();
      this.hideAddTaskForm();

      // Reload tasks to show the new one
      await this.loadTasks();

    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error al crear la tarea: ' + error.message);
    }
  }

  saveLocalTask(task) {
    try {
      const tasks = this.getLocalTasks();
      tasks.push(task);
      const tasksJson = JSON.stringify(tasks);

      // Save to localStorage
      localStorage.setItem('taskdown_local_tasks', tasksJson);

      // Notify background to persist the updated tasks list
      try {
        const tasksArr = tasks;
        chrome.runtime.sendMessage({ action: 'saveTasks', tasks: tasksArr, origin: 'extension' }, (resp) => {
          if (chrome.runtime.lastError) {
            console.warn('Warning sending new task to background:', chrome.runtime.lastError.message);
          } else {
            console.log('✓ Background persisted new task (saveLocalTask)');
          }
        });
      } catch (syncError) {
        console.warn('Could not send message to background to persist new task:', syncError);
      }

      console.log('Task saved to localStorage:', task);
      try { this.updateAddButtonState().catch(() => { }); } catch (e) { }
    } catch (error) {
      console.error('Error saving local task:', error);
      throw error;
    }
  }

  // Utility functions
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize popup when DOM is loaded
if (document.readyState === 'loading') {
  console.log('DOM still loading, waiting for DOMContentLoaded event...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired, initializing TaskDownPopup');
    new TaskDownPopup();
  });
} else {
  console.log('DOM already loaded, initializing TaskDownPopup immediately');
  new TaskDownPopup();
}