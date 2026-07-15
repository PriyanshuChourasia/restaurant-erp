**Date:** 2026-07-15
**Prompt:** "add multiple payment methods" (clarified via AskUserQuestion → expose more payment method choices, not split-tender), followed mid-turn by "print option not working".

## What was done

- **Print bug fix (regression from earlier this session):** `ReceiptDialog.tsx`'s overlay and card wrappers had Tailwind's `print:hidden` class on them — since the printable `#receipt-print-area` is a *descendant* of those wrappers, `display:none` on the ancestor hid the whole receipt during print (the visibility-based CSS I'd written could never override that). Root cause was two nested bugs:
  1. `print:hidden` was on the wrong elements (moved it to just the header button row, which should be hidden).
  2. Even after removing that, the card's `max-h-[85vh] overflow-y-auto` clipped anything taller than the viewport, and the original `visibility:hidden`-based CSS technique left the dialog nested inside the app's layout tree — printing it in place pushed it below all the (still layout-occupying-despite-invisible) POS page content.
  - Fixed properly by portaling `ReceiptDialog` to `document.body` via `createPortal` (React), making it a sibling of `#root` rather than a nested descendant. Print CSS is now just `#root { display: none }` + un-styling the dialog's own overlay/card for print (`global.css`) — far simpler and no longer fighting ancestor layout/overflow.
  - Verified via Playwright's `page.emulateMedia({ media: 'print' })` — confirmed the print output shows only the receipt, nothing else, no blank pages.
- **Payment methods:** `ChargeModal.tsx`'s `PAYMENT_METHODS` list only exposed Card/UPI as selectable buttons even though the backend `PaymentMethod` enum (and my Voucher-posting logic from earlier today) already supports `cash`/`card`/`upi`/`online`/`credit`. Added Cash, Online, and Credit as selectable options (5 total, `grid-cols-3` layout), with an inline note when Credit is selected explaining it posts to Accounts Receivable instead of collecting payment.

## Outcome

Print now works reliably (verified via print-media screenshot). All 5 backend-supported payment methods are selectable in the Charge modal, defaulting to Cash. No backend changes were needed — `SalesService.create()`'s payment-method branching (built earlier today) already handles all 5 values correctly.
