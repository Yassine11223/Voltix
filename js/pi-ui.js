(function (window) {
  'use strict';

  // The shared app owns navigation, identity display, and session redirects.
  const LOGIN_PATH = '../index.html';
  const DEV_FALLBACK_SESSION = false;
  const PERMISSIONS = {
    'product:read': ['admin', 'staff'],
    'product:write': ['admin'],
    'product:delete': ['admin'],
    'inventory:read': ['admin', 'staff'],
    'inventory:supervise': ['admin'],
    'inventory:write': ['admin'],
    'supplier:read': ['admin'],
    'supplier:write': ['admin'],
    'supplier:delete': ['admin'],
    'movement:read': ['admin', 'staff']
  };

  const normalizeRole = (role) => ['admin', 'staff'].includes(role) ? role : '';

  function requireSession() {
    const session = window.VoltixInventory.getCurrentUser();
    if (!session) {
      window.location.replace(LOGIN_PATH);
      return null;
    }
    // app.js leaves VoltixApp unset while redirecting a restricted page.
    return window.VoltixApp ? session : null;
  }

  function can(action) {
    return window.VoltixInventory.can(action);
  }

  function icon(path) {
    return `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${path}"></path></svg>`;
  }

  function renderShell(activePage) {
    const session = requireSession();
    if (!session) return null;
    if (activePage === 'suppliers' && !can('supplier:read')) {
      document.getElementById('app-shell').hidden = true;
      window.location.replace('dashboard.html');
      return null;
    }
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
      document.addEventListener('keydown', this.keyHandler);
      dialog.querySelector('input, select, textarea, button')?.focus();
      document.getElementById('app-shell').inert = true;
    }
    close() {
      this.root.replaceChildren();
      document.body.classList.remove('modal-open');
      document.getElementById('app-shell').inert = false;
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
