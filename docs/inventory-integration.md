# Voltix inventory integration

Member 2 owns `js/inventory-store.js`. Load it before POS, dashboard, reports, or returns scripts. It exposes one shared browser-local data contract under the `VoltixInventory` namespace.

## Public functions

- `getProducts()` / `getProductById(id)` — read products. Stock is always the `stock` field.
- `addProduct(data)` / `updateProduct(id, data)` / `archiveProduct(id)` / `deleteProduct(id)` — product management; return `{ ok, error, data }`.
- `getSuppliers()` / `addSupplier(data)` / `updateSupplier(id, data)` / `deleteSupplier(id)` — supplier management.
- `adjustStock(productId, change, reason, type, reference)` — the single stock mutation primitive.
- `reduceStock(productId, qty, reference)` — call at POS checkout; writes a `sale` movement.
- `increaseStock(productId, qty, reference)` — call for returns or deliveries; writes a `receive` movement by default.
- `getLowStockProducts()` / `getStockStatus(product)` — dashboard and alerts.
- `getMovements(filter)` — movement history, with optional `productId`, `type`, or `user` filters.
- `formatCurrency(value)`, `generateId(prefix)`, `seedDataIfEmpty()` — shared utilities.

The store dispatches `voltix:data-changed` after writes and listens for cross-tab `storage` updates. Consumers should re-render on that event.

## Example POS checkout

```js
const result = VoltixInventory.reduceStock(item.productId, item.qty, sale.id);
if (!result.ok) {
  // Stop checkout and show result.error.
}
```

The store uses `voltix_products`, `voltix_suppliers`, `voltix_sales`, `voltix_users`, `voltix_session`, and `voltix_stock_movements` in localStorage. It seeds only empty keys.

## Dashboard and reports helpers

```js
const summary = VoltixInventory.getInventorySummary();
const categories = VoltixInventory.getStockByCategory();
const supplierCounts = VoltixInventory.getSupplierProductCounts();
```

`getInventorySummary()` returns `totalProducts`, `totalUnits`, `lowStockCount`, `outOfStockCount`, and `inventoryValue`. `getStockByCategory()` returns `{ category, products, units, value }` rows. `getSupplierProductCounts()` returns a supplier-id-to-product-count object.

## Delivery and returns

```js
const delivery = VoltixInventory.receiveDelivery([
  { productId: 'P-1001', quantity: 4 },
  { productId: 'P-1002', quantity: 2 }
], 'S-001', 'INV-1042');

const returned = VoltixInventory.increaseStock('P-1001', 1, 'RET-1009');
```

`receiveDelivery()` validates all lines before applying them and creates one `receive` movement per line. `increaseStock()` creates a `return` movement and rejects a duplicate return reference.

## Role test snippets

For local demos, set a simulated session in DevTools before refreshing a page:

```js
localStorage.setItem('voltix_session', JSON.stringify({ id: 'U-1', name: 'Admin Demo', role: 'System Admin', status: 'active' }));
localStorage.setItem('voltix_session', JSON.stringify({ id: 'U-2', name: 'Manager Demo', role: 'Store Manager', status: 'active' }));
localStorage.setItem('voltix_session', JSON.stringify({ id: 'U-3', name: 'Inventory Demo', role: 'Inventory Manager', status: 'active' }));
localStorage.setItem('voltix_session', JSON.stringify({ id: 'U-4', name: 'Cashier Demo', role: 'Cashier', status: 'active' }));
```

Member 1 can read `getLowStockProducts()` and `getInventorySummary()` for Dashboard cards. Member 3 should call `reduceStock(productId, qty, saleId)` after a successful checkout. Returns should call `increaseStock(productId, qty, returnId)`. Member 4 can use `getMovements()`, `getStockByCategory()`, and `getSupplierProductCounts()` for reports.
