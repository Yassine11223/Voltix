(function (window) {
  'use strict';

  const KEY = 'voltix_supplier_requests';
  const TYPES = { supplier: 'Become a Supplier', products: 'Offer Products' };
  const normalize = (value) => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  function normalizePhone(value) {
    let digits = normalize(value).replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    // Recognize Egyptian mobile numbers in local and international formats.
    if (/^01\d{9}$/.test(digits)) digits = `20${digits.slice(1)}`;
    return /^\d{7,15}$/.test(digits) ? digits : '';
  }
  const text = (value) => String(value ?? '').trim();
  const fail = (error) => ({ ok: false, error });
  const canReview = () => window.VoltixInventory?.can('supplier:write') === true;

  function read() {
    // Never overwrite malformed or inaccessible storage with an empty list.
    const raw = localStorage.getItem(KEY);
    const requests = raw === null ? [] : JSON.parse(raw);
    if (!Array.isArray(requests) || requests.some((request) => !request || typeof request !== 'object' || !request.id)) {
      throw new Error('Invalid request storage');
    }
    return requests;
  }

  function save(requests) {
    localStorage.setItem(KEY, JSON.stringify(requests));
    window.dispatchEvent(new CustomEvent('voltix:data-changed', { detail: { key: KEY } }));
  }

  function today() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function validate(data) {
    if (!Object.hasOwn(TYPES, data.type)) return 'Choose a request type.';
    const fields = [['companyName', 'Company name', 120], ['contactPerson', 'Contact person', 100], ['email', 'Email', 254], ['phone', 'Phone', 30], ['address', 'Address', 500]];
    if (data.type === 'products') fields.push(['productName', 'Product name', 160], ['category', 'Category', 80]);
    for (const [key, label, limit] of fields) {
      if (!text(data[key])) return `${label} is required.`;
      if (text(data[key]).length > limit) return `${label} must be ${limit} characters or fewer.`;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(data.email))) return 'Enter a valid email address.';
    if (!/^\+?[\d\s()-]+$/.test(text(data.phone)) || !/^\d{7,15}$/.test(text(data.phone).replace(/\D/g, ''))) return 'Enter a valid phone number with 7 to 15 digits.';
    if (text(data.notes).length > 2000) return 'Additional notes must be 2000 characters or fewer.';
    if (data.type === 'products') {
      if (!Number.isSafeInteger(Number(data.quantity)) || Number(data.quantity) < 1 || Number(data.quantity) > 1000000) return 'Quantity must be a whole number between 1 and 1,000,000.';
      const price = text(data.unitPrice);
      if (!/^\d+(\.\d{1,2})?$/.test(price) || Number(price) <= 0 || Number(price) > 1000000000) return 'Unit price must be between EGP 0.01 and 1,000,000,000, with up to two decimal places.';
      const delivery = text(data.expectedDeliveryDate);
      const date = new Date(`${delivery}T12:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(delivery) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== delivery || delivery < today()) return 'Choose a valid expected delivery date of today or later.';
    }
    return '';
  }

  // Public submissions only append Pending requests. They cannot write suppliers or stock.
  function submit(data = {}) {
    const error = validate(data);
    if (error) return fail(error);
    try {
      const requests = read();
      let id;
      do {
        id = `SR-${window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
      } while (requests.some((request) => request.id === id));
      const request = {
        id, type: data.type, companyName: text(data.companyName), contactPerson: text(data.contactPerson),
        email: text(data.email), phone: text(data.phone), address: text(data.address), notes: text(data.notes),
        productName: data.type === 'products' ? text(data.productName) : '',
        category: data.type === 'products' ? text(data.category) : '',
        quantity: data.type === 'products' ? Number(data.quantity) : null,
        unitPrice: data.type === 'products' ? Number(data.unitPrice) : null,
        expectedDeliveryDate: data.type === 'products' ? text(data.expectedDeliveryDate) : '',
        status: 'Pending', submittedAt: new Date().toISOString(), supplierId: '', reviewedAt: '', reviewedBy: ''
      };
      save([...requests, request]);
      return { ok: true, data: request };
    } catch {
      return fail('Your request could not be saved. Check browser storage and try again.');
    }
  }

  function list() {
    if (!canReview()) return fail('Only an admin can view supplier requests.');
    try {
      return { ok: true, data: read().sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt))) };
    } catch {
      return fail('Supplier requests could not be loaded. Check browser storage; existing data has been preserved.');
    }
  }

  function matchingSuppliers(request) {
    if (!canReview()) return [];
    const company = normalize(request.companyName);
    const email = normalize(request.email);
    const phone = normalizePhone(request.phone);
    // A shared contact-person name or address alone cannot identify a company.
    return window.VoltixInventory.getSuppliers().filter((supplier) =>
      (company && normalize(supplier.name) === company) ||
      (email && normalize(supplier.email) === email) ||
      (phone && normalizePhone(supplier.phone) === phone)
    );
  }

  function review(id, status, supplierId = '') {
    if (!canReview()) return fail('Only an admin can review supplier requests.');
    if (!['Approved', 'Rejected'].includes(status)) return fail('Choose Approved or Rejected.');
    let createdSupplier = false;
    try {
      const requests = read();
      const request = requests.find((item) => item.id === id);
      if (!request) return fail('Request not found.');
      if (request.status !== 'Pending') return fail('This request has already been reviewed.');

      let linkedId = '';
      if (status === 'Approved') {
        const inventory = window.VoltixInventory;
        const matches = matchingSuppliers(request);
        if (supplierId) {
          if (!inventory.getSuppliers().some((supplier) => supplier.id === supplierId)) return fail('The selected supplier no longer exists.');
          linkedId = supplierId;
        } else if (matches.length === 1) {
          linkedId = matches[0].id;
        } else if (matches.length > 1) {
          return fail('Multiple suppliers match this request. Select the existing supplier to link.');
        } else {
          const result = inventory.addSupplier({ name: request.companyName, contactPerson: request.contactPerson, email: request.email, phone: request.phone, address: request.address });
          if (!result.ok) return fail(`The supplier could not be created. ${result.error} The request is still Pending.`);
          createdSupplier = true;
          linkedId = result.data.id;
        }
      }
      const updated = { ...request, status, supplierId: linkedId, reviewedAt: new Date().toISOString(), reviewedBy: window.VoltixInventory.getCurrentUser().id };
      // No product, movement, or receipt APIs are called by review.
      save(requests.map((item) => item.id === id ? updated : item));
      return { ok: true, data: updated, createdSupplier };
    } catch {
      return fail(createdSupplier
        ? 'The supplier was saved, but the request status could not be saved. Try again to link that supplier and finish approval.'
        : 'The request status could not be saved. Check browser storage and try again.');
    }
  }

  window.VoltixSupplierRequests = Object.freeze({ KEY, TYPES: Object.freeze(TYPES), submit, list, review, matchingSuppliers, today });
  window.addEventListener('storage', (event) => {
    if (event.key === KEY || event.key === null) window.dispatchEvent(new CustomEvent('voltix:data-changed', { detail: { key: KEY } }));
  });
}(window));
