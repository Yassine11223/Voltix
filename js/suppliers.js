(function () {
  'use strict';

  const store = window.VoltixInventory;
  const $ = (selector) => document.querySelector(selector);
  let lastTrigger = null;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const showToast = (message, type = 'success') => { const toast = document.createElement('div'); toast.className = `toast ${type}`; toast.textContent = message; $('#toasts').append(toast); window.setTimeout(() => toast.remove(), 3000); };
  const closeModal = () => { $('#modalRoot').replaceChildren(); if (lastTrigger) lastTrigger.focus(); };

  function render() {
    const query = $('#search').value.trim().toLowerCase();
    const status = $('#status').value;
    const products = store.getProducts();
    const suppliers = store.getSuppliers().filter((supplier) => `${supplier.name} ${supplier.contactPerson} ${supplier.email}`.toLowerCase().includes(query) && (!status || supplier.status === status));

    $('#rows').innerHTML = suppliers.length ? suppliers.map((supplier) => {
      const count = products.filter((product) => product.supplier === supplier.id).length;
      return `<tr><td><div class="product-name">${escapeHtml(supplier.name)}</div><div class="subtle">${escapeHtml(supplier.address || '')}</div></td><td>${escapeHtml(supplier.contactPerson || '-')}</td><td>${escapeHtml(supplier.phone || '-')}</td><td>${escapeHtml(supplier.email || '-')}</td><td>${count}</td><td><span class="badge ${supplier.status === 'active' ? 'badge-success' : 'badge-neutral'}">${escapeHtml(supplier.status)}</span></td><td><div class="row-actions"><button class="btn btn-quiet" type="button" data-detail="${supplier.id}">Details</button><button class="btn btn-quiet" type="button" data-edit="${supplier.id}">Edit</button><button class="btn btn-quiet" type="button" data-toggle="${supplier.id}">${supplier.status === 'active' ? 'Deactivate' : 'Activate'}</button><button class="btn btn-quiet" type="button" data-delete="${supplier.id}">Delete</button></div></td></tr>`;
    }).join('') : '<tr><td colspan="7"><div class="empty"><h3>No suppliers found</h3><p>Add a supplier to start tracking supply coverage.</p></div></td></tr>';

    const allSuppliers = store.getSuppliers();
    $('#stats').innerHTML = `<div class="stat-card"><span class="label">Total suppliers</span><strong>${allSuppliers.length}</strong></div><div class="stat-card"><span class="label">Active suppliers</span><strong>${allSuppliers.filter((supplier) => supplier.status === 'active').length}</strong></div><div class="stat-card"><span class="label">Products supplied</span><strong>${products.filter((product) => product.supplier).length}</strong></div><div class="stat-card"><span class="label">Coverage</span><strong>${allSuppliers.filter((supplier) => products.some((product) => product.supplier === supplier.id)).length}/${allSuppliers.length}</strong></div>`;
  }

  function openSupplierForm(supplier = null, trigger = null) {
    lastTrigger = trigger;
    $('#modalRoot').innerHTML = `<div class="modal-backdrop" id="supplierBackdrop"><form class="modal" id="supplierForm" role="dialog" aria-modal="true" aria-labelledby="supplierModalTitle"><div class="modal-header"><h2 id="supplierModalTitle">${supplier ? 'Edit supplier' : 'Add supplier'}</h2><button class="close touch-target" type="button" data-close aria-label="Close dialog">X</button></div><div class="modal-body"><div class="form-grid"><div class="field full"><label for="supplierName">Supplier name</label><input id="supplierName" required value="${escapeHtml(supplier?.name)}"><span class="error" id="nameError"></span></div><div class="field"><label for="supplierContact">Contact person</label><input id="supplierContact" value="${escapeHtml(supplier?.contactPerson)}"></div><div class="field"><label for="supplierPhone">Phone</label><input id="supplierPhone" placeholder="+20 100 000 0000" value="${escapeHtml(supplier?.phone)}"><span class="error" id="phoneError"></span></div><div class="field"><label for="supplierEmail">Email</label><input id="supplierEmail" type="email" value="${escapeHtml(supplier?.email)}"><span class="error" id="emailError"></span></div><div class="field"><label for="supplierAddress">Address</label><input id="supplierAddress" value="${escapeHtml(supplier?.address)}"></div></div></div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close>Cancel</button><button class="btn btn-primary" type="submit">Save supplier</button></div></form></div>`;
    $('#supplierName').focus();
    $('#supplierBackdrop').addEventListener('click', (event) => { if (event.target.id === 'supplierBackdrop' || event.target.matches('[data-close]')) closeModal(); });
    $('#supplierForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const data = { name: $('#supplierName').value.trim(), contactPerson: $('#supplierContact').value.trim(), phone: $('#supplierPhone').value.trim(), email: $('#supplierEmail').value.trim(), address: $('#supplierAddress').value.trim() };
      if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) { showToast('Enter a valid email address.', 'error'); return; }
      if (data.phone && !/^[+\d][\d\s()-]{6,}$/.test(data.phone)) { showToast('Enter a valid phone number.', 'error'); return; }
      const result = supplier ? store.updateSupplier(supplier.id, data) : store.addSupplier(data);
      if (!result.ok) { showToast(result.error, 'error'); return; }
      closeModal(); render(); showToast(supplier ? 'Supplier updated' : 'Supplier added');
    });
  }

  function showDetails(supplier, trigger) {
    lastTrigger = trigger;
    const products = store.getProducts().filter((product) => product.supplier === supplier.id);
    $('#modalRoot').innerHTML = `<div class="modal-backdrop" id="detailsBackdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="detailsTitle"><div class="modal-header"><h2 id="detailsTitle">${escapeHtml(supplier.name)}</h2><button class="close touch-target" type="button" data-close aria-label="Close dialog">X</button></div><div class="modal-body"><div class="detail-block"><h3>Contact</h3><p>${escapeHtml(supplier.contactPerson || 'No contact person')}</p><p>${escapeHtml(supplier.phone || 'No phone')} - ${escapeHtml(supplier.email || 'No email')}</p><p>${escapeHtml(supplier.address || 'No address')}</p></div><div class="detail-block"><h3>Products supplied (${products.length})</h3>${products.length ? products.map((product) => `<p><strong>${escapeHtml(product.name)}</strong><span class="subtle"> - ${product.stock} in stock</span></p>`).join('') : '<p>No products linked yet.</p>'}</div></div><div class="modal-footer"><a class="btn btn-primary" href="inventory.html?supplier=${encodeURIComponent(supplier.id)}">Receive delivery</a><button class="btn btn-secondary" type="button" data-close>Close</button></div></div></div>`;
    $('#detailsBackdrop').addEventListener('click', (event) => { if (event.target.id === 'detailsBackdrop' || event.target.matches('[data-close]')) closeModal(); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const user = window.VoltixUI.renderShell('suppliers'); $('#userName').textContent = user.name; $('#userRole').textContent = user.role; $('#avatar').textContent = user.name.split(' ').map((part) => part[0]).slice(0, 2).join('');
    if (!window.VoltixUI.can('supplier:read', user)) { $('.vi-content').innerHTML = '<div class="permission-state"><h1>Suppliers</h1><p>You have view-only access to Products and Inventory. Supplier management is not available for your role.</p><a class="btn btn-primary" href="dashboard.html">Go to Dashboard</a></div>'; return; }
    if (!store.can('supplier:write')) $('#addBtn').disabled = true;
    render();
    $('#search').addEventListener('input', render); $('#status').addEventListener('change', render); $('#addBtn').addEventListener('click', (event) => { if (store.can('supplier:write')) openSupplierForm(null, event.currentTarget); }); $('#menuBtn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
    document.addEventListener('click', (event) => { const detail = event.target.closest('[data-detail]'); const edit = event.target.closest('[data-edit]'); const toggle = event.target.closest('[data-toggle]'); const remove = event.target.closest('[data-delete]'); if (detail) showDetails(store.getSuppliers().find((supplier) => supplier.id === detail.dataset.detail), detail); if (edit && store.can('supplier:write')) openSupplierForm(store.getSuppliers().find((supplier) => supplier.id === edit.dataset.edit), edit); if (toggle && store.can('supplier:write')) { const supplier = store.getSuppliers().find((item) => item.id === toggle.dataset.toggle); store.updateSupplier(supplier.id, { status: supplier.status === 'active' ? 'inactive' : 'active' }); render(); showToast(`Supplier ${supplier.status === 'active' ? 'deactivated' : 'activated'}`); } if (remove && store.can('supplier:write')) { const result = store.deleteSupplier(remove.dataset.delete); if (!result.ok) showToast(result.error, 'error'); else { render(); showToast('Supplier deleted'); } } });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && $('#modalRoot').firstElementChild) closeModal(); });
    window.addEventListener('voltix:data-changed', render);
  });
}());


