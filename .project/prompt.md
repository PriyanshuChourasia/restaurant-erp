# Task Workflow — Instructions for any LLM/agent working in this repo

Read this file at the start of a session. It tells you what to do, every time,
regardless of what the user's prompt is about. `AGENTS.md` describes the project;
`knowledge.md` and `memory.md` hold accumulated context; this file is the
procedure that keeps all of that up to date.

## Before starting work

1. Read `.project/memory.md` — it has the most recent decisions, gotchas, and
   open questions, newest first. This is your fastest way to pick up context.
2. Skim `.project/knowledge.md` if you need durable background (stack,
   architecture, conventions) you don't already have from `AGENTS.md`.
3. Optionally skim recent files in `.project/tasks/` if you need to know exactly
   what happened in prior prompts.

## Every user prompt is a task

Treat each user prompt as one task, start to finish. When you finish it (or reach
a natural stopping point), before ending your turn:

1. **Create a task file** at `.project/tasks/YYYY-MM-DD-<short-slug>.md`
   (use today's actual date; append `-2`, `-3`, ... if the slug collides with a
   file already created today). It must contain:
   - `**Date:**` and `**Prompt:**` — the date and a faithful summary of what the
     user asked for
   - `## What was done` — concrete list of changes/actions taken
   - `## Outcome` — end state, and anything left unresolved or follow-up needed
2. **Update `.project/memory.md`** — add a new dated entry at the top with any
   key decisions, gotchas, or open questions from this task. Keep it short. If an
   older entry there has become permanently true of the project, move it into
   `knowledge.md` and delete it from here.
3. **Update `.project/knowledge.md`** — only if the task changed something
   structurally true about the project (new module, new dependency/tech choice,
   new convention, changed architecture). Don't touch it for routine changes.

Do not skip step 1. `.project/tasks/` is the append-only record of what happened
and when — it must have one file per prompt, no exceptions, even for small asks.

## What NOT to put in these files

- Don't duplicate what's derivable from reading the code or `git log`.
- Don't restate all of `AGENTS.md` — link to it instead of copying it.
- Keep entries factual and short; this is a working log, not a report.
