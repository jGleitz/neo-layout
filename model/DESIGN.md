# Neo Layout Model Design Decisions

This document records the settled design choices for the Neo-family keyboard layout data model. Read it before changing the schema, parser, or generated YAML files.

## Language goals

This document is written for an average software developer who may not know Unicode details, Neo layout specifics, W3C key codes, or this implementation. The prose should be:

- **Plain** — ordinary words, and jargon only with explanation.
- **Concise** — say what is needed and stop.
- **Precise** — each decision stated unambiguously enough to guide a change.
- **Readable** — short paragraphs, clear headings, and a logical order.

A few terms appear throughout:

- **Level**: the character produced while modifier keys are held. Level 1 is the unmodified key, level 2 is Shift, levels 3–4 use Mod3, and levels 5–6 use Mod4.
- **Dead key**: a key that does not output a visible character itself, but changes how the next key is rendered.
- **Key code / physical code**: the fixed position of a key on the hardware, such as `Tab` or `NumLock`, independent of what character it produces.
- **Layout schema**: the formal contract that generated layout files must satisfy.

## Layer-lock behavior is static layer-selection logic, not layout data

Neo has a layer-lock function, Mod4-Lock (`4Lk` in the reference drawings), that toggles layer 4. Because it is a switching mechanism, not a character the layout produces, it is not stored as a key value. The `Tab` key therefore emits `null` at level 5, and there is no `NeoLevel4Lock` value in the schema or parser.

## The full combined panel is authoritative; per-level miniatures are secondary

The reference `.txt` files contain a large "Alle Ebenen" (All Levels) panel and smaller per-level summaries. When they conflict, the large panel wins. Known errors in the miniatures, such as `neoqwertz.txt` showing a plain Tab at level 2, are intentionally not imported.

## W3C key values are referenced by specification, not enumerated

For standard keys like `Enter` or `ArrowLeft`, the schema accepts any non-empty string that does not start with `Neo`, and links to the W3C UI Events specification. This avoids maintaining a long, fragile enum while still preventing collisions with Neo-specific values.

## Neo-family special key values are prefixed with `Neo` and kept in separate enum branches

Special Neo values such as `NeoBacktab`, `NeoNumpad0`–`NeoNumpad9`, and `NeoNumpadAdd` live in their own schema branches. The `Neo` prefix guarantees they cannot clash with current or future W3C key names.

## Generated YAML files carry a real `$schema` URI

Every generated layout begins with `$schema: https://neo-layout.org/schema/layout.schema.yaml`. This lets IDEs and validators associate the file with its schema for completion and error checking.

## JSON schema mirrors exist only for IDE consumption

The YAML schemas (`*.schema.yaml`) are the source of truth. JSON mirrors (`*.schema.json`) are generated automatically from the YAML so JetBrains IDEs can resolve the schema graph; they are not hand-edited.

## `NumLock` represents the keypad top-left cell, not the OS NumLock toggle

In Neo-family layouts, the physical key at the top-left of the numeric keypad emits Tab, Backtab, and mathematical symbols across the six levels. The model represents this position with the physical code `NumLock`, even though it does not toggle the operating system's NumLock state.

## Pseudo-levels are out of scope

The reference `.txt` files include a "Pseudo-Ebene" miniature for mouse and navigation control (activated in the Neo driver by `Shift+Mod4+T1` or `Shift+Mod4+NumLock`, where `T1` is the physical dead key to the left of the `1` key). This is not one of the six character levels; it is a separate driver mode. The model currently does not represent pseudo-levels. They may be added later, but until then they are explicitly excluded from the schema and generated YAMLs.

## Dead-key names use canonical combining Unicode names

Dead keys in the generated YAMLs are stored as `{ dead: "<Unicode name>" }`, using the canonical name of the matching combining character, such as `COMBINING GRAVE ACCENT` or `COMBINING CARON`. The reference drawings and website show spacing or modifier-letter glyphs instead, because those standalone glyphs are easier to read. The combining names are kept because they are semantically correct: a dead key modifies the next character typed, it does not emit a visible character by itself.

One deliberate asymmetry exists. Spiritus asper maps to `COMBINING REVERSED COMMA ABOVE` (U+0314), because it is purely Greek rough breathing. Spiritus lenis is stored as the custom constant `NEO DEAD SPIRITUS LENIS`, because the same key doubles as the Vietnamese hook above; no single combining character covers both roles.
