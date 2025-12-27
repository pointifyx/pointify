import { db } from './db.js';

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Check session storage for quick reloads
        const sessionUser = sessionStorage.getItem('pointify_user');
        if (sessionUser) {
            this.currentUser = JSON.parse(sessionUser);
            this.onLoginSuccess();
        } else {
            this.showLogin();
        }

        this.bindEvents();
    }

    bindEvents() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
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

        try {
            const user = await this.authenticate(usernameInput, passwordInput);
            if (user) {
                this.currentUser = user;
                sessionStorage.setItem('pointify_user', JSON.stringify(user));
                this.onLoginSuccess();
                errorMsg.classList.add('hidden');
            } else {
                errorMsg.textContent = "Invalid credentials";
                errorMsg.classList.remove('hidden');
            }
        } catch (err) {
            console.error("Login error:", err);
            errorMsg.textContent = "System error during login";
            errorMsg.classList.remove('hidden');
        }
    }

    async authenticate(username, password) {
        // In a real app, hash passwords. Here we compare simple strings as requested for the prototype level, 
        // but db.js initializes with 'admin'/'123'. 
        // We need to query by username.
        const allUsers = await db.getAll('users');
        // In production with many users, we would use the index 'username'
        // For now, getAll is fine as we likely have few users.
        const user = allUsers.find(u => u.username === username && u.password === password);
        return user;
    }

    onLoginSuccess() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-shell').classList.remove('hidden');

        // Update UI with user info
        document.getElementById('user-name').textContent = this.currentUser.name || this.currentUser.username;
        document.getElementById('user-role').textContent = this.currentUser.role.toUpperCase();
        document.getElementById('user-avatar').textContent = (this.currentUser.name || this.currentUser.username)[0].toUpperCase();

        this.applyRBAC();

        // Default to POS view
        window.switchView('pos');
        window.showToast(`Welcome back, ${this.currentUser.username}`);
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
        const role = this.currentUser.role;
        const navItems = document.querySelectorAll('[data-view]');

        // RBAC Rules
        // Admin: All
        // Manager: Inventory, Reports. Hide Users (not in nav yet but conceptually), Settings maybe? 
        // Request says: Manager: Access to Inventory/Reports. Hide "Users" and "Settings".
        // Cashier: POS only. Hide "Reports", "Inventory", "Settings".

        navItems.forEach(item => {
            const view = item.dataset.view;
            let allowed = true;

            if (role === 'cashier') {
                if (['inventory', 'reports', 'settings', 'users'].includes(view)) allowed = false;
            } else if (role === 'manager') {
                if (['users', 'settings'].includes(view)) allowed = false;
            }

            if (!allowed) {
                item.classList.add('hide'); // Uses the .hide css class defined in index.html
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
        if (role === 'cashier' && view === 'pos') return true;
        // Manager can access POS, Inventory, Reports
        if (role === 'manager' && ['pos', 'inventory', 'reports'].includes(view)) return true;

        return false;
    }
}

// Export singleton
export const auth = new AuthSystem();

// Expose permission check for global router in index.html
window.checkPermission = (view) => auth.checkPermission(view);
