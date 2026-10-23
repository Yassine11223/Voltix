(function (window) {
  'use strict';
  const store = window.VoltixPOSStore;
  const { RETURN_WINDOW_DAYS, STAFF_CAN_PROCESS_RETURNS } = store.constants;
  const REASONS = Object.freeze(['Defective', 'Wrong item', 'Customer changed mind', 'Damaged in store', 'Other']);
  const DEFAULT_REASON = 'Customer changed mind';
  const DAY_MS = 86400000;
  const MAX_QUANTITY = 1e6;
  const saleId = (value) => /^S-\d{6}$/i.test(String(value ?? '').trim()) ? String(value).trim().toUpperCase() : null;
  const defaultRestock = (reason) => !['Defective', 'Damaged in store'].includes(reason);
  const newChoice = () => ({ quantity: '0', reason: DEFAULT_REASON, restock: defaultRestock(DEFAULT_REASON), restockEdited: false });
  /** Reject non-integers; clamp digit-only huge values to the live returnable amount. */
  function parseQuantity(value, maximum) {
    if (!/^\d+$/.test(String(value))) return null;
    return Math.min(Number(value), Math.max(0, maximum), MAX_QUANTITY);
  }
  window.VoltixReturnsLogic = Object.freeze({ saleId, parseQuantity, defaultRestock });
  const $ = (id) => document.getElementById(id);
  if (!$('returns-flow')) return;
  const user = store.getSession();
  if (!user) { window.location.replace('../index.html'); return; }
  const esc = store.escapeHtml;
  const money = (value) => esc(store.formatMoney(value));
  const permitted = user.role === 'admin' || STAFF_CAN_PROCESS_RETURNS;
  const confirmDialog = $('returns-confirm');
  const receiptDialog = $('returns-receipt');
  let step = 1;
  let selected = null;
  let revision = '';
  let choices = new Map();
  let submitting = false;
  let completed = false;
  let receiptId = null;
  let summaryValid = true;
  const allowedSales = () => store.visibleSales(store.getSales(), user);
  const allowedReturns = () => store.getReturns().filter((record) => user.role === 'admin' || record.processedById === user.id);
  const hasLines = (sale) => sale && Array.isArray(sale.items) && sale.items.length > 0 && sale.items.every((line) => line && typeof line === 'object');
  const expired = () => selected && Date.now() - Date.parse(selected.date) > RETURN_WINDOW_DAYS * DAY_MS;
  const fullyReturned = () => selected && (selected.status === 'fully_returned' || selected.items.every((line) => line.returnedQty >= line.quantity));
  const available = (line) => Number.isSafeInteger(line.quantity) && Number.isSafeInteger(line.returnedQty) && line.returnedQty >= 0 ? Math.max(0, line.quantity - line.returnedQty) : 0;
  const eligible = () => permitted && selected && !completed && !fullyReturned() && Number.isFinite(Date.parse(selected.date)) &&
    Date.parse(selected.date) <= Date.now() && (!expired() || (user.role === 'admin' && $('returns-override').checked));
  const requestedItems = () => Array.from(choices, ([productId, value]) => ({ productId, quantity: parseQuantity(value.quantity, MAX_QUANTITY), reason: value.reason, restock: value.restock })).filter((item) => item.quantity > 0);

  function toast(message) {
    const element = document.createElement('div');
    element.className = 'pos-toast'; element.textContent = message;
    $('returns-toasts').replaceChildren(element);
    window.setTimeout(() => element.remove(), 6000);
  }
  function validItems() {
    return selected && selected.items.every((line) => {
      const value = choices.get(line.productId);
      const quantity = value && parseQuantity(value.quantity, MAX_QUANTITY);
      return quantity !== null && quantity <= available(line) && REASONS.includes(value?.reason);
    }) && requestedItems().length > 0;
  }
  function updateButtons() {
    $('returns-next').disabled = !eligible() || (step === 2 && !validItems());
    $('returns-review').disabled = !eligible() || !validItems() || submitting || !summaryValid;
    $('returns-submit').disabled = submitting || !eligible() || !validItems();
  }
  function showStep(next, focus = true) {
    step = next;
    [1, 2, 3].forEach((number) => {
      $('returns-step-' + number).hidden = step !== number;
      if (step === number) $('returns-progress-' + number).setAttribute('aria-current', 'step');
      else $('returns-progress-' + number).removeAttribute('aria-current');
    });
    $('returns-back').hidden = step === 1;
    $('returns-next').hidden = step === 3 || completed;
    $('returns-review').hidden = step !== 3 || completed;
    if (step === 3) renderSummary();
    updateButtons();
    if (focus) $('returns-title-' + step).focus();
  }
  function renderSelected() {
    $('returns-selected').hidden = !selected;
    if (!selected) return;
    const full = fullyReturned();
    $('returns-sale-info').innerHTML = `<div class="returns-sale-meta"><strong>${esc(selected.id)}</strong><span>${esc(store.formatDate(selected.date))}</span><span>${esc(selected.cashierName)}</span><strong>${money(selected.total)}</strong><span class="pos-badge${full ? ' pos-badge-out' : selected.status === 'partially_returned' ? ' pos-badge-low' : ''}">${full ? 'Fully returned' : selected.status === 'partially_returned' ? 'Partially returned' : 'Completed'}</span></div>`;
    $('returns-sale-warning').textContent = full ? 'This sale has already been fully returned. No items remain to return.' : expired() ? `The ${RETURN_WINDOW_DAYS}-day return window has expired.${user.role === 'admin' ? ' An administrator may override it for this return.' : ''}` : '';
    $('returns-full-link').hidden = !full;
    $('returns-override-label').hidden = user.role !== 'admin' || !expired() || full;
  }
  function renderRecent() {
    const sales = allowedSales().sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 10);
    const fragment = document.createDocumentFragment();
    sales.forEach((sale) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'pos-button returns-pick'; button.dataset.sale = sale.id;
      button.innerHTML = `<strong>${esc(sale.id)} \u00b7 ${money(sale.total)}</strong><small>${esc(store.formatDate(sale.date))} \u00b7 ${esc(sale.cashierName)}</small><small>${esc(String(sale.status || '').replaceAll('_', ' '))}</small>`;
      fragment.append(button);
    });
    $('returns-recent').replaceChildren(fragment);
    $('returns-recent-empty').hidden = sales.length > 0;
  }
  /** Render snapshot names; only current active products are eligible for restock. */
  function renderItems() {
    if (!selected) return;
    const products = store.getProducts();
    const fragment = document.createDocumentFragment();
    selected.items.forEach((line, index) => {
      const value = choices.get(line.productId);
      const active = products.some((product) => product.id === line.productId);
      if (!active) value.restock = false;
      const remaining = available(line);
      const row = document.createElement('tr'); row.dataset.index = index;
      row.innerHTML = `<th scope="row" data-label="Item"><div class="returns-item-name">${esc(line.name)}<small class="returns-muted"> ${esc(line.sku)}</small>${!active ? '<small class="returns-item-warning">Deleted or archived product. Restock skipped.</small>' : ''}</div></th>
        <td data-label="Sold">${esc(line.quantity)}</td><td data-label="Returned">${esc(line.returnedQty)}</td><td data-label="Returnable">${remaining}</td>
        <td data-label="Quantity"><label class="sr-only" for="returns-qty-${index}">Quantity to return: ${esc(line.name)}</label><input id="returns-qty-${index}" class="pos-input returns-quantity" type="text" inputmode="numeric" pattern="[0-9]+" data-field="quantity" value="${esc(value.quantity)}" aria-describedby="returns-items-error" ${!remaining ? 'disabled' : ''}></td>
        <td data-label="Reason"><label class="sr-only" for="returns-reason-${index}">Reason: ${esc(line.name)}</label><select id="returns-reason-${index}" class="pos-input returns-reason" data-field="reason" ${!remaining ? 'disabled' : ''}>${REASONS.map((reason) => `<option${reason === value.reason ? ' selected' : ''}>${esc(reason)}</option>`).join('')}</select></td>
        <td data-label="Stock"><label class="pos-check" for="returns-restock-${index}"><input id="returns-restock-${index}" type="checkbox" data-field="restock" ${value.restock ? 'checked' : ''} ${!active || !remaining ? 'disabled' : ''}>Return to stock<span class="sr-only">: ${esc(line.name)}</span></label></td>`;
      fragment.append(row);
    });
    $('returns-items').replaceChildren(fragment);
    $('returns-items-error').textContent = '';
  }
  function loadSale(value) {
    const id = saleId(value);
    const sale = id && allowedSales().find((record) => record.id === id && hasLines(record));
    $('returns-search').setAttribute('aria-invalid', String(!sale));
    $('returns-search-error').textContent = !id ? 'Enter a valid sale ID, such as S-000001.' : !sale ? 'Sale not found.' : '';
    if (!sale) { selected = null; choices.clear(); renderSelected(); updateButtons(); return; }
    if (selected?.id !== id || completed) {
      choices = new Map(sale.items.map((line) => [line.productId, newChoice()]));
      $('returns-override').checked = false;
      $('returns-method').value = sale.payment?.method === 'card' ? 'card' : 'cash';
      $('returns-note').value = '';
    }
    completed = false; selected = sale;
    revision = store.returnRevision(sale, store.getProducts(), store.getReturns());
    $('returns-search').value = id;
    $('returns-flow-error').textContent = '';
    renderSelected(); renderItems(); updateButtons();
  }
  function renderSummary() {
    try {
      const items = requestedItems();
      const refund = store.calcReturnRefund(selected, items, store.getReturns());
      summaryValid = true;
      $('returns-summary').innerHTML = `<ul class="returns-summary">${items.map((item, index) => `<li><div><strong>${esc(selected.items.find((line) => line.productId === item.productId).name)}</strong><small>${item.quantity} \u00d7 ${money(selected.items.find((line) => line.productId === item.productId).unitPrice)} \u00b7 ${esc(item.reason)} \u00b7 ${item.restock ? 'Return to stock' : 'No restock'}</small></div><strong>${money(refund.amounts[index])}</strong></li>`).join('')}</ul><div class="returns-total"><span>Total refund</span><span>${money(refund.totalRefund)}</span></div>`;
      return refund;
    } catch (error) {
      summaryValid = false;
      $('returns-summary').replaceChildren(); $('returns-flow-error').textContent = error.message;
      $('returns-review').disabled = true;
      return null;
    }
  }
  /** Reload live data and require another review whenever a snapshot changed. */
  function revalidate() {
    if (!selected || completed) return false;
    const live = allowedSales().find((sale) => sale.id === selected.id && hasLines(sale));
    if (!live) {
      selected = null; choices.clear();
      $('returns-search-error').textContent = 'Sale not found.';
      if (confirmDialog.open) confirmDialog.close();
      renderSelected(); showStep(1); return false;
    }
    const next = store.returnRevision(live, store.getProducts(), store.getReturns());
    if (next === revision) { renderSelected(); updateButtons(); return Boolean(eligible()); }
    selected = live; revision = next;
    const previous = choices;
    choices = new Map(live.items.map((line) => {
      const value = previous.get(line.productId) || newChoice();
      return [line.productId, { ...value, quantity: String(Math.min(parseQuantity(value.quantity, MAX_QUANTITY) || 0, available(line))) }];
    }));
    if (confirmDialog.open) confirmDialog.close();
    renderSelected(); renderItems(); showStep(fullyReturned() ? 1 : 2);
    $('returns-flow-error').textContent = 'Sale or products changed. Remaining quantities were reloaded. Review your selection and confirm again.';
    return false;
  }
  function renderHistory() {
    const records = allowedReturns().sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    const fragment = document.createDocumentFragment();
    records.forEach((record) => {
      const row = document.createElement('tr');
      const items = Array.isArray(record.items) ? record.items : [];
      row.innerHTML = `<th scope="row" data-label="Return ID">${esc(record.id)}</th><td data-label="Date">${esc(store.formatDate(record.date))}</td><td data-label="Original sale">${esc(record.saleId)}</td><td data-label="Items">${esc(items.reduce((sum, item) => sum + (Number.isSafeInteger(item?.quantity) ? item.quantity : 0), 0))}</td><td data-label="Refund"><strong>${money(record.totalRefund)}</strong></td><td data-label="Processed by">${esc(record.processedByName)}</td><td data-label="Receipt"><button class="pos-button" type="button" data-return="${esc(record.id)}" aria-label="View receipt ${esc(record.id)}">View receipt</button></td>`;
      fragment.append(row);
    });
    const focused = document.activeElement?.dataset?.return;
    $('returns-history-rows').replaceChildren(fragment);
    if (focused) Array.from($('returns-history-rows').querySelectorAll('button')).find((button) => button.dataset.return === focused)?.focus();
    $('returns-history-empty').hidden = records.length > 0;
    $('returns-history-region').hidden = !records.length;
    $('returns-history-count').textContent = records.length + ' return' + (records.length === 1 ? '' : 's');
  }
  function openReceipt(id) {
    const record = allowedReturns().find((item) => item.id === id);
    if (!record) { toast('Return receipt is no longer available.'); return; }
    receiptId = id;
    // Stored refund lines contain the original sale names and prices, even after deletion.
    const snapshot = { ...record, items: Array.isArray(record.items) ? record.items.filter((item) => item && typeof item === 'object') : [] };
    $('returns-receipt-content').innerHTML = window.VoltixReceipt.renderReceipt(snapshot, 'refund');
    receiptDialog.showModal(); $('returns-receipt-close').focus();
  }
  function reset() {
    selected = null; choices.clear(); revision = ''; completed = false;
    $('returns-search-form').reset(); $('returns-note').value = ''; $('returns-override').checked = false;
    ['returns-search-error', 'returns-flow-error'].forEach((id) => { $(id).textContent = ''; });
    $('returns-search').removeAttribute('aria-invalid');
    renderSelected(); showStep(1, false); $('returns-search').focus();
  }
  /** Final checks run before entering the store's independently validated transaction. */
  function submit() {
    if (submitting || completed || !confirmDialog.open) return;
    if (!revalidate() || !validItems()) return;
    submitting = true; updateButtons(); $('returns-submit').textContent = 'Processing...';
    const payload = { saleId: selected.id, items: requestedItems(), refundMethod: $('returns-method').value,
      note: $('returns-note').value, overrideReturnWindow: user.role === 'admin' && $('returns-override').checked, expectedRevision: revision };
    try {
      const result = store.processReturn(payload);
      if (!result.ok) {
        confirmDialog.close();
        revalidate();
        $('returns-flow-error').textContent = result.error;
        return;
      }
      completed = true; confirmDialog.close();
      selected = allowedSales().find((sale) => sale.id === payload.saleId) || selected;
      renderSelected(); renderHistory(); renderRecent();
      toast('Return ' + result.data.id + ' processed. ' + (result.warnings || []).join(' '));
      openReceipt(result.data.id);
    } catch (error) {
      if (confirmDialog.open) confirmDialog.close();
      $('returns-flow-error').textContent = error.message || 'The return could not be processed.';
    } finally {
      submitting = false; $('returns-submit').textContent = 'Issue refund'; updateButtons();
      if (completed) showStep(1, false);
    }
  }
  // Native modal isolation plus explicit wrapping and focus restoration.
  [confirmDialog, receiptDialog].forEach((dialog) => {
    let previousFocus;
    dialog.addEventListener('beforetoggle', (event) => { if (event.newState === 'open') previousFocus = document.activeElement; });
    dialog.addEventListener('close', () => {
      if (dialog === confirmDialog && receiptDialog.open) return;
      if (previousFocus?.isConnected && !previousFocus.disabled && previousFocus.getClientRects().length) previousFocus.focus();
      else $('returns-search').focus();
    });
    dialog.addEventListener('cancel', (event) => { if (submitting) event.preventDefault(); });
    dialog.addEventListener('click', (event) => { if (event.target === dialog && !submitting) dialog.close(); });
    dialog.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const targets = Array.from(dialog.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')).filter((element) => element.getClientRects().length);
      const first = targets[0]; const last = targets[targets.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  });
  $('returns-search-form').addEventListener('submit', (event) => { event.preventDefault(); loadSale($('returns-search').value); });
  $('returns-search').addEventListener('input', () => {
    if (selected && saleId($('returns-search').value) !== selected.id) { selected = null; choices.clear(); renderSelected(); }
    $('returns-search-error').textContent = ''; $('returns-search').removeAttribute('aria-invalid'); updateButtons();
  });
  $('returns-recent').addEventListener('click', (event) => { const button = event.target.closest('[data-sale]'); if (button) loadSale(button.dataset.sale); });
  function updateItem(event) {
    const input = event.target; const row = input.closest('[data-index]');
    if (!row || !selected) return;
    const line = selected.items[Number(row.dataset.index)]; const value = choices.get(line.productId);
    if (event.type === 'input' && input.dataset.field === 'quantity') {
      const parsed = parseQuantity(input.value, available(line));
      if (parsed !== null) input.value = String(parsed);
      value.quantity = input.value;
      input.setAttribute('aria-invalid', String(parsed === null));
    } else if (event.type === 'change' && input.dataset.field === 'reason') {
      value.reason = input.value;
      if (!value.restockEdited) value.restock = store.getProducts().some((product) => product.id === line.productId) && defaultRestock(value.reason);
      row.querySelector('[data-field="restock"]').checked = value.restock;
    } else if (event.type === 'change' && input.dataset.field === 'restock') {
      value.restock = input.checked;
      value.restockEdited = true;
    } else return;
    $('returns-items-error').textContent = validItems() ? '' : 'Choose at least one item. Quantities must be whole numbers from 0 to the returnable amount.';
    updateButtons();
  }
  $('returns-items').addEventListener('input', updateItem);
  $('returns-items').addEventListener('change', updateItem);
  $('returns-override').addEventListener('change', updateButtons);
  $('returns-back').addEventListener('click', () => showStep(Math.max(1, step - 1)));
  $('returns-next').addEventListener('click', () => { if (revalidate() && (step === 1 || validItems())) showStep(Math.min(3, step + 1)); });
  $('returns-review').addEventListener('click', () => {
    if (!revalidate() || !validItems()) return;
    const refund = renderSummary(); if (!refund) return;
    $('returns-confirm-text').textContent = `Refund ${store.formatMoney(refund.totalRefund)} by ${$('returns-method').value === 'card' ? 'Card' : 'Cash'} for ${selected.id}?`;
    confirmDialog.showModal(); $('returns-cancel').focus();
  });
  $('returns-cancel').addEventListener('click', () => { if (!submitting) confirmDialog.close(); });
  $('returns-submit').addEventListener('click', submit);
  $('returns-history-rows').addEventListener('click', (event) => { const button = event.target.closest('[data-return]'); if (button) openReceipt(button.dataset.return); });
  $('returns-receipt-close').addEventListener('click', () => receiptDialog.close());
  $('returns-print').addEventListener('click', () => { if (receiptDialog.open) window.print(); });
  $('returns-new').addEventListener('click', () => { receiptDialog.close(); reset(); });
  function refresh() {
    if (submitting) return;
    renderRecent(); renderHistory(); revalidate();
    if (receiptDialog.open && !allowedReturns().some((record) => record.id === receiptId)) receiptDialog.close();
  }
  ['storage', 'voltix:data-changed', 'voltix:return-completed', 'focus'].forEach((event) => window.addEventListener(event, refresh));
  window.setInterval(refresh, 60000);
  $('returns-staff-note').hidden = user.role !== 'staff';
  $('returns-permission').hidden = permitted; $('returns-flow').hidden = !permitted;
  renderRecent(); renderHistory(); showStep(1, false);
  const deepLink = new URLSearchParams(window.location.search);
  if (deepLink.has('sale') && permitted) loadSale(deepLink.get('sale'));
})(window);
