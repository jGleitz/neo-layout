# Neo dead keys and Unicode normalization

This note documents whether Neo's documented dead-key output can be reproduced by an implementation that emits the typed character followed by a Unicode combining character, then compares the result after Unicode normalization.

The question is specifically about equivalence of Unicode strings after normalization, not about whether the text happens to look the same in a particular font or rendering engine.

## Background

Neo documents three physical dead keys, T1, T2, and T3, each with six levels. The user-facing documentation lists the characters produced by pressing a dead key and then a typed key, for example `´` followed by `A` producing `Á`.

Unicode represents many accented characters in two canonically equivalent ways:

- as a precomposed character, such as `Á` (`U+00C1`)
- as a base character followed by a combining mark, such as `A` + `U+0301 COMBINING ACUTE ACCENT`

Unicode combining marks follow the base character. Therefore the implementation considered here is:

```text
typed key + combining character
```

not the reverse. After normalizing both strings to the same Unicode normalization form, canonically equivalent strings compare equal. NFC usually composes common `base + combining mark` sequences to precomposed characters where Unicode defines such compositions; NFD decomposes precomposed characters to canonical `base + combining mark` sequences.

## Sources

- Neo user manual page: <https://www.neo-layout.org/Benutzerhandbuch/Tote-Tasten-und-Compose/>
- Unicode FAQ, Characters and Combining Marks: <https://www.unicode.org/faq/char_combmark.html>
- Unicode FAQ, Normalization: <https://www.unicode.org/faq/normalization.html>

The Unicode FAQ explicitly gives examples such as `A + COMBINING ACUTE` being canonically equivalent to precomposed `Á`, and explains that normalization makes canonical-equivalent strings compare the same when normalized to the same form.

## Summary

A simple implementation where each dead key always appends one fixed combining character is exact after Unicode normalization only for these dead keys:

- T1-1 `ˆ` circumflex
- T1-2 `ˇ` caron
- T1-4 `˙` dot above
- T2-1 `` ` `` grave
- T2-4 `¨` diaeresis / trema
- T2-5 `῾` spiritus asper
- T3-1 `´` acute
- T3-4 `˝` double acute
- T3-6 `˘` breve

It is not exact for these dead keys if each is represented by one fixed combining character:

- T1-3 `↻` rotate
- T1-5 `˞` hook / horn
- T1-6 `.` dot below
- T2-2 `¸` / `˛` cedilla / ogonek
- T2-3 `°` / `˚` ring
- T2-6 `¯` macron
- T3-2 `˜` tilde
- T3-3 `/` stroke
- T3-5 `᾿` spiritus lenis / hook above

Some of the non-exact cases become exact for the documented entries only if the implementation is context-sensitive and chooses different combining characters depending on the typed key or script.

## Per-dead-key findings

| Dead key                             | Finding after normalization                                                                                                    | Explanation                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1-1 `ˆ` circumflex                  | Exact with `U+0302 COMBINING CIRCUMFLEX ACCENT`.                                                                               | Reproduces documented entries such as `Ââ`, `Ĉĉ`, `Êê`, `Ĝĝ`, `Ĥĥ`, `Îî`, `Ĵĵ`, `Ôô`, `Ŝŝ`, `Ûû`, `Ŵŵ`, `Ŷŷ`, and `Ẑẑ`.                                                                                                                                                                                                                                                                                                                                                             |
| T1-2 `ˇ` caron                       | Exact with `U+030C COMBINING CARON`.                                                                                           | Reproduces the documented Latin entries and the additional documented `Ü + caron -> Ǚǚ` case after normalization.                                                                                                                                                                                                                                                                                                                                                                   |
| T1-3 `↻` rotate                      | Not exact.                                                                                                                     | The documented outputs are separate rotated or phonetic letters, such as `ɐ`, `Ɔɔ`, `ɘ`, `ɥ`, `ɯ`, `ʁɹ`, `ʍ`, and `ʎ`. They are not canonical decompositions of ordinary letters plus one combining mark.                                                                                                                                                                                                                                                                           |
| T1-4 `˙` dot above                   | Exact with `U+0307 COMBINING DOT ABOVE`.                                                                                       | Reproduces documented entries such as `Ȧȧ`, `Ḃḃ`, `Ċċ`, `Ḋḋ`, `Ėė`, `Ġġ`, `İı`, `Ṁṁ`, `Ṅṅ`, `Żż`, and the documented `ſ + dot above -> ẛ` case.                                                                                                                                                                                                                                                                                                                                     |
| T1-5 `˞` hook / horn                 | Not exact as one fixed combining character.                                                                                    | The Vietnamese horn letters `Ơơ` and `Ưư` are canonically representable as `O/o/U/u + U+031B COMBINING HORN`. Most other documented entries, such as `Ɓɓ`, `Ƈƈ`, `Ɗɗ`, `Ƒƒ`, `Ɠɠ`, `Ƙƙ`, `Ŋŋ`, and `Ƴƴ`, are atomic hook letters, not canonical decompositions using one combining mark.                                                                                                                                                                                            |
| T1-6 `.` dot below                   | Mostly but not exactly with `U+0323 COMBINING DOT BELOW`.                                                                      | Entries such as `Ạạ`, `Ḅḅ`, `Ḍḍ`, `Ẹẹ`, `Ḥḥ`, `Ịị`, `Ḳḳ`, `Ḷḷ`, `Ọọ`, `Ṣṣ`, `Ṭṭ`, `Ụụ`, `Ṿṿ`, `Ẉẉ`, `Ỵỵ`, and `Ẓẓ` are reproduced. However, the page documents `Ġġ` in this row, and `Ġġ` decomposes as `G/g + U+0307 COMBINING DOT ABOVE`, not dot below.                                                                                                                                                                                                                          |
| T2-1 `` ` `` grave                   | Exact with `U+0300 COMBINING GRAVE ACCENT`.                                                                                    | Reproduces the documented Latin entries such as `Àà`, `Èè`, `Ìì`, `Òò`, `Ùù`, `Ẁẁ`, and `Ỳỳ`, the Greek grave entries, and the additional documented `Ü + grave -> Ǜǜ` case.                                                                                                                                                                                                                                                                                                        |
| T2-2 `¸` / `˛` cedilla / ogonek      | Not exact with one fixed combining character; exact only with context-sensitive mark choice for the documented entries.        | The Neo documentation says consonants receive cedilla while vowels receive ogonek. That requires at least `U+0327 COMBINING CEDILLA` and `U+0328 COMBINING OGONEK`. The Greek entries such as `ᾼᾳ`, `ῌῃ`, and `ῼῳ` decompose with `U+0345 COMBINING GREEK YPOGEGRAMMENI`, so they require a third combining character.                                                                                                                                                              |
| T2-3 `°` / `˚` ring                  | Partially exact with `U+030A COMBINING RING ABOVE`, but not exact for the whole documented row.                                | `Åå`, `Ůů`, `ẘ`, and `ẙ` are reproduced by ring above after normalization. The documented `ɕ` and `ʑ` are atomic curl letters, not canonical decompositions using ring above.                                                                                                                                                                                                                                                                                                       |
| T2-4 `¨` diaeresis / trema           | Exact with `U+0308 COMBINING DIAERESIS`.                                                                                       | Reproduces documented Latin entries such as `Ää`, `Ëë`, `Ïï`, `Öö`, `Üü`, `Ẅẅ`, `Ẍẍ`, `Ÿÿ`, and Greek `Ϊϊ`, `Ϋϋ`.                                                                                                                                                                                                                                                                                                                                                                   |
| T2-5 `῾` spiritus asper              | Exact with `U+0314 COMBINING REVERSED COMMA ABOVE`.                                                                            | Reproduces the documented Greek rough-breathing entries such as `Ἁἁ`, `Ἑἑ`, `Ἡἡ`, `Ἱἱ`, `Ὁὁ`, `ῥ`, `ὑ`, and `Ὡὡ`.                                                                                                                                                                                                                                                                                                                                                                   |
| T2-6 `¯` macron                      | Not exact with one fixed combining character; exact only with context-sensitive above/below choice for the documented entries. | Some entries use `U+0304 COMBINING MACRON`, such as `Āā`, `Ēē`, `Īī`, `Ōō`, `Ūū`, and `Ȳȳ`. Others use `U+0331 COMBINING MACRON BELOW`, such as `Ḇḇ`, `Ḏḏ`, `Ḵḵ`, `Ḻḻ`, `Ṉṉ`, `Ṟṟ`, `Ṯṯ`, `Ẕẕ`, and `ẖ`.                                                                                                                                                                                                                                                                            |
| T3-1 `´` acute                       | Exact with `U+0301 COMBINING ACUTE ACCENT`.                                                                                    | Reproduces documented Latin entries such as `Áá`, `Ćć`, `Éé`, `Íí`, `Óó`, `Śś`, `Úú`, `Ýý`, `Źź`, the Greek acute entries, and the additional documented `Ü + acute -> Ǘǘ` case.                                                                                                                                                                                                                                                                                                    |
| T3-2 `˜` tilde                       | Partially exact with `U+0303 COMBINING TILDE`, but not exact for the whole documented set.                                     | The Latin entries such as `Ãã`, `Ẽẽ`, `Ĩĩ`, `Ññ`, `Õõ`, `Ũũ`, `Ṽṽ`, and `Ỹỹ` are reproduced. The Greek entries `ᾶ`, `ῖ`, `ῦ`, and `ῶ` require `U+0342 COMBINING GREEK PERISPOMENI`. The documented `Ö + tilde -> Ṏṏ` also does not match `Ö + U+0303`: `Ṏ` decomposes canonically as `O + tilde + diaeresis`, while `Ö + tilde` decomposes as `O + diaeresis + tilde`; because the two marks have the same canonical combining class, normalization preserves the order difference. |
| T3-3 `/` stroke                      | Not exact.                                                                                                                     | Documented outputs such as `Ⱥⱥ`, `Ƀƀ`, `Đđ`, `Ħħ`, `Łł`, `Øø`, `Ŧŧ`, and `Ɏɏ` are encoded as distinct letters, not as canonical decompositions using stroke overlay marks.                                                                                                                                                                                                                                                                                                          |
| T3-4 `˝` double acute                | Exact with `U+030B COMBINING DOUBLE ACUTE ACCENT`.                                                                             | Reproduces documented `Őő` and `Űű`.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| T3-5 `᾿` spiritus lenis / hook above | Not exact with one fixed combining character; exact only with context-sensitive mark choice for the documented entries.        | Greek smooth-breathing entries such as `Ἀἀ`, `Ἐἐ`, `Ἠἠ`, `Ἰἰ`, `Ὀὀ`, `ῤ`, `ὐ`, and `Ὠὠ` use `U+0313 COMBINING COMMA ABOVE`. The Vietnamese hook-above entries `Ảả`, `Ẻẻ`, `Ỉỉ`, `Ỏỏ`, `Ủủ`, and `Ỷỷ` use `U+0309 COMBINING HOOK ABOVE`.                                                                                                                                                                                                                                             |
| T3-6 `˘` breve                       | Exact with `U+0306 COMBINING BREVE`.                                                                                           | Reproduces documented Latin entries such as `Ăă`, `Ĕĕ`, `Ğğ`, `Ḫḫ`, `Ĭĭ`, `Ŏŏ`, `Ŭŭ`, and Greek `Ᾰᾰ`, `Ῐῐ`, `Ῠῠ`.                                                                                                                                                                                                                                                                                                                                                                   |

## Implementation implications

If the model wants exact Unicode equivalence to Neo's documented dead-key results after normalization, it cannot represent every dead key as one fixed combining character.

The implementation can use a fixed combining character for the exact dead keys listed in the summary. For the remaining keys, it must either:

1. emit the documented precomposed or atomic character directly, or
2. choose a combining character context-sensitively when Unicode defines a canonical decomposition for that documented output.

In particular, rotate and stroke are not ordinary diacritic dead keys in Unicode-normalization terms. They mostly produce distinct letters. Treating them as combining-mark transformations would not be canonically equivalent to the Neo documentation.
