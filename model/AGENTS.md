# Agent Guidance for the Neo Layout Model

## Canonical design decisions live in `DESIGN.md`

`model/DESIGN.md` is the single source of truth for settled design decisions, known inconsistencies we intentionally tolerate, and any other particularities future agents must know before changing the schema, parser, or generated YAML files.

Read it first. Do not reopen a settled question unless you have new evidence or explicit instructions to reconsider it. Some choices, such as which reference panel is authoritative or how layer-lock behavior is treated, look like bugs out of context but are deliberate.

## Language goals for `DESIGN.md`

`DESIGN.md` should be written so an average software developer can understand it without prior knowledge of Unicode, Neo layout specifics, W3C key codes, or this implementation. Aim for prose that is:

- **Plain** — ordinary words, no jargon without explanation.
- **Concise** — say what is needed and stop.
- **Precise** — each decision is stated unambiguously enough to guide a change.
- **Readable** — short paragraphs, clear headings, and a logical order.

## Review requirement

Any change to `DESIGN.md` must be reviewed by a review agent for understandability, readability, precision, accuracy, and compactness before it is considered final.

## Schema description rule

When editing `*.schema.yaml` descriptions, keep the prose focused on context, intended use, and conventions the schema cannot express. Do not explain what the schema accepts, rejects, or enforces in the description text itself; let the schema keywords carry the actual validation rules.
