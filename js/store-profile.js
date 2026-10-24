(function (window, document) {
  'use strict';
  const S = window.VoltixStore, UI = window.VoltixStoreUI;
  const FIELDS = ['name', 'phone', 'email', 'city', 'area', 'street', 'current', 'password', 'confirm'];
  const ADDRESS = ['city', 'area', 'street'];
  const form = document.getElementById('st-profile-form'), layout = document.getElementById('st-profile-layout');
  const error = document.getElementById('st-profile-error'), notice = document.getElementById('st-profile-notice');
  const button = document.getElementById('st-profile-save'), cancel = document.getElementById('st-profile-cancel');
  const input = (field) => form.elements.namedItem(field);
  const values = () => Object.fromEntries(FIELDS.map((field) => [field, input(field).value]));
  let baseline = '', savedRecord = '', processing = false;

  /** A missing/deleted customer cannot leave private form data visible. */
  function requireCustomer() {
    const customer = S.getCustomer();
    if (S.getSession() && customer) return customer;
    layout.hidden = true; form.reset();
    if (S.getSession()) {
      // Clearing a stale session avoids a login/profile redirect loop.
      if (!S.signOut()) { document.getElementById('st-profile-access').hidden = false; return null; }
      return null; // The session-change event performs the redirect.
    }
    window.location.replace('login.html?next=' + encodeURIComponent(S.safeNext('profile.html')));
    return null;
  }
  function showFields(errors = {}) {
    FIELDS.forEach((field) => {
      document.getElementById('st-profile-' + field + '-error').textContent = errors[field] || '';
      if (errors[field]) input(field).setAttribute('aria-invalid', 'true'); else input(field).removeAttribute('aria-invalid');
    });
  }
  function updateAvatar(name) {
    const words = String(name || '').trim().split(/\s+/).filter(Boolean);
    document.getElementById('st-profile-avatar').textContent = (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0] && words[0][0] || '?').toLocaleUpperCase();
  }

  /** Populate only on initial load, Cancel, successful save, or a clean external refresh. */
  function prefill(customer) {
    FIELDS.forEach((field) => {
      const value = ADDRESS.includes(field) ? (customer.address || {})[field] : customer[field];
      input(field).value = ['current', 'password', 'confirm'].includes(field) ? '' : typeof value === 'string' ? value : '';
    });
    const social = customer.provider !== 'email', passwords = document.getElementById('st-profile-password-fields');
    passwords.hidden = social; passwords.disabled = social;
    document.getElementById('st-profile-social').hidden = !social;
    updateAvatar(customer.name); showFields(); error.hidden = true; notice.hidden = true;
    baseline = JSON.stringify(values()); savedRecord = JSON.stringify(customer); layout.hidden = false;
  }
  function refresh() {
    const customer = requireCustomer(); if (!customer || processing) return;
    if (!baseline || JSON.stringify(values()) === baseline) { prefill(customer); return; }
    if (savedRecord !== JSON.stringify(customer)) {
      notice.textContent = 'Your profile changed in another tab. Your edits are preserved. Cancel to load the saved values.'; notice.hidden = false;
    }
  }
  form.addEventListener('input', (event) => {
    const field = event.target.name;
    if (!FIELDS.includes(field)) return;
    document.getElementById('st-profile-' + field + '-error').textContent = ''; event.target.removeAttribute('aria-invalid');
    if (field === 'name') updateAvatar(event.target.value);
  });
  cancel.addEventListener('click', () => {
    if (processing) return;
    const customer = requireCustomer(); if (customer) { prefill(customer); UI.toast('Changes discarded.'); }
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); if (processing || !requireCustomer()) return;
    showFields(); error.hidden = true;
    processing = true; button.disabled = true; cancel.disabled = true; form.setAttribute('aria-busy', 'true');
    // Keep the submitted fields stable while waiting for another tab's storage lock.
    FIELDS.forEach((field) => { input(field).readOnly = true; });
    const result = await S.saveProfile(values());
    processing = false; button.disabled = false; cancel.disabled = false; form.removeAttribute('aria-busy');
    FIELDS.forEach((field) => { input(field).readOnly = false; });
    if (result.signIn) { requireCustomer(); return; }
    if (!result.ok) {
      if (result.errors) { showFields(result.errors); const first = form.querySelector('[aria-invalid="true"]'); if (first) first.focus(); }
      else { error.textContent = result.message; error.hidden = false; error.focus(); }
      return;
    }
    const customer = requireCustomer(); if (!customer) return;
    prefill(customer); UI.renderHeader(); UI.toast('Profile updated.');
    if (result.warnings.length) { notice.textContent = result.warnings.join(' '); notice.hidden = false; }
  });
  document.querySelectorAll('.st-profile-nav a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.st-profile-nav [aria-current]').forEach((node) => node.removeAttribute('aria-current'));
      link.setAttribute('aria-current', 'location');
      document.getElementById(link.hash.slice(1)).focus();
    });
  });
  window.addEventListener('voltix:store-refresh', refresh);
  window.addEventListener('voltix:store-session-changed', refresh);
  refresh();
})(window, document);
