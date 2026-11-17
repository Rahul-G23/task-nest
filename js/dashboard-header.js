// ========================================
// TaskNest - Dashboard Header Component
// ========================================

async function loadDashboardHeader() {

    const container = document.getElementById("header-container");

    if (!container) return;

    try {
        const response = await fetch("../components/dashboard-header.html");

        if (!response.ok) {
            throw new Error("Unable to load dashboard header");
        }

        container.innerHTML = await response.text();

        populateHeaderUserProfile();
        initializeGlobalSearch();

    } catch (error) {
        console.error("Header loading error:", error);
    }

}


// Display the logged-in user's name, email, and initial avatar

function populateHeaderUserProfile() {

    try {
        const rawUser = localStorage.getItem("tasknest_current_user");
        if (!rawUser) return;

        const user = JSON.parse(rawUser);
        if (!user || !user.name) return;

        const avatarEl = document.querySelector(".user-profile .user-avatar");
        const nameEl = document.querySelector(".user-profile .user-details h4");
        const emailEl = document.querySelector(".user-profile .user-details p");

        if (avatarEl) {
            avatarEl.textContent = user.name.trim().charAt(0).toUpperCase();
        }

        if (nameEl) {
            nameEl.textContent = user.name;
        }

        if (emailEl && user.email) {
            emailEl.textContent = user.email;
        }

    } catch (error) {
        console.error("Error populating header user profile:", error);
    }

}


// Wire up Global Header Search across all pages

function initializeGlobalSearch() {

    const searchInput = document.getElementById("globalSearch");
    if (!searchInput) return;

    const isTasksPage = window.location.pathname.endsWith("tasks.html");

    // Pre-fill search input if navigated via ?search=...
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("search") || "";

    if (initialQuery) {
        searchInput.value = initialQuery;
        window.taskNestSearchQuery = initialQuery;
    }

    // Keyboard shortcut: Cmd+F / Ctrl+F focuses #globalSearch
    document.addEventListener("keydown", (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
            event.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    });

    // Live filtering on My Tasks page
    searchInput.addEventListener("input", () => {
        const query = searchInput.value;
        window.taskNestSearchQuery = query;

        if (isTasksPage) {
            window.dispatchEvent(
                new CustomEvent("globalSearchUpdated", {
                    detail: { query }
                })
            );
        }
    });

    // Pressing Enter on any other page navigates to tasks.html?search=...
    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            const query = searchInput.value.trim();

            if (!isTasksPage && query) {
                window.location.href = `tasks.html?search=${encodeURIComponent(query)}`;
            }
        }

        if (event.key === "Escape" && searchInput.value) {
            searchInput.value = "";
            window.taskNestSearchQuery = "";

            if (isTasksPage) {
                window.dispatchEvent(
                    new CustomEvent("globalSearchUpdated", {
                        detail: { query: "" }
                    })
                );
            }
        }
    });

}


loadDashboardHeader();