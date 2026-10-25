# SOFTWARE REQUIREMENTS SPECIFICATION

## VOLTIX
### Electronics Store Point of Sale & Inventory Management System

**Version:** 1.0  
**Project Phase:** Phase 1 — Software Requirements Specification and Frontend Implementation  
**Course:** Software Engineering (SWE320)  
**Institution:** Misr International University (MIU)  
**Date:** October 2026

**Prepared by:**

| Student Name | Student ID |
|---|---|
| Yassine Mahmoud Mohamed | 2024/02597 |
| Yehia Mohammed Adel | 2024/05270 |
| Youssef Saeid Mohammed | 2024/09584 |
| Yassin Hossam | 2024/03894 |

---

# Contents

1. Preface
2. Introduction
3. Similar Systems
4. Functional User Requirements
5. Functional System Requirements
6. Non-Functional Requirements
7. Glossary
8. Form-Based and Tabular Specification
9. Prototype of All Pages
10. Scenarios
11. Use Cases

---

# 1. Preface

This document presents the Software Requirements Specification (SRS) for **Voltix**, a web-based Point of Sale (POS) and Inventory Management System developed for physical electronics retail stores.

The document describes the system's objectives, functional requirements, non-functional requirements, user roles, interfaces, business rules, and expected behavior.

It serves as a reference for the development team, course instructors, teaching assistants, and future system developers.

The Phase 1 implementation focuses on frontend functionality using HTML, CSS, and JavaScript. Browser-based storage is used to demonstrate system operations without requiring a production database.

## 1.1 Purpose of This Document

The SRS aims to:

- Define the functional requirements of Voltix.
- Identify the system users and their responsibilities.
- Describe the business processes supported by the system.
- Specify the interfaces and pages required.
- Establish rules for inventory, sales, suppliers, and returns.
- Define measurable non-functional requirements.
- Provide scenarios and use cases for development and testing.
- Establish a consistent reference for future system development.

## 1.2 Intended Audience

This document is intended for:

- Software Engineering instructors and teaching assistants.
- Voltix project team members.
- Future frontend and backend developers.
- Store administrators and employees.
- Project evaluators and testers.

## 1.3 Document Organization

Section 2 describes the business problem, purpose, scope, and expected benefits.

Section 3 compares Voltix with existing retail management solutions.

Sections 4 and 5 specify user requirements and detailed system requirements.

Section 6 describes non-functional requirements.

Section 7 defines important terminology.

Section 8 presents form-based specifications and decision tables.

Section 9 describes the complete frontend prototype.

Section 10 provides realistic operational scenarios.

Section 11 defines system actors and use cases.

## 1.4 Revision History

| Version | Date | Description |
|---|---|---|
| 0.1 | October 2026 | Initial requirements and project scope |
| 0.2 | October 2026 | Added supplier communication and returns workflows |
| 1.0 | October 2026 | Consolidated Phase 1 Software Requirements Specification |

---

# 2. Introduction

## 2.1 Problem

Physical electronics stores manage numerous products with different brands, specifications, prices, stock quantities, and suppliers.

Many small and medium-sized retailers still depend on spreadsheets, paper records, or separate applications to manage inventory, sales, employees, and supplier information.

These methods introduce several operational problems:

- Inaccurate stock quantities caused by manual updates.
- Difficulty identifying low-stock and out-of-stock products.
- Delays when processing sales and issuing receipts.
- Poor visibility into daily revenue and employee performance.
- Difficulty maintaining accurate supplier information.
- Inefficient supplier communication through calls or emails.
- Inconsistent processing of returned products.
- Limited reporting capabilities for business decisions.

When inventory information is not properly connected to sales transactions, products may be sold without correctly updating available stock.

Similarly, supplier applications and product offers may be lost or handled inconsistently when communication is performed outside the store management system.

Voltix addresses these problems by integrating the store's primary operational functions into one management platform.

## 2.2 Purpose and Scope

**Voltix is a web-based Point of Sale and Inventory Management System designed for physical electronics retail stores.**

The system allows authorized employees to manage products, inventory, sales, returns, suppliers, reports, and store settings through a centralized interface.

Voltix supports two authenticated roles:

1. **Administrator:** Responsible for managing store operations, products, inventory, employees, suppliers, reports, and configuration.
2. **Staff/Cashier:** Responsible for authorized daily operations, including POS checkout, viewing products and stock, and accessing permitted sales and returns functionality.

Voltix also supports an external actor:

3. **Supplier:** A company or individual who can submit an application or product offer through a public supplier request form without an account.

### 2.2.1 In Scope

The system includes the following modules.

**Authentication and Role Management**

- Employee login and logout.
- Administrator and Staff roles.
- Role-specific navigation and access restrictions.
- Employee account management by administrators.

**Dashboard**

- Store overview and operational statistics.
- Sales and transaction indicators.
- Product and inventory summaries.
- Low-stock warnings.
- Recent operational information.

**Point of Sale (POS)**

- Product search and selection.
- Shopping cart and quantity adjustments.
- Automatic calculation of transaction totals.
- Cash or Card payment method selection.
- Sale completion.
- Receipt generation.

**Product Management**

- Product catalog.
- Add, view, edit, and delete products.
- Product categories.
- SKU and pricing information.
- Product stock information.

**Inventory Management**

- Monitor available stock.
- Detect low-stock and out-of-stock products.
- Authorized stock adjustments.
- Inventory replenishment.
- Inventory movement records where supported.

**Sales Management**

- Record completed transactions.
- Display sales history.
- View transaction details.
- Search and filter recorded sales.
- Generate receipts.

**Returns Management**

- Locate previous sales.
- Select products for return.
- Specify return quantities and reasons.
- Apply eligibility and quantity rules.
- Record refunds and restocking decisions.
- Prevent duplicate returns of the same units.

**Supplier Management**

- Maintain supplier information.
- Add, edit, activate, deactivate, and delete supplier records.
- Search and filter suppliers.
- Associate suppliers with products where supported.

**Supplier Request System**

- Public supplier application form.
- Product offer submission.
- Supplier request validation.
- Request tracking and status management.
- Administrator approval or rejection.
- Linking approved requests to supplier records.

**Reports and Analytics**

- Revenue and sales statistics.
- Product sales performance.
- Sales trends.
- Cashier performance information.
- Report filtering and available export functions.

**Employee Management**

- Create and manage employee accounts.
- Assign Administrator or Staff roles.
- Update employee information.
- Activate, suspend, or delete accounts subject to system restrictions.

**System Settings**

- Store profile information.
- Tax and currency configuration.
- POS-related preferences.
- Inventory-related settings.
- Browser-data backup and restore utilities.

**Frontend Data Persistence**

- Browser-based storage for prototype records.
- Persistence between page refreshes within the same browser and origin.
- Demonstration of connected frontend workflows.

### 2.2.2 Out of Scope

The following features are excluded from the Phase 1 project:

- Public customer e-commerce shopping website.
- Customer online shopping cart and checkout.
- Supplier login and dedicated supplier dashboard.
- Real payment gateway integration.
- Automated external payment authorization.
- Shipping company or courier integrations.
- Multi-branch enterprise synchronization.
- Production backend and remote database services.
- Automatic synchronization between different users' devices.
- Automatic inventory increases when a supplier offer is approved.

**Important:** Approval of a supplier request does not confirm delivery. Inventory is increased only after an authorized stock-receipt operation.

## 2.3 What Makes the Solution Innovative

### Integrated Store Operations

Voltix combines POS, products, inventory, suppliers, sales, returns, employee management, and reporting within one interface.

### Supplier Communication Workflow

External suppliers can submit applications and product offers using a public form.

Administrators can review requests and maintain supplier records without relying exclusively on external communication channels.

### Role-Based Workspaces

Different navigation options and available actions are presented according to employee responsibilities.

### Inventory and Sales Integration

Completed transactions are connected to product stock records, allowing sales to affect available inventory consistently.

### Lightweight Frontend Architecture

The system is developed using HTML5, CSS3, and JavaScript without requiring a complex frontend framework.

### Browser-Based Prototype

The Phase 1 demonstration uses browser storage to illustrate workflows and data persistence without a production backend.

This architecture supports a local demonstration but does not provide secure production authentication or real-time multi-device operation.

## 2.4 Measurable Benefits

The following figures are proposed evaluation targets, not results already achieved.

| Measure | Existing Manual Approach | Voltix Target |
|---|---|---|
| Checkout processing | Manual product and total calculation | Complete a standard demonstrated sale within 60 seconds |
| Stock updates | Manual entry after a sale | Update stock immediately after confirmed checkout |
| Low-stock identification | Periodic manual checking | Display warnings when stock reaches its configured threshold |
| Supplier communication | External calls or emails | Record a supplier submission through one web form |
| Supplier review | Unstructured communication | Display and classify submissions as Pending, Approved, or Rejected |
| Sales reporting | Manual spreadsheet calculations | Generate available summary reports from stored transactions |
| Returns | Manually adjusted records | Record eligible returned quantities and prevent duplicate processing |

---

# 3. Similar Systems

Voltix provides functionality commonly found in retail POS and inventory applications.

| System | Main Purpose | Difference from Voltix |
|---|---|---|
| Square for Retail | Commercial sales, inventory, and payment management | Voltix focuses on an educational, lightweight inventory/POS prototype without live payment processing |
| Odoo POS / Inventory | Integrated enterprise resource and inventory management | Voltix has a smaller scope and simpler frontend architecture |
| Lightspeed Retail | Retail sales, inventory, and business reporting | Voltix focuses on core single-store workflows instead of a commercial cloud platform |
| Spreadsheet-based management | Manual products, stock, and sales tracking | Voltix connects transactions, inventory, reports, and supplier requests in one interface |

## 3.1 Identified Gap

Small electronics stores benefit from straightforward workflows that connect product management, inventory, sales, returns, and supplier communication.

Voltix demonstrates how those operations can be integrated into a lightweight store-management interface.

Unlike a full enterprise system, Voltix focuses on essential operational workflows without complex multi-branch infrastructure.

---

# 4. Functional User Requirements

This section describes what each user needs to accomplish.

**Priority levels:**

- H — High priority
- M — Medium priority
- L — Low priority

## 4.1 All Authenticated Users

| ID | Requirement | Priority |
|---|---|---|
| UR1 | The user shall be able to sign in with registered employee credentials. | H |
| UR2 | The user shall be able to sign out. | H |
| UR3 | The user shall be able to view navigation appropriate to their role. | H |
| UR4 | The user shall be able to access their permitted operational pages. | H |
| UR5 | The user shall receive feedback for invalid login attempts or unauthorized actions. | H |

## 4.2 Staff / Cashier

| ID | Requirement | Priority |
|---|---|---|
| UR6 | Staff shall be able to view an authorized operational dashboard. | H |
| UR7 | Staff shall be able to search and view available products. | H |
| UR8 | Staff shall be able to view permitted inventory information. | H |
| UR9 | Staff shall be able to add products to a POS cart and adjust quantities. | H |
| UR10 | Staff shall be able to complete authorized Cash or Card sales. | H |
| UR11 | Staff shall be able to generate transaction receipts. | H |
| UR12 | Staff shall be able to review permitted sales records. | M |
| UR13 | Staff shall be able to process returns only when authorized by the system's return policy. | M |

## 4.3 Administrator

| ID | Requirement | Priority |
|---|---|---|
| UR14 | Admin shall be able to view store-wide dashboard information. | H |
| UR15 | Admin shall be able to create, view, edit, and delete products. | H |
| UR16 | Admin shall be able to adjust inventory and record replenishment. | H |
| UR17 | Admin shall be able to view and manage supplier records. | H |
| UR18 | Admin shall be able to review supplier applications and product offers. | H |
| UR19 | Admin shall be able to approve or reject supplier requests. | H |
| UR20 | Admin shall be able to review complete sales history. | H |
| UR21 | Admin shall be able to view reports and analytics. | H |
| UR22 | Admin shall be able to manage employee accounts and assigned roles. | H |
| UR23 | Admin shall be able to modify store settings. | H |
| UR24 | Admin shall be able to export and restore supported prototype data. | M |
| UR25 | Admin shall be able to manage returns subject to return eligibility rules. | H |

## 4.4 External Supplier

| ID | Requirement | Priority |
|---|---|---|
| UR26 | A supplier shall be able to open the public Supplier Request page without signing in. | H |
| UR27 | A supplier shall be able to submit an application to become a registered supplier. | H |
| UR28 | A supplier shall be able to offer products for supply to Voltix. | H |
| UR29 | A supplier shall receive validation feedback for missing or invalid information. | H |
| UR30 | A supplier shall receive confirmation after successfully submitting a request. | H |

External suppliers do not receive authenticated Voltix accounts in Phase 1.

---

# 5. Functional System Requirements

Functional system requirements describe the expected behavior of Voltix.

Each requirement uses the format:

**The system shall...**

## 5.1 Authentication and Access Control

| ID | System Requirement |
|---|---|
| SR1.1 | The system shall accept employee login credentials through the login page. |
| SR1.2 | The system shall validate credentials against stored employee records. |
| SR1.3 | The system shall display an error when credentials are invalid. |
| SR1.4 | The system shall create a browser session after successful login. |
| SR1.5 | The system shall redirect authenticated users to their permitted workspace. |
| SR1.6 | The system shall display navigation appropriate to the active employee role. |
| SR1.7 | The system shall redirect unauthenticated users attempting to open internal pages to the login page. |
| SR1.8 | The system shall terminate the current browser session when a user signs out. |
| SR1.9 | The system shall restrict protected administrative actions in the frontend prototype. |

The Phase 1 browser-based authentication mechanism is a demonstration and must not be treated as production-grade access control.

## 5.2 Product Management

| ID | System Requirement |
|---|---|
| SR2.1 | The system shall maintain product records containing an identifier, product name, SKU, category, price, and stock information. |
| SR2.2 | The system shall allow administrators to create products. |
| SR2.3 | The system shall validate required product fields. |
| SR2.4 | The system shall allow administrators to edit existing product information. |
| SR2.5 | The system shall allow administrators to delete products subject to applicable data-integrity rules. |
| SR2.6 | The system shall allow authorized users to search and filter products. |
| SR2.7 | The system shall prevent unauthorized staff members from modifying product records. |

## 5.3 Inventory Management

| ID | System Requirement |
|---|---|
| SR3.1 | The system shall display the available stock quantity for each product. |
| SR3.2 | The system shall classify products using stock quantity and configured warning thresholds. |
| SR3.3 | The system shall indicate products that are out of stock. |
| SR3.4 | The system shall allow administrators to perform authorized stock adjustments. |
| SR3.5 | The system shall record supported inventory changes. |
| SR3.6 | The system shall update available quantities after completed sales. |
| SR3.7 | The system shall prevent unsupported or invalid stock adjustments. |
| SR3.8 | The system shall keep inventory quantities consistent with completed stock-affecting transactions. |

## 5.4 Point of Sale

| ID | System Requirement |
|---|---|
| SR4.1 | The system shall display products available for POS operations. |
| SR4.2 | The system shall allow the cashier to search for products. |
| SR4.3 | The system shall allow products to be added to a transaction cart. |
| SR4.4 | The system shall allow item quantities to be adjusted or items removed. |
| SR4.5 | The system shall calculate the transaction subtotal, applicable taxes, and grand total. |
| SR4.6 | The system shall provide Cash and Card as recorded payment methods. |
| SR4.7 | The system shall validate transaction quantities against applicable stock restrictions. |
| SR4.8 | The system shall create a transaction record when checkout is completed successfully. |
| SR4.9 | The system shall decrease stock quantities for products included in a completed sale. |
| SR4.10 | The system shall generate a printable receipt for a completed transaction. |

Recording a Card payment method does not mean the system communicates with a bank or processes real electronic payments.

## 5.5 Sales Management

| ID | System Requirement |
|---|---|
| SR5.1 | The system shall store completed sales transactions. |
| SR5.2 | The system shall assign a unique identifier to each sale. |
| SR5.3 | The system shall record the transaction date, cashier, purchased items, amounts, and selected payment method. |
| SR5.4 | The system shall display sales history to authorized users. |
| SR5.5 | The system shall allow users to inspect individual transaction details. |
| SR5.6 | The system shall support available sales-search and filtering controls. |
| SR5.7 | The system shall preserve sales records for reporting and permitted returns. |

## 5.6 Returns Management

| ID | System Requirement |
|---|---|
| SR6.1 | The system shall allow authorized users to locate a recorded sale. |
| SR6.2 | The system shall display sale items eligible for return. |
| SR6.3 | The system shall allow the user to select return quantities and reasons. |
| SR6.4 | The system shall prevent returning more units than the remaining eligible quantity. |
| SR6.5 | The system shall apply the configured return eligibility window and available administrator overrides. |
| SR6.6 | The system shall calculate the applicable refund amount. |
| SR6.7 | The system shall record a completed return. |
| SR6.8 | The system shall update inventory when eligible returned products are marked for restocking. |
| SR6.9 | The system shall not restock products marked as damaged or otherwise unsuitable for resale. |
| SR6.10 | The system shall prevent duplicate returns of the same units. |

## 5.7 Supplier Management

| ID | System Requirement |
|---|---|
| SR7.1 | The system shall maintain supplier records containing company and contact information. |
| SR7.2 | The system shall allow administrators to add suppliers. |
| SR7.3 | The system shall allow administrators to edit supplier details. |
| SR7.4 | The system shall allow administrators to activate or deactivate suppliers. |
| SR7.5 | The system shall provide supplier search and filtering. |
| SR7.6 | The system shall allow administrators to delete suppliers subject to data-integrity rules. |
| SR7.7 | The system shall preserve supported relationships between suppliers and product records. |

## 5.8 Public Supplier Requests

| ID | System Requirement |
|---|---|
| SR8.1 | The system shall provide a public Supplier Request Form without requiring an employee account. |
| SR8.2 | The system shall offer two request types: Become a Supplier and Offer Products. |
| SR8.3 | The system shall collect company name, contact person, email, and phone information. |
| SR8.4 | The system shall collect product details for product offers. |
| SR8.5 | The system shall validate required fields and numeric values. |
| SR8.6 | The system shall generate a unique reference for each valid request. |
| SR8.7 | The system shall assign Pending status to newly submitted requests. |
| SR8.8 | The system shall save the request in the frontend's shared browser data store. |
| SR8.9 | The system shall display submitted requests in the Admin Supplier Requests interface when both pages use the same browser and origin. |
| SR8.10 | The system shall allow administrators to inspect and approve or reject pending requests. |
| SR8.11 | The system shall record the review decision and available review metadata. |
| SR8.12 | The system shall create or link a supplier record after successful approval, avoiding duplicates. |
| SR8.13 | The system shall not approve a request if required supplier-record creation fails. |
| SR8.14 | The system shall not automatically modify product stock or create a completed purchase when approving a request. |

**Business Rule:** Supplier request approval represents an administrative decision, not confirmation that goods have been delivered.

## 5.9 Reports and Analytics

| ID | System Requirement |
|---|---|
| SR9.1 | The system shall calculate available sales and transaction indicators from stored records. |
| SR9.2 | The system shall present revenue trends using appropriate visual representations. |
| SR9.3 | The system shall display supported product-sales summaries. |
| SR9.4 | The system shall display available cashier-performance information. |
| SR9.5 | The system shall provide supported date filters. |
| SR9.6 | The system shall allow authorized administrators to export available reports where implemented. |
| SR9.7 | The system shall update report calculations when the underlying browser-stored records change. |

## 5.10 Employee Management

| ID | System Requirement |
|---|---|
| SR10.1 | The system shall display the employee account directory to administrators. |
| SR10.2 | The system shall allow administrators to create employee accounts. |
| SR10.3 | The system shall support Administrator and Staff roles. |
| SR10.4 | The system shall validate required account information and reject duplicate email addresses. |
| SR10.5 | The system shall allow administrators to update employee information. |
| SR10.6 | The system shall allow administrators to activate, suspend, or delete employee accounts under applicable restrictions. |
| SR10.7 | The system shall prevent actions that would remove the last active administrator where this safeguard is supported. |
| SR10.8 | The system shall preserve historical transaction attribution when managing employee accounts. |

## 5.11 System Settings

| ID | System Requirement |
|---|---|
| SR11.1 | The system shall allow administrators to maintain available store profile information. |
| SR11.2 | The system shall allow administrators to configure supported tax and currency settings. |
| SR11.3 | The system shall apply relevant settings to POS calculations and receipt presentation. |
| SR11.4 | The system shall provide available POS and inventory preferences. |
| SR11.5 | The system shall support exporting prototype records to a backup file. |
| SR11.6 | The system shall support importing a valid supported backup file. |
| SR11.7 | The system shall validate applicable backup data before restoration. |
| SR11.8 | The system shall require confirmation before performing destructive reset operations. |

---

# 6. Non-Functional Requirements

Non-functional requirements define expected qualities and constraints of the system.

The following measurable figures are acceptance targets that require testing; they are not claims of completed verification.

| ID | Category | Requirement | Verification Method |
|---|---|---|---|
| NFR1 | Performance | Core frontend pages should become interactive within 3 seconds under normal testing conditions. | Browser performance testing |
| NFR2 | Performance | Product searches should respond within 1 second using a representative prototype dataset. | Timed search tests |
| NFR3 | Usability | Users should be able to identify the main POS, Products, and Inventory navigation areas without training. | Usability testing |
| NFR4 | Usability | Required form fields must provide clear validation feedback. | Form testing |
| NFR5 | Security | Internal pages must use the available role and session checks in the frontend prototype. | Role-based navigation tests |
| NFR6 | Security | The production version must enforce authentication and authorization on a trusted backend. | Future security review |
| NFR7 | Reliability | Invalid form submissions must not create valid business records. | Negative test cases |
| NFR8 | Data Integrity | Inventory updates must not result from supplier approval alone. | Workflow tests |
| NFR9 | Data Integrity | Returns must not permit quantities greater than the remaining returnable quantities. | Return validation tests |
| NFR10 | Accessibility | Forms should provide accessible labels and keyboard-operable controls. | Keyboard and accessibility inspection |
| NFR11 | Compatibility | The frontend should operate in current supported desktop versions of Chrome, Edge, and Firefox. | Cross-browser testing |
| NFR12 | Responsiveness | Major pages should support desktop and mobile layouts, including a 360px viewport. | Responsive layout testing |
| NFR13 | Maintainability | Source code shall organize HTML, CSS, and JavaScript into maintainable modules. | Code inspection |
| NFR14 | Availability | Core internal demonstration workflows should operate without a production remote database once local files and dependencies are available. | Local demonstration testing |
| NFR15 | Recoverability | Supported backup files should permit restoration of compatible prototype records. | Backup and restore test |
| NFR16 | Privacy | Supplier information should be accessible through authorized administrative interfaces rather than public supplier lists. | Access-control review |

## 6.1 Phase 1 Security Limitations

Voltix currently uses browser-based storage and frontend role handling.

Consequently:

- Browser storage can be modified by a user with access to the browser.
- Client-side role restrictions do not replace secure backend authorization.
- Supplier submissions do not automatically synchronize across independent devices.
- Clearing site storage may remove prototype records.
- A production system would require authenticated APIs, a shared database, appropriate password protection, and server-enforced permissions.

These limitations are acknowledged as part of the Phase 1 prototype architecture.

---

# 7. Glossary

| Term | Definition |
|---|---|
| Voltix | The proposed electronics store management system |
| POS | Point of Sale, where customer transactions are recorded |
| SKU | Stock Keeping Unit, a product identifier |
| Inventory | Products and quantities available in the store |
| Stock Level | Quantity currently available for a product |
| Low Stock | Stock quantity at or below the defined warning threshold |
| Out of Stock | Product with no available stock |
| Supplier | External business or individual providing products to the store |
| Supplier Request | Application or product offer submitted through the public form |
| Administrator | Employee with full store management responsibilities |
| Staff / Cashier | Employee performing authorized store operations |
| CRUD | Create, Read, Update, Delete |
| Transaction | Completed store sale |
| Return | Recorded reversal of an eligible purchased item |
| Refund | Amount returned to a customer after an approved return |
| Restocking | Adding eligible products back into available stock |
| Receipt | Document showing completed transaction details |
| Dashboard | Summary interface presenting operational information |
| Revenue | Money generated through recorded sales |
| Tax | Applicable percentage included in sales calculations |
| RBAC | Role-Based Access Control |
| localStorage | Browser storage that can persist data across page refreshes |
| sessionStorage | Browser storage used for session-related information |
| SRS | Software Requirements Specification |
| Frontend | The browser-based user interface and associated client-side logic |

---

# 8. Form-Based and Tabular Specification

## 8.1 Form-Based Specification

### F1 — Employee Login

| Field | Description |
|---|---|
| Function | Authenticate employee |
| Description | Validates credentials and opens the employee workspace |
| Inputs | Email and password |
| Source | Login page |
| Outputs | Active session or validation error |
| Destination | Dashboard or login error message |
| Preconditions | Employee account exists and is permitted to sign in |
| Actions | Validate inputs, check credentials, establish browser session, redirect |
| Postcondition | Authorized employee enters the workspace |
| Alternative Flow | Invalid credentials cause an error without creating a session |

### F2 — Add or Edit Product

| Field | Description |
|---|---|
| Function | Maintain product catalog |
| Description | Creates or updates an electronics product |
| Inputs | Product name, SKU, category, price, stock-related fields and available product attributes |
| Source | Products page |
| Outputs | Product record or validation message |
| Destination | Product and inventory data store |
| Preconditions | Administrator is authenticated |
| Actions | Validate inputs, check applicable uniqueness rules, save record, refresh list |
| Postcondition | Product catalog reflects the accepted change |
| Alternative Flow | Invalid values are rejected |

### F3 — Complete POS Sale

| Field | Description |
|---|---|
| Function | Process store checkout |
| Description | Completes a customer's purchase |
| Inputs | Selected products, quantities, payment method |
| Source | POS page |
| Outputs | Sale record, calculated total, receipt |
| Destination | Sales records and inventory data |
| Preconditions | Authorized user is signed in and cart contains valid items |
| Actions | Calculate amounts, validate stock, record sale, update inventory, display receipt |
| Postcondition | Transaction is recorded and relevant stock is decreased |
| Alternative Flow | Checkout is prevented if validation or stock restrictions fail |

### F4 — Supplier Application / Product Offer

| Field | Description |
|---|---|
| Function | Submit Supplier Request |
| Description | Allows external suppliers to contact Voltix and submit applications or product offers |
| Inputs | Request type, company name, contact person, email, phone, address, conditional product details and notes |
| Source | Public Supplier Request page |
| Outputs | Request reference and success/error message |
| Destination | Supplier Request data store and Admin Requests list |
| Preconditions | Public form is accessible |
| Actions | Validate form, assign request ID, set Pending status, save request, show confirmation |
| Postcondition | Request is recorded as Pending |
| Alternative Flow | Invalid or incomplete data prevents submission |
| Side Effects | No supplier, product, or inventory record is automatically created at submission |

### F5 — Review Supplier Request

| Field | Description |
|---|---|
| Function | Approve or Reject Supplier Request |
| Description | Allows an administrator to review supplier submissions |
| Inputs | Selected request, decision, optional additional review details |
| Source | Admin Suppliers page — Supplier Requests tab |
| Outputs | Updated request status |
| Destination | Supplier Request store and, after successful approval, supplier directory |
| Preconditions | Administrator is signed in and request is Pending |
| Actions | Inspect request, check existing supplier records, approve/link/create or reject, save decision |
| Postcondition | Request is Approved or Rejected |
| Alternative Flow | Failed supplier creation prevents successful approval |
| Side Effects | Supplier record may be created or linked; inventory remains unchanged |

### F6 — Process Return

| Field | Description |
|---|---|
| Function | Process Product Return |
| Description | Records eligible returned products |
| Inputs | Sale reference, selected items, quantities, reasons, refund and restock disposition |
| Source | Returns page |
| Outputs | Return record and applicable refund information |
| Destination | Returns, Sales, and Inventory records |
| Preconditions | Valid sale exists and employee has permission |
| Actions | Verify eligibility, validate quantities, calculate refund, confirm return, update records |
| Postcondition | Return is saved and eligible restocked inventory is updated |
| Alternative Flow | Invalid, expired, or already returned quantities are rejected |

### F7 — Add or Edit Employee

| Field | Description |
|---|---|
| Function | Manage Employee Account |
| Description | Creates or updates employee access information |
| Inputs | Employee name, email, role, password when applicable, and status |
| Source | Users page |
| Outputs | Updated employee record or validation error |
| Destination | Employee account data store |
| Preconditions | Administrator is signed in |
| Actions | Validate fields, prevent duplicates, save employee |
| Postcondition | Employee list reflects the change |
| Alternative Flow | Duplicate email or prohibited account changes are rejected |

### F8 — Generate Report

| Field | Description |
|---|---|
| Function | Generate Operational Report |
| Description | Displays available business statistics |
| Inputs | Report type and supported filters |
| Source | Reports page |
| Outputs | Summary values, charts, tables, or supported export |
| Destination | Reports interface or downloaded file |
| Preconditions | Administrator is signed in |
| Actions | Read stored records, apply filters, calculate indicators, render results |
| Postcondition | Requested report is displayed |
| Alternative Flow | Empty data produces an appropriate empty-state message |

## 8.2 Tabular Specifications

### Table T1 — Stock Status

| Condition | Out of Stock | Low Stock | In Stock |
|---|---|---|---|
| Quantity | 0 | Greater than 0 and at or below threshold | Above threshold |
| Visual Status | Out of Stock | Low Stock | In Stock |
| Warning | Yes | Yes | No |
| Restocking Priority | Urgent | Recommended | Normal |

### Table T2 — Access by Role

| Function | Admin | Staff | Public Supplier |
|---|---|---|---|
| Employee Login | Yes | Yes | No |
| Dashboard | Yes | Yes, permitted view | No |
| POS Checkout | Yes | Yes | No |
| View Products | Yes | Yes | No |
| Manage Products | Yes | No | No |
| View Inventory | Yes | Yes | No |
| Adjust Inventory | Yes | No | No |
| View Sales | All | Permitted sales | No |
| Process Returns | Yes | If authorized | No |
| Manage Suppliers | Yes | No | No |
| Review Supplier Requests | Yes | No | No |
| Submit Supplier Request | Public form | Public form | Yes |
| View Reports | Yes | No | No |
| Manage Employees | Yes | No | No |
| Configure Settings | Yes | No | No |

### Table T3 — Supplier Request Decisions

| Request State | Admin Action | Result |
|---|---|---|
| Pending | Approve, successful supplier creation/link | Approved |
| Pending | Reject | Rejected |
| Pending | Approval fails | Remains Pending |
| Approved | Approve again | Not permitted |
| Rejected | Reject again | Not permitted |

### Table T4 — Return Decision Rules

| Condition | Expected Result |
|---|---|
| Sale does not exist | Reject return |
| Requested quantity exceeds returnable amount | Reject return |
| Return outside allowed window without override | Reject return |
| Eligible return, item suitable for resale | Record return and restock eligible units |
| Eligible return, item damaged | Record return without returning damaged units to available stock |
| Same units already returned | Prevent duplicate return |

---

# 9. Prototype of All Pages

The Voltix Phase 1 prototype consists of a login interface, operational pages, and a public supplier request page.

## 9.1 Page Index

| ID | Page | File | Access |
|---|---|---|---|
| P1 | Login | `index.html` | Public |
| P2 | Dashboard | `pages/dashboard.html` | Admin, Staff |
| P3 | Point of Sale | `pages/pos.html` | Admin, Staff |
| P4 | Products | `pages/products.html` | Admin, Staff (view) |
| P5 | Inventory | `pages/inventory.html` | Admin, Staff (view) |
| P6 | Sales | `pages/sales.html` | Admin, Staff (permitted view) |
| P7 | Suppliers | `pages/suppliers.html` | Admin |
| P8 | Reports | `pages/reports.html` | Admin |
| P9 | Users | `pages/users.html` | Admin |
| P10 | Settings | `pages/settings.html` | Admin |
| P11 | Returns | `pages/returns.html` | Admin; Staff if permitted |
| P12 | Supplier Request | `supplier-request.html` | Public |

## 9.2 Page Fields and Controls

### P1 — Login

- Employee email.
- Password.
- Sign In button.
- Available password visibility and remembered-email controls.
- Validation messages.
- Link to public Supplier Request page.

### P2 — Dashboard

- Sales and transaction indicators.
- Product and stock information.
- Low-stock notifications.
- Recent activity.
- Quick access to permitted pages.

### P3 — POS

- Product search.
- Product selection.
- Shopping cart.
- Quantity adjustment.
- Transaction calculations.
- Cash/Card selection.
- Complete Sale button.
- Receipt display and printing.

### P4 — Products

- Product list.
- Product search.
- Category filter.
- Product details.
- Add Product.
- Edit Product.
- Delete Product.

Administrative actions are restricted to Admin.

### P5 — Inventory

- Inventory list.
- Stock quantities.
- Low-stock filters and warnings.
- Stock adjustment or replenishment controls.
- Applicable inventory movement information.

### P6 — Sales

- Sales history.
- Transaction reference.
- Date and cashier information.
- Payment method.
- Transaction total.
- Transaction details.
- Supported search and filters.
- Receipt access.

### P7 — Suppliers

**Supplier Management Tab**

- Supplier directory.
- Supplier search and filters.
- Add Supplier.
- Edit Supplier.
- Activate/Deactivate.
- Delete Supplier.
- Supplier contact and product-related information.

**Supplier Requests Tab**

- Submitted requests.
- Request reference.
- Company name.
- Request type.
- Date and status.
- Request details.
- Approve.
- Reject.
- Existing supplier matching/linking.

### P8 — Reports

- Date filters.
- Sales indicators.
- Revenue charts.
- Product performance.
- Cashier performance.
- Available report exports.

### P9 — Users

- Employee table.
- Add Employee.
- Edit Employee.
- Role selection.
- Account status.
- Search and filters.
- Available deletion and account-protection controls.

### P10 — Settings

- Store name and contact details.
- Tax settings.
- Currency preferences.
- Receipt preferences.
- Available stock/POS configuration.
- Data backup export.
- Backup restoration.
- Reset confirmation.

### P11 — Returns

- Sale selection or lookup.
- Eligible sale items.
- Return quantity.
- Return reason.
- Refund information.
- Restock disposition.
- Review and confirmation.
- Return record and receipt information.

### P12 — Supplier Request

- Request type: Become a Supplier / Offer Products.
- Company name.
- Contact person.
- Email.
- Phone.
- Address.
- Product name.
- Product category.
- Quantity.
- Unit price in EGP.
- Expected delivery date.
- Additional notes.
- Submit Request button.
- Validation and confirmation messages.

Product-offer fields are required when Offer Products is selected.

## 9.3 Navigation

When an employee signs in successfully, Voltix opens the operational dashboard.

The navigation menu displays permitted pages according to the employee role.

Unauthorized internal pages are restricted by the prototype's client-side access checks.

External suppliers use the separate public Supplier Request page and do not need to sign in.

## 9.4 Frontend Architecture

Voltix separates its frontend into:

- HTML files for page structure.
- CSS files for presentation and responsive layout.
- JavaScript files for application behavior.
- Browser storage for demonstration data.
- Shared JavaScript modules for applicable store operations.

The Phase 1 prototype does not include a production backend.

---

# 10. Scenarios

## Scenario 1 — Cashier Completes a Sale

**Starting Situation:**

A customer visits Voltix to purchase an electronics product.

**Normal Flow:**

1. Cashier signs in.
2. Opens the POS page.
3. Searches for the requested product.
4. Adds the product to the cart.
5. Adjusts the required quantity.
6. Selects Cash or Card.
7. Completes checkout.
8. Voltix records the transaction.
9. Inventory decreases by the sold quantity.
10. Receipt is displayed.

**Alternative Flow:**

If the requested quantity exceeds allowed stock, checkout is blocked or the quantity must be corrected.

**End State:**

A completed transaction exists and inventory reflects the sale.

## Scenario 2 — Administrator Adds a Product

**Starting Situation:**

A new electronics product must be added to the store catalog.

**Normal Flow:**

1. Admin signs in.
2. Opens Products.
3. Selects Add Product.
4. Enters product information.
5. Saves the record.
6. Voltix validates the information.
7. Product appears in the catalog.

**Alternative Flow:**

Missing or invalid information prevents saving.

**End State:**

A valid product record is available for store operations.

## Scenario 3 — Administrator Restocks Inventory

**Starting Situation:**

An existing product has low stock.

**Normal Flow:**

1. Admin opens Inventory.
2. Finds the low-stock product.
3. Opens the stock adjustment or replenishment interface.
4. Enters the received or adjusted quantity.
5. Confirms the operation.
6. Voltix updates the stock value.

**Alternative Flow:**

Invalid adjustment values are rejected.

**End State:**

Inventory reflects the accepted stock operation.

## Scenario 4 — External Supplier Submits a Product Offer

**Starting Situation:**

A supplier wants to provide electronics products to Voltix.

**Normal Flow:**

1. Supplier opens the public Supplier Request page.
2. Selects Offer Products.
3. Enters company and contact information.
4. Enters product details, quantity, price, and delivery date.
5. Submits the request.
6. Voltix validates the form.
7. The request is recorded as Pending.
8. A submission confirmation is displayed.

**Alternative Flow:**

Invalid values or missing fields prevent submission.

**End State:**

A Pending supplier request exists.

## Scenario 5 — Administrator Approves Supplier Request

**Starting Situation:**

An external supplier has submitted a valid product offer.

**Normal Flow:**

1. Admin signs in.
2. Opens Suppliers.
3. Selects Supplier Requests.
4. Opens the Pending request.
5. Reviews company and product details.
6. Checks whether a supplier record already exists.
7. Approves the request.
8. Voltix links an existing supplier or creates a new supplier record.
9. Request status changes to Approved.

**Alternative Flow:**

The administrator may reject the request, or an approval error may leave it Pending.

**End State:**

The request has a recorded review decision. No inventory has been added merely because it was approved.

## Scenario 6 — Administrator Processes a Return

**Starting Situation:**

A customer requests a return for an item purchased previously.

**Normal Flow:**

1. Admin opens Returns.
2. Finds the original sale.
3. Selects the item and return quantity.
4. Enters a return reason.
5. Chooses the applicable restock disposition.
6. Reviews the refund.
7. Confirms the return.
8. Voltix records the return.
9. Eligible items are restocked when appropriate.

**Alternative Flow:**

Expired or excessive return quantities are rejected unless a supported administrator override applies.

**End State:**

The return and applicable stock adjustments are recorded.

## Scenario 7 — Administrator Generates a Report

**Starting Situation:**

The store owner wants to review sales performance.

**Normal Flow:**

1. Admin opens Reports.
2. Selects an available reporting period.
3. Voltix reads the stored transactions.
4. Revenue and sales indicators are calculated.
5. Charts and tables are displayed.
6. Admin exports a report if the chosen export function is available.

**Alternative Flow:**

When no matching data exists, Voltix displays an appropriate empty state.

**End State:**

The administrator can inspect the requested business information.

## Scenario 8 — Administrator Creates a Staff Account

**Starting Situation:**

A new cashier joins the electronics store.

**Normal Flow:**

1. Admin opens Users.
2. Selects Add Employee.
3. Enters employee details.
4. Assigns the Staff role.
5. Saves the account.
6. The new employee appears in the directory.

**Alternative Flow:**

Duplicate email or invalid account information is rejected.

**End State:**

An employee account exists with the appropriate role.

---

# 11. Use Cases

## 11.1 Actors

### Primary Actors

**Administrator**

Manages products, inventory, suppliers, employees, reports, store settings, and authorized sales/returns operations.

**Staff / Cashier**

Performs permitted daily store operations, particularly sales checkout and product/inventory viewing.

**External Supplier**

Submits applications or product offers through a public web form.

### Secondary Components

- Browser storage.
- Sales and inventory data modules.
- Receipt generation functionality.
- Reporting functionality.

These are supporting components, not human user roles.

## 11.2 Use Case Catalog

| ID | Use Case | Actor |
|---|---|---|
| UC1 | Sign In / Sign Out | Admin, Staff |
| UC2 | View Dashboard | Admin, Staff |
| UC3 | Manage Products | Admin |
| UC4 | View Inventory | Admin, Staff |
| UC5 | Adjust Inventory | Admin |
| UC6 | Complete POS Sale | Admin, Staff |
| UC7 | View Sales History | Admin, Staff |
| UC8 | Process Return | Admin, authorized Staff |
| UC9 | Manage Suppliers | Admin |
| UC10 | Submit Supplier Request | External Supplier |
| UC11 | Review Supplier Request | Admin |
| UC12 | Generate Reports | Admin |
| UC13 | Manage Employee Accounts | Admin |
| UC14 | Configure Store Settings | Admin |
| UC15 | Export / Restore Prototype Data | Admin |

## 11.3 Detailed Use Case — UC6: Complete POS Sale

| Item | Description |
|---|---|
| Use Case | Complete POS Sale |
| Actor | Admin or Staff |
| Preconditions | User is authenticated; product records are available |
| Trigger | Customer requests checkout |
| Main Flow | Search product → Add to cart → Adjust quantity → Choose payment method → Confirm checkout → Record transaction → Update inventory → Generate receipt |
| Alternative Flow | Invalid quantity or insufficient stock prevents completion |
| Postcondition | Sale is recorded and affected inventory quantities are updated |

## 11.4 Detailed Use Case — UC10: Submit Supplier Request

| Item | Description |
|---|---|
| Use Case | Submit Supplier Request |
| Actor | External Supplier |
| Preconditions | Public Supplier Request page is available |
| Trigger | Supplier selects the submission form |
| Main Flow | Select request type → Enter details → Submit → Validate → Generate reference → Save Pending request |
| Alternative Flow | Missing or invalid fields produce validation errors |
| Postcondition | Supplier request is saved with Pending status |

## 11.5 Detailed Use Case — UC11: Review Supplier Request

| Item | Description |
|---|---|
| Use Case | Review Supplier Request |
| Actor | Administrator |
| Preconditions | Admin is signed in; Pending request exists |
| Trigger | Admin opens a supplier request |
| Main Flow | Open request → Review information → Check supplier match → Approve or Reject → Save decision |
| Alternative Flow | Supplier creation/linking fails; request remains Pending or reports a recoverable partial-save issue |
| Postcondition | Review status is stored; supplier directory is updated where appropriate |
| Business Rule | Inventory remains unchanged |

## 11.6 Detailed Use Case — UC8: Process Return

| Item | Description |
|---|---|
| Use Case | Process Return |
| Actor | Administrator or authorized Staff |
| Preconditions | Valid eligible sale exists |
| Trigger | Customer requests return |
| Main Flow | Find sale → Select items → Enter quantity and reason → Review refund/restock → Confirm return |
| Alternative Flow | Invalid, excessive, or ineligible return is rejected |
| Postcondition | Return record is created and applicable inventory adjustment is applied |

## 11.7 Detailed Use Case — UC3: Manage Products

| Item | Description |
|---|---|
| Use Case | Manage Products |
| Actor | Administrator |
| Preconditions | Admin is authenticated |
| Trigger | Admin opens Product Management |
| Main Flow | View catalog → Add/Edit/Delete product → Validate information → Save changes |
| Alternative Flow | Invalid or conflicting data prevents the operation |
| Postcondition | Product catalog reflects the completed change |

## 11.8 Detailed Use Case — UC12: Generate Reports

| Item | Description |
|---|---|
| Use Case | Generate Reports |
| Actor | Administrator |
| Preconditions | Admin is authenticated |
| Trigger | Admin opens Reports |
| Main Flow | Select report/period → Retrieve stored records → Calculate statistics → Display results → Export if available |
| Alternative Flow | No matching records produces an empty-state message |
| Postcondition | Requested information is displayed or exported |

## 11.9 Use Case Relationships

- **Complete POS Sale** includes product selection, stock validation, transaction recording, and inventory deduction.
- **Process Return** includes sale lookup, eligibility checking, refund calculation, and applicable restocking.
- **Review Supplier Request** may include creating or linking a supplier record.
- **Manage Products** includes adding, updating, and deleting product records.
- **Generate Reports** includes reading and aggregating relevant sales information.
- **Manage Employee Accounts** includes role assignment and account status management.

---

# Phase 1 Implementation Boundary

Voltix Phase 1 demonstrates the specified system through HTML, CSS, JavaScript, and browser-based data persistence.

The project includes frontend pages and client-side business workflows for the documented modules.

The following limitations apply:

1. The authentication and permission model is browser-based and is not production-secure.
2. Supplier submissions are stored locally within the same browser origin rather than transmitted to a shared server.
3. Electronic payment methods are recorded as transaction information; no real banking integration is performed.
4. Backup and restoration operate on supported prototype data.
5. Production deployment would require a backend, shared database, secure authentication, server-side authorization, and appropriate transaction controls.

These boundaries distinguish the Phase 1 demonstration from a production-ready retail management platform.

---

**End of Software Requirements Specification**

**Project:** Voltix — Electronics Store POS & Inventory Management System  
**Version:** 1.0  
**Academic Phase:** Phase 1  
**Date:** October 2026
