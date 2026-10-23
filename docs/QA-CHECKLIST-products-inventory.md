# Voltix Products, Inventory, Suppliers QA sheet

Use this as a 15-minute manual check. Expected results are intentionally short so the team can mark each row while demoing.

| # | Step | Expected result |
|---:|---|---|
| 1 | Open Products at 1440px | Seed products load; title reads `Products - Voltix`; no console error. |
| 2 | Search, filter, sort, reset, paginate | Results update; page size works; reset restores the full list. |
| 3 | Add a product with a unique SKU | Product is saved and appears in Products and Inventory. |
| 4 | Submit a duplicate SKU or invalid price | Save is blocked and an error is shown beside the invalid field. |
| 5 | Edit, archive, restore, and delete a product | Changes persist after refresh; archive has a Restore action. |
| 6 | Open Inventory Stock Levels | Units, low-stock, out-of-stock, and progress values match Products. |
| 7 | Try a negative adjustment | The form blocks removal greater than current stock. |
| 8 | Adjust stock with a valid reason | Stock and movement history update immediately. |
| 9 | Receive a delivery with two product lines | Review totals are correct; each line increases stock and creates one receive movement. |
| 10 | Filter history and export CSV | Type/user filters work; CSV downloads visible records. |
| 11 | Open Suppliers and add/edit a supplier | Validation works; stats and list update after save. |
| 12 | Attempt to delete a supplier used by a product | Delete is blocked and Deactivate is offered. |
| 13 | Open supplier Details and Receive delivery | Inventory opens on Receive Delivery with that supplier selected. |
| 14 | Set session role to Cashier | Products and Inventory are view-only; cost/value, movements, adjustments, receiving, and Suppliers management are hidden. |
| 15 | Set each other role and resize to 1024, 768, and 375px | Permissions match the matrix; sidebar collapses; tables scroll inside their cards; modals fit the viewport. |
