// ========================================
// TaskNest - Task List
// ========================================


// Resolve active search query from header input or URL
function getActiveTaskSearchQuery() {
    const headerInput = document.getElementById("globalSearch");
    if (headerInput && typeof headerInput.value === "string") {
        return headerInput.value.trim().toLowerCase();
    }

    if (typeof window.taskNestSearchQuery === "string") {
        return window.taskNestSearchQuery.trim().toLowerCase();
    }

    const params = new URLSearchParams(window.location.search);
    return (params.get("search") || "").trim().toLowerCase();
}


// Format due date
function formatTaskDate(dateString) {
    if (!dateString) return "No due date";

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// Check whether a task is overdue
function isTaskOverdue(task) {
    if (task.status === "completed" || !task.dueDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(task.dueDate + "T00:00:00");

    return dueDate < today;
}


// Sort tasks:
// 1. Active tasks first
// 2. Active tasks by nearest due date
// 3. Completed tasks at the bottom
function sortTasks(tasks) {
    return [...tasks].sort((a, b) => {

        // Active tasks before completed tasks
        if (a.status !== b.status) {
            return a.status === "active" ? -1 : 1;
        }

        // Sort active tasks by due date
        if (a.status === "active" && b.status === "active") {
            const dateComparison = (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");

            if (dateComparison !== 0) {
                return dateComparison;
            }

            return (a.dueTime || "").localeCompare(b.dueTime || "");
        }

        // Completed tasks: most recently completed first
        if (a.status === "completed" && b.status === "completed") {
            return (b.completedAt || "").localeCompare(a.completedAt || "");
        }

        return 0;
    });
}


// Display all tasks (filtered by active search query if present)
function renderTasks() {
    const taskList = document.getElementById("taskList");

    if (!taskList) return;

    const allTasks = getTasks();
    const searchQuery = getActiveTaskSearchQuery();

    // Summary cards always reflect the user's full workspace
    updateTaskSummary(allTasks);

    const filteredTasks = searchQuery
        ? allTasks.filter(task => {
            const haystack = [
                task.title,
                task.description,
                task.category,
                task.priority,
                task.status
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return haystack.includes(searchQuery);
        })
        : allTasks;

    const displayedCount = document.getElementById("displayedTaskCount");

    if (displayedCount) {
        if (searchQuery) {
            displayedCount.textContent =
                `${filteredTasks.length} of ${allTasks.length} Tasks`;
        } else {
            displayedCount.textContent =
                `${allTasks.length} ${allTasks.length === 1 ? "Task" : "Tasks"}`;
        }
    }

    // Empty state when user has zero tasks at all
    if (allTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-task-state">
                <div class="empty-task-icon">✓</div>

                <h3>No tasks yet</h3>

                <p>
                    You haven't added any tasks.
                    Start organizing your day by creating your first task.
                </p>

                <button id="emptyAddTaskButton">
                    + Create Your First Task
                </button>
            </div>
        `;

        document.getElementById("emptyAddTaskButton")
            .addEventListener("click", () => window.openTaskModal());

        return;
    }

    // Empty state when search query matches zero tasks
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-task-state">
                <div class="empty-task-icon">⌕</div>

                <h3>No matching tasks</h3>

                <p>
                    No tasks matched "<strong>${escapeTaskHTML(searchQuery)}</strong>".
                </p>

                <button id="clearSearchStateBtn">
                    Clear Search
                </button>
            </div>
        `;

        document.getElementById("clearSearchStateBtn")
            .addEventListener("click", () => {
                const headerInput = document.getElementById("globalSearch");
                if (headerInput) {
                    headerInput.value = "";
                }
                window.taskNestSearchQuery = "";

                if (window.location.search.includes("search=")) {
                    window.history.replaceState({}, "", window.location.pathname);
                }

                renderTasks();
            });

        return;
    }

    // Sort filtered tasks before displaying
    const sortedTasks = sortTasks(filteredTasks);

    // Display task cards
    taskList.innerHTML = sortedTasks.map(task => {
        const overdue = isTaskOverdue(task);
        const completed = task.status === "completed";

        return `
            <article class="task-card ${completed ? "completed-task" : ""}"
                     data-task-id="${escapeTaskHTML(task.id)}">

                <div class="task-card-main">

                    <div class="task-card-title">

                        <span class="task-status-indicator ${completed ? "completed" : "active"}">
                            ${completed ? "✓" : "○"}
                        </span>

                        <div>
                            <h3>${escapeTaskHTML(task.title)}</h3>

                            <p>
                                ${escapeTaskHTML(task.description || "No description provided")}
                            </p>
                        </div>

                    </div>

                    <div class="task-card-details">

                        <span class="task-category">
                            ${escapeTaskHTML(task.category)}
                        </span>

                        <span class="task-priority ${escapeTaskHTML(task.priority.toLowerCase())}">
                            ${escapeTaskHTML(task.priority)} Priority
                        </span>

                        <span class="task-due-date ${overdue ? "overdue" : ""}">
                            ${formatTaskDate(task.dueDate)}
                            ${overdue ? " · Overdue" : ""}
                        </span>

                    </div>

                </div>

                <div class="task-card-actions">

                    <button
                        class="task-action-btn complete-task-btn"
                        data-action="toggle"
                        data-id="${escapeTaskHTML(task.id)}">

                        ${completed ? "↩ Reopen" : "✓ Complete"}

                    </button>

                    <button
                        class="task-action-btn delete-task-btn"
                        data-action="delete"
                        data-id="${escapeTaskHTML(task.id)}">

                        Delete

                    </button>

                </div>

            </article>
        `;
    }).join("");

    initializeTaskActions();
}


// Initialize task card buttons
function initializeTaskActions() {
    const taskList = document.getElementById("taskList");

    if (!taskList) return;

    taskList.querySelectorAll("[data-action]").forEach(button => {
        button.addEventListener("click", () => {
            const taskId = button.dataset.id;
            const action = button.dataset.action;

            if (action === "toggle") {
                toggleTaskStatus(taskId);
            }

            if (action === "delete") {
                deleteTaskWithConfirmation(taskId);
            }
        });
    });
}


// Complete or reopen a task
function toggleTaskStatus(taskId) {
    const task = getTaskById(taskId);

    if (!task) return;

    const newStatus =
        task.status === "completed" ? "active" : "completed";

    updateTask(taskId, {
        status: newStatus
    });
}


// Delete a task (respecting user's confirmDelete preference)
function deleteTaskWithConfirmation(taskId) {
    const task = getTaskById(taskId);

    if (!task) return;

    const prefs = typeof getUserTaskPreferences === "function"
        ? getUserTaskPreferences()
        : { confirmDelete: true };

    if (!prefs.confirmDelete) {
        deleteTask(taskId);
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete "${task.title}"?`
    );

    if (confirmed) {
        deleteTask(taskId);
    }
}


// Update task summary cards
function updateTaskSummary(tasks) {
    const total = tasks.length;

    const completed = tasks.filter(
        task => task.status === "completed"
    ).length;

    const active = tasks.filter(
        task => task.status === "active"
    ).length;

    const overdue = tasks.filter(
        task => isTaskOverdue(task)
    ).length;

    document.getElementById("pageTotalTasks").textContent = total;
    document.getElementById("pageActiveTasks").textContent = active;
    document.getElementById("pageCompletedTasks").textContent = completed;
    document.getElementById("pageOverdueTasks").textContent = overdue;
}


// Prevent user-entered text from being interpreted as HTML
function escapeTaskHTML(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}


// Listen for task and global search updates
window.addEventListener("tasksUpdated", renderTasks);
window.addEventListener("globalSearchUpdated", renderTasks);