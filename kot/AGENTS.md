# KOT Management — LLM Entrypoint

Read this file first if you (an LLM/agent) are asked to implement, extend,
review, or continue anything under `kot/`. This folder is a **plan
folder** — module specs for KOT Management — not shipped code. `README.md`
in this folder has the full background, goal, module dependency graph, and
pipeline; this file is the procedural entrypoint that tells you how to work
through it.

## Rule: every module you implement is a task under `.project/prompt.md`

This repo's standing workflow lives at [`.project/prompt.md`](../.project/prompt.md)
(pointed to by the root [`AGENTS.md`](../AGENTS.md)). It applies here without
exception:

1. **Before starting**, read [`.project/memory.md`](../.project/memory.md)
   for recent decisions/gotchas, and skim
   [`.project/knowledge.md`](../.project/knowledge.md) if you need durable
   background not already in `AGENTS.md`.
2. **Read [`field-consistency-fix_plan.md`](./field-consistency-fix_plan.md)
   (Module 1) before implementing any other module in this folder**, even
   if the user only asked for one specific module further down the table.
   It's a cross-cutting correctness fix (the `seatIds`/`tableIds`/
   `tableNumbers` field-naming bug that leaves the table label blank on
   the KOT board) that every other module's board/ticket display assumes
   is already fixed — building on top of it while it's still broken just
   compounds the bug into new code.
3. **When you finish implementing a module** (or reach a natural stopping
   point on one), before ending your turn, follow `.project/prompt.md`'s
   three steps exactly as you would for any other prompt:
   - Create `.project/tasks/YYYY-MM-DD-<short-slug>.md` describing what was
     implemented, against which module file in this folder, and the
     outcome.
   - Add a dated entry to `.project/memory.md`.
   - Update `.project/knowledge.md` if the module changed something
     structurally true about the project (new entity, new backend module,
     new convention) — most of these modules will qualify.

**One module per task**, unless the user explicitly asks for more. Don't
silently implement several modules in one prompt and write one task file
for all of them — each module is independently shippable by design (see
the "Depends on" column below), so each gets its own task record.

## The plan, divided into modules

Twelve module files live in this folder (plus this folder's own `README.md`
as the non-implementing background/index doc). Each module file is
self-contained — read the one you're implementing, plus any files it lists
under "Depends on" (all already-implemented dependencies should exist in
the codebase before you start; if they don't, implement them first or stop
and ask).

| # | Phase | File | Depends on | What it does |
|---|---|---|---|---|
| 1 | 1 | [`field-consistency-fix_plan.md`](./field-consistency-fix_plan.md) | — | `seatIds`→`tableIds` rename landed correctly end-to-end (backend + frontend + spec), no more `tableNumbers` ghost field |
| 2 | 1 | [`station-routing_plan.md`](./station-routing_plan.md) | 1 | Item→station default mapping; POS checkout splits cart into one KOT per station instead of one hardcoded `main_kitchen` ticket |
| 11-basic | 1 | [`kot-cancellation_plan.md`](./kot-cancellation_plan.md) | 1 | Basic cancel mechanism only (`cancelKot`/`cancelKotItem`, reason taxonomy, no approval gating yet) — ship this slice early since modules 7 and 8 both depend on it existing |
| 12 | 1 | [`kot-merge-plan.md`](./kot-merge-plan.md) | 8 (rollup helper) — but may do its own extraction if 8 hasn't landed yet | Combine several active KOTs for one table into a single ticket; `MERGED` status added, which module 11's lock-point check must also reject |
| 3 | 2 | [`kitchen-routing_plan.md`](./kitchen-routing_plan.md) | 2 | `KitchenStation` runtime state (open/closed, fallback, printer mapping) + manual reroute |
| 4 | 2 | [`queue-management_plan.md`](./queue-management_plan.md) | 3 | Per-station queue ordering by priority, queue position, backlog load, wait-time estimates |
| 5 | 2 | [`kot-lifecycle_plan.md`](./kot-lifecycle_plan.md) | 1, 2 | Reprint + elapsed-time SLA badges on the KOT board |
| 6 | 3 | [`session-linkage_plan.md`](./session-linkage_plan.md) | 2, 3, and [`../order-sessions/settlement_plan.md`](../order-sessions/settlement_plan.md) | KOT creation becomes "add a round to an open session" — **don't start before `../order-sessions/settlement_plan.md` has landed** |
| 7 | 3 | [`inventory-timing_plan.md`](./inventory-timing_plan.md) | 11-basic | Decision + implementation for when recipe stock deduction fires relative to KOT status, incl. reversal on cancellation — wires back into module 11's cancel path once done |
| 8 | 3 | [`line-item-management_plan.md`](./line-item-management_plan.md) | 6, 11-basic | Quantity/instruction edits and mid-prep item additions on a still-live KOT, plus per-item elapsed-time |
| 11-deep | 3 | [`kot-cancellation_plan.md`](./kot-cancellation_plan.md) (revisit) | 7 | Wire the stock-reversal hook module 7 just built back into `cancelKot`/`cancelKotItem` |
| 9 | 4 | [`kds_plan.md`](./kds_plan.md) | 3, 4, 5 | Real kitchen-terminal experience: WebSocket push, per-station kiosk screens, sound alerts, bump-bar controls |
| 11-deep | 4 | [`kot-cancellation_plan.md`](./kot-cancellation_plan.md) (revisit) | 9 | Wire KDS alerting into a cancellation so an open terminal reflects it immediately |
| 10 | 4 | [`chef-workflow_plan.md`](./chef-workflow_plan.md) | 3, 4, 9, [`../inventory/`](../inventory/README.md) | Ticket claiming, recipe/method visibility, 86 (sold-out) workflow, hold-and-fire course control — highest-touch module, do it last |
| 11-deep | 4 | [`kot-cancellation_plan.md`](./kot-cancellation_plan.md) (revisit) | 10 | Wire claim-aware notification (alert the chef who already claimed a now-cancelled item) |

Implement in ascending phase order; within a phase, order doesn't matter
unless a "Depends on" column says otherwise. `kot-cancellation_plan.md`
appears four times deliberately — it's one file, built incrementally in
slices as each of its dependencies (7, 9, 10) becomes available, not
re-implemented from scratch each time. Don't treat those later rows as
"already done, skip" just because module 11 shipped earlier in phase 1 —
its deeper integrations are real, separate pieces of work called out
explicitly in the module file's own "Files" section.

## What NOT to do

- Don't start coding a module without reading its own "Depends on" files
  first (or `README.md`'s dependency graph/pipeline section) — several
  modules assume entity fields or helpers another module already added.
- Don't build module 6 before `../order-sessions/settlement_plan.md` has
  landed — `README.md` calls this out explicitly as a hard gate, not a
  soft suggestion.
- Don't skip the `.project/tasks/` entry because "it's just a plan folder"
  — implementing a module is a real code change to `apps/api`/
  `apps/restaurant-ui`, identical in weight to any other task in this repo.
- Don't restate this folder's background/worked example/pipeline in your
  task file — link to `README.md` instead, per `.project/prompt.md`'s
  "don't duplicate what's derivable" rule.
- Don't implement one of module 11's deeper-integration slices (stock
  reversal, KDS alerting, claim-aware notification) before its
  corresponding dependency module (7, 9, 10 respectively) actually exists
  in the codebase — stop and flag it rather than guessing at an interface
  that hasn't been built yet.
