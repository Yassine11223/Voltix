VOLTIX
Electronics Store Inventory & Point-of-Sale Management System
Software Engineering — Phase 1 (Frontend Prototype)

Voltix is a browser-based management prototype for a physical electronics shop. It brings together product records, stock tracking, point-of-sale transactions, sales, returns, supplier management, reporting, and employee administration.
Scope: This is not an online shopping website. Customers do not place web orders. Suppliers may submit a public form, but do not have login accounts.

Users and access
Actor	Access
Admin	Store management: products, inventory, sales, returns, suppliers/requests, reports, users, settings, POS
Staff	Authorized employee tools including POS and relevant product/stock/sales views; individual permissions depend on implementation
Supplier (public)	Open supplier-request.html to apply or offer products without an account


Pages
Page	File
Employee sign in	[`index.html`](index.html)
Public supplier request	[`supplier-request.html`](supplier-request.html)
Dashboard	[`pages/dashboard.html`](pages/dashboard.html)
POS	[`pages/pos.html`](pages/pos.html)
Products	[`pages/products.html`](pages/products.html)
Inventory	[`pages/inventory.html`](pages/inventory.html)
Sales	[`pages/sales.html`](pages/sales.html)
Suppliers + Requests tab	[`pages/suppliers.html`](pages/suppliers.html)
Returns	[`pages/returns.html`](pages/returns.html)
Reports	[`pages/reports.html`](pages/reports.html)
Users	[`pages/users.html`](pages/users.html)
Settings	[`pages/settings.html`](pages/settings.html)


Supplier request workflow
1. Open the public Supplier Request page.
2. Choose Become a Supplier or Offer Products.
3. Enter company and contact information; product offers require product/quantity/price/delivery details.
4. Submit the request; it begins as Pending.
5. Admin opens Suppliers → Supplier Requests, reviews it, and Approves or Rejects it.
6. Approval creates or links the supplier directory entry. Approval never adds inventory automatically. Stock is updated separately after physical receipt/verification.
Technology
- HTML5, CSS3 and vanilla JavaScript
- Browser storage for Phase 1 demonstration data
- No required application backend or shared database for the current frontend demo
Run locally
1. Clone the repository:
   git clone https://github.com/Yassine11223/Voltix.git
   cd Voltix
2. Open the folder in VS Code.
3. Serve the project with Live Server (or another local static HTTP server).
4. Open the served index.html for employee login or supplier-request.html for the public supplier form.
5. Use any instructor/team-approved demo credentials shown or configured in the current app; do not publish real passwords in this README.
Use one consistent origin (for example, the same http://127.0.0.1:5500 host and port) while testing the public form and Admin review.
Important limitations
- localStorage is isolated to a browser origin: a supplier submitting from another computer will not send their offer to a remote Admin. This is a same-browser demo, not a live public submission system.
- Browser-only session management and role checks cannot replace server-side security.
- Payments are simulated/recorded; the app does not integrate real card payment processing.
- Real production operation would need a backend, central database, authentication, audit trail, validation, and backup strategy.
Project layout
Voltix/
├── index.html                  # Employee login
├── supplier-request.html       # Public supplier form
├── pages/                     # Internal operational screens
├── css/                       # Shared and page-specific styles
├── js/                        # App logic and browser storage modules
├── assets/                    # Images and icons
├── docs/                      # Specifications/architecture
└── tests/                     # Repository tests and QA helpers
Phase 1 acceptance smoke tests
- Employee sign in and role-appropriate navigation
- Product list, inventory and stock warnings
- POS complete sale → sales record and expected stock change
- Return workflow for a valid sale (verify policy and quantities)
- Public supplier application → Pending → Admin Approve → supplier linked
- Public product offer → Admin Approve → no automatic inventory increase
- Supplier Reject, duplicate supplier check, and refresh persistence
- Reports/Users/Settings navigation and supported actions
These are tests to perform, not a claim that all have already passed.
Documentation
The formal 11-section Software Requirements Specification should be maintained in [`docs/srs.md`](docs/srs.md). It must reflect the same features and scope as the actual frontend.
Team ownership (confirm with team)
Workstream	Responsibility
1	Login, dashboard, shared UI
2	Products, inventory, suppliers and supplier requests
3	POS, sales, returns
4	Reports, users, settings, documentation integration


Contributing
Work on separate feature branches, open a pull request into main, and review/test changes before merging. Avoid force-pushing to shared main.
Status
Phase 1 frontend and documentation are actively being checked for SRS consistency. Features and role restrictions should be verified against the source and browser behavior before submission.
