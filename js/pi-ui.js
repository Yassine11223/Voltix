(function (window) {
  'use strict';

  // TODO(lead): replace this temporary UI/session layer when shared auth and layout are ready.
  const SESSION_KEY = 'voltix_session';
  const LOGIN_PATH = '../index.html';
  const DEV_FALLBACK_SESSION = true;
  const ROLE_ALIASES = {
    systemadmin: 'System Admin',
    admin: 'System Admin',
    storemanager: 'Store Manager',
    inventorymanager: 'Inventory Manager',
    inventorystaff: 'Inventory Manager',
    cashier: 'Cashier'
  };
  const PERMISSIONS = {
    'product:read': ['System Admin', 'Store Manager', 'Inventory Manager', 'Cashier'],
    'product:write': ['System Admin', 'Store Manager', 'Inventory Manager'],
    'product:delete': ['System Admin', 'Store Manager'],
    'inventory:read': ['System Admin', 'Store Manager', 'Inventory Manager', 'Cashier'],
    'inventory:supervise': ['System Admin', 'Store Manager', 'Inventory Manager'],
    'inventory:write': ['System Admin', 'Inventory Manager'],
    'supplier:read': ['System Admin', 'Store Manager', 'Inventory Manager'],
    'supplier:write': ['System Admin', 'Store Manager', 'Inventory Manager'],
    'supplier:delete': ['System Admin', 'Store Manager'],
    'movement:read': ['System Admin', 'Store Manager', 'Inventory Manager']
  };

  const normalizeRole = (role) => String(role || '').toLowerCase().replace(/[\s_-]/g, '')
    .replace(/^systemadministrator$/, 'systemadmin');

  function readSession() {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!session || typeof session !== 'object' || !session.name || !session.role) return null;
      const role = ROLE_ALIASES[normalizeRole(session.role)];
      if (!role) return null;
      return { ...session, role };
    } catch (error) {
      return null;
    }
  }

  function requireSession() {
    const session = readSession();
    if (session) return session;
    if (DEV_FALLBACK_SESSION) {
      const fallback = { id: 'DEV-1', name: 'Demo Inventory Manager', role: 'Inventory Manager', status: 'active' };
      try { window.localStorage.setItem(SESSION_KEY, JSON.stringify(fallback)); } catch (error) { /* safe fallback */ }
      console.info('Voltix development session created. // TODO(lead): set DEV_FALLBACK_SESSION to false once login works.');
      return fallback;
    }
    window.location.href = LOGIN_PATH;
    return null;
  }

  function can(action, session = requireSession()) {
    if (!session) return false;
    if (action === 'pos:stock-mutation' || action === 'returns:stock-mutation') return true;
    return Boolean(PERMISSIONS[action]?.includes(session.role));
  }

  function icon(path) {
    return `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${path}"></path></svg>`;
  }

  function renderShell(activePage) {
    const session = requireSession();
    if (!session) return null;
    const userName = document.querySelector('#userName');
    const userRole = document.querySelector('#userRole');
    const avatar = document.querySelector('#avatar');
    if (userName) userName.textContent = session.name;
    if (userRole) userRole.textContent = session.role;
    if (avatar) avatar.textContent = session.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
    document.querySelectorAll('.vi-nav a').forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `${activePage}.html`));
    const supplierLink = document.querySelector('.vi-nav a[href="suppliers.html"]');
    if (supplierLink && !can('supplier:read', session)) supplierLink.hidden = true;
    return session;
  }

  class ModalController {
    constructor(root) { this.root = root; this.previousFocus = null; this.keyHandler = (event) => this.handleKey(event); }
    open(content, trigger = document.activeElement) {
      this.previousFocus = trigger;
      this.root.innerHTML = content;
      const dialog = this.root.querySelector('[role="dialog"], [role="alertdialog"]');
      if (!dialog) return;
      document.body.classList.add('modal-open');
      document.querySelector('.vi-shell')?.setAttribute('aria-hidden', 'true');
      document.addEventListener('keydown', this.keyHandler);
      dialog.querySelector('input, select, textarea, button')?.focus();
    }
    close() {
      this.root.replaceChildren();
      document.body.classList.remove('modal-open');
      document.querySelector('.vi-shell')?.removeAttribute('aria-hidden');
      document.removeEventListener('keydown', this.keyHandler);
      this.previousFocus?.focus();
    }
    handleKey(event) {
      if (event.key === 'Escape') this.close();
      if (event.key !== 'Tab') return;
      const dialog = this.root.querySelector('[role="dialog"], [role="alertdialog"]');
      const focusable = dialog ? [...dialog.querySelectorAll('button, input, select, textarea, a[href]')].filter((element) => !element.disabled) : [];
      if (!focusable.length) return;
      const index = focusable.indexOf(document.activeElement);
      const next = event.shiftKey ? (index <= 0 ? focusable.length - 1 : index - 1) : (index + 1) % focusable.length;
      event.preventDefault();
      focusable[next].focus();
    }
  }

  window.VoltixUI = { LOGIN_PATH, DEV_FALLBACK_SESSION, PERMISSIONS, normalizeRole, requireSession, can, renderShell, ModalController, icon };
}(window));
