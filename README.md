# Voltix

VOLTIX is a planned Point of Sale (POS) and inventory management system for a physical electronics store. It supports internal store operations: in-store sales, products, inventory, suppliers, returns, reports, users, and settings. E-commerce, customer shopping pages, online ordering, and delivery are outside the project scope.

## Current status

Phase 1 currently contains the project structure and documentation. All eleven planned HTML pages and all CSS and JavaScript files are empty placeholders. No features or access controls are implemented yet.

## Phase 1 technologies

- HTML5 for page structure.
- CSS3 for styling.
- Vanilla JavaScript for browser interactions, demo data, and the planned localStorage data interface.

Phase 1 uses no frameworks, backend, npm, build tools, or external dependencies.

## Proposed system roles

The repository does not yet define system roles. The following four roles are proposed for team confirmation; their permissions are not finalized or implemented.

| Role | Proposed responsibility |
| --- | --- |
| Admin | Manage staff accounts, roles, and store settings. |
| Store Manager | Oversee store operations, sales, stock, and reports. |
| Cashier | Handle in-store POS transactions, sales records, and returns. |
| Inventory Staff | Maintain product information, stock records, and suppliers. |

## Eleven planned pages

Login is the root entry page. The remaining ten pages are under `pages/`.

| Page | File | Planned purpose |
| --- | --- | --- |
| Login | [index.html](index.html) | Staff sign-in. |
| Dashboard | [pages/dashboard.html](pages/dashboard.html) | Overview of store activity. |
| POS | [pages/pos.html](pages/pos.html) | In-store checkout and sales transactions. |
| Products | [pages/products.html](pages/products.html) | Product information management. |
| Inventory | [pages/inventory.html](pages/inventory.html) | Stock tracking and adjustments. |
| Sales | [pages/sales.html](pages/sales.html) | Sales history and transaction records. |
| Suppliers | [pages/suppliers.html](pages/suppliers.html) | Supplier records. |
| Reports | [pages/reports.html](pages/reports.html) | Store sales and inventory reports. |
| Users | [pages/users.html](pages/users.html) | Staff accounts and roles. |
| Returns | [pages/returns.html](pages/returns.html) | In-store returns and refunds. |
| Settings | [pages/settings.html](pages/settings.html) | Store and application settings. |

## Four-member team ownership

These development responsibilities are separate from the proposed system roles.

| Team member | Ownership |
| --- | --- |
| Member 1 | Login, Dashboard, shared UI, and authentication. |
| Member 2 | Products, Inventory, and Suppliers. |
| Member 3 | POS, Sales, and Returns. |
| Member 4 | Reports, Users, and Settings. |

## Project organization

| Location | Responsibility |
| --- | --- |
| `index.html` | Planned Login entry page. |
| `pages/` | Ten planned operational pages. |
| `css/` | Shared and page-specific styles. |
| `js/` | Shared and page-specific scripts. |
| `assets/images/`, `assets/icons/` | Image and icon assets; empty folders are tracked with `.gitkeep`. |
| `docs/` | Project requirements and architecture documentation. |

The shared files `css/style.css`, `css/components.css`, `js/app.js`, `js/storage.js`, and `js/data.js` remain empty. Their implementation and JavaScript APIs require team agreement.

See the [documentation guide](docs/README.MD), [SRS placeholder](docs/srs.md), and [architecture placeholder](docs/architecture.md).
