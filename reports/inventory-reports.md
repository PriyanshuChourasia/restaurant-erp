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
