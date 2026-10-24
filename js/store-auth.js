(function (window, document) {
  'use strict';
  const S = window.VoltixStore, UI = window.VoltixStoreUI;
  const next = S.safeNext(new URLSearchParams(window.location.search).get('next'));
  const error = document.getElementById('st-auth-error');
  const signin = document.getElementById('st-signin-form');
  const register = document.getElementById('st-register-form');
  const remember = document.getElementById('st-remember');
  const email = document.getElementById('st-login-email');
  const tabs = [document.getElementById('st-signin-tab'), document.getElementById('st-register-tab')];
  let processing = false;
  if (S.getSession()) { window.location.replace(next); return; }
  const remembered = S.safeRead(S.KEYS.remember, '');
  email.value = typeof remembered === 'string' ? remembered : '';
  remember.checked = !!email.value;

  function showError(message) { error.textContent = message; error.hidden = false; }
  function setBusy(value) {
    processing = value;
    document.querySelectorAll('.st-auth-panel button').forEach((button) => { button.disabled = value; });
  }
  function clearErrors() {
    error.hidden = true;
    register.querySelectorAll('.st-field-error').forEach((node) => { node.textContent = ''; });
    register.querySelectorAll('[aria-invalid]').forEach((node) => node.removeAttribute('aria-invalid'));
  }
  function selectTab(index) {
    clearErrors();
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1;
      tab.className = 'st-button ' + (i === index ? 'st-button-primary' : 'st-button-outline');
      document.getElementById(tab.getAttribute('aria-controls')).hidden = i !== index;
    });
    document.getElementById('st-auth-heading').textContent = index ? 'Create your account' : 'Sign in to Voltix';
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(index));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const target = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index;
      selectTab(target); tabs[target].focus();
    });
  });
  document.querySelectorAll('[data-st-password]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.stPassword), show = input.type === 'password';
      input.type = show ? 'text' : 'password'; button.textContent = show ? 'Hide' : 'Show';
      button.setAttribute('aria-pressed', String(show));
    });
  });
  remember.addEventListener('change', () => {
    if (!remember.checked && !S.rememberEmail('', false)) showError('Your remembered email could not be removed. Please allow browser storage.');
  });
  signin.addEventListener('submit', (event) => {
    event.preventDefault(); if (processing) return; clearErrors(); setBusy(true);
    // Remember only the email; neither the password nor session is persisted locally.
    if (!S.rememberEmail(email.value, remember.checked)) {
      setBusy(false); showError('Invalid email or password'); return;
    }
    const result = S.signIn(email.value, document.getElementById('st-login-password').value);
    if (result.ok) window.location.assign(next);
    else { setBusy(false); showError(result.message); }
  });
  register.addEventListener('submit', (event) => {
    event.preventDefault(); if (processing) return; clearErrors(); setBusy(true);
    const value = Object.fromEntries(new FormData(register));
    const result = S.registerCustomer(value);
    if (result.ok) { window.location.assign(next); return; }
    setBusy(false); showError(result.message);
    if (result.field) {
      const input = register.elements.namedItem(result.field);
      input.setAttribute('aria-invalid', 'true');
      document.getElementById('st-' + result.field + '-error').textContent = result.message;
      input.focus();
    }
  });
  document.querySelectorAll('[data-st-social]').forEach((button) => {
    button.addEventListener('click', () => {
      if (processing) return; clearErrors(); setBusy(true);
      const result = S.socialSignIn(button.dataset.stSocial);
      if (!result.ok) { setBusy(false); showError(result.message); return; }
      UI.toast(result.message);
      // Leave the simulation toast readable before following the return destination.
      window.setTimeout(() => window.location.assign(next), 1600);
    });
  });
})(window, document);
