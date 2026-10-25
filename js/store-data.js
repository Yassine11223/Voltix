(function (window) {
  'use strict';

  const KEYS = Object.freeze({ products: 'voltix_products', settings: 'voltix.settings', cart: 'voltix_store_cart', session: 'voltix_store_session', customers: 'voltix_customers', remember: 'voltix_store_remember_email', orders: 'voltix_orders', counters: 'voltix_store_counters' });
  const NEXT_PAGES = ['index', 'category', 'deals', 'product', 'cart', 'checkout', 'success', 'orders', 'order', 'profile'];
  const LOGIN_ERROR = 'Invalid email or password';
  const RESET_KEY = 'voltix_store_reset';
  const RESET_TTL = 15 * 60 * 1000;
  const RESET_SENT = 'If an account exists for this email address, a reset link was sent.';
  const RESET_INVALID = 'This reset link is invalid or has expired. Start again.';
  const BRANDS = Object.freeze({ APL: 'Apple', SAM: 'Samsung', GOO: 'Google', LEN: 'Lenovo', MS: 'Microsoft', ANK: 'Anker', UGR: 'Ugreen', SNY: 'Sony', NIN: 'Nintendo' });
  const DEALS = Object.freeze({
    'APL-IP15-128': Object.freeze({ amount: 50 }),
    'GOO-P8P-128': Object.freeze({ amount: 70 }),
    'SNY-WH1000XM5': Object.freeze({ amount: 50 }),
    'APL-IPAD-AIR': Object.freeze({ amount: 50 }),
    'APL-APP-2': Object.freeze({ amount: 30 }),
    'ANK-HUB-8IN1': Object.freeze({ discountPercent: 20 })
  });
  const SORTS = ['featured', 'price-asc', 'price-desc', 'name-asc', 'newest', 'discount'];
  const DEFAULT_SETTINGS = Object.freeze({ taxRate: 14, currencySymbol: '$', storeName: 'Voltix Electronics', storePhone: '[STORE PHONE]', address: '[STORE ADDRESS]' });
  const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const round2 = (value) => Math.round((finite(value) + Number.EPSILON) * 100) / 100;
  const text = (value, fallback = '') => typeof value === 'string' ? value : fallback;
  let orderProcessing = false;
  let profileProcessing = false;

  /** Read only the explicitly allowed keys; unavailable/corrupt storage is harmless. */
  function safeRead(key, fallback) {
    if (!Object.values(KEYS).includes(key) && key !== RESET_KEY) return fallback;
    try {
      const storage = key === KEYS.session || key === RESET_KEY ? window.sessionStorage : window.localStorage;
      const raw = storage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) { return fallback; }
  }

  /** Explicit write allowlist keeps staff data read-only. */
  function safeWrite(key, value) {
    if (![KEYS.cart, KEYS.customers, KEYS.session, KEYS.remember, KEYS.orders, KEYS.counters, RESET_KEY].includes(key)) return false;
    try {
      const storage = key === KEYS.session || key === RESET_KEY ? window.sessionStorage : window.localStorage;
      storage.setItem(key, JSON.stringify(value));
      if (key === KEYS.cart) window.dispatchEvent(new CustomEvent('voltix:store-cart-changed'));
      if (key === KEYS.session) window.dispatchEvent(new CustomEvent('voltix:store-session-changed'));
      return true;
    } catch (error) { return false; }
  }

  function getSettings() {
    const stored = safeRead(KEYS.settings, {});
    const value = isRecord(stored) ? stored : {};
    return {
      taxRate: Math.max(0, finite(value.taxRate, 14)),
      currencySymbol: text(value.currencySymbol).trim() || DEFAULT_SETTINGS.currencySymbol,
      storeName: text(value.storeName).trim() || DEFAULT_SETTINGS.storeName,
      storePhone: text(value.storePhone).trim() || DEFAULT_SETTINGS.storePhone,
      address: text(value.address || value.storeAddress).trim() || DEFAULT_SETTINGS.address
    };
  }

  function deriveBrand(product) {
    const prefix = text(product && product.sku).split('-')[0].toUpperCase();
    return BRANDS[prefix] || text(product && product.name).trim().split(/\s+/)[0] || 'Other';
  }

  /** No remote resources or executable image URLs, including on file://. */
  function safeImage(value) {
    if (typeof value !== 'string') return '';
    if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(value)) return value;
    if (!value.trim() || /[\u0000-\u0020\\]/.test(value) || /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//')) return '';
    return value;
  }

  /** Explicit customer projection prevents internal inventory fields from leaking. */
  function getProducts() {
    const stored = safeRead(KEYS.products, []);
    if (!Array.isArray(stored)) return [];
    const seen = new Set();
    return stored.filter((p) => isRecord(p) && p.status === 'active' && text(p.id) && !seen.has(p.id) && seen.add(p.id)).map((p) => ({
      id: p.id, sku: text(p.sku), name: text(p.name).trim() || 'Unnamed product',
      category: text(p.category).trim() || 'Uncategorized', brand: deriveBrand(p),
      price: round2(Math.max(0, finite(p.price))), stock: Math.max(0, Math.floor(finite(p.stock))),
      lowStockThreshold: Math.max(0, Math.floor(finite(p.lowStockThreshold, 5))),
      description: text(p.description), image: safeImage(p.image), status: 'active',
      createdAt: text(p.createdAt), updatedAt: text(p.updatedAt)
    }));
  }

  function getDeal(product) {
    const entry = DEALS[text(product && product.sku).toUpperCase()];
    const price = round2(Math.max(0, finite(product && product.price)));
    if (!entry) return null;
    const discount = entry.discountPercent ? price * entry.discountPercent / 100 : entry.amount;
    const dealPrice = round2(Math.max(0, price - discount));
    const savings = round2(price - dealPrice);
    return savings > 0 ? { price: dealPrice, originalPrice: price, savings, discountPercent: price ? savings / price * 100 : 0 } : null;
  }
  const dealPrice = (product) => { const deal = getDeal(product); return deal ? deal.price : round2(product.price); };
  const getDeals = (products = getProducts()) => products.filter((p) => p.status === 'active' && getDeal(p));

  /** Count a supplied customer catalog without reading or changing storage. */
  function counts(products, field) {
    const groups = new Map();
    products.forEach((p) => {
      const name = field === 'brand' ? (p.brand || deriveBrand(p)) : p.category;
      groups.set(name, (groups.get(name) || 0) + 1);
    });
    return Array.from(groups, ([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }
  const getCategories = (products = getProducts()) => counts(products, 'category');
  const getBrands = (products = getProducts()) => counts(products, 'brand');
  const selection = (value) => Array.from(new Set((Array.isArray(value) ? value : value ? [value] : []).filter((v) => typeof v === 'string' && v.trim()).map((v) => v.trim())));
  const bound = (value) => value === '' || value === null || value === undefined || !Number.isFinite(Number(value)) ? null : Math.max(0, round2(Number(value)));

  function normalizeQuery(value = {}) {
    return {
      category: selection(value.category), brand: selection(value.brand), min: bound(value.min), max: bound(value.max),
      instock: value.instock === true || value.instock === '1' || value.instock === 'true',
      sort: SORTS.includes(value.sort) ? value.sort : 'featured', q: text(value.q).trim(),
      page: Math.max(1, Math.floor(finite(value.page, 1))), pageSize: Math.max(1, Math.min(1000, Math.floor(finite(value.pageSize, 9)) || 9))
    };
  }

  /** Pure filtering: OR within a facet, AND between facets; prices include deals. */
  function filterProducts(products, query = {}) {
    const value = normalizeQuery(query);
    const needle = value.q.toLocaleLowerCase();
    const result = products.filter((p) => {
      const price = dealPrice(p);
      return (!value.category.length || value.category.includes(p.category)) &&
        (!value.brand.length || value.brand.includes(p.brand || deriveBrand(p))) &&
        (value.min === null || price >= value.min) && (value.max === null || price <= value.max) &&
        (!value.instock || p.stock > 0) && (!needle || [p.name, p.sku, p.category, p.brand || deriveBrand(p)].join(' ').toLocaleLowerCase().includes(needle));
    });
    const comparators = {
      'price-asc': (a, b) => dealPrice(a) - dealPrice(b), 'price-desc': (a, b) => dealPrice(b) - dealPrice(a),
      'name-asc': (a, b) => a.name.localeCompare(b.name),
      newest: (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
      discount: (a, b) => ((getDeal(b) || {}).discountPercent || 0) - ((getDeal(a) || {}).discountPercent || 0)
    };
    if (comparators[value.sort]) result.sort(comparators[value.sort]);
    const total = result.length;
    const totalPages = Math.max(1, Math.ceil(total / value.pageSize));
    const page = Math.min(value.page, totalPages);
    return { products: result.slice((page - 1) * value.pageSize, page * value.pageSize), total, totalPages, page, pageSize: value.pageSize };
  }

  /** Repeated category/brand parameters preserve multiple selections losslessly. */
  function parseQuery(search = window.location.search) {
    const params = new URLSearchParams(search);
    return normalizeQuery({ category: params.getAll('category'), brand: params.getAll('brand'), min: params.get('min'), max: params.get('max'), instock: params.get('instock'), sort: params.get('sort'), q: params.get('q'), page: params.get('page') || 1 });
  }
  function serializeQuery(query) {
    const value = normalizeQuery(query), params = new URLSearchParams();
    ['category', 'brand'].forEach((key) => value[key].forEach((item) => params.append(key, item)));
    ['min', 'max'].forEach((key) => { if (value[key] !== null) params.set(key, value[key]); });
    if (value.instock) params.set('instock', '1');
    if (value.sort !== 'featured') params.set('sort', value.sort);
    if (value.q) params.set('q', value.q);
    if (value.page > 1) params.set('page', value.page);
    return params.toString();
  }

  const money = (value) => getSettings().currencySymbol + round2(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const escapeHtml = (value) => String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  function normalizeCart(value) {
    const items = new Map();
    if (Array.isArray(value)) value.forEach((item) => {
      if (!isRecord(item) || !text(item.productId) || !Number.isSafeInteger(Number(item.quantity)) || Number(item.quantity) < 1) return;
      items.set(item.productId, Math.min(Number.MAX_SAFE_INTEGER, (items.get(item.productId) || 0) + Number(item.quantity)));
    });
    return Array.from(items, ([productId, quantity]) => ({ productId, quantity }));
  }
  const readCart = () => normalizeCart(safeRead(KEYS.cart, []));
  function writeCart(items) {
    const products = new Map(getProducts().map((p) => [p.id, p]));
    return safeWrite(KEYS.cart, normalizeCart(items).filter((item) => products.has(item.productId) && products.get(item.productId).stock > 0).map((item) => ({ productId: item.productId, quantity: Math.min(item.quantity, products.get(item.productId).stock) })));
  }
  function cartCount() {
    const products = new Map(getProducts().map((p) => [p.id, p]));
    return readCart().reduce((total, item) => total + (products.has(item.productId) ? Math.min(item.quantity, products.get(item.productId).stock) : 0), 0);
  }
  /** Add a requested quantity, including quantities already in the guest cart. */
  function addToCart(productId, quantity = 1) {
    const product = getProducts().find((p) => p.id === productId);
    if (!product) return { ok: false, message: 'No longer available.' };
    if (!product.stock) return { ok: false, message: 'Out of stock.' };
    const cart = readCart(), item = cart.find((entry) => entry.productId === productId);
    const requested = Math.max(1, Math.floor(finite(quantity, 1)));
    const desired = (item ? item.quantity : 0) + requested;
    if (item) item.quantity = Math.min(desired, product.stock);
    else cart.push({ productId, quantity: Math.min(requested, product.stock) });
    return writeCart(cart) ? { ok: true, message: desired > product.stock ? 'Only ' + product.stock + ' in stock' : product.name + ' added to cart.' } : { ok: false, message: 'Your cart could not be saved. Please allow browser storage and try again.' };
  }

  /** Re-read live products, remove unavailable lines and persist stock corrections. */
  function reconcileCart() {
    const products = new Map(getProducts().map((p) => [p.id, p]));
    const saved = readCart(), items = [], notices = [];
    saved.forEach((item) => {
      const product = products.get(item.productId);
      if (!product || !product.stock) {
        notices.push({ productId: item.productId, name: product ? product.name : item.productId, message: product ? 'Out of stock. Removed from your cart.' : 'No longer available. Removed from your cart.' });
        return;
      }
      const quantity = Math.min(item.quantity, product.stock);
      if (quantity !== item.quantity) notices.push({ productId: item.productId, name: product.name, message: 'Only ' + product.stock + ' in stock' });
      items.push({ productId: item.productId, quantity });
    });
    const changed = JSON.stringify(saved) !== JSON.stringify(items);
    const ok = !changed || writeCart(items);
    return { items, notices, ok };
  }

  /** One totals function for cart and future checkout/orders; all prices include deals. */
  function cartTotals(items = readCart()) {
    const products = new Map(getProducts().map((p) => [p.id, p]));
    const lines = normalizeCart(items).filter((item) => products.has(item.productId) && products.get(item.productId).stock > 0).map((item) => {
      const product = products.get(item.productId), quantity = Math.min(item.quantity, product.stock);
      const unitPrice = dealPrice(product);
      return { product, productId: product.id, quantity, unitPrice, lineTotal: round2(unitPrice * quantity) };
    });
    const subtotal = round2(lines.reduce((sum, line) => sum + line.lineTotal, 0));
    const rate = getSettings().taxRate, amount = round2(subtotal * rate / 100);
    return { lines, subtotal, tax: { rate, amount }, total: round2(subtotal + amount) };
  }

  const normalizeEmail = (value) => text(value).trim().toLowerCase();
  const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
  const validPassword = (value) => typeof value === 'string' && value.length >= 8 && /\d/.test(value);
  const getCustomers = () => {
    const value = safeRead(KEYS.customers, []);
    return Array.isArray(value) ? value.filter((c) => isRecord(c) && text(c.id) && text(c.email)) : [];
  };

  const getCustomer = () => {
    const session = getSession();
    return session ? getCustomers().find((customer) => customer.id === session.customerId) || null : null;
  };

  /** Validate editable fields against the latest record; delivery address is optional as a whole. */
  function validateProfile(value = {}, customer = getCustomer(), customers = getCustomers()) {
    const details = {}, errors = {};
    ['name', 'phone', 'email', 'city', 'area', 'street'].forEach((key) => { details[key] = text(value[key]).trim(); });
    details.email = normalizeEmail(details.email);
    if (!details.name) errors.name = 'Enter your full name.';
    if (!/^\+?[\d\s().-]+$/.test(details.phone) || details.phone.replace(/\D/g, '').length < 8) errors.phone = 'Enter a valid phone number with at least 8 digits.';
    if (!validEmail(details.email)) errors.email = 'Enter a valid email address.';
    else if (customers.some((entry) => entry.id !== (customer && customer.id) && normalizeEmail(entry.email) === details.email)) errors.email = 'An account with this email already exists.';
    const addressFields = ['city', 'area', 'street'];
    if (addressFields.some((key) => details[key])) addressFields.forEach((key) => { if (!details[key]) errors[key] = 'Enter your ' + key + ' or clear the entire delivery address.'; });
    const changingPassword = ['current', 'password', 'confirm'].some((key) => text(value[key]) !== '');
    if (changingPassword) {
      if (!customer || customer.provider !== 'email') errors.current = 'Password changes are unavailable for simulated social accounts.';
      else {
        if (!text(value.current) || value.current !== customer.passwordPlain) errors.current = 'Current password is incorrect.';
        if (!validPassword(value.password)) errors.password = 'Use at least 8 characters and one number.';
        if (!text(value.confirm) || value.confirm !== value.password) errors.confirm = 'Passwords must match.';
        details.password = value.password;
      }
    }
    return { ok: Object.keys(errors).length === 0, details, errors };
  }

  /** One atomic customer-array write. Session/remember updates happen only after it succeeds. */
  async function saveProfile(value) {
    if (profileProcessing) return { ok: false, message: 'Your profile is already being saved.' };
    profileProcessing = true;
    function save() {
      const customer = getCustomer(), customers = getCustomers();
      if (!customer) return { ok: false, signIn: true, message: 'Please sign in again to edit your profile.' };
      const validation = validateProfile(value, customer, customers);
      if (!validation.ok) return { ok: false, errors: validation.errors };
      const details = validation.details;
      const updated = Object.assign({}, customer, { name: details.name, phone: details.phone, email: details.email,
        address: { city: details.city, area: details.area, street: details.street } });
      // DEMO ONLY: real passwords must be hashed and verified on a server.
      if (details.password !== undefined) updated.passwordPlain = details.password;
      if (!safeWrite(KEYS.customers, customers.map((entry) => entry.id === customer.id ? updated : entry))) {
        return { ok: false, message: 'Your profile could not be saved. Nothing was changed. Please allow browser storage and try again.' };
      }
      const warnings = [];
      if (!startSession(updated)) warnings.push('Your profile was saved, but the session could not be updated. Please sign in again.');
      if (normalizeEmail(customer.email) !== updated.email && text(safeRead(KEYS.remember, '')).trim() && !rememberEmail(updated.email, true)) {
        warnings.push('Your remembered email could not be updated. Enter your new email next time you sign in.');
      }
      return { ok: true, warnings };
    }
    try {
      const locks = window.navigator && window.navigator.locks;
      return locks ? await locks.request('voltix_store_customer', save) : await Promise.resolve().then(save);
    } catch (error) { return { ok: false, message: 'Your profile could not be saved. Please try again.' }; }
    finally { profileProcessing = false; }
  }
  const getOrders = () => {
    const value = safeRead(KEYS.orders, []);
    return Array.isArray(value) ? value.filter((order) => isRecord(order) && text(order.id) && text(order.customerId)) : [];
  };

  /** Reject damaged snapshots without consulting current products or prices. */
  function validOrder(order) {
    // A damaged snapshot must produce an empty state, not a render exception.
    if (!order || !Array.isArray(order.items) || !order.items.length || !isRecord(order.tax) || !isRecord(order.payment)) return null;
    if (typeof order.date !== 'string' || !Number.isFinite(Date.parse(order.date)) || !['pending', 'confirmed', 'delivered', 'cancelled'].includes(order.status)) return null;
    if (![order.subtotal, order.tax.rate, order.tax.amount, order.total].every((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0)) return null;
    if (!order.items.every((item) => isRecord(item) && typeof item.name === 'string' && Number.isSafeInteger(item.quantity) && item.quantity > 0 && [item.unitPrice, item.lineTotal].every((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0))) return null;
    return true;
  }

  /** Ownership is checked before any customer page receives order data. */
  function getOwnOrder(id) {
    const session = getSession();
    if (!session) return null;
    const order = getOrders().find((entry) => entry.id === id && entry.customerId === session.customerId);
    return validOrder(order) ? order : null;
  }

  function getOwnOrders() {
    const session = getSession();
    return session ? getOrders().filter((order) => order.customerId === session.customerId && validOrder(order))
      .sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0) || b.id.localeCompare(a.id)) : [];
  }

  /** Re-read under the same lock used by checkout; only pending orders may change. */
  async function cancelOrder(id) {
    function save() {
      const order = getOwnOrder(id);
      if (!order) return { ok: false, message: 'Order not found.' };
      if (order.status !== 'pending') return { ok: false, message: 'Only pending orders can be cancelled.' };
      const updated = Object.assign({}, order, { status: 'cancelled', statusHistory:
        (Array.isArray(order.statusHistory) ? order.statusHistory : []).concat({ status: 'cancelled', date: new Date().toISOString() }) });
      if (!safeWrite(KEYS.orders, getOrders().map((entry) => entry.id === id && entry.customerId === order.customerId ? updated : entry))) {
        return { ok: false, message: 'Your order could not be cancelled. Please allow browser storage and try again.' };
      }
      window.dispatchEvent(new CustomEvent('voltix:order-cancelled', { detail: updated }));
      return { ok: true, order: updated, message: 'Order cancelled.' };
    }
    try {
      const locks = window.navigator && window.navigator.locks;
      return locks ? await locks.request('voltix_store_order', save) : save();
    } catch (error) { return { ok: false, message: 'Your order could not be cancelled. Please try again.' }; }
  }

  /** Generate equal-looking demo links for known and unknown addresses. */
  function resetToken() {
    const bytes = new Uint8Array(32);
    try { window.crypto.getRandomValues(bytes); }
    catch (error) { bytes.forEach((_, index) => { bytes[index] = Math.floor(Math.random() * 256); }); }
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  /** Resend invalidates the previous token. Unknown emails never receive a stored token. */
  function requestPasswordReset(value) {
    const email = normalizeEmail(value), token = resetToken(), expiresAt = Date.now() + RESET_TTL;
    const customers = getCustomers(), exists = customers.some((customer) => normalizeEmail(customer.email) === email);
    try { window.sessionStorage.removeItem(RESET_KEY); }
    catch (error) { return { message: RESET_SENT, token }; }
    if (exists) safeWrite(RESET_KEY, { email, token, expiresAt });
    // Identical response and navigation; the token is checked only on submission.
    return { message: RESET_SENT, token };
  }

  /** Simulated reset only; the session token is valid for fifteen minutes in this tab. */
  function resetPassword(token, password, confirm) {
    if (!validPassword(password)) return { ok: false, field: 'password', message: 'Use at least 8 characters and one number.' };
    if (password !== confirm) return { ok: false, field: 'confirm', message: 'Passwords must match.' };
    const saved = safeRead(RESET_KEY, null), customers = getCustomers();
    const customer = isRecord(saved) && customers.find((entry) => normalizeEmail(entry.email) === saved.email);
    if (!customer || typeof token !== 'string' || !token || saved.token !== token || !Number.isFinite(saved.expiresAt) ||
        saved.expiresAt <= Date.now() || saved.expiresAt > Date.now() + RESET_TTL) return { ok: false, invalid: true, message: RESET_INVALID };
    // DEMO ONLY: production passwords require server-side hashing and reset verification.
    const updated = customers.map((entry) => entry.id === customer.id ? Object.assign({}, entry, { passwordPlain: password }) : entry);
    if (!safeWrite(KEYS.customers, updated)) return { ok: false, message: 'Your password could not be saved. Please allow browser storage and try again.' };
    try { window.sessionStorage.removeItem(RESET_KEY); }
    catch (error) { safeWrite(RESET_KEY, null); }
    return { ok: true };
  }

  /** One validation result per field; payment contains only the demo method. */
  function validateCheckout(value = {}) {
    const details = {}, errors = {};
    ['name', 'phone', 'email', 'city', 'area', 'street'].forEach((key) => { details[key] = text(value[key]).trim(); });
    details.email = normalizeEmail(details.email);
    details.method = value.method;
    if (!details.name) errors.name = 'Enter your full name.';
    if (!details.phone) errors.phone = 'Enter your phone number.';
    else if (!/^\+?[\d\s().-]+$/.test(details.phone) || details.phone.replace(/\D/g, '').length < 8) errors.phone = 'Enter a valid phone number with at least 8 digits.';
    if (!validEmail(details.email)) errors.email = 'Enter a valid email address.';
    ['city', 'area', 'street'].forEach((key) => { if (!details[key]) errors[key] = 'Enter your ' + key + '.'; });
    if (!['cod', 'card'].includes(details.method)) errors.method = 'Choose a payment method.';
    return { details, errors, ok: Object.keys(errors).length === 0 };
  }

  /** Check the saved quantities without reconciling or changing the guest cart. */
  function checkoutState(knownNames = new Map()) {
    const raw = safeRead(KEYS.cart, []), items = readCart();
    if (!Array.isArray(raw) || raw.some((item) => !isRecord(item) || !text(item.productId) || !Number.isSafeInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
      return { ok: false, message: 'Your cart contains an invalid quantity. Please update it in your cart.' };
    }
    if (!items.length) return { ok: false, empty: true, message: 'Your cart is empty.' };
    const products = new Map(getProducts().map((product) => [product.id, product]));
    for (const item of items) {
      const product = products.get(item.productId), name = product ? product.name : knownNames.get(item.productId) || 'Product ' + item.productId;
      if (!product) return { ok: false, message: name + ' is no longer available. Please update your cart.' };
      if (item.quantity > product.stock) return { ok: false, message: name + ': only ' + product.stock + ' in stock. Please update your cart.' };
    }
    return { ok: true, totals: cartTotals(items) };
  }

  /** Persist the order before touching the counter or cart. Never changes stock. */
  function saveOrder(value, knownNames) {
    const session = getSession(), customer = getCustomer();
    if (!session || !customer) return { ok: false, message: 'Please sign in again before placing your order.', signIn: true };
    const validation = validateCheckout(value);
    if (!validation.ok) return { ok: false, errors: validation.errors };
    const state = checkoutState(knownNames);
    if (!state.ok) return state;
    const orders = getOrders(), storedCounter = safeRead(KEYS.counters, {});
    const counters = isRecord(storedCounter) ? storedCounter : {};
    const savedNumber = Number(counters.order);
    // Orders are authoritative if a previous counter write was unavailable.
    const number = Math.max(Number.isSafeInteger(savedNumber) && savedNumber >= 0 ? savedNumber : 0,
      orders.reduce((max, order) => Math.max(max, Number(/^ORD-(\d+)$/.exec(order.id)?.[1]) || 0), 0)) + 1;
    if (!Number.isSafeInteger(number)) return { ok: false, message: 'An order number could not be created. Please contact the store.' };
    const date = new Date().toISOString(), details = validation.details, totals = state.totals;
    const order = { id: 'ORD-' + String(number).padStart(6, '0'), date, customerId: customer.id,
      customerName: details.name, email: details.email, phone: details.phone,
      address: { city: details.city, area: details.area, street: details.street },
      items: totals.lines.map((line) => ({ productId: line.productId, name: line.product.name, sku: line.product.sku,
        unitPrice: line.unitPrice, quantity: line.quantity, lineTotal: line.lineTotal })),
      subtotal: totals.subtotal, tax: totals.tax, total: totals.total,
      payment: { method: details.method, status: details.method === 'card' ? 'paid_demo' : 'unpaid' },
      status: 'pending', statusHistory: [{ status: 'pending', date }] };
    if (!safeWrite(KEYS.orders, orders.concat(order))) return { ok: false, message: 'Your order could not be saved. Your cart is unchanged. Please allow browser storage and try again.' };
    safeWrite(KEYS.counters, Object.assign({}, counters, { order: number }));
    let cartCleared = safeWrite(KEYS.cart, []);
    // Removing a key can still succeed when storage is full and setItem fails.
    if (!cartCleared) {
      try {
        window.localStorage.removeItem(KEYS.cart); cartCleared = true;
        window.dispatchEvent(new CustomEvent('voltix:store-cart-changed'));
      } catch (error) { /* The order is already saved: never ask for a resubmit. */ }
    }
    window.dispatchEvent(new CustomEvent('voltix:order-placed', { detail: order }));
    return { ok: true, order, cartCleared };
  }

  /** Serialize cooperating tabs where Web Locks is available, including file://. */
  async function placeOrder(value, knownNames) {
    if (orderProcessing) return { ok: false, message: 'Your order is already being processed.' };
    orderProcessing = true;
    try {
      const locks = window.navigator && window.navigator.locks;
      return locks ? await locks.request('voltix_store_order', () => saveOrder(value, knownNames)) : saveOrder(value, knownNames);
    } catch (error) {
      return { ok: false, message: 'Your order could not be processed. Please try again.' };
    } finally { orderProcessing = false; }
  }

  /** Accept only a storefront filename and an optional, well-formed query. */
  function safeNext(value) {
    if (typeof value !== 'string' || /[\u0000-\u0020\\#]/.test(value)) return 'index.html';
    const match = /^([a-z-]+)\.html(?:\?([^#]*))?$/.exec(value);
    if (!match || !NEXT_PAGES.includes(match[1])) return 'index.html';
    try {
      if (/[\u0000-\u001f\u007f\\]/.test(decodeURIComponent(match[2] || ''))) return 'index.html';
    } catch (error) { return 'index.html'; }
    return match[1] + '.html' + (match[2] ? '?' + new URLSearchParams(match[2]).toString() : '');
  }
  const checkoutLink = () => getSession() ? 'checkout.html' : 'login.html?next=checkout.html';

  function rememberEmail(email, remember) {
    if (remember) return safeWrite(KEYS.remember, normalizeEmail(email));
    try { window.localStorage.removeItem(KEYS.remember); return true; } catch (error) { return false; }
  }
  function startSession(customer) {
    return safeWrite(KEYS.session, { customerId: customer.id, name: customer.name, email: customer.email });
  }

  /** Demo identity only: a real application must authenticate on a server. */
  function registerCustomer(value) {
    const email = normalizeEmail(value.email), name = text(value.name).trim(), phone = text(value.phone).trim();
    if (!name) return { ok: false, field: 'name', message: 'Enter your full name.' };
    if (!validEmail(email)) return { ok: false, field: 'email', message: 'Enter a valid email address.' };
    if (!phone) return { ok: false, field: 'phone', message: 'Enter your phone number.' };
    if (!validPassword(value.password)) return { ok: false, field: 'password', message: 'Use at least 8 characters and one number.' };
    if (value.password !== value.confirm) return { ok: false, field: 'confirm', message: 'Passwords must match.' };
    const customers = getCustomers();
    if (customers.some((c) => normalizeEmail(c.email) === email)) return { ok: false, field: 'email', general: true, message: 'An account with this email already exists.' };
    const number = customers.reduce((max, c) => Math.max(max, Number(/^C-(\d+)$/.exec(c.id)?.[1]) || 0), 0) + 1;
    const customer = { id: 'C-' + String(number).padStart(4, '0'), name, email, phone,
      passwordPlain: value.password, // DEMO ONLY: plaintext passwords must never be used in production.
      address: { city: '', area: '', street: '' }, createdAt: new Date().toISOString(), provider: 'email' };
    if (!safeWrite(KEYS.customers, customers.concat(customer))) return { ok: false, message: 'Your account could not be saved. Please allow browser storage and try again.' };
    return startSession(customer) ? { ok: true } : { ok: false, message: 'Account created. Please allow session storage, then sign in.' };
  }

  function signIn(email, password) {
    const customer = getCustomers().find((c) => normalizeEmail(c.email) === normalizeEmail(email) && c.provider === 'email' && typeof password === 'string' && password.length > 0 && c.passwordPlain === password);
    return customer && startSession(customer) ? { ok: true } : { ok: false, message: LOGIN_ERROR };
  }

  function socialSignIn(provider) {
    if (!['google', 'apple'].includes(provider)) return { ok: false, message: LOGIN_ERROR };
    const customers = getCustomers();
    let customer = customers.find((c) => c.provider === provider);
    if (!customer) {
      const number = customers.reduce((max, c) => Math.max(max, Number(/^C-(\d+)$/.exec(c.id)?.[1]) || 0), 0) + 1;
      let email = provider + '.demo@voltix.example';
      while (customers.some((c) => normalizeEmail(c.email) === email)) email = 'demo.' + number + '.' + email;
      customer = { id: 'C-' + String(number).padStart(4, '0'), name: (provider === 'google' ? 'Google' : 'Apple') + ' Demo', email, phone: '',
        passwordPlain: '', // DEMO ONLY: simulated social identity; no real SSO token or password.
        address: { city: '', area: '', street: '' }, createdAt: new Date().toISOString(), provider };
      if (!safeWrite(KEYS.customers, customers.concat(customer))) return { ok: false, message: 'Demo account could not be saved. Please allow browser storage.' };
    }
    return startSession(customer) ? { ok: true, message: 'Demo only: social sign-in is simulated' } : { ok: false, message: LOGIN_ERROR };
  }
  function getSession() {
    const value = safeRead(KEYS.session, null);
    return isRecord(value) && text(value.customerId) && text(value.name) ? { customerId: value.customerId, name: value.name, email: text(value.email) } : null;
  }
  function signOut() {
    try { window.sessionStorage.removeItem(KEYS.session); window.dispatchEvent(new CustomEvent('voltix:store-session-changed')); return true; } catch (error) { return false; }
  }

  window.VoltixStore = Object.freeze({ KEYS, DEALS, safeRead, safeWrite, getSettings, getProducts, deriveBrand, safeImage, getDeal, dealPrice, getDeals, getCategories, getBrands, filterProducts, normalizeQuery, parseQuery, serializeQuery, round2, money, escapeHtml, readCart, writeCart, cartCount, addToCart, reconcileCart, cartTotals, getSession, getCustomer, validateProfile, saveProfile, getOwnOrder, getOwnOrders, cancelOrder, requestPasswordReset, resetPassword, validateCheckout, checkoutState, placeOrder, signOut, normalizeEmail, validEmail, validPassword, safeNext, checkoutLink, rememberEmail, registerCustomer, signIn, socialSignIn });
})(window);
