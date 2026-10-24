(function (window) {
  'use strict';

  const KEYS = Object.freeze({ products: 'voltix_products', settings: 'voltix.settings', cart: 'voltix_store_cart', session: 'voltix_store_session' });
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

  /** Read only the explicitly allowed keys; unavailable/corrupt storage is harmless. */
  function safeRead(key, fallback) {
    if (!Object.values(KEYS).includes(key)) return fallback;
    try {
      const storage = key === KEYS.session ? window.sessionStorage : window.localStorage;
      const raw = storage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) { return fallback; }
  }

  /** Only the storefront cart can be written by this browsing-stage data layer. */
  function safeWrite(key, value) {
    if (key !== KEYS.cart) return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('voltix:store-cart-changed'));
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
  function addToCart(productId) {
    const product = getProducts().find((p) => p.id === productId);
    if (!product) return { ok: false, message: 'No longer available.' };
    if (!product.stock) return { ok: false, message: 'Out of stock.' };
    const cart = readCart(), item = cart.find((entry) => entry.productId === productId);
    if (item && item.quantity >= product.stock) return { ok: false, message: 'Only ' + product.stock + ' in stock. Your cart already has the available quantity.' };
    if (item) item.quantity += 1;
    else cart.push({ productId, quantity: 1 });
    return writeCart(cart) ? { ok: true, message: product.name + ' added to cart.' } : { ok: false, message: 'Your cart could not be saved. Please allow browser storage and try again.' };
  }
  function getSession() {
    const value = safeRead(KEYS.session, null);
    return isRecord(value) && text(value.customerId) && text(value.name) ? { customerId: value.customerId, name: value.name, email: text(value.email) } : null;
  }
  function signOut() {
    try { window.sessionStorage.removeItem(KEYS.session); return true; } catch (error) { return false; }
  }

  window.VoltixStore = Object.freeze({ KEYS, DEALS, safeRead, safeWrite, getSettings, getProducts, deriveBrand, safeImage, getDeal, dealPrice, getDeals, getCategories, getBrands, filterProducts, normalizeQuery, parseQuery, serializeQuery, round2, money, escapeHtml, readCart, writeCart, cartCount, addToCart, getSession, signOut });
})(window);
