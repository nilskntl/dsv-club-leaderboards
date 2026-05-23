# Pipeline

> Step-by-step walkthrough of a single leaderboard update — from the trigger function to the written sheet.

For where each class lives see [Data Model](data-model.md).
For how the sheet is structured see [Sheet Layout](sheet-layout.md).
For how DSV data is fetched see [DSV Scraping](dsv-scraping.md).

---

## Table of Contents

- [Trigger](#trigger)
- [Step 1 — Load Sheet Code](#step-1--load-sheet-code)
- [Step 2 — Send to Web App](#step-2--send-to-web-app)
- [Step 3 — Extract Existing Results](#step-3--extract-existing-results)
- [Step 4 — Fetch DSV Results](#step-4--fetch-dsv-results)
- [Step 5 — Adjust Results](#step-5--adjust-results)
- [Step 6 — Return and Write](#step-6--return-and-write)
- [newRecord Flag](#newrecord-flag)

---

## Trigger

The pipeline starts when `updateAllTime()` or `updateSeason()` is called in the user's bound script —
either manually or via a configured Apps Script time trigger.

| Function          | Sheet tab                   | Tab created if missing? |
|-------------------|-----------------------------|-------------------------|
| `updateAllTime()` | `'All-Time'`                | Yes                     |
| `updateSeason()`  | Current year, e.g. `'2026'` | Yes                     |

---

## Step 1 — Load Sheet Code

```javascript
let code = UrlFetchApp.fetch('.../sheet.js').getContentText();
eval(code);
```

`sheet.js` is loaded from GitHub and executed in the bound script context. This injects
`getNewSheetData()`, `writeDataToSheet()`, and `formatSheet()` — all of which call `SpreadsheetApp` and
therefore must run inside the user's own Google account context. See [Architecture](architecture.md#the-eval-pattern).

---

## Step 2 — Send to Web App

`getNewSheetData()` reads the current tab's full data and POSTs it to the Web App:

```javascript
let payload = {
    clubId: clubId,                              // DSV club ID from config
    data: sheet.getDataRange().getValues(),      // raw 2D array of the entire tab
    entriesPerDiscipline: numberOfEntries        // max results per discipline from config
};
```

The Web App URL is fetched from `endpoint.txt` on GitHub (not hardcoded) so the endpoint can be updated
without users changing `main.js`.

A response that starts with `<!DOCTYPE html>` indicates a Web App deployment error. The script logs the
response body and aborts without touching the sheet.

---

## Step 3 — Extract Existing Results

Inside the Web App, `doPost()` creates a new `Leaderboard` and immediately calls:

```javascript
leaderboard.extractResultsFromSheet();
```

`Sheet.extractResults()` scans the raw 2D array row by row. A row is treated as a result row only if:

- it has more than 9 columns, **and**
- column 0 **and** column 7 both start with `'#'` (the UID prefix)

For every matching row, `_addResult()` is called twice — once for the male half (column offset 0) and once
for the female half (column offset 7). Empty name cells indicate an unfilled rank slot and are skipped.

All results loaded from the sheet receive `newRecord = false`.

---

## Step 4 — Fetch DSV Results

```javascript
leaderboard.requestResults();
```

`RequestHandler.requestResults()` iterates every discipline and calls `_fetchNewData(discipline)` for each.
The fetch is a 2-step HTTP sequence — see [DSV Scraping](dsv-scraping.md) for the full breakdown.

Every result fetched from DSV receives `newRecord = true`. Results are added via `Discipline.addResult()`,
which silently skips exact duplicates (same person + time + location) to prevent double-counting when the
same performance is present in both the sheet data and the DSV response.

After this step, each `Discipline` holds a combined, unsorted pool of old (sheet) and new (DSV) results.

---

## Step 5 — Adjust Results

```javascript
leaderboard.adjustResults();
```

For every discipline, three operations run in sequence:

```
removeDuplicateResults()   →   sortResults()   →   cutResults(N)
```

| Step                       | What happens                              | Why this order?                                                                                   |
|----------------------------|-------------------------------------------|---------------------------------------------------------------------------------------------------|
| `removeDuplicateResults()` | Keeps only the fastest result per swimmer | Must run before sort — both times for the same swimmer must still be present in the unsorted pool |
| `sortResults()`            | Sorts ascending by `Time.totalHundredth`  | Uses integer hundredths to avoid float precision errors                                           |
| `cutResults(N)`            | Truncates to top N                        | Must run after sort — slice(0, N) on a sorted list gives the fastest N                            |

---

## Step 6 — Return and Write

The Web App returns:

```json
{
  "data": [
    ...
  ],
  // 2D array ready for setValues(), starting at sheet row 3
  "newResults": [
    ...
  ]
  // formatted strings for results that are new AND in the top N
}
```

Back in the bound script:

1. `_writeNewDataToSheet()` writes the `data` array to the sheet starting at row 3. Rows 1–2 (season header
   and column headers) are left untouched. Any stale rows below the new data block are cleared.

2. `_writeNewRecordsToSheet()` appends each `newResults` string to column P, starting after the last
   non-empty cell. Column P is never cleared by `_writeNewDataToSheet()`, so entries accumulate permanently
   across runs.

3. If `formatSheetEveryTime` is `true`, `formatSheet()` re-applies all colours, merges, and column widths.

---

## newRecord Flag

The `newRecord` flag on `Result` threads through the entire pipeline:

| Stage                           | `newRecord` value            | Meaning                                       |
|---------------------------------|------------------------------|-----------------------------------------------|
| `extractResultsFromSheet()`     | `false`                      | Result was already in the sheet               |
| `requestResults()`              | `true`                       | Result was just fetched from DSV              |
| After `adjustResults()`         | unchanged                    | Preserved through deduplicate / sort / cut    |
| `leaderboard.newResults` getter | only `true` entries returned | Only newly entered top-N results are reported |

> A result that was already in the sheet (`newRecord = false`) and was re-fetched from DSV will appear in
> the pool with both flags. `Discipline.addResult()` skips the DSV copy as a structural duplicate, so the
> sheet version (with `newRecord = false`) survives. This means a stable existing entry is never accidentally
> re-reported as a new record.
