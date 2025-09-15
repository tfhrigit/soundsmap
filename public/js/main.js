class MapSOunds {
    constructor() {
        this.theme = 'dark';
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuth();
    }

    setupEventListeners() {
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('login-btn').addEventListener('click', () => this.showLoginModal());
        document.getElementById('register-btn').addEventListener('click', () => this.showRegisterModal());
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        document.getElementById('profile-btn').addEventListener('click', () => this.showProfile());
        document.getElementById('explore-map-btn').addEventListener('click', () => this.showMap());
        document.getElementById('back-to-landing').addEventListener('click', () => this.showLanding());
        
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
        
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => this.closeModal());
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.theme);
        const icon = document.querySelector('#theme-toggle i');
        icon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    showLoginModal() {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        modalTitle.textContent = 'Login to Your Account';
        modalBody.innerHTML = `
            <form id="login-form">
                <div class="form-group">
                    <label for="login-email">Email</label>
                    <input type="email" id="login-email" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="login-password">Password</label>
                    <input type="password" id="login-password" class="form-control" required>
                </div>
                <button type="submit" class="btn btn-block">Login</button>
                <p class="text-center mt-2 text-secondary">
                    Don't have an account? <a href="#" id="switch-to-register" class="text-secondary">Register</a>
                </p>
            </form>
        `;
        
        modal.classList.remove('hidden');
        
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
        
        document.getElementById('switch-to-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterModal();
        });
    }

    showRegisterModal() {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        modalTitle.textContent = 'Create New Account';
        modalBody.innerHTML = `
            <form id="register-form">
                <div class="form-group">
                    <label for="register-name">Full Name</label>
                    <input type="text" id="register-name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="register-email">Email</label>
                    <input type="email" id="register-email" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="register-password">Password</label>
                    <input type="password" id="register-password" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="register-bio">Bio (Optional)</label>
                    <textarea id="register-bio" class="form-control" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-block">Create Account</button>
                <p class="text-center mt-2 text-secondary">
                    Already have an account? <a href="#" id="switch-to-login" class="text-secondary">Login</a>
                </p>
            </form>
        `;
        
        modal.classList.remove('hidden');
        
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });
        
        document.getElementById('switch-to-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginModal();
        });
    }

    async login() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.token);
                this.currentUser = data.user;
                this.updateAuthUI();
                this.closeModal();
                this.showNotification('Login successful!', 'success');
            } else {
                this.showNotification(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            this.showNotification('Network error. Please try again.', 'error');
        }
    }

    async register() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const bio = document.getElementById('register-bio').value;
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password, bio })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showNotification('Registration successful! Please login.', 'success');
                this.showLoginModal();
            } else {
                this.showNotification(data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            this.showNotification('Network error. Please try again.', 'error');
        }
    }

    logout() {
        localStorage.removeItem('token');
        this.currentUser = null;
        this.updateAuthUI();
        this.showLanding();
        this.showNotification('You have been logged out', 'success');
    }

    showProfile() {
        if (!this.currentUser) return;
        
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        modalTitle.textContent = 'Your Profile';
        modalBody.innerHTML = `
            <div class="text-center mb-2">
                <div class="profile-avatar" style="width: 80px; height: 80px; border-radius: 50%; background: var(--accent); margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold;">
                    ${this.currentUser.name.charAt(0).toUpperCase()}
                </div>
                <h3 class="mt-1">${this.currentUser.name}</h3>
                <p class="text-secondary">${this.currentUser.email}</p>
                ${this.currentUser.bio ? `<p>${this.currentUser.bio}</p>` : ''}
            </div>
            <div class="mt-2">
                <button id="view-my-sounds" class="btn btn-block btn-outline">
                    <i class="fas fa-music"></i>
                    View My Sounds
                </button>
            </div>
        `;
        
        modal.classList.remove('hidden');
        
        document.getElementById('view-my-sounds').addEventListener('click', () => {
            this.closeModal();
        });
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        if (token) {
            this.loadUser(token);
        } else {
            this.updateAuthUI();
        }
    }

    async loadUser(token) {
        try {
            const response = await fetch('/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const user = await response.json();
                this.currentUser = user;
                this.updateAuthUI();
            } else {
                localStorage.removeItem('token');
                this.updateAuthUI();
            }
        } catch (error) {
            localStorage.removeItem('token');
            this.updateAuthUI();
        }
    }

    updateAuthUI() {
        if (this.currentUser) {
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('user-section').classList.remove('hidden');
            document.getElementById('user-name-display').textContent = this.currentUser.name;
        } else {
            document.getElementById('auth-section').classList.remove('hidden');
            document.getElementById('user-section').classList.add('hidden');
        }
    }

    showLanding() {
        document.getElementById('landing-page').classList.remove('hidden');
        document.getElementById('map-section').classList.add('hidden');
    }

    showMap() {
        document.getElementById('landing-page').classList.add('hidden');
        document.getElementById('map-section').classList.remove('hidden');
        initMap();
    }

    closeModal() {
        document.getElementById('modal').classList.add('hidden');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 3000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transform: translateX(120%);
            transition: transform 0.3s ease;
            background-color: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : 'var(--accent)'};
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(120%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new MapSOunds();
});