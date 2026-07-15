# Inventory & Stock Reports

## Data Sources
- `inventory` — itemId, openingBalance, currentStock, minStockLevel, unitCost, status
- `stock_movements` — itemId, type (10 types), quantity, balanceBefore, balanceAfter, reference, notes, createdBy, createdAt
- `items` — name, sku, hsnCode, unit (piece/kg/gram/litre/ml/dozen/plate/bowl/cup/glass/bottle/box/packet), productType (raw/semi_finished/finished), costPrice
- `recipes` — outputItemId, yieldQuantity, yieldUnit
- `recipe_ingredients` — componentItemId, quantity, unit
- `production_entries` — itemId, batchQuantity, producedAt, createdBy

---

## RPT-I01: Current Stock Status
**Status:** Partially Built (low-stock alerts exist in InventoryService)

| Field | Source |
|-------|--------|
| Item Name | `items.name` |
| SKU | `items.sku` |
| Unit | `items.unit` |
| Product Type | `items.productType` |
| Opening Balance | `inventory.openingBalance` |
| Current Stock | `inventory.currentStock` |
| Min Stock Level | `inventory.minStockLevel` |
| Stock Status | OK / LOW / OUT_OF_STOCK (currentStock vs minStockLevel) |
| Unit Cost | `inventory.unitCost` |
| Stock Value | currentStock * unitCost |

**Visualization:** Color-coded table (green/yellow/red) + summary cards
**Filters:** Product type, stock status, category
**Sort:** By stock level, stock value, or item name

**Why It Is Needed:** The most fundamental inventory report — tells you what you have, where it is, and whether you're about to run out. In a restaurant, running out of a key ingredient means a menu item cannot be served, leading to lost revenue and unhappy customers. Answers: What stock do we currently have? What items are running low?

**Business Area Reviewed:** Inventory health and availability. Reviews current stock levels against minimum thresholds. Used by inventory manager, chef, and storekeeper for daily stock awareness and reorder planning.

---

## RPT-I02: Low Stock Alerts
**Status:** Partially Built (InventoryService.getLowStockAlerts())

| Field | Source |
|-------|--------|
| Item Name | `items.name` |
| Current Stock | `inventory.currentStock` |
| Min Stock Level | `inventory.minStockLevel` |
| Deficit | minStockLevel - currentStock |
| Unit | `items.unit` |
| Days Since Last Purchase | Days since last stock_movements WHERE type='purchase_in' |
| Suggested Reorder Qty | Based on average daily consumption |

**Visualization:** Alert table with severity indicators
**Filters:** Severity threshold (e.g., show items at <50% of min level)
**Action:** Link to create purchase order for flagged items

**Why It Is Needed:** Prevents stock-outs before they happen. A restaurant cannot afford to tell a customer "sorry, we're out of that dish." This report proactively flags items that need reordering. Combined with consumption data, it suggests optimal reorder quantities. Answers: What do we need to order today or tomorrow?

**Business Area Reviewed:** Reorder planning and stock-out prevention. Reviews items approaching or below minimum stock levels. Used by inventory manager and storekeeper for daily purchase order creation and urgent replenishment.

---

## RPT-I03: Stock Movement Ledger
**Status:** Not Built

| Field | Source |
|-------|--------|
| Date | `stock_movements.createdAt` |
| Item | `items.name` |
| Movement Type | `stock_movements.type` (opening_balance/purchase_in/sale_out/adjustment_in/adjustment_out/wastage/transfer_out/transfer_in/production_consumption/production_in) |
| Quantity | `stock_movements.quantity` (positive for in, negative for out) |
| Balance Before | `stock_movements.balanceBefore` |
| Balance After | `stock_movements.balanceAfter` |
| Reference | `stock_movements.reference` (invoice#, PO#, etc.) |
| Notes | `stock_movements.notes` |
| Created By | `stock_movements.createdBy` |

**Visualization:** Chronological ledger table with running balance
**Filters:** Item, movement type, date range, created by
**Drill-down:** Click reference to see source invoice/purchase

**Why It Is Needed:** Provides a complete audit trail for every item in inventory. When stock goes missing or there's a discrepancy between physical count and system count, this report helps trace what happened. Also essential for identifying unusual movement patterns (theft, misuse). Answers: What changed in stock and why?

**Business Area Reviewed:** Inventory transaction audit trail. Reviews all stock movements with running balance for each item. Used by inventory manager and auditor to verify stock changes, trace discrepancies, and audit staff activity.

---

## RPT-I04: Stock Valuation Report
**Status:** Not Built

| Field | Source |
|-------|--------|
| Item | `items.name` |
| Product Type | `items.productType` |
| Current Stock | `inventory.currentStock` |
| Unit Cost | `inventory.unitCost` |
| Stock Value | currentStock * unitCost |
| Category | `categories.name` |
| Stock Value by Category | SUM(stock_value) GROUP BY category |
| Total Inventory Value | SUM(currentStock * unitCost) |

**Visualization:** Pie chart (by category) + table
**Filters:** Product type, category
**Insight:** Capital tied up in inventory, category-wise valuation

**Why It Is Needed:** Shows how much capital is locked up in inventory — essential for balance sheet and working capital management. If too much cash is sitting on shelves, the restaurant may have cash flow problems despite high sales. Answers: What is our total inventory worth? Are we overstocking certain categories?

**Business Area Reviewed:** Working capital and inventory investment. Reviews the monetary value of all stock on hand. Used by owner and accountant for balance sheet preparation, working capital analysis, and identifying overstock situations.

---

## RPT-I05: Wastage Report
**Status:** Not Built

| Field | Source |
|-------|--------|
| Item | `items.name` |
| Wastage Quantity | SUM(quantity) WHERE type='wastage' |
| Wastage Value | wastage_quantity * unitCost |
| Wastage Reason | `stock_movements.notes` |
| Wastage by Category | SUM(wastage_value) GROUP BY category |
| Wastage Rate | wastage_quantity / (opening_balance + purchases) * 100 |
| Trend | Wastage over time |

**Visualization:** Bar chart + trend line + table
**Filters:** Date range, item, category, reason code
**Insight:** Food waste reduction opportunities

**Why It Is Needed:** Food waste is pure profit lost. Restaurants typically waste 5-15% of food purchased. This report quantifies the loss and identifies patterns — are certain ingredients spoiling? Is a particular station wasting more? Is prep waste too high? Answers: Where is food being wasted and what is it costing us? Every rupee saved on waste goes directly to profit.

**Business Area Reviewed:** Food waste and spoilage management. Reviews quantity and value of discarded stock with reasons. Used by chef, owner, and inventory manager to identify waste patterns, improve portion control, and reduce spoilage through better ordering.

---

## RPT-I06: Consumption Analysis
**Status:** Not Built

| Field | Source |
|-------|--------|
| Item | `items.name` |
| Total Consumed | SUM(quantity) WHERE type='sale_out' + type='production_consumption' |
| Avg Daily Consumption | total_consumed / days_in_period |
| Consumption Trend | Daily/weekly consumption pattern |
| Projected Days Until Stockout | currentStock / avg_daily_consumption |
| Linked Sales | SUM(quantity) WHERE type='sale_out' matched to invoices |

**Visualization:** Line chart (consumption over time) + projection
**Filters:** Date range, item, category
**Insight:** Demand forecasting and stockout prevention

**Why It Is Needed:** The foundation of demand-based ordering. Instead of guessing how much to order, this report calculates average daily consumption and projects when stock will run out. Answers: How fast are we using each ingredient? When will we run out if we don't reorder? Enables just-in-time inventory management.

**Business Area Reviewed:** Consumption patterns and demand forecasting. Reviews how fast inventory is consumed over time. Used by inventory manager and chef to calculate reorder quantities, set safety stock levels, and prevent stockouts.

---

## RPT-I07: Production Report
**Status:** Not Built

| Field | Source |
|-------|--------|
| Date | `production_entries.producedAt` |
| Output Item | `items.name` (output) |
| Batch Quantity | `production_entries.batchQuantity` |
| Yield Unit | `recipes.yieldUnit` |
| Ingredients Used | `recipe_ingredients` with quantities |
| Production Cost | SUM(ingredient_quantity * ingredient_unit_cost) |
| Created By | `production_entries.createdBy` |

**Visualization:** Timeline + cost breakdown table
**Filters:** Date range, output item, creator
**Insight:** Production efficiency and cost tracking

**Why It Is Needed:** For restaurants that do in-house production (batches of gravy, dough, sauces, desserts), this report tracks how much was produced, at what cost, and by whom. Helps ensure production matches demand and production costs are within targets. Answers: Are we producing the right quantities? Is the production cost consistent with recipe standards?

**Business Area Reviewed:** Batch production tracking and efficiency. Reviews production runs, their output quantities, and ingredient costs. Used by chef and production manager to plan batch sizes, control production costs, and track chef productivity.

---

## RPT-I08: Recipe Cost Analysis
**Status:** Backend exists (`RecipesService.computeCost()`)

| Field | Source |
|-------|--------|
| Recipe Item | `items.name` (output) |
| Yield Quantity | `recipes.yieldQuantity` |
| Yield Unit | `recipes.yieldUnit` |
| Ingredient Count | COUNT(recipe_ingredients) |
| Total Ingredient Cost | Computed BOM cost |
| Cost per Unit | total_cost / yield_quantity |
| Selling Price | `items.price` |
| Food Cost % | cost_per_unit / selling_price * 100 |
| Gross Margin | selling_price - cost_per_unit |

**Visualization:** Comparison table + food cost % bar chart
**Filters:** Category, minimum food cost %, margin threshold
**Insight:** Menu profitability, pricing optimization

**Why It Is Needed:** The most important report for menu profitability. If food cost % is above 40% for an item, you're barely making money on it after overheads. This report flags items that need repricing, recipe reformulation, or removal. Industry benchmark: food cost should be 28-35% of selling price. Answers: Which menu items are profitable? Which are losing money?

**Business Area Reviewed:** Menu item profitability and pricing. Reviews the cost of ingredients for each recipe vs. its selling price. Used by owner, chef, and manager for menu engineering — decide which items to promote, reprice, reformulate, or remove.

---

## RPT-I09: Stock Reconciliation Report
**Status:** Not Built

| Field | Source |
|-------|--------|
| Item | `items.name` |
| System Stock | `inventory.currentStock` |
| Physical Count | (requires input field) |
| Variance | physical_count - system_stock |
| Variance Value | variance * unitCost |
| Variance % | variance / system_stock * 100 |
| Reconciliation Date | Date of physical count |

**Visualization:** Variance table with color coding
**Filters:** Category, variance threshold
**Action:** Create adjustment entries for variances

**Why It Is Needed:** Physical inventory counts never match system stock perfectly. This report quantifies the variance, which could indicate theft, unrecorded wastage, counting errors, or system issues. Large variances need investigation. Answers: Does our physical stock match what the system says? Where is the discrepancy coming from?

**Business Area Reviewed:** Inventory accuracy and loss prevention. Reviews the difference between system-recorded stock and physical counts. Used by inventory manager and auditor for periodic stock-taking, identifying theft or process gaps, and maintaining inventory data integrity.

---

## RPT-I10: Purchase-to-Stock Timeline
**Status:** Not Built

| Field | Source |
|-------|--------|
| Purchase Number | `purchases.purchaseNumber` |
| Order Date | `purchases.purchaseDate` |
| Supplier | `suppliers.name` |
| Items Ordered | `purchase_items` with quantities |
| Receive Date | `purchases.updatedAt WHERE status='received'` |
| Lead Time | receive_date - order_date (days) |
| Stock Impact | stock_movements WHERE type='purchase_in' |

**Visualization:** Gantt-like timeline + lead time statistics
**Filters:** Supplier, date range
**Insight:** Supplier reliability and lead time analysis

**Why It Is Needed:** Tracks how long it takes from placing an order to having stock available. This lead time is critical for setting reorder points — if a supplier takes 5 days, you need 5 days of safety stock. Answers: How reliable are our suppliers on delivery timelines? What is the average lead time we should plan for?

**Business Area Reviewed:** Supply chain cycle time and supplier reliability. Reviews the end-to-end timeline from purchase order to stock availability. Used by inventory manager to set reorder points, evaluate supplier delivery performance, and plan inventory buffers.

---

## Backend Implementation Notes

### Stock Movement Types (for filtering/grouping)
```
opening_balance    — Initial stock setup
purchase_in        — Stock received from supplier
sale_out           — Stock deducted on invoice
adjustment_in      — Manual increase
adjustment_out     — Manual decrease
wastage            — Discarded/spoiled stock
transfer_out       — Moved between locations
transfer_in        — Received from another location
production_consumption — Raw materials used in production
production_in      — Finished goods produced
```

### New Endpoints Needed
```typescript
@Get('inventory/stock-status')          // RPT-I01
@Get('inventory/low-stock')            // RPT-I02 (enhance existing)
@Get('inventory/movements')            // RPT-I03
@Get('inventory/valuation')            // RPT-I04
@Get('inventory/wastage')             // RPT-I05
@Get('inventory/consumption')         // RPT-I06
@Get('inventory/production')          // RPT-I07
@Get('inventory/recipe-costs')        // RPT-I08
@Get('inventory/reconciliation')      // RPT-I09
@Get('inventory/purchase-timeline')   // RPT-I10
```
