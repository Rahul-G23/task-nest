// Load Task Management Page

async function loadTasksPage() {

    const container = document.getElementById("tasks-page-container");

    try {

        const response = await fetch("../components/tasks-page.html");

        if (!response.ok) {
            throw new Error("Unable to load tasks page");
        }

        container.innerHTML = await response.text();

        // Load the reusable task form
        await loadTaskForm();

        // Initialize page buttons
        initializeTaskPageButtons();

        // Display saved tasks
        renderTasks();

    } catch (error) {

        console.error("Tasks Page Loading Error:", error);

    }

}


// Initialize Task Page Buttons

function initializeTaskPageButtons() {

    const addTaskButton = document.getElementById("addTaskButton");

    function openTaskForm() {

        if (typeof window.openTaskModal === "function") {

            window.openTaskModal();

        } else {

            console.error("Task form is not initialized");

        }

    }

    addTaskButton.addEventListener("click", openTaskForm);

}


// Start Task Page

loadTasksPage();