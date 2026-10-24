(function (window) {
  'use strict';
  const store = window.VoltixPOSStore;
  const esc = store.escapeHtml;
  const money = (n) => esc(store.formatMoney(n));
  const itemName = (item) => item?.name || item?.productName || store.getProductById(item?.productId || item?.id)?.name || `Deleted product (${item?.productId || item?.id || 'unknown'})`;
  let dialog = null;
  let previousFocus = null;
  let autoPrintTimer = null;

  /** Return escaped, thermal-style markup for a sale or refund snapshot. */
  function renderReceipt(record, type = 'sale') {
    const settings = store.getSettings();
    const refund = type === 'refund';
    const row = (label, value, strong = false) => `<div class="pos-receipt-row${strong ? ' pos-receipt-total' : ''}"><span>${esc(label)}</span><span>${value}</span></div>`;
    const lines = record.items.map((item) => `<li><strong>${esc(itemName(item))}</strong>${row(item.quantity + ' \u00d7 ' + store.formatMoney(item.unitPrice), money(refund ? item.refundAmount : item.lineTotal))}${refund ? `<small>Reason: ${esc(item.reason)}</small>` : ''}</li>`).join('');
    return `<article class="pos-receipt" aria-label="${refund ? 'Refund receipt' : 'Sale receipt'}">
      <header class="pos-receipt-header"><div class="pos-wordmark">VOLTIX</div><strong>${esc(settings.storeName)}</strong>
      ${[settings.storeAddress, settings.storePhone, settings.storeTaxId && 'Tax ID: ' + settings.storeTaxId].filter(Boolean).map((value) => `<div>${esc(value)}</div>`).join('')}
      <p>${esc(settings.receiptHeader)}</p><h2>${refund ? 'REFUND RECEIPT' : 'SALE RECEIPT'}</h2></header>
      ${row('Receipt', esc(record.id))}${refund ? row('Original sale', esc(record.saleId)) : ''}
      ${row('Date', esc(store.formatDate(record.date)))}${row(refund ? 'Processed by' : 'Cashier', esc(refund ? record.processedByName : record.cashierName))}
      ${record.customerName ? row('Customer', esc(record.customerName)) : ''}
      <ul class="pos-receipt-items">${lines}</ul>
      ${refund ? row('TOTAL REFUND', money(record.totalRefund), true) :
        row('Subtotal', money(record.subtotal)) + row('Discount', '\u2212' + money(record.discount.amount)) +
        row('Tax (' + record.tax.rate + '%)', money(record.tax.amount)) + row('TOTAL', money(record.total), true)}
      ${row(refund ? 'Refund method' : 'Payment method', esc(refund ? record.refundMethod : record.payment.method))}
      ${refund ? '<p>Refunds include the original proportional discount and tax, rounded per line.</p>' : row('Tendered', money(record.payment.amountTendered)) + row('Change', money(record.payment.change))}
      ${record.note ? `<p>Note: ${esc(record.note)}</p>` : ''}
      ${settings.receiptFooter ? `<footer>${esc(settings.receiptFooter)}</footer>` : ''}
    </article>`;
  }

  function closeReceipt() {
    window.clearTimeout(autoPrintTimer);
    if (dialog?.open) dialog.close();
  }
  function printReceipt() {
    if (!dialog?.open) return;
    window.print();
  }

  /** Native dialog provides modal isolation; explicit tab wrapping keeps focus inside. */
  function showReceipt(record, type = 'sale', onNewSale = () => {}) {
    closeReceipt();
    previousFocus = document.activeElement;
    let root = document.getElementById('pos-receipt-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'pos-receipt-root';
      document.body.append(root);
    }
    root.innerHTML = `<dialog class="pos-modal" aria-label="${type === 'refund' ? 'Refund' : 'Sale'} completed">
      <div class="pos-modal-heading"><h2>${type === 'refund' ? 'Return processed' : 'Sale completed'}</h2><button class="pos-button" type="button" data-receipt-close aria-label="Close receipt">Close</button></div>
      ${renderReceipt(record, type)}
      <div class="pos-modal-actions"><button class="button button-primary" type="button" data-receipt-print>Print</button><button class="pos-button" type="button" data-receipt-new>New sale</button></div></dialog>`;
    dialog = root.querySelector('dialog');
    dialog.querySelector('[data-receipt-close]').addEventListener('click', closeReceipt);
    dialog.querySelector('[data-receipt-print]').addEventListener('click', printReceipt);
    dialog.querySelector('[data-receipt-new]').addEventListener('click', () => { closeReceipt(); onNewSale(); });
    dialog.addEventListener('click', (event) => { if (event.target === dialog) closeReceipt(); });
    dialog.addEventListener('close', () => {
      window.clearTimeout(autoPrintTimer);
      if (previousFocus?.isConnected) previousFocus.focus();
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const buttons = Array.from(dialog.querySelectorAll('button'));
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    dialog.showModal();
    if (type !== 'refund' && store.getSettings().autoPrint) autoPrintTimer = window.setTimeout(printReceipt, 150);
  }
  window.VoltixReceipt = Object.freeze({ renderReceipt, showReceipt, closeReceipt, printReceipt });
})(window);
