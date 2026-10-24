(function (window, document) {
  'use strict';
  const S = window.VoltixStore, e = S.escapeHtml;
  const host = document.getElementById('st-success');
  const params = new URLSearchParams(window.location.search), id = params.get('id');
  const statuses = { pending: 'Pending', confirmed: 'Confirmed', delivered: 'Delivered', cancelled: 'Cancelled' };
  const check = '<svg class="st-success-check" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="32"></circle><path d="m18 33 10 10 19-22"></path></svg>';

  /** Render a stored snapshot, never current cart prices or another customer's order. */
  function render() {
    const order = S.getOwnOrder(id);
    if (!order || !Array.isArray(order.items) || !order.tax || !order.payment) {
      host.innerHTML = '<section class="st-panel st-success-panel st-empty"><h1>Order confirmation unavailable</h1><p>Sign in with the account that placed this order, or check your orders.</p><div class="st-success-actions"><a class="st-button st-button-primary" href="' + (S.getSession() ? 'orders.html' : 'login.html?next=' + encodeURIComponent(S.safeNext('success.html' + (id ? '?id=' + encodeURIComponent(id) : '')))) + '">' + (S.getSession() ? 'My orders' : 'Sign in') + '</a><a class="st-button st-button-outline" href="index.html">Continue shopping</a></div></section>';
      document.title = 'Order confirmation | Voltix';
      return;
    }
    document.title = 'Order placed | Voltix';
    host.innerHTML = '<section class="st-panel st-success-panel" aria-labelledby="st-success-heading"><div class="st-success-intro">' + check + '<p class="st-eyebrow">Order placed</p><h1 id="st-success-heading">Thank you for your order</h1><p class="st-order-number">Order number ' + e(order.id) + ' <span aria-hidden="true">&middot;</span> Status <span class="st-order-status" data-st-order-status>' + e(statuses[order.status] || 'Unavailable') + '</span></p></div><div id="st-success-items"></div><dl class="st-totals"><div><dt>Subtotal</dt><dd data-st-subtotal>' + e(S.money(order.subtotal)) + '</dd></div><div><dt>Tax (' + e(order.tax.rate) + '%)</dt><dd data-st-tax>' + e(S.money(order.tax.amount)) + '</dd></div><div class="st-total"><dt>Total</dt><dd data-st-total>' + e(S.money(order.total)) + '</dd></div></dl><p class="st-success-payment">Payment: ' + (order.payment.method === 'card' ? 'Card (paid, demo only)' : 'Cash on delivery (unpaid)') + '</p>' + (order.payment.method === 'card' ? '<p class="st-payment-note">Demo only: no real payment is processed</p>' : '') + (params.get('cart') === 'retained' && S.readCart().length ? '<p class="st-cart-notices">Your order is saved, but your cart could not be cleared. Please remove the ordered items from your <a href="cart.html">cart</a> before ordering again.</p>' : '') + '<div class="st-success-actions"><a class="st-button st-button-primary" href="orders.html">Track my orders</a><a class="st-button st-button-outline" href="index.html">Continue shopping</a></div></section>';
    const lines = document.createElement('ul'), fragment = document.createDocumentFragment();
    lines.className = 'st-order-lines';
    order.items.forEach((item) => {
      const row = document.createElement('li');
      row.innerHTML = '<span>' + e(item.name) + ' <span class="st-order-quantity">x' + e(item.quantity) + '</span></span><strong>' + e(S.money(item.lineTotal)) + '</strong>';
      fragment.appendChild(row);
    });
    lines.appendChild(fragment); document.getElementById('st-success-items').replaceChildren(lines);
  }
  window.addEventListener('voltix:store-refresh', render);
  window.addEventListener('voltix:store-session-changed', render);
  render();
})(window, document);
