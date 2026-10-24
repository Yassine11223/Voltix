(function (window) {
  'use strict';
  const store = window.VoltixPOSStore;
  const { SALES_PAGE_SIZE, STAFF_CAN_PROCESS_RETURNS } = store.constants;
  const STATUS = Object.freeze({ completed: 'Completed', partially_returned: 'Partially returned', fully_returned: 'Fully returned' });
  const amount = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1e12 ? value : 0;
  const linesOf = (sale) => Array.isArray(sale.items) ? sale.items.filter((line) => line && typeof line === 'object') : [];
  const lineName = (line) => line.name || line.productName || store.getProductById(line.productId || line.id)?.name || `Deleted product (${line.productId || line.id || 'unknown'})`;
  const lineSku = (line) => line.sku || store.getProductById(line.productId || line.id)?.sku || '';
  const itemCount = (sale) => linesOf(sale).reduce((sum, line) => sum + (Number.isSafeInteger(line.quantity) && line.quantity > 0 && line.quantity <= 1e6 ? line.quantity : 0), 0);

  const visibleSales = store.visibleSales;

  // Use local calendar days, with an exclusive next-day boundary (including DST).
  function dateBoundary(value, nextDay = false) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return NaN;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return NaN;
    if (nextDay) date.setDate(date.getDate() + 1);
    return date.getTime();
  }
  const localDate = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  function datePreset(preset, now = Date.now()) {
    if (preset === 'all') return { from: '', to: '' };
    const end = new Date(now);
    const start = new Date(now);
    if (preset === 'week') start.setDate(start.getDate() - 6);
    if (preset === 'month') start.setDate(1);
    return { from: localDate(start), to: localDate(end) };
  }

  /** Pure intersection of text, inclusive calendar dates, payment and status. */
  function filterSales(sales, filters = {}) {
    const query = String(filters.query || '').trim().toLowerCase();
    const from = filters.from ? dateBoundary(filters.from) : -Infinity;
    const to = filters.to ? dateBoundary(filters.to, true) : Infinity;
    if (Number.isNaN(from) || Number.isNaN(to) || from >= to) return [];
    return sales.filter((sale) => {
      const date = Date.parse(sale.date);
      return (!query || [sale.id, sale.cashierName, sale.customerName].some((value) => String(value ?? '').toLowerCase().includes(query))) &&
        ((!filters.from && !filters.to) || (Number.isFinite(date) && date >= from && date < to)) &&
        (!filters.payment || sale.payment?.method === filters.payment) && (!filters.status || sale.status === filters.status);
    });
  }
  /** Statistics use only the sales already allowed by visibility and filters. */
  function calcStats(sales, returns = []) {
    const saleIds = new Set(sales.map((sale) => sale.id));
    const grossSales = store.round2(sales.reduce((sum, sale) => sum + amount(sale.total), 0));
    const refunds = store.round2(returns.reduce((sum, record) => sum + (saleIds.has(record.saleId) ? amount(record.totalRefund) : 0), 0));
    const netRevenue = store.round2(grossSales - refunds);
    return { count: sales.length, grossSales, refunds, netRevenue, average: sales.length ? store.round2(grossSales / sales.length) : 0,
      items: sales.reduce((sum, sale) => sum + itemCount(sale), 0) };
  }
  function sortSales(sales, field = 'date', direction = 'desc') {
    const sign = direction === 'asc' ? 1 : -1;
    const value = field === 'total' ? (sale) => amount(sale.total) : (sale) => Date.parse(sale.date) || 0;
    return [...sales].sort((a, b) => sign * (value(a) - value(b)) || String(b.id ?? '').localeCompare(String(a.id ?? '')));
  }
  function paginate(sales, requested = 1) {
    const pages = Math.max(1, Math.ceil(sales.length / SALES_PAGE_SIZE));
    const page = Math.min(pages, Math.max(1, Number.isSafeInteger(requested) ? requested : 1));
    const start = (page - 1) * SALES_PAGE_SIZE;
    return { rows: sales.slice(start, start + SALES_PAGE_SIZE), page, pages, start };
  }
  /** Quote every CSV cell; neutralize spreadsheet formulas in user text. */
  function csvCell(value) {
    let text = String(value ?? '');
    if (/^[\s]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function toCSV(sales) {
    const rows = [['Sale ID', 'Date', 'Cashier', 'Customer', 'Items', 'Payment', 'Subtotal', 'Discount', 'Tax', 'Total', 'Status']];
    sales.forEach((sale) => rows.push([sale.id, sale.date, sale.cashierName, sale.customerName, itemCount(sale),
      sale.payment?.method, amount(sale.subtotal).toFixed(2), amount(sale.discount?.amount).toFixed(2),
      amount(sale.tax?.amount).toFixed(2), amount(sale.total).toFixed(2), STATUS[sale.status] || 'Unknown']));
    return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
  }
  function canProcessReturn(sale, session, now = Date.now()) {
    return (session?.role === 'admin' || (session?.role === 'staff' && STAFF_CAN_PROCESS_RETURNS)) &&
      sale.status !== 'fully_returned' && visibleSales([sale], session, now).length > 0;
  }
  // A small pure API also allows verification without browser storage or a DOM.
  window.VoltixSalesLogic = Object.freeze({ visibleSales, filterSales, calcStats, sortSales, paginate, toCSV, datePreset, canProcessReturn });

  const $ = (id) => document.getElementById(id);
  if (!$('sales-filters')) return;
  const user = store.getSession();
  if (!user) { window.location.replace('../index.html'); return; }
  const esc = store.escapeHtml;
  const money = (value) => esc(store.formatMoney(amount(value)));
  let page = 1;
  let sortField = 'date';
  let sortDirection = 'desc';
  let activeSaleId = null;
  let detailFocus = null;
  let activePreset = 'all';
  const detail = $('sales-detail');
  const receiptDialog = $('sales-receipt');

  function toast(message) {
    const element = document.createElement('div');
    element.className = 'pos-toast';
    element.textContent = message;
    $('sales-toasts').replaceChildren(element);
    window.setTimeout(() => element.remove(), 5000);
  }
  function readFilters() {
    return { query: $('sales-search').value, from: $('sales-from').value, to: $('sales-to').value,
      payment: $('sales-payment').value, status: $('sales-status').value };
  }
  const allowedSales = () => visibleSales(store.getSales(), user);
  const filteredSales = () => filterSales(allowedSales(), readFilters());
  const currentSale = () => allowedSales().find((sale) => sale.id === activeSaleId);
  function badge(status) {
    const variant = status === 'partially_returned' ? ' pos-badge-low' : status === 'fully_returned' ? ' pos-badge-out' : '';
    return `<span class="pos-badge${variant}">${esc(STATUS[status] || 'Unknown')}</span>`;
  }

  function render() {
    const filters = readFilters();
    const invalidRange = filters.from && filters.to && filters.from > filters.to;
    $('sales-date-error').textContent = invalidRange ? 'Start date must be on or before end date.' : '';
    $('sales-to').setAttribute('aria-invalid', String(Boolean(invalidRange)));
    const filtered = filteredSales();
    const stats = calcStats(filtered, store.getReturns());
    $('sales-stat-count').textContent = stats.count.toLocaleString();
    $('sales-stat-gross').textContent = store.formatMoney(stats.grossSales);
    $('sales-stat-refunds').textContent = store.formatMoney(stats.refunds);
    $('sales-stat-net').textContent = store.formatMoney(stats.netRevenue);
    $('sales-stat-average').textContent = store.formatMoney(stats.average);
    $('sales-stat-items').textContent = stats.items.toLocaleString();
    const result = paginate(sortSales(filtered, sortField, sortDirection), page);
    page = result.page;
    const focusedSale = document.activeElement?.dataset?.sale;
    const fragment = document.createDocumentFragment();
    result.rows.forEach((sale) => {
      const row = document.createElement('tr');
      row.innerHTML = `<th scope="row" data-label="Sale ID">${esc(sale.id)}</th>
        <td data-label="Date / time">${esc(store.formatDate(sale.date))}</td><td data-label="Cashier">${esc(sale.cashierName)}</td>
        <td data-label="Items">${itemCount(sale)}</td><td data-label="Payment">${esc(sale.payment?.method === 'cash' ? 'Cash' : sale.payment?.method === 'card' ? 'Card' : 'Unknown')}</td>
        <td data-label="Total"><strong>${money(sale.total)}</strong></td><td data-label="Status">${badge(sale.status)}</td>
        <td data-label="Details"><button class="pos-button" type="button" data-sale="${esc(sale.id)}" aria-label="View sale ${esc(sale.id)}">View</button></td>`;
      fragment.append(row);
    });
    $('sales-rows').replaceChildren(fragment);
    if (focusedSale) Array.from($('sales-rows').querySelectorAll('[data-sale]')).find((button) => button.dataset.sale === focusedSale)?.focus();
    $('sales-table-region').hidden = !filtered.length;
    $('sales-empty').hidden = filtered.length > 0;
    $('sales-pagination').hidden = !filtered.length;
    $('sales-results').textContent = filtered.length + ' sale' + (filtered.length === 1 ? '' : 's') + ' matching your filters';
    $('sales-page-summary').textContent = `Page ${page} of ${result.pages} \u00b7 ${result.start + 1}\u2013${Math.min(result.start + SALES_PAGE_SIZE, filtered.length)} of ${filtered.length}`;
    $('sales-previous').disabled = page <= 1;
    $('sales-next').disabled = page >= result.pages;
    $('sales-export').hidden = user.role !== 'admin';
    $('sales-export').disabled = !filtered.length;
    $('sales-date-column').setAttribute('aria-sort', sortField === 'date' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none');
    $('sales-total-column').setAttribute('aria-sort', sortField === 'total' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none');
    $('sales-sort-date').textContent = 'Date / time' + (sortField === 'date' ? (sortDirection === 'asc' ? ' \u2191' : ' \u2193') : ' \u2195');
    $('sales-sort-total').textContent = 'Total' + (sortField === 'total' ? (sortDirection === 'asc' ? ' \u2191' : ' \u2193') : ' \u2195');
    $('sales-sort').value = sortField + '-' + sortDirection;
    Array.from($('sales-presets').querySelectorAll('button')).forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.preset === activePreset)));
  }

  /** Details always use the original line snapshots, even after product deletion. */
  function renderDetail(sale) {
    $('sales-detail-title').textContent = 'Sale ' + sale.id;
    const row = (label, value) => `<div class="sales-summary-row"><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
    const returns = sortSales(store.getReturns().filter((record) => record.saleId === sale.id));
    $('sales-detail-content').innerHTML = `<p class="sales-muted">${esc(store.formatDate(sale.date))} \u00b7 ${esc(sale.cashierName)}</p>
      ${badge(sale.status)}${sale.customerName ? `<p>Customer: ${esc(sale.customerName)}</p>` : ''}
      <h3>Line items</h3><ul class="sales-lines">${linesOf(sale).map((line) => `<li><div><strong>${esc(lineName(line))}</strong><small>SKU: ${esc(lineSku(line))} \u00b7 ${esc(line.quantity ?? line.qty ?? 0)} \u00d7 ${money(line.unitPrice ?? line.price)}</small><small>Returned: ${esc(line.returnedQty ?? 0)}</small></div><strong>${money(line.lineTotal ?? ((line.quantity ?? line.qty ?? 0) * (line.unitPrice ?? line.price ?? 0)))}</strong></li>`).join('')}</ul>
      <dl class="sales-summary">${row('Subtotal', money(sale.subtotal))}${row('Discount', money(sale.discount?.amount))}
      ${row('Tax (' + (sale.tax?.rate ?? 0) + '%)', money(sale.tax?.amount))}${row('Total', `<strong>${money(sale.total)}</strong>`)}
      ${row('Payment', esc(sale.payment?.method === 'cash' ? 'Cash' : sale.payment?.method === 'card' ? 'Card' : 'Unknown'))}
      ${row('Tendered', money(sale.payment?.amountTendered))}${row('Change', money(sale.payment?.change))}</dl>
      ${sale.note ? `<p class="sales-note">Note: ${esc(sale.note)}</p>` : ''}
      <h3>Linked returns</h3>${returns.length ? `<ul class="sales-returns">${returns.map((record) => `<li><strong>${esc(record.id)}</strong><span>${esc(store.formatDate(record.date))}</span><span>${money(record.totalRefund)} \u00b7 ${esc(record.refundMethod)}</span><small>Processed by ${esc(record.processedByName)}</small></li>`).join('')}</ul>` : '<p class="sales-muted">No returns recorded for this sale.</p>'}`;
    const returnLink = $('sales-process-return');
    returnLink.hidden = !canProcessReturn(sale, user);
    if (returnLink.hidden) returnLink.removeAttribute('href');
    else returnLink.href = 'returns.html?sale=' + encodeURIComponent(sale.id);
  }

  function openDetail(id) {
    activeSaleId = id;
    const sale = currentSale();
    if (!sale) { toast('This sale is no longer available in your view.'); return; }
    detailFocus = document.activeElement;
    renderDetail(sale);
    detail.showModal();
    $('sales-detail-close').focus();
  }
  function fillReceipt(sale) {
    // Incomplete/corrupt optional fields must not break the shared renderer.
    const snapshot = { ...sale, items: linesOf(sale), discount: sale.discount || { amount: 0 },
      tax: sale.tax || { rate: 0, amount: 0 }, payment: sale.payment || {} };
    $('sales-receipt-content').innerHTML = window.VoltixReceipt.renderReceipt(snapshot, 'sale');
  }
  function printReceipt() {
    const sale = currentSale();
    if (!sale) { refresh(); return; }
    fillReceipt(sale);
    if (!receiptDialog.open) receiptDialog.showModal();
    window.print();
  }
  function refresh() {
    render();
    if (!detail.open) return;
    const sale = currentSale();
    if (!sale) {
      if (receiptDialog.open) receiptDialog.close();
      detail.close();
      toast('This sale is no longer available in your view.');
      return;
    }
    renderDetail(sale);
    if (receiptDialog.open) fillReceipt(sale);
  }

  // Native dialogs provide isolation and Escape; wrap Tab and restore focus.
  [detail, receiptDialog].forEach((dialog) => {
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const targets = Array.from(dialog.querySelectorAll('button:not(:disabled), a[href]')).filter((element) => !element.hidden && element.getClientRects().length);
      const first = targets[0]; const last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  });
  detail.addEventListener('close', () => {
    activeSaleId = null;
    if (detailFocus?.isConnected) detailFocus.focus();
    else ($('sales-rows').querySelector('button') || $('sales-search')).focus();
  });
  receiptDialog.addEventListener('close', () => { if (detail.open) $('sales-print').focus(); });
  $('sales-detail-close').addEventListener('click', () => detail.close());
  $('sales-receipt-close').addEventListener('click', () => receiptDialog.close());
  $('sales-print').addEventListener('click', printReceipt);
  $('sales-receipt-print').addEventListener('click', printReceipt);
  $('sales-rows').addEventListener('click', (event) => {
    const button = event.target.closest('[data-sale]');
    if (button) openDetail(button.dataset.sale);
  });
  $('sales-filters').addEventListener('submit', (event) => event.preventDefault());
  $('sales-filters').addEventListener('input', (event) => {
    if (event.target === $('sales-from') || event.target === $('sales-to')) activePreset = '';
    page = 1; render();
  });
  $('sales-presets').addEventListener('click', (event) => {
    const button = event.target.closest('[data-preset]');
    if (!button) return;
    activePreset = button.dataset.preset;
    const dates = datePreset(activePreset);
    $('sales-from').value = dates.from; $('sales-to').value = dates.to;
    page = 1; render();
  });
  $('sales-reset').addEventListener('click', () => {
    $('sales-filters').reset();
    activePreset = 'all'; page = 1; sortField = 'date'; sortDirection = 'desc'; render();
  });
  function changeSort(field) {
    sortDirection = sortField === field && sortDirection === 'desc' ? 'asc' : 'desc';
    sortField = field; page = 1; render();
  }
  $('sales-sort-date').addEventListener('click', () => changeSort('date'));
  $('sales-sort-total').addEventListener('click', () => changeSort('total'));
  $('sales-sort').addEventListener('change', () => {
    [sortField, sortDirection] = $('sales-sort').value.split('-'); page = 1; render();
  });
  $('sales-previous').addEventListener('click', () => { page--; render(); });
  $('sales-next').addEventListener('click', () => { page++; render(); });
  $('sales-export').addEventListener('click', () => {
    if (user.role !== 'admin') return;
    const sales = sortSales(filteredSales(), sortField, sortDirection);
    if (!sales.length) return;
    let url;
    let anchor;
    try {
      url = window.URL.createObjectURL(new Blob(['\uFEFF', toCSV(sales)], { type: 'text/csv;charset=utf-8;' }));
      anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'voltix-sales-' + localDate(new Date()) + '.csv';
      document.body.append(anchor); anchor.click();
      toast('Exported ' + sales.length + ' sales.');
    } catch { toast('CSV export could not be created. Please try again.'); }
    finally {
      anchor?.remove();
      if (url) window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    }
  });
  $('sales-staff-note').hidden = user.role !== 'staff';
  ['storage', 'voltix:data-changed', 'voltix:sale-completed', 'focus'].forEach((event) => window.addEventListener(event, refresh));
  // Age limits and calendar presets remain current while a tab stays open.
  window.setInterval(() => {
    if (activePreset && activePreset !== 'all') {
      const dates = datePreset(activePreset);
      $('sales-from').value = dates.from; $('sales-to').value = dates.to;
    }
    refresh();
  }, 60000);
  render();
})(window);
