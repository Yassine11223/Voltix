# VOLTIX: Member 3 Spec (POS, Sales, Returns)

Source of truth for Member 3's modules. Every Codex prompt refers to this file.
Based on the real state of `main` (commit 0a97987). Items marked [OPEN] may change after teammates agree.

## 1. Scope
Voltix is an in-store electronics POS and inventory system, NOT an online shop.
Member 3 owns: POS, Sales (history + receipts), Returns.
Core workflow: Add Product -> Update Inventory -> POS Sale -> Deduct Stock -> Record Sale -> Update Dashboard.
Only 2 roles: `admin` and `staff` (cashier).

## 2. Hard rules
- Only HTML5, CSS3, Vanilla JS (ES6+). No frameworks, no build tools, no backend. Plain `<script>` tags, no ES modules. Must work when opened as local files.
- Work only on branch `feature/pos-sales`. NEVER run `git push`. Commit locally only.
- Do NOT edit files owned by others: index.html, pages/dashboard|products|inventory|suppliers|reports|users|settings.html, js/app.js, js/auth.js, js/dashboard.js, js/inventory*.js, js/pi-ui.js, js/products.js, js/suppliers.js, js/reports.js, js/settings.js, js/users.js, css/style.css, css/components.css, css/dashboard.css, css/products-inventory.css, docs other than this file. If a change is needed there, list it under "Requests for teammates" in the final report.
- Escape all user-provided text before inserting into HTML. No console errors. No dead buttons.

## 3. Repo reality (verified in audit)
Files I own (all currently empty): pages/pos.html, pages/sales.html, pages/returns.html, css/pos.css, css/sales.css, css/returns.css, js/pos.js, js/sales.js, js/returns.js.
Files I add: js/pos-store.js (shared data layer for my 3 pages), js/receipt.js (receipt rendering + print).
Pages stay under `pages/`. Navigation uses sibling filenames; logout goes to ../index.html.

Shell: copy the sidebar/header markup from pages/dashboard.html exactly. `js/app.js` fills `#primary-navigation` and sets `aria-current="page"` from the filename. Load `../js/app.js` with `defer` BEFORE the page controller. app.js returns early without `#app-shell`, so keep that structure.
Staff nav (set by app.js) has: dashboard, pos, products, inventory, sales. It does NOT include Returns. Staff reach Returns through the "Process return" button in the Sales detail modal. [OPEN: ask Member 1 to add Returns to staff nav.]

Session: `window.VoltixApp.session` = { id, name, email, role } where role is "admin" or "staff". Fallback: JSON in `sessionStorage["voltix.session"]`. If no valid session, redirect to `../index.html`. NEVER use localStorage `voltix_session` (that is the inventory module's separate dev identity).

Products: localStorage `voltix_products`. Real fields: id ("P-1001"), sku, name, category, price, cost, stock, lowStockThreshold, supplier, description, status ("active" | "archived"), createdAt, updatedAt.
- NOT FOUND in the schema: brand, barcode, image, quantity, supplierId. Do not assume them. Search by name, sku, category, id (and `barcode` only if a product happens to have it).
- Only `status === "active"` products are sellable. Archived are hidden from POS.
- `VoltixInventory.getProducts()` returns normalized products (drops unknown fields). Reading through it is fine. For WRITING stock, operate on the raw array from localStorage and change only `stock` and `updatedAt`, so no fields are lost.
- Inspect js/inventory-store.js before using any of its functions. Known problems: reduceStock/increaseStock ignore save failures, no multi-line batch, and increaseStock rejects reusing one return reference across several products. Therefore checkout and return restock are done atomically by js/pos-store.js (section 7), not through VoltixInventory write APIs.

Stock movements: localStorage `voltix_stock_movements`, record shape { id, productId, productName, sku, type, change, stockBefore, stockAfter, reason, reference, user, date }. Every writer stores the product name and SKU snapshot; old rows are backfilled when possible. Types used by inventory/POS are initial, adjust, receive, sale, return, and delete. I append type "sale" and "return" records so the Inventory page's movement history stays correct. Movement ids must be unique (example: "MV-S-000001-1"). Check js/inventory.js for assumptions about id format before choosing.

Settings: localStorage `voltix.settings` (dot, owned by Member 4), READ ONLY, may be missing. Defaults: storeName "Voltix Electronics", storePhone "", storeAddress "", storeTaxId "", currencySymbol "$", taxRate 14 (PERCENT, not 0.14), receiptHeader "Thank you for choosing Voltix Electronics!", receiptFooter "", autoPrint false, preventNegativeStock true, autoDeductStock true. Read it with my own safe loader. Do NOT load js/settings.js (it is a page controller with DOM dependencies).
- Honor `preventNegativeStock` (block selling more than stock) and `autoDeductStock` (if false, skip stock deduction at checkout).

## 4. Design (reuse the shared shell, do not invent a new theme)
Reference: the Voltix login screenshot (dark navy + blue, white rounded cards, bold titles, small uppercase eyebrow with blue dot).
Use the existing tokens from css/style.css: navy #0b1833, blue #2456e8, blue hover #1945cb, text #18253d, muted #59677d, bg #f5f7fb, border #e2e7f0, panel radius 14px, font "Segoe UI", system-ui. Reuse classes: .app-page, .app-sidebar, .nav-link, .workspace, .app-header, .button, .button-primary, .panel, .panel-heading, .icon, .sr-only.
Link in each page: ../css/style.css, ../css/components.css, then my own css. Do NOT link css/products-inventory.css and do NOT use Google Fonts.
My own classes are prefixed (`pos-`, `sales-`, `returns-`) so nothing leaks into shared styles. Define only what is missing: product cards, cart panel, quantity stepper, badges (green in stock, amber low stock/partially returned, red out of stock/fully returned), segmented control, modal, toast, stepper, receipt.
Inputs about 48px tall, radius 10-12px, visible focus ring in blue. Eyebrow labels: uppercase, letter-spacing .15em, 12px, bold, blue, with a small blue dot. Page titles bold with a muted subtitle.
Responsive down to 360px. On small screens the POS stacks and the cart becomes a bottom drawer.

## 5. Data contract (mine)
Storage keys:
- `voltix_sales`: array of sales (mine)
- `voltix_returns`: array of returns (mine)
- `voltix_counters`: { sale: n, return: n }
- `voltix_lastUpdate`: timestamp, written after any sale or return
- sessionStorage `voltix_cart`: [{ productId, quantity }] only. Price and name are re-read from products on render.

Sale:
{
  id: "S-000001", date: ISO, cashierId, cashierName,
  items: [{ productId, id (same as productId), name, sku, unitPrice, price (same as unitPrice), quantity, lineTotal, returnedQty: 0 }],
  subtotal, discount: { type: "none"|"percent"|"fixed", value, amount },
  tax: { rate, amount }, total,
  payment: { method: "cash"|"card", amountTendered, change },
  paymentMethod: "Cash"|"Card", cashier: cashierName, customerName: "",
  status: "completed"|"partially_returned"|"fully_returned"
}
The duplicate fields (`id`, `price`, `paymentMethod`, `cashier`) exist only so Member 4's Reports page can read my sales as they are today. [OPEN: remove them when Reports adopts my shape.]

Return:
{
  id: "R-000001", date, saleId, processedById, processedByName,
  items: [{ productId, name, unitPrice, quantity, refundAmount, reason, restock }],
  totalRefund, refundMethod: "cash"|"card", note
}

Compat mirror [OPEN, temporary]: constant `ENABLE_REPORTS_COMPAT_MIRROR = true`. After saving a sale to `voltix_sales`, also append the same sale to `voltix.sales` (the key Reports reads). The mirror is best effort: if it fails, the sale still succeeds. Isolated in ONE small function so it is easy to delete.

Rules:
- Money is a number rounded to 2 decimals through ONE helper (`round2`).
- Product price and stock always come from `voltix_products` at the moment of the sale. Never keep a separate product list.
- All storage access goes through safe helpers (try/catch, fallback to [] or {}).
- Sale and return IDs come from `voltix_counters` (padded to 6 digits). Do not consume a counter if the write fails.

## 6. Business constants (top of js/pos-store.js)
DEFAULT_TAX_RATE = 14, DEFAULT_CURRENCY_SYMBOL = "$", MAX_STAFF_DISCOUNT_PERCENT = 10 (admin uncapped), RETURN_WINDOW_DAYS = 14 (matches Settings default footer text; admin can override per return), STAFF_CAN_PROCESS_RETURNS = true, STAFF_SALES_VISIBLE_DAYS = 7, SALES_PAGE_SIZE = 10, ENABLE_REPORTS_COMPAT_MIRROR = true.

## 7. js/pos-store.js (shared data layer, plain global `VoltixPOSStore`)
Exposes: getSession(), getSettings(), getProducts() (active only, for POS), getSales(), getReturns(), formatMoney(n), formatDate(iso), round2(n), escapeHtml(s), cart get/set (sessionStorage), checkoutSale(payload), processReturn(payload), and pure calculators (calcTotals, calcRefund).

checkoutSale (atomic, in this order):
1. Re-read raw products. Validate every line: product exists, active, price current, quantity <= stock (if preventNegativeStock). If invalid, stop and return the list of problems.
2. Snapshot raw products, movements, sales, counters for rollback.
3. Build the sale (snapshot name, sku, unit price per line). Generate the ID from the counter.
4. If autoDeductStock: reduce stock on the raw array (change only stock and updatedAt), append "sale" movements (reference = sale id), save.
5. Save sale to `voltix_sales`, save counters, run the compat mirror.
6. Write `voltix_lastUpdate`, dispatch `voltix:sale-completed` (detail = sale) and `voltix:data-changed`.
If any save fails or throws, restore every snapshot and return an error.
processReturn follows the same pattern: validate, snapshot, save the return, restock only the lines with restock = true (stock back + "return" movements with unique ids), update the sale's returnedQty and status, update counters, dispatch `voltix:return-completed` and `voltix:data-changed`, roll back on failure.

Totals order: subtotal -> minus discount -> tax on the discounted amount -> total.
Refund per return line = unitPrice x qty x (1 - discount.amount / subtotal) x (1 + tax.rate / 100), rounded. Show a short helper text explaining this.

## 8. POS page (pages/pos.html, both roles)
Two columns on desktop: product browser (~65%) and sticky cart (~35%).
Left: eyebrow "POINT OF SALE", title "New sale", subtitle with cashier name and today's date. Search bar (debounced 150ms) filtering by name, sku, category, id. Press Enter on an exact sku/id match to add that product and clear the box (scanner behavior). Autofocus the search, "/" focuses it. Category chips plus "In stock only" toggle. Product cards: name, sku, category, price, stock badge (low when stock <= lowStockThreshold, out when 0). Out of stock cards are disabled. Empty state with reset button. No edit/delete product controls anywhere.
Cart: header with item count and "Clear cart" (confirm). Each line: name, unit price, quantity stepper, line total, remove. Quantity min 1, max = live stock; clamp and toast "Only N in stock". Re-validate against live stock on every change and at checkout.
Summary: Subtotal, Discount, Tax (label shows the rate), big Total. Discount: None / % / Fixed. Percent 0-100, fixed <= subtotal. Staff capped at MAX_STAFF_DISCOUNT_PERCENT (fixed amounts converted to an equivalent percent), with a clear error. Optional customer name/note.
Payment: Cash | Card. Cash: amount received, quick buttons (Exact, +50, +100, +200), live change due, checkout disabled while amount < total. Card: simulated "Processing..." for 1.2s then success (demo only).
"Complete sale" button: disabled when the cart is empty or payment is invalid, disabled while processing (no double sales). Shortcut Ctrl+Enter.
Empty products: friendly empty state with a "Load demo products" button (admin only) that calls `VoltixInventory.seedDemoData` or the equivalent seed function IF it exists in inventory-store.js; never overwrite existing products. If no such function exists, show instructions to open the Products page instead.
Listen to the `storage` event and `voltix:data-changed` to refresh stock.

## 9. Receipt (js/receipt.js)
`renderReceipt(record, type)` returns an HTML string for a modal, thermal-style: VOLTIX wordmark, store name/address/phone/taxId from settings, receipt header, receipt number, date, cashier, itemised lines (name, qty x unit price, line total), subtotal, discount, tax, TOTAL, payment method, tendered, change, footer. Type "refund" renders "REFUND RECEIPT" with refunded items, reasons and total refund. Buttons: Print, Close, New sale. Print uses window.print() with an @media print block hiding everything except the receipt (80mm, monochrome). If settings.autoPrint is true, offer print automatically after a sale.

## 10. Sales page (pages/sales.html)
Eyebrow "SALES HISTORY", title "Sales". Stat cards for the filtered set: number of sales, revenue, average sale, items sold. Filters: text search (sale id, cashier, customer), date range plus presets (Today, Last 7 days, This month, All), payment method, status, reset. Table: Sale ID, date/time, cashier, items count, payment, total, status badge, View. Newest first, sortable by date and total, 10 per page. Detail modal: lines, totals, payment, linked returns, "Print receipt", "Process return" (link to returns.html?sale=ID).
Permissions: admin sees all. Staff see only their own sales (cashierId = session id) from the last 7 days, with the note "You are viewing your own recent sales"; stats reflect only that set. Admin only: "Export CSV" of the filtered set (Blob + anchor, escaped values). Empty state with a link to POS.

## 11. Returns page (pages/returns.html)
3-step stepper. (1) Find sale by ID (supports ?sale=S-000001) or pick from recent sales; clear error for unknown ID; staff can only find sales they can see. (2) Select items: sold qty, already returned, returnable, quantity input (0..returnable), reason dropdown (Defective, Wrong item, Customer changed mind, Damaged in store, Other), "Return to stock" checkbox (default checked, auto-unchecked for Defective and Damaged, editable). (3) Confirm: refund summary, method Cash/Card, note, confirmation dialog.
Rules: cannot return more than sold; cannot return from a fully returned sale; blocked after RETURN_WINDOW_DAYS unless admin ticks "Override return window"; respect STAFF_CAN_PROCESS_RETURNS. History table below: Return ID, date, original sale, items, refund, processed by, View receipt (staff see their own, admin all). Deleted/archived products: restock is skipped with a warning, the sale snapshot name is shown.

## 12. Quality
Small commented functions, constants at the top, each file wrapped in an IIFE exposing only what is needed. JSDoc on key functions. Accessibility: labels tied to inputs, visible focus, aria-live region for toasts and cart changes, modals with focus trap and Esc, real buttons. Edge cases: empty/corrupt storage, deleted products referenced by old sales, two tabs, double click, negative/NaN/huge numbers. Performance: build the grid with DocumentFragment, smooth with 500+ products.

## 13. Requests for teammates (do not implement, only list in reports)
- Member 1: add Returns to the staff nav; dashboard should read `voltix_sales` and listen to `voltix:sale-completed`; remove the inventory fallback identity (`voltix_session`).
- Member 2: add `barcode` and `brand` and preserve unknown fields in normalization; provide a batch stock API; fix multi-product return reference dedupe.
- Member 4: read sales from `voltix_sales` (or keep the mirror), stop seeding demo sales/products over real data, subtract returns, expose a standalone settings reader.
