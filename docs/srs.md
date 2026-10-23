# SOFTWARE REQUIREMENTS SPECIFICATION

## VOLTIX — Electronics Store POS & Inventory Management System

**Version 1.0**  
**Date:** October 2026  
**Project:** Voltix Physical Electronics Store Management Platform  
**Target Submission:** SWE Phase 1  
**Team:** Member 1 (Auth & Dashboard), Member 2 (Products & Inventory), Member 3 (POS & Sales), Member 4 (Reports, Users & Settings)  

---

## Contents
1. [Preface](#1-preface)
2. [Introduction](#2-introduction)
3. [Similar Systems](#3-similar-systems)
4. [Functional User Requirements](#4-functional-user-requirements)
5. [Functional System Requirements](#5-functional-system-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Glossary](#7-glossary)
8. [Form-Based and Tabular Specification](#8-form-based-and-tabular-specification)
9. [Prototype of All Pages](#9-prototype-of-all-pages)
10. [Scenarios](#10-scenarios)
11. [Use Cases](#11-use-cases)

---

## 1. Preface

This document is the Software Requirements Specification (SRS) for **Voltix**, a dedicated Point of Sale (POS) and Inventory Management System designed for physical electronics retail stores. It serves as the official specification for Course Instructors, Teaching Assistants, developers implementing Phase 2 capabilities, and store operators.

### How to Read This Document
- **Section 2** introduces the business problem, solution scope, and measurable targets.
- **Section 3** benchmarks Voltix against existing commercial and open-source store systems.
- **Sections 4 and 5** detail user expectations and formal system requirements.
- **Section 6** outlines non-functional constraints including performance, security, and accessibility.
- **Section 7** defines standard retail and technical terminology in a glossary.
- **Section 8** provides structured form-based and decision-table specifications.
- **Section 9** cataloges prototype pages, layout structure, and interactive controls.
- **Section 10** walks through end-to-end operational scenarios.
- **Section 11** formalizes core use cases and actor interactions.

### Revision History
| Version | Date | Authors | Description |
| :--- | :--- | :--- | :--- |
| 0.1 | October 2026 | Team Voltix | Initial structural draft and feature scope allocation. |
| 1.0 | October 2026 | Team Voltix (Coordination: Member 4) | Complete Phase 1 SRS submission with finalized 11-section specifications. |

---

## 2. Introduction

### 2.1 Problem
Physical electronics retailers manage high-value inventory with diverse technical specifications, warranties, serial/SKU variations, and rapid price depreciation. Many small-to-medium physical retailers still operate using generic spreadsheets, paper logs, or overly complex multi-branch cloud ERPs that require continuous internet connectivity, recurring subscription fees, and steep employee training curves. 

When inventory counts are desynchronized from the cash register, store owners face stock discrepancies, undetected theft, delayed reordering of high-demand items, and an inability to track cashier sales productivity or financial margins accurately.

### 2.2 Purpose and Scope
**Voltix** is a streamlined, client-side Point of Sale and Inventory Management desktop-web system engineered specifically for physical brick-and-mortar electronics stores.

- **In Scope:**
  - Role-based employee authentication (Store Administrator and Staff / Cashier).
  - Centralized store dashboard with daily financial and stock health widgets.
  - Interactive Point of Sale (POS) checkout interface with real-time barcode / product search and instant receipt creation.
  - Comprehensive Product catalog and live stock inventory tracking with low-stock warnings.
  - Sales transaction logging, payment method tracking (Cash vs. Card), and customer receipts.
  - Supplier directory management for inventory procurement.
  - Business intelligence reports (Sales revenue trends, inventory valuation, bestseller ranking, cashier performance).
  - Employee management (Account provisioning, credential management, role assignment, suspension).
  - Store configuration (Tax rates, currency symbols, receipt policies, threshold parameters, data backups).
  - Local client storage persistence (`localStorage`) enabling zero-latency offline retail operation without external databases.

- **Out of Scope:**
  - Online eCommerce / public shopping cart / customer-facing web ordering.
  - Real-world electronic payment gateway card processing (e.g., live Stripe/Visa chip terminal hardware integration).
  - Automated shipping courier APIs.
  - Multi-store corporate enterprise franchise replication.

### 2.3 What Makes the Solution Innovative
- **Zero-Dependency Lightweight Architecture:** Built strictly with native HTML5, modern CSS3, and vanilla JavaScript without bulky frameworks or external runtime dependencies.
- **Instant Client-Side Persistence:** Real-time data consistency across products, inventory, POS sales, and analytics through an organized local schema.
- **Role-Tailored Workspaces:** Automatic interface adaptation that enforces permission boundaries while retaining a consistent, accessible user experience.
- **Integrated Audit Trail & Backup Utilities:** One-click JSON data export and import that allows physical stores to safeguard and migrate their operational records effortlessly.

### 2.4 Measurable Benefits
| Measure | Baseline (Spreadsheets / Paper) | Voltix Target |
| :--- | :--- | :--- |
| **Checkout Duration** | 2 to 4 minutes per transaction | Under 30 seconds from product scan to receipt generation |
| **Stock Discrepancy Rate** | Up to 15% unaccounted shrinkage | Reduced to under 1% through automatic stock decrement upon sale |
| **Inventory Valuation Audit** | 4 to 8 hours of manual inventory calculation | Instantaneous (< 1 second) valuation in Analytics Report |
| **New Cashier Onboarding** | 2 to 3 days of POS training | Operational within 15 minutes of guided walkthrough |
| **System Cold-Start Launch** | 10 to 30 seconds for heavy desktop POS | Instant (< 1 second) browser load |

---

## 3. Similar Systems

| System | What It Does | Limitations Compared to Voltix |
| :--- | :--- | :--- |
| **Square for Retail** | Cloud-based commercial POS with integrated payments. | Requires active internet connectivity, mandatory subscription fees, and proprietary hardware; non-customizable data schemas. |
| **Odoo POS** | Open-source ERP module with multi-warehouse management. | Extremely heavy backend setup (Python/PostgreSQL), high server maintenance overhead, complex configuration unsuitable for independent electronics shops. |
| **Vend / Lightspeed** | Retail inventory and sales register software. | Expensive recurring monthly pricing, slow interface loading on basic counter hardware, rigid receipt layout customization. |
| **Manual Excel Spreadsheets** | Manual tabular logging of products, sales, and supplies. | High error vulnerability, no concurrent prevention of negative stock, zero role enforcement, no automated receipt creation. |

---

## 4. Functional User Requirements

Priority levels: **H** (High / Core MVP), **M** (Medium), **L** (Low).

### 4.1 All Authenticated Users
| ID | The user shall be able to: | Priority |
| :--- | :--- | :--- |
| **UR1** | Sign in securely using registered store credentials (email and password). | H |
| **UR2** | View their assigned role and profile identity in the persistent workspace header. | H |
| **UR3** | Safely sign out, terminating the active workstation session. | H |
| **UR4** | Access responsive navigation links permitted for their role. | H |
| **UR5** | Toggle mobile/tablet sidebar navigation drawers on touch or smaller displays. | M |

### 4.2 Staff (Cashier)
| ID | The staff member shall be able to: | Priority |
| :--- | :--- | :--- |
| **UR6** | View the store operational dashboard with cashier-relevant metrics. | H |
| **UR7** | Search the product catalog by SKU, name, or category and verify remaining stock. | H |
| **UR8** | Add items to an active POS shopping cart with quantity adjustments. | H |
| **UR9** | Process customer checkout selecting Cash or Card payment methods. | H |
| **UR10**| Generate and print itemized customer sales receipts upon transaction completion. | H |
| **UR11**| View read-only inventory lists and their personal sales transaction logs. | M |

### 4.3 Administrator
| ID | The administrator shall be able to: | Priority |
| :--- | :--- | :--- |
| **UR12**| View store-wide aggregate revenue, transaction counts, and stock warning statistics. | H |
| **UR13**| Create, update, and delete product catalog records including price and minimum stock limits. | H |
| **UR14**| Manually adjust inventory stock counts and restock replenishment batches. | H |
| **UR15**| Manage product supplier information (names, contact numbers, supplied categories). | M |
| **UR16**| View complete store transaction histories from all cashiers. | H |
| **UR17**| Provision new employee accounts, assign roles (Admin or Staff), and update passwords. | H |
| **UR18**| Suspend or delete employee accounts without losing previous transaction attribution. | H |
| **UR19**| View analytical sales revenue trends, category breakdown charts, and bestseller lists. | H |
| **UR20**| Export financial sales summaries and audit journals to CSV files. | M |
| **UR21**| Print formatted analytical store audit reports. | M |
| **UR22**| Configure store profile information, tax rates, currency symbols, and backup database state. | H |

---

## 5. Functional System Requirements

Structured natural language format: *The system shall [action] when [condition/trigger].*

### 5.1 Authentication & Session Management (UR1 to UR5)
- **SR1.1:** The system shall validate submitted login credentials against stored user accounts and open the employee workspace when valid.
- **SR1.2:** The system shall reject invalid email or password attempts with a descriptive, accessible error message without disclosing user existence.
- **SR1.3:** The system shall store the active user's session in browser session storage (`voltix.session`) excluding plaintext passwords.
- **SR1.4:** The system shall redirect unauthenticated visitors directly to the login portal (`index.html`) upon attempting to access internal pages.
- **SR1.5:** The system shall restrict navigation sidebar items dynamically based on the active session role.
- **SR1.6:** The system shall terminate active session tokens and redirect to the login screen when the user clicks "Log out".

### 5.2 User & Employee Management (UR17 to UR18)
- **SR2.1:** The system shall allow an administrator to view a filtered table of all registered employees displaying name, email, employee ID, role, status, and last active timestamp.
- **SR2.2:** The system shall allow an administrator to create a new employee with a unique email address, role (Admin/Staff), and minimum 6-character password.
- **SR2.3:** The system shall reject duplicate employee email registrations with an alert naming the conflict.
- **SR2.4:** The system shall allow an administrator to modify employee details and optionally update passwords without re-entering existing credentials.
- **SR2.5:** The system shall prohibit an administrator from deleting or suspending their own account or removing the last active administrator.
- **SR2.6:** The system shall deny non-admin users access to `users.html` and present an explicit permissions restriction banner.

### 5.3 Product & Inventory Management (UR7, UR13, UR14)
- **SR3.1:** The system shall maintain consistent product records containing ID, SKU, product name, category, retail price, stock quantity, and minimum stock threshold.
- **SR3.2:** The system shall flag any product whose current stock is less than or equal to its minimum threshold as "Low Stock".
- **SR3.3:** The system shall allow administrators to create, edit, and delete products, updating inventory totals in real time.
- **SR3.4:** The system shall prevent non-admin staff from executing create, update, or delete operations on product catalog data.

### 5.4 Point of Sale (POS) & Checkout (UR8 to UR10)
- **SR4.1:** The system shall allow cashiers to quickly search and add in-stock products to an active sales cart.
- **SR4.2:** The system shall recalculate subtotal, tax amount (based on store tax rate setting), and grand total immediately upon cart modification.
- **SR4.3:** The system shall prevent adding items exceeding available on-hand stock when "Prevent Out-of-Stock Sale" is enabled in settings.
- **SR4.4:** The system shall record completed sales with a unique transaction ID (`TX-XXXX`), timestamp, cashier name, itemized products, and payment tender.
- **SR4.5:** The system shall automatically decrement product inventory counts according to purchased quantities when checkout completes.
- **SR4.6:** The system shall generate a printable customer receipt containing store details, tax ID, line items, and receipt policy notes.

### 5.5 Sales History & Transactions (UR11, UR16)
- **SR5.1:** The system shall append every finalized sale to the permanent `voltix.sales` transaction journal.
- **SR5.2:** The system shall allow administrators to inspect sales from all store cashiers.
- **SR5.3:** The system shall filter sales viewable by cashier staff to transactions processed by their own account.

### 5.6 Reports & Analytics (UR19 to UR21)
- **SR6.1:** The system shall compute total revenue, transaction counts, average order value (AOV), and total units sold for filtered date ranges (Today, 7 Days, 30 Days, All Time, Custom).
- **SR6.2:** The system shall render a daily revenue trend bar chart showing financial turnover progression.
- **SR6.3:** The system shall display payment method distribution percentages (Cash vs. Card).
- **SR6.4:** The system shall rank top-selling products by units sold and generated revenue.
- **SR6.5:** The system shall generate a cashier performance leaderboard displaying transaction counts, items sold, and total revenue per employee.
- **SR6.6:** The system shall export filtered transaction audit logs into standard CSV file downloads.

### 5.7 System Settings & Data Management (UR22)
- **SR7.1:** The system shall persist store identity information (store name, branch, phone, email, address, tax ID) in `voltix.settings`.
- **SR7.2:** The system shall apply configured sales tax rates and currency symbols across the POS, Reports, and receipts.
- **SR7.3:** The system shall export a complete system backup JSON file containing all users, products, sales, and configuration keys upon request.
- **SR7.4:** The system shall validate and restore system records from an uploaded valid Voltix backup JSON file.
- **SR7.5:** The system shall provide a confirmed factory reset utility that re-initializes clean demo datasets.

### 5.8 Supplier Management (UR15)
- **SR8.1:** The system shall store supplier records including supplier name, contact person, phone number, email, and supply categories.
- **SR8.2:** The system shall restrict supplier management operations to administrators.

---

## 6. Non-Functional Requirements

| ID | Category | Requirement | How It Is Measured |
| :--- | :--- | :--- | :--- |
| **NFR1** | **Performance** | All prototype pages shall render and become interactive in under 1 second on standard desktop hardware. | Browser performance audit (Lighthouse / DevTools DOMContentLoaded < 1000ms). |
| **NFR2** | **Performance** | POS search filtering and cart calculation shall update in under 50 milliseconds. | Timed console execution test on 500-item catalog. |
| **NFR3** | **Security** | Employee passwords shall never be saved in plain text in browser session storage (`voltix.session`). | Storage inspection test during active sessions. |
| **NFR4** | **Security** | Role-based permission checks shall guard all administrative actions and pages (`users.html`, `reports.html`, `settings.html`). | Automated route and button accessibility verification for staff sessions. |
| **NFR5** | **Privacy** | Cashier staff shall only be permitted to view their own sales logs on standard records views. | Role-filtered dataset rendering tests. |
| **NFR6** | **Reliability** | All business mutations (sales, stock deductions, user edits) shall persist synchronously to `localStorage`. | Browser reload resilience test post-transaction. |
| **NFR7** | **Data Integrity** | Transaction totals shall strictly match the mathematical sum of line items plus configured tax. | Automated currency round-off test cases. |
| **NFR8** | **Usability** | A new cashier shall complete an end-to-end sale and print a receipt in under 45 seconds without prior training. | Usability trial with 3 test users. |
| **NFR9** | **Accessibility** | All text and visual elements shall adhere to WCAG 2.1 AA color contrast standards (minimum 4.5:1 ratio). | Axe / Lighthouse Accessibility score ≥ 95. |
| **NFR10**| **Accessibility** | All modal dialogs and form controls shall be operable via keyboard navigation (Tab, Enter, Escape). | Manual keyboard navigation audit. |
| **NFR11**| **Compatibility**| The system shall operate without layout breakage on the latest two versions of Chrome, Edge, Safari, and Firefox. | Cross-browser automated verification. |
| **NFR12**| **Responsive UI**| The layout shall adapt responsively from mobile displays (360px) to ultra-wide desktop monitors (1920px+). | Viewport resizing tests across breakpoints (360px, 768px, 980px, 1400px). |
| **NFR13**| **Maintainability**| Codebase shall follow vanilla modular separation (HTML, CSS, JS) without external library bloat. | Code review verifying 0 external script/CSS dependencies. |
| **NFR14**| **Fault Tolerance**| The application shall gracefully handle missing or corrupted `localStorage` keys by auto-healing with valid default schemas. | Simulated storage corruption test. |
| **NFR15**| **Scalability** | The client database shall comfortably support at least 1,000 products and 5,000 historical sales transactions without performance lag. | Memory profile benchmark with synthetic records. |

---

## 7. Glossary

| Term | Meaning |
| :--- | :--- |
| **Voltix** | The brand and platform name of the physical electronics store POS & inventory management system. |
| **POS** | Point of Sale: The electronic counter terminal where cashier staff ring up customer purchases, calculate totals, and record payments. |
| **SKU** | Stock Keeping Unit: A unique alphanumeric identifier assigned to each distinct product model in the inventory. |
| **AOV** | Average Order Value: Key financial metric defined as total gross sales revenue divided by total transaction count. |
| **Low-Stock Threshold** | The minimum safe quantity of a product; when on-hand inventory drops to or below this count, visual alerts are triggered. |
| **Shrinkage** | Unaccounted loss of inventory resulting from theft, clerical error, or unrecorded damage. |
| **VAT / Sales Tax** | Value-Added Tax: A mandatory percentage levy applied to retail transactions and itemized on customer receipts. |
| **RBAC** | Role-Based Access Control: System architecture that restricts page and action permissions based on whether a user is an Admin or Staff. |
| **Client Storage** | Browser `localStorage` and `sessionStorage` web APIs utilized for local demo database and session tokens without backend servers. |
| **Tender Method** | The payment mechanism used by the customer to settle an order (e.g., Cash or Credit/Debit Card). |
| **Inventory Valuation** | The cumulative monetary retail or cost value of all inventory assets currently on hand. |

---

## 8. Form-Based and Tabular Specification

### 8.1 Form-Based Specifications

#### Function: Manage Employee Account (Add / Edit User)
| Field | Description |
| :--- | :--- |
| **Description** | Creates a new store employee profile or updates an existing employee's role, status, and credentials. |
| **Inputs** | Full Name, Employee ID (auto-generated or manual), Email Address, Role (Admin or Staff), Status (Active or Suspended), Password, Phone Number. |
| **Source** | Employee Modal Form (`pages/users.html`). |
| **Outputs** | Confirmation toast notification; updated employee row in the users data table. |
| **Destination** | `voltix.users` stored in browser `localStorage`. |
| **Action** | 1. Validate mandatory fields (non-empty name, valid email regex, password minimum 6 chars for new users).<br>2. Check for duplicate email addresses.<br>3. Prevent self-suspension or self-removal of admin privileges.<br>4. Persist updated user object array to storage.<br>5. Refresh user table and statistics metrics. |
| **Requires** | Active session with `admin` role. |
| **Precondition** | Administrator is logged in and opens the Employee Management page. |
| **Postcondition** | User record is securely stored and available for authentication or cashier attribution. |
| **Side Effects** | Updates user metric counters (Total Employees, Active Admins, Cashiers, Active Accounts). |

---

#### Function: Generate Store Sales & Revenue Report
| Field | Description |
| :--- | :--- |
| **Description** | Analyzes transaction history to compute gross revenue, order volume, payment breakdowns, bestsellers, and cashier metrics. |
| **Inputs** | Selected date preset (Today, 7 Days, 30 Days, All Time) or custom Date Start and Date End. |
| **Source** | Reports toolbar controls (`pages/reports.html`) and `voltix.sales` in `localStorage`. |
| **Outputs** | Metric cards (Revenue, Orders, AOV, Units), daily sales bar chart, payment share meters, bestsellers table, cashier ranking table, downloadable CSV file. |
| **Destination** | Reports DOM panels (`#view-sales`, `#view-products`, `#view-staff`) and downloaded CSV file. |
| **Action** | 1. Filter sales records matching the chosen date boundary.<br>2. Sum revenue and tally item quantities.<br>3. Compute daily revenue buckets and scale chart bar heights.<br>4. Calculate payment method percentages.<br>5. Rank top products by volume and employees by sales total. |
| **Requires** | Active session with `admin` role. |
| **Precondition** | Sales records exist in storage or default dataset is loaded. |
| **Postcondition** | Visual analytics and audit logs render dynamically. |
| **Side Effects** | None (read-only analytical computation). |

---

#### Function: Configure Store Settings
| Field | Description |
| :--- | :--- |
| **Description** | Updates store business identity, tax rates, currency format, receipt messages, stock alert rules, and backup data. |
| **Inputs** | Store Name, Branch Tagline, Phone, Email, Address, Tax ID, Currency Symbol, Tax Rate %, Receipt Header/Footer, Toggle switches, Low-stock threshold. |
| **Source** | System Settings Form (`pages/settings.html`). |
| **Outputs** | Visual confirmation toast; updated system defaults. |
| **Destination** | `voltix.settings` in `localStorage`. |
| **Action** | 1. Sanitize string inputs.<br>2. Enforce non-negative tax rate and minimum stock threshold ≥ 1.<br>3. Save configuration object to `voltix.settings`.<br>4. Recalculate storage utilization metrics. |
| **Requires** | Active session with `admin` role. |
| **Precondition** | Administrator is logged in and opens Settings. |
| **Postcondition** | Updated tax, currency, and receipt policies take effect immediately across all modules. |
| **Side Effects** | Affects subsequent POS tax calculation, inventory alerts, and receipt printing. |

---

### 8.2 Tabular Specifications

#### Table T1: Stock Level & Warning Decision Table
| Condition | Case 1 (Out of Stock) | Case 2 (Low Stock) | Case 3 (Normal Stock) |
| :--- | :--- | :--- | :--- |
| **Current Stock Quantity** | $= 0$ | $> 0$ and $le$ Threshold | $>$ Threshold |
| **Threshold Limit (Default: 5)** | Any | Configured limit | Configured limit |
| **Inventory Status Badge** | Out of Stock (Red) | Low Stock (Yellow/Orange) | In Stock (Green) |
| **Flagged on Dashboard Watch** | Yes | Yes | No |
| **POS Addition Allowed** | No (if prevented) | Yes (with warning) | Yes |
| **Procurement Reorder Flag** | Urgent | Warning | Adequate |

---

#### Table T2: Role-Based Access Control (RBAC) Matrix
| Function / Page | Staff (Cashier) | Administrator |
| :--- | :--- | :--- |
| **Sign in / Sign out** | Yes | Yes |
| **View Dashboard** | Yes (Cashier overview) | Yes (Store-wide overview) |
| **Point of Sale (POS) Checkout** | Yes | Yes |
| **View Products Catalog** | Yes (Read-only) | Yes (Full CRUD) |
| **View Stock Inventory** | Yes (Read-only) | Yes (Full CRUD & Restock) |
| **View Sales Transactions** | Yes (Own sales only) | Yes (All store cashiers) |
| **Manage Suppliers** | No | Yes |
| **View Financial Reports & Analytics** | No | Yes |
| **Export CSV Sales Reports** | No | Yes |
| **Manage Employee Accounts (Users)** | No | Yes |
| **Configure System Settings** | No | Yes |
| **System Backup & Factory Reset** | No | Yes |

---

## 9. Prototype of All Pages

### Page Index
| ID | Page Name | File Path | Permitted Roles | Description |
| :--- | :--- | :--- | :--- | :--- |
| **P1** | **Sign In** | `index.html` | Public | Employee authentication portal with demo account hints. |
| **P2** | **Dashboard** | `pages/dashboard.html` | Staff, Admin | Central overview of daily transactions, stock watch, and quick actions. |
| **P3** | **Point of Sale (POS)** | `pages/pos.html` | Staff, Admin | Live product scan, cart assembly, checkout, and receipt printing. |
| **P4** | **Products** | `pages/products.html` | Staff (view), Admin (CRUD) | Electronics catalog management, SKU pricing, and categorization. |
| **P5** | **Inventory** | `pages/inventory.html` | Staff (view), Admin (CRUD) | Stock level tracking, threshold warnings, and restocking batches. |
| **P6** | **Sales History** | `pages/sales.html` | Staff (own), Admin (all) | Transaction audit journal, itemized receipts, and payment method logs. |
| **P7** | **Suppliers** | `pages/suppliers.html` | Admin | Procurement contacts and vendor directory. |
| **P8** | **Reports & Analytics** | `pages/reports.html` | Admin | Revenue trends, charts, bestsellers, cashier metrics, and CSV export. |
| **P9** | **Employee Management**| `pages/users.html` | Admin | Employee accounts, role assignment, status toggling, and credentials. |
| **P10**| **System Settings** | `pages/settings.html` | Admin | Store profile, tax rates, POS defaults, and JSON data backup utilities. |

---

### Page Fields and Interactive Controls
| Page | Primary Fields and Interactive Controls |
| :--- | :--- |
| **Sign In (`index.html`)** | Email input, Password input, Show/Hide password toggle, Remember email checkbox, Submit Sign In button, validation error callouts. |
| **Dashboard (`dashboard.html`)** | Stat cards (Products, Today's Sales, Revenue, Low Stock), Recent Transactions table, Low Stock list, Quick Action links, User identity avatar. |
| **POS (`pos.html`)** | Product search input, Category filter pills, Product item cards with Add button, Cart drawer with quantity spinners (+/-), Subtotal/Tax/Grand Total, Cash/Card tender buttons, Complete Sale button, Receipt Modal with Print action. |
| **Products (`products.html`)** | Search bar, Category dropdown, Add Product button, Product table (Name, SKU, Category, Price, Stock, Actions), Edit/Delete modals. |
| **Inventory (`inventory.html`)** | Filter by Stock Level (All, Low Stock, Out of Stock), Stock adjustment modal, Restock quantity input, Min threshold field. |
| **Sales (`sales.html`)** | Date filter, Search by Transaction ID/Cashier, Transactions table, Itemized sale inspection drawer, Print Receipt button. |
| **Suppliers (`suppliers.html`)** | Add Supplier button, Supplier table (Company, Contact Person, Phone, Email, Supplied Category), Edit/Delete modals. |
| **Reports (`reports.html`)** | Date preset pills (Today, 7 Days, 30 Days, All Time), Custom Date picker, Export CSV button, Print Audit button, Report Tabs (Sales, Products, Staff), Daily revenue bar chart, Payment split bars, Bestsellers table, Cashier leaderboard. |
| **Users (`users.html`)** | Search input (name/email/ID), Role filter dropdown, Status filter dropdown, Add Employee button, Employee table, Edit modal, Password input with Show/Hide, Status toggle button, Delete confirmation dialog, Toast notifications. |
| **Settings (`settings.html`)** | Store Profile inputs (Name, Branch, Phone, Email, Address, Tax ID), POS inputs (Currency selector, Tax rate %, Receipt Header/Footer), Toggles (Auto-print, Scan beep, Prevent negative stock, Auto deduct), Backup Export button, JSON Restore file input, Factory Reset button. |

---

### Navigation Architecture
- **Unauthenticated Flow:** Directs to Sign In (`index.html`). Successful login stores active session and routes to `pages/dashboard.html`.
- **Role-Based Navigation:** The shared sidebar (`#app-sidebar`) renders only role-permitted links according to Table T2. Staff members see Dashboard, POS, Products (View), Inventory (View), and Sales. Administrators see the full suite including Suppliers, Reports, Users, and Settings.
- **Direct URL Protection:** Direct access to administrative pages by cashier accounts triggers a prominent "Admin Privileges Required" card and hides sensitive business data.

---

## 10. Scenarios

### Scenario 1: Administrator Analyzes Store Revenue and Exports Audit Report
- **Start:** Store Administrator Omar is signed into the Voltix workspace at week's end.
- **Normal Flow:** Omar navigates to **Reports & Analytics** (`reports.html`). The page computes metrics for the "Last 7 Days" by default. Omar reviews the Gross Revenue ($9,193.93), Total Transactions, and Average Order Value. He examines the visual daily sales bar chart to identify peak trading days and checks the payment breakdown showing 75% card vs. 25% cash. Switching to the "Cashier Performance" tab, he audits individual staff sales figures. Finally, Omar clicks **Export CSV** to download `voltix-sales-report.csv` for store bookkeeping and prints a clean paper copy via **Print Audit**.
- **What Can Go Wrong:** No sales were recorded during a selected custom date range. The system cleanly displays an empty data table message without crashing, disabling empty export attempts with an informative alert.
- **Other Activities:** Omar switches to the "Products & Inventory" tab to inspect current store valuation before making procurement orders.
- **End State:** Analytical audit is verified, exported, and filed.

---

### Scenario 2: Administrator Provisions a New Cashier Account
- **Start:** A new employee, Alex Morgan, is hired as an evening cashier. Admin user Omar is logged in.
- **Normal Flow:** Omar clicks **Users** in the sidebar to open Employee Management (`users.html`). He clicks **Add Employee**. The modal dialog opens and automatically populates the next employee code (`EMP-006`). Omar enters Alex's name, email (`alex.m@voltix.test`), selects role "Staff (Cashier)", enters an initial password (`Alex2026!`), and enters Alex's phone number. Upon clicking **Save Employee**, the system validates the email format, verifies no duplicate exists, appends the record to `voltix.users`, displays a green success toast, and refreshes the employee table. Alex can now log in at the front POS register.
- **What Can Go Wrong:** Omar mistakenly types an email address already assigned to another cashier. The modal remains open, highlights the email field, and shows: *"Email alex.m@voltix.test is already used by another employee."*
- **Other Activities:** If Alex forgets his credentials later, Omar opens Alex's edit form and enters a replacement password.
- **End State:** New cashier account is active with restricted staff privileges.

---

### Scenario 3: Administrator Updates Store Tax Rate and Stock Thresholds
- **Start:** The local municipal sales tax updates from 14% to 15%, and management decides to raise the low-stock alert trigger to 8 units.
- **Normal Flow:** The store administrator opens **System Settings** (`settings.html`). In the "POS & Receipts" card, he updates the Sales Tax Rate field to `15.0`. In the "Inventory & Alert Thresholds" card, he adjusts the Default Low-Stock Warning Threshold to `8`. He clicks **Save Changes**. The system validates the inputs, updates `voltix.settings`, and displays a confirmation toast. The next POS checkout immediately applies 15% tax, and the inventory page highlights items with 8 or fewer units remaining.
- **What Can Go Wrong:** The user accidentally types a negative tax percentage (`-5%`). The system catches the invalid value and resets it safely to `0%`.
- **Other Activities:** The admin clicks **Export Backup** to save a timestamped JSON snapshot of all store records to an external drive.
- **End State:** New financial and inventory rules are active throughout the store system.

---

### Scenario 4: Cashier Processes In-Store Sale and Prints Receipt
- **Start:** Cashier Sarah is logged into the POS register (`pos.html`). A customer approaches with a pair of Sony wireless headphones and a mouse.
- **Normal Flow:** Sarah searches "Sony" in the product search box and clicks "Add to Cart". She then scans the mouse SKU. The cart updates in real time, showing line items, itemized subtotal, configured sales tax, and final total. Sarah asks the customer for payment method and clicks "Card". She clicks "Complete Sale". The system deducts the units from on-hand stock in `voltix.products`, creates transaction `TX-9042` under Sarah's cashier name in `voltix.sales`, and opens the formatted receipt modal. Sarah prints the receipt on the thermal receipt printer and hands it to the customer.
- **What Can Go Wrong:** An item the customer brings is out of stock in the system. The POS displays an "Out of Stock" warning and prevents checkout, prompting Sarah to check with the warehouse.
- **End State:** Stock is deducted, sale is journaled, and customer receives receipt.

---

### Scenario 5: Administrator Performs Full System Backup and Demo Reset
- **Start:** The administrator wants to archive the store's demo dataset before testing bulk inventory imports.
- **Normal Flow:** The administrator opens **Settings** and navigates to the "Data Management & Demo Utilities" section. He inspects the local storage status pill showing current records and storage footprint. He clicks **Export Backup**, downloading a clean JSON file containing all users, products, sales, and settings. Later, after running tests, he clicks **Reset Demo Data**. A confirmation dialog appears explaining the operation. The admin confirms, resetting all keys to clean initial factory records and reloading the workspace.
- **What Can Go Wrong:** A user uploads an invalid non-JSON text file when trying to restore. The restore handler rejects the file with *"Invalid Voltix backup file format"* without corrupting current storage.
- **End State:** System data is safely archived and restored.

---

## 11. Use Cases

### Primary & Secondary Actors
- **Store Administrator (Admin):** Primary actor with full operational, personnel, and administrative privileges.
- **Staff (Cashier):** Primary actor handling front-counter customer sales, cart operations, and stock queries.
- **Customer:** Secondary external beneficiary receiving itemized sales receipts.
- **Browser LocalStorage Engine:** Secondary internal persistence mechanism storing system state.

---

### Use Case Catalog
| ID | Use Case Name | Primary Actors | Secondary Actors |
| :--- | :--- | :--- | :--- |
| **UC1** | Sign In and Manage Session | Cashier, Admin | LocalStorage |
| **UC2** | View Store Dashboard Overview | Cashier, Admin | LocalStorage |
| **UC3** | Search Product Catalog & Check Stock | Cashier, Admin | LocalStorage |
| **UC4** | Manage Employees & Access Roles | Admin | LocalStorage |
| **UC5** | Process POS Sale & Checkout | Cashier, Admin | Customer, LocalStorage |
| **UC6** | Manage Products & Stock Inventory | Admin | LocalStorage |
| **UC7** | Generate Reports & Business Analytics | Admin | LocalStorage |
| **UC8** | Configure System & Store Settings | Admin | LocalStorage |
| **UC9** | Manage Product Suppliers | Admin | LocalStorage |
| **UC10**| Export & Restore System Backups | Admin | LocalStorage |
| **UC11**| Print Customer Sales Receipt | Cashier, Admin | Customer |
| **UC12**| Filter & Audit Transaction Journal | Admin | LocalStorage |

**Use Case Relationships:**
- **UC5 (Process POS Sale)** *includes* deducting inventory stock from **UC6** and creating customer receipts in **UC11**.
- **UC7 (Generate Reports)** *includes* reading historical sales recorded by **UC5**.
- **UC8 (Configure Settings)** *extends* the tax and currency calculations in **UC5** and **UC7**.
- **UC10 (Export/Restore Backups)** *includes* all data managed by **UC4**, **UC6**, **UC7**, and **UC8**.

---

### Detailed Use Case Specifications

#### UC4: Manage Employees & Access Roles
| Item | Description |
| :--- | :--- |
| **Actor** | Store Administrator |
| **Precondition** | Administrator is authenticated with active admin session; Employee Management (`users.html`) is open. |
| **Main Flow** | 1. Admin opens the Employee Management interface.<br>2. System displays current staff metrics and filtered personnel table.<br>3. Admin clicks "Add Employee".<br>4. System presents modal form with auto-generated Employee ID.<br>5. Admin inputs Name, Email, Role (Admin or Staff), Status, Password, and Phone.<br>6. Admin submits form.<br>7. System validates inputs, ensures email uniqueness, and appends employee object to `voltix.users`.<br>8. System closes modal, presents success toast, and refreshes the table. |
| **Alternative Flows**| **5a. Duplicate Email:** System displays validation error callout and retains form data for correction.<br>**5b. Edit Existing Employee:** Admin clicks edit icon; system pre-populates modal. Leaving password blank preserves existing password.<br>**5c. Suspend Employee:** Admin clicks status toggle button; system updates status to 'suspended' unless the account belongs to the current user or last admin.<br>**5d. Delete Employee:** Admin confirms deletion in confirmation dialog; system removes account. |
| **Postcondition** | Employee dataset in storage reflects additions or modifications. |

---

#### UC7: Generate Reports & Business Analytics
| Item | Description |
| :--- | :--- |
| **Actor** | Store Administrator |
| **Precondition** | Administrator is logged in and opens Reports (`reports.html`). |
| **Main Flow** | 1. Admin selects a time period filter (Today, 7 Days, 30 Days, All Time, or Custom Range).<br>2. System filters transactions in `voltix.sales` matching the criteria.<br>3. System calculates Total Revenue, Transactions, AOV, and Units Sold.<br>4. System renders the daily sales revenue trend bar chart.<br>5. System calculates and renders the payment method distribution bars.<br>6. System displays the detailed transaction journal table.<br>7. Admin can switch tabs to view "Products & Inventory" health or "Cashier Performance" rankings.<br>8. Admin clicks "Export CSV" to download the transaction audit file. |
| **Alternative Flows**| **1a. Custom Date Range:** Admin selects start and end dates; system validates that end date is on or after start date.<br>**8a. Print Report:** Admin clicks "Print Audit"; system opens formatted browser print preview optimized with `@media print`. |
| **Postcondition** | Store financial performance is visualized and audit logs are exported. |

---

#### UC8: Configure System & Store Settings
| Item | Description |
| :--- | :--- |
| **Actor** | Store Administrator |
| **Precondition** | Administrator is logged in and opens Settings (`pages/settings.html`). |
| **Main Flow** | 1. Admin navigates through settings categories (Store Profile, POS Defaults, Stock Alerts, Data Utilities).<br>2. Admin adjusts desired values (e.g., store contact info, tax rate percentage, currency symbol, low-stock threshold).<br>3. Admin clicks "Save Changes".<br>4. System verifies value ranges (e.g. non-negative tax percentage, threshold $ge 1$).<br>5. System commits new values to `voltix.settings` in `localStorage`.<br>6. System displays a confirmation toast notification. |
| **Alternative Flows**| **2a. Export Data Backup:** Admin clicks "Export Backup"; system packages all `voltix.*` keys into a downloadable JSON file.<br>**2b. Restore Data Backup:** Admin uploads a JSON backup file; system parses and validates structure, replaces storage keys, and reloads the application.<br>**2c. Factory Reset:** Admin confirms reset modal; system purges custom keys and re-initializes factory demo datasets. |
| **Postcondition** | Global store settings and operational defaults are updated and persistent. |

---

#### UC5: Process POS Sale & Checkout
| Item | Description |
| :--- | :--- |
| **Actor** | Staff (Cashier) or Store Administrator |
| **Precondition** | User is logged in and POS interface (`pages/pos.html`) is open. |
| **Main Flow** | 1. Cashier searches or selects products and clicks "Add to Cart".<br>2. System validates stock availability and adds items to the cart.<br>3. System dynamically computes Subtotal, Tax (using tax rate from settings), and Grand Total.<br>4. Cashier selects payment method (Cash or Card).<br>5. Cashier clicks "Complete Sale".<br>6. System generates unique transaction ID (`TX-XXXX`), records timestamp and cashier name.<br>7. System saves the transaction to `voltix.sales` in `localStorage`.<br>8. System automatically deducts sold quantities from `voltix.products`.<br>9. System displays the itemized receipt modal with instant Print action. |
| **Alternative Flows**| **2a. Insufficient Stock:** System alerts cashier that item stock is exhausted and prevents adding item.<br>**3a. Cart Adjustment:** Cashier increments, decrements, or removes items; system recalculates totals instantly. |
| **Postcondition** | Transaction is logged, stock counts are updated, and customer receipt is printed. |

---

*End of Software Requirements Specification for Voltix — Phase 1*
