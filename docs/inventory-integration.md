# Voltix inventory integration

`js/inventory-store.js` owns the shared browser-local inventory contract. Load it before inventory consumers, including the Dashboard. It exposes `window.VoltixInventory` and dispatches `voltix:data-changed` after writes.

## Public functions

- `getProducts()` / `getProductById(id)` read products. Stock is always the `stock` field and SKUs are normalized as trimmed, single-spaced uppercase text.
- `addProduct(data)`, `updateProduct(id, data)`, `archiveProduct(id)`, and `deleteProduct(id)` return `{ ok, error, data }`.
- `getSuppliers()`, `addSupplier(data)`, `updateSupplier(id, data)`, and `deleteSupplier(id)` manage suppliers.
- `adjustStock(productId, change, reason, type, reference)` is the inventory stock mutation primitive.
- `reduceStock(productId, qty, reference)` writes a `sale` movement; `increaseStock(productId, qty, reference)` writes a `return` movement and rejects duplicate return references.
- `receiveDelivery(lines, supplierId, reference)` validates all lines before applying a multi-line delivery.
- `getLowStockProducts()`, `getStockStatus(product)`, `getInventorySummary()`, `getStockByCategory()`, and `getSupplierProductCounts()` support Dashboard and reports.
- `getMovements(filter)` supports `productId`, `type`, and `user` filters. `getSkuConflicts()` reports existing duplicate records and `validateSku(sku, id)` validates a normalized SKU before saving.

## Storage keys and stored shapes

Inventory uses `localStorage` keys `voltix_products`, `voltix_suppliers`, `voltix_sales`, `voltix_users`, and `voltix_stock_movements`. The active session is in `sessionStorage` under `voltix.session`.

Products use `{ id, sku, name, category, price, cost, stock, lowStockThreshold, supplier, description, status, createdAt, updatedAt }`. Suppliers use `{ id, name, contactPerson, phone, email, address, status, createdAt }`. Sessions use `{ id, name, email, role }`, with `role` equal to `admin` or `staff`.

Sales use `{ id, date, cashierId, cashierName, items, subtotal, discount, tax, total, payment, status }`; each item keeps a `productId`, `name`, `sku`, `unitPrice`, `quantity`, and `lineTotal` snapshot. Stock movements use `{ id, productId, productName, sku, type, change, stockBefore, stockAfter, reason, reference, user, date }`. Types are `initial`, `adjust`, `receive`, `sale`, `return`, and `delete`. A delete row records the final known stock before and after deletion while earlier rows remain intact.

SKU uniqueness is enforced in the store across active and archived products. Comparison normalizes trim, inner whitespace, and case; the normalized value is stored for new and edited products. Existing conflicts are shown on the Products page and are never silently renamed or deleted. Seeding and every public product-list write use the same duplicate guard.

## Dashboard contract

`getInventorySummary()` returns `totalProducts`, `totalUnits`, `lowStockCount`, `outOfStockCount`, and `inventoryValue` for active products. `getStockByCategory()` returns `{ category, products, units, value }` rows. The Dashboard reads these helpers and the canonical `voltix_sales` array, tolerating legacy sale fields `qty`/`quantity`, `productId`/`id`, `date`/`createdAt`, and missing totals that can be computed from line items. It calls `seedDataIfEmpty()` safely and re-renders on `voltix:data-changed`, `storage`, and visible-tab `visibilitychange` events. Staff dashboards omit inventory value and other cost data.

## Delivery, POS, and returns

```js
const delivery = VoltixInventory.receiveDelivery([
  { productId: 'P-1001', quantity: 4 },
  { productId: 'P-1002', quantity: 2 }
], 'S-001', 'INV-1042');

const returned = VoltixInventory.increaseStock('P-1001', 1, 'RET-1009');
```

The POS store also writes the same movement snapshot fields when it records `sale` and `return` movements. Old movement rows are backfilled with the current product name and SKU when possible. If a product has already been deleted, history renders the saved snapshot or `Deleted product (ID)` with a Deleted badge rather than a bare ID. Product filters and CSV export use those snapshots.

For local demos, set a validated session in DevTools before refreshing:

```js
sessionStorage.setItem('voltix.session', JSON.stringify({ id: 'user-admin', name: 'Admin Demo', email: 'admin@voltix.test', role: 'admin' }));
sessionStorage.setItem('voltix.session', JSON.stringify({ id: 'user-staff', name: 'Cashier Demo', email: 'staff@voltix.test', role: 'staff' }));
```
