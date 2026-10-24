(function (window, document) {
  'use strict';
  const S = window.VoltixStore;
  const e = S.escapeHtml;
  let toastTimer;
  const categoryLink = (category) => 'category.html?' + S.serializeQuery({ category: [category] });
  const searchIcon = '<svg class="st-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m16 16 5 5"></path></svg>';
  const logo = '<span class="st-logo">VOLTIX<span>.</span></span>';

  const ORDER_STATUSES = Object.freeze({ pending: 'Pending', confirmed: 'Confirmed', delivered: 'Delivered', cancelled: 'Cancelled' });
  function orderStatus(status) {
    const known = typeof status === 'string' && Object.prototype.hasOwnProperty.call(ORDER_STATUSES, status);
    return '<span class="st-order-status st-status-' + (known ? status : 'unknown') + '">' + (known ? ORDER_STATUSES[status] : 'Unavailable') + '</span>';
  }
  function orderDate(value, withTime = false) {
    if (typeof value !== 'string') return 'Date unavailable';
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return 'Date unavailable';
    return date.toLocaleString('en-US', Object.assign({ year: 'numeric', month: 'short', day: 'numeric' }, withTime ? { hour: 'numeric', minute: '2-digit' } : {}));
  }

  function renderHeader() {
    const host = document.getElementById('st-header');
    if (!host) return;
    const currentSearch = host.querySelector('input[name="q"]');
    const search = currentSearch ? currentSearch.value : S.parseQuery().q;
    const session = S.getSession();
    const path = window.location.pathname.split('/').pop();
    host.innerHTML = '<header class="st-header"><div class="st-container st-topbar">' +
      '<a class="st-brand" href="index.html" aria-label="Voltix home">' + logo + '</a>' +
      '<nav class="st-main-nav" aria-label="Main"><a href="category.html">Shop</a><a href="deals.html"' + (path === 'deals.html' ? ' aria-current="page"' : '') + '>Deals</a><a href="orders.html">My orders</a></nav>' +
      '<form class="st-search" action="category.html" method="get" role="search"><label class="st-sr-only" for="st-search-input">Search products</label><input id="st-search-input" type="search" name="q" placeholder="Search products" value="' + e(search) + '"><button type="submit" aria-label="Search">' + searchIcon + '</button></form>' +
      '<div class="st-account">' + (session ? '<details class="st-account-menu"><summary>' + e(session.name) + '</summary><div class="st-account-links"><a href="profile.html">Profile</a><a href="orders.html">My orders</a><button type="button" data-st-signout>Sign out</button></div></details>' : '<a class="st-signin" href="login.html">Sign in</a>') + '</div>' +
      '<a class="st-button st-button-primary st-cart-link" href="cart.html"><span>Cart (<span data-st-cart-count>' + S.cartCount() + '</span>)</span></a></div></header>' +
      '<nav class="st-category-nav" aria-label="Product categories"><div class="st-container st-category-links"><a href="category.html">All categories</a>' +
      S.getCategories().map((category) => '<a href="' + e(categoryLink(category.name)) + '">' + e(category.name) + '</a>').join('') + '<a class="st-deals-link" href="deals.html">Deals</a></div></nav>';
  }

  function renderFooter() {
    const host = document.getElementById('st-footer');
    if (!host) return;
    const settings = S.getSettings();
    const stored = S.safeRead(S.KEYS.settings, {}) || {};
    const phone = typeof stored.storePhone === 'string' ? stored.storePhone.trim() : '';
    const address = typeof stored.storeAddress === 'string' ? stored.storeAddress.trim() : '';
    host.innerHTML = '<footer class="st-footer"><div class="st-container"><div class="st-footer-grid"><div><a class="st-brand" href="index.html" aria-label="Voltix home">' + logo + '</a><p>Electronics store. Phones, laptops, audio and accessories.</p></div>' +
      '<nav aria-label="Footer shop"><h2>Shop</h2>' + S.getCategories().slice(0, 3).map((category) => '<a href="' + e(categoryLink(category.name)) + '">' + e(category.name) + '</a>').join('') + '<a href="category.html">All products</a></nav>' +
      '<div><h2>Support</h2><button type="button" data-st-demo="Demo only: contact information will be added by the store.">Contact us</button><button type="button" data-st-demo="Demo only: returns policy will be added by the store.">Returns policy</button>' + (phone ? '<p class="st-footer-phone">' + e(phone) + '</p>' : '') + (address ? '<p class="st-footer-address">' + e(address) + '</p>' : '') + '</div>' +
      '<div><h2>Payment</h2><p>Cash on delivery</p><p>Card</p><a href="' + e(S.checkoutLink()) + '">Checkout</a></div></div><div class="st-footer-bottom">Voltix Phase 1 demo <span>' + e(settings.storeName) + '</span></div></div></footer>';
  }

  function ensureToast() {
    let region = document.getElementById('st-toast');
    if (!region) {
      region = document.createElement('div');
      region.id = 'st-toast'; region.className = 'st-toast';
      region.setAttribute('role', 'status'); region.setAttribute('aria-live', 'polite'); region.setAttribute('aria-atomic', 'true');
      document.body.appendChild(region);
    }
    return region;
  }
  function toast(message) {
    const region = ensureToast();
    clearTimeout(toastTimer);
    region.textContent = message;
    region.classList.add('st-toast-visible');
    toastTimer = setTimeout(() => region.classList.remove('st-toast-visible'), 4500);
  }

  function stockBadge(product, showCount = false) {
    const state = !product.stock ? 'out' : product.stock <= product.lowStockThreshold ? 'low' : 'in';
    const label = state === 'out' ? 'Out of stock' : state === 'low' ? 'Only ' + product.stock + ' left' : 'In stock' + (showCount ? ': ' + product.stock : '');
    return '<span class="st-stock st-stock-' + state + '">' + label + '</span>';
  }

  /** Shared card markup: all inventory text is escaped; no internal fields appear. */
  function productCard(product) {
    const deal = S.getDeal(product);
    const link = 'product.html?id=' + encodeURIComponent(product.id);
    return '<article class="st-product-card"><a class="st-product-visual" href="' + e(link) + '" aria-label="View ' + e(product.name) + '">' +
      (product.image ? '<img class="st-product-image" src="' + e(product.image) + '" alt="' + e(product.name) + '" loading="lazy">' : '') +
      (deal ? '<span class="st-deal-badge">−' + e(S.money(deal.savings)) + '</span>' : '') + '</a>' +
      '<div class="st-product-body"><p class="st-product-brand">' + e(product.brand) + '</p><h3><a href="' + e(link) + '">' + e(product.name) + '</a></h3>' +
      '<div class="st-product-price"><div><strong>' + e(S.money(S.dealPrice(product))) + '</strong>' + (deal ? '<del>' + e(S.money(product.price)) + '</del>' : '') + '</div>' + stockBadge(product) + '</div>' +
      '<button class="st-button st-button-primary st-add" type="button" data-st-add="' + e(product.id) + '"' + (!product.stock ? ' disabled' : '') + '>' + (!product.stock ? 'Out of stock' : 'Add to cart') + '</button></div></article>';
  }

  /** One fragment insertion keeps catalog rendering inexpensive for large lists. */
  function renderCards(host, products) {
    const template = document.createElement('template');
    template.innerHTML = products.map(productCard).join('');
    const fragment = document.createDocumentFragment();
    fragment.appendChild(template.content);
    host.replaceChildren(fragment);
  }
  function emptyCatalog(host) {
    host.innerHTML = '<div class="st-empty"><h2>The store is being stocked.</h2><p>Check back soon.</p><a class="st-button st-button-outline" href="../index.html">Open staff app to load demo products</a></div>';
  }
  function refreshCount() {
    document.querySelectorAll('[data-st-cart-count]').forEach((node) => { node.textContent = S.cartCount(); });
  }

  /** Native modal isolation plus explicit focus trapping, Escape and focus return. */
  function dialogHelper(dialog, onClose) {
    let returnFocus = null;
    function close() { if (dialog.open) dialog.close(); }
    function open(trigger) {
      if (dialog.open) return;
      returnFocus = trigger || document.activeElement;
      dialog.showModal();
      document.body.classList.add('st-modal-open');
      const target = dialog.querySelector('[data-st-initial-focus], button, input, [tabindex]');
      if (target) target.focus();
    }
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('st-modal-open');
      if (onClose) onClose();
      if (returnFocus && returnFocus.isConnected) returnFocus.focus();
    });
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const nodes = Array.from(dialog.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]')).filter((node) => node.getClientRects().length);
      if (!nodes.length) { event.preventDefault(); dialog.focus(); return; }
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && (document.activeElement === first || !nodes.includes(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    return { open, close };
  }

  document.addEventListener('click', (event) => {
    const add = event.target.closest('[data-st-add]');
    if (add && !add.disabled) { const result = S.addToCart(add.dataset.stAdd); toast(result.message); refreshCount(); }
    const demo = event.target.closest('[data-st-demo]');
    if (demo) toast(demo.dataset.stDemo);
    if (event.target.closest('[data-st-signout]')) {
      if (S.signOut()) { renderHeader(); toast('You have signed out.'); }
      else toast('Sign out could not be completed. Please allow browser storage.');
    }
    document.querySelectorAll('.st-account-menu[open]').forEach((menu) => { if (!menu.contains(event.target)) menu.open = false; });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') document.querySelectorAll('.st-account-menu[open]').forEach((menu) => { menu.open = false; menu.querySelector('summary').focus(); });
  });
  document.addEventListener('error', (event) => {
    if (event.target.matches && event.target.matches('.st-product-image')) event.target.hidden = true;
  }, true);
  window.addEventListener('storage', (event) => {
    if (event.key !== null && !Object.values(S.KEYS).includes(event.key)) return;
    renderHeader(); renderFooter();
    window.dispatchEvent(new CustomEvent('voltix:store-refresh'));
  });
  window.addEventListener('voltix:store-cart-changed', refreshCount);
  window.addEventListener('voltix:store-session-changed', () => { renderHeader(); renderFooter(); });
  window.addEventListener('pageshow', () => { renderHeader(); renderFooter(); window.dispatchEvent(new CustomEvent('voltix:store-refresh')); });
  window.VoltixStoreUI = Object.freeze({ renderHeader, renderFooter, toast, stockBadge, productCard, renderCards, emptyCatalog, dialogHelper, categoryLink, orderStatus, orderDate });
  renderHeader(); renderFooter(); ensureToast();
})(window, document);
