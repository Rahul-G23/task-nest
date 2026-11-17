// ========================================
// TaskNest - Authentication Manager
// ========================================

const AUTH_USERS_KEY = "tasknest_users";
const AUTH_SESSION_KEY = "tasknest_current_user";


// ========================================
// Storage Helpers
// ========================================

function getStoredUsers() {

    try {
        const raw = localStorage.getItem(AUTH_USERS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Error reading users from LocalStorage:", error);
        return [];
    }

}

function saveStoredUsers(users) {

    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));

}

function getCurrentUser() {

    try {
        const raw = localStorage.getItem(AUTH_SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.error("Error reading session from LocalStorage:", error);
        return null;
    }

}

function setCurrentUser(user) {

    const sessionData = {
        name: user.name,
        email: user.email,
        loggedInAt: new Date().toISOString()
    };

    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionData));

}


// ========================================
// Path Helpers (Root vs /pages/)
// ========================================

function isInsidePagesFolder() {

    return window.location.pathname.includes("/pages/");

}

function getLoginPageUrl() {

    return isInsidePagesFolder() ? "../index.html" : "index.html";

}

function getDashboardPageUrl() {

    return isInsidePagesFolder() ? "dashboard.html" : "pages/dashboard.html";

}


// ========================================
// Core Auth Actions
// ========================================

function registerUser(name, email, password) {

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
        return { success: false, message: "Please fill in all required fields." };
    }

    if (password.length < 6) {
        return { success: false, message: "Password must be at least 6 characters long." };
    }

    const users = getStoredUsers();
    const emailExists = users.some(user => user.email.toLowerCase() === cleanEmail);

    if (emailExists) {
        return { success: false, message: "An account with this email already exists." };
    }

    const newUser = {
        name: cleanName,
        email: cleanEmail,
        password: password,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveStoredUsers(users);
    setCurrentUser(newUser);

    return { success: true, user: newUser };

}

function loginUser(email, password) {

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
        return { success: false, message: "Please enter both email and password." };
    }

    const users = getStoredUsers();
    const matchedUser = users.find(
        user => user.email.toLowerCase() === cleanEmail && user.password === password
    );

    if (!matchedUser) {
        return { success: false, message: "Invalid email or password. Please try again." };
    }

    setCurrentUser(matchedUser);

    return { success: true, user: matchedUser };

}

function logoutUser() {

    localStorage.removeItem(AUTH_SESSION_KEY);
    window.location.href = getLoginPageUrl();

}


// ========================================
// Route Protection Guards
// ========================================

function requireAuth() {

    const user = getCurrentUser();

    if (!user && isInsidePagesFolder()) {
        window.location.href = getLoginPageUrl();
    }

}

function redirectIfAuthenticated() {

    const user = getCurrentUser();

    if (user && !isInsidePagesFolder()) {
        window.location.href = getDashboardPageUrl();
    }

}