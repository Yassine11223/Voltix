/* Shared, browser-local POS data contract. No page or inventory controller required. */
(function (window) {
  'use strict';

  const DEFAULT_TAX_RATE = 14;
  const DEFAULT_CURRENCY_SYMBOL = '$';
  const MAX_STAFF_DISCOUNT_PERCENT = 10;
  const RETURN_WINDOW_DAYS = 14;
  const STAFF_CAN_PROCESS_RETURNS = true;
  const STAFF_SALES_VISIBLE_DAYS = 7;
  const SALES_PAGE_SIZE = 10;
  const ENABLE_REPORTS_COMPAT_MIRROR = true;
  const MAX_MONEY = 1e12;
  const MAX_QUANTITY = 1e6;
  const KEYS = Object.freeze({ products: 'voltix_products', movements: 'voltix_stock_movements',
    sales: 'voltix_sales', returns: 'voltix_returns', counters: 'voltix_counters',
    lastUpdate: 'voltix_lastUpdate', cart: 'voltix_cart', settings: 'voltix.settings',
    session: 'voltix.session', lock: 'voltix_pos_lock' });
  const DEFAULTS = Object.freeze({ storeName: 'Voltix Electronics', storePhone: '', storeAddress: '',
    storeTaxId: '', currencySymbol: DEFAULT_CURRENCY_SYMBOL, taxRate: DEFAULT_TAX_RATE,
    receiptHeader: 'Thank you for choosing Voltix Electronics!', receiptFooter: '', autoPrint: false,
    preventNegativeStock: true, autoDeductStock: true });
  const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  const fail = (error, problems = [error]) => ({ ok: false, error, problems });
  let busy = false;

  // All storage access, including obtaining the browser storage object, stays here.
  function readRaw(area, key) {
    try { return { ok: true, value: window[area].getItem(key) }; }
    catch { return { ok: false, value: null }; }
  }
  function writeRaw(area, key, value) {
    try {
      if (value === null) window[area].removeItem(key);
      else window[area].setItem(key, value);
      return true;
    } catch { return false; }
  }
  function readJSON(area, key, fallback) {
    const raw = readRaw(area, key);
    try { return raw.ok && raw.value !== null ? JSON.parse(raw.value) : fallback; }
    catch { return fallback; }
  }
  function writeJSON(area, key, value) {
    try { return writeRaw(area, key, JSON.stringify(value)); }
    catch { return false; }
  }
  const arrayAt = (key) => {
    const data = readJSON('localStorage', key, []);
    return Array.isArray(data) ? data.filter(isObject) : [];
  };

  /** Use the app's validated session, falling back only to voltix.session. */
  function getSession() {
    const value = window.VoltixApp?.session || readJSON('sessionStorage', KEYS.session, null);
    if (!isObject(value) || !['admin', 'staff'].includes(value.role) ||
        !['id', 'name', 'email'].every((key) => typeof value[key] === 'string' && value[key].trim()) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) return null;
    return { id: value.id, name: value.name, email: value.email, role: value.role };
  }

  function getSettings() {
    const stored = readJSON('localStorage', KEYS.settings, {});
    const value = isObject(stored) ? stored : {};
    const settings = { ...DEFAULTS };
    Object.keys(DEFAULTS).forEach((key) => {
      if (typeof DEFAULTS[key] === 'string' && typeof value[key] === 'string') settings[key] = value[key];
      if (typeof DEFAULTS[key] === 'boolean' && typeof value[key] === 'boolean') settings[key] = value[key];
    });
    if (Number.isFinite(value.taxRate) && value.taxRate >= 0 && value.taxRate <= 100) settings.taxRate = value.taxRate;
    settings.currencySymbol ||= DEFAULT_CURRENCY_SYMBOL;
    settings.storeName ||= DEFAULTS.storeName;
    return settings;
  }

  const getProducts = () => arrayAt(KEYS.products).filter((p) => p.status === 'active' && typeof p.id === 'string');
  const getSales = () => arrayAt(KEYS.sales);
  const getReturns = () => arrayAt(KEYS.returns);
  /** One visibility rule for Sales, Returns and transaction validation. */
  function visibleSales(sales, session, now = Date.now()) {
    if (!session || !['admin', 'staff'].includes(session.role)) return [];
    return sales.filter((sale) => {
      if (!sale || typeof sale.id !== 'string') return false;
      if (session.role === 'admin') return true;
      const age = now - Date.parse(sale.date);
      return sale.cashierId === session.id && Number.isFinite(age) && age >= 0 && age <= STAFF_SALES_VISIBLE_DAYS * 86400000;
    });
  }

  /** Transient comparison token; never added to a sale or return record. */
  function returnRevision(sale, products, returns) {
    return JSON.stringify([sale, products.filter((product) => product.status === 'active' &&
      sale.items.some((line) => line.productId === product.id)), returns.filter((record) => record.saleId === sale.id)]);
  }
  // The inventory seed function replaces movement history. Never load it over real data.
  function canSeedDemoData() {
    if (getSession()?.role !== 'admin') return false;
    return [KEYS.products, KEYS.movements].every((key) => {
      const raw = readRaw('localStorage', key);
      if (!raw.ok) return false;
      if (raw.value === null) return true;
      try { const value = JSON.parse(raw.value); return Array.isArray(value) && value.length === 0; }
      catch { return false; }
    });
  }
  const round2 = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.round((n + Math.sign(n) * Number.EPSILON * Math.max(1, Math.abs(n))) * 100) / 100 : 0;
  };
  const formatMoney = (n) => getSettings().currencySymbol + round2(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function formatDate(iso) {
    const date = new Date(iso);
    return Number.isFinite(date.getTime()) ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown date';
  }
  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const moneyValid = (n) => Number.isFinite(n) && n >= 0 && n <= MAX_MONEY;
  const quantityValid = (n) => Number.isSafeInteger(n) && n >= 1 && n <= MAX_QUANTITY;

  function cleanCart(lines) {
    if (!Array.isArray(lines)) return [];
    const quantities = new Map();
    lines.forEach((line) => {
      if (!line || typeof line.productId !== 'string' || !quantityValid(line.quantity)) return;
      quantities.set(line.productId, Math.min(MAX_QUANTITY, (quantities.get(line.productId) || 0) + line.quantity));
    });
    return Array.from(quantities, ([productId, quantity]) => ({ productId, quantity }));
  }
  const getCart = () => cleanCart(readJSON('sessionStorage', KEYS.cart, []));
  const setCart = (lines) => writeJSON('sessionStorage', KEYS.cart, cleanCart(lines));

  /** Pure calculator: items use {unitPrice, quantity}; invalid inputs throw. */
  function calcTotals(items, discount = { type: 'none', value: 0 }, taxRate = DEFAULT_TAX_RATE) {
    if (!Array.isArray(items) || !items.every((line) => line && moneyValid(line.unitPrice) && quantityValid(line.quantity))) {
      throw new Error('Every line needs a valid price and whole-number quantity.');
    }
    const subtotal = round2(items.reduce((sum, line) => sum + round2(line.unitPrice * line.quantity), 0));
    if (!moneyValid(subtotal)) throw new Error('The sale amount is too large.');
    const type = discount?.type || 'none';
    const value = type === 'none' ? 0 : Number(discount?.value);
    if (!['none', 'percent', 'fixed'].includes(type) || !moneyValid(value) ||
        (type === 'percent' && value > 100) || (type === 'fixed' && value > subtotal)) {
      throw new Error('Use 0–100% or a fixed discount no greater than the subtotal.');
    }
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) throw new Error('Invalid tax rate.');
    const amount = round2(type === 'percent' ? subtotal * value / 100 : value);
    const taxable = round2(subtotal - amount);
    const tax = { rate: taxRate, amount: round2(taxable * taxRate / 100) };
    const total = round2(taxable + tax.amount);
    if (!moneyValid(total)) throw new Error('The sale amount is too large.');
    return { subtotal, discount: { type, value, amount }, tax, total };
  }

  /** Pure per-line refund, prorating the original discount and original tax. */
  function calcRefund(sale, productId, quantity) {
    const line = sale?.items?.find((item) => item.productId === productId);
    if (!line || !quantityValid(quantity) || quantity > line.quantity || !moneyValid(line.unitPrice) ||
        !moneyValid(sale.subtotal) || !moneyValid(sale.discount?.amount) || sale.discount.amount > sale.subtotal ||
        !Number.isFinite(sale.tax?.rate) || sale.tax.rate < 0 || sale.tax.rate > 100) throw new Error('Invalid refund inputs.');
    const ratio = sale.subtotal ? 1 - sale.discount.amount / sale.subtotal : 0;
    return round2(line.unitPrice * quantity * ratio * (1 + sale.tax.rate / 100));
  }

  /** Pure batch reconciliation: cap the balance and settle it on the final line. */
  function calcReturnRefund(sale, items, returns = []) {
    if (!moneyValid(sale?.total) || !Array.isArray(items) || !items.length) throw new Error('Invalid refund inputs.');
    const paid = round2(returns.filter((record) => record.saleId === sale.id).reduce((sum, record) => {
      if (!moneyValid(record.totalRefund)) throw new Error('Invalid stored refund.');
      return sum + record.totalRefund;
    }, 0));
    if (paid > sale.total) throw new Error('Stored refunds exceed the sale total. Ask an administrator to review this sale.');
    let balance = round2(sale.total - paid);
    const amounts = items.map((item) => {
      const refund = Math.min(balance, calcRefund(sale, item.productId, item.quantity));
      balance = round2(balance - refund);
      return refund;
    });
    const final = sale.items.every((line) => line.returnedQty + (items.find((item) => item.productId === line.productId)?.quantity || 0) === line.quantity);
    if (final) amounts[amounts.length - 1] = round2(amounts[amounts.length - 1] + balance);
    return { amounts, totalRefund: round2(amounts.reduce((sum, value) => sum + value, 0)) };
  }

  // Reports compatibility is deliberately isolated and best effort.
  function mirrorSaleForReports(sale) {
    if (!ENABLE_REPORTS_COMPAT_MIRROR) return;
    const mirror = readJSON('localStorage', 'voltix.sales', []);
    if (Array.isArray(mirror)) writeJSON('localStorage', 'voltix.sales', [...mirror, sale]);
  }

  // Snapshot exact bytes, including missing/corrupt values, so rollback loses no fields.
  function snapshot() {
    const result = {};
    for (const key of [KEYS.products, KEYS.movements, KEYS.sales, KEYS.returns, KEYS.counters, KEYS.lastUpdate]) {
      const raw = readRaw('localStorage', key);
      if (!raw.ok) throw new Error('Browser storage is unavailable. Nothing was saved.');
      result[key] = raw.value;
    }
    return result;
  }
  function parseSnapshot(snap, key, fallback) {
    if (snap[key] === null) return fallback;
    let parsed;
    try { parsed = JSON.parse(snap[key]); } catch { throw new Error('Stored data is corrupt. Ask an administrator to repair it before continuing.'); }
    if (Array.isArray(fallback) ? !Array.isArray(parsed) || !parsed.every(isObject) : !isObject(parsed)) {
      throw new Error('Stored data has an invalid format. Nothing was saved.');
    }
    return parsed;
  }
  function nextId(counters, field, prefix, records) {
    const count = counters[field] ?? 0;
    if (!Number.isSafeInteger(count) || count < 0 || count >= Number.MAX_SAFE_INTEGER) throw new Error('Invalid receipt counter.');
    let next = count + 1;
    while (records.some((record) => record.id === prefix + String(next).padStart(6, '0'))) {
      next++;
      if (!Number.isSafeInteger(next)) throw new Error('Receipt counter exhausted.');
    }
    counters[field] = next;
    return prefix + String(next).padStart(6, '0');
  }

  /** Synchronous commit with optimistic conflict checks and exact rollback. */
  function commit(snap, writes) {
    if (Object.keys(snap).some((key) => {
      const current = readRaw('localStorage', key);
      return !current.ok || current.value !== snap[key];
    })) return fail('Data changed in another tab. Refresh and try again.');
    const saved = [];
    for (const [key, value] of writes) {
      // Restore even the failing key: a storage implementation can throw after writing.
      saved.push(key);
      if (!writeJSON('localStorage', key, value)) {
        const unrestored = saved.reverse().filter((savedKey) => !writeRaw('localStorage', savedKey, snap[savedKey]));
        return fail(unrestored.length
          ? 'Save failed and browser storage also blocked rollback. Stop and inspect storage before retrying.'
          : 'Save failed. All changes were rolled back; no receipt counter was consumed.');
      }
    }
    return { ok: true };
  }

  // A short shared lease rejects competing POS tabs; no asynchronous work occurs inside it.
  function transaction(work) {
    if (busy) return fail('Another POS transaction is processing.');
    busy = true;
    const token = Date.now() + '-' + Math.random().toString(36).slice(2);
    let acquired = false;
    try {
      const lock = readJSON('localStorage', KEYS.lock, null);
      if (lock?.expires > Date.now()) return fail('Another POS tab is saving. Please try again.');
      if (!writeJSON('localStorage', KEYS.lock, { token, expires: Date.now() + 15000 })) return fail('Browser storage is unavailable.');
      acquired = readJSON('localStorage', KEYS.lock, null)?.token === token;
      if (!acquired) return fail('Another POS tab is saving. Please try again.');
      return work();
    } catch (error) { return fail(error.message || 'The transaction could not be saved.'); }
    finally {
      if (acquired && readJSON('localStorage', KEYS.lock, null)?.token === token) writeRaw('localStorage', KEYS.lock, null);
      busy = false;
    }
  }
  function notify(type, record) {
    window.dispatchEvent(new window.CustomEvent(type, { detail: record }));
    window.dispatchEvent(new window.CustomEvent('voltix:data-changed', { detail: { id: record.id } }));
  }
  function movement(product, quantity, type, id, index, user, date, movements) {
    const before = Number(product.stock);
    const after = before + quantity;
    if (!Number.isSafeInteger(before) || !Number.isSafeInteger(after)) throw new Error('Invalid stock amount.');
    let movementId = 'MV-' + id + '-' + (index + 1);
    while (movements.some((m) => m.id === movementId)) movementId += '-1';
    movements.push({ id: movementId, productId: product.id, type, change: quantity,
      stockBefore: before, stockAfter: after, reason: type === 'sale' ? 'POS sale' : 'Stock return', reference: id, user, date });
    product.stock = after;
    product.updatedAt = date;
  }

  /** payload: {items:[{productId,quantity}], discount, payment, customerName?, note?, expectedTotal?}. */
  function checkoutSale(payload = {}) {
    const result = transaction(() => {
      const user = getSession();
      if (!user) return fail('Sign in before completing a sale.');
      const settings = getSettings();
      const snap = snapshot();
      const products = parseSnapshot(snap, KEYS.products, []);
      const sales = parseSnapshot(snap, KEYS.sales, []);
      const movements = parseSnapshot(snap, KEYS.movements, []);
      const counters = parseSnapshot(snap, KEYS.counters, {});
      const problems = [];
      const seen = new Set();
      if (!Array.isArray(payload.items) || !payload.items.length) return fail('Add products to the cart first.');
      const items = payload.items.map((line) => {
        const product = products.find((p) => p.id === line?.productId);
        if (!product || product.status !== 'active') problems.push('A product is missing or archived.');
        if (!quantityValid(line?.quantity)) problems.push('Quantities must be positive whole numbers.');
        if (seen.has(line?.productId)) problems.push('A product may appear only once in a sale.');
        seen.add(line?.productId);
        if (product) {
          const stock = Number(product.stock);
          if (!Number.isSafeInteger(stock) || !moneyValid(Number(product.price))) problems.push(String(product.name) + ': invalid product price or stock.');
          if (settings.preventNegativeStock && line.quantity > stock) problems.push(String(product.name) + ': only ' + Math.max(0, stock) + ' in stock.');
        }
        return { productId: product?.id, id: product?.id, name: String(product?.name ?? ''), sku: String(product?.sku ?? ''),
          unitPrice: round2(product?.price), price: round2(product?.price), quantity: line?.quantity,
          lineTotal: round2(round2(product?.price) * line?.quantity), returnedQty: 0 };
      });
      if (problems.length) return fail('Review the cart before checkout.', problems);
      const totals = calcTotals(items, payload.discount, settings.taxRate);
      if (user.role === 'staff' && ((totals.discount.type === 'percent' && totals.discount.value > MAX_STAFF_DISCOUNT_PERCENT) ||
          (totals.discount.type === 'fixed' && totals.discount.value > totals.subtotal * MAX_STAFF_DISCOUNT_PERCENT / 100))) {
        return fail('Staff discounts are limited to ' + MAX_STAFF_DISCOUNT_PERCENT + '%.');
      }
      if (payload.expectedTotal !== undefined && payload.expectedTotal !== totals.total) return fail('Prices or settings changed. Review the new total and try again.');
      const method = payload.payment?.method;
      if (!['cash', 'card'].includes(method)) return fail('Choose Cash or Card.');
      const tendered = method === 'card' ? totals.total : Number(payload.payment.amountTendered);
      if (!moneyValid(tendered) || round2(tendered) < totals.total) return fail('Amount received must cover the total.');
      const date = new Date().toISOString();
      const id = nextId(counters, 'sale', 'S-', sales);
      const sale = { id, date, cashierId: user.id, cashierName: user.name, items, ...totals,
        payment: { method, amountTendered: round2(tendered), change: round2(tendered - totals.total) },
        paymentMethod: method === 'cash' ? 'Cash' : 'Card', cashier: user.name,
        customerName: String(payload.customerName || '').trim().slice(0, 200),
        note: String(payload.note || '').trim().slice(0, 1000), status: 'completed' };
      const writes = [];
      if (settings.autoDeductStock) {
        items.forEach((item, index) => movement(products.find((p) => p.id === item.productId), -item.quantity, 'sale', id, index, user.name, date, movements));
        writes.push([KEYS.products, products], [KEYS.movements, movements]);
      }
      writes.push([KEYS.sales, [...sales, sale]], [KEYS.counters, counters], [KEYS.lastUpdate, date]);
      const saved = commit(snap, writes);
      if (!saved.ok) return saved;
      // Mirror only after all mandatory writes, so a rollback cannot leave a phantom sale.
      mirrorSaleForReports(sale);
      return { ok: true, data: sale };
    });
    if (result.ok) notify('voltix:sale-completed', result.data);
    return result;
  }

  /** payload: {saleId, items:[{productId,quantity,reason,restock}], refundMethod, note?, overrideReturnWindow?}. */
  function processReturn(payload = {}) {
    const result = transaction(() => {
      const user = getSession();
      if (!user || (user.role === 'staff' && !STAFF_CAN_PROCESS_RETURNS)) return fail('You cannot process returns.');
      const snap = snapshot();
      const sales = parseSnapshot(snap, KEYS.sales, []);
      const returns = parseSnapshot(snap, KEYS.returns, []);
      const products = parseSnapshot(snap, KEYS.products, []);
      const movements = parseSnapshot(snap, KEYS.movements, []);
      const counters = parseSnapshot(snap, KEYS.counters, {});
      const sale = sales.find((record) => record.id === payload.saleId);
      if (!sale || !Array.isArray(sale.items) || !visibleSales([sale], user).length) return fail('Sale not found.');
      if (payload.expectedRevision !== undefined && payload.expectedRevision !== returnRevision(sale, products, returns)) {
        return fail('Sale or products changed. Review the remaining quantities before confirming again.');
      }
      const age = Date.now() - Date.parse(sale.date);
      if (!Number.isFinite(age) || age < 0) return fail('The sale date is invalid.');
      if (age > RETURN_WINDOW_DAYS * 86400000 && !(user.role === 'admin' && payload.overrideReturnWindow === true)) return fail('The 14-day return window has expired.');
      if (sale.status === 'fully_returned') return fail('This sale has already been fully returned.');
      if (!Array.isArray(payload.items) || !payload.items.length) return fail('Select at least one item to return.');
      if (!['cash', 'card'].includes(payload.refundMethod)) return fail('Choose a refund method.');
      const seen = new Set();
      const warnings = [];
      const items = payload.items.map((requested) => {
        const line = sale.items.find((item) => item.productId === requested?.productId);
        if (!line || !quantityValid(requested?.quantity) || !Number.isSafeInteger(line.quantity) ||
            !Number.isSafeInteger(line.returnedQty) || line.returnedQty < 0 ||
            requested.quantity > line.quantity - line.returnedQty || seen.has(requested.productId)) {
          throw new Error('Return quantities must not exceed the remaining quantity; duplicate products are not allowed.');
        }
        if (!['Defective', 'Wrong item', 'Customer changed mind', 'Damaged in store', 'Other'].includes(requested.reason) || typeof requested.restock !== 'boolean') {
          throw new Error('Every return needs a reason and a restock choice.');
        }
        seen.add(requested.productId);
        const product = products.find((p) => p.id === line.productId && p.status === 'active');
        const restock = requested.restock && Boolean(product);
        if (requested.restock && !product) warnings.push(line.name + ': restock skipped because the product is deleted or archived.');
        return { productId: line.productId, name: line.name, unitPrice: line.unitPrice, quantity: requested.quantity,
          refundAmount: 0, reason: requested.reason, restock };
      });
      const refund = calcReturnRefund(sale, items, returns);
      items.forEach((item, index) => { item.refundAmount = refund.amounts[index]; });
      const date = new Date().toISOString();
      const id = nextId(counters, 'return', 'R-', returns);
      const record = { id, date, saleId: sale.id, processedById: user.id, processedByName: user.name, items,
        totalRefund: refund.totalRefund,
        refundMethod: payload.refundMethod, note: String(payload.note || '').trim().slice(0, 1000) };
      items.forEach((item, index) => {
        if (item.restock) movement(products.find((p) => p.id === item.productId), item.quantity, 'return', id, index, user.name, date, movements);
        sale.items.find((line) => line.productId === item.productId).returnedQty += item.quantity;
      });
      sale.status = sale.items.every((line) => line.returnedQty === line.quantity) ? 'fully_returned' : 'partially_returned';
      const writes = [[KEYS.returns, [...returns, record]]];
      if (items.some((item) => item.restock)) writes.push([KEYS.products, products], [KEYS.movements, movements]);
      writes.push([KEYS.sales, sales], [KEYS.counters, counters], [KEYS.lastUpdate, date]);
      const saved = commit(snap, writes);
      return saved.ok ? { ok: true, data: record, warnings } : saved;
    });
    if (result.ok) notify('voltix:return-completed', result.data);
    return result;
  }

  window.VoltixPOSStore = Object.freeze({ getSession, getSettings, getProducts, getSales, getReturns, visibleSales, returnRevision, calcReturnRefund,
    round2, formatMoney, formatDate, escapeHtml, getCart, setCart, canSeedDemoData, calcTotals, calcRefund, checkoutSale, processReturn,
    constants: Object.freeze({ DEFAULT_TAX_RATE, DEFAULT_CURRENCY_SYMBOL, MAX_STAFF_DISCOUNT_PERCENT,
      RETURN_WINDOW_DAYS, STAFF_CAN_PROCESS_RETURNS, STAFF_SALES_VISIBLE_DAYS, SALES_PAGE_SIZE, ENABLE_REPORTS_COMPAT_MIRROR }) });
})(window);
