/* ===== Himalaya Enterprises - Main App Logic ===== */

/* --- API Helper (talks to backend when Docker stack is running) --- */
const API = {
  BASE: '/api',
  token: localStorage.getItem('he-token') || null,

  isAvailable: null, // cached after first check

  async check() {
    if (this.isAvailable !== null) return this.isAvailable;
    try {
      const r = await fetch(this.BASE + '/health', { signal: AbortSignal.timeout(2000) });
      this.isAvailable = r.ok;
    } catch {
      this.isAvailable = false;
    }
    return this.isAvailable;
  },

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('he-token', token);
    else localStorage.removeItem('he-token');
  },

  headers() {
    const h = { 'Content-Type': 'application/json' };
    if (this.token) h['Authorization'] = 'Bearer ' + this.token;
    return h;
  },

  async get(path) {
    const r = await fetch(this.BASE + path, { headers: this.headers() });
    if (!r.ok) throw new Error((await r.json()).error || r.statusText);
    return r.json();
  },

  async post(path, body) {
    const r = await fetch(this.BASE + path, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || r.statusText);
    return data;
  },

  async put(path, body) {
    const r = await fetch(this.BASE + path, { method: 'PUT', headers: this.headers(), body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || r.statusText);
    return data;
  },

  async patch(path, body) {
    const r = await fetch(this.BASE + path, { method: 'PATCH', headers: this.headers(), body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || r.statusText);
    return data;
  },

  async del(path) {
    const r = await fetch(this.BASE + path, { method: 'DELETE', headers: this.headers() });
    if (!r.ok) throw new Error((await r.json()).error || r.statusText);
    return r.json();
  }
};

const App = {
  init() {
    this.initTheme();
    this.initNavbar();
    this.initScrollAnimations();
    this.initBackToTop();
    this.initToastContainer();
    this.highlightActiveNav();
    this.initCounters();
    this.initParallax();
  },

  /* --- Dark / Light Mode --- */
  initTheme() {
    const saved = localStorage.getItem('he-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    const btn = document.getElementById('themeToggle');
    if (btn) {
      this.updateThemeIcon(btn, saved);
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('he-theme', next);
        this.updateThemeIcon(btn, next);
      });
    }
  },

  updateThemeIcon(btn, theme) {
    btn.innerHTML = theme === 'dark' ? '&#9788;' : '&#9790;';
    btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  },

  /* --- Navbar Scroll & Hamburger --- */
  initNavbar() {
    const header = document.querySelector('.header');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    window.addEventListener('scroll', () => {
      if (header) header.classList.toggle('scrolled', window.scrollY > 20);
    });

    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
      });
      // Close on link click
      navLinks.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          hamburger.classList.remove('active');
          navLinks.classList.remove('open');
        });
      });
    }

    // User dropdown
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
      userMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const dd = userMenu.querySelector('.user-dropdown');
        if (dd) dd.classList.toggle('show');
      });
      document.addEventListener('click', () => {
        const dd = document.querySelector('.user-dropdown.show');
        if (dd) dd.classList.remove('show');
      });
    }
  },

  /* --- Scroll Animations --- */
  initScrollAnimations() {
    const els = document.querySelectorAll('.animate-on-scroll');
    if (!els.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    els.forEach(el => observer.observe(el));
  },

  /* --- Back to Top --- */
  initBackToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('show', window.scrollY > 400);
    });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  },

  /* --- Toast Notifications --- */
  initToastContainer() {
    if (!document.querySelector('.toast-container')) {
      const container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
  },

  showToast(message, type = 'info', duration = 3000) {
    const container = document.querySelector('.toast-container');
    if (!container) return;
    const icons = { success: '&#10003;', error: '&#10007;', info: '&#8505;', warning: '&#9888;' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /* --- Active Nav Highlight --- */
  highlightActiveNav() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(a => {
      const href = a.getAttribute('href');
      if (href && path.endsWith(href.replace('./', '').replace('../', ''))) {
        a.classList.add('active');
      }
    });
  },

  /* --- Modal Helpers --- */
  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('show');
  },

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('show');
  },

  /* --- Dashboard Sidebar Toggle (Mobile) --- */
  toggleDashSidebar() {
    const sidebar = document.querySelector('.dash-sidebar');
    if (sidebar) sidebar.classList.toggle('open');
  },

  /* --- Utility --- */
  formatCurrency(num) {
    return '₹' + Number(num).toLocaleString('en-IN');
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  /* --- Animated Counters --- */
  initCounters() {
    const counters = document.querySelectorAll('.counter-number');
    if (!counters.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.target, 10);
          this.animateCounter(el, target);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    counters.forEach(c => observer.observe(c));
  },

  animateCounter(el, target) {
    const duration = 2000;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.floor(eased * target).toLocaleString('en-IN');
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  /* --- Hero Parallax --- */
  initParallax() {
    const heroBg = document.querySelector('.hero-bg img');
    if (!heroBg) return;
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      if (scrollY < window.innerHeight) {
        heroBg.style.transform = `translateY(${scrollY * 0.35}px) scale(1.1)`;
      }
    }, { passive: true });
  }
};

/* --- Init on DOM ready --- */
document.addEventListener('DOMContentLoaded', () => App.init());
