// ========================================
// TaskNest - Calendar Page Controller
// ========================================

let currentViewDate = new Date();
let selectedDateStr = formatLocalDate(new Date());


// ========================================
// Initialize Calendar Page
// ========================================

async function loadCalendarPage() {

    const container = document.getElementById("calendar-page-container");

    if (!container) {
        console.error("Calendar page container not found");
        return;
    }

    try {

        const response = await fetch("../components/calendar-page.html");

        if (!response.ok) {
            throw new Error("Unable to load calendar component");
        }

        container.innerHTML = await response.text();

        if (typeof loadTaskForm === "function") {
            await loadTaskForm();
        }

        setupCalendarEvents();
        renderCalendar();

        window.addEventListener("tasksUpdated", () => {
            renderCalendar();
        });

    } catch (error) {

        console.error("Calendar Page Error:", error);

    }

}


// ========================================
// Date Formatting Helpers
// ========================================

function formatLocalDate(date) {

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}

function parseLocalDate(dateString) {

    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);

}


// ========================================
// Event Listeners
// ========================================

function setupCalendarEvents() {

    const prevBtn = document.getElementById("prevMonthBtn");
    const nextBtn = document.getElementById("nextMonthBtn");
    const todayBtn = document.getElementById("calendarTodayBtn");
    const addTaskBtn = document.getElementById("calendarAddTaskBtn");
    const manageTasksBtn = document.getElementById("calendarManageTasksBtn");

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            currentViewDate = new Date(
                currentViewDate.getFullYear(),
                currentViewDate.getMonth() - 1,
                1
            );
            renderCalendar();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            currentViewDate = new Date(
                currentViewDate.getFullYear(),
                currentViewDate.getMonth() + 1,
                1
            );
            renderCalendar();
        });
    }

    if (todayBtn) {
        todayBtn.addEventListener("click", () => {
            const today = new Date();
            currentViewDate = new Date(today.getFullYear(), today.getMonth(), 1);
            selectedDateStr = formatLocalDate(today);
            renderCalendar();
        });
    }

    if (addTaskBtn) {
        addTaskBtn.addEventListener("click", () => {
            if (typeof window.openTaskModal === "function") {
                window.openTaskModal();

                const dueDateInput = document.getElementById("taskDueDate");
                if (dueDateInput && selectedDateStr) {
                    dueDateInput.value = selectedDateStr;
                }
            }
        });
    }

    if (manageTasksBtn) {
        manageTasksBtn.addEventListener("click", () => {
            window.location.href = "tasks.html";
        });
    }

}


// ========================================
// Render Monthly Grid & Selected Day Panel
// ========================================

function renderCalendar() {

    renderCalendarGrid();
    renderSelectedDateDetails();

}

function renderCalendarGrid() {

    const grid = document.getElementById("calendarGrid");
    const monthYearLabel = document.getElementById("calendarMonthYear");

    if (!grid || !monthYearLabel) return;

    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();

    monthYearLabel.textContent = new Date(year, month, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
    });

    const firstDayOfMonth = new Date(year, month, 1);
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    const todayStr = formatLocalDate(new Date());
    const tasks = typeof getTasks === "function" ? getTasks() : [];

    // Group tasks by dueDate for fast lookup
    const tasksByDate = {};
    tasks.forEach(task => {
        if (!task.dueDate) return;
        if (!tasksByDate[task.dueDate]) {
            tasksByDate[task.dueDate] = [];
        }
        tasksByDate[task.dueDate].push(task);
    });

    grid.innerHTML = "";

    for (let i = 0; i < totalCells; i++) {

        let cellDate;
        let isOtherMonth = false;

        if (i < startOffset) {
            const dayNum = daysInPrevMonth - startOffset + i + 1;
            cellDate = new Date(year, month - 1, dayNum);
            isOtherMonth = true;
        } else if (i >= startOffset + daysInMonth) {
            const dayNum = i - (startOffset + daysInMonth) + 1;
            cellDate = new Date(year, month + 1, dayNum);
            isOtherMonth = true;
        } else {
            const dayNum = i - startOffset + 1;
            cellDate = new Date(year, month, dayNum);
        }

        const dateStr = formatLocalDate(cellDate);
        const dayTasks = tasksByDate[dateStr] || [];

        const cell = document.createElement("div");
        cell.className = "calendar-day";

        if (isOtherMonth) cell.classList.add("other-month");
        if (dateStr === todayStr) cell.classList.add("today");
        if (dateStr === selectedDateStr) cell.classList.add("selected");

        // Priority dots (show up to 4 indicators)
        const dotsHTML = dayTasks.slice(0, 4).map(task => {
            const priorityClass = (task.priority || "low").toLowerCase();
            return `<span class="priority-dot ${priorityClass}" title="${escapeHTML(task.title)} (${task.priority})"></span>`;
        }).join("");

        const previewTitle = dayTasks.length > 0
            ? `<div class="day-task-preview">${escapeHTML(dayTasks[0].title)}</div>`
            : "";

        const countBadge = dayTasks.length > 0
            ? `<span class="day-task-badge">${dayTasks.length}</span>`
            : "";

        cell.innerHTML = `
            <div class="day-number-row">
                <span class="day-number">${cellDate.getDate()}</span>
                ${countBadge}
            </div>
            <div class="day-indicators">
                <div class="day-dots-row">${dotsHTML}</div>
                ${previewTitle}
            </div>
        `;

        cell.addEventListener("click", () => {
            selectedDateStr = dateStr;
            if (isOtherMonth) {
                currentViewDate = new Date(cellDate.getFullYear(), cellDate.getMonth(), 1);
            }
            renderCalendar();
        });

        grid.appendChild(cell);

    }

}


// ========================================
// Render Selected Date Tasks Panel
// ========================================

function renderSelectedDateDetails() {

    const headingEl = document.getElementById("selectedDateHeading");
    const countEl = document.getElementById("selectedDateCount");
    const listEl = document.getElementById("selectedDateTasks");

    if (!headingEl || !countEl || !listEl) return;

    const selectedDate = parseLocalDate(selectedDateStr);
    const todayStr = formatLocalDate(new Date());

    const formattedDate = selectedDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    headingEl.textContent = selectedDateStr === todayStr
        ? `Today · ${formattedDate}`
        : formattedDate;

    const tasks = typeof getTasks === "function" ? getTasks() : [];

    const matchingTasks = tasks
        .filter(task => task.dueDate === selectedDateStr)
        .sort((a, b) => {
            if (a.status !== b.status) {
                return a.status === "active" ? -1 : 1;
            }
            return (a.dueTime || "").localeCompare(b.dueTime || "");
        });

    countEl.textContent = matchingTasks.length;

    if (matchingTasks.length === 0) {
        listEl.innerHTML = `
            <div class="calendar-empty-state">
                <p>No tasks scheduled for this date.</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = matchingTasks.map(task => {

        const isCompleted = task.status === "completed";
        const priorityClass = (task.priority || "low").toLowerCase();
        const timeBadge = task.dueTime
            ? `<span class="cal-tag time">◷ ${escapeHTML(task.dueTime)}</span>`
            : "";
        const descHTML = task.description
            ? `<p class="calendar-task-desc">${escapeHTML(task.description)}</p>`
            : "";

        return `
            <div class="calendar-task-card ${isCompleted ? "completed" : ""}">
                <div class="calendar-task-top">
                    <span class="calendar-task-title">${escapeHTML(task.title)}</span>
                </div>
                ${descHTML}
                <div class="calendar-task-meta">
                    <div class="calendar-task-tags">
                        <span class="cal-tag category">${escapeHTML(task.category || "General")}</span>
                        <span class="cal-tag priority-${priorityClass}">${escapeHTML(task.priority || "Low")}</span>
                        ${timeBadge}
                    </div>
                    <button type="button" class="cal-toggle-btn" data-task-id="${task.id}">
                        ${isCompleted ? "Reopen" : "Complete"}
                    </button>
                </div>
            </div>
        `;

    }).join("");

    // Bind Complete / Reopen buttons
    listEl.querySelectorAll(".cal-toggle-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const taskId = btn.getAttribute("data-task-id");
            toggleCalendarTaskStatus(taskId);
        });
    });

}

function toggleCalendarTaskStatus(taskId) {

    if (typeof getTaskById !== "function" || typeof updateTask !== "function") {
        return;
    }

    const task = getTaskById(taskId);
    if (!task) return;

    const nextStatus = task.status === "completed" ? "active" : "completed";

    updateTask(taskId, {
        status: nextStatus,
        completedAt: nextStatus === "completed" ? new Date().toISOString() : null
    });

}

function escapeHTML(str) {

    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ========================================
// Start Calendar Page
// ========================================

loadCalendarPage();