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
