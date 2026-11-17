// ========================================
// TaskNest - Task Form Component
// ========================================

async function loadTaskForm() {

    const container = document.getElementById("task-form-container");

    if (!container) {
        console.error("Task form container not found");
        return;
    }

    try {

        const response = await fetch("../components/task-form.html");

        if (!response.ok) {
            throw new Error("Unable to load task form");
        }

        container.innerHTML = await response.text();

        initializeTaskForm();

    } catch (error) {

        console.error("Task Form Loading Error:", error);

    }

}


// ========================================
// Apply Saved Default Category & Priority
// ========================================

function applySavedTaskFormDefaults() {

    if (typeof getUserTaskPreferences !== "function") return;

    const prefs = getUserTaskPreferences();
    const categorySelect = document.getElementById("taskCategory");
    const prioritySelect = document.getElementById("taskPriority");

    if (categorySelect && prefs.defaultCategory) {
        categorySelect.value = prefs.defaultCategory;
    }

    if (prioritySelect && prefs.defaultPriority) {
        prioritySelect.value = prefs.defaultPriority;
    }

}


// ========================================
// Initialize Task Form
// ========================================

function initializeTaskForm() {

    const overlay = document.getElementById("taskModalOverlay");
    const form = document.getElementById("taskForm");

    const closeButton = document.getElementById("closeTaskModal");
    const cancelButton = document.getElementById("cancelTaskBtn");

    const titleInput = document.getElementById("taskTitle");


    // Open Modal

    window.openTaskModal = function () {

        form.reset();
        applySavedTaskFormDefaults();

        overlay.classList.add("show");

        titleInput.focus();

    };


    // Close Modal

    function closeTaskModal() {

        overlay.classList.remove("show");

        form.reset();
        applySavedTaskFormDefaults();

        document.getElementById("taskFormHeading").textContent =
            "Create New Task";

        document.getElementById("saveTaskBtn").textContent =
            "Create Task";

    }


    closeButton.addEventListener("click", closeTaskModal);

    cancelButton.addEventListener("click", closeTaskModal);


    // Close when clicking outside

    overlay.addEventListener("click", (event) => {

        if (event.target === overlay) {
            closeTaskModal();
        }

    });


    // Close using Escape

    document.addEventListener("keydown", (event) => {

        if (
            event.key === "Escape" &&
            overlay.classList.contains("show")
        ) {

            closeTaskModal();

        }

    });


    // Handle Form Submission

    form.addEventListener("submit", (event) => {

        event.preventDefault();

        if (!form.checkValidity()) {

            form.reportValidity();

            return;

        }


        const taskData = {

            title: titleInput.value.trim(),

            description: document.getElementById("taskDescription").value.trim(),

            category: document.getElementById("taskCategory").value,

            priority: document.getElementById("taskPriority").value,

            dueDate: document.getElementById("taskDueDate").value,

            dueTime: document.getElementById("taskDueTime").value,

            status: document.getElementById("taskStatus").value

        };


        if (!taskData.title) {

            titleInput.focus();

            return;

        }


        // Dispatch task data

        window.dispatchEvent(
            new CustomEvent("taskFormSubmitted", {
                detail: taskData
            })
        );


        console.log("Task form data:", taskData);

        alert("Form submitted successfully!");

        closeTaskModal();

        // Dispatch task data

        window.dispatchEvent(
            new CustomEvent("taskFormSubmitted", {
                detail: taskData
            })
        );

        closeTaskModal();

    });


}