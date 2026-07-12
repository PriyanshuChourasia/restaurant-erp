# 2026-07-11 — POS Screen Fix + Customer/Zones Frontend + Seating Panel

## Prompt

Find the prompt where I explained to fix the POS screen and fix it. The POS POST was failing because the frontend still sent `tableNumbers` + `unitPrice` in the payload while the backend now expects `seatIds` + no `unitPrice` (server-side price resolution). The old `PREDEFINED_TABLES`/`selectedTables` UI was still in `POSDashboard.tsx`.

## What was done

### 1. Fixed `pos.api.ts` (types mismatch with backend)
- Dropped `tableNumbers`, `unitPrice`, `itemName`, `hsnCode`, `gstRate` from `CreateInvoiceRequest` and `PosInvoiceItem`
- Added `customerId`, `seatIds`, `clearInvoiceSeats()` function
- New `CreateKotRequest` interface with `seatIds` instead of `tableNumbers`
- Matches backend `CreateInvoiceDto` exactly

### 2. Created customers frontend module (`apps/restaurant-ui/src/modules/customers/`)
- `types/customer.types.ts` — Customer, CustomerSearchResult, CreateCustomerRequest, etc.
- `api/customer.api.ts` — `searchCustomers()`, CRUD functions via shared `apiClient`
- `hooks/useCustomerQueries.ts` — TanStack Query hooks with `customerKeys` factory
- `components/CustomerCombobox.tsx` — Type-ahead search combobox:
  - Debounced search (enabled when `query.length >= 2`)
  - Dropdown with matching customers (name, phone, customerType badge)
  - "+ Add '{query}' as new customer" inline form (name + phone, no page navigation)
  - On select, calls `onSelect(customer)` to update POS state
  - Outside click closes dropdown

### 3. Created zones frontend module (`apps/restaurant-ui/src/modules/zones/`)
- `types/zone.types.ts` — Zone, Seat, seat/zone request/response types
- `api/zone.api.ts` — Zone/Seat CRUD + seat status management
- `hooks/useZoneQueries.ts` — TanStack Query hooks with `zoneKeys`/`seatKeys` factories

### 4. Created `SeatingPanel` component (`apps/restaurant-ui/src/modules/pos/components/SeatingPanel.tsx`)
- Fetches zones and seats by active zone
- Zone tabs sorted by `sortOrder`
- Seat grid with status colors (green=available, amber=booked, red=occupied) and category icons
- Multi-select toggle for seats
- Handles empty state (no zones configured)

### 5. Updated `POSDashboard.tsx`
- Replaced `PREDEFINED_TABLES`/`selectedTables`/`tableInput`/`addTable`/`removeTable` with `SeatingPanel`
- Replaced plain `customerName` text input with `CustomerCombobox`
- Fixed billing payload: sends only `itemId` + `quantity`, no `unitPrice`, no `tableNumbers`
- `createKot` also uses `seatIds` instead of `tableNumbers`
- Added "Clear seats" action button in success message

## Outcome

- 0 new TypeScript errors (frontend `tsc --noEmit` clean, API only pre-existing test spec errors)
- Route tree regenerated successfully
- POS billing payload now matches backend `CreateInvoiceDto`
- Customers can be searched + created inline without leaving POS
- Seats are zone-based with proper status management

## Not done (remaining work)

- Recipe Engineering / Bill of Materials (Task 3 in taskprompt.md)
- Customer/Zones admin CRUD pages (admin list, create, edit forms — out of POS scope)
- Cart price preview doesn't adjust when customer changes (servers resolves prices correctly, but the cashier sees base prices in the cart — UX follow-up)
