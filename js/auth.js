import { db } from './db.js';

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Check session storage for quick reloads
        try {
            const sessionUser = sessionStorage.getItem('pointify_user');
            if (sessionUser) {
                this.currentUser = JSON.parse(sessionUser);
                this.onLoginSuccess();
            } else {
                this.showLogin();
            }
        } catch (e) {
            console.error("Auth Init Error", e);
        }

        this.bindEvents();
    }

    showLogin() {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app-shell').classList.add('hidden');
    }

    bindEvents() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            // Remove old listeners by cloning (optional but safer) or just adding new one
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const usernameInput = document.getElementById('username').value;
        const passwordInput = document.getElementById('password').value;
        const errorMsg = document.getElementById('login-error');

        if (!usernameInput || !passwordInput) {
            alert("Please enter both username and password");
            return;
        }

        try {
            const user = await this.authenticate(usernameInput, passwordInput);
            if (user) {
                this.currentUser = user;
                sessionStorage.setItem('pointify_user', JSON.stringify(user));
                this.onLoginSuccess();
                if (errorMsg) errorMsg.classList.add('hidden');
            } else {
                if (errorMsg) {
                    errorMsg.textContent = "Invalid username or password.";
                    errorMsg.classList.remove('hidden');
                }
            }
        } catch (err) {
            console.error("Login error:", err);
            if (errorMsg) {
                errorMsg.textContent = "System error during login.";
                errorMsg.classList.remove('hidden');
            }
        }
    }

    async authenticate(username, password) {
        // We query by username.
        const allUsers = await db.getAll('users');
        // Simple string comparison
        const user = allUsers.find(u => u.username === username && u.password === password);
        return user;
    }

    onLoginSuccess() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-shell').classList.remove('hidden');

        // Update UI with user info
        if (this.currentUser) {
            const nameEl = document.getElementById('user-name');
            const roleEl = document.getElementById('user-role');
            const avEl = document.getElementById('user-avatar');

            if (nameEl) nameEl.textContent = this.currentUser.name || this.currentUser.username;
            if (roleEl) roleEl.textContent = (this.currentUser.role || 'user').toUpperCase();
            if (avEl) avEl.textContent = (this.currentUser.name || this.currentUser.username)[0].toUpperCase();

            this.applyRBAC();
            window.showToast(`Welcome back, ${this.currentUser.username}`);
        }

        // Default to POS view
        if (window.switchView) window.switchView('pos');
    }

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('pointify_user');
        document.getElementById('app-shell').classList.add('hidden');
        document.getElementById('auth-screen').classList.remove('hidden');

        // Reset inputs
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }

    applyRBAC() {
        if (!this.currentUser) return;
        const role = this.currentUser.role;
        const navItems = document.querySelectorAll('[data-view]');

        navItems.forEach(item => {
            const view = item.dataset.view;
            let allowed = true;

            if (role === 'cashier') {
                if (['inventory', 'settings', 'users'].includes(view)) allowed = false;
            } else if (role === 'manager') {
                if (['users', 'settings'].includes(view)) allowed = false;
            }

            if (!allowed) {
                item.classList.add('hide');
            } else {
                item.classList.remove('hide');
            }
        });
    }

    // Global permission check for router
    checkPermission(view) {
        if (!this.currentUser) return false;
        const role = this.currentUser.role;

        if (role === 'admin') return true;
        if (role === 'cashier' && ['pos', 'reports'].includes(view)) return true;
        if (role === 'manager' && ['pos', 'inventory', 'reports'].includes(view)) return true;

        return false;
    }
}

// Export singleton
export const auth = new AuthSystem();

// Expose permission check for global router in index.html
window.checkPermission = (view) => auth.checkPermission(view);
