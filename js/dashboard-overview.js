// ========================================
// TaskNest - Dashboard Overview
// ========================================


// Load Dashboard Overview Component

async function loadDashboardOverview() {

    const container = document.getElementById("overview-container");

    try {

        const response = await fetch("../components/dashboard-overview.html");

        if (!response.ok) {
            throw new Error("Unable to load dashboard overview");
        }

        container.innerHTML = await response.text();


        // Load reusable task form

        await loadTaskForm();


        // Initialize dashboard buttons

        initializeOverviewButtons();


        // Display task statistics

        updateDashboardStats();


        // Listen for task changes

        window.addEventListener("tasksUpdated", updateDashboardStats);


    } catch (error) {

        console.error("Dashboard Overview Error:", error);

    }

}


// ========================================
// Dashboard Buttons
// ========================================

function initializeOverviewButtons() {

    const addTaskBtn = document.getElementById("addTaskBtn");

    const viewTasksBtn = document.getElementById("viewTasksBtn");


    // Add Task

    addTaskBtn.addEventListener("click", () => {

        if (typeof window.openTaskModal === "function") {

            window.openTaskModal();

        } else {

            console.error("Task form is not available");

        }

    });


    // View Tasks

    viewTasksBtn.addEventListener("click", () => {

        window.location.href = "tasks.html";

    });

}


// ========================================
// Update Dashboard Statistics
// ========================================

function updateDashboardStats() {

    const tasks = getTasks();


    // Calculate total tasks

    const total = tasks.length;


    // Calculate completed tasks

    const completed = tasks.filter(
        task => task.status === "completed"
    ).length;


    // Calculate active tasks

    const active = tasks.filter(
        task => task.status === "active"
    ).length;


    // Calculate overdue tasks

    const today = new Date();

    const localToday = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");


    const overdue = tasks.filter(task => {

        return (
            task.status === "active" &&
            task.dueDate < localToday
        );

    }).length;


    // Update HTML elements

    document.getElementById("totalTasks").textContent = total;

    document.getElementById("completedTasks").textContent = completed;

    document.getElementById("activeTasks").textContent = active;

    document.getElementById("overdueTasks").textContent = overdue;

}


// ========================================
// Start Dashboard
// ========================================

loadDashboardOverview();