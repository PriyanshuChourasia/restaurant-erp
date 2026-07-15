**Date:** 2026-07-13
**Prompt:** Build the Item-Supplier linking table (backend entity + API + frontend UI) so each item can have multiple vendors with prices

## What was done

### Backend

- **New `item-suppliers/` module**: Entity (`ItemSupplier`), DTOs (create + update), service, controller, module registration.
- **ItemSupplier entity fields**: itemId, supplierId, supplierSku, unitPrice, unitId, leadTimeDays, isPreferred, minOrderQty, lastPurchaseDate, lastPurchasePrice, isActive, notes. Soft-delete support. Unique constraint on (itemId, supplierId). CASCADE on both FK relationships.
- **API endpoints**: `GET /item-suppliers/item/:itemId`, `GET /item-suppliers/supplier/:supplierId`, `GET/:id`, `POST`, `PATCH/:id`, `DELETE/:id`, `POST set-preferred/:itemId/:supplierId`.
- **Preferred supplier logic**: Setting a supplier as preferred auto-unsets all other preferred suppliers for the same item.
- **Module + Entity registered** in `app.module.ts` and `database.module.ts`.
- **Seed data**: 12 realistic item-supplier links across 5 suppliers and 10 items.

### Frontend

- **New `item-suppliers/` module**: Types, API client (7 functions), React Query hooks (5 hooks).
- **ItemSuppliersDialog component**: Full CRUD interface as an inline card section (not modal). Shows supplier list with pricing details, preferred badge, actions. Add/edit form with supplier selector (guards against re-adding linked suppliers), unit price, price unit dropdown, lead time, min order qty, preferred flag, notes.
- **EditItemPage update**: Added "Suppliers" tab alongside existing Details and Recipe/BOM tabs.

### Validation

- Frontend `tsc --noEmit` passes clean (0 batch-related errors)
- Backend `tsc --noEmit` passes clean (only pre-existing test spec errors)
- Code review caught and fixed: modal-overlay-in-inline-tab issue, missing unitId selector in form, unconventional dynamic import in queryFn

## Outcome

Every item can now have multiple suppliers linked with their prices, lead times, and SKU codes. Users can manage vendor relationships directly from the item edit page via the Suppliers tab. The preferred supplier flag enables smart default selection when creating purchase orders.
