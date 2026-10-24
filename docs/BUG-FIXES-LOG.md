# Voltix bug-fix log

## BUG-01 — Dashboard placeholders

- Cause: `dashboard.html` omitted `inventory-store.js`, and `dashboard.js` was only a static placeholder renderer with no storage readers or update listeners.
- Fix: Load the shared store before the Dashboard script, call safe seeding, read inventory helpers and canonical sales, render statistics/recent sales/low stock/category totals, escape user text, respect staff visibility, and re-render on data, storage, and visible-tab events.
- Files changed: `pages/dashboard.html`, `js/dashboard.js`, `css/dashboard.css`, `docs/BUG-01-dashboard-diagnosis.md`.
- Verification: Code reading and `node --check` syntax checks; browser execution was not available in this environment. Browser steps are in the final report.

## BUG-02 — Duplicate SKUs

- Cause: Store validation compared lowercased strings without collapsing whitespace, did not report the conflicting product, and the Products form only showed a toast. Existing duplicate records were not surfaced.
- Fix: Normalize SKUs in the store, validate against active and archived products for add/update/public list writes, return the required conflict message, add live blur validation and inline ARIA error handling, block double submit, and show a non-blocking conflict repair banner with Edit buttons.
- Files changed: `js/inventory-store.js`, `js/products.js`, `pages/products.html`, `css/products-inventory.css`, `tests/inventory.test.html`.
- Verification: Browser test cases were added for case/space variants, edit conflicts, archived conflicts, console calls, and the form contract. Syntax was checked; browser execution was not available here.

## ISSUE-03 — Deleted product movement names

- Cause: Movement rows stored only `productId`; Inventory history looked up the current product and fell back directly to that ID after deletion.
- Fix: Store `productName` and `sku` snapshots for every movement type, backfill old rows when the product remains, log a final `delete` row, render deleted labels/badges, include deleted products in filters, and use snapshots in CSV, sales detail, receipts, and POS movement creation.
- Files changed: `js/inventory-store.js`, `js/pos-store.js`, `js/inventory.js`, `js/sales.js`, `js/receipt.js`, `tests/inventory.test.html`, `docs/inventory-integration.md`, `docs/POS_SPEC.md`.
- Verification: Browser test cases were added for backfill, deleted-product fallback, retained snapshots, and delete rows. Syntax was checked; browser execution was not available here.
