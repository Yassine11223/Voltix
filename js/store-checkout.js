(function (window, document) {
  'use strict';
  const S = window.VoltixStore, e = S.escapeHtml;
  const form = document.getElementById('st-checkout-form');
  const empty = document.getElementById('st-checkout-empty');
  const summary = document.getElementById('st-checkout-summary');
  const error = document.getElementById('st-checkout-error');
  const button = document.getElementById('st-place-order');
  const fields = ['name', 'phone', 'email', 'city', 'area', 'street'];
  const knownNames = new Map(S.getProducts().map((product) => [product.id, product.name]));
  let processing = false, completed = false;

  function requireCustomer() {
    if (S.getSession() && S.getCustomer()) return true;
    form.hidden = true; empty.hidden = true;
    window.location.replace('login.html?next=' + encodeURIComponent(S.safeNext('checkout.html')));
    return false;
  }
  if (!requireCustomer()) return;
  const customer = S.getCustomer();
  fields.forEach((field) => {
    const value = ['city', 'area', 'street'].includes(field) ? (customer.address || {})[field] : customer[field];
    form.elements.namedItem(field).value = typeof value === 'string' ? value : '';
  });

  function showError(message, cartLink = false) {
    error.textContent = message + ' ';
    if (cartLink) {
      const link = document.createElement('a');
      link.href = 'cart.html'; link.textContent = 'Back to cart';
      error.appendChild(link);
    }
    error.hidden = false;
  }
  function showFields(errors) {
    fields.concat('method').forEach((field) => {
      document.getElementById('st-checkout-' + field + '-error').textContent = errors[field] || '';
      const inputs = field === 'method' ? form.querySelectorAll('[name="method"]') : [form.elements.namedItem(field)];
      inputs.forEach((input) => {
        if (errors[field]) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      });
    });
    if (Object.keys(errors).length) form.querySelector('[aria-invalid="true"]').focus();
  }

  /** Refresh totals only; keep delivery edits intact when another tab changes stock. */
  function render() {
    if (completed || !requireCustomer()) return;
    const state = S.checkoutState(knownNames);
    form.hidden = !!state.empty; empty.hidden = !state.empty;
    button.disabled = processing || !state.ok;
    if (state.empty) return;
    if (!state.ok) { summary.replaceChildren(); showError(state.message, true); return; }
    error.hidden = true;
    const totals = state.totals, fragment = document.createDocumentFragment();
    const lines = document.createElement('ul'); lines.className = 'st-order-lines';
    totals.lines.forEach((line) => {
      knownNames.set(line.productId, line.product.name);
      const item = document.createElement('li');
      item.innerHTML = '<span>' + e(line.product.name) + ' <span class="st-order-quantity">x' + line.quantity + '</span></span><span>' + e(S.money(line.lineTotal)) + '</span>';
      lines.appendChild(item);
    });
    const values = document.createElement('dl'); values.className = 'st-totals';
    values.innerHTML = '<div><dt>Subtotal</dt><dd data-st-subtotal>' + e(S.money(totals.subtotal)) + '</dd></div><div><dt>Tax (' + e(totals.tax.rate) + '%)</dt><dd data-st-tax>' + e(S.money(totals.tax.amount)) + '</dd></div><div class="st-total"><dt>Total</dt><dd data-st-total>' + e(S.money(totals.total)) + '</dd></div>';
    fragment.append(lines, values); summary.replaceChildren(fragment);
  }

  form.addEventListener('input', (event) => {
    const field = event.target.name;
    if (!fields.includes(field)) return;
    // Corrected fields lose their own message without duplicating a summary.
    const result = S.validateCheckout(Object.fromEntries(new FormData(form)));
    if (!result.errors[field]) {
      document.getElementById('st-checkout-' + field + '-error').textContent = '';
      event.target.removeAttribute('aria-invalid');
    }
  });
  form.addEventListener('change', (event) => {
    if (event.target.name === 'method') document.getElementById('st-card-note').hidden = event.target.value !== 'card';
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (processing || completed) return;
    if (!requireCustomer()) return;
    const value = Object.fromEntries(new FormData(form)), validation = S.validateCheckout(value);
    error.hidden = true; showFields(validation.errors);
    if (!validation.ok) return;
    processing = true; button.disabled = true; button.textContent = 'Placing order...';
    form.setAttribute('aria-busy', 'true');
    const result = await S.placeOrder(value, knownNames);
    if (result.ok) {
      completed = true;
      window.location.assign('success.html?id=' + encodeURIComponent(result.order.id) + (result.cartCleared ? '' : '&cart=retained'));
      return;
    }
    processing = false; button.textContent = 'Place order'; form.removeAttribute('aria-busy');
    if (result.signIn) { requireCustomer(); return; }
    render();
    if (result.errors) showFields(result.errors);
    else { showError(result.message, !result.empty); error.focus(); }
  });
  window.addEventListener('voltix:store-refresh', render);
  window.addEventListener('voltix:store-cart-changed', render);
  window.addEventListener('voltix:store-session-changed', () => { if (!completed) requireCustomer(); });
  render();
})(window, document);
