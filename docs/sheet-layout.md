# Sheet Layout

> The exact row and column structure of the Google Sheet that the script reads from and writes to.

For how the layout is populated see [Pipeline](pipeline.md).
For how UIDs link sheet rows to domain objects see [Data Model](data-model.md#discipline).

---

## Table of Contents

- [Column Layout](#column-layout)
- [Row Structure](#row-structure)
- [Stroke Groups](#stroke-groups)
- [UID Column](#uid-column)
- [Column P — New Records](#column-p--new-records)
- [Row Position Formula](#row-position-formula)
- [Adding a New Discipline](#adding-a-new-discipline)

---

## Column Layout

The leaderboard occupies 14 columns (A–N), split symmetrically into a male and a female half:

| Columns    | Content                                             |
|------------|-----------------------------------------------------|
| A–G        | Male results                                        |
| H–N        | Female results                                      |
| P (col 16) | New records log — written separately, never cleared |

Within each 7-column half the columns are:

| Offset | Column (male) | Column (female) | Content             |
|--------|---------------|-----------------|---------------------|
| 0      | A             | H               | UID (e.g. `#f502m`) |
| 1      | B             | I               | Rank (e.g. `1.`)    |
| 2      | C             | J               | Swimmer name        |
| 3      | D             | K               | Time (`mm:ss,xx`)   |
| 4      | E             | L               | Birth year          |
| 5      | F             | M               | Location (venue)    |
| 6      | G             | N               | Date (`dd.mm.yyyy`) |

---

## Row Structure

Row 1 contains the season/tab name and is never overwritten by the data pipeline.
Data is written starting at **row 3**.

Within each stroke group, rows follow this repeating pattern:

```
Row  1  (of group):  Stroke name — merged across all 14 columns
Row  2  (of group):  "Männlich" [A–G merged] | "Weiblich" [H–N merged]
Row  3  (of group):  Column headers (UID, Platz, Name, Zeit, Jahrgang, Ort, Datum) × 2
--- repeated for each distance/course combination ---
Row  N:              Distance label (e.g. "50m (Kurzbahn)") — merged on both halves
Row  N+1:            Rank 1 result (male left, female right)
Row  N+2:            Rank 2 result
...
Row  N+E:            Rank E result  (E = entriesPerDiscipline)
```

---

## Stroke Groups

The sheet always contains exactly 5 stroke groups in this order:

| # | Stroke        | Distances (long course)      | Distances (short course)     | Discipline pairs |
|---|---------------|------------------------------|------------------------------|------------------|
| 1 | Freistil      | 50, 100, 200, 400, 800, 1500 | 50, 100, 200, 400, 800, 1500 | 12               |
| 2 | Schmetterling | 50, 100, 200                 | 50, 100, 200                 | 6                |
| 3 | Rücken        | 50, 100, 200                 | 50, 100, 200                 | 6                |
| 4 | Brust         | 50, 100, 200                 | 50, 100, 200                 | 6                |
| 5 | Lagen         | 200, 400                     | 100, 200, 400                | 5                |

Each discipline pair contains one male and one female column set, displayed side by side.

Within each group, disciplines are sorted: **distance ascending → course ascending (short before long) →
male before female**.

---

## UID Column

Every result row has a UID in column A (male) and column H (female):

```
#f502m   →  Freistil, 50m, Kurzbahn (25), Männlich
#f502w   →  Freistil, 50m, Kurzbahn (25), Weiblich
#f505m   →  Freistil, 50m, Langbahn (50), Männlich
#b1005m  →  Butterfly (Schmetterling → 'S'? No — Schmetterling → 'S')
```

Wait — the UID uses `stroke.substring(0, 1)`. For German stroke names:

| Stroke        | First char | UID prefix |
|---------------|------------|------------|
| Freistil      | `F`        | `#f`       |
| Schmetterling | `S`        | `#s`       |
| Rücken        | `R`        | `#r`       |
| Brust         | `B`        | `#b`       |
| Lagen         | `L`        | `#l`       |

Full UID format: `#` + stroke[0] + distance[0..1] + lane[0] + gender[0], lowercased.

`Sheet.extractResults()` uses the UID to route each result row to the correct `Discipline`. Any row where
column A or column H does **not** start with `#` is treated as a header or label row and skipped.

> **Do not change cell values in column A or H manually.** The UIDs are the only join key between the sheet
> and the domain model. Corrupted UIDs cause results to be silently dropped.

---

## Column P — New Records

Column P (index 16) is a permanent append-only log of newly entered top-N results.

- Row P1 contains the header text `'Neue Ergebnisse'` (set by `formatSheet()`).
- On each update run, new records are appended starting after the last non-empty cell in column P.
- Column P is **never cleared** by `_writeNewDataToSheet()` — it only clears columns A–N.
- Each entry is formatted as: `<timestamp>: <discipline>: <name> (<birth>) - <time> - <location> - <date>`

---

## Row Position Formula

`formatSheet()` applies formatting to fixed row ranges. These ranges depend on `numberOfEntries` (N).
Each distance/course block occupies `N + 1` rows (1 distance header + N result rows).

The start row of each stroke group is calculated as follows:

| Stroke group                   | Start row formula |
|--------------------------------|-------------------|
| Freistil (12 discipline pairs) | `3`               |
| Schmetterling (6 pairs)        | `(N+1) × 12 + 7`  |
| Rücken (6 pairs)               | `(N+1) × 18 + 11` |
| Brust (6 pairs)                | `(N+1) × 24 + 15` |
| Lagen (5 pairs)                | `(N+1) × 30 + 19` |

The offsets (7, 11, 15, 19) account for the 3 group header rows (stroke name, gender, column headers)
plus one empty separator row between groups.

**When `numberOfEntries` is changed, `formatSheet()` must be called to realign the formatting.**

---

## Adding a New Discipline

To add a new distance (e.g. 300m Freestyle):

1. Add `'300'` to the `Langbahn` or `Kurzbahn` array for `FREESTYLE` in the `DISCIPLINES` constant
   in `discipline.js`.
2. Run `formatSheet()` once to regenerate the sheet structure — the new discipline will appear automatically.

No other code changes are required. The `Leaderboard._createDisciplines()` loop generates `Discipline`
instances from the `DISCIPLINES` config, so the new event is picked up automatically.
