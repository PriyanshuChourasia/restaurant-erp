# Inventory Management Module — Functional Specification

**Scope:** Single-restaurant, single-location inventory management, designed to scale to
multi-outlet/central-kitchen operation later.
**Audience:** Product, QA, and engineering teams implementing, testing, and maintaining the module.
**Nature of this document:** Business and domain specification only. No programming language,
database engine, framework, or technology is assumed or implied anywhere below. All "fields"
described are business data points, not schema definitions.

---

## 0. How to Use This Document

This spec is organized so an implementation team can build the module top-down:

1. §1–§3 give the conceptual model and assumptions.
2. §4 is the core: one fully-specified sub-module at a time, in build order (Units and
   Categories before Items, Items before Purchases, etc.).
3. §5–§10 tie the sub-modules together (workflow, integration, rules, data dictionary,
   relationships, lifecycle states).
4. §11–§15 cover cross-cutting concerns (permissions, audit, errors, roadmap, delivery advice).

Each sub-module section in §4 follows the same fixed template so nothing is missed:
Business Purpose → Functional Requirements → User Stories → Business Workflow → Business
Rules → Validation Rules → Lifecycle/Status → Fields → Relationships → Search/Filter/Sort →
Bulk Operations → Import/Export → Audit & Activity Log → Permissions → Error Scenarios →
Edge Cases → Future Extensibility.

Generic audit/activity-log behavior, common error patterns, and the full permission matrix
are defined once in §11–§13 and referenced by each sub-module rather than repeated verbatim.

---

## 1. Module Overview

The Inventory Management Module is the system of record for everything a restaurant buys,
stores, moves, consumes, wastes, counts, and reports on — from the moment a raw material or
supply is ordered from a supplier to the moment it leaves the business as a sold dish, a
waste entry, or a stock write-off.

It is built from twelve independent, composable sub-modules:

| # | Sub-module | One-line responsibility |
|---|---|---|
| 1 | Units | Defines units of measure and how they convert into one another |
| 2 | Categories | Organizes items into a browsable, reportable hierarchy |
| 3 | Items | The master catalog of every stock-tracked thing in the restaurant |
| 4 | Suppliers | Who the restaurant buys from, and on what terms |
| 5 | Purchases | Formal intent to buy — a purchase order, not yet stock |
| 6 | Goods Receipt | The actual physical arrival of goods — this is what moves stock |
| 7 | Stock Adjustments | Manual correction of stock for reasons outside normal flow |
| 8 | Stock Consumption | Stock leaving via recipes/kitchen production or internal use |
| 9 | Stock Transfer | Stock moving between internal locations (store, kitchen, bar) |
| 10 | Waste Management | Stock leaving as loss, with cost and accountability tracked |
| 11 | Stock Count | Physical verification of what the system believes is on hand |
| 12 | Inventory Reports | Read-only views, analytics, and exports across everything above |

**Core design principle:** every sub-module produces or consumes an **inventory
transaction** — an immutable, timestamped, user-attributed record of a stock quantity
change. The current on-hand stock of any item is always the sum of its transactions, never
a value edited directly. This is what makes every movement traceable and auditable, and it
is the single most important architectural rule in this specification (see §7, Global Rule
GR-1).

---

## 2. Guiding Principles & Assumptions

1. **Single restaurant, single or few physical locations** (e.g., Main Store, Kitchen, Bar,
   Waste Area). The design uses "locations" as a light concept — not a full multi-branch
   warehouse system — but every quantity is scoped to (item, location, batch) so multi-outlet
   expansion later does not require a redesign.
2. **Recipe/Menu costing is out of scope** for this document except at integration points —
   Stock Consumption assumes a Recipe Management module supplies "what ingredients, in what
   quantity, does one unit of menu item X consume." This module only executes the resulting
   deduction.
3. **Currency and tax regime are configurable**, not hardcoded — the spec refers to "tax,"
   "cost," and "amount" generically. (The existing platform uses Indian GST as a concrete
   example in Purchases; this spec generalizes so any tax model fits.)
4. **A "user" always exists and is authenticated** for any transaction that mutates
   inventory. There is no anonymous stock movement.
5. **Soft-delete / deactivate, never hard-delete, for anything referenced elsewhere.**
   Historical transactions are permanent; master data referenced by history is deactivated,
   not destroyed. See GR-6.
6. **Decimal quantities are allowed** (e.g., 2.5 kg) with configurable precision per unit —
   restaurants routinely handle fractional weights and volumes.
7. **Negative stock is disallowed by default** but must be a configurable toggle per item or
   globally, because real kitchens sometimes consume before the system is reconciled (see
   FR/BR entries under Stock Consumption).
8. It is assumed a **Menu Management**, **Recipe Management**, **Kitchen
   Operations/KOT**, **Billing/POS**, and **Reporting/Dashboard** module exist or will exist
   alongside this one; integration points with each are called out per sub-module.

---

## 3. Master Data Hierarchy

Before any transaction can happen, three layers of master data must exist, in this order:

```
Units  ─┐
        ├──▶  Items  ──▶  (everything transactional: Purchases, Receipts,
Categories ─┘              Adjustments, Consumption, Transfers, Waste, Counts)
                 ▲
Suppliers ───────┘ (linked to Items via Item–Supplier relationship)
```

- **Units** and **Categories** have no dependency on each other; both are prerequisites for
  **Items**.
- **Suppliers** can be created independently of Items, but an Item–Supplier link requires
  both to exist.
- **Items** is the hub: every transactional sub-module (5–11) operates on Items.

---

## 4. Sub-module Specifications

### 4.1 Units

**Business Purpose**
Defines every unit of measure the restaurant uses to purchase, store, prepare, and sell
inventory, and the conversion math between related units, so that "1 case of 24 bottles"
and "1 bottle" can both describe the same stock without manual arithmetic anywhere else in
the system.

**Functional Requirements**
1. Create, view, update, and deactivate units.
2. Designate a unit as a **base unit** (e.g., Gram, Milliliter, Piece) or a **derived unit**
   (e.g., Kilogram = 1000 Gram; Box = 24 Piece).
3. Define a **conversion formula** between a derived unit and its base unit (multiplication
   factor, minimally; extensible to more complex formulas later).
4. Support unit **abbreviations** for compact display (kg, g, L, mL, pc, pkt, btl, box).
5. Support a configurable **decimal precision** per unit (e.g., Kilogram → 3 decimal places,
   Piece → 0 decimal places).
6. Mark a unit **active/inactive**.
7. Designate, per unit **category/dimension** (weight, volume, count), a **default unit**
   used when no other unit is specified.
8. Prevent deletion of a unit in use; support deactivation instead.

**User Stories**
- As an Inventory Manager, I want to define "Kilogram" and "Gram" with a 1:1000 conversion,
  so items can be purchased in kilograms but tracked in grams for precision.
- As an Inventory Manager, I want to mark "Crate (24 Bottle)" as a purchase-only derived
  unit, so purchase orders can use supplier packaging while stock stays in bottles.
- As a system administrator, I want to prevent deletion of a unit already used by an item,
  so historical data never becomes orphaned or unreadable.

**Business Workflow**
1. Administrator defines base units first (Gram, Milliliter, Piece).
2. Administrator defines derived units and their conversion factor to a base unit.
3. Units become available for selection when creating/editing Items, Purchases, Goods
   Receipts, Adjustments, Consumption, Transfers, Waste entries, and Stock Counts.
4. Any transaction recorded in a non-stock unit (e.g., purchased in "Box") is converted to
   the item's stock unit at the moment of the transaction, using the conversion factor
   active at that time.

**Business Rules**
- BR-U1: A unit already referenced by any Item (as purchase unit or stock unit) cannot be
  deleted; it can only be deactivated.
- BR-U2: A base unit cannot declare a conversion factor to itself.
- BR-U3: A unit's conversion is one-directional by declaration (derived → base) but must be
  invertible for calculations (base → derived) — i.e., the relationship is mathematically
  reversible, even though only one factor is stored.
- BR-U4: One base unit may have many derived units (Kilogram, Quintal, Ton → all convert to
  Gram), but a derived unit converts to exactly one base unit — no chained/multi-hop
  conversions in the base design (documented as a future extensibility item below).
- BR-U5: Conversion accuracy (decimal precision) is configurable per unit and must be
  respected in all downstream calculations and display.
- BR-U6: Deactivated units remain visible on historical records but cannot be selected for
  new transactions.

**Validation Rules**
- Unit name is required and unique (case-insensitive).
- Abbreviation is required and unique within the same unit dimension (weight/volume/count).
- Conversion factor, if applicable, must be a positive number.
- A unit cannot be deactivated if it is the sole unit assigned to an active Item as its
  stock unit (would leave the item without a valid stock unit) — the item must be
  reassigned first.

**Lifecycle / Status Flow**
`Active ⇄ Inactive`. No other states. Deactivation is reversible unless the unit was
deactivated as part of a merge/cleanup (future extensibility).

**Required Fields:** Unit name, abbreviation, unit dimension (weight/volume/count/other),
active status.
**Optional Fields:** Base unit reference, conversion factor, decimal precision (defaults to
a system default if omitted), notes, "is default for dimension" flag.

**Relationships with Other Modules**
- Items: every Item has exactly one stock unit and one purchase unit (may be the same).
- Purchases & Goods Receipt: quantities are entered in a purchase unit, converted to stock
  unit on receipt.
- Recipe Management (external): recipe ingredient quantities reference stock units.
- Reports: all quantity-based reports display in stock unit by default, with an option to
  display in purchase unit.

**Search / Filter / Sort:** search by name/abbreviation; filter by dimension and
active/inactive; sort by name, dimension, or usage count (number of items referencing it).

**Bulk Operations:** bulk activate/deactivate; bulk re-assignment of a conversion factor
correction (with a mandatory reason note, since it can affect historical valuation
consistency — see BR-U5 note in Edge Cases).

**Import/Export:** import a starter unit list (name, abbreviation, dimension, base unit,
conversion factor) via spreadsheet-style upload; export the full unit list with usage counts.

**Audit History / Activity Log:** every create, update (especially conversion factor
changes), and status change is logged with who/when/old value/new value. Conversion factor
changes are flagged as **high-sensitivity** changes because they silently affect the
computed stock unit quantity of every future transaction (see §12).

**Role-Based Permissions:** see §11 Permission Matrix — Units follows the `units.*`
permission set. In the current seeded roles, this maps to Admin and Manager (create/update),
all operational roles (read).

**Error Scenarios**
- Attempting to delete a unit in use → blocked with a clear message listing how many items
  reference it.
- Attempting to set a zero or negative conversion factor → rejected.
- Attempting to create a duplicate unit name/abbreviation → rejected with a duplicate error.

**Edge Cases**
- Changing a conversion factor after transactions already exist: historical transactions
  keep the quantity as originally converted (immutable); only future transactions use the
  new factor. This must be explicit in the UI/workflow to avoid confusion.
- A unit used only for purchasing (e.g., "Carton") but never for stock-keeping — the system
  must support purchase unit ≠ stock unit cleanly (see Items §4.3).
- Rounding at conversion boundaries (e.g., 1 kg ÷ 3 = 0.333 kg) must follow the unit's
  declared decimal precision consistently across every calculation path.

**Future Extensibility**
- Multi-hop conversions (Ton → Kilogram → Gram chains) instead of single-hop-to-base.
- Locale-aware unit display (metric vs. imperial) per user/tenant.
- Per-supplier packaging units distinct from the restaurant's own purchase unit.

---

### 4.2 Categories

**Business Purpose**
Organizes the item catalog into a browsable, filterable, and reportable hierarchy (e.g.,
Vegetables, Meat, Dairy, Beverages) so that staff can navigate inventory efficiently and
management can analyze cost/consumption/waste by category.

**Functional Requirements**
1. Create, view, update, and deactivate categories.
2. Support **parent–child nesting** (e.g., "Beverages" → "Soft Drinks" → "Carbonated").
3. Support explicit **display ordering** within a parent.
4. Support **active/inactive** status.
5. Support an optional **icon** and **color code** for visual identification in UI lists and
   dashboards.
6. Prevent duplicate category names at the same hierarchy level.
7. Prevent deletion of categories that contain items (directly or via child categories).

**User Stories**
- As an Inventory Manager, I want to create "Frozen Items" as a top-level category and
  "Frozen Vegetables"/"Frozen Meat" beneath it, so items are easy to browse by type.
- As a Manager, I want a waste report grouped by category, so I can see which category
  (e.g., Seafood) drives the most loss.
- As an Admin, I want to be blocked from deleting "Dairy" while it still has items assigned,
  so the catalog never loses its organizing structure silently.

**Business Workflow**
1. Top-level categories are created first (Vegetables, Meat, Dairy, Seafood, Fruits,
   Beverages, Dry Goods, Frozen Items, Packaging, Cleaning Supplies, ...).
2. Child categories are created under a parent as needed.
3. Categories become available for assignment when creating/editing Items.
4. Reports and catalog browsing use the category tree for grouping/filtering/drill-down.

**Business Rules**
- BR-C1: A category name must be unique among its siblings (same parent); duplicates across
  different parents are allowed (e.g., "Frozen" under both "Vegetables" and "Meat" — though
  discouraged, not blocked, unless the business wants stricter uniqueness — configurable).
- BR-C2: A category with one or more Items assigned (directly, not via descendants) cannot
  be deleted — only deactivated.
- BR-C3: A category with active child categories cannot be deleted until children are
  removed or reassigned.
- BR-C4: Deactivating a parent category does not automatically deactivate its children;
  this must be an explicit, confirmed cascading action if desired.
- BR-C5: Circular parent references are disallowed (a category cannot be its own ancestor).

**Validation Rules**
- Category name required, 1–100 characters (business-configurable max length).
- Parent category, if set, must exist and be active.
- Display order must be a non-negative integer, unique within siblings (auto-increment if
  omitted).
- Depth of nesting should be capped at a configurable maximum (e.g., 3 levels) to keep
  navigation usable — matches existing product convention of Food → Main Course → Vegetarian.

**Lifecycle / Status Flow:** `Active ⇄ Inactive`.

**Required Fields:** Category name, active status.
**Optional Fields:** Parent category, display order, icon, color code, description.

**Relationships with Other Modules**
- Items: every Item belongs to exactly one category.
- Menu Management (external): menu categories may mirror or link to inventory categories for
  consistent reporting, though they are conceptually separate (a menu category is
  customer-facing; an inventory category is stock-facing).
- Reports: category is a primary grouping dimension across Stock, Consumption, Waste,
  Purchase, and Valuation reports.

**Search / Filter / Sort:** search by name; filter by active/inactive, top-level vs. child,
has-items vs. empty; sort by name or display order; tree view expand/collapse.

**Bulk Operations:** bulk reorder (drag-drop-equivalent reordering), bulk activate/deactivate,
bulk re-parent (move multiple categories under a new parent, subject to BR-C5).

**Import/Export:** import a category tree from a spreadsheet (name, parent name, order, icon,
color); export the full tree with item counts per category.

**Audit History / Activity Log:** log create, rename, re-parent, reorder, and status changes,
with before/after values.

**Role-Based Permissions:** `categories.*` permission set — Admin/Manager create & update,
all operational roles read. (Matches existing seeded `category` permission module.)

**Error Scenarios**
- Deleting a category with items → blocked, with count of affected items shown.
- Creating a duplicate sibling name → rejected.
- Setting a category as its own parent or a descendant's parent → rejected (circular
  reference).

**Edge Cases**
- Moving a category to a new parent when it has its own children — all descendants move
  with it; path/level metadata must be recalculated for the entire subtree.
- A category deactivated while items still reference it as active — items remain valid for
  existing transactions, but should be flagged for recategorization; new items should not be
  assignable to an inactive category.

**Future Extensibility**
- Category-level default reorder thresholds and default suppliers (inherited by items
  unless overridden).
- Category-based approval routing for purchases above a threshold.
- Multi-language category names for multi-region deployments.

---

### 4.3 Items

**Business Purpose**
The central inventory catalog — the single source of truth for every stock-managed thing the
restaurant owns: raw materials, ingredients, beverages, packaging, cleaning supplies,
disposables, and other consumables. Every other sub-module operates on Items.

**Functional Requirements**
1. Create, view, update, and deactivate items.
2. Assign each item to exactly one Category.
3. Assign a **Purchase Unit** and a **Stock Unit** (may be equal); if different, a valid
   Unit conversion must exist between them.
4. Track **Minimum Stock**, **Maximum Stock**, and **Reorder Level** thresholds.
5. Track **storage location** (free text or a controlled list — e.g., Main Store, Walk-in
   Freezer, Bar).
6. Support **shelf life** (duration) for perishables.
7. Support **batch tracking** (each stock-in creates a distinct batch with its own quantity,
   cost, and expiry) as an item-level toggle — not every item needs batch tracking (e.g.,
   cleaning supplies typically don't; fresh produce and dairy typically do).
8. Support **expiry tracking**, dependent on batch tracking being enabled.
9. Support **tax configuration** applicable to the item's purchase (and, if relevant, sale).
10. Track **Cost Price** (last known standalone cost), **Average Cost** (moving average
    across receipts), and **Last Purchase Price**.
11. Support a **Preferred Supplier** and **multiple Suppliers** per item, each with its own
    last price and lead time.
12. Support multiple **images** and free-text **notes**.
13. Support **Active/Inactive** status.
14. Maintain a complete, queryable **inventory movement history** per item (every
    transaction from every sub-module 5–11, in one unified ledger view).
15. Support an **Item Type** classification (Raw Material, Ingredient, Beverage, Packaging,
    Cleaning Supply, Disposable, Consumable, Other) distinct from Category, for
    cross-cutting logic (e.g., "Packaging" items are never used in Recipe consumption).

**User Stories**
- As an Inventory Manager, I want to create "Chicken Breast" with purchase unit "Kilogram"
  and stock unit "Gram," so purchasing stays practical while stock precision stays high.
- As a Chef, I want to see an item's current stock, average cost, and days-to-expiry on one
  screen, so I can plan menu specials around what needs to move.
- As a Purchasing user, I want to see every supplier who can supply "Tomato" and their last
  quoted price, so I can choose the best option when creating a purchase order.
- As an Admin, I want inactive items excluded from new purchase orders and recipes, so stale
  items can't accidentally re-enter the supply chain.

**Business Workflow**
1. Item is created with mandatory classification (category, item type), units (purchase +
   stock), and reorder thresholds.
2. Optional: suppliers are linked with quoted prices.
3. Item becomes eligible for: Purchases, Goods Receipt, Recipes (external), Stock
   Adjustments, Consumption, Transfers, Waste, and Stock Count.
4. Every transaction against the item updates its computed on-hand stock, average cost, and
   (if applicable) batch/expiry records; the item master record itself is never directly
   edited to change stock — only transactions do that (see GR-1).
5. When stock crosses the Reorder Level, the item surfaces on the Low Stock report/alerts,
   feeding into Purchasing.

**Business Rules**
- BR-I1: Every item must belong to exactly one active category.
- BR-I2: Every item must have exactly one stock unit; a purchase unit is required and may
  equal the stock unit.
- BR-I3: If purchase unit ≠ stock unit, a valid conversion between them must exist (directly
  or via a shared base unit) before the item can be saved as active.
- BR-I4: Item Code/SKU must be unique across the entire catalog (including inactive items —
  codes are never reused).
- BR-I5: Barcode, if provided, must be unique across active items.
- BR-I6: Inactive items cannot be selected in new Purchases, Goods Receipts, Adjustments,
  Consumption, Transfers, Waste entries, or Stock Counts — but remain visible/read-only in
  historical records and reports.
- BR-I7: An item referenced by any historical transaction cannot be permanently deleted —
  only deactivated.
- BR-I8: Average Cost recalculates on every Goods Receipt using a moving-average method
  (configurable to FIFO/LIFO as a future extensibility item; see below).
- BR-I9: Minimum Stock ≤ Reorder Level ≤ Maximum Stock (validated at save time; a warning,
  not necessarily a hard block, if violated intentionally).
- BR-I10: Batch/expiry tracking, once enabled and used (at least one batch exists), cannot
  be silently disabled — it must be explicitly migrated or the item deactivated and replaced.

**Validation Rules**
- Item name required, unique within an active category (duplicate names across different
  categories are permitted but discouraged with a warning).
- Item Code/SKU required, unique, immutable after first transaction (can still be edited if
  no transaction exists yet).
- Category required and must be active.
- Purchase Unit and Stock Unit required and must be active units.
- Minimum/Maximum/Reorder values must be non-negative numbers; Maximum ≥ Reorder ≥ Minimum
  (soft validation, overridable with confirmation).
- Shelf life, if provided, must be a positive duration.
- Tax configuration must reference a valid, active tax rate.
- At least one supplier is recommended, not mandatory (an item can exist before sourcing is
  finalized), but a **Preferred Supplier cannot be set unless it is also in the item's
  supplier list**.

**Lifecycle / Status Flow:** `Draft (optional, if the business wants a review step) →
Active ⇄ Inactive`. Most implementations may skip Draft and go straight to Active on
creation; Draft is listed as an optional extensibility state for larger catalogs needing
review before go-live.

**Required Fields:** Item Name, Item Code/SKU, Item Type, Category, Purchase Unit, Stock
Unit, Minimum Stock, Reorder Level, Active status.
**Optional Fields:** Barcode, Maximum Stock, Storage Location, Shelf Life, Batch Tracking
flag, Expiry Tracking flag, Tax Configuration, Cost Price, Preferred Supplier, additional
Suppliers, Images, Notes.

**Relationships with Other Modules**
- Categories, Units: as described above.
- Suppliers: many-to-many, with per-pair pricing/lead-time metadata.
- Purchases & Goods Receipt: items are the line-level subject of every purchase and receipt.
- Stock Adjustments, Consumption, Transfer, Waste, Stock Count: all operate per item (and
  per batch, if batch-tracked).
- Recipe Management (external): recipes reference items as ingredients, in stock units.
- Menu Management (external): indirectly linked — a menu item's recipe determines which
  inventory items are consumed on sale.
- Billing/POS (external): a completed sale triggers Stock Consumption for the recipe's
  items.
- Reports: items are the primary subject of nearly every inventory report.

**Search / Filter / Sort:** search by name, code/SKU, barcode; filter by category, item
type, active/inactive, batch-tracked, below-reorder, has-preferred-supplier; sort by name,
code, current stock, average cost, last purchase date, days-to-expiry (for batch-tracked
items).

**Bulk Operations:** bulk category reassignment, bulk activate/deactivate, bulk reorder
threshold updates, bulk tax configuration updates, bulk supplier assignment.

**Import/Export:** import items via spreadsheet (name, code, type, category, units,
thresholds, tax, initial suppliers/prices); export full catalog with current stock, average
cost, and supplier summary.

**Audit History / Activity Log:** every field change logged (before/after), especially
changes to units, category, and thresholds (these affect downstream calculations and
alerts). The **movement history** (transaction ledger) is a distinct, append-only view
showing every stock-affecting event for the item across all sub-modules, each entry linking
back to its originating transaction (Purchase Receipt #, Adjustment #, Consumption
reference, Transfer #, Waste #, Count #).

**Role-Based Permissions:** `items.*` — Admin/Manager create, update, deactivate; Chef,
Cashier, Waiter, Staff typically read-only (to check stock/recipe availability); a dedicated
Inventory/Storekeeper role (recommended addition, see §11) would get full create/update.

**Error Scenarios**
- Saving an item with mismatched purchase/stock units and no conversion path → rejected with
  a clear message to define the conversion first.
- Creating a duplicate SKU → rejected.
- Deactivating an item that has open (non-final-state) Purchases or Transfers referencing it
  → warned, and typically blocked until those are resolved, since deactivation would strand
  an in-flight transaction.

**Edge Cases**
- An item with **zero suppliers** trying to be used in a new Purchase — should be blocked or
  require inline supplier creation, since Purchases are supplier-scoped.
- An item's stock unit conversion is corrected after receipts already exist — historical
  quantities remain as originally recorded (immutable); only the item's *displayed*
  purchase-unit-equivalent for new transactions changes.
- Batch-tracked item with **multiple open batches at different costs** — average cost
  calculation must correctly weight all open batches, not just the most recent.
- An item used in a Recipe gets deactivated — the system must warn that active recipes
  reference it, since Consumption would fail at time of sale otherwise.

**Future Extensibility**
- Costing method configurable per item (Moving Average, FIFO, LIFO, Standard Cost).
- Multi-location stock per item (already anticipated by the location concept in §2, formalized
  fully once multi-outlet is in scope).
- Nutritional/allergen metadata for compliance and menu display.
- Auto-reorder suggestions and auto-generated draft Purchases when stock crosses Reorder
  Level.

---

### 4.4 Suppliers

**Business Purpose**
Maintains the profile, terms, and performance history of every vendor the restaurant buys
from, and links suppliers to the items they can provide, so Purchasing always has accurate,
current sourcing information.

**Functional Requirements**
1. Create, view, update, and deactivate supplier profiles.
2. Capture contact person, multiple phone numbers, email, address, and tax information
   (e.g., tax registration number).
3. Capture **payment terms** (e.g., Net 15/30/45, Cash on Delivery, Advance).
4. Mark a supplier as **preferred** (for tie-breaking or default selection in Purchases).
5. Assign **multiple items** to a supplier, each with its own last quoted price and,
   optionally, lead time and minimum order quantity.
6. Maintain a **complete purchase history** per supplier (every Purchase and Goods Receipt
   linked to them).
7. Support **Active/Inactive** status and free-text notes.

**User Stories**
- As a Purchasing user, I want to see all items "Fresh Foods Co." supplies along with their
  last price, so I can quickly build a purchase order.
- As a Manager, I want to see total spend per supplier over the last quarter, so I can
  negotiate better terms with high-volume vendors.
- As an Admin, I want to be blocked from deleting a supplier who has purchase history, so
  historical purchase records always remain attributable.

**Business Workflow**
1. Supplier profile is created with contact and terms.
2. Items are linked to the supplier with quoted pricing.
3. Supplier becomes selectable when creating a Purchase.
4. Every Purchase/Goods Receipt against the supplier accumulates into their purchase
   history and performance metrics (on-time rate, rejection rate — see Reports §4.12).

**Business Rules**
- BR-S1: A supplier with any purchase history (at least one linked Purchase) cannot be
  deleted — only deactivated.
- BR-S2: One supplier can supply multiple items; one item can have multiple suppliers
  (many-to-many).
- BR-S3: An inactive supplier cannot be selected for new Purchases but remains visible on
  historical Purchases.
- BR-S4: Only one supplier per item may be flagged "preferred" at a time.
- BR-S5: Deactivating a supplier that is the sole supplier for one or more active items
  should raise a warning (not necessarily a hard block) since it may leave those items
  unsourceable.

**Validation Rules**
- Supplier name required, unique (case-insensitive).
- At least one contact method (phone or email) required.
- Tax information format validated against the configured tax regime's rules, if provided.
- Payment terms, if provided, must reference a supported term type or a valid custom day
  count.

**Lifecycle / Status Flow:** `Active ⇄ Inactive`.

**Required Fields:** Supplier Name, at least one contact method, active status.
**Optional Fields:** Contact Person, additional phone numbers, email, address, tax
information, payment terms, preferred flag, notes.

**Relationships with Other Modules**
- Items: many-to-many, with pricing metadata per pair.
- Purchases: every Purchase references exactly one supplier.
- Reports: Supplier Purchase report, spend analysis, on-time/rejection performance.

**Search / Filter / Sort:** search by name, contact person, phone, email; filter by
active/inactive, preferred, has-open-purchases; sort by name, total spend, last purchase
date.

**Bulk Operations:** bulk activate/deactivate, bulk payment-terms update, bulk item-price
list import for a single supplier.

**Import/Export:** import supplier list via spreadsheet (name, contact, phone, email,
address, tax info, terms); export supplier list with total historical spend and item count.

**Audit History / Activity Log:** log all profile changes, especially payment terms and
preferred-supplier flag changes, and item-price updates (each price change is a discrete
logged event, since it affects future purchase order defaults).

**Role-Based Permissions:** `suppliers.*` — Admin/Manager full access; Purchasing-facing
roles read + create; other operational roles read-only or no access, depending on
sensitivity of contact/pricing data.

**Error Scenarios**
- Deleting a supplier with purchase history → blocked, with a count of linked purchases
  shown, offering deactivation instead.
- Creating a duplicate supplier name → rejected.
- Linking the same item to the same supplier twice → rejected/merged into a single link.

**Edge Cases**
- A supplier's tax information changes mid-year — historical Purchases keep the tax info as
  it was at the time of the transaction (immutable snapshot), while the supplier profile
  shows the current value.
- A supplier is deactivated while a Purchase in Draft/Ordered status still references them —
  the existing purchase remains valid and processable to completion; only new Purchases are
  blocked from selecting the inactive supplier.

**Future Extensibility**
- Supplier scorecards (on-time %, rejection %, price trend) as a standing dashboard widget.
- Multi-currency supplier support.
- Supplier portal for direct order confirmation/ASN (advance shipping notice) submission.

---

### 4.5 Purchases

**Business Purpose**
Formalizes the intent to buy — a purchase order — capturing what is being ordered, from
whom, at what price, and under what terms, **without** affecting on-hand inventory. Purchases
represent a commitment/expectation; only Goods Receipt (§4.6) makes stock real.

**Functional Requirements**
1. Create, view, update (while editable), and cancel purchase orders.
2. Capture Purchase Number (auto-generated, human-readable, sequential), Purchase Date,
   Supplier, Expected Delivery Date.
3. Capture one or more **line items**: Item, Quantity, Purchase Unit, Unit Price.
4. Support line-level and/or order-level **discounts**, **taxes**, **freight charges**, and
   **other charges**.
5. Auto-calculate line totals, tax amounts, discount amounts, and grand total.
6. Support order-level **notes**.
7. Support a defined **status lifecycle** (below).
8. Link one Purchase to **one or more Goods Receipts** (supporting partial delivery).

**User Stories**
- As a Purchasing user, I want to create a Purchase Order for 50 kg of Chicken Breast from
  "Fresh Foods Co." at ₹200/kg, so the supplier has a formal order to fulfill.
- As a Manager, I want Draft purchase orders to remain editable, so mistakes can be fixed
  before the order is sent to the supplier.
- As an Accountant, I want a Received purchase order to become read-only, so the financial
  record can't be altered after the fact.
- As an Inventory Manager, I want to see that a Purchase is "Partially Received," so I know
  more delivery is still expected.

**Business Workflow**
1. Purchasing user creates a Purchase in **Draft**, adding supplier and line items.
2. Purchase is finalized and moves to **Ordered** (sent to supplier — conceptually; sending
   mechanism is out of scope here).
3. As goods arrive, one or more Goods Receipts are recorded against the Purchase (§4.6).
4. Purchase status auto-updates to **Partially Received** or **Received** based on
   received-vs-ordered quantities across all linked receipts.
5. A Purchase can be **Cancelled** at any point before it is fully Received (subject to
   BR-P4).

**Business Rules**
- BR-P1: Purchases in **Draft** status can be freely edited (supplier, items, quantities,
  prices).
- BR-P2: Purchases in **Ordered** status can have quantities/prices adjusted only via a
  tracked amendment (logged as a change, not a silent edit) — full open editing is
  discouraged once a supplier may have already seen the order.
- BR-P3: Purchases in **Received** status are **read-only** — no field can be changed;
  corrections must be handled via Stock Adjustments or a follow-up Purchase, never by
  editing history.
- BR-P4: A Purchase **cannot be cancelled** once any Goods Receipt has been recorded against
  it (would contradict actual received stock) — it can only be cancelled while in Draft or
  Ordered with zero receipts.
- BR-P5: **Purchases alone must never increase inventory.** Creating or approving a Purchase
  has zero stock effect; only a linked Goods Receipt does (see GR-2 in §7).
- BR-P6: Multiple Goods Receipts can be linked to one Purchase (partial deliveries over
  time); the Purchase closes to **Received** only when cumulative received quantity meets or
  exceeds ordered quantity for every line (configurable tolerance — see Goods Receipt BR-GR3
  for over-receipt handling).
- BR-P7: Every calculated total (line total, tax, discount, grand total) must be derived,
  never manually overridden in a way that breaks arithmetic traceability — manual overrides,
  if allowed at all, must be a distinct, logged "manual override" value alongside the
  calculated one.

**Validation Rules**
- Supplier required; must be active.
- At least one line item required; each line item requires Item (active), Quantity (> 0),
  Purchase Unit (valid for the item), Unit Price (≥ 0).
- Expected Delivery Date, if provided, should not precede Purchase Date.
- Discounts/taxes/charges must be non-negative and, where percentage-based, between 0–100%.
- An item appearing twice as separate line items within the same Purchase should be
  flagged/merged (configurable — some businesses want to allow split lines for different
  batches/prices).

**Lifecycle / Status Flow**
```
Draft → Ordered → Partially Received → Received
  │        │                              ▲
  └────────┴──────────────▶ Cancelled ────┘ (cancellation only before any receipt)
```
- Draft: fully editable, not yet visible to supplier-facing processes.
- Ordered: committed, supplier notified conceptually; amendments are tracked, not silent.
- Partially Received: at least one Goods Receipt exists, but not all lines fully received.
- Received: all lines fully received (within tolerance); read-only.
- Cancelled: terminal state, only reachable from Draft/Ordered with zero receipts.

**Required Fields:** Purchase Number, Purchase Date, Supplier, at least one Line Item
(Item, Quantity, Purchase Unit, Unit Price), Status.
**Optional Fields:** Expected Delivery Date, Discounts, Taxes (if not auto-derived from item
tax config), Freight Charges, Other Charges, Notes.

**Relationships with Other Modules**
- Suppliers: each Purchase belongs to exactly one supplier.
- Items: each line item references exactly one item, in its purchase unit.
- Goods Receipt: one-to-many — a Purchase can have multiple receipts.
- Ledger/Accounting (external): a Received (or partially received) Purchase generates a
  payable/financial record.
- Reports: Purchase Report, Supplier Purchases report.

**Search / Filter / Sort:** search by Purchase Number, supplier name; filter by status, date
range, supplier; sort by date, grand total, status.

**Bulk Operations:** bulk status transition (e.g., mark multiple Draft POs as Ordered), bulk
export of selected purchase orders, bulk cancellation (Draft/Ordered-with-zero-receipts
only).

**Import/Export:** import a purchase order from a spreadsheet template (supplier + line
items); export a purchase order as a formatted document for sending to the supplier; export
purchase history for a date range.

**Audit History / Activity Log:** every status transition, every line item change (Draft/
Ordered stage), and every amendment is logged with who/when/before/after. Received purchases
have no further edit events — only linked Goods Receipt events reference them.

**Role-Based Permissions:** `purchases.*` — Manager/Purchasing role create & edit;
Admin approve/cancel; Chef/Waiter/Cashier no access (not relevant to their role); Accountant
read-only for financial reconciliation.

**Error Scenarios**
- Attempting to edit a Received purchase → blocked with explanation; directs user to Stock
  Adjustment instead.
- Attempting to cancel a purchase with an existing Goods Receipt → blocked.
- Line item quantity or price of zero/negative → rejected at save time.

**Edge Cases**
- Supplier changes their price after a Purchase is Ordered but before receipt — the
  Purchase's price is what was agreed at order time; the actual invoiced price is reconciled
  during Goods Receipt/financial matching, with variance flagged, not silently overwritten.
- A Purchase is partially received, then the remaining quantity is never delivered
  (supplier shortfall) — the Purchase should support being manually closed as "Received"
  short of full quantity (with a reason), rather than sitting open indefinitely, or,
  alternatively, the outstanding portion can be cancelled at the line level (extensibility:
  line-level cancellation vs. whole-order cancellation).
- Multiple partial receipts arriving on different dates, each with different batch/expiry
  data for the same line item — each receipt is its own distinct stock-affecting event (see
  §4.6).

**Future Extensibility**
- Supplier acknowledgment / order confirmation workflow.
- Budget/approval thresholds requiring Manager sign-off above a configured amount.
- Auto-generation of draft Purchases from Low Stock report data.
- Landed cost allocation (freight/other charges distributed across line items for accurate
  per-unit costing).

---

### 4.6 Goods Receipt

**Business Purpose**
Represents the physical, verified arrival of ordered goods. This is the sub-module that
actually increases inventory — the operational moment where "ordered" becomes "on the
shelf."

**Functional Requirements**
1. Create a Goods Receipt against an existing Purchase (or, optionally, a supported
   "receipt without a prior purchase" flow for ad-hoc/emergency buys — see extensibility).
2. Support **partial receiving** — receive less than the full ordered quantity per line.
3. Support **multiple receipts** against the same Purchase over time.
4. Capture, per line: **Received Quantity**, **Rejected Quantity**, **Damaged Quantity**.
5. Capture **Batch Number** and **Expiry Date** per received line (when the item is
   batch/expiry-tracked).
6. Capture **Storage Location** for the received stock.
7. Capture **Receiving Notes** (e.g., "2 crates delayed, rest complete").
8. Automatically generate the corresponding **inventory transaction(s)** that increase stock.
9. Maintain a complete **receiving history**, queryable by item, supplier, purchase, or date.

**User Stories**
- As a Storekeeper, I want to record that 48 of 50 kg of Chicken Breast arrived, with 2 kg
  rejected for poor quality, so inventory reflects exactly what's usable.
- As a Storekeeper, I want to assign a batch number and expiry date when receiving dairy, so
  expiry tracking and FIFO usage work correctly downstream.
- As a Manager, I want to see that a Purchase is complete only when total received quantity
  (across every receipt) meets the ordered amount, so nothing is missed.

**Business Workflow**
1. Delivery arrives; Storekeeper opens the linked Purchase and starts a new Goods Receipt.
2. For each line, enters Received/Rejected/Damaged quantities, batch/expiry (if applicable),
   and storage location.
3. On save, the system creates one inventory transaction per received line item (increasing
   stock in the specified stock unit and location), and records rejected/damaged quantities
   separately for supplier accountability and quality reporting — these do **not** increase
   usable stock.
4. The linked Purchase's status recalculates (Partially Received / Received) based on
   cumulative receipts.
5. Average cost for each received item recalculates (moving average across current stock +
   newly received stock, weighted by quantity and price).

**Business Rules**
- BR-GR1: **Inventory increases only after a Goods Receipt is recorded** — never at Purchase
  creation/approval (reinforces BR-P5 / GR-2).
- BR-GR2: Each Goods Receipt creates its own set of inventory transactions; these
  transactions are immutable once saved (corrections happen via a reversing Stock
  Adjustment, never by editing a historical receipt).
- BR-GR3: **Receiving more than ordered** must follow a configurable rule per business
  policy: (a) block over-receipt entirely, (b) allow with a warning and require a reason
  note, or (c) allow silently within a configured tolerance percentage. Default recommended:
  (b).
- BR-GR4: Rejected and Damaged quantities are logged for reporting/accountability but do
  **not** add to usable stock; only Received-and-accepted quantity increases stock.
- BR-GR5: If the item is batch/expiry-tracked, Batch Number and Expiry Date are mandatory on
  that receipt line; if not tracked, they are unavailable/irrelevant fields.
- BR-GR6: A Goods Receipt cannot be recorded against a Purchase in **Draft** status (must be
  at least Ordered) or against a **Cancelled** Purchase.
- BR-GR7: Complete receiving history (every receipt, every line, every quantity split) must
  be permanently retained and traceable back to its Purchase.

**Validation Rules**
- Must reference a valid, non-Draft, non-Cancelled Purchase.
- Received + Rejected + Damaged quantities per line should not exceed the ordered quantity
  for that line, unless the over-receipt policy (BR-GR3) explicitly allows it.
- Received Quantity must be ≥ 0; if zero for every line, the receipt itself is meaningless
  and should be rejected (nothing to receive).
- Batch Number, if required, must be unique per item (or per item+supplier, business
  configurable) to avoid ambiguous batch identity.
- Expiry Date, if required, must be a future date relative to the receipt date (a receipt of
  already-expired stock is an edge case handled explicitly — see below).

**Lifecycle / Status Flow:** A Goods Receipt itself is typically a single-state, immutable
event once saved: `Recorded` (terminal). It does not have its own multi-step lifecycle; its
existence and content drive the parent Purchase's lifecycle instead. (If the business wants
a review/approval step before stock is affected, an optional `Draft Receipt → Confirmed`
sub-state can be added as an extensibility item.)

**Required Fields:** Linked Purchase, Receipt Date, at least one line with Item, Received
Quantity, Storage Location.
**Optional Fields:** Rejected Quantity, Damaged Quantity, Batch Number, Expiry Date,
Receiving Notes.

**Relationships with Other Modules**
- Purchases: many-to-one (a Purchase can have many receipts).
- Items: quantities received directly affect item stock and average cost.
- Stock Adjustments: used to correct a receipt after the fact, rather than editing it.
- Suppliers: rejection/damage rates roll up into supplier performance reporting.
- Reports: feeds Stock Movement, Stock Ledger, Purchase Report, Inventory Valuation.

**Search / Filter / Sort:** search by receipt number, purchase number, supplier, item;
filter by date range, has-rejections, has-damage; sort by date, supplier, total received
value.

**Bulk Operations:** bulk receipt entry for multi-line purchases (grid-style entry across
all lines at once); bulk export of receiving history.

**Import/Export:** import receipt line data from a supplier delivery note/spreadsheet
(matched against the open Purchase); export receiving history for a date range or supplier.

**Audit History / Activity Log:** every receipt is itself an immutable audit record; no
"edit" events exist for a saved receipt (by design — corrections flow through Stock
Adjustments, which are separately audited).

**Role-Based Permissions:** `goods-receipt.*` (or folded into `purchases.*` — see §11) —
Storekeeper/Inventory role and Manager can create; Admin can view all; Cashier/Waiter no
access.

**Error Scenarios**
- Attempting to receive against a Draft or Cancelled Purchase → blocked.
- Attempting to receive a batch-tracked item without batch/expiry data → blocked with a
  field-level validation message.
- Attempting to receive a quantity that would breach the over-receipt policy → blocked or
  warned per configuration (BR-GR3).

**Edge Cases**
- Receiving stock that is **already expired at time of receipt** (e.g., a shipment delayed
  in transit) — the system should allow recording it (it did physically arrive) but should
  immediately flag it for the Near Expiry/Expired report and, ideally, prompt an immediate
  Waste entry rather than treating it as normal usable stock.
- A single delivery contains items from **multiple purchases** (consolidated shipment) — the
  Storekeeper needs to create receipts against each relevant Purchase separately, since
  receipts are Purchase-scoped by design (extensibility: a "multi-purchase receipt" wizard
  that splits into multiple underlying receipt records).
- Partial receipt where the remaining quantity is later formally cancelled rather than ever
  received — see Purchases §4.5 edge case on partial-then-short-closed orders.

**Future Extensibility**
- Receipt confirmation/approval step before stock posts (for high-value categories).
- Quality inspection checklist attached to a receipt (beyond simple Rejected/Damaged
  quantities).
- Direct receiving without a prior Purchase, for genuinely ad-hoc/emergency purchases, with
  retroactive Purchase creation for record-keeping.
- Mobile/barcode-scan-assisted receiving.

---

### 4.7 Stock Adjustments

**Business Purpose**
Provides a controlled, fully auditable way to correct inventory quantities for reasons that
fall outside the normal purchase/consumption/transfer/waste flows — the "catch-all" that
keeps recorded stock aligned with reality without ever silently editing history.

**Functional Requirements**
1. Create an adjustment that either **increases** or **decreases** an item's stock.
2. Require a **reason** selected from a controlled list: Damage, Missing Stock, Correction,
   Manual Entry, System Error, Administrative Update (extensible list).
3. Record Item, Quantity, Unit, Reason, User, Date, and Notes for every adjustment.
4. Generate the corresponding inventory transaction immediately on save.
5. Maintain a complete, permanent **adjustment history**.

**User Stories**
- As a Storekeeper, I want to decrease stock for "Milk" by 2 liters with reason "Damage,"
  after finding a leaking container, so recorded stock matches the shelf.
- As a Manager, I want every adjustment to require a note, so there's always a documented
  reason behind stock changes that don't come from a normal transaction.
- As an Auditor, I want to see every adjustment ever made to an item, with who made it and
  why, so I can investigate discrepancies.

**Business Workflow**
1. User identifies a discrepancy (physical count differs from system, damage found outside
   a formal waste process, a data entry error needs correcting, etc.).
2. User creates a Stock Adjustment: selects item, direction (increase/decrease), quantity,
   unit, reason, and notes.
3. System validates and, on save, posts an inventory transaction and updates the item's
   on-hand stock immediately.
4. Adjustment becomes part of the permanent, unchangeable history.

**Business Rules**
- BR-A1: Every adjustment must have a reason from the controlled list; "Manual Entry"/
  "Administrative Update" are the closest to a free-form catch-all but still require notes.
- BR-A2: Adjustments are **immutable once saved** — a mistaken adjustment is corrected with a
  new, opposite adjustment, never by editing or deleting the original (preserves the audit
  trail, mirrors GR-1/GR-4 in §7).
- BR-A3: A decrease adjustment cannot take an item's stock below zero unless negative stock
  is explicitly enabled for that item/business (see GR-3 in §7).
- BR-A4: Adjustments affecting batch-tracked items must specify which batch is affected, if
  more than one open batch exists for that item.
- BR-A5: Large adjustments (above a configurable quantity or value threshold) should require
  a second-level approval before posting (extensibility, but strongly recommended as a
  standard control for a production system).

**Validation Rules**
- Item required and must be active.
- Quantity required, must be a positive number (direction is a separate increase/decrease
  selector, not a signed quantity, to avoid sign-entry errors).
- Unit required, must be valid for the item (defaults to stock unit).
- Reason required from the controlled list.
- Notes required when reason is "Manual Entry," "Administrative Update," or "Correction"
  (business rule: the more ambiguous the reason, the more mandatory the explanation).

**Lifecycle / Status Flow:** Single-state, immutable once posted: `Posted` (terminal). If
approval workflow is enabled (BR-A5), an optional `Pending Approval → Posted / Rejected`
sub-flow applies.

**Required Fields:** Item, Direction (increase/decrease), Quantity, Unit, Reason, User,
Date.
**Optional Fields:** Batch reference, Notes (conditionally required per BR reasons above),
supporting attachment (e.g., a photo of damage — extensibility).

**Relationships with Other Modules**
- Items: directly affects item on-hand stock and, for increases, potentially average cost
  (business rule: increase adjustments typically use the item's current average cost rather
  than introducing a new cost basis, since no purchase price is associated).
- Stock Count: variances from a physical count typically **generate** Stock Adjustments
  automatically (see §4.11).
- Reports: Adjustment Report, Stock Ledger, Stock Movement.

**Search / Filter / Sort:** search by item, user; filter by reason, direction, date range,
value range; sort by date, quantity, value.

**Bulk Operations:** bulk adjustment entry (e.g., correcting multiple items after a count),
typically originating from the Stock Count workflow rather than free-standing bulk entry (to
keep ad-hoc adjustments deliberate and individually justified).

**Import/Export:** import a batch of adjustments from a spreadsheet (item, direction,
quantity, reason, notes) for large one-time corrections; export adjustment history for a
date range or reason.

**Audit History / Activity Log:** every adjustment is itself a permanent audit record —
who, when, item, quantity, direction, reason, notes, and (if applicable) the approving user.

**Role-Based Permissions:** `stock-adjustments.*` — Storekeeper/Manager create; Admin
approve (if approval workflow enabled) and view all; Cashier/Waiter/Chef no access.

**Error Scenarios**
- Decrease adjustment that would breach zero stock on a non-negative-stock item → blocked.
- Adjustment submitted with a reason requiring notes but no notes provided → blocked.
- Adjustment on an inactive item → blocked (inactive items don't participate in new
  transactions, per BR-I6).

**Edge Cases**
- Two adjustments submitted concurrently for the same item (race condition) — the system
  must serialize inventory transaction posting per item so stock never reflects a lost
  update.
- An adjustment corrects a batch-tracked item but the specific batch has since been fully
  consumed/transferred out — the adjustment should be blocked or redirected to a different
  (open) batch, since adjusting a non-existent batch quantity is meaningless.
- A very large adjustment value is entered by mistake (fat-finger error) — approval
  threshold (BR-A5) is the primary control; a confirmation step for unusually large
  quantities is a recommended secondary control.

**Future Extensibility**
- Photo/attachment evidence for damage-reason adjustments.
- Approval workflow with configurable thresholds by role/value.
- Root-cause analytics (which items/reasons drive the most adjustment volume, feeding
  process-improvement decisions).

---

### 4.8 Stock Consumption

**Business Purpose**
Represents inventory leaving the system because it was used — primarily through recipe-based
kitchen production tied to menu sales, but also manual/internal usage — while keeping
inventory valuation accurate at all times.

**Functional Requirements**
1. Automatically deduct stock when a recipe-linked menu item is sold/prepared (integration
   with Recipe Management and Kitchen Operations/KOT).
2. Support **manual deduction** for internal usage not tied to a sale (e.g., staff meals,
   testing a new recipe).
3. Maintain complete **consumption history**, per item and per originating order/recipe.
4. Support **reversal** of consumption when a linked order is cancelled or voided after
   preparation began (returns stock, fully traceable to the original consumption event).
5. Support **reason tracking** for manual consumption (Staff Meal, Recipe Testing, Internal
   Use, Other).

**User Stories**
- As the system, when a "Butter Chicken" order is confirmed/prepared, I want to
  automatically deduct the recipe's ingredient quantities from inventory, so stock always
  reflects what's actually been used.
- As a Chef, I want to manually log consumption of 500 g of Paneer for a staff meal, so
  non-sale usage is still tracked accurately.
- As a Manager, I want a cancelled order (after KOT preparation started) to reverse its
  ingredient consumption, so inventory isn't wrongly understated.

**Business Workflow**
1. **Automatic path:** Billing/POS or Kitchen Operations confirms an order line for a
   recipe-linked menu item → Recipe Management resolves the ingredient list and quantities
   (per the item's recipe, scaled by quantity ordered) → Stock Consumption posts one
   inventory transaction (decrease) per ingredient, in its stock unit.
2. **Manual path:** User selects item(s), quantity, unit, and reason → Stock Consumption
   posts the same kind of transaction directly, without an order reference.
3. **Reversal path:** An order that already triggered consumption is cancelled/voided →
   Stock Consumption posts an equal-and-opposite (increase) transaction referencing the
   original consumption event, restoring stock.

**Business Rules**
- BR-SC1: Every consumption event — automatic or manual — creates an inventory transaction;
  none are ever applied by directly editing the item's stock value.
- BR-SC2: **Negative inventory as a result of consumption must be configurable** — some
  restaurants need to allow the kitchen to keep operating even if the system's recorded
  stock momentarily runs out (e.g., due to un-entered receipts), while others require a hard
  stop. Default recommendation: warn and allow, flag for reconciliation, rather than block
  kitchen operations outright — but this must be a conscious business decision (see §7 GR-3).
- BR-SC3: Reversal consumption must reference the original consumption transaction it
  reverses — a reversal is never a free-standing manual increase (traceability requirement).
- BR-SC4: **Inventory valuation (average cost) must remain accurate** after every
  consumption — consumption reduces quantity but does not change the item's average cost
  basis (cost basis only changes on receipt), and reversal restores both quantity and the
  value it represented.
- BR-SC5: Consumption for an item without an active recipe (data gap) must not silently
  fail — it should surface an actionable error to whoever is responsible for recipe
  maintenance.

**Validation Rules**
- Item(s) must be active and have sufficient recipe/manual data to determine quantity.
- Quantity must be positive; unit must be valid for the item (or convertible to its stock
  unit).
- Manual consumption requires a reason from the controlled list.
- Reversal must reference an existing, non-reversed consumption transaction (a transaction
  cannot be reversed twice).

**Lifecycle / Status Flow:** Single-state, immutable once posted: `Posted`, with an optional
linked `Reversed` marker applied to the original transaction once a reversal is posted
against it (the original is not deleted or edited — a new reversing transaction is created
and the two are linked).

**Required Fields:** Item, Quantity, Unit, Source (Automatic/Manual), Date, User (for manual)
or originating Order/KOT reference (for automatic).
**Optional Fields:** Reason (required for manual, not applicable for automatic), Notes.

**Relationships with Other Modules**
- Recipe Management (external): defines what quantity of which items is consumed per menu
  item unit.
- Kitchen Operations/KOT (external): triggers automatic consumption at the appropriate
  point in the order lifecycle (business-configurable: at KOT creation, at preparation
  start, or at order completion — a single, clearly documented trigger point should be
  chosen to avoid double-counting).
- Billing/POS (external): order cancellation/void triggers reversal.
- Items: every consumption/reversal directly affects on-hand stock.
- Reports: Consumption Report, Stock Ledger, Stock Movement, Inventory Valuation.

**Search / Filter / Sort:** search by item, order/KOT reference; filter by source
(automatic/manual), reason, date range, reversed/not-reversed; sort by date, quantity,
value.

**Bulk Operations:** bulk manual consumption entry (e.g., logging a batch of staff meals at
end of shift).

**Import/Export:** export consumption history for a date range, item, or menu item (to
analyze recipe cost accuracy); import is generally not applicable (consumption should be
system-generated or individually logged, not bulk-imported, to preserve traceability to real
events).

**Audit History / Activity Log:** every consumption and reversal is a permanent record,
linked to its source (order/KOT reference or manual user entry).

**Role-Based Permissions:** `stock-consumption.*` — system-level/automatic consumption
requires no direct user permission (it's triggered by Billing/Kitchen events); manual
consumption entry restricted to Chef/Storekeeper/Manager.

**Error Scenarios**
- Automatic consumption triggered for a menu item with no defined recipe → surfaced as a
  data-integrity error/alert, not a silent no-op.
- Manual consumption submitted without a reason → blocked.
- Reversal attempted against a transaction that's already reversed → blocked.

**Edge Cases**
- An order is modified (quantity increased) after initial consumption already posted — the
  system must post an **additional** consumption transaction for the delta, not attempt to
  edit the original.
- A recipe changes (ingredient substitution) after some orders were already prepared under
  the old recipe — historical consumption reflects the recipe version active at the time,
  not the current recipe (immutability of history).
- Consumption would take stock negative, and negative stock is disabled — kitchen
  operations need a clear, immediate signal (not just a silent backend rejection) that an
  ingredient is unavailable.

**Future Extensibility**
- Recipe-yield variance tracking (expected consumption vs. actual, to catch portioning
  drift).
- Configurable consumption trigger point per business preference.
- Real-time stock-availability checks at order-taking time (before KOT), to prevent taking
  orders the kitchen can't fulfill.

---

### 4.9 Stock Transfer

**Business Purpose**
Tracks inventory moving between internal locations (e.g., Main Store → Kitchen, Kitchen →
Bar, Store → Waste Area) so stock is always attributable to where it physically is, not just
how much of it exists somewhere in the business.

**Functional Requirements**
1. Create a transfer request specifying source location, destination location, item(s), and
   quantities.
2. Support a multi-step **approval and fulfillment lifecycle** (below).
3. Automatically update inventory (decrease at source, increase at destination) upon
   completion.
4. Maintain complete **transfer history**.

**User Stories**
- As Kitchen staff, I want to request 5 kg of Rice from the Main Store, so prep can begin
  for the day.
- As a Storekeeper, I want to approve and fulfill that request, so the Kitchen's local stock
  reflects what was actually handed over.
- As a Manager, I want to see every transfer between locations for the week, so I can
  understand internal stock flow, not just net consumption.

**Business Workflow**
1. Requesting location submits a transfer **Request** (item(s), quantities, destination).
2. Source location (or a Manager) **Approves** the request (may adjust quantities if source
   stock is insufficient).
3. Source location fulfills the transfer — stock is picked and marked **Transferred**
   (decrease posted at source at this point, per business configuration — see BR-T3).
4. Destination location confirms **Received** — stock is posted as increased at the
   destination.
5. A transfer may be **Cancelled** before fulfillment.

**Business Rules**
- BR-T1: **Source stock must be available** at the quantity requested (or approved quantity,
  if adjusted) before a transfer can move to Transferred — subject to the same
  negative-stock configuration as other decrease-type transactions (GR-3).
- BR-T2: **Transfers update inventory automatically** — no manual adjustment is needed
  alongside a transfer; the transfer itself is the transaction source for both the decrease
  (source) and increase (destination).
- BR-T3: The point at which stock actually decreases at source is a configurable business
  decision: either at **Approved→Transferred** (goods physically leave source) or only at
  final **Received** confirmation (safer against loss-in-transit but delays source stock
  accuracy). Default recommendation: decrease at Transferred, increase at Received — so
  in-transit stock is neither at source nor destination but is still visible as "in
  transit" for full traceability.
- BR-T4: A transfer cannot be edited once it has reached **Transferred** — subsequent
  corrections happen via a new transfer or an adjustment, never by editing the original.
- BR-T5: Complete transfer history (every status change, quantities, users, timestamps)
  must be permanently retained.

**Validation Rules**
- Source and destination locations must be different and both valid, active locations.
- Item(s) must be active; quantity must be positive and must not exceed source's available
  stock at the time of Approval/Transfer (per BR-T1).
- A transfer requires at least one line item.

**Lifecycle / Status Flow**
```
Requested → Approved → Transferred → Received
     │           │
     └───────────┴────────────▶ Cancelled (only before Transferred)
```

**Required Fields:** Source Location, Destination Location, at least one line item (Item,
Quantity, Unit), Status, Requesting User.
**Optional Fields:** Notes, Approving User, Fulfilling User, Receiving User (populated as the
lifecycle progresses).

**Relationships with Other Modules**
- Items: quantity moves between locations; total system-wide stock is unchanged by a
  transfer (it is a location reallocation, not a gain/loss).
- Stock Consumption: destination-location stock, once received, becomes available for
  consumption at that location (e.g., Kitchen consumption draws from Kitchen's local stock,
  not the Main Store's).
- Reports: Transfer Report, Stock Movement, Stock Ledger (location-aware).

**Search / Filter / Sort:** search by transfer number, item, location; filter by status,
source/destination, date range; sort by date, status, quantity.

**Bulk Operations:** bulk-approve multiple pending requests; bulk transfer of multiple items
in one transfer document (multi-line transfers).

**Import/Export:** export transfer history for a date range or location pair; import is
generally not applicable (transfers should originate from an actual operational request).

**Audit History / Activity Log:** every status transition logged with user and timestamp;
quantity changes during Approval (if adjusted from requested) explicitly logged as a
distinct event.

**Role-Based Permissions:** `stock-transfers.*` — any operational role can Request; Manager/
Storekeeper Approve and Fulfill; destination-location staff confirm Received.

**Error Scenarios**
- Approving a transfer for more than available source stock → blocked or warned per
  negative-stock configuration.
- Attempting to edit a Transferred/Received transfer → blocked.
- Cancelling a transfer already marked Transferred → blocked (goods have already left
  source; must be handled as a reverse transfer or adjustment instead).

**Edge Cases**
- Destination location disputes the received quantity (less arrived than the source marked
  as Transferred) — needs a "receiving variance" note field, and the discrepancy should
  route to a Stock Adjustment at the destination for full traceability rather than silently
  editing the transfer.
- A transfer to a **Waste Area** location effectively overlaps conceptually with Waste
  Management (§4.10) — the recommended model is that "Waste Area" is a valid transfer
  destination for physically moving discarded goods, while the actual **cost/loss
  recognition** happens through a Waste entry, keeping the two sub-modules complementary
  rather than duplicative.

**Future Extensibility**
- Real-time in-transit visibility (a distinct "in transit" stock state between source
  decrease and destination increase).
- Transfer templates for recurring daily/shift-based replenishment patterns (e.g., Kitchen's
  standard morning pull from Main Store).
- Location-level reorder thresholds triggering auto-suggested transfers.

---

### 4.10 Waste Management

**Business Purpose**
Captures inventory lost to spoilage, error, breakage, or other non-sale reasons, with full
cost and accountability, so waste is visible, analyzable, and actionable rather than
disappearing quietly into unexplained stock variance.

**Functional Requirements**
1. Create a waste entry for an item, quantity, and reason.
2. Support a controlled reason list: Expired, Spoiled, Burnt, Preparation Loss, Customer
   Return, Broken, Damaged (extensible).
3. Capture the **cost** of the wasted quantity (using the item's current average cost,
   ensuring waste is valued consistently with the rest of inventory).
4. Capture the **responsible employee** (accountability — not necessarily punitive, but
   for trend analysis and training/process feedback).
5. Automatically **reduce inventory** on save.
6. Maintain complete, auditable waste history supporting **trend analysis** (by item,
   category, reason, employee, time period).

**User Stories**
- As Kitchen staff, I want to log 1 kg of "Tomato" as Spoiled, so inventory reflects reality
  and management can see produce spoilage trends.
- As a Manager, I want a monthly Waste Report grouped by reason and category, so I can
  identify whether spoilage (storage issue) or preparation loss (training issue) is the
  bigger driver of cost.
- As an Auditor, I want every waste entry to show who logged it, so accountability is clear.

**Business Workflow**
1. User identifies wasted stock (found spoiled, burnt during prep, broken in handling,
   customer sent back an order, etc.).
2. User creates a Waste entry: item, quantity, unit, reason, responsible employee
   (self or observed), date, notes.
3. System calculates the cost of the wasted quantity from the item's current average cost.
4. On save, an inventory transaction (decrease) posts immediately; the waste entry is
   permanent.

**Business Rules**
- BR-W1: **Waste automatically reduces inventory** — there is no separate step; saving the
  waste entry *is* the inventory transaction.
- BR-W2: Every waste transaction must be **auditable** — item, quantity, cost, reason,
  responsible employee, date, and notes are all permanently retained.
- BR-W3: Waste cost is computed from the item's average cost at the time of the waste entry
  — not a manually entered value — so valuation stays internally consistent (mirrors BR-SC4
  for consumption).
- BR-W4: Waste entries are immutable once saved; corrections happen via a Stock Adjustment
  referencing the mistaken waste entry, never by editing the waste record.
- BR-W5: Waste reduction cannot take stock negative unless the item/business explicitly
  allows negative stock (same governing rule as Adjustments/Consumption — GR-3).
- BR-W6: Waste reports must support trend analysis — grouping/filtering by reason, category,
  item, employee, and time period is a functional requirement, not just a nice-to-have (see
  §4.12).

**Validation Rules**
- Item required, must be active; quantity required, must be positive; unit must be valid for
  the item.
- Reason required from the controlled list.
- Responsible employee required (defaults to the logging user if not otherwise specified,
  but should support attributing waste to a different employee, e.g., a Manager logging on
  behalf of kitchen staff).
- Notes recommended, and should be required for "Customer Return" (implies a
  service/quality issue worth documenting) and "Broken"/"Damaged" (implies a
  handling/process issue worth documenting).

**Lifecycle / Status Flow:** Single-state, immutable once posted: `Posted` (terminal),
mirroring Stock Adjustments and Consumption in this respect.

**Required Fields:** Item, Quantity, Unit, Reason, Responsible Employee, Date.
**Optional Fields:** Notes, Cost override flag (generally discouraged per BR-W3, but some
businesses want to record a supplier-attributable cost separately from average cost —
extensibility).

**Relationships with Other Modules**
- Items: directly reduces on-hand stock; does not change average cost basis (only receipts
  do).
- Stock Consumption: "Preparation Loss" waste is conceptually adjacent to consumption but is
  tracked separately because it represents loss, not intended usage — keeping them distinct
  is what makes waste reporting meaningful.
- Stock Transfer: goods physically moved to a "Waste Area" location are formally recognized
  as loss via a Waste entry (see §4.9 edge case).
- Reports: Waste Report is a primary, dedicated report; also feeds Stock Movement, Stock
  Ledger, and Inventory Valuation.

**Search / Filter / Sort:** search by item, employee; filter by reason, category, date
range, cost range; sort by date, cost, quantity.

**Bulk Operations:** bulk waste entry (e.g., end-of-day spoilage log covering several items
at once).

**Import/Export:** import a batch of waste entries from a spreadsheet (for catching up
manual paper logs); export waste history for a date range, category, or reason for
trend-analysis workflows outside the system.

**Audit History / Activity Log:** every waste entry is itself a permanent audit record.

**Role-Based Permissions:** `waste.*` — Chef/Kitchen staff and Storekeeper create; Manager/
Admin view all and run reports; approval threshold for high-value waste is a recommended
extensibility control.

**Error Scenarios**
- Waste quantity exceeding current stock (would go negative) → blocked or warned per
  negative-stock configuration.
- Missing reason or responsible employee → blocked.
- Waste entry for an inactive item → blocked.

**Edge Cases**
- Waste discovered for stock that was never formally received (e.g., informally handed over
  goods) — surfaces a data-integrity gap; the system should still allow logging the waste
  (can't let real-world loss go untracked) while flagging that receiving records may be
  incomplete.
- High-cost waste items (e.g., premium seafood) may warrant a lower approval threshold than
  low-cost items (e.g., garnish) — supports the case for a configurable, value-based approval
  rule (extensibility, consistent with BR-A5 for Adjustments).
- Recurring waste for the same item/reason combination (e.g., "Tomato — Spoiled" every week)
  should be visible as a trend, not just individual entries — this is a reporting
  requirement, not a data-capture one.

**Future Extensibility**
- Photo evidence attached to waste entries.
- Approval workflow for high-value waste.
- Predictive alerts ("this item has an unusually high spoilage rate this month") integrated
  with the Reports/Dashboard module.
- Root-cause categorization beyond a flat reason list (e.g., linking spoilage to a specific
  storage location's temperature log, if such data exists elsewhere).

---

### 4.11 Stock Count

**Business Purpose**
Physically verifies that recorded inventory matches what is actually on hand, closing the
loop on every other sub-module's accuracy and generating corrective Stock Adjustments where
variances are found.

**Functional Requirements**
1. Schedule and create a stock count, scoped to: **Full Inventory**, a specific
   **Category**, or a specific **Location**.
2. Support a **Blind Count** mode (counters do not see system-expected quantities while
   entering counts, to avoid bias).
3. Support **Recounts** for items/locations with significant variance before finalizing.
4. Automatically calculate **variance** (system quantity vs. counted quantity) per item.
5. Support a configurable **approval** step before variances are finalized.
6. Generate **Stock Adjustments** automatically from approved variances.
7. Preserve every historical count permanently, even after adjustments are generated from
   it.

**User Stories**
- As a Manager, I want to schedule a Full Inventory count at month-end, so financial
  reporting is backed by a physical verification.
- As a Storekeeper, I want to perform a Blind Count so I record what I actually see, not what
  the system tells me to expect, avoiding confirmation bias.
- As a Manager, I want variances above a threshold to trigger a Recount before I approve
  them, so a data-entry slip doesn't become a permanent, wrong adjustment.
- As an Auditor, I want every past stock count preserved exactly as it was performed, even
  though its variances are now reflected in current stock, so I can trace today's numbers
  back to their source.

**Business Workflow**
1. Manager schedules/creates a Stock Count with a defined scope (Full / Category /
   Location) and mode (Blind or not).
2. System generates a **count sheet** listing every in-scope item (with or without expected
   quantity shown, per Blind mode).
3. Counter(s) enter counted quantities, optionally per batch for batch-tracked items.
4. System calculates variance per item (counted − system-expected).
5. Items with variance beyond a configured threshold are flagged for **Recount**.
6. Once all variances are within tolerance or recounted, the count is submitted for
   **Approval**.
7. On approval, the system automatically generates one **Stock Adjustment per variant item**
   (increase or decrease, as appropriate), each referencing the Stock Count as its origin.
8. The Stock Count record, including original counted values and variances, is preserved
   permanently — it is not overwritten by the resulting adjustments.

**Business Rules**
- BR-SCT1: **Stock counts may require approval** before variances take effect — this should
  be a configurable requirement (small operations may auto-approve; larger ones require
  Manager sign-off).
- BR-SCT2: **Variances automatically generate Stock Adjustments** — counters/approvers do
  not manually re-key adjustments; the count *is* the source of truth for the resulting
  adjustment's quantity and reason ("Stock Count Variance," a reserved reason value distinct
  from the general Adjustment reason list, or a specific sub-type of "Correction").
  Adjustments generated from a count also link back to the Stock Count.
- BR-SCT3: **Historical counts must be preserved** in full — count date, scope, mode,
  counter(s), every item's system-expected quantity at time of count, counted quantity,
  variance, and final approval status — even after adjustments derived from them have
  posted.
- BR-SCT4: A count cannot be approved (and adjustments generated) while any flagged item is
  still pending Recount.
- BR-SCT5: Once approved and adjustments are posted, a Stock Count is **closed** and cannot
  be reopened or edited; a discovered error in a closed count is corrected via a fresh Stock
  Adjustment (with notes referencing the original count), not by editing history.
- BR-SCT6: A blind count must not reveal the system-expected quantity to the person entering
  counts until after their count is submitted (a business/process rule enforced by the
  workflow design, not just a UI preference).

**Validation Rules**
- Scope (Full/Category/Location) required; if Category or Location, the specific
  category/location required.
- Every in-scope active item must have a counted quantity entered (or be explicitly marked
  "not counted / skipped" with a reason) before submission for approval.
- Counted quantity must be zero or positive.
- Recount is required (blocking approval) for any item whose variance exceeds the
  configured threshold, until recounted within tolerance or manually justified with a note
  and explicit override by an authorized approver.

**Lifecycle / Status Flow**
```
Scheduled → In Progress → Pending Recount(s) → Pending Approval → Approved (Closed)
                                                        │
                                                        └──▶ Rejected (sent back to
                                                             In Progress for correction)
```

**Required Fields:** Count Scope (type + specific category/location if applicable), Count
Mode (Blind/Not Blind), Scheduled Date, at least one counted line item (Item, Counted
Quantity), Status.
**Optional Fields:** Batch-level counts (for batch-tracked items), Notes per line, Recount
justification notes, Approver, Approval Date.

**Relationships with Other Modules**
- Items: every in-scope item's current system quantity is the count's baseline.
- Stock Adjustments: an approved count's variances become Stock Adjustments (one-directional
  generation; a Stock Count is upstream of Stock Adjustments, never the reverse).
- Categories, Locations: define count scope.
- Reports: Stock Count history itself is reportable; variance trend over multiple counts is
  a key operational KPI (shrinkage rate).

**Search / Filter / Sort:** search by count number; filter by scope, status, date range,
has-variance; sort by date, variance magnitude/value, status.

**Bulk Operations:** bulk count-sheet entry (grid-style entry across all in-scope items at
once); bulk recount flagging/clearing.

**Import/Export:** export a count sheet (with or without expected quantities, per Blind
mode) for offline/paper-assisted counting, then import the completed counts back in; export
count history and variance summaries.

**Audit History / Activity Log:** every status transition, every count entry, every
recount, and the final approval decision are logged with user and timestamp. The generated
Stock Adjustments are separately audited (per §4.7) and cross-linked back to this count.

**Role-Based Permissions:** `stock-count.*` — Storekeeper/operational staff perform counts;
Manager/Admin approve; view-all for Admin/Auditor roles.

**Error Scenarios**
- Submitting for approval while items remain flagged for Recount → blocked.
- Approving a count with no counted items → blocked (nothing to reconcile).
- Attempting to edit an Approved/Closed count → blocked.

**Edge Cases**
- An item is deactivated **between** count scheduling and count execution — the count
  should still allow recording its physical presence (goods don't disappear because a
  record was deactivated) but should clearly flag the inconsistency for review.
- A batch-tracked item has multiple open batches with different expiry dates — the count
  should support entering counted quantity per batch, not just a single aggregate number,
  so variance and expiry accuracy are both preserved.
- Full Inventory count spans multiple days for a large catalog — the count's "system
  quantity" baseline should be locked at count start for every item, so ongoing transactions
  during the count window don't produce misleading variances (or, alternatively, the system
  clearly timestamps each item's count moment and compares against system quantity as of
  that same moment — a design decision to make explicit, not leave ambiguous).

**Future Extensibility**
- Cycle counting (continuous small-scope counts on a rotating schedule) instead of only
  periodic full counts.
- Mobile/barcode-scan-assisted counting.
- Shrinkage-rate KPI trending across counts, integrated into the Dashboard/Reports module.

---

### 4.12 Inventory Reports

**Business Purpose**
Provides read-only, decision-supporting visibility across every other sub-module — turning
raw transactional history into the information management and operations actually need to
run the restaurant.

**Functional Requirements — Report Catalog**

| Report | Purpose |
|---|---|
| Current Stock | On-hand quantity, unit, value per item (and per location, if applicable) |
| Low Stock | Items at or below Reorder Level |
| Out of Stock | Items at zero (or negative, if enabled) stock |
| Near Expiry | Batches within a configurable window of their expiry date |
| Expired Items | Batches past their expiry date, not yet wasted/adjusted out |
| Purchase Report | Purchases over a period, by status, supplier, item |
| Supplier Purchases | Spend and volume by supplier, with performance metrics |
| Stock Movement | Every transaction (in/out) for an item/category/location over a period |
| Stock Ledger | Running balance view per item — the full, chronological transaction trail |
| Adjustment Report | All Stock Adjustments, by reason, item, user, period |
| Consumption Report | Stock consumed, by item, menu item, or recipe, over a period |
| Waste Report | Waste by item, category, reason, employee, and cost, over a period |
| Transfer Report | Transfers by source/destination location, item, period |
| Inventory Valuation | Total value of on-hand stock, by item/category/location, at a point in time |
| Daily Inventory Summary | Opening/closing stock, receipts, consumption, waste, adjustments for the day |
| Monthly Inventory Summary | Same as daily, rolled up monthly, with trend comparisons |

**Functional Requirements — Capabilities (apply across all reports above)**
1. **Search** within report results (by item name/code, supplier, employee, etc.).
2. **Filter** by date range, category, item type, location, supplier, reason, status, and
   other report-specific dimensions.
3. **Sort** by any displayed column (date, quantity, value, name).
4. **Group** by category, supplier, reason, location, or time period (day/week/month).
5. **Export** to common office formats (spreadsheet, PDF-style document) for sharing/filing.
6. **Print** a formatted version of any report.
7. **Dashboard summaries** — key metrics (total stock value, low-stock count, near-expiry
   count, today's waste cost, today's consumption cost) surfaced as at-a-glance widgets,
   not just full report pages.
8. **Graphical analytics** — trend charts (e.g., waste cost over the last 30 days, stock
   value over time, top consumed items) for the reports where trend is meaningful (Waste,
   Consumption, Valuation, Purchase spend).

**User Stories**
- As a Manager, I want a Low Stock dashboard widget visible on login, so I know
  immediately what needs reordering without running a report manually.
- As an Owner, I want a Monthly Inventory Summary comparing this month to last month, so I
  can spot cost trend shifts.
- As a Chef, I want the Near Expiry report filtered to my station's category, so I can
  prioritize using ingredients before they spoil.
- As an Accountant, I want an Inventory Valuation report as of month-end, exportable, so it
  feeds into financial statements.

**Business Workflow**
1. Reports read from the accumulated inventory transaction history and current master data
   — they never originate transactions themselves (Stock Count is the one exception that
   *feeds* transactions, but the report *outputs* remain read-only views).
2. Users apply filters/grouping relevant to their question, then view, export, or print.
3. Dashboard widgets refresh on a schedule or on-demand to reflect near-real-time state for
   time-sensitive metrics (Low Stock, Near Expiry, Out of Stock).

**Business Rules**
- BR-R1: Reports are strictly **read-only** — no report view can mutate inventory data.
- BR-R2: Valuation-related reports (Inventory Valuation, Daily/Monthly Summary) must use the
  same costing method consistently applied elsewhere in the system (Average Cost per BR-I8),
  so figures reconcile with what Items/Purchases/Consumption/Waste show individually.
- BR-R3: Reports must reflect **as-of** data correctly — a report run "as of last Monday"
  must use the stock/cost state at that historical point, not silently show current values
  mislabeled with a past date.
- BR-R4: Access to financially sensitive reports (Valuation, Supplier spend) should be
  restricted more tightly than operational reports (Current Stock, Low Stock) — see
  Permission Matrix (§11).

**Validation Rules**
- Date range filters must have a valid start ≤ end.
- Export/print requests must respect the same role-based visibility as the on-screen report
  (no exporting data a role couldn't otherwise view).

**Lifecycle / Status Flow:** Not applicable — reports are stateless views, not records with a
lifecycle.

**Required Fields (per report request):** Report type, date range (where applicable).
**Optional Fields:** Category/location/supplier/reason filters, grouping dimension,
export format, sort order.

**Relationships with Other Modules**
- Every other sub-module (1–11) is a data source for Reports; Reports has no sub-modules
  depending on it — it is a terminal/leaf consumer in the dependency graph.
- Dashboard/Analytics (external, if a separate cross-module dashboard exists): Inventory
  Reports supplies inventory-specific widgets into it.
- Billing/Ledger (external): Inventory Valuation and Purchase spend figures feed financial
  reporting.

**Search / Filter / Sort / Group:** as specified in Functional Requirements above — this is
the sub-module where these capabilities are the primary feature, not a secondary one.

**Bulk Operations:** bulk export of multiple report types for a period (e.g., a "month-end
package" bundling Valuation, Purchase, Waste, and Consumption reports together).

**Import/Export:** export is the core function of this sub-module (see formats above);
import is not applicable (reports don't accept input data).

**Audit History / Activity Log:** log who ran/exported/printed which report and when,
particularly for financially sensitive reports (Valuation, Supplier spend) — this is about
auditing *access*, distinct from the transactional audit trails of other sub-modules.

**Role-Based Permissions:** `reports.*`, with report-specific sensitivity tiers — see §11.

**Error Scenarios**
- Requesting a report for a date range with no data → return an empty-state result, not an
  error.
- Requesting an unauthorized report → blocked with a clear permissions message, not a
  silent empty result (which would be misleading).

**Edge Cases**
- An item is deactivated or a category is deleted-equivalent (deactivated) after historical
  transactions reference it — historical reports must still display the item/category name
  as it was, not blank/broken references.
- Very large date ranges on high-volume reports (e.g., Stock Ledger for a year) — must
  support pagination/streaming export rather than attempting to render everything at once.
- Multiple costing bases in play if the costing method changes over time (future
  extensibility item) — valuation reports must clearly indicate which method was in effect
  for historical periods, to avoid misleading comparisons.

**Future Extensibility**
- Scheduled/emailed report delivery (e.g., automatic daily Low Stock email to the Manager).
- Predictive analytics (demand forecasting feeding suggested reorder quantities).
- Custom report builder for ad-hoc business questions beyond the fixed catalog above.
- Benchmark comparisons (this restaurant's waste % vs. an anonymized industry/chain
  average, if part of a larger multi-outlet rollout).

---

## 5. End-to-End Inventory Workflow

The full lifecycle, from zero to steady-state operation:

1. **Setup phase (one-time, revisited as needed):**
   1.1 Create Units (base + derived, with conversions).
   1.2 Create Categories (top-level + child hierarchy).
2. **Catalog phase:**
   2.1 Create Items (assign category, units, thresholds, tax config).
   2.2 Register Suppliers.
   2.3 Link Items to Suppliers with pricing.
3. **Procurement phase (recurring):**
   3.1 Create a Purchase (Draft → Ordered) when stock needs replenishing (manually
       triggered, or prompted by the Low Stock report).
   3.2 Record Goods Receipt(s) as deliveries arrive — **this is what actually increases
       inventory.**
   3.3 Purchase status auto-progresses to Partially Received / Received.
4. **Operational phase (continuous):**
   4.1 Stock Consumption reduces inventory as menu items are sold/prepared (automatic via
       Recipe/Kitchen integration) or as internal usage occurs (manual).
   4.2 Stock Transfer moves inventory between locations as operational need dictates.
   4.3 Waste Management records loss as it occurs, reducing inventory with cost and
       accountability attached.
   4.4 Stock Adjustments correct any other discrepancy, with a documented reason.
5. **Verification phase (periodic):**
   5.1 Stock Count physically verifies on-hand quantities; approved variances generate
       Stock Adjustments automatically.
6. **Insight phase (continuous):**
   6.1 Inventory Reports surface current state, trends, and exceptions (low stock, near
       expiry, high waste) to drive the next cycle's procurement and operational decisions
       — closing the loop back to step 3.

Every step from 3.2 onward produces an **inventory transaction**; step 6 only ever reads
them.

---

## 6. Cross-Module Integration Map

| External Module (assumed to exist) | Integration Point |
|---|---|
| Menu Management | Menu items are conceptually linked to Recipe Management, which in turn determines Inventory items consumed. Inventory does not model menu items directly. |
| Recipe Management | Supplies the "menu item → ingredient items + quantities" mapping consumed by Stock Consumption (§4.8). Recipe costing should read Items' Average Cost. |
| Kitchen Operations / KOT | Triggers automatic Stock Consumption at a defined point in the order lifecycle; order cancellation/void triggers Consumption reversal. |
| Billing / POS | Order completion/cancellation is the ultimate trigger source for Consumption/reversal; Sales data and Inventory Valuation jointly inform gross margin reporting. |
| Purchasing/Accounting Ledger | Received Purchases generate payable records; Inventory Valuation feeds balance-sheet stock value. |
| Reporting / Dashboard | Inventory Reports (§4.12) supplies widgets and detailed views; may aggregate with non-inventory KPIs (sales, staff) in a unified dashboard. |
| User/Role Management | Supplies the identities and roles referenced throughout §11's Permission Matrix and every sub-module's audit trail. |

---

## 7. Global Business Rules

These rules are cross-cutting and apply across every sub-module in §4; individual sections
reference the relevant ones by ID.

- **GR-1 (Transaction-Sourced Stock):** On-hand stock for any item is always the sum of its
  inventory transactions. No sub-module ever edits a stock quantity directly; every change
  flows through a transaction from Goods Receipt, Stock Adjustment, Stock Consumption,
  Stock Transfer, or Waste.
- **GR-2 (Purchases Are Not Stock):** Purchases (§4.5) represent intent/commitment only.
  Only Goods Receipt (§4.6) creates stock-increasing transactions.
- **GR-3 (Negative Stock Is Configurable, Not Default):** Inventory should never go
  negative unless explicitly enabled — globally, per item, or per business policy. Every
  sub-module that decreases stock (Consumption, Waste, Adjustment-decrease, Transfer-out)
  must respect this configuration consistently.
- **GR-4 (Immutability of Posted Transactions):** Once posted, an inventory transaction is
  never edited or deleted. Corrections are made via new, opposite transactions that
  reference the original, preserving a complete and honest history.
- **GR-5 (Every Movement Is Traceable):** Every transaction records what changed, by how
  much, why (reason/source), who performed it, and when. No stock movement should ever be
  unattributable.
- **GR-6 (Referential Master Data Protection):** Master data (Units, Categories, Items,
  Suppliers) referenced by any historical transaction cannot be permanently deleted — only
  deactivated. This keeps every historical record fully readable forever.
- **GR-7 (Valuation Consistency):** Inventory valuation (average cost × on-hand quantity)
  must remain internally consistent after every transaction type — receipts change cost
  basis; consumption, waste, transfers, and adjustments change quantity without altering
  cost basis (unless the adjustment reason specifically implies a cost correction, which
  should be a distinct, explicit action, not an implicit side effect).
- **GR-8 (Approval Where Value/Risk Warrants It):** High-value or high-risk actions (large
  adjustments, high-cost waste, over-receipt beyond tolerance) should be configurable to
  require a second-level approval before finalizing, rather than mandating approval
  universally (which would slow down low-risk daily operations unnecessarily).

---

## 8. Data Dictionary

A consolidated reference of the primary business entities and their key attributes (see
each sub-module in §4 for full field-level detail, including which are required/optional).

| Entity | Key Attributes |
|---|---|
| Unit | Name, Abbreviation, Dimension, Base Unit reference, Conversion Factor, Decimal Precision, Active flag |
| Category | Name, Parent reference, Display Order, Icon, Color, Active flag |
| Item | Name, Code/SKU, Barcode, Item Type, Category, Purchase Unit, Stock Unit, Min/Max/Reorder Stock, Storage Location, Shelf Life, Batch/Expiry Tracking flags, Tax Configuration, Cost Price, Average Cost, Last Purchase Price, Preferred Supplier, Suppliers (list), Images, Notes, Active flag |
| Supplier | Name, Contact Person, Phones, Email, Address, Tax Info, Payment Terms, Preferred flag, Notes, Active flag |
| Item–Supplier Link | Item reference, Supplier reference, Last Price, Lead Time, Minimum Order Quantity |
| Purchase | Purchase Number, Purchase Date, Supplier, Expected Delivery Date, Line Items, Discounts, Taxes, Freight, Other Charges, Notes, Status, Grand Total |
| Purchase Line Item | Item, Quantity, Purchase Unit, Unit Price, Line Total |
| Goods Receipt | Receipt Number, Linked Purchase, Receipt Date, Line Items, Storage Location, Receiving Notes |
| Goods Receipt Line | Item, Received Qty, Rejected Qty, Damaged Qty, Batch Number, Expiry Date |
| Stock Adjustment | Item, Direction, Quantity, Unit, Reason, User, Date, Notes, (Batch reference if applicable) |
| Stock Consumption | Item, Quantity, Unit, Source (Automatic/Manual), Order/KOT reference or Reason, User/System, Date, Reversed-flag/link |
| Stock Transfer | Transfer Number, Source Location, Destination Location, Line Items, Status, Requesting/Approving/Fulfilling/Receiving Users, Notes |
| Stock Transfer Line | Item, Quantity, Unit |
| Waste Entry | Item, Quantity, Unit, Reason, Cost, Responsible Employee, Date, Notes |
| Stock Count | Count Number, Scope (type + reference), Mode (Blind/Not), Scheduled Date, Status, Approver, Approval Date |
| Stock Count Line | Item, (Batch if applicable), System-Expected Quantity (at count time), Counted Quantity, Variance, Recount flag |
| Inventory Transaction (conceptual, underlies all of the above) | Item, (Batch if applicable), Location, Direction (in/out), Quantity, Resulting Balance, Source Sub-module, Source Reference (e.g., Purchase/Receipt/Adjustment/Waste/Transfer/Count ID), User, Timestamp |

---

## 9. Entity Relationship Overview

```
Unit ──────────────< Item >────────────── Category
                       │
                       ├──< Item–Supplier Link >── Supplier
                       │
                       ├──< Purchase Line Item >── Purchase >── Supplier
                       │                              │
                       │                              └──< Goods Receipt >── Goods Receipt Line
                       │
                       ├──< Stock Adjustment
                       ├──< Stock Consumption (── Order/KOT reference, external)
                       ├──< Stock Transfer Line >── Stock Transfer (Source/Destination Location)
                       ├──< Waste Entry
                       └──< Stock Count Line >── Stock Count (Category/Location scope)

All of: Goods Receipt Line, Stock Adjustment, Stock Consumption, Stock Transfer,
Waste Entry, Stock Count Line (post-approval)
        │
        └──▶ each generates one or more Inventory Transaction records (the immutable ledger)
```

Key cardinalities:
- Unit 1—* Item (as stock unit); Unit 1—* Item (as purchase unit); a Unit may itself
  reference one Base Unit (self-referencing, one level).
- Category 1—* Item; Category 1—* Category (parent/child, self-referencing).
- Item *—* Supplier (via Item–Supplier Link, carrying price/lead-time attributes).
- Supplier 1—* Purchase; Purchase 1—* Purchase Line Item; Purchase 1—* Goods Receipt;
  Goods Receipt 1—* Goods Receipt Line.
- Item 1—* of: Stock Adjustment, Stock Consumption, Waste Entry, Stock Transfer Line,
  Stock Count Line, Goods Receipt Line, Purchase Line Item.
- Stock Count 1—* Stock Count Line; an approved Stock Count Line 1—1 (typically) generates
  one Stock Adjustment.

---

## 10. State Diagrams / Lifecycle Definitions (Consolidated)

**Purchase**
`Draft → Ordered → Partially Received → Received`, with `Cancelled` reachable from
`Draft`/`Ordered` only while zero receipts exist. (Full detail: §4.5.)

**Goods Receipt**
`Recorded` (single, terminal state — its existence drives the parent Purchase's status).
(Full detail: §4.6.)

**Stock Adjustment**
`Posted` (single, terminal state); optional `Pending Approval → Posted/Rejected` if
approval thresholds are enabled. (Full detail: §4.7.)

**Stock Consumption**
`Posted`, with an optional `Reversed` marker linking to a reversing transaction. (Full
detail: §4.8.)

**Stock Transfer**
`Requested → Approved → Transferred → Received`, with `Cancelled` reachable from
`Requested`/`Approved` only. (Full detail: §4.9.)

**Waste Entry**
`Posted` (single, terminal state). (Full detail: §4.10.)

**Stock Count**
`Scheduled → In Progress → Pending Recount(s) → Pending Approval → Approved (Closed)`, with
`Rejected` looping back to `In Progress`. (Full detail: §4.11.)

**Unit / Category / Item / Supplier (all master data)**
`Active ⇄ Inactive` (never hard-deleted once referenced — GR-6).

---

## 11. Permission Matrix

Roles below reflect a typical single-restaurant operating structure (aligned to the roles
already in use in this system: Admin, Manager, Chef, Cashier, Waiter, Staff), plus one
**recommended addition** — a dedicated **Storekeeper/Inventory** role — since none of the
existing roles cleanly own day-to-day receiving, adjustments, and counts today. Where the
Storekeeper role doesn't yet exist, its permissions should default to Manager until it is
introduced.

| Sub-module | Admin | Manager | Storekeeper (recommended) | Chef | Cashier | Waiter | Staff |
|---|---|---|---|---|---|---|---|
| Units | Full | Full | Read | Read | — | — | Read |
| Categories | Full | Full | Read | Read | Read | — | Read |
| Items | Full | Full | Create/Update | Read | Read | Read | Read |
| Suppliers | Full | Full | Create/Update | — | — | — | — |
| Purchases | Full (incl. cancel) | Create/Update/Order | Read | — | — | — | — |
| Goods Receipt | Full | Full | Create | — | — | — | — |
| Stock Adjustments | Full (incl. approve) | Approve | Create | — | — | — | — |
| Stock Consumption (manual) | Full | Full | Create | Create | — | — | — |
| Stock Consumption (automatic) | n/a — system-triggered via Kitchen/Billing events, no direct user permission | | | | | | |
| Stock Transfer | Full (incl. approve) | Approve | Request/Fulfill | Request/Receive | — | — | Request |
| Waste Management | Full | Full/Approve | Create | Create | — | — | Create |
| Stock Count | Full (incl. approve) | Approve | Perform | Perform | — | — | Perform |
| Inventory Reports — operational (Current/Low/Out of Stock, Near Expiry, Movement) | Full | Full | Full | Read | — | — | Read |
| Inventory Reports — financial (Valuation, Purchase/Supplier spend) | Full | Full | — | — | — | — | — |

Notes:
- "Full" implies create, update, deactivate, and view-all-history within the sub-module.
- Blank ("—") means no access by default; can be granted per-restaurant policy.
- Every role's access to any report is naturally scoped by what they're otherwise permitted
  to do (e.g., Chef can see Consumption trends but not Supplier spend).

---

## 12. Audit & Activity Logging Standards

Applies uniformly across every sub-module unless a section explicitly states otherwise:

1. **Every mutating action is logged**: create, update, status transition, deactivate,
   reactivate. Read-only actions are logged only where explicitly called out (e.g., report
   access on financially sensitive reports, §4.12).
2. Each log entry captures: **who** (user identity), **what** (entity + action), **when**
   (timestamp), **before value** and **after value** for updates, and, where applicable, a
   **reason/note**.
3. **Transactional history (Goods Receipt, Stock Adjustment, Stock Consumption, Stock
   Transfer, Waste, approved Stock Count lines) is immutable by design** — the "log" for
   these *is* the permanent record itself, not a separate audit shadow; there is no edit
   event to log because no edit is possible (GR-4).
4. **Master data (Units, Categories, Items, Suppliers)** supports edits, so its audit log is
   a genuine before/after change history, distinct from the immutable transactional records.
5. **High-sensitivity changes** are flagged distinctly for easier review: unit conversion
   factor changes, item cost-basis overrides, supplier payment term changes, and any
   approval-threshold overrides.
6. Audit history must be **exportable** for compliance/investigation purposes, subject to
   the same role-based access as the underlying data.

---

## 13. Error Handling & Edge Case Catalogue (Cross-Cutting)

Beyond the sub-module-specific error scenarios in §4, these apply system-wide:

- **Concurrent mutation of the same item's stock** (e.g., a Consumption and an Adjustment
  posting at nearly the same moment) must be serialized so the resulting balance is always
  correct — no lost updates.
- **Referencing inactive/deactivated master data in a new transaction** is blocked
  everywhere, consistently, with the same class of error message (distinguish "not found"
  from "inactive, cannot be used for new transactions").
- **Attempting to delete anything referenced by history** is blocked everywhere, offering
  deactivation as the alternative, with a count of referencing records shown so the user
  understands why.
- **Unit conversion gaps** (an item's purchase unit and stock unit have no valid conversion
  path) block any transaction requiring that conversion, with a clear directive to fix the
  Unit setup first.
- **Negative stock breaches**, where disallowed, are blocked with a message identifying
  current available stock vs. requested quantity — never a generic failure.
- **Time-travel / as-of consistency**: any report or historical view claiming to represent
  a past state must actually reconstruct that state from the transaction ledger, not from
  current values mislabeled with a past date (see BR-R3).

---

## 14. Future Enhancements Roadmap

Consolidated from each sub-module's "Future Extensibility" notes, roughly in order of likely
value for a growing single-restaurant operation:

1. **Multi-location formalization** — the location concept used lightly throughout (Main
   Store, Kitchen, Bar, Waste Area) becomes a first-class, fully modeled entity, paving the
   way for multi-outlet/central-kitchen expansion.
2. **Approval workflows** for high-value Adjustments, Waste, and over-receipt — currently
   recommended as configurable, this becomes standard as operations scale and internal
   controls mature.
3. **Auto-reorder suggestions** — Low Stock report data feeding directly into
   auto-generated Draft Purchases.
4. **Configurable costing method** (FIFO/LIFO/Standard Cost) per item, beyond the default
   Moving Average.
5. **Cycle counting** to replace/supplement periodic Full Inventory counts.
6. **Predictive analytics** — demand forecasting, spoilage-risk alerts, supplier performance
   scoring.
7. **Mobile/barcode-scan workflows** for Receiving, Counting, and Transfers.
8. **Supplier portal** for order confirmation and advance shipping notices.
9. **Multi-hop unit conversions** and **multi-currency supplier support**, if the business
   expands sourcing complexity.
10. **Custom report builder**, beyond the fixed report catalog in §4.12.

---

## 15. Implementation Recommendations

- **Build order should follow the dependency chain**: Units and Categories first, then
  Items, then Suppliers, then Purchases → Goods Receipt, then the remaining transactional
  sub-modules (Adjustments, Consumption, Transfer, Waste), then Stock Count, then Reports
  last (since Reports depends on everything else having real data to read).
- **Model the inventory transaction ledger as the architectural spine early**, even before
  every sub-module is built — retrofitting immutability and traceability (GR-1, GR-4, GR-5)
  onto a system that didn't start with them is far more expensive than designing for it from
  the first transactional sub-module.
- **Make negative-stock policy (GR-3) and over-receipt tolerance (BR-GR3) explicit,
  configurable decisions early** — these are exactly the kind of "we'll decide later"
  business rules that cause painful rework if left implicit.
- **Treat Stock Count as a first-class workflow, not an afterthought** — it is the
  mechanism that keeps the entire system honest against physical reality, and its
  auto-generation of Adjustments (BR-SCT2) is a meaningful integration point that should be
  designed, not bolted on.
- **Keep Reports read-only and last-built, but design its data access patterns (grouping,
  filtering, as-of consistency) in mind from the start** — retrofitting "as of a past date"
  reporting onto a system that only ever stored current-state snapshots is very difficult;
  the transaction-ledger approach (GR-1) makes it natural if planned for.
- **Introduce the Storekeeper/Inventory role early** (§11) rather than overloading Manager
  with every inventory permission — it keeps the permission matrix meaningful as the team
  grows past a single owner-operator.

---

## 16. Assumptions Recap

- Single restaurant, one or a few internal locations; multi-outlet is a future direction,
  not current scope.
- Recipe Management, Kitchen Operations, Billing/POS, and a general Reporting/Dashboard
  module exist or will exist alongside this module; this spec defines the inventory side of
  those integration points only.
- Average Cost (moving average) is the default costing method; other methods are
  extensibility items.
- Approval workflows are recommended but configurable/optional at initial launch, becoming
  more standard as the operation scales.
- Currency and tax regime are configurable, not fixed to any single country's rules, though
  the existing platform's concrete implementation uses Indian GST as its current example.

---

## 17. Glossary

- **Inventory Transaction:** An immutable record of a stock quantity change — the atomic
  unit of truth for on-hand stock (GR-1).
- **Stock Unit:** The unit in which an item's inventory is tracked internally (may differ
  from the unit it's purchased in).
- **Purchase Unit:** The unit in which an item is ordered from a supplier.
- **Reorder Level:** The stock threshold that triggers a "needs replenishing" signal.
- **Batch:** A distinct lot of stock received together, tracked separately for cost and/or
  expiry purposes.
- **Variance:** The difference between system-expected and physically counted stock,
  discovered during a Stock Count.
- **Average Cost:** The moving-average per-unit cost of an item, recalculated on each
  Goods Receipt, used to value on-hand stock and cost out consumption/waste/adjustments.
- **Landed Cost:** The fully-loaded cost of a purchased item including freight/other
  charges, allocated across line items (future extensibility, §4.5).
