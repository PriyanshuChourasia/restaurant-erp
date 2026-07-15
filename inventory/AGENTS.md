# Inventory Redesign — LLM Entrypoint

Read this file first if you (an LLM/agent) are asked to implement, extend,
review, or continue anything under `inventory/`. This folder is a **plan
folder** — module specs for the Stock Management Restructure — not shipped
code. `README.md` in this folder has the full background, goal, and worked
example; this file is the procedural entrypoint that tells you how to work
through it.

## Rule: every module you implement is a task under `.project/prompt.md`

This repo's standing workflow lives at [`.project/prompt.md`](../.project/prompt.md)
(pointed to by the root [`AGENTS.md`](../AGENTS.md)). It applies here without
exception:

1. **Before starting**, read [`.project/memory.md`](../.project/memory.md)
   for recent decisions/gotchas, and skim
   [`.project/knowledge.md`](../.project/knowledge.md) if you need durable
   background not already in `AGENTS.md`.
2. **Read [`data-model_plan.md`](./data-model_plan.md) (Module 0) before
   implementing any other module in this folder**, even if the user only
   asked for one specific module — it's the schema every other module file
   is written against, and implementing a module without it produces
   inconsistent keys/relations.
3. **When you finish implementing a module** (or reach a natural stopping
   point on one), before ending your turn, follow `.project/prompt.md`'s
   three steps exactly as you would for any other prompt:
   - Create `.project/tasks/YYYY-MM-DD-<short-slug>.md` describing what was
     implemented, against which module file in this folder, and the
     outcome (mirrors how the floorplan restructure's modules were each
     logged as their own task — see
     `.project/tasks/floorplan-restructure_group.md` for the pattern).
   - Add a dated entry to `.project/memory.md`.
   - Update `.project/knowledge.md` if the module changed something
     structurally true about the project (new entity, new backend module,
     new convention) — most of these modules will qualify.

**One module per task**, unless the user explicitly asks for more. Don't
silently implement three modules in one prompt and write one task file for
all of them — each module is independently shippable by design (see
`README.md`'s "Depends on" column), so each gets its own task record.

## The plan, divided into modules

Nine module files live in this folder. Each is self-contained — read the
one you're implementing, plus any files it lists under "Depends on" (all
already-implemented dependencies should exist in the codebase before you
start; if they don't, implement them first or stop and ask).

| # | Phase | File | Depends on | What it does |
|---|---|---|---|---|
| 0 | 0 | [`data-model_plan.md`](./data-model_plan.md) | — | Full ERD/schema reference for every entity below. Read-only reference — implements nothing on its own. |
| 1 | 1 | [`units_plan.md`](./units_plan.md) | 0 | `units` master table (replaces the `ItemUnit` enum) + `unit_conversions`; `purchaseUnitId` on `Item` |
| 2 | 1 | [`storage-units_plan.md`](./storage-units_plan.md) | 0 | `StorageUnit` master + `storageUnitId` on `Inventory`/`StockMovement`; real transfers. Non-breaking (single default location seeded) |
| 3 | 1 | [`opening-stock_plan.md`](./opening-stock_plan.md) | 1, 2 | `OpeningStockEntry` — one-time, dated, per-location opening balance declaration |
| 4 | 1 | [`purchase-receiving_plan.md`](./purchase-receiving_plan.md) | 1, 2 | GRN actually posts `purchase_in` stock movements + weighted-average cost, at a storage unit |
| 5 | 1 | [`ledger-integration_plan.md`](./ledger-integration_plan.md) | 4 | Every `StockMovement` gets a matching `LedgerEntry` (COGS, wastage expense, inventory asset) |
| 6 | 2 | [`batch-tracking_plan.md`](./batch-tracking_plan.md) | 2, 4 | `StockBatch` (lot + expiry, per storage unit) + FEFO picking on consumption |
| 7 | 2 | [`wastage-tracking_plan.md`](./wastage-tracking_plan.md) | 5, 6 | Reasoned wastage (`trim_loss`, `expired`, ...) + auto-post production shrinkage instead of silently dropping it |
| 8 | 3 | [`stock-count_plan.md`](./stock-count_plan.md) | 5 | Physical stock count (per storage unit) → variance → `adjustment_in/out` reconciliation |
| 9 | 4 | [`item-master_plan.md`](./item-master_plan.md) | 0, 1 | Vendor-per-item linkage + last-purchase-price, `taxCategory` (taxable/nil-rated/exempt/non-GST) distinct from `gstRate`, compound-unit display formatting |

Implement in ascending module order within a phase unless the user names a
specific module out of order — later modules assume earlier ones already
exist (an unmet "Depends on" is a reason to stop and flag it, not to guess
around the gap). Module 9 (phase 4) only needs modules 0 and 1 — it's
independent of phases 2–3 and can be picked up out of order if the user
asks for it specifically, unlike modules 2–8 which build on each other in
sequence.

## What NOT to do

- Don't start coding a module without reading `data-model_plan.md` first —
  entity shapes (`storage_unit_id` placement, FK vs. enum for units, the
  `OpeningStockEntry` unique constraint) are decided there, not
  re-derivable from the module file alone.
- Don't skip the `.project/tasks/` entry because "it's just a plan folder"
  — implementing a module is real code change to `apps/api`/
  `apps/restaurant-ui`, identical in weight to any other task in this repo.
- Don't restate this folder's background/worked example in your task file
  — link to `README.md` instead, per `.project/prompt.md`'s "don't
  duplicate what's derivable" rule.
