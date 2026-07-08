**Date:** 2026-07-08
**Prompt:** Create a `prompt.md` for this task-tracking system so that every time
an LLM runs in this repo, it automatically knows what it's supposed to do
(without being re-told).

## What was done

- Created `.project/prompt.md` — an imperative procedure file: read `memory.md`
  (and `knowledge.md` if needed) before starting work; at the end of every prompt,
  write a task file, update `memory.md`, and update `knowledge.md` if the change
  was structural.
- Updated `AGENTS.md` to point at `.project/prompt.md` as the source of truth for
  this workflow, replacing the inline procedure description.

## Outcome

Any agent that reads `AGENTS.md` (the standard entry point) is now directed to
`.project/prompt.md`, which is self-contained and directive rather than
descriptive. This closes the loop from the previous task
(`.project/tasks/2026-07-08-setup-project-documentation-system.md`) — the system
now tells an agent what to do, not just what exists.
