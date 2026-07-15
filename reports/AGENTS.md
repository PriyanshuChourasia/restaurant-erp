# Business Report Plan — LLM Entrypoint

Read this file first if you (an LLM/agent) are asked to implement, extend,
review, or continue anything under `reports/`. This folder is a **plan
folder** — a business/functional spec for 71 reports across 9 categories —
not shipped code. `README.md` in this folder has the full business area
matrix, data source map, and implementation-priority phases; this file is
the procedural entrypoint that tells you how to work through it.

## Rule: every module you implement is a task under `.project/prompt.md`

This repo's standing workflow lives at [`.project/prompt.md`](../.project/prompt.md)
(pointed to by the root [`AGENTS.md`](../AGENTS.md)). It applies here without
exception:

1. **Before starting**, read [`.project/memory.md`](../.project/memory.md)
   for recent decisions/gotchas, and skim
   [`.project/knowledge.md`](../.project/knowledge.md) if you need durable
   background not already in `AGENTS.md`.
2. **Check what's already built before implementing anything** — this plan
   is much larger than what exists today. `apps/api/src/reports/` already
   implements 12 of the 71 planned reports (see the table below and
   README.md's "Current API Endpoints" section). Confirm a report isn't
   already live under `GET /reports/...` before writing a duplicate
   endpoint or page.
3. **When you finish implementing a module** (a report category file, or a
   batch of individual reports within one), before ending your turn,
   follow `.project/prompt.md`'s three steps exactly as you would for any
   other prompt:
   - Create `.project/tasks/YYYY-MM-DD-<short-slug>.md` describing what was
     implemented, against which module file (and which `RPT-*` codes) in
     this folder, and the outcome (mirrors how the original reports
     backend+UI work was logged — see
     `.project/tasks/reports_group.md` for the pattern).
   - Add a dated entry to `.project/memory.md`.
   - Update `.project/knowledge.md` if the module changed something
     structurally true about the project (new backend module, new
     convention) — a first report in a previously-unbuilt category
     (kitchen, customer, reservations, procurement, operational, executive)
     likely qualifies; adding one more report to an already-built category
     usually doesn't.

**One category (module) per task at a time**, unless the user explicitly
asks for more. A category file often contains many individual reports —
it's fine to batch several reports from the same category into one task,
but don't silently implement multiple categories in one prompt without
flagging it, since each category is its own audience/business area per the
Business Area Matrix in `README.md`.

## The plan, divided into modules

Nine report-category files live in this folder. Each is self-contained —
every report inside is coded `RPT-<category-letter><NN>` (e.g. `RPT-S01`
for the first Sales report) with its own "what it shows / why it's needed
/ what part of the business it reviews" spec. There are no hard
dependencies between categories — each is an independent business domain —
but every category reads from entities that must already exist elsewhere
in the codebase (see README.md's Data Source Map); a report module never
creates the tables it reports on.

| # | Phase | File | Priority | Reports | Already built |
|---|---|---|---|---|---|
| 1 | 1 | [`sales-reports.md`](./sales-reports.md) | High | 12 | 8 of 12 (`sales/daily`, `sales/summary`, `sales/by-payment-method`, `sales/by-category`, `sales/popular-items`, `sales/gst`, `sales/hourly-distribution`, `sales/veg-nonveg`) |
| 2 | 1 | [`inventory-reports.md`](./inventory-reports.md) | High | 10 | 2 of 10 (`inventory/stock-status`, `inventory/low-stock`) |
| 3 | 1 | [`financial-reports.md`](./financial-reports.md) | High | 8 | 2 of 8 (`finance/balance-sheet`, `finance/profit-loss`) |
| 4 | 2 | [`kitchen-reports.md`](./kitchen-reports.md) | Medium | 7 | none |
| 5 | 2 | [`customer-reports.md`](./customer-reports.md) | Medium | 8 | none |
| 6 | 2 | [`reservation-reports.md`](./reservation-reports.md) | Medium | 6 | none |
| 7 | 2 | [`procurement-reports.md`](./procurement-reports.md) | Medium | 7 | none |
| 8 | 2 | [`operational-reports.md`](./operational-reports.md) | Medium | 8 | none |
| 9 | 1 | [`executive-dashboard.md`](./executive-dashboard.md) | High | 5 | none |

Phase follows the **Priority** column already in `README.md`'s Report
Categories table (High = Phase 1, Medium = Phase 2) — this isn't a new
prioritization, just the existing one restated as an implementation order.
Within a High-priority module, prefer finishing its remaining reports
before starting a new module, unless the user asks for a specific report
by name/code.

Every new report endpoint goes in the existing
`apps/api/src/reports/` module (`reports.module.ts`,
`controllers/`, `services/`) — extend it, don't create a second reports
module. Follow the existing endpoint convention from `README.md`:
`GET /api/reports/{category}/{report-name}?fromDate=&toDate=&groupBy=&format=`.

## What NOT to do

- Don't re-implement a report that's already built (see the table above) —
  check the live controller (`apps/api/src/reports/controllers/`) before
  assuming a `RPT-*` code from the plan file is unimplemented.
- Don't skip the `.project/tasks/` entry because "it's just a plan folder"
  — implementing a report is real code change to `apps/api`/
  `apps/restaurant-ui`, identical in weight to any other task in this repo.
- Don't restate this folder's business area matrix or data source map in
  your task file — link to `README.md` instead, per `.project/prompt.md`'s
  "don't duplicate what's derivable" rule.
