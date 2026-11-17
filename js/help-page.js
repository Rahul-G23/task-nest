// ========================================
// TaskNest - Help & Documentation Page
// ========================================

async function loadHelpPage() {

    const container = document.getElementById("help-page-container");

    if (!container) {
        console.error("Help page container not found");
        return;
    }

    try {

        const response = await fetch("../components/help-page.html");

        if (!response.ok) {
            throw new Error("Unable to load help page component");
        }

        container.innerHTML = await response.text();

        setupFaqAccordion();
        setupHelpSearch();

    } catch (error) {

        console.error("Help Page Error:", error);

    }

}


// ========================================
// Interactive FAQ Accordion
// ========================================

function setupFaqAccordion() {

    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach(item => {

        const trigger = item.querySelector(".faq-question");
        const icon = item.querySelector(".faq-icon");

        if (!trigger) return;

        trigger.addEventListener("click", () => {

            const isAlreadyOpen = item.classList.contains("active");

            // Close all items first for clean single-open behavior
            faqItems.forEach(otherItem => {
                otherItem.classList.remove("active");
                const otherIcon = otherItem.querySelector(".faq-icon");
                if (otherIcon) otherIcon.textContent = "+";
            });

            if (!isAlreadyOpen) {
                item.classList.add("active");
                if (icon) icon.textContent = "−";
            }

        });

    });

}


// ========================================
// Live Search Filter (Guides + FAQs)
// ========================================

function setupHelpSearch() {

    const searchInput = document.getElementById("helpSearchInput");
    const guideCards = document.querySelectorAll(".help-guide-card");
    const faqItems = document.querySelectorAll(".faq-item");
    const emptyState = document.getElementById("helpEmptyState");

    if (!searchInput) return;

    searchInput.addEventListener("input", () => {

        const query = searchInput.value.trim().toLowerCase();
        let visibleFaqs = 0;

        // Filter Feature Guide Cards
        guideCards.forEach(card => {
            const text = card.textContent.toLowerCase();
            const keywords = (card.getAttribute("data-keywords") || "").toLowerCase();
            const matches = !query || text.includes(query) || keywords.includes(query);

            card.classList.toggle("hidden", !matches);
        });

        // Filter FAQ Items
        faqItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            const keywords = (item.getAttribute("data-keywords") || "").toLowerCase();
            const matches = !query || text.includes(query) || keywords.includes(query);

            item.classList.toggle("hidden", !matches);

            if (matches) {
                visibleFaqs += 1;
                if (query) {
                    item.classList.add("active");
                    const icon = item.querySelector(".faq-icon");
                    if (icon) icon.textContent = "−";
                }
            }
        });

        if (emptyState) {
            emptyState.classList.toggle("hidden", visibleFaqs > 0);
        }

    });

}


// ========================================
// Start Help Page
// ========================================

loadHelpPage();