# Pipeline

> Step-by-step walkthrough of a single leaderboard update — from the trigger function to the written sheet.

For where each class lives see [Data Model](data-model.md).
For how the sheet is structured see [Sheet Layout](sheet-layout.md).
For how DSV data is fetched see [DSV Scraping](dsv-scraping.md).

---

## Table of Contents

- [Trigger](#trigger)
- [Step 1 — Load Sheet Code](#step-1--load-sheet-code)
- [Step 2 — Run the Pipeline](#step-2--run-the-pipeline)
- [Step 3 — Extract Existing Results](#step-3--extract-existing-results)
- [Step 4 — Fetch DSV Results](#step-4--fetch-dsv-results)
- [Step 5 — Adjust Results](#step-5--adjust-results)
- [Step 6 — Return and Write](#step-6--return-and-write)
- [newRecord Flag](#newrecord-flag)

---

## Trigger

The pipeline starts when one of the update functions is called in the user's bound script —
either manually or via a configured Apps Script time trigger.

| Function                                        | Sheet tab                   | Disciplines fetched | Tab created if missing? |
|-------------------------------------------------|-----------------------------|---------------------|-------------------------|
| `updateAllTimeMale()` / `updateAllTimeFemale()` | `'All-Time'`                | One gender          | Yes                     |
| `updateSeasonMale()` / `updateSeasonFemale()`   | Current year, e.g. `'2026'` | One gender          | Yes                     |
| `updateAllTime()`                               | `'All-Time'`                | All                 | Yes                     |
| `updateSeason()`                                | Current year, e.g. `'2026'` | All                 | Yes                     |

The gendered variants exist because a full update makes ~70 DSV requests and can exceed the
Apps Script 6-minute execution limit — and the whole pipeline now runs inside the user's own
account, so it is subject to that limit. Each variant fetches only its own gender; the other
gender's sheet entries pass through unchanged. The male and female triggers must be scheduled
at different times (e.g. one hour apart) — each run reads and writes the whole tab, so
overlapping runs would overwrite each other's results.

---

## Step 1 — Load Sheet Code

```javascript
let code = UrlFetchApp.fetch('.../sheet/sheet.js').getContentText();
eval(code);
```

`sheet.js` is loaded from GitHub and executed in the bound script context. This injects
`getNewSheetData()`, `writeDataToSheet()`, and `formatSheet()` — all of which call `SpreadsheetApp` and
therefore must run inside the user's own Google account context. See [Architecture](architecture.md#the-eval-pattern).

---

## Step 2 — Run the Pipeline

First, `getNewSheetData()` resolves the configured club **name** to the internal ClubID that all DSV
requests use (`resolveClubId(clubName)`, see [DSV Scraping](dsv-scraping.md#resolving-a-club-name-to-a-clubid)):

- **Exact match** → the DSV search 302-redirects straight to the club page; the ClubID is read from the
  `Location` header.
- **Several matches** → the first row of the result table is used and logged so the user can spot a wrong pick.
- **No match** → `getNewSheetData()` logs an error pointing to the DSV club search and aborts without
  touching the sheet or running the pipeline.

It then reads the current tab's full data, fetches the remaining pipeline sources from GitHub
(`sheet/sheet-model.js`, `leaderboard/`, `requests/`, `pipeline.js`), `eval()`s them, and calls
`runPipeline()` **in-process** — everything runs inside the user's own account, there is no Web App:

```javascript
eval(code); // sheet-model.js + leaderboard/ + requests/ + pipeline.js fetched from GitHub

let result = runPipeline(
    club.clubId,      // internal ClubID resolved from clubName
    sheetData,        // raw 2D array of the entire tab
    numberOfEntries,  // max results per discipline from config
    filter,           // optional discipline filter, e.g. {genders: ['Männlich']}
    requestConfig     // {requestDelayMs, rateLimitRetryDelayMs} — blank → defaults 1500 / 12000
);
```

The optional `filter` restricts which disciplines are fetched from DSV in Step 4. It may contain
`genders`, `strokes`, `lanes`, and/or `distances` arrays; provided keys combine with AND, omitted
keys match everything. A missing filter performs a full update.

`requestConfig` carries `requestDelayMs` / `rateLimitRetryDelayMs`, which tune the DSV request pacing
(see [DSV Scraping](dsv-scraping.md)); blank or invalid values fall back to the defaults inside `RequestHandler`.

`runPipeline()` returns a plain object (no HTTP, no JSON round-trip):

- `error` present → the run threw an exception. The script logs message and stack and aborts without
  touching the sheet.
- `warnings` non-empty → the run completed but with problems (e.g. the DSV rate limiter aborted the fetch
  partway). Warnings are logged to the execution log (Apps Script → Executions) with a timestamp and a
  ⚠️ prefix; they are not written into the sheet.

---

## Step 3 — Extract Existing Results

`runPipeline()` creates a new `Leaderboard` and immediately calls:

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
leaderboard.requestResults(filter);
```

`RequestHandler.requestResults(filter)` iterates every discipline matching the optional filter and calls
`_fetchNewData(discipline)` for each. Disciplines excluded by the filter are not fetched — they keep the
results loaded from the sheet in Step 3 and pass through Steps 5–6 unchanged.

The matching disciplines are fetched in a **randomised order** (Fisher–Yates shuffle). If the DSV rate
limiter aborts the run partway, a different subset is covered on each trigger run, so repeated runs
eventually fetch every discipline rather than always stalling on the same tail. See
[DSV Scraping](dsv-scraping.md#rate-limiting-and-error-reporting).
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

`runPipeline()` returns:

```json
{
  "data": [
    ...
  ],
  // 2D array ready for setValues(), starting at sheet row 3
  "newResults": [
    ...
  ],
  // formatted strings for results that are new AND in the top N
  "warnings": [
    ...
  ]
  // non-fatal problems from this run, e.g. "Rate limited by DSV (HTTP 429) despite retry at ..."
}
```

If the pipeline throws, `runPipeline()` instead returns
`{ "error": { "message": ..., "stack": ... }, "warnings": [...] }`
— `getNewSheetData()` logs the error and leaves the sheet untouched.

Back in `getNewSheetData()`:

1. `_writeNewDataToSheet()` writes the `data` array to the sheet starting at row 3. Rows 1–2 (season header
   and column headers) are left untouched. Any stale rows below the new data block are cleared.

2. `_writeNewRecordsToSheet()` appends each `newResults` string to column P, starting after the last
   non-empty cell. Column P is never cleared by `_writeNewDataToSheet()`, so entries accumulate permanently
   across runs. `warnings` strings only go to the execution log — they are never written into the sheet.

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
