(function (window, document) {
  'use strict';
  const S = window.VoltixStore, UI = window.VoltixStoreUI, e = S.escapeHtml;
  const host = document.getElementById('st-cart'), notices = document.getElementById('st-cart-notices');
  let lastNotices = [];

  /** Every render gets current stock, prices, settings and customer checkout routing. */
  function render() {
    const state = S.reconcileCart(), totals = S.cartTotals(state.items);
    if (state.notices.length) {
      lastNotices = state.notices;
      UI.toast(state.notices.map((notice) => notice.name + ': ' + notice.message).join(' '));
    }
    notices.innerHTML = lastNotices.map((notice) => '<p>' + e(notice.name) + ': ' + e(notice.message) + '</p>').join('') + (!state.ok ? '<p>Your cart could not be saved. Please allow browser storage and try again.</p>' : '');
    const count = totals.lines.reduce((sum, line) => sum + line.quantity, 0);
    document.getElementById('st-cart-heading').textContent = 'Cart (' + count + ')';
    if (!totals.lines.length) {
      host.innerHTML = '<section class="st-empty"><h2>Your cart is empty</h2><p>Find your next favorite piece of tech.</p><a class="st-button st-button-primary" href="category.html">Start shopping</a></section>'; return;
    }
    host.innerHTML = '<div class="st-cart-layout"><section class="st-panel st-cart-lines" aria-label="Cart items"><div id="st-cart-lines"></div></section><aside class="st-panel st-cart-summary" aria-labelledby="st-summary-heading"><h2 id="st-summary-heading">Order summary</h2><dl class="st-totals"><div><dt>Subtotal</dt><dd>' + e(S.money(totals.subtotal)) + '</dd></div><div><dt>Tax (' + e(totals.tax.rate) + '%)</dt><dd>' + e(S.money(totals.tax.amount)) + '</dd></div><div class="st-total"><dt>Total</dt><dd>' + e(S.money(totals.total)) + '</dd></div></dl><a class="st-button st-button-primary st-wide" data-st-checkout href="' + e(S.checkoutLink()) + '">Checkout</a></aside></div>';
    const fragment = document.createDocumentFragment();
    totals.lines.forEach((line, index) => {
      const product = line.product, article = document.createElement('article'), link = 'product.html?id=' + encodeURIComponent(product.id);
      article.className = 'st-cart-line'; article.dataset.stLine = product.id;
      article.innerHTML = '<a class="st-product-visual st-cart-visual" href="' + e(link) + '" aria-label="View ' + e(product.name) + '">' + (product.image ? '<img class="st-product-image" src="' + e(product.image) + '" alt="' + e(product.name) + '">' : '') + '</a><div class="st-cart-item-info"><h2><a href="' + e(link) + '">' + e(product.name) + '</a></h2><p>' + e(S.money(line.unitPrice)) + ' each' + (S.getDeal(product) ? ' <del>' + e(S.money(product.price)) + '</del>' : '') + '</p><button class="st-text-button st-remove" type="button" data-st-remove aria-label="Remove ' + e(product.name) + '">Remove</button></div>' +
        '<div class="st-stepper"><button type="button" data-st-step="-1" aria-label="Decrease quantity for ' + e(product.name) + '">−</button><label class="st-sr-only" for="st-cart-quantity-' + index + '">Quantity for ' + e(product.name) + '</label><input id="st-cart-quantity-' + index + '" data-st-cart-quantity type="number" inputmode="numeric" min="1" max="' + product.stock + '" value="' + line.quantity + '"><button type="button" data-st-step="1" aria-label="Increase quantity for ' + e(product.name) + '">+</button></div><strong class="st-line-total">' + e(S.money(line.lineTotal)) + '</strong>';
      fragment.appendChild(article);
    });
    document.getElementById('st-cart-lines').replaceChildren(fragment);
  }
  function update(productId, value, remove) {
    const items = S.readCart(), product = S.getProducts().find((p) => p.id === productId);
    const number = Number(value), desired = Number.isFinite(number) ? Math.max(1, Math.floor(number)) : 1;
    if (!remove && product && desired > product.stock) UI.toast('Only ' + product.stock + ' in stock');
    const next = items.filter((item) => !remove || item.productId !== productId).map((item) => item.productId === productId ? { productId, quantity: desired } : item);
    if (!S.writeCart(next)) UI.toast('Your cart could not be saved. Please allow browser storage and try again.');
    render();
  }
  host.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-st-remove]'), step = event.target.closest('[data-st-step]');
    if (!remove && !step) return;
    const line = event.target.closest('[data-st-line]'), id = line.dataset.stLine;
    const index = Array.from(host.querySelectorAll('[data-st-line]')).indexOf(line);
    update(id, Number(line.querySelector('input').value) + (step ? Number(step.dataset.stStep) : 0), !!remove);
    const rows = host.querySelectorAll('[data-st-line]');
    const target = remove ? rows[Math.min(index, rows.length - 1)]?.querySelector('[data-st-remove]') : Array.from(rows).find((row) => row.dataset.stLine === id)?.querySelector('[data-st-step="' + step.dataset.stStep + '"]');
    if (target) target.focus();
    else { document.getElementById('st-cart-heading').tabIndex = -1; document.getElementById('st-cart-heading').focus(); }
  });
  host.addEventListener('change', (event) => {
    if (!event.target.matches('[data-st-cart-quantity]')) return;
    const id = event.target.closest('[data-st-line]').dataset.stLine;
    update(id, event.target.value, false);
    Array.from(host.querySelectorAll('[data-st-line]')).find((row) => row.dataset.stLine === id)?.querySelector('input').focus();
  });
  window.addEventListener('voltix:store-refresh', render);
  window.addEventListener('voltix:store-session-changed', render);
  render();
})(window, document);
