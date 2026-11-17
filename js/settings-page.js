// ========================================
// TaskNest - Settings & Data Management
// ========================================

const BASE_PREFS_STORAGE_KEY = "tasknest_prefs";


// ========================================
// Initialize Settings Page
// ========================================

async function loadSettingsPage() {

    const container = document.getElementById("settings-page-container");

    if (!container) {
        console.error("Settings page container not found");
        return;
    }

    try {

        const response = await fetch("../components/settings-page.html");

        if (!response.ok) {
            throw new Error("Unable to load settings page component");
        }

        container.innerHTML = await response.text();

        populateProfileForm();
        populatePreferencesForm();
        updateStoredTaskCounter();
        setupSettingsEvents();

        window.addEventListener("tasksUpdated", () => {
            updateStoredTaskCounter();
        });

    } catch (error) {

        console.error("Settings Page Error:", error);

    }

}


// ========================================
// Helpers: Active User & Per-User Prefs Key
// ========================================

function getActiveSessionUser() {

    try {
        const raw = localStorage.getItem("tasknest_current_user");
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.error("Error reading current user:", error);
        return null;
    }

}

function getUserPreferencesKey() {

    const user = getActiveSessionUser();
    if (user && user.email) {
        return `${BASE_PREFS_STORAGE_KEY}_${user.email.trim().toLowerCase()}`;
    }
    return BASE_PREFS_STORAGE_KEY;

}

function getUserPreferences() {

    const defaults = {
        defaultCategory: "Work",
        defaultPriority: "Medium",
        pomodoroMinutes: 25,
        confirmDelete: true
    };

    try {
        const raw = localStorage.getItem(getUserPreferencesKey());
        if (!raw) return defaults;
        return { ...defaults, ...JSON.parse(raw) };
    } catch (error) {
        console.error("Error loading user preferences:", error);
        return defaults;
    }

}

function showSettingsBanner(message, type = "success") {

    const banner = document.getElementById("settingsBanner");
    if (!banner) return;

    banner.textContent = message;
    banner.className = `settings-banner ${type}`;

    window.scrollTo({ top: 0, behavior: "smooth" });

}


// ========================================
// Populate Initial Values
// ========================================

function populateProfileForm() {

    const user = getActiveSessionUser();
    if (!user) return;

    const nameInput = document.getElementById("settingsNameInput");
    const emailInput = document.getElementById("settingsEmailInput");

    if (nameInput) nameInput.value = user.name || "";
    if (emailInput) emailInput.value = user.email || "";

}

function populatePreferencesForm() {

    const prefs = getUserPreferences();

    const categorySelect = document.getElementById("prefDefaultCategory");
    const prioritySelect = document.getElementById("prefDefaultPriority");
    const pomodoroSelect = document.getElementById("prefPomodoroMinutes");
    const confirmCheckbox = document.getElementById("prefConfirmDelete");

    if (categorySelect) categorySelect.value = prefs.defaultCategory;
    if (prioritySelect) prioritySelect.value = prefs.defaultPriority;
    if (pomodoroSelect) pomodoroSelect.value = String(prefs.pomodoroMinutes);
    if (confirmCheckbox) confirmCheckbox.checked = Boolean(prefs.confirmDelete);

}

function updateStoredTaskCounter() {

    const badge = document.getElementById("settingsTaskCount");
    if (!badge) return;

    const tasks = typeof getTasks === "function" ? getTasks() : [];
    const count = tasks.length;
    badge.textContent = `${count} ${count === 1 ? "Task" : "Tasks"} Stored`;

}


// ========================================
// Event Listeners
// ========================================

function setupSettingsEvents() {

    const profileForm = document.getElementById("profileSettingsForm");
    const preferencesForm = document.getElementById("preferencesSettingsForm");
    const exportBtn = document.getElementById("exportTasksBtn");
    const importBtn = document.getElementById("importTasksBtn");
    const importFileInput = document.getElementById("importTasksFileInput");
    const clearBtn = document.getElementById("clearTasksBtn");

    if (profileForm) {
        profileForm.addEventListener("submit", handleProfileUpdate);
    }

    if (preferencesForm) {
        preferencesForm.addEventListener("submit", handlePreferencesSave);
    }

    if (exportBtn) {
        exportBtn.addEventListener("click", handleExportTasks);
    }

    if (importBtn && importFileInput) {
        importBtn.addEventListener("click", () => importFileInput.click());
        importFileInput.addEventListener("change", handleImportTasksFile);
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", handleClearAllTasks);
    }

}


// ========================================
// 1. Update Profile & Password
// ========================================

function handleProfileUpdate(event) {

    event.preventDefault();

    const sessionUser = getActiveSessionUser();
    if (!sessionUser) return;

    const newName = document.getElementById("settingsNameInput").value.trim();
    const currentPassword = document.getElementById("settingsCurrentPassword").value;
    const newPassword = document.getElementById("settingsNewPassword").value;

    if (!newName) {
        showSettingsBanner("Display name cannot be empty.", "error");
        return;
    }

    let users = [];
    try {
        users = JSON.parse(localStorage.getItem("tasknest_users")) || [];
    } catch (error) {
        users = [];
    }

    const userIndex = users.findIndex(
        u => u.email.toLowerCase() === sessionUser.email.toLowerCase()
    );

    if (newPassword || currentPassword) {
        if (!currentPassword || !newPassword) {
            showSettingsBanner("Please enter both your current password and a new password.", "error");
            return;
        }

        if (newPassword.length < 6) {
            showSettingsBanner("New password must be at least 6 characters long.", "error");
            return;
        }

        if (userIndex !== -1 && users[userIndex].password !== currentPassword) {
            showSettingsBanner("Current password is incorrect.", "error");
            return;
        }
    }

    if (userIndex !== -1) {
        users[userIndex].name = newName;
        if (newPassword) {
            users[userIndex].password = newPassword;
        }
        localStorage.setItem("tasknest_users", JSON.stringify(users));
    }

    const updatedSession = {
        ...sessionUser,
        name: newName
    };
    localStorage.setItem("tasknest_current_user", JSON.stringify(updatedSession));

    // Refresh top-right header profile immediately
    if (typeof populateHeaderUserProfile === "function") {
        populateHeaderUserProfile();
    }

    document.getElementById("settingsCurrentPassword").value = "";
    document.getElementById("settingsNewPassword").value = "";

    showSettingsBanner(
        newPassword
            ? "Profile and password updated successfully."
            : "Profile name updated successfully.",
        "success"
    );

}


// ========================================
// 2. Save Productivity Preferences
// ========================================

function handlePreferencesSave(event) {

    event.preventDefault();

    const prefs = {
        defaultCategory: document.getElementById("prefDefaultCategory").value,
        defaultPriority: document.getElementById("prefDefaultPriority").value,
        pomodoroMinutes: Number(document.getElementById("prefPomodoroMinutes").value) || 25,
        confirmDelete: document.getElementById("prefConfirmDelete").checked
    };

    localStorage.setItem(getUserPreferencesKey(), JSON.stringify(prefs));

    showSettingsBanner("Productivity preferences saved for your account.", "success");

}


// ========================================
// 3. Export Tasks as JSON Backup
// ========================================

function handleExportTasks() {

    const tasks = typeof getTasks === "function" ? getTasks() : [];
    const user = getActiveSessionUser();

    const backupPayload = {
        app: "TaskNest",
        version: "1.0",
        exportedAt: new Date().toISOString(),
        userEmail: user ? user.email : "unknown",
        taskCount: tasks.length,
        tasks: tasks
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const todayStr = new Date().toISOString().split("T")[0];
    const link = document.createElement("a");
    link.href = url;
    link.download = `tasknest-backup-${todayStr}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSettingsBanner(`Exported ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} to JSON.`, "success");

}


// ========================================
// 4. Import Tasks from JSON Backup
// ========================================

function handleImportTasksFile(event) {

    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (loadEvent) {

        try {
            const parsed = JSON.parse(loadEvent.target.result);
            const rawTasks = Array.isArray(parsed)
                ? parsed
                : (parsed && Array.isArray(parsed.tasks) ? parsed.tasks : null);

            if (!rawTasks) {
                throw new Error("Invalid TaskNest backup format.");
            }

            const sanitizedTasks = rawTasks
                .filter(item => item && typeof item.title === "string" && item.title.trim() !== "")
                .map(item => ({
                    id: item.id || crypto.randomUUID(),
                    title: item.title.trim(),
                    description: typeof item.description === "string" ? item.description : "",
                    category: ["Work", "Personal", "Study"].includes(item.category) ? item.category : "Work",
                    priority: ["High", "Medium", "Low"].includes(item.priority) ? item.priority : "Medium",
                    dueDate: typeof item.dueDate === "string" ? item.dueDate : "",
                    dueTime: typeof item.dueTime === "string" ? item.dueTime : "",
                    status: item.status === "completed" ? "completed" : "active",
                    createdAt: item.createdAt || new Date().toISOString(),
                    completedAt: item.status === "completed"
                        ? (item.completedAt || new Date().toISOString())
                        : null
                }));

            if (typeof saveTasks === "function") {
                saveTasks(sanitizedTasks);
            }

            showSettingsBanner(
                `Successfully imported ${sanitizedTasks.length} ${sanitizedTasks.length === 1 ? "task" : "tasks"}.`,
                "success"
            );

        } catch (error) {
            console.error("JSON Import Error:", error);
            showSettingsBanner("Import failed: Please select a valid TaskNest JSON backup file.", "error");
        } finally {
            event.target.value = "";
        }

    };

    reader.readAsText(file);

}


// ========================================
// 5. Clear All Account Tasks
// ========================================

function handleClearAllTasks() {

    const tasks = typeof getTasks === "function" ? getTasks() : [];

    if (tasks.length === 0) {
        showSettingsBanner("There are no tasks to clear in this account.", "error");
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to permanently delete all ${tasks.length} tasks in this account? This cannot be undone.`
    );

    if (!confirmed) return;

    if (typeof saveTasks === "function") {
        saveTasks([]);
    }

    showSettingsBanner("All tasks for this account have been cleared.", "success");

}


// ========================================
// Start Settings Page
// ========================================

loadSettingsPage();