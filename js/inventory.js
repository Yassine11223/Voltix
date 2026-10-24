(function () {
  'use strict';

  const store = window.VoltixInventory;
  const $ = (selector) => document.querySelector(selector);
  const modal = new window.VoltixUI.ModalController($('#modalRoot'));
  let activeTab = 'levels';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const supplierName = (id) => store.getSuppliers().find((supplier) => supplier.id === id)?.name || 'Unassigned';
  const showToast = (message, type = 'success') => { const toast = document.createElement('div'); toast.className = `toast ${type}`; toast.textContent = message; $('#toasts').append(toast); window.setTimeout(() => toast.remove(), 3000); };

  function statusBadge(product) {
    const status = store.getStockStatus(product);
    const label = status === 'in-stock' ? 'In stock' : status === 'low' ? 'Low stock' : 'Out of stock';
    const className = status === 'in-stock' ? 'badge-success' : status === 'low' ? 'badge-warning' : 'badge-danger';
    return `<span class="badge ${className}">${label}</span>`;
  }

  function renderStats() {
    const products = store.getProducts();
    $('#stats').innerHTML = `<div class="stat-card"><span class="label">Total SKUs</span><strong>${products.length}</strong></div><div class="stat-card"><span class="label">Units in stock</span><strong>${products.reduce((sum, product) => sum + product.stock, 0).toLocaleString()}</strong></div><div class="stat-card"><span class="label">Low stock</span><strong>${products.filter((product) => store.getStockStatus(product) === 'low').length}</strong></div><div class="stat-card"><span class="label">Out of stock</span><strong>${products.filter((product) => store.getStockStatus(product) === 'out').length}</strong></div>`;
    const lowStock = store.getLowStockProducts();
    $('#receiveBtn').hidden = !store.can('inventory:write');
    $('[data-tab="receive"]').hidden = !store.can('inventory:write');
    $('#readOnlyNote').hidden = store.can('inventory:write');
    $('#alert').innerHTML = lowStock.length ? `<div class="alert"><div><strong>Stock needs attention</strong><p>${lowStock.length} item${lowStock.length === 1 ? '' : 's'} below threshold.</p><div class="alert-list">${lowStock.slice(0, 5).map((product) => `<span>${escapeHtml(product.name)} - ${product.stock} left</span>`).join('')}</div></div>${store.can('inventory:write') ? '<button class="btn btn-secondary" type="button" id="alertReceive">Restock</button>' : ''}</div>` : '';
  }

  function renderLevels() {
    const canWrite = store.can('inventory:write');
    const products = store.getProducts();
    $('#tabContent').innerHTML = `<div class="table-wrap" role="region" aria-label="Inventory table" tabindex="0"><table class="data-table"><thead><tr><th>Product</th><th>Category</th><th>Current stock</th><th>Threshold</th><th>Status</th><th>Level</th>${canWrite ? '<th>Actions</th>' : ''}</tr></thead><tbody>${products.map((product) => `<tr><td><div class="product-name">${escapeHtml(product.name)}</div><div class="subtle">${escapeHtml(product.sku)} - ${escapeHtml(supplierName(product.supplier))}</div></td><td>${escapeHtml(product.category)}</td><td><strong>${product.stock}</strong></td><td>${product.lowStockThreshold}</td><td>${statusBadge(product)}</td><td><div class="progress"><span class="${store.getStockStatus(product) === 'low' ? 'low' : store.getStockStatus(product) === 'out' ? 'out' : ''}" style="width:${Math.min(100, product.lowStockThreshold ? product.stock / (product.lowStockThreshold * 3) * 100 : 100)}%"></span></div></td>${canWrite ? `<td><button class="btn btn-secondary" type="button" data-adjust="${product.id}">Adjust</button> <button class="btn btn-quiet" type="button" data-receive="${product.id}">Quick receive</button></td>` : ''}</tr>`).join('')}</tbody></table></div>`;
  }

  function renderReceive(prefillProduct = '') {
    if (!store.can('inventory:write')) return;
    let selectedSupplier = new URLSearchParams(window.location.search).get('supplier') || '';
    let deliveryReference = '';
    const lines = [{ productId: prefillProduct, quantity: 1 }];

    const draw = () => {
      if (!store.can('inventory:write')) return;
      $('#tabContent').innerHTML = `<div class="form-grid"><div class="field"><label for="deliverySupplier">Supplier</label><select id="deliverySupplier"><option value="">Select supplier</option>${store.getSuppliers().map((supplier) => `<option value="${supplier.id}" ${selectedSupplier === supplier.id ? 'selected' : ''}>${escapeHtml(supplier.name)}</option>`).join('')}</select></div><div class="field"><label for="deliveryRef">Delivery reference / invoice</label><input id="deliveryRef" value="${escapeHtml(deliveryReference)}" placeholder="e.g. INV-1042"></div><div class="field full"><label>Products received</label><div class="line-items" id="lineItems">${lines.map((line, index) => `<div class="line-item"><select data-line="${index}" aria-label="Product line ${index + 1}"><option value="">Select product</option>${store.getProducts().filter((product) => product.status === 'active').map((product) => `<option value="${product.id}" ${line.productId === product.id ? 'selected' : ''}>${escapeHtml(product.name)} - ${escapeHtml(product.sku)}</option>`).join('')}</select><input type="number" min="1" step="1" value="${line.quantity}" data-quantity="${index}" aria-label="Quantity line ${index + 1}"><button class="icon-btn touch-target" type="button" data-remove="${index}" aria-label="Remove product line">X</button></div>`).join('')}</div><button class="btn btn-secondary" type="button" id="addLine">Add product line</button></div></div><div class="modal-footer"><button class="btn btn-primary" type="button" id="confirmDelivery">Confirm delivery</button></div>`;
      $('#deliverySupplier').addEventListener('change', (event) => { selectedSupplier = event.target.value; });
      $('#deliveryRef').addEventListener('input', (event) => { deliveryReference = event.target.value; });
      $('#addLine').addEventListener('click', () => { if (!store.can('inventory:write')) return; lines.push({ productId: '', quantity: 1 }); draw(); });
      document.querySelectorAll('[data-line]').forEach((element) => element.addEventListener('change', () => { lines[Number(element.dataset.line)].productId = element.value; }));
      document.querySelectorAll('[data-quantity]').forEach((element) => element.addEventListener('change', () => { lines[Number(element.dataset.quantity)].quantity = Number(element.value); }));
      document.querySelectorAll('[data-remove]').forEach((element) => element.addEventListener('click', () => { lines.splice(Number(element.dataset.remove), 1); draw(); }));
      $('#confirmDelivery').addEventListener('click', () => {
        if (!store.can('inventory:write')) return;
        const reference = $('#deliveryRef').value.trim();
        if (!$('#deliverySupplier').value || !lines.length || lines.some((line) => !line.productId || !Number.isInteger(line.quantity) || line.quantity < 1)) { showToast('Choose a supplier and valid product quantities.', 'error'); return; }
        const result = store.receiveDelivery(lines, $('#deliverySupplier').value, reference);
        if (!result.ok) { showToast(result.error, 'error'); return; }
        showToast('Delivery received'); activeTab = 'levels'; render();
      });
    };
    draw();
  }

  function renderHistory() {
    if (!store.can('movement:read')) return;
    const movements = store.getMovements();
    const productOptions = [...new Map(movements.map((movement) => { const product = store.getProductById(movement.productId); return [movement.productId, { id: movement.productId, name: movement.productName || product?.name || `Deleted product (${movement.productId})`, deleted: !product }]; })).values()].sort((a, b) => a.name.localeCompare(b.name));
    $('#tabContent').innerHTML = `<div class="toolbar" style="margin-bottom:18px"><select id="movementProduct" aria-label="Filter by product"><option value="">All products</option>${productOptions.map((product) => `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)}${product.deleted ? ' (deleted)' : ''}</option>`).join('')}</select><select id="movementType" aria-label="Movement type"><option value="">All movement types</option><option value="receive">Receives</option><option value="adjust">Adjustments</option><option value="sale">Sales</option><option value="return">Returns</option><option value="initial">Initial</option><option value="delete">Deleted products</option></select><input id="movementUser" placeholder="Filter by user" aria-label="Filter by user"><button class="btn btn-secondary" type="button" id="exportCsv">Export CSV</button></div><div class="table-wrap" role="region" aria-label="Inventory table" tabindex="0"><table class="data-table"><thead><tr><th>Date</th><th>Product</th><th>SKU</th><th>Type</th><th>Change</th><th>Before - After</th><th>User</th><th>Reference</th></tr></thead><tbody id="movementRows">${movementRows(movements)}</tbody></table></div>`;
    const updateRows = () => { const productId = $('#movementProduct').value; const type = $('#movementType').value; const user = $('#movementUser').value.trim(); $('#movementRows').innerHTML = movementRows(store.getMovements({ productId, type, user })); };
    $('#movementProduct').addEventListener('change', updateRows);
    $('#movementType').addEventListener('change', updateRows); $('#movementUser').addEventListener('input', updateRows);
    $('#exportCsv').addEventListener('click', () => {
      if (!store.can('movement:read')) return;
      const filtered = store.getMovements({ productId: $('#movementProduct').value, type: $('#movementType').value, user: $('#movementUser').value.trim() });
      const csv = ['Date,Product,SKU,Type,Change,Before,After,User,Reference', ...filtered.map((movement) => { const product = store.getProductById(movement.productId); const name = movement.productName || product?.name || `Deleted product (${movement.productId})`; const sku = movement.sku || product?.sku || ''; return [movement.date, name, sku, movement.type, movement.change, movement.stockBefore, movement.stockAfter, movement.user, movement.reference].map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','); })].join('\n');
      const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'voltix-movement-history.csv'; link.click(); URL.revokeObjectURL(link.href);
    });
  }

  function movementRows(movements) {
    return movements.map((movement) => {
      const product = store.getProductById(movement.productId);
      const deleted = !product;
      const name = movement.productName || product?.name || `Deleted product (${movement.productId})`;
      const sku = movement.sku || product?.sku || '';
      const change = movement.change >= 0 ? `+${movement.change}` : movement.change;
      return `<tr><td>${escapeHtml(new Date(movement.date).toLocaleString())}</td><td class="movement-product${deleted ? ' subtle' : ''}">${escapeHtml(name)}${deleted ? ' <span class="badge badge-neutral">Deleted</span>' : ''}</td><td class="subtle">${escapeHtml(sku || '-')}</td><td><span class="badge badge-neutral">${escapeHtml(movement.type)}</span></td><td class="movement-change">${change}</td><td>${movement.stockBefore} - ${movement.stockAfter}</td><td>${escapeHtml(movement.user)}</td><td>${escapeHtml(movement.reference || '-')}</td></tr>`;
    }).join('');
  }

  function openAdjustModal(productId, trigger = document.activeElement) {
    if (!store.can('inventory:write')) return;
    const product = store.getProductById(productId);
    if (!product) return;
    modal.open(`<div class="modal-backdrop" id="adjustBackdrop"><form class="modal" id="adjustForm" role="dialog" aria-modal="true" aria-labelledby="adjustTitle"><div class="modal-header"><h2 id="adjustTitle">Adjust stock</h2><button class="close touch-target" type="button" data-close aria-label="Close dialog">X</button></div><div class="modal-body"><p><strong>${escapeHtml(product.name)}</strong> - current stock ${product.stock}</p><div class="form-grid"><div class="field"><label for="direction">Adjustment</label><select id="direction"><option value="1">Add stock</option><option value="-1">Remove stock</option></select></div><div class="field"><label for="adjustQty">Quantity</label><input id="adjustQty" type="number" min="1" step="1" value="1" required></div><div class="field full"><label for="reason">Reason</label><select id="reason"><option>Damaged</option><option>Lost</option><option>Recount</option><option>Correction</option><option>Other</option></select></div><div class="field full"><label for="note">Note</label><textarea id="note" placeholder="Optional context"></textarea></div></div></div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close>Cancel</button><button class="btn btn-primary" type="submit">Save adjustment</button></div></form></div>`, trigger);
    $('#adjustQty').focus();
    $('#adjustBackdrop').addEventListener('click', (event) => { if (event.target.id === 'adjustBackdrop' || event.target.matches('[data-close]')) modal.close(); });
    $('#adjustForm').addEventListener('submit', (event) => { event.preventDefault(); if (!store.can('inventory:write')) return; const change = Number($('#direction').value) * Number($('#adjustQty').value); const result = store.adjustStock(productId, change, `${$('#reason').value}: ${$('#note').value.trim()}`); if (!result.ok) { showToast(result.error, 'error'); return; } modal.close(); render(); showToast('Stock updated'); });
  }

  function setTab(tab) {
    if (!['levels', 'receive', 'history'].includes(tab)) return;
    if (tab === 'receive' && !store.can('inventory:write')) tab = 'levels';
    if (tab === 'history' && !store.can('movement:read')) tab = 'levels';
    activeTab = tab;
    $('#tabContent').setAttribute('aria-labelledby', `tab-${activeTab}`); document.querySelectorAll('.tab').forEach((button) => { const selected = button.dataset.tab === activeTab; button.classList.toggle('active', selected); button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1; }); }
  function render() { renderStats(); setTab(activeTab); if (activeTab === 'levels') renderLevels(); else if (activeTab === 'receive') renderReceive(); else renderHistory(); }

  document.addEventListener('DOMContentLoaded', () => {
    const user = window.VoltixUI.renderShell('inventory');
    if (!user) return;
    if (!window.VoltixUI.can('movement:read', user)) document.querySelector('[data-tab="history"]')?.remove();
    if (store.can('inventory:write') && new URLSearchParams(window.location.search).get('supplier')) activeTab = 'receive';
    render();
    document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => { setTab(button.dataset.tab); render(); }));
    $('#receiveBtn').addEventListener('click', () => { if (!store.can('inventory:write')) return; activeTab = 'receive'; render(); });
    $('.tabs').addEventListener('keydown', (event) => {
      const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      const tabs = [...document.querySelectorAll('.tab')].filter((button) => !button.hidden);
      const index = tabs.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      event.preventDefault(); tabs[next].focus(); setTab(tabs[next].dataset.tab); render();
    });
    document.addEventListener('click', (event) => { if (!store.can('inventory:write')) return; if (event.target.matches('[data-adjust]')) openAdjustModal(event.target.dataset.adjust); if (event.target.matches('[data-receive]')) { activeTab = 'receive'; setTab('receive'); renderReceive(event.target.dataset.receive); } if (event.target.id === 'alertReceive') { activeTab = 'receive'; render(); } });
    window.addEventListener('voltix:data-changed', render);
  });
}());
