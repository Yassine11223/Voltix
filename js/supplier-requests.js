(function () {
  'use strict';

  const store = window.VoltixSupplierRequests;
  const inventory = window.VoltixInventory;
  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const dateTime = (value) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown date';
  };
  const badge = (status) => `<span class="badge ${status === 'Approved' ? 'badge-success' : status === 'Rejected' ? 'badge-danger' : 'badge-warning'}">${escapeHtml(status)}</span>`;
  let modal;

  function toast(message, type = 'success') {
    const element = document.createElement('div');
    element.className = `toast ${type}`;
    element.textContent = message;
    $('#toasts').append(element);
    window.setTimeout(() => element.remove(), 5000);
  }

  function closeDialog() {
    const previous = modal.previousFocus;
    modal.close();
    // Saving refreshes the rows, so their original action buttons may be detached.
    if (!previous?.isConnected) $('#supplier-requests-tab').focus();
  }

  function render() {
    if (!inventory.can('supplier:read')) return;
    const result = store.list();
    $('#request-load-error').hidden = result.ok;
    $('#request-load-error').textContent = result.ok ? '' : result.error;
    $('#pending-request-count').textContent = result.ok ? result.data.filter((request) => request.status === 'Pending').length : '?';
    if (!result.ok) { $('#request-rows').replaceChildren(); $('#request-results').textContent = ''; return; }
    const query = $('#request-search').value.trim().toLowerCase();
    const requests = result.data.filter((request) =>
      [request.id, request.companyName, request.contactPerson, request.email, request.productName, request.category].join(' ').toLowerCase().includes(query) &&
      (!$('#request-status').value || request.status === $('#request-status').value) &&
      (!$('#request-type-filter').value || request.type === $('#request-type-filter').value)
    );
    $('#request-results').textContent = `${requests.length} of ${result.data.length} requests`;
    $('#request-rows').innerHTML = requests.length ? requests.map((request) => `<tr>
      <td><div class="product-name">${escapeHtml(request.companyName)}</div><div class="subtle">${escapeHtml(request.email)}</div></td>
      <td>${escapeHtml(store.TYPES[request.type] || request.type)}</td><td>${escapeHtml(request.productName || '—')}</td>
      <td>${escapeHtml(dateTime(request.submittedAt))}</td><td>${badge(request.status)}</td>
      <td><div class="row-actions"><button class="btn btn-quiet" type="button" data-request-view="${escapeHtml(request.id)}">View Details</button>${request.status === 'Pending' ? `<button class="btn btn-quiet" type="button" data-request-approve="${escapeHtml(request.id)}">Approve</button><button class="btn btn-quiet" type="button" data-request-reject="${escapeHtml(request.id)}">Reject</button>` : ''}</div></td>
    </tr>`).join('') : '<tr><td colspan="6"><div class="empty"><h3>No requests found</h3><p>Public form submissions will appear here. Try adjusting your search or filters.</p></div></td></tr>';
  }

  function openDialog(content, trigger) {
    modal.open(content, trigger);
    $('#request-modal-root').querySelector('.modal-backdrop').addEventListener('click', (event) => {
      if (event.target.classList.contains('modal-backdrop') || event.target.closest('[data-request-close]')) closeDialog();
    });
  }

  function details(request, trigger) {
    const field = (label, value) => `<div><dt>${label}</dt><dd>${escapeHtml(value || '—')}</dd></div>`;
    const linkedSupplier = inventory.getSuppliers().find((supplier) => supplier.id === request.supplierId);
    openDialog(`<div class="modal-backdrop"><div class="modal wide" role="dialog" aria-modal="true" aria-labelledby="request-details-title">
      <div class="modal-header"><h2 id="request-details-title">Request Details</h2><button class="close touch-target" type="button" data-request-close aria-label="Close dialog">X</button></div>
      <div class="modal-body"><p>${badge(request.status)}</p><dl class="supplier-request-details">
        ${field('Reference', request.id)}${field('Request type', store.TYPES[request.type])}${field('Submitted', dateTime(request.submittedAt))}
        ${field('Company', request.companyName)}${field('Contact person', request.contactPerson)}${field('Email', request.email)}${field('Phone', request.phone)}${field('Address', request.address)}
        ${request.type === 'products' ? `${field('Product', request.productName)}${field('Category', request.category)}${field('Quantity', request.quantity)}${field('Unit price (EGP)', Number(request.unitPrice).toLocaleString('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}${field('Expected delivery date', request.expectedDeliveryDate)}` : ''}
        ${field('Additional notes', request.notes)}
        ${request.supplierId ? field('Linked supplier', linkedSupplier ? `${linkedSupplier.name} (${linkedSupplier.id})${linkedSupplier.status === 'inactive' ? ' — inactive' : ''}` : `${request.supplierId} (record no longer exists)`) : ''}
        ${request.reviewedAt ? `${field('Reviewed', dateTime(request.reviewedAt))}${field('Reviewed by', request.reviewedBy)}` : ''}
      </dl><p class="supplier-notice">Approval does not confirm delivery or add stock. Confirm an actual stock receipt through Inventory.</p></div>
      <div class="modal-footer">${request.status === 'Pending' ? `<button class="btn btn-danger" type="button" data-request-reject="${escapeHtml(request.id)}">Reject</button><button class="btn btn-primary" type="button" data-request-approve="${escapeHtml(request.id)}">Approve</button>` : ''}<button class="btn btn-secondary" type="button" data-request-close>Close</button></div>
    </div></div>`, trigger);
  }

  function reviewDialog(request, status, trigger) {
    // Preserve the original row trigger when replacing the details dialog.
    const returnFocus = $('#request-modal-root').contains(trigger) ? modal.previousFocus : trigger;
    const approving = status === 'Approved';
    const matches = approving ? store.matchingSuppliers(request) : [];
    const suppliers = approving ? inventory.getSuppliers() : [];
    const selection = approving ? `<div class="field"><label for="request-supplier-link">Supplier record</label><select id="request-supplier-link" ${matches.length > 1 ? 'required' : ''}>
      ${matches.length ? (matches.length > 1 ? '<option value="">Select a matching supplier</option>' : '') : '<option value="">Create supplier from submitted details</option>'}
      ${suppliers.map((supplier) => `<option value="${escapeHtml(supplier.id)}" ${matches.length === 1 && matches[0].id === supplier.id ? 'selected' : ''}>Link: ${escapeHtml(supplier.name)} (${escapeHtml(supplier.id)})${supplier.status === 'inactive' ? ' — inactive' : ''}</option>`).join('')}
      </select><p class="hint">${matches.length ? 'An existing company name, email or phone matches. Link an existing record to avoid duplicates. Existing details and active status are preserved.' : 'Create a supplier, or choose an existing record to link without changing its details.'}</p></div>` : '';
    openDialog(`<div class="modal-backdrop"><form id="request-review-form" class="modal" role="dialog" aria-modal="true" aria-labelledby="request-review-title">
      <div class="modal-header"><h2 id="request-review-title">${status === 'Approved' ? 'Approve' : 'Reject'} Request</h2><button class="close touch-target" type="button" data-request-close aria-label="Close dialog">X</button></div>
      <div class="modal-body"><p><strong>${escapeHtml(request.companyName)}</strong> — ${escapeHtml(store.TYPES[request.type])}</p>${selection}
        <p>${status === 'Rejected' ? 'This request will be marked Rejected. No supplier or inventory records will change.' : 'This request will be marked Approved and connected to the supplier record. A new supplier is created only when no existing supplier matches.'}</p>
        <p class="supplier-notice">Stock increases only when an authorized user confirms receipt in Inventory.</p><p id="request-review-error" class="supplier-feedback" data-state="error" role="alert" hidden></p></div>
      <div class="modal-footer"><button class="btn btn-secondary" type="button" data-request-close>Cancel</button><button class="btn ${status === 'Approved' ? 'btn-primary' : 'btn-danger'}" type="submit">${status === 'Approved' ? 'Approve Request' : 'Reject Request'}</button></div>
    </form></div>`, returnFocus);
    $('#request-review-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const result = store.review(request.id, status, $('#request-supplier-link')?.value || '');
      if (!result.ok) { $('#request-review-error').textContent = result.error; $('#request-review-error').hidden = false; render(); return; }
      closeDialog();
      render();
      toast(approving ? `Request approved. Supplier ${result.createdSupplier ? 'created' : 'linked'}; stock unchanged.` : `Request ${status.toLowerCase()}; stock unchanged.`);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.VoltixApp || !inventory.can('supplier:read')) return;
    modal = new window.VoltixUI.ModalController($('#request-modal-root'));
    const tabs = [$('#suppliers-tab'), $('#supplier-requests-tab')];
    function selectTab(selected) {
      tabs.forEach((tab) => {
        const active = tab === selected;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
      });
      $('#addBtn').hidden = selected !== tabs[0];
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectTab(tab));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = tabs[event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + 1) % tabs.length];
        selectTab(next); next.focus();
      });
    });
    $('#request-search').addEventListener('input', render);
    $('#request-status').addEventListener('change', render);
    $('#request-type-filter').addEventListener('change', render);
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-request-view], [data-request-approve], [data-request-reject]');
      if (!button || !inventory.can('supplier:write')) return;
      const id = button.dataset.requestView || button.dataset.requestApprove || button.dataset.requestReject;
      const result = store.list();
      const request = result.ok && result.data.find((item) => item.id === id);
      if (!request) { toast(result.ok ? 'Request not found.' : result.error, 'error'); return; }
      if (button.hasAttribute('data-request-view')) details(request, button);
      else reviewDialog(request, button.hasAttribute('data-request-approve') ? 'Approved' : 'Rejected', button);
    });
    window.addEventListener('voltix:data-changed', render);
    render();
  });
}());
