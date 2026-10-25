# VOLTIX: Customer Storefront Spec (front-end only, Phase 1)

Source of truth for the customer storefront. Every Codex prompt for this feature refers to this file.
Requested by the course doctor: FRONT-END ONLY for Phase 1. No backend. Everything is simulated with localStorage.
Branch: `feature/customer-store`. This is separate from the admin/staff system and must not change it.

## 1. Hard rules
- Only HTML5, CSS3, Vanilla JS (ES6+). No frameworks, no build tools, no backend. Plain `<script>` tags, no ES modules. Must work when opened as local files (file://).
- Work only on branch `feature/customer-store`. NEVER run git push, pull, merge, reset, rebase or checkout of other branches. Local commits only.
- Do NOT edit files owned by others or by the staff system: index.html, pages/*.html, js/app.js, auth.js, dashboard.js, inventory*.js, pi-ui.js, products.js, suppliers.js, reports.js, settings.js, users.js, pos*.js, sales.js, returns.js, receipt.js, css/style.css, components.css, dashboard.css, products-inventory.css, pos.css, sales.css, returns.css, and other docs. If a change is needed there, list it under "Requests for teammates".
- Customer pages must NEVER read or write the staff session (`sessionStorage["voltix.session"]`) or `voltix_session`. Customers are a separate world.
- Escape all user text before inserting into HTML (escapeHtml). No console errors. No dead buttons. Every visible control works or shows a clear "Demo only" message.
- Do not use external CDNs, fonts or images. Inline SVG icons only. System font stack.
- No Wishlist and no extra pages beyond the pages listed in this spec (owner decision).

## 2. Files (all new)
Folder `store/` at the repo root (customer pages), so paths use `../css/` and `../js/`:
- store/index.html (Home), category.html, deals.html, product.html, cart.html, checkout.html, success.html, login.html, forgot-password.html, orders.html, order.html, profile.html
- css/store.css (all storefront styles, prefix `st-`)
- js/store-data.js (shared data layer, global `VoltixStore`), js/store-ui.js (shared header/footer/toast/modal/mini-cart), and one controller per page: js/store-home.js, store-category.js, store-product.js, store-cart.js, store-checkout.js, store-auth.js, store-account.js
- Stage 2B uses separate controllers: `js/store-checkout.js` for Checkout and `js/store-success.js` for Order success.
- Stage 3A uses `js/store-orders.js` for Orders and `js/store-order.js` for Order details; Forgot password shares `js/store-auth.js` with Login.
- Stage 3B uses `js/store-profile.js` for Profile, with one delivery address and a Delivery address sidebar anchor (no Add new link).
The shared header (logo, category bar, search, Sign in / account, Cart count) and footer are injected by store-ui.js into `<div id="st-header">` and `<div id="st-footer">` so pages stay small. The staff app's index.html is untouched; the storefront entry is store/index.html.

## 3. Data (read-only from the staff system)
- Products: localStorage `voltix_products`. Real fields: id, sku, name, category, price, cost, stock, lowStockThreshold, supplier, description, status ("active"|"archived"), createdAt, updatedAt. NO brand, image, barcode.
  - Show only `status === "active"`. Never write to this key. NEVER expose `cost` or `supplier` to customers.
  - Brand is DERIVED in store-data.js: map by SKU prefix (APL Apple, SAM Samsung, GOO Google, LEN Lenovo, MS Microsoft, ANK Anker, UGR Ugreen, SNY Sony, NIN Nintendo), fallback = first word of the name. If `product.image` exists use it, else a CSS gradient placeholder.
  - Stock badge: stock 0 = Out of stock (Add disabled), stock <= lowStockThreshold = "Only N left", else In stock.
- Settings: localStorage `voltix.settings` (read-only, may be missing). Use taxRate (percent, default 14), currencySymbol (default "$"), storeName ("Voltix Electronics"), storePhone/address (placeholders if empty). Read with a safe loader.
- Empty catalog: if there are no active products, show a friendly empty state ("The store is being stocked. Check back soon.") and, ONLY for demo convenience, a link "Open staff app to load demo products" pointing to ../index.html.
- Deals: a static list in store-data.js (productSku -> discountPercent or fixed amount). Deal price = price minus discount. Do not store discounts anywhere. Only products that exist and are active appear on Deals. Original price shown struck through.
- Listen to the `storage` event so stock/prices refresh if the staff app changes them in another tab.

## 4. Storefront storage (all mine, prefix voltix_store_)
- `voltix_customers`: array of { id "C-0001", name, email (lowercase, unique), phone, passwordPlain (DEMO ONLY, see limitations), address { city, area, street }, createdAt, provider: "email"|"google"|"apple" }
- `voltix_orders`: array of orders (shape below)
- `voltix_store_counters`: { order: n } for ids (ORD-000001, 6 digits). Do not consume the counter if the write fails.
- `voltix_store_cart`: localStorage [{ productId, quantity }] only (guest carts persist). Price/name re-read from products on every render.
- sessionStorage `voltix_store_session`: { customerId, name, email }
- sessionStorage `voltix_store_reset`: { email, token, expiresAt } for the simulated reset flow.
All reads go through safe helpers (try/catch, fallback to [] or {}). Money is rounded to 2 decimals through one `round2` helper.

Order:
{ id, date ISO, customerId, customerName, email, phone,
  address { city, area, street },
  items [{ productId, name, sku, unitPrice, quantity, lineTotal }],
  subtotal, tax { rate, amount }, total,
  payment { method: "cod"|"card", status: "unpaid"|"paid_demo" },
  status: "pending"|"confirmed"|"delivered"|"cancelled",
  statusHistory [{ status, date }] }

Rules:
- Placing an order does NOT deduct stock and does NOT create a staff sale (front-end only; converting orders into sales is a future admin feature). It must still validate quantity <= current stock at checkout and block with a clear message otherwise.
- Deal prices apply everywhere: Product, Cart and orders. Use one shared effective-price function (`dealPrice`) and one shared cart-totals function (`cartTotals`) in store-data.js: subtotal, tax at settings taxRate (default 14), and total, all rounded with `round2`.
- Dispatch `voltix:order-placed` (detail = order) and write `voltix_lastUpdate`? NO: do not touch staff keys. Only dispatch the event.
- A customer sees only their own orders. They may cancel a pending order (status cancelled, statusHistory updated).

## 5. Pages and behavior
Visual reference: the design screenshots attached to the Codex message, plus the Voltix tokens below. Match them.
1. Home (store/index.html): hero banner + weekly-deals card, "Explore categories" tiles (built from real product categories), "Exclusive deals" row (4 deal products), "Shop by brand" chips (links to category.html?brand=X). Category tiles link to category.html?category=X.
2. Category / all products (category.html): breadcrumb, title with product count, LEFT FILTER SIDEBAR: Category (checkboxes with counts), Brand (checkboxes with counts), Price range (min and max inputs plus a simple dual slider), Availability (In stock only), Clear all. Active filter chips above the grid with an x to remove each, Sort (Featured, Price low to high, Price high to low, Name A-Z, Newest), 9 products per page with pagination, search term `q` support. Filters live in the URL query string (category, brand, min, max, instock, sort, q, page) so links are shareable and Back works. Filters and counts update live. "No products found" empty state with a Clear filters button. On screens under 900px the sidebar becomes a "Filters" button that opens a bottom drawer with Reset and "Show N results" buttons.
3. Deals (deals.html): banner with a "Ends in" countdown (simulated, resets at the next midnight), category chips, Sort by biggest discount, deal cards with discount badge and struck-through old price.
4. Product (product.html?id=P-1001): breadcrumb, image area with thumbnails (placeholders), brand, name, SKU, price (deal price if any), stock badge, quantity stepper (min 1, max stock, toast "Only N in stock"), Add to cart, Buy now (adds and goes to checkout), tabs Description / Specifications (Category, Brand, SKU, Availability), Related products (same category, up to 4, includes out-of-stock cards with disabled button). Unknown or archived id: friendly "Product not found" state.
5. Cart (cart.html): lines with image, name, unit price, quantity stepper, line total, remove; summary (Subtotal, Tax, Total); Checkout button; empty-cart state. Re-validate against live stock on every change; clamp and toast.
6. Checkout (checkout.html): requires a customer session, otherwise redirect to login.html?next=checkout.html. Form: full name, phone, email, city, area, street, payment is a choice between Cash on delivery and Card. When Card is selected, only a "Demo only: no real payment is processed" note is shown; there are no card fields and nothing card-related is stored. Prefill from the profile. Inline validation messages. "Place order" disabled while processing. On success: create order, clear the cart, go to success.html?id=ORD-000001.
7. Success (success.html): check icon, order number, status Pending, items and totals, buttons "Track my orders" and "Continue shopping".
8. Login / Register (login.html): tabs Sign in / Create account (name, email, phone, password, confirm). Under the Sign in button: divider "or continue with" and buttons "Continue with Google" and "Continue with Apple" which are SIMULATED: they sign in (or create) a demo customer with provider google/apple and show a toast "Demo only: social sign-in is simulated". Show/hide password toggle. Remember me (store email only). Validation: email format, password min 8 chars, unique email. `next` query param redirects after login. Generic error "Invalid email or password".
9. Forgot password (forgot-password.html): 3 steps. (1) enter email; (2) "Check your email" screen (always generic, never reveals whether the account exists; includes a Demo-only note and a visible "Open reset link (demo)" button that carries the token because no email can be sent); (3) set new password and confirm (min 8 chars, one number), token expires in 15 minutes, then redirect to login with a success message.
10. Orders (orders.html): table of the logged-in customer's orders (Order, Date, Items, Total, Status pill, View). Empty state with "Start shopping". Order details (order.html?id=): status timeline (Pending, Confirmed, Delivered; cancelled shown distinctly), items, summary, address, payment, Cancel order for pending orders.
11. Profile (profile.html): sidebar (Personal info, Addresses, My orders, Sign out), editable name/phone/email (unique), delivery address, change password (current + new + confirm), Save with validation and toast. Guests are redirected to login.
Header on every page: logo, category bar (All categories, real categories, Deals), search box (Enter goes to category.html?q=), Sign in or the customer name menu (Profile, My orders, Sign out), Cart link with live count. Footer as designed (placeholders for phone). Cart count updates across tabs.

## 6. Design tokens (same Voltix theme as the staff app)
navy #0b1833, navy-700 #102a63, blue #2456e8, blue hover #1945cb, blue-soft #dbe6ff, text #18253d, muted #59677d, bg #f5f7fb, border #e2e7f0, white cards, radius 14px (cards) and 10px (inputs/buttons), success #12683a on #dcf5e5, warning #8a5600 on #fdefd2, danger #b42318 on #fde8e6. Font: "Segoe UI", system-ui. Eyebrow labels: uppercase, 12px, letter-spacing .15em, bold, blue. Buttons 44px+ tall. Visible blue focus ring. Max content width 1200px.
Responsive down to 360px: grids collapse (4 -> 3 -> 2 -> 1 columns), header collapses into a compact bar with search below, filters become a drawer, tables become stacked cards. Accessibility: labels tied to inputs, real buttons/links, aria-live region for toasts, modals/drawers with focus trap and Esc, color contrast AA.

## 7. Quality
Small commented functions, constants at the top, each file in an IIFE exposing only what is needed, JSDoc on key functions. Edge cases: empty/corrupt storage, archived or deleted products still in a saved cart (show "No longer available" and remove), two tabs, double-click on Place order, negative/NaN quantities, very long names. Performance: build grids with DocumentFragment; smooth with 500+ products.

## 8. Known limitations (must be stated in the SRS)
- Confirmed and Delivered statuses require manually changing order data in localStorage in Phase 1; there is no admin order screen.
- The simulated reset token lives in sessionStorage, so the demo reset link works only in the same browser tab session.
- No backend: orders are visible only in the browser that created them; no real email, no real payment, no real SSO (Google/Apple), no real password reset.
- Passwords are stored in localStorage as plain text for the demo only; a real system needs server-side hashing.
- Orders do not deduct stock and are not visible to staff; converting orders to sales is a future admin feature.
- Brand and deal prices are derived from static mappings because the product record has no such fields.

## 9. Requests for teammates (list in reports only)
- Member 1: add a "Shop" link to store/index.html in the login page or header if the team wants the entry point linked.
- Member 2: add `brand`, `image` and an optional `compareAtPrice` to products and preserve unknown fields in normalization.
- Member 4: add "Customer storefront" (pages, orders, limitations above) to the SRS; Reports can later read `voltix_orders`.
