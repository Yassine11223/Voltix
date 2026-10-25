
# VOLTIX
## Electronics Store POS & Inventory Management System

**Software Engineering Project — Phase 1**  
Misr International University (MIU)  
October 2026

---

## 1. Project Overview

Voltix is a web-based Point of Sale (POS) and Inventory Management System designed for physical electronics retail stores.

The system helps store administrators and employees manage daily operations, including product management, inventory tracking, sales, returns, supplier communication, employee accounts, and business reporting.

Voltix aims to reduce manual operations, improve inventory accuracy, and provide a centralized platform for store management.

This project was developed as part of the Software Engineering (SWE320) Phase 1 requirements.

## 2. Project Objectives

The main objectives of Voltix are to:

- Simplify electronics store inventory management.
- Automate sales recording and stock updates.
- Provide an interactive Point of Sale interface.
- Track products and identify low-stock items.
- Manage supplier information and incoming offers.
- Allow suppliers to submit requests online.
- Support product returns and refunds.
- Generate useful sales and inventory reports.
- Manage employees and their permissions.
- Provide a simple and responsive user interface.

## 3. User Roles

Voltix supports two authenticated employee roles and one external actor.

### Administrator

The Administrator has access to store management features, including:

- Dashboard and store statistics
- Product management
- Inventory management
- POS and sales
- Returns management
- Supplier management
- Supplier request approval and rejection
- Reports and analytics
- Employee management
- Store settings

### Staff / Cashier

Staff members can perform authorized daily store operations, including:

- Viewing the operational dashboard
- Searching and viewing products
- Viewing permitted inventory information
- Processing POS transactions
- Generating receipts
- Viewing permitted sales records
- Processing returns when authorized

### External Supplier

Suppliers do not require a login account.

They can access a public Supplier Request Form to:

- Apply to become a supplier
- Submit product offers
- Provide company and contact information
- Specify products, quantities, prices, and delivery dates

The Administrator reviews these requests.

## 4. Main Features

### 4.1 Dashboard

Provides an overview of store operations, including sales statistics, inventory information, low-stock warnings, and recent activities.

### 4.2 Point of Sale (POS)

- Search and select products
- Add products to a cart
- Update quantities
- Calculate transaction totals
- Select Cash or Card payment method
- Complete sales
- Generate receipts
- Update stock after completed sales

### 4.3 Product Management

- Add products
- Edit product details
- Delete products
- Search and filter products
- Manage product categories
- Maintain product pricing and SKU information

### 4.4 Inventory Management

- View product stock quantities
- Identify low-stock products
- Monitor out-of-stock items
- Adjust stock quantities
- Record authorized stock changes

### 4.5 Sales Management

- View sales history
- Search and filter transactions
- Review transaction details
- Access transaction receipts
- Monitor sales performance

### 4.6 Returns Management

- Find previous transactions
- Select products for return
- Enter return quantities and reasons
- Apply return eligibility rules
- Calculate applicable refunds
- Update stock when returned items are restockable

### 4.7 Supplier Management

Administrators can:

- Add suppliers
- Edit supplier information
- Activate or deactivate suppliers
- Delete suppliers subject to applicable restrictions
- Search and filter suppliers
- Review incoming supplier applications and offers

### 4.8 Public Supplier Request System

External suppliers can submit:

1. Become a Supplier applications
2. Product Offers

The request workflow is:

Supplier submits request
→ Request saved as Pending
→ Administrator reviews request
→ Administrator approves or rejects
→ Approved supplier is created or linked to an existing record

Supplier approval does not automatically increase inventory. Stock increases only after an authorized stock-receipt operation.

### 4.9 Reports and Analytics

The system provides available business reporting features, including:

- Sales summaries
- Revenue trends
- Product performance
- Inventory information
- Cashier performance
- Available report filtering and exports

### 4.10 Employee Management

Administrators can manage employee accounts, roles, and account status.

### 4.11 System Settings

Available settings include:

- Store information
- Tax configuration
- Currency preferences
- POS preferences
- Inventory-related settings
- Supported data backup and restoration

## 5. Technologies Used

Voltix uses the following frontend technologies:

| Technology | Purpose |
|---|---|
| HTML5 | Page structure |
| CSS3 | Styling and responsive design |
| JavaScript | Application behavior and business logic |
| localStorage | Browser-based prototype data persistence |
| Git | Version control |
| GitHub | Repository hosting and collaboration |
| Visual Studio Code | Development environment |

The Phase 1 prototype does not require a production backend or database.

## 6. Project Structure

```text
Voltix/
│
├── index.html
├── supplier-request.html
├── README.md
│
├── pages/
│   ├── dashboard.html
│   ├── pos.html
│   ├── products.html
│   ├── inventory.html
│   ├── sales.html
│   ├── suppliers.html
│   ├── returns.html
│   ├── reports.html
│   ├── users.html
│   └── settings.html
│
├── css/
│   └── Global and page-specific stylesheets
│
├── js/
│   └── Application and page-specific JavaScript modules
│
├── docs/
│   ├── srs.md
│   ├── supplier-requests.md
│   └── Additional technical documentation
│
└── tests/
    ├── inventory.test.html
    └── supplier-requests.test.html
```

## 7. How to Run the Project

### Requirements

- Modern web browser
- Visual Studio Code or another text editor
- Local HTTP server, such as VS Code Live Server

### Steps

1. Clone the repository:

```bash
git clone https://github.com/Yassine11223/Voltix.git
```

2. Open the Voltix folder in Visual Studio Code.

3. Start a local HTTP server using Live Server or:

```bash
python -m http.server 8000
```

4. Open:

```text
http://localhost:8000/
```

5. Sign in using the demonstration employee accounts configured in the application.

### Public Supplier Form

Open:

```text
http://localhost:8000/supplier-request.html
```

Requests submitted using this page can be reviewed in the Admin Suppliers interface when both pages use the same browser and origin.

## 8. Software Requirements Specification

The complete Phase 1 Software Requirements Specification is available at:

[View Voltix SRS](docs/srs.md)

The SRS contains:

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

## 9. Testing

Voltix includes browser-based test pages for selected modules:

- Inventory tests
- Supplier Request tests

Important manual testing workflows include:

- Employee login and role-specific access
- Product creation and editing
- Inventory adjustments
- POS checkout
- Sales history and receipts
- Returns processing
- Supplier request submission
- Supplier approval and rejection
- Employee account management
- Reports and settings

Functional and non-functional verification should distinguish tested behavior from requirements awaiting testing.

## 10. Phase 1 Limitations

Voltix is a frontend prototype developed for academic demonstration.

Current limitations include:

- No production backend or centralized database
- No real payment gateway integration
- No customer e-commerce website
- No supplier authentication portal
- No real-time synchronization between different devices
- Client-side authentication is not production-secure
- Browser storage can be edited or cleared

A production version would require secure backend authentication, server-side authorization, a shared database, and appropriate transaction controls.

## 11. Project Team

| Student Name | Student ID |
|---|---|
| Yassine Mahmoud Mohamed | 2024/02597 |
| Yehia Mohammed Adel | 2024/05270 |
| Youssef Saeid Mohammed | 2024/09584 |
| Yassin Hossam | 2024/03894 |

## 12. Repository

GitHub:
https://github.com/Yassine11223/Voltix

---

**Voltix — Software Engineering Phase 1**

Misr International University  
October 2026
