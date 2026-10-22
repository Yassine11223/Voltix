# Voltix documentation

VOLTIX is a planned POS and inventory management system for a physical electronics store. Its scope covers staff operations, in-store sales, products, stock, suppliers, returns, reporting, users, and settings. E-commerce, online shopping, online ordering, and delivery are outside scope.

## Phase 1

Phase 1 uses HTML5, CSS3, and vanilla JavaScript only. Browser localStorage is planned for the demo data interface. There are no frameworks, backend, npm packages, build tools, or external dependencies.

The repository currently contains documentation and empty page, CSS, and JavaScript placeholders. No features, authentication, or role permissions are implemented.

## Proposed system roles

Four roles are proposed because the repository does not yet define them. Role names and permissions require team confirmation.

| Role | Proposed responsibility |
| --- | --- |
| Admin | Staff accounts, roles, and store settings. |
| Store Manager | Store oversight, sales, stock, and reports. |
| Cashier | In-store POS transactions, sales records, and returns. |
| Inventory Staff | Products, stock records, and suppliers. |

## Eleven planned pages

The planned pages are Login, Dashboard, POS, Products, Inventory, Sales, Suppliers, Reports, Users, Returns, and Settings.

Login belongs in [`index.html`](../index.html). The other ten HTML files belong in [`pages/`](../pages/). The [root README page table](../README.md#eleven-planned-pages) maps every page to its file and planned purpose. All eleven files currently remain empty placeholders.

## Four-member team ownership

Development ownership is separate from the proposed system roles.

| Team member | Ownership |
| --- | --- |
| Member 1 | Login, Dashboard, shared UI, and authentication. |
| Member 2 | Products, Inventory, and Suppliers. |
| Member 3 | POS, Sales, and Returns. |
| Member 4 | Reports, Users, and Settings. |

The shared CSS and JavaScript files remain empty pending team agreement. No shared function APIs have been defined.

## Documentation files

| File | Purpose | Current status |
| --- | --- | --- |
| [README.MD](README.MD) | Documentation overview and planning scope. | This guide. |
| [srs.md](srs.md) | Software Requirements Specification. | Existing empty placeholder, preserved. |
| [architecture.md](architecture.md) | Application structure and architecture decisions. | Empty placeholder, preserved. |

See the [root README](../README.md) for the project layout and complete planned page mapping.
