**Date:** 2026-07-09
**Prompt:** Design and document a complete Inventory Management Module for a single
restaurant, as a pure business/functional specification (no tech stack, no code) — covering
Units, Categories, Items, Suppliers, Purchases, Goods Receipt, Stock Adjustments, Stock
Consumption, Stock Transfer, Waste Management, Stock Count, and Inventory Reports, each with
business purpose, functional requirements, user stories, workflows, business rules,
validation rules, lifecycle, fields, relationships, search/filter/sort, bulk ops,
import/export, audit, permissions, error scenarios, edge cases, and future extensibility —
plus a data dictionary, ER overview, state diagrams, permission matrix, and implementation
recommendations.

## What was done

- Reviewed existing domain model for grounding (not for prescribing tech): `item.entity.ts`,
  `inventory.entity.ts`, `supplier.entity.ts`, `purchase.entity.ts`, and the seeded roles
  (admin, manager, chef, cashier, waiter, staff) already used by `database-seed.service.ts`,
  so the spec's permission matrix and terminology align with what's already live in this
  project rather than being invented in a vacuum.
- Wrote the full specification to
  `.project/docs/inventory-management-module-spec.md` (~17 sections): module overview,
  guiding assumptions, master data hierarchy, all 12 sub-module specs in full template
  detail, end-to-end workflow, cross-module integration map, global business rules (GR-1
  through GR-8 — transaction-sourced stock, purchases-aren't-stock, configurable negative
  stock, immutability, traceability, referential protection, valuation consistency,
  value-based approval), data dictionary, ER overview, consolidated state diagrams,
  permission matrix, audit/logging standards, cross-cutting error/edge-case catalogue,
  future roadmap, implementation recommendations, assumptions, and glossary.
- Recommended (not implemented) a new **Storekeeper/Inventory** role, since none of the
  existing seeded roles cleanly own day-to-day receiving/adjustments/counts today; spec
  defaults that role's permissions to Manager until introduced.

## Outcome

- Deliverable is a standalone functional spec document, no code changes. Intended to be
  handed to engineering as the source of truth for building out the real inventory
  sub-modules (only a partial `inventory`/`items`/`purchases`/`suppliers` implementation
  exists in the codebase today — this spec is considerably broader, e.g. no Goods Receipt,
  Stock Transfer, Waste Management, or Stock Count exist yet).
- Follow-up (not started): actually implementing any of the 12 sub-modules; introducing the
  recommended Storekeeper role and its permissions; deciding the negative-stock and
  over-receipt-tolerance policies called out as "explicit decisions needed early" in the
  spec's Implementation Recommendations (§15).
