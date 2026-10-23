(function () {
  'use strict';

  const store = window.VoltixInventory;
  const $ = (selector) => document.querySelector(selector);
  const modal = new window.VoltixUI.ModalController($('#modalRoot'));
  let currentPage = 1;
  let pageSize = 10;
  let editingProduct = null;
  let lastTrigger = null;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    $('#toasts').append(toast);
    window.setTimeout(() => toast.remove(), 3200);
  };

  const getSupplierName = (supplierId) => store.getSuppliers().find((item) => item.id === supplierId)?.name || 'Unassigned';

  const stockBadge = (product) => {
    const status = store.getStockStatus(product);
    const label = status === 'in-stock' ? 'In stock' : status === 'low' ? 'Low stock' : 'Out of stock';
    const className = status === 'in-stock' ? 'badge-success' : status === 'low' ? 'badge-warning' : 'badge-danger';
    return `<span class="badge ${className}">${label}</span>`;
  };

  function renderFilters() {
    const categoryValue = $('#categoryFilter').value;
    const supplierValue = $('#supplierFilter').value;
    const categories = [...new Set(store.getProducts().map((product) => product.category))].sort();
    $('#categoryFilter').innerHTML = '<option value="">All categories</option>' + categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
    $('#supplierFilter').innerHTML = '<option value="">All suppliers</option>' + store.getSuppliers().map((supplier) => `<option value="${supplier.id}">${escapeHtml(supplier.name)}</option>`).join('');
    $('#categoryFilter').value = categoryValue;
    $('#supplierFilter').value = supplierValue;
  }

  function filteredProducts() {
    const query = $('#search').value.trim().toLowerCase();
    const category = $('#categoryFilter').value;
    const supplier = $('#supplierFilter').value;
    const status = $('#statusFilter').value;
    const sort = $('#sort').value;
    const products = store.getProducts().filter((product) => {
      const searchable = `${product.name} ${product.sku} ${product.category}`.toLowerCase();
      return searchable.includes(query) && (!category || product.category === category) && (!supplier || product.supplier === supplier) && (!status || store.getStockStatus(product) === status);
    });
    products.sort((a, b) => sort === 'price' ? b.price - a.price : sort === 'stock' ? a.stock - b.stock : sort === 'newest' ? new Date(b.createdAt) - new Date(a.createdAt) : a.name.localeCompare(b.name));
    return products;
  }

  function render() {
    const canWrite = store.can('product:write');
    const canDelete = store.can('product:delete');
    $('#addProductBtn').hidden = !canWrite;
    $('[data-product-actions]').hidden = !canWrite;
    $('#readOnlyNote').hidden = canWrite;
    const products = filteredProducts();
    const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * pageSize;
    const visible = products.slice(start, start + pageSize);

    $('#productRows').innerHTML = visible.length ? visible.map((product) => `
      <tr><td class="subtle">${escapeHtml(product.id)}</td><td><div class="product-name">${escapeHtml(product.name)}</div><div class="subtle">${escapeHtml(product.sku)}</div></td><td>${escapeHtml(product.category)}</td><td>${escapeHtml(getSupplierName(product.supplier))}</td><td>${store.formatCurrency(product.price)}</td><td><strong>${product.stock}</strong> ${stockBadge(product)}</td>${canWrite ? `<td><div class="row-actions"><button class="icon-btn" type="button" data-action="edit" data-id="${product.id}">Edit</button><button class="icon-btn" type="button" data-action="archive" data-id="${product.id}">${product.status === 'archived' ? 'Restore' : 'Archive'}</button>${canDelete ? `<button class="icon-btn" type="button" data-action="delete" data-id="${product.id}">Delete</button>` : ''}</div></td>` : ''}</tr>`).join('') : `<tr><td colspan="${canWrite ? 7 : 6}"><div class="empty"><h3>No products found</h3><p>Try adjusting your filters${canWrite ? ' or add a new product' : ''}.</p>${canWrite ? '<button class="btn btn-primary" type="button" id="emptyAdd">Add product</button>' : ''}</div></td></tr>`;

    $('#pagination').innerHTML = `<span>Showing ${products.length ? start + 1 : 0}-${Math.min(start + pageSize, products.length)} of ${products.length}</span><div class="pagination-controls"><select id="pageSize" aria-label="Page size"><option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option><option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option><option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option></select><button type="button" id="prev" aria-label="Previous page" ${currentPage === 1 ? 'disabled' : ''}>Prev</button><span>Page ${currentPage} of ${totalPages}</span><button type="button" id="next" aria-label="Next page" ${currentPage === totalPages ? 'disabled' : ''}>Next</button></div>`;

    const allProducts = store.getProducts();
    $('#stats').innerHTML = `<div class="stat-card"><span class="label">Total products</span><strong>${allProducts.filter((product) => product.status === 'active').length}</strong><span class="trend">Catalog items</span></div><div class="stat-card"><span class="label">Total stock units</span><strong>${allProducts.reduce((sum, product) => sum + product.stock, 0).toLocaleString()}</strong><span class="trend">Across all SKUs</span></div><div class="stat-card"><span class="label">Low stock</span><strong>${store.getLowStockProducts().filter((product) => product.stock > 0).length}</strong><span class="trend">Needs attention</span></div><div class="stat-card"><span class="label">Inventory value</span><strong>${store.formatCurrency(allProducts.reduce((sum, product) => sum + product.stock * product.cost, 0))}</strong><span class="trend">At cost</span></div>`;
  }

  function closeModal() {
    modal.close();
    editingProduct = null;
    if (lastTrigger) lastTrigger.focus();
  }

  function openProductModal(product = null, trigger = null) {
    if (!store.can('product:write')) return;
    editingProduct = product;
    lastTrigger = trigger;
    const categories = [...new Set(store.getProducts().map((item) => item.category))].sort();
    modal.open(`<div class="modal-backdrop" id="productBackdrop"><form class="modal" id="productForm" role="dialog" aria-modal="true" aria-labelledby="productModalTitle"><div class="modal-header"><h2 id="productModalTitle">${product ? 'Edit product' : 'Add product'}</h2><button class="close touch-target" type="button" data-close aria-label="Close dialog">X</button></div><div class="modal-body"><div class="form-grid"><div class="field"><label for="fName">Product name</label><input id="fName" required value="${escapeHtml(product?.name)}"><span class="error" data-error="name"></span></div><div class="field"><label for="fSku">SKU</label><input id="fSku" required value="${escapeHtml(product?.sku)}"><span class="error" data-error="sku"></span></div><div class="field"><label for="fCategory">Category</label><input id="fCategory" list="categoryList" required value="${escapeHtml(product?.category)}"><datalist id="categoryList">${categories.map((category) => `<option value="${escapeHtml(category)}">`).join('')}</datalist><span class="error" data-error="category"></span></div><div class="field"><label for="fSupplier">Supplier</label><select id="fSupplier"><option value="">Select supplier</option>${store.getSuppliers().map((supplier) => `<option value="${supplier.id}" ${product?.supplier === supplier.id ? 'selected' : ''}>${escapeHtml(supplier.name)}</option>`).join('')}</select></div><div class="field"><label for="fPrice">Selling price</label><input id="fPrice" type="number" min="0.01" step="0.01" required value="${product?.price ?? ''}"><span class="error" data-error="price"></span></div><div class="field"><label for="fCost">Cost</label><input id="fCost" type="number" min="0" step="0.01" value="${product?.cost ?? ''}"><span class="error" data-error="cost"></span></div>${product ? '' : '<div class="field"><label for="fStock">Initial stock</label><input id="fStock" type="number" min="0" step="1" value="0"><span class="error" data-error="stock"></span></div>'}<div class="field"><label for="fThreshold">Low-stock threshold</label><input id="fThreshold" type="number" min="0" step="1" value="${product?.lowStockThreshold ?? 5}"><span class="error" data-error="threshold"></span></div><div class="field full"><label for="fDescription">Description <span class="hint">Optional</span></label><textarea id="fDescription">${escapeHtml(product?.description)}</textarea></div></div></div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close>Cancel</button><button class="btn btn-primary" type="submit">${product ? 'Save changes' : 'Add product'}</button></div></form></div>`, trigger);
    $('#fName').focus();
    $('#productForm').addEventListener('submit', saveProduct);
    $('#productBackdrop').addEventListener('click', (event) => { if (event.target.id === 'productBackdrop' || event.target.matches('[data-close]')) closeModal(); });
  }

  function saveProduct(event) {
    event.preventDefault();
    if (!store.can('product:write')) return;
    const isEditing = Boolean(editingProduct);
    const data = { name: $('#fName').value.trim(), sku: $('#fSku').value.trim(), category: $('#fCategory').value.trim(), supplier: $('#fSupplier').value, price: $('#fPrice').value, cost: $('#fCost').value, stock: isEditing ? editingProduct.stock : $('#fStock').value, lowStockThreshold: $('#fThreshold').value, description: $('#fDescription').value };
    const result = isEditing ? store.updateProduct(editingProduct.id, data) : store.addProduct(data);
    if (!result.ok) { showToast(result.error, 'error'); return; }
    closeModal(); renderFilters(); render(); showToast(isEditing ? 'Product updated' : 'Product added');
  }

  function confirmProductAction(action, product, trigger) {
    const permission = action === 'delete' ? 'product:delete' : 'product:write';
    if (!store.can(permission)) return;
    lastTrigger = trigger;
    modal.open(`<div class="modal-backdrop" id="confirmBackdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirmTitle"><div class="modal-header"><h2 id="confirmTitle">${action === 'delete' ? 'Delete product' : product.status === 'archived' ? 'Restore product' : 'Archive product'}</h2><button class="close touch-target" type="button" data-close aria-label="Close dialog">X</button></div><div class="modal-body"><p>Are you sure you want to ${action} <strong>${escapeHtml(product.name)}</strong>?</p><p class="hint">${action === 'delete' ? 'Archiving is safer when sales history exists.' : 'Archived products remain in the catalog and can be restored later.'}</p></div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close>Cancel</button><button class="btn ${action === 'delete' ? 'btn-danger' : 'btn-primary'}" type="button" id="confirmAction">${action[0].toUpperCase() + action.slice(1)}</button></div></div></div>`, trigger);
    $('#confirmBackdrop').addEventListener('click', (event) => {
      if (event.target.id === 'confirmBackdrop' || event.target.matches('[data-close]')) closeModal();
      if (event.target.id === 'confirmAction') { if (!store.can(permission)) return; const result = action === 'delete' ? store.deleteProduct(product.id) : store.archiveProduct(product.id); if (!result.ok) { showToast(result.error, 'error'); return; } closeModal(); render(); showToast(`Product ${action}d`); }
    });
    $('#confirmAction').focus();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const user = window.VoltixUI.renderShell('products');
    if (!user) return;
    renderFilters(); render();
    ['categoryFilter', 'supplierFilter', 'statusFilter', 'sort'].forEach((id) => $(`#${id}`).addEventListener('change', () => { currentPage = 1; render(); }));
    let searchTimer; $('#search').addEventListener('input', () => { window.clearTimeout(searchTimer); searchTimer = window.setTimeout(() => { currentPage = 1; render(); }, 250); });
    $('#resetBtn').addEventListener('click', () => { $('#search').value = ''; $('#categoryFilter').value = ''; $('#supplierFilter').value = ''; $('#statusFilter').value = ''; $('#sort').value = 'name'; currentPage = 1; render(); });
    $('#addProductBtn').addEventListener('click', (event) => { if (store.can('product:write')) openProductModal(null, event.currentTarget); });
    document.addEventListener('click', (event) => { const button = event.target.closest('[data-action]'); if (button) { const product = store.getProductById(button.dataset.id); if (!store.can('product:write')) return; if (button.dataset.action === 'edit') openProductModal(product, button); if (button.dataset.action === 'archive') confirmProductAction('archive', product, button); if (button.dataset.action === 'delete' && store.can('product:delete')) confirmProductAction('delete', product, button); } if (event.target.id === 'emptyAdd' && store.can('product:write')) openProductModal(null, event.target); if (event.target.id === 'prev') { currentPage -= 1; render(); } if (event.target.id === 'next') { currentPage += 1; render(); } });
    $('#pagination').addEventListener('change', (event) => { if (event.target.id === 'pageSize') { pageSize = Number(event.target.value); currentPage = 1; render(); } });
    window.addEventListener('voltix:data-changed', () => { renderFilters(); render(); });
  });
}());
