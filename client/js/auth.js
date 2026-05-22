/* ===== Himalaya Enterprises - Auth (API + localStorage fallback) ===== */

const Auth = {
  USERS_KEY: 'he-users',
  SESSION_KEY: 'he-session',

  init() {
    this.seedUsers();
    this.updateUI();
  },

  seedUsers() {
    if (localStorage.getItem(this.USERS_KEY)) return;
    const users = [
      { id: 'sup1', name: 'Himalaya Admin', email: 'admin@himalayaentp.com', password: 'admin123', role: 'supplier' },
      { id: 'buy1', name: 'Ramesh Kumar', email: 'ramesh@example.com', password: 'buyer123', role: 'buyer' },
      { id: 'buy2', name: 'Suresh Traders', email: 'suresh@example.com', password: 'buyer123', role: 'buyer' }
    ];
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  },

  getUsers() {
    return JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
  },

  getSession() {
    const data = localStorage.getItem(this.SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },

  isLoggedIn() {
    return !!this.getSession();
  },

  getRole() {
    const s = this.getSession();
    return s ? s.role : null;
  },

  /* localStorage-based login (fallback) */
  _loginLocal(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { success: false, message: 'Invalid email or password.' };
    const session = { id: user.id, name: user.name, email: user.email, role: user.role };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    this.updateUI();
    return { success: true, user: session };
  },

  /* localStorage-based register (fallback) */
  _registerLocal(name, email, password) {
    const users = this.getUsers();
    if (users.find(u => u.email === email)) {
      return { success: false, message: 'Email already registered.' };
    }
    const newUser = { id: App.generateId(), name, email, password, role: 'buyer' };
    users.push(newUser);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    const session = { id: newUser.id, name, email, role: 'buyer' };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    this.updateUI();
    return { success: true, user: session };
  },

  /* API-backed login */
  async login(email, password) {
    const online = await API.check();
    if (!online) return this._loginLocal(email, password);
    try {
      const data = await API.post('/auth/login', { email, password });
      API.setToken(data.token);
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(data.user));
      this.updateUI();
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  /* API-backed register */
  async register(name, email, password) {
    const online = await API.check();
    if (!online) return this._registerLocal(name, email, password);
    try {
      const data = await API.post('/auth/register', { name, email, password });
      API.setToken(data.token);
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(data.user));
      this.updateUI();
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    API.setToken(null);
    this.updateUI();
    window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
  },

  updateUI() {
    const session = this.getSession();
    const loginBtn = document.getElementById('loginBtn');
    const userMenuEl = document.getElementById('userMenu');
    const avatarEl = document.getElementById('userAvatar');
    const userNameEl = document.getElementById('userName');
    const cartBtn = document.getElementById('cartBtn');

    if (session) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userMenuEl) {
        userMenuEl.style.display = 'block';
        if (avatarEl) avatarEl.textContent = session.name.charAt(0).toUpperCase();
        if (userNameEl) userNameEl.textContent = session.name;
      }
      if (cartBtn) cartBtn.style.display = session.role === 'buyer' ? 'flex' : 'none';
      const dashLink = document.getElementById('dashLink');
      if (dashLink) {
        const base = window.location.pathname.includes('/pages/') ? '' : 'pages/';
        dashLink.href = base + (session.role === 'supplier' ? 'supplier.html' : 'buyer.html');
        dashLink.textContent = session.role === 'supplier' ? 'Supplier Dashboard' : 'Buyer Dashboard';
      }
    } else {
      if (loginBtn) loginBtn.style.display = 'inline-flex';
      if (userMenuEl) userMenuEl.style.display = 'none';
      if (cartBtn) cartBtn.style.display = 'none';
    }
  },

  showLoginModal(tab) {
    App.openModal('loginModal');
    if (tab === 'register') {
      this.switchLoginTab('register');
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) {
      App.showToast('Please fill in all fields.', 'warning');
      return;
    }
    const result = await this.login(email, password);
    if (result.success) {
      App.closeModal('loginModal');
      App.showToast(`Welcome back, ${result.user.name}!`, 'success');
      const base = window.location.pathname.includes('/pages/') ? '' : 'pages/';
      if (result.user.role === 'supplier') {
        setTimeout(() => { window.location.href = base + 'supplier.html'; }, 500);
      } else {
        // Re-render catalog so product cards reflect logged-in buyer state
        if (typeof Catalog !== 'undefined') {
          Catalog.renderHomeProducts();
          Catalog.renderCatalogPage();
        }
      }
    } else {
      App.showToast(result.message, 'error');
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    if (!name || !email || !password) {
      App.showToast('Please fill in all fields.', 'warning');
      return;
    }
    if (password.length < 6) {
      App.showToast('Password must be at least 6 characters.', 'warning');
      return;
    }
    const result = await this.register(name, email, password);
    if (result.success) {
      // Clear auto-login session so user logs in explicitly
      localStorage.removeItem(this.SESSION_KEY);
      API.setToken(null);
      this.updateUI();

      // Switch to Login tab and pre-fill email
      this.switchLoginTab('login');
      const loginEmail = document.getElementById('loginEmail');
      if (loginEmail) loginEmail.value = email;

      // Clear register form
      document.getElementById('regName').value = '';
      document.getElementById('regEmail').value = '';
      document.getElementById('regPassword').value = '';

      App.showToast('Account created successfully! Please login.', 'success');
    } else {
      App.showToast(result.message, 'error');
    }
  },

  switchLoginTab(tab) {
    document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.login-form').forEach(f => f.style.display = 'none');
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(tab === 'login' ? 'loginForm' : 'registerForm').style.display = 'block';

    // Show/remove helper message on the register form
    const existing = document.getElementById('registerHelperMsg');
    if (tab === 'register') {
      if (!existing) {
        const msg = document.createElement('p');
        msg.id = 'registerHelperMsg';
        msg.style.cssText = 'background:var(--primary-light,#e8f4fd);color:var(--primary,#1a73e8);padding:10px 14px;border-radius:var(--radius-sm,6px);font-size:0.88rem;margin-bottom:12px;';
        msg.textContent = 'Create a free account to request quotes and track your orders.';
        const form = document.getElementById('registerForm');
        if (form) form.insertBefore(msg, form.firstChild);
      }
    } else if (existing) {
      existing.remove();
    }
  },

  requireAuth(role) {
    const session = this.getSession();
    if (!session) {
      App.showToast('Please login to continue.', 'warning');
      setTimeout(() => {
        window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
      }, 1000);
      return false;
    }
    if (role && session.role !== role) {
      App.showToast('Access denied. Wrong account type.', 'error');
      setTimeout(() => {
        window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
      }, 1000);
      return false;
    }
    return true;
  }
};

document.addEventListener('DOMContentLoaded', () => Auth.init());
