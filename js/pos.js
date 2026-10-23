(function (window) {
  'use strict';
  const SEARCH_DELAY_MS = 150;
  const CARD_DELAY_MS = 1200;
  const store = window.VoltixPOSStore;
  const receipt = window.VoltixReceipt;
  const user = store.getSession();
  if (!user) { window.location.replace('../index.html'); return; }
  const $ = (id) => document.getElementById(id);
  const esc = store.escapeHtml;
  const money = (value) => esc(store.formatMoney(value));
  const mobile = window.matchMedia('(max-width: 760px)');
  let products = [];
  let cart = store.getCart();
  let category = '';
  let query = '';
  let searchTimer;
  let processing = false;
  let seeding = false;
  let totals = null;
  let drawerReturnFocus = null;
  let cartStorageWarned = false;

  function toast(message) {
    const element = document.createElement('div');
    element.className = 'pos-toast';
    element.textContent = message;
    $('pos-toasts').append(element);
    while ($('pos-toasts').children.length > 3) $('pos-toasts').firstElementChild.remove();
    window.setTimeout(() => element.remove(), 5000);
  }
  function saveCart() {
    if (!store.setCart(cart) && !cartStorageWarned) {
      toast('The cart cannot be saved for this session. Keep this tab open.');
      cartStorageWarned = true;
    }
  }
  const productById = (id) => products.find((product) => product.id === id);
  const stockOf = (product) => Number.isSafeInteger(Number(product?.stock)) ? Math.max(0, Number(product.stock)) : 0;
  const sellable = (product) => product && Number.isFinite(Number(product.price)) && Number(product.price) >= 0 && Number(product.price) <= 1e12 && stockOf(product) > 0;
  const itemCount = () => cart.reduce((count, line) => count + line.quantity, 0);
  const paymentMethod = () => document.querySelector('input[name="payment"]:checked').value;
  const discountInput = () => ({ type: $('pos-discount-type').value, value: $('pos-discount-type').value === 'none' ? 0 : Number($('pos-discount-value').value) });

  function renderCategories() {
    const categories = Array.from(new Set(products.map((p) => String(p.category || 'Uncategorized')))).sort();
    if (category && !categories.includes(category)) category = '';
    const fragment = document.createDocumentFragment();
    ['', ...categories].forEach((name) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pos-chip';
      button.dataset.category = name;
      button.setAttribute('aria-pressed', String(category === name));
      button.textContent = name || 'All categories';
      fragment.append(button);
    });
    $('pos-categories').replaceChildren(fragment);
  }

  // Build one fragment for the grid, even with hundreds of products.
  function renderProducts() {
    const filtered = products.filter((p) => (!category || String(p.category || 'Uncategorized') === category) &&
      (!$('pos-stock-only').checked || stockOf(p) > 0) &&
      [p.name, p.sku, p.category, p.id, p.barcode].some((field) => String(field ?? '').toLowerCase().includes(query)));
    const fragment = document.createDocumentFragment();
    filtered.forEach((product) => {
      const stock = stockOf(product);
      const low = stock <= Number(product.lowStockThreshold ?? 5);
      const card = document.createElement('button');
      card.className = 'pos-product';
      card.type = 'button';
      card.dataset.product = product.id;
      card.disabled = !sellable(product);
      card.setAttribute('aria-label', String(product.name) + ', ' + store.formatMoney(product.price) + ', ' + stock + ' in stock. Add to cart');
      card.innerHTML = `<strong class="pos-product-name">${esc(product.name)}</strong><span class="pos-product-meta">${esc(product.sku)}<br>${esc(product.category || 'Uncategorized')}</span><span class="pos-product-price">${money(product.price)}</span><span class="pos-badge${stock === 0 ? ' pos-badge-out' : low ? ' pos-badge-low' : ''}">${stock === 0 ? 'Out of stock' : (low ? 'Low stock' : 'In stock') + ' · ' + stock}</span>`;
      fragment.append(card);
    });
    $('pos-grid').replaceChildren(fragment);
    $('pos-results').textContent = filtered.length + ' product' + (filtered.length === 1 ? '' : 's');
    $('pos-empty').hidden = filtered.length > 0;
    $('pos-reset').hidden = !products.length;
    $('pos-seed').hidden = products.length > 0 || !store.canSeedDemoData();
    $('pos-seed').disabled = seeding;
    $('pos-products-link').hidden = products.length > 0;
    $('pos-empty-title').textContent = products.length ? 'No matching products' : 'No active products yet';
    $('pos-empty-message').textContent = products.length ? 'Try another search or reset your filters.' :
      (store.canSeedDemoData() ? 'Load demo inventory to try your first sale, or add products on the Products page.' : 'Open Products to add or activate products, then return here to make a sale.');
  }

  /** Refresh from the shared product source; drop unavailable lines and clamp stock. */
  function refresh(notify = true) {
    if (processing) return;
    products = store.getProducts();
    const next = [];
    let changed = false;
    cart.forEach((line) => {
      const product = productById(line.productId);
      if (!sellable(product)) { changed = true; return; }
      const quantity = Math.min(line.quantity, stockOf(product), 1e6);
      if (quantity !== line.quantity) changed = true;
      next.push({ productId: line.productId, quantity });
    });
    cart = next;
    if (changed) {
      saveCart();
      if (notify) toast('Cart updated to match current stock. Review it before checkout.');
    }
    renderCategories();
    renderProducts();
    renderCart();
  }

  function renderCart() {
    const count = itemCount();
    $('pos-count').textContent = '(' + count + ')';
    $('pos-clear').disabled = !cart.length || processing;
    $('pos-cart-lines').innerHTML = cart.length ? cart.map((line, index) => {
      const product = productById(line.productId);
      const name = esc(product.name);
      return `<div class="pos-cart-line" data-line="${esc(line.productId)}"><div class="pos-line-heading"><div><strong>${name}</strong><small>${money(product.price)} each</small></div><button class="pos-text-button" type="button" data-remove="${index}" aria-label="Remove ${name}">Remove</button></div><div class="pos-line-controls"><div class="pos-stepper"><button type="button" data-step="-1" data-index="${index}" aria-label="Decrease ${name}" ${line.quantity <= 1 ? 'disabled' : ''}>−</button><input id="pos-quantity-${index}" type="number" min="1" max="${stockOf(product)}" step="1" value="${line.quantity}" data-quantity="${index}" aria-label="Quantity for ${name}"><button type="button" data-step="1" data-index="${index}" aria-label="Increase ${name}">+</button></div><strong>${money(store.round2(product.price) * line.quantity)}</strong></div></div>`;
    }).join('') : '<p class="pos-cart-empty">Your cart is ready.<br>Select a product to start a sale.</p>';
    $('pos-cart-announcement').textContent = count + ' item' + (count === 1 ? '' : 's') + ' in cart.';
    updateSummary();
  }

  // Keep payment inputs in place while recalculating, so typing never loses focus.
  function updateSummary() {
    const settings = store.getSettings();
    const items = cart.map((line) => ({ unitPrice: store.round2(productById(line.productId).price), quantity: line.quantity }));
    const type = $('pos-discount-type').value;
    $('pos-discount-value').disabled = type === 'none';
    let discountError = '';
    let valid = true;
    try {
      totals = store.calcTotals(items, discountInput(), settings.taxRate);
      if (type !== 'none' && $('pos-discount-value').value.trim() === '') throw new Error('Enter a discount value.');
      if (user.role === 'staff' && ((type === 'percent' && totals.discount.value > store.constants.MAX_STAFF_DISCOUNT_PERCENT) ||
          (type === 'fixed' && totals.discount.value > totals.subtotal * store.constants.MAX_STAFF_DISCOUNT_PERCENT / 100))) {
        throw new Error('Staff discounts are limited to 10% (including fixed amounts).');
      }
    } catch (error) {
      valid = false;
      discountError = error.message;
      try { totals = store.calcTotals(items, { type: 'none', value: 0 }, settings.taxRate); }
      catch { totals = store.calcTotals([], { type: 'none', value: 0 }, settings.taxRate); }
    }
    $('pos-discount-value').max = type === 'percent' ? '100' : String(totals.subtotal);
    $('pos-discount-value').setAttribute('aria-invalid', String(!valid));
    $('pos-discount-error').textContent = discountError;
    $('pos-subtotal').textContent = store.formatMoney(totals.subtotal);
    $('pos-discount-amount').textContent = '−' + store.formatMoney(totals.discount.amount);
    $('pos-tax-label').textContent = 'Tax (' + settings.taxRate + '%)';
    $('pos-tax').textContent = store.formatMoney(totals.tax.amount);
    $('pos-total').textContent = store.formatMoney(totals.total);
    const cash = paymentMethod() === 'cash';
    $('pos-cash-fields').hidden = !cash;
    $('pos-card-note').hidden = cash;
    const tendered = Number($('pos-tendered').value);
    const paymentValid = !cash || ($('pos-tendered').value.trim() !== '' && Number.isFinite(tendered) && tendered >= 0 && tendered <= 1e12 && store.round2(tendered) >= totals.total);
    $('pos-tendered').setAttribute('aria-invalid', String(cash && !paymentValid && cart.length > 0));
    $('pos-payment-error').textContent = cash && !paymentValid && cart.length ? 'Enter an amount that covers the total.' : '';
    $('pos-change').textContent = store.formatMoney(Number.isFinite(tendered) ? Math.max(0, tendered - totals.total) : 0);
    $('pos-complete').disabled = processing || !cart.length || !valid || !paymentValid;
    $('pos-complete').textContent = processing ? 'Processing…' : 'Complete sale';
    $('pos-drawer-summary').textContent = itemCount() + ' items · ' + store.formatMoney(totals.total);
  }

  function changeQuantity(productId, requested, focusAction) {
    if (processing) return;
    // Reload live products on every cart change, including scanner input.
    products = store.getProducts();
    const product = productById(productId);
    if (!sellable(product)) { refresh(); toast('This product is no longer available.'); return; }
    let quantity = Number(requested);
    if (!Number.isSafeInteger(quantity) || quantity < 1) { quantity = 1; toast('Use a whole-number quantity of at least 1.'); }
    const max = Math.min(stockOf(product), 1e6);
    if (quantity > max) { quantity = max; toast('Only ' + max + ' in stock'); }
    const existing = cart.find((line) => line.productId === productId);
    if (existing) existing.quantity = quantity;
    else cart.push({ productId, quantity });
    saveCart();
    refresh();
    if (focusAction) {
      const index = cart.findIndex((line) => line.productId === productId);
      const selector = focusAction === 'quantity' ? `[data-quantity="${index}"]` : `[data-index="${index}"][data-step="${focusAction}"]`;
      $('pos-cart-lines').querySelector(selector)?.focus();
    }
  }
  function addProduct(id) {
    const line = cart.find((item) => item.productId === id);
    changeQuantity(id, (line?.quantity || 0) + 1);
  }

  function setDrawer(open) {
    open = open && mobile.matches;
    if (open) drawerReturnFocus = document.activeElement;
    document.body.classList.toggle('pos-drawer-open', open);
    $('pos-cart').classList.toggle('pos-cart-open', open);
    $('pos-drawer-toggle').setAttribute('aria-expanded', String(open));
    $('pos-cart').inert = mobile.matches && !open;
    document.querySelector('.pos-browser').inert = open || processing;
    document.querySelector('.pos-intro').inert = open;
    document.querySelector('.app-header').inert = open;
    $('app-sidebar').inert = mobile.matches ? true : window.matchMedia('(max-width: 980px)').matches;
    if (open) {
      $('pos-cart').setAttribute('role', 'dialog');
      $('pos-cart').setAttribute('aria-modal', 'true');
      $('pos-cart-close').focus();
    } else {
      $('pos-cart').removeAttribute('role');
      $('pos-cart').removeAttribute('aria-modal');
      if (drawerReturnFocus?.isConnected && mobile.matches) drawerReturnFocus.focus();
    }
  }

  function setProcessing(value) {
    processing = value;
    $('pos-checkout-form').inert = value;
    $('pos-cart-lines').inert = value;
    document.querySelector('.pos-browser').inert = value || $('pos-cart').classList.contains('pos-cart-open');
    $('pos-clear').disabled = value || !cart.length;
    $('pos-complete').disabled = true;
    $('pos-complete').textContent = value ? 'Processing…' : 'Complete sale';
    $('pos-cart').setAttribute('aria-busy', String(value));
  }

  /** Payment simulation happens before the synchronous, fresh-data transaction. */
  async function completeSale(event) {
    event?.preventDefault();
    if (processing) return;
    // Refresh first, and require explicit review if cart quantities changed.
    const before = JSON.stringify(cart);
    refresh();
    if (before !== JSON.stringify(cart) || $('pos-complete').disabled) return;
    const payload = { items: cart.map((line) => ({ ...line })), discount: discountInput(),
      payment: { method: paymentMethod(), amountTendered: Number($('pos-tendered').value) },
      customerName: $('pos-customer').value, note: $('pos-note').value, expectedTotal: totals.total };
    setProcessing(true);
    if (payload.payment.method === 'card') await new Promise((resolve) => window.setTimeout(resolve, CARD_DELAY_MS));
    const result = store.checkoutSale(payload);
    setProcessing(false);
    if (!result.ok) {
      refresh();
      toast((result.problems || [result.error]).join(' '));
      return;
    }
    cart = [];
    saveCart();
    $('pos-checkout-form').reset();
    setDrawer(false);
    refresh(false);
    toast('Sale ' + result.data.id + ' completed.');
    receipt.showReceipt(result.data, 'sale', () => $('pos-search').focus());
  }

  // Inventory seeds on evaluation, so load it only after the admin requests demo data.
  async function seedDemoProducts() {
    if (seeding || !store.canSeedDemoData()) { toast('Demo data can only be loaded into empty inventory. Open Products instead.'); return; }
    seeding = true;
    $('pos-seed').disabled = true;
    try {
      if (!window.VoltixInventory) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = '../js/inventory-store.js';
          script.onload = resolve;
          script.onerror = () => { script.remove(); reject(new Error('Could not load demo inventory. Open Products to add products instead.')); };
          document.head.append(script);
        });
      }
      if (store.canSeedDemoData()) {
        const seed = window.VoltixInventory?.seedDemoData || window.VoltixInventory?.seedDataIfEmpty;
        if (typeof seed !== 'function') throw new Error('No demo loader is available. Open Products to add products.');
        seed();
      }
      if (!store.getProducts().length) throw new Error('Demo products could not be saved. Check browser storage or open Products.');
      toast('Products are ready. Select one to start a sale.');
    } catch (error) { toast(error.message); }
    finally { seeding = false; refresh(); }
  }

  $('pos-subtitle').textContent = user.name + ' · ' + new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  $('pos-search').addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => { query = $('pos-search').value.trim().toLowerCase(); renderProducts(); }, SEARCH_DELAY_MS);
  });
  $('pos-search').addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const value = $('pos-search').value.trim().toLowerCase();
    const matches = store.getProducts().filter((p) => [p.sku, p.id, p.barcode].some((field) => field != null && String(field).toLowerCase() === value));
    if (!value || matches.length !== 1) { toast(matches.length > 1 ? 'Multiple products match. Select a product below.' : 'No exact SKU or ID match.'); return; }
    addProduct(matches[0].id);
    window.clearTimeout(searchTimer);
    $('pos-search').value = '';
    query = '';
    renderProducts();
  });
  $('pos-categories').addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    category = button.dataset.category;
    Array.from($('pos-categories').children).forEach((chip) => chip.setAttribute('aria-pressed', String(chip === button)));
    renderProducts();
  });
  $('pos-stock-only').addEventListener('change', renderProducts);
  $('pos-reset').addEventListener('click', () => {
    window.clearTimeout(searchTimer);
    query = ''; category = ''; $('pos-search').value = ''; $('pos-stock-only').checked = false;
    renderCategories(); renderProducts(); $('pos-search').focus();
  });
  $('pos-grid').addEventListener('click', (event) => {
    const button = event.target.closest('[data-product]');
    if (!button || button.disabled) return;
    const id = button.dataset.product;
    addProduct(id);
    Array.from($('pos-grid').children).find((card) => card.dataset.product === id)?.focus();
  });
  $('pos-cart-lines').addEventListener('click', (event) => {
    if (processing) return;
    const remove = event.target.closest('[data-remove]');
    const step = event.target.closest('[data-step]');
    if (remove) {
      const index = Number(remove.dataset.remove);
      cart.splice(index, 1); saveCart(); refresh();
      const next = $('pos-cart-lines').querySelector(`[data-remove="${Math.min(index, cart.length - 1)}"]`);
      (next || $('pos-clear')).focus();
    }
    if (step) {
      const line = cart[Number(step.dataset.index)];
      if (line) changeQuantity(line.productId, line.quantity + Number(step.dataset.step), step.dataset.step);
    }
  });
  $('pos-cart-lines').addEventListener('change', (event) => {
    if (!event.target.matches('[data-quantity]')) return;
    const line = cart[Number(event.target.dataset.quantity)];
    if (line) changeQuantity(line.productId, Number(event.target.value), 'quantity');
  });
  $('pos-clear').addEventListener('click', () => {
    if (processing || !cart.length || !window.confirm('Clear all products from this cart?')) return;
    cart = []; saveCart(); refresh();
    if (!mobile.matches) $('pos-search').focus();
  });
  $('pos-discount-type').addEventListener('change', updateSummary);
  $('pos-discount-value').addEventListener('input', updateSummary);
  $('pos-tendered').addEventListener('input', updateSummary);
  document.querySelectorAll('input[name="payment"]').forEach((input) => input.addEventListener('change', updateSummary));
  $('pos-quick-cash').addEventListener('click', (event) => {
    const button = event.target.closest('[data-cash]');
    if (!button || processing) return;
    $('pos-tendered').value = button.dataset.cash === 'exact' ? totals.total : store.round2((Number($('pos-tendered').value) || 0) + Number(button.dataset.cash));
    updateSummary();
  });
  $('pos-checkout-form').addEventListener('submit', completeSale);
  $('pos-seed').addEventListener('click', seedDemoProducts);
  $('pos-drawer-toggle').addEventListener('click', () => setDrawer(true));
  $('pos-cart-close').addEventListener('click', () => setDrawer(false));
  mobile.addEventListener('change', () => setDrawer(false));
  document.addEventListener('keydown', (event) => {
    if (document.querySelector('dialog[open]')) return;
    if (event.key === 'Escape' && $('pos-cart').classList.contains('pos-cart-open')) { event.preventDefault(); setDrawer(false); return; }
    if (event.key === 'Tab' && $('pos-cart').classList.contains('pos-cart-open')) {
      const targets = Array.from($('pos-cart').querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea')).filter((element) => element.getClientRects().length && !element.closest('[inert]'));
      const first = targets[0]; const last = targets[targets.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.matches('input, textarea, select, [contenteditable="true"]')) {
      event.preventDefault(); setDrawer(false); $('pos-search').focus();
    }
    if (event.key === 'Enter' && event.ctrlKey) { event.preventDefault(); if (!processing) completeSale(); }
  });
  window.addEventListener('storage', refresh);
  window.addEventListener('voltix:data-changed', refresh);
  window.addEventListener('focus', () => refresh());
  refresh();
  setDrawer(false);
  $('pos-search').focus();
})(window);
