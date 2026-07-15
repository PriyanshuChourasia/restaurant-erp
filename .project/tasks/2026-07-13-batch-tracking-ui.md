**Date:** 2026-07-13
**Prompt:** Build batch tracking UI for the inventory module

## What was done

### Backend
- Added `getAllBatches()` method to `InventoryService` — returns all batches with item, category, and storage unit relations, ordered by receivedDate DESC + expiryDate ASC.
- Added `GET /inventory/batches/all` endpoint to `InventoryController` with optional `storageUnitId` query param.

### Frontend

**Types & API Layer:**
- Added `BatchStatus` type and `StockBatch` interface to `inventory.types.ts`
- Added `NearExpiryBatch` interface and 3 API functions (`getAllBatches`, `getItemBatches`, `getNearExpiryBatches`) to `inventory.api.ts`
- Added 3 React Query hooks (`useAllBatches`, `useItemBatches`, `useNearExpiryBatches`) to `useInventoryQueries.ts`

**BatchesPage (`/inventory/batches`):**
- 4 KPI stat cards: Total Batches, Active, Expiring Soon, Exhausted
- Near-expiry alert section with critical (≤7 days) and warning (≤30 days) tiers
- Status filter tabs: All, Active, Exhausted, Expired, Written Off
- Search by batch number, item name, or SKU
- Expandable batch list grouped by item — each group header shows item name, batch count, total remaining units
- Each batch row shows: batch number, status badge, received/expiry dates, storage unit, quantity remaining/received, unit cost, days-until-expiry badge

**ViewBatchesDialog:**
- Per-item batch dialog accessible from InventoryPage row "Batches" button
- Shows summary (total batches, units, active count) and full batch list for the item

**Navigation:**
- Added "Batches" link (Layers icon) to Inventory section in AppSidebar

### Validation
- Frontend `tsc --noEmit` passes clean (0 batch-related errors)
- Backend `tsc --noEmit` passes clean (only pre-existing test spec errors)
- Route tree auto-generated on dev server restart

## Outcome

Batch tracking now has a complete, beautiful UI. Users can monitor all stock batches, track near-expiry items, view per-item batch details, filter by status, and search across batches. The backend was already fully implemented — the frontend now surfaces it all.
