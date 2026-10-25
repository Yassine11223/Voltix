(function (window, document) {
  'use strict';
  const S = window.VoltixStore, UI = window.VoltixStoreUI, e = S.escapeHtml;
  const host = document.getElementById('st-orders');

  /** Render only this customer's stored snapshots, newest first. */
  function render() {
    if (!S.getSession()) { host.replaceChildren(); window.location.replace('login.html?next=orders.html'); return; }
    const orders = S.getOwnOrders();
    if (!orders.length) {
      host.innerHTML = '<section class="st-empty"><h2>No orders yet</h2><p>Your orders will appear here after checkout.</p><a class="st-button st-button-primary" href="category.html">Start shopping</a></section>'; return;
    }
    host.innerHTML = '<div class="st-panel st-orders-panel"><table class="st-orders-table"><caption class="st-sr-only">Your orders, newest first</caption><thead><tr><th scope="col">Order</th><th scope="col">Date</th><th scope="col">Items</th><th scope="col">Total</th><th scope="col">Status</th><th scope="col"><span class="st-sr-only">Details</span></th></tr></thead><tbody id="st-orders-rows"></tbody></table></div>';
    const fragment = document.createDocumentFragment();
    orders.forEach((order) => {
      const row = document.createElement('tr');
      row.innerHTML = '<th scope="row" data-st-label="Order">' + e(order.id) + '</th><td data-st-label="Date">' + e(UI.orderDate(order.date)) + '</td><td data-st-label="Items">' + e(order.items.reduce((count, item) => count + item.quantity, 0)) + '</td><td data-st-label="Total">' + e(S.money(order.total)) + '</td><td data-st-label="Status">' + UI.orderStatus(order.status) + '</td><td><a class="st-button st-button-outline" href="order.html?id=' + e(encodeURIComponent(order.id)) + '" aria-label="View order ' + e(order.id) + '">View</a></td>';
      fragment.appendChild(row);
    });
    document.getElementById('st-orders-rows').appendChild(fragment);
  }
  window.addEventListener('voltix:store-refresh', render);
  window.addEventListener('voltix:store-session-changed', render);
  window.addEventListener('voltix:order-cancelled', render);
  render();
})(window, document);
