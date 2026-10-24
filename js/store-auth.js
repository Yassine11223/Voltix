(function (window, document) {
  'use strict';
  const S = window.VoltixStore, UI = window.VoltixStoreUI;
  if (document.getElementById('st-reset-flow')) { setupReset(); return; }
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
  if (new URLSearchParams(window.location.search).get('reset') === 'ok') {
    const notice = document.createElement('p');
    notice.className = 'st-reset-success'; notice.setAttribute('role', 'status');
    notice.textContent = 'Password updated. Sign in with your new password.';
    signin.before(notice);
  }

  /** Three sequential screens share this controller without changing login behavior. */
  function setupReset() {
    const params = new URLSearchParams(window.location.search);
    const panels = [1, 2, 3].map((step) => document.getElementById('st-reset-step-' + step));
    const request = document.getElementById('st-reset-request'), update = document.getElementById('st-reset-update');
    const resetEmail = document.getElementById('st-reset-email'), message = document.getElementById('st-reset-error');
    const start = document.getElementById('st-reset-start');
    let submittedEmail = '', busy = false;
    function showStep(step, focus = true) {
      panels.forEach((panel, index) => { panel.hidden = index !== step - 1; });
      document.querySelectorAll('[data-st-reset-step]').forEach((item, index) => {
        if (index === step - 1) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
      });
      message.hidden = true; start.hidden = true;
      if (focus) panels[step - 1].querySelector('h2').focus();
    }
    function send() {
      const result = S.requestPasswordReset(submittedEmail);
      document.getElementById('st-reset-sent').textContent = result.message;
      document.getElementById('st-reset-open').href = 'forgot-password.html?token=' + encodeURIComponent(result.token);
      showStep(2);
    }
    request.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!S.validEmail(resetEmail.value)) {
        const fieldError = document.getElementById('st-reset-email-error');
        fieldError.textContent = 'Enter a valid email address.'; resetEmail.setAttribute('aria-invalid', 'true'); resetEmail.focus(); return;
      }
      resetEmail.removeAttribute('aria-invalid'); document.getElementById('st-reset-email-error').textContent = '';
      submittedEmail = resetEmail.value; send();
    });
    document.getElementById('st-reset-resend').addEventListener('click', () => { send(); UI.toast('If an account exists, a new reset link was sent.'); });
    update.addEventListener('submit', (event) => {
      event.preventDefault(); if (busy) return;
      busy = true; const button = update.querySelector('[type="submit"]'); button.disabled = true;
      const result = S.resetPassword(params.get('token'), document.getElementById('st-reset-password').value, document.getElementById('st-reset-confirm').value);
      if (result.ok) { window.location.assign('login.html?reset=ok'); return; }
      busy = false; button.disabled = false;
      message.textContent = result.message; message.hidden = false; start.hidden = !result.invalid;
      update.querySelectorAll('[aria-invalid]').forEach((input) => input.removeAttribute('aria-invalid'));
      if (result.field) {
        const input = document.getElementById('st-reset-' + result.field); input.setAttribute('aria-invalid', 'true'); input.focus();
      } else message.focus();
    });
    // Do not inspect token validity here: unknown and expired links have identical screens.
    showStep(params.has('token') ? 3 : 1, false);
  }

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
