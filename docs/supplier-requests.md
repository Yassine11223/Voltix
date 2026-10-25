# Supplier requests

Open `supplier-request.html` to submit an application without signing in. The login page links to this form. Admins review submissions under **Suppliers → Supplier Requests**; the existing **Suppliers** tab retains supplier management.

Use a static HTTP server from the repository root, for example `python -m http.server 8000`, and keep both pages on the same origin (`http://localhost:8000`). Requests persist in `localStorage` under `voltix_supplier_requests`. Admin access continues to use the existing `voltix.session` sessionStorage identity. The existing demo Admin login is `admin@voltix.test` / `Admin123!`.

Each request stores a unique `SR-` ID, ISO submission timestamp, type, company/contact information, optional notes, conditional product offer details, status, linked supplier ID, and reviewer/timestamp. Only new Pending requests may be reviewed. Product offers require a positive whole quantity, a positive EGP unit price with up to two decimals, and an expected delivery date of today or later.

Approval of either a Become a Supplier application or an Offer Products request creates a supplier or links an existing record using the shared supplier store. Matching normalizes Unicode, name case/repeated whitespace, email case, and phone punctuation/international prefixes (including Egyptian mobile local/country-code formats). A matching company name, email, or phone identifies a candidate; a contact-person name or address alone does not. Admins can also explicitly choose an existing supplier; ambiguous matches require a choice. Linking preserves existing contact details and active/inactive status. If supplier creation fails, the request stays Pending and an error is displayed. If supplier creation succeeds but saving the request fails, an error explains the partial save; retrying links the saved supplier without duplicating it.

Submission, approval and rejection do not call any product, stock movement or delivery APIs. Approval saves the linked supplier ID and review status for both request types, and the existing supplier list/statistics refresh through the shared data-change event. Actual stock receipt remains an authorized Inventory operation.

Run `tests/supplier-requests.test.html` for validation, permissions, matching, persistence, failed storage writes, retries and inventory isolation tests. Run `tests/inventory.test.html` for the existing inventory, supplier and POS regression tests. Both restore their original records/session; close other Voltix tabs before running them.

For UI verification: submit an application, sign in as Admin, open Supplier Requests, view details, approve/reject, and refresh. Repeat with Offer Products, search/status/type filters, duplicate applications, and a narrow viewport. Confirm existing supplier add/edit/status/delete controls still work and stock/movement records stay unchanged through request review.

This is a frontend prototype. Storage and role checks are browser-local, editable by the user, and do not provide production authentication or cross-device submission. Clearing site storage removes requests. Simultaneous writes from multiple tabs are not transactional. There are no supplier accounts, notifications, backend dependencies, or automatic deliveries.
