// ========================================
// TaskNest - Dedicated Analytics Page
// ========================================

let trendChartInstance = null;
let priorityChartInstance = null;
let categoryStatusChartInstance = null;
let activeTrendRange = "daily";


// ========================================
// Initialize Analytics Page
// ========================================

async function loadAnalyticsPage() {

    const container = document.getElementById("analytics-page-container");

    if (!container) {
        console.error("Analytics page container not found");
        return;
    }

    try {

        const response = await fetch("../components/analytics-page.html");

        if (!response.ok) {
            throw new Error("Unable to load analytics page component");
        }

        container.innerHTML = await response.text();

        if (typeof loadTaskForm === "function") {
            await loadTaskForm();
        }

        setupAnalyticsEvents();
        renderAllAnalytics();

        window.addEventListener("tasksUpdated", () => {
            renderAllAnalytics();
        });

    } catch (error) {

        console.error("Analytics Page Error:", error);

    }

}


// ========================================
// Date Helpers
// ========================================

function getLocalDateKey(date) {

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}

function getMondayStart(date) {

    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);

    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);

    return copy;

}


// ========================================
// Event Listeners
// ========================================

function setupAnalyticsEvents() {

    const addTaskBtn = document.getElementById("analyticsAddTaskBtn");

    if (addTaskBtn) {
        addTaskBtn.addEventListener("click", () => {
            if (typeof window.openTaskModal === "function") {
                window.openTaskModal();
            }
        });
    }

    const trendTabs = document.querySelectorAll(".trend-tab");

    trendTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            trendTabs.forEach(btn => btn.classList.remove("active"));
            tab.classList.add("active");

            activeTrendRange = tab.getAttribute("data-range") || "daily";
            renderTrendChart();
        });
    });

}


// ========================================
// Master Render Trigger
// ========================================

function renderAllAnalytics() {

    updateAnalyticsKpis();
    renderTrendChart();
    renderPriorityChart();
    renderCategoryStatusChart();

}


// ========================================
// 1. Deep-Dive KPI Cards
// ========================================

function updateAnalyticsKpis() {

    const tasks = typeof getTasks === "function" ? getTasks() : [];
    const total = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "completed");
    const activeTasks = tasks.filter(t => t.status !== "completed");

    // 1. Completion Rate
    const completionRate = total > 0
        ? Math.round((completedTasks.length / total) * 100)
        : 0;

    document.getElementById("kpiCompletionRate").textContent = `${completionRate}%`;
    document.getElementById("kpiCompletionSub").textContent =
        `${completedTasks.length} of ${total} tasks completed`;

    // 2. On-Time Delivery Rate
    const completedWithDue = completedTasks.filter(t => t.dueDate && t.completedAt);

    if (completedWithDue.length === 0) {
        document.getElementById("kpiOnTimeRate").textContent = "--";
        document.getElementById("kpiOnTimeSub").textContent = "Complete tasks with due dates";
    } else {
        const onTimeCount = completedWithDue.filter(task => {
            const completedDate = new Date(task.completedAt);
            if (Number.isNaN(completedDate.getTime())) return false;
            return getLocalDateKey(completedDate) <= task.dueDate;
        }).length;

        const onTimeRate = Math.round((onTimeCount / completedWithDue.length) * 100);
        document.getElementById("kpiOnTimeRate").textContent = `${onTimeRate}%`;
        document.getElementById("kpiOnTimeSub").textContent =
            `${onTimeCount} of ${completedWithDue.length} delivered on time`;
    }

    // 3. Active Backlog & Overdue Count
    const todayStr = getLocalDateKey(new Date());
    const overdueCount = activeTasks.filter(
        t => t.dueDate && t.dueDate < todayStr
    ).length;

    document.getElementById("kpiActiveBacklog").textContent = activeTasks.length;
    document.getElementById("kpiOverdueSub").textContent =
        `${overdueCount} overdue ${overdueCount === 1 ? "task" : "tasks"}`;

    // 4. All-Time Most Productive Weekday
    const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weekdayCounts = new Array(7).fill(0);

    completedTasks.forEach(task => {
        if (!task.completedAt) return;
        const dt = new Date(task.completedAt);
        if (!Number.isNaN(dt.getTime())) {
            weekdayCounts[dt.getDay()] += 1;
        }
    });

    const maxCompletions = Math.max(...weekdayCounts);

    if (maxCompletions === 0) {
        document.getElementById("kpiPeakWeekday").textContent = "--";
        document.getElementById("kpiPeakWeekdaySub").textContent = "No completed tasks yet";
    } else {
        const bestIndex = weekdayCounts.indexOf(maxCompletions);
        document.getElementById("kpiPeakWeekday").textContent = weekdayNames[bestIndex];
        document.getElementById("kpiPeakWeekdaySub").textContent =
            `${maxCompletions} ${maxCompletions === 1 ? "task" : "tasks"} completed on ${weekdayNames[bestIndex]}s`;
    }

}


// ========================================
// 2. Multi-Period Completion Trends Chart
// ========================================

function getTrendChartDataset(range) {

    const tasks = typeof getTasks === "function" ? getTasks() : [];
    const completedTasks = tasks.filter(t => t.status === "completed" && t.completedAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (range === "weekly") {

        const labels = [];
        const counts = [];
        const currentMonday = getMondayStart(today);

        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date(currentMonday);
            weekStart.setDate(weekStart.getDate() - i * 7);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            const startKey = getLocalDateKey(weekStart);
            const endKey = getLocalDateKey(weekEnd);

            const label = weekStart.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric"
            });

            const count = completedTasks.filter(task => {
                const dt = new Date(task.completedAt);
                if (Number.isNaN(dt.getTime())) return false;
                const key = getLocalDateKey(dt);
                return key >= startKey && key <= endKey;
            }).length;

            labels.push(label);
            counts.push(count);
        }

        return {
            subtitle: "Weekly completed tasks over the last 8 weeks",
            labels,
            counts
        };

    }

    if (range === "monthly") {

        const labels = [];
        const counts = [];

        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const targetYear = monthDate.getFullYear();
            const targetMonth = monthDate.getMonth();

            const label = monthDate.toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit"
            });

            const count = completedTasks.filter(task => {
                const dt = new Date(task.completedAt);
                if (Number.isNaN(dt.getTime())) return false;
                return dt.getFullYear() === targetYear && dt.getMonth() === targetMonth;
            }).length;

            labels.push(label);
            counts.push(count);
        }

        return {
            subtitle: "Monthly completed tasks over the last 6 months",
            labels,
            counts
        };

    }

    // Default: "daily" (Last 7 Days)
    const labels = [];
    const counts = [];

    for (let i = 6; i >= 0; i--) {
        const dayDate = new Date(today);
        dayDate.setDate(dayDate.getDate() - i);

        const dateKey = getLocalDateKey(dayDate);
        const label = dayDate.toLocaleDateString("en-US", {
            weekday: "short",
            day: "numeric"
        });

        const count = completedTasks.filter(task => {
            const dt = new Date(task.completedAt);
            if (Number.isNaN(dt.getTime())) return false;
            return getLocalDateKey(dt) === dateKey;
        }).length;

        labels.push(label);
        counts.push(count);
    }

    return {
        subtitle: "Daily completed tasks over the last 7 days",
        labels,
        counts
    };

}

function renderTrendChart() {

    const canvas = document.getElementById("trendChart");
    const subtitleEl = document.getElementById("trendSubtitle");

    if (!canvas || typeof Chart === "undefined") return;

    const trendData = getTrendChartDataset(activeTrendRange);

    if (subtitleEl) {
        subtitleEl.textContent = trendData.subtitle;
    }

    if (trendChartInstance) {
        trendChartInstance.destroy();
    }

    trendChartInstance = new Chart(canvas, {
        type: "line",
        data: {
            labels: trendData.labels,
            datasets: [{
                label: "Completed Tasks",
                data: trendData.counts,
                borderColor: "#873bd8",
                backgroundColor: "rgba(135, 59, 216, 0.14)",
                borderWidth: 3,
                fill: true,
                tension: 0.35,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: "#873bd8"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    },
                    grid: {
                        color: "#f1ebf9"
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

}


// ========================================
// 3. Priority-wise Performance Chart
// ========================================

function renderPriorityChart() {

    const canvas = document.getElementById("priorityChart");
    if (!canvas || typeof Chart === "undefined") return;

    const tasks = typeof getTasks === "function" ? getTasks() : [];
    const levels = ["High", "Medium", "Low"];

    const completedCounts = levels.map(level =>
        tasks.filter(t =>
            t.status === "completed" &&
            (t.priority || "").toLowerCase() === level.toLowerCase()
        ).length
    );

    const pendingCounts = levels.map(level =>
        tasks.filter(t =>
            t.status !== "completed" &&
            (t.priority || "").toLowerCase() === level.toLowerCase()
        ).length
    );

    if (priorityChartInstance) {
        priorityChartInstance.destroy();
    }

    priorityChartInstance = new Chart(canvas, {
        type: "bar",
        data: {
            labels: levels,
            datasets: [
                {
                    label: "Completed",
                    data: completedCounts,
                    backgroundColor: "#7655e8",
                    borderRadius: 8
                },
                {
                    label: "Pending",
                    data: pendingCounts,
                    backgroundColor: "#dfd0fa",
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        usePointStyle: true,
                        padding: 18
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    },
                    grid: {
                        color: "#f1ebf9"
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

}


// ========================================
// 4. Category Completed vs Pending Chart
// ========================================

function renderCategoryStatusChart() {

    const canvas = document.getElementById("categoryStatusChart");
    if (!canvas || typeof Chart === "undefined") return;

    const tasks = typeof getTasks === "function" ? getTasks() : [];
    const categories = ["Work", "Personal", "Study"];

    const completedCounts = categories.map(cat =>
        tasks.filter(t =>
            t.status === "completed" &&
            (t.category || "").toLowerCase() === cat.toLowerCase()
        ).length
    );

    const pendingCounts = categories.map(cat =>
        tasks.filter(t =>
            t.status !== "completed" &&
            (t.category || "").toLowerCase() === cat.toLowerCase()
        ).length
    );

    if (categoryStatusChartInstance) {
        categoryStatusChartInstance.destroy();
    }

    categoryStatusChartInstance = new Chart(canvas, {
        type: "bar",
        data: {
            labels: categories,
            datasets: [
                {
                    label: "Completed",
                    data: completedCounts,
                    backgroundColor: "#63b8a5",
                    borderRadius: 8
                },
                {
                    label: "Pending",
                    data: pendingCounts,
                    backgroundColor: "#b47bea",
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        usePointStyle: true,
                        padding: 18
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    },
                    grid: {
                        color: "#f1ebf9"
                    }
                }
            }
        }
    });

}


// ========================================
// Start Analytics Page
// ========================================

loadAnalyticsPage();