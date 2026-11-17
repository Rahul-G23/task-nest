// ========================================
// TaskNest - Sidebar Component & Session Guard
// ========================================

function enforcePageAuth() {

    const isSubpage = window.location.pathname.includes("/pages/");
    const currentUser = localStorage.getItem("tasknest_current_user");

    if (isSubpage && !currentUser) {
        window.location.href = "../index.html";
    }

}

enforcePageAuth();


// Load the reusable sidebar component

async function loadSidebar() {

    const sidebarContainer = document.getElementById("sidebar-container");

    if (!sidebarContainer) return;

    try {

        const response = await fetch("../components/sidebar.html");

        if (!response.ok) {
            throw new Error("Unable to load sidebar");
        }

        const sidebarHTML = await response.text();

        sidebarContainer.innerHTML = sidebarHTML;

        setActiveNavigation();
        setupSidebarActions();

    } catch (error) {

        console.error("Sidebar loading error:", error);

    }

}


// Highlight only the current page

function setActiveNavigation() {

    const currentPage = window.location.pathname.split("/").pop();

    const navigationLinks = document.querySelectorAll(".nav-link");

    navigationLinks.forEach(link => {

        const linkPage = link.getAttribute("href");

        link.classList.toggle(
            "active",
            linkPage === currentPage
        );

    });

}


// Handle Logout & Sidebar Actions

function setupSidebarActions() {

    const navigationLinks = document.querySelectorAll(".sidebar .nav-link");

    navigationLinks.forEach(link => {

        const labelText = link.textContent.trim().toLowerCase();

        if (labelText.includes("logout")) {

            link.addEventListener("click", (event) => {
                event.preventDefault();
                localStorage.removeItem("tasknest_current_user");
                window.location.href = "../index.html";
            });

        }

    });

}


loadSidebar();