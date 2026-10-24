# BUG-01 Dashboard diagnosis

## Findings

The two placeholders were hardcoded in `pages/dashboard.html`: the sales panel footer contained `Awaiting sales data`, and the inventory panel contained `Awaiting inventory data`. `js/dashboard.js` never read storage, never called `VoltixInventory`, never rendered sales or inventory rows, and never replaced either static element. Its `statistics` array deliberately supplied those strings as notes and `renderStatistics()` only created cards with an em dash value.

The Dashboard page loaded `app.js` and `dashboard.js` only. It did not load `inventory-store.js`, so it could not access `window.VoltixInventory`. The page is parsed before deferred scripts run, so DOM readiness was not the cause; the dashboard script ran against the complete DOM but only rendered its static empty state. It also had no data-change, storage, or visibility listeners.

## Storage comparison

The canonical inventory keys are `voltix_products`, `voltix_suppliers`, `voltix_sales`, and `voltix_stock_movements`. `js/inventory-store.js` writes products with `stock`, suppliers, and movement rows. `js/pos-store.js` writes canonical sales to `voltix_sales` and mirrors them to the legacy reports key `voltix.sales` when possible. Sales contain `date`, `cashierName`, `total`, and item snapshots; the Dashboard now tolerates `createdAt`, `cashier`, `qty`, `quantity`, `id`, and computed line totals as well.

| Suspected cause | Confirmed? | Evidence |
| --- | --- | --- |
| Key-name mismatch between Dashboard and writers | Yes, functionally | The Dashboard had no reader. The canonical keys are now read directly; the legacy sales key is only a safe fallback. |
| Missing or late `inventory-store.js` | Yes | It was absent from `pages/dashboard.html`; it is now loaded before `dashboard.js`. |
| Wrong fields (`quantity`, `createdAt`, missing `total`) | Partly | The old Dashboard did not read fields at all. The new reader accepts both canonical and legacy field names and computes totals. |
| No change listeners | Yes | No listeners existed. The new Dashboard listens for `voltix:data-changed`, `storage`, and visible-tab `visibilitychange`. |
| Seeding only runs on other pages | Yes | `seedDataIfEmpty()` ran only when `inventory-store.js` was loaded. Dashboard now loads the store and calls it safely. |
| Wrapper or different prefix | No for canonical data | The store writes plain arrays. The reports module also has a legacy dot-prefixed mirror, which is handled only as a sales fallback. |
| Hardcoded or never-called render | Yes | The static IIFE rendered placeholder cards once and never had a data render path. |
| Different session or role shape | No | `app.js` and the store both use `sessionStorage['voltix.session']` with `{ id, name, email, role }`; the new Dashboard uses the validated `VoltixApp.session`. |
| POS/Sales does not save under the Dashboard key | No | `pos-store.js` saves finalized sales under `voltix_sales`; the old Dashboard simply never read them. |

## Console-level trace

On Dashboard load, `app.js` validates the session and shows `#app-shell`. The old `dashboard.js` reads the session, creates a `statistics` array whose notes are the literal `Awaiting ... data` strings, and calls `renderStatistics()`, `renderTransactions()`, and `renderQuickActions()`. `renderStatistics()` creates each card with `value.textContent = "—"`; `renderTransactions()` creates the empty-state copy but never reads a sale array; and the HTML footer and stock block remain untouched. Therefore the placeholders cannot be replaced: there is no storage read, no inventory store reference, no sales render, and no listener that could rerun a real render.

The fix loads the shared store first, seeds only empty inventory keys, reads canonical sales, renders real dashboard totals/lists/category data, escapes dynamic text, hides cost/value for staff, and updates from shared data events.
