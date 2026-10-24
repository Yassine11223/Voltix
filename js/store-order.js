(function (window, document) {
  'use strict';
  const S = window.VoltixStore, UI = window.VoltixStoreUI, e = S.escapeHtml;
  const id = new URLSearchParams(window.location.search).get('id');
  const host = document.getElementById('st-order'), dialog = document.getElementById('st-cancel-dialog');
  const confirm = document.getElementById('st-cancel-confirm'), error = document.getElementById('st-cancel-error');
  const modal = UI.dialogHelper(dialog);
  const steps = ['pending', 'confirmed', 'delivered'];
  let processing = false;

  /** Cancelled orders retain only the progress recorded before cancellation. */
  function timeline(order) {
    const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    const cancelIndex = history.findIndex((entry) => entry && entry.status === 'cancelled');
    const prior = cancelIndex < 0 ? [] : history.slice(0, cancelIndex);
    const reached = order.status === 'cancelled' ? Math.max(0, ...prior.map((entry) => steps.indexOf(entry && entry.status))) : steps.indexOf(order.status);
    const cancelled = history.find((entry) => entry && entry.status === 'cancelled');
    return (order.status === 'cancelled' ? '<p class="st-cancel-notice" role="status">Order cancelled' + (cancelled ? ' on ' + e(UI.orderDate(cancelled.date, true)) : '. Cancellation date unavailable') + '. No payment is processed in this demo.</p>' : '') +
      '<ol class="st-panel st-order-timeline" aria-label="Order progress">' + steps.map((status, index) => '<li class="' + (index <= reached ? 'st-step-reached' : '') + '"' + (order.status === status ? ' aria-current="step"' : '') + '><span aria-hidden="true">' + (index + 1) + '</span>' + status[0].toUpperCase() + status.slice(1) + '<span class="st-sr-only">' + (index <= reached ? ' (reached)' : ' (not reached)') + '</span></li>').join('') + '</ol>';
  }

  /** All amounts and delivery details come from the order snapshot. */
  function render() {
    if (!S.getSession()) {
      modal.close(); host.replaceChildren();
      window.location.replace('login.html?next=' + encodeURIComponent(S.safeNext('order.html' + (id ? '?id=' + encodeURIComponent(id) : '')))); return;
    }
    const order = S.getOwnOrder(id);
    if (!order) {
      modal.close(); document.title = 'Order not found | Voltix';
      host.innerHTML = '<section class="st-empty"><h1>Order not found</h1><p>This order is unavailable. Check the orders in your account.</p><a class="st-button st-button-primary" href="orders.html">My orders</a></section>'; return;
    }
    if (order.status !== 'pending') modal.close();
    document.title = 'Order ' + order.id + ' | Voltix';
    const address = order.address && typeof order.address === 'object' ? ['street', 'area', 'city'].map((key) => typeof order.address[key] === 'string' ? order.address[key].trim() : '').filter(Boolean).join(', ') : '';
    host.innerHTML = '<nav class="st-breadcrumb" aria-label="Breadcrumb"><a href="orders.html">My orders</a> / ' + e(order.id) + '</nav><div class="st-order-heading"><h1 class="st-page-heading">Order ' + e(order.id) + '</h1>' + UI.orderStatus(order.status) + '</div>' + timeline(order) +
      '<div class="st-order-layout"><section class="st-panel st-order-items" aria-labelledby="st-order-items-heading"><h2 id="st-order-items-heading">Items</h2><ul id="st-order-items" class="st-detail-items"></ul></section><section class="st-panel st-order-summary" aria-labelledby="st-order-summary-heading"><h2 id="st-order-summary-heading">Summary</h2><dl class="st-totals"><div><dt>Subtotal</dt><dd data-st-subtotal>' + e(S.money(order.subtotal)) + '</dd></div><div><dt>Tax (' + e(order.tax.rate) + '%)</dt><dd data-st-tax>' + e(S.money(order.tax.amount)) + '</dd></div><div class="st-total"><dt>Total</dt><dd data-st-total>' + e(S.money(order.total)) + '</dd></div></dl><dl class="st-order-delivery"><dt>Delivery address</dt><dd>' + e(address || 'Address unavailable') + '</dd><dt>Payment</dt><dd>' + (order.payment.method === 'card' ? 'Card<p class="st-payment-note">Demo only: no real payment is processed</p>' : 'Cash on delivery') + '</dd></dl>' + (order.status === 'pending' ? '<button id="st-order-cancel" class="st-button st-button-danger st-wide" type="button">Cancel order</button>' : '') + '</section></div>';
    const fragment = document.createDocumentFragment();
    order.items.forEach((item) => {
      const row = document.createElement('li'); row.className = 'st-detail-item';
      row.innerHTML = '<span class="st-detail-placeholder" aria-hidden="true"></span><div><h3>' + e(item.name) + '</h3><p>' + e(item.quantity) + ' &times; ' + e(S.money(item.unitPrice)) + '</p></div><strong>' + e(S.money(item.lineTotal)) + '</strong>';
      fragment.appendChild(row);
    });
    document.getElementById('st-order-items').appendChild(fragment);
  }
  host.addEventListener('click', (event) => {
    const trigger = event.target.closest('#st-order-cancel');
    if (!trigger || processing) return;
    error.hidden = true; modal.open(trigger);
  });
  document.getElementById('st-cancel-keep').addEventListener('click', modal.close);
  confirm.addEventListener('click', async () => {
    if (processing) return;
    processing = true; confirm.disabled = true; error.hidden = true;
    const result = await S.cancelOrder(id);
    processing = false; confirm.disabled = false;
    if (!result.ok) { error.textContent = result.message; error.hidden = false; return; }
    modal.close(); render(); UI.toast(result.message);
    // Rendering removes the original trigger; return focus to the updated heading.
    const heading = host.querySelector('h1'); heading.tabIndex = -1; heading.focus();
  });
  window.addEventListener('voltix:store-refresh', render);
  window.addEventListener('voltix:store-session-changed', render);
  render();
})(window, document);
