// ========================================
// TaskNest - Central Task Storage
// ========================================

const BASE_TASK_STORAGE_KEY = "tasknest_tasks";


// Resolve storage key scoped to the currently logged-in user
function getTaskStorageKey() {
    try {
        const rawUser = localStorage.getItem("tasknest_current_user");
        if (rawUser) {
            const user = JSON.parse(rawUser);
            if (user && user.email) {
                return `${BASE_TASK_STORAGE_KEY}_${user.email.trim().toLowerCase()}`;
            }
        }
    } catch (error) {
        console.error("Error resolving user storage key:", error);
    }

    return BASE_TASK_STORAGE_KEY;
}


// Resolve preferences storage key scoped to the currently logged-in user
function getUserPreferencesStorageKey() {
    try {
        const rawUser = localStorage.getItem("tasknest_current_user");
        if (rawUser) {
            const user = JSON.parse(rawUser);
            if (user && user.email) {
                return `tasknest_prefs_${user.email.trim().toLowerCase()}`;
            }
        }
    } catch (error) {
        console.error("Error resolving user preferences key:", error);
    }

    return "tasknest_prefs";
}


// Get saved productivity preferences for the active user
function getUserTaskPreferences() {
    const defaults = {
        defaultCategory: "Work",
        defaultPriority: "Medium",
        pomodoroMinutes: 25,
        confirmDelete: true
    };

    try {
        const raw = localStorage.getItem(getUserPreferencesStorageKey());
        if (!raw) return defaults;
        return { ...defaults, ...JSON.parse(raw) };
    } catch (error) {
        console.error("Error retrieving user preferences:", error);
        return defaults;
    }
}


// Get all saved tasks for the active user
function getTasks() {
    try {
        const storageKey = getTaskStorageKey();
        return JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch (error) {
        console.error("Error retrieving tasks:", error);
        return [];
    }
}


// Save tasks and notify other components
function saveTasks(tasks) {
    const storageKey = getTaskStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(tasks));

    window.dispatchEvent(new CustomEvent("tasksUpdated"));
}


// Create a new task
function createTask(taskData) {
    const now = new Date().toISOString();

    const newTask = {
        id: crypto.randomUUID(),

        title: taskData.title,
        description: taskData.description,
        category: taskData.category,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        dueTime: taskData.dueTime,

        status: taskData.status || "active",

        createdAt: now,

        completedAt: taskData.status === "completed" ? now : null
    };

    const tasks = getTasks();

    tasks.push(newTask);

    saveTasks(tasks);

    return newTask;
}


// Get a task using its ID
function getTaskById(taskId) {
    const tasks = getTasks();

    return tasks.find(task => task.id === taskId);
}


// Update an existing task
function updateTask(taskId, updatedData) {
    const tasks = getTasks();

    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex === -1) {
        console.error("Task not found:", taskId);
        return false;
    }

    const oldTask = tasks[taskIndex];

    const updatedTask = {
        ...oldTask,
        ...updatedData
    };

    if (
        updatedData.status === "completed" &&
        oldTask.status !== "completed"
    ) {
        updatedTask.completedAt = new Date().toISOString();
    }

    if (updatedData.status === "active") {
        updatedTask.completedAt = null;
    }

    tasks[taskIndex] = updatedTask;

    saveTasks(tasks);

    return updatedTask;
}


// Delete a task
function deleteTask(taskId) {
    const tasks = getTasks();

    const updatedTasks = tasks.filter(task => task.id !== taskId);

    if (updatedTasks.length === tasks.length) {
        return false;
    }

    saveTasks(updatedTasks);

    return true;
}


// Handle task form submission
window.addEventListener("taskFormSubmitted", event => {
    try {
        createTask(event.detail);
    } catch (error) {
        console.error("Unable to create task:", error);
        alert("Unable to save the task. Please try again.");
    }
});