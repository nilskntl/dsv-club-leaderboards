# Architecture

> High-level overview of the design, component responsibilities, and the key architectural decisions
> that shape the codebase.

For the domain model see [Data Model](data-model.md).
For the update pipeline see [Pipeline](pipeline.md).

---

## Table of Contents

- [Overview](#overview)
- [Where the Code Runs](#where-the-code-runs)
- [Why the Split Exists](#why-the-split-exists)
- [The eval() Pattern](#the-eval-pattern)
- [Why Everything Runs in the User's Account](#why-everything-runs-in-the-users-account)
- [Component Map](#component-map)
- [Version Management](#version-management)

---

## Overview

The project automates a swimming club leaderboard in Google Sheets by pulling competition results from the
German Swimming Federation (DSV) website. **Everything runs inside the user's own Google account** — there is
no hosted Web App or developer-side service. The code is split only by *where it lives*, not by where it runs:

- A tiny **bound script** (`main.js`) that the user copies into their own Google Sheet. It holds only
  configuration and the trigger functions.
- The **pipeline sources** (`src/app-script/`), fetched from GitHub at runtime and executed in the user's
  account via `eval()`. This is where all scraping, merging, and processing happens.

```
┌────────────────────────────────────────────────────────────────────┐
│  User's Google Sheet  (bound script: main.js)                       │
│                                                                     │
│  updateAllTime[Male|Female]() / updateSeason[Male|Female]()         │
│    1. eval(sheet.js from GitHub)  →  getNewSheetData()              │
│    2. Resolve club name → ClubID (DSV club search)                 │
│    3. Read current tab via SpreadsheetApp                          │
│    4. eval(leaderboard/ + requests/ + pipeline.js from GitHub)     │
│    5. runPipeline(clubId, sheetData, entriesPerDiscipline, filter) │
│    6. Write returned data back to the sheet                        │
└───────────────────────────────┬─────────────────────────────────────┘
                                │  HTTP (2-step form POST)
                                ▼
                         dsvdaten.dsv.de
```

> All DSV requests originate from the user's account. The GitHub fetches load *source code*; the only data
> requests go directly from the user's account to the DSV website. See
> [DSV Scraping](dsv-scraping.md#resolving-a-club-name-to-a-clubid)
> and [Pipeline](pipeline.md#step-2--run-the-pipeline).

---

## Where the Code Runs

| Component                   | Lives in           | Runs in               | Responsibility                                   |
|-----------------------------|--------------------|-----------------------|--------------------------------------------------|
| Bound script (`main.js`)    | User's Apps Script | User's Google account | Configuration + trigger functions                |
| `sheet/sheet.js`            | GitHub (this repo) | User's Google account | Sheet ↔ model translation, club resolution, glue |
| `leaderboard/`, `requests/` | GitHub (this repo) | User's Google account | Domain model + DSV scraper                       |
| `pipeline.js`               | GitHub (this repo) | User's Google account | `runPipeline()` — orchestrates one update        |

`main.js` is intentionally minimal — it only contains configuration variables and the trigger functions.
All business logic lives in the GitHub-hosted sources and is loaded on demand.

---

## Why the Split Exists

The split enables **centralised updates without requiring users to touch their script**.

When the scraping or processing logic needs to change (e.g. because the DSV website was redesigned), only the
GitHub sources are updated. All users benefit on their next run. Without the split, every user would need to
copy new code into their Apps Script project manually.

`main.js` is a thin, stable shell; everything that might change is fetched fresh from GitHub each run.

---

## The eval() Pattern

The project loads code from GitHub at runtime in **two stages**, both using `eval()`:

**Stage 1 — `main.js` loads `sheet.js`:**

```javascript
let code = UrlFetchApp.fetch('https://raw.githubusercontent.com/.../sheet/sheet.js').getContentText();
eval(code);
getNewSheetData(version, sheet, FORMAT, formatSheetEveryTime, filter);
```

**Stage 2 — `sheet.js` (inside `getNewSheetData`) loads the pipeline sources:**

```javascript
let code = ['leaderboard/calendar-date.js', 'leaderboard/time.js', /* … */, 'pipeline.js']
        .map(file => UrlFetchApp.fetch(scriptBase + file).getContentText())
        .join('\n\n');
eval(code);
let result = runPipeline(club.clubId, sheetData, numberOfEntries, filter, requestConfig);
```

Both stages rely on the same JavaScript behaviour: a direct `eval()` in non-strict code injects the
`function` declarations it defines (`getNewSheetData`, `runPipeline`, …) into the calling scope, and those
functions close over the classes/constants declared alongside them. Because `sheet.js` defines the `Sheet`
class, the `Leaderboard` loaded in Stage 2 can reach it through the surrounding lexical scope.

This means every source file can be updated centrally on GitHub and every user automatically receives the new
version on their next run — without `main.js` ever changing.

**Risk:** The loaded code is fetched over HTTPS from GitHub. A compromised GitHub account or a MITM attack
could inject malicious code. For a swimming club leaderboard the risk is acceptable, but pinning the URLs to a
specific commit hash (instead of `master`) would eliminate it.

---

## Why Everything Runs in the User's Account

Earlier versions ran the scraping and processing in a **hosted Web App** under the developer's account, with
the bound script POSTing the sheet data to it. That was removed: every DSV request now originates from the
user's own account, so the developer no longer scrapes the DSV site on anyone's behalf.

Running in the user's account also fits how Google Sheets access works: `SpreadsheetApp` (reading and writing
cells) only works in the context of the account that owns the spreadsheet. Keeping the whole pipeline in that
same context means there is no cross-account sharing, no service account, and no extra setup — the user copies
`main.js`, sets their club name, and runs it.

---

## Component Map

```
src/app-script/
  pipeline.js                 In-process pipeline entry point  →  runPipeline()
  leaderboard/
    leaderboard.js            Pipeline orchestrator
    discipline.js             One event (distance + course + stroke + gender) + its results
    result.js                 One competition performance
    person.js                 Swimmer identity (name + birth year)
    time.js                   Swim time in mm:ss,xx format
    calendar-date.js          Competition date (dd.mm.yyyy or year-only yyyy)
  requests/
    request-handler.js        DSV website scraper (2-step HTTP)
  sheet/
    sheet.js                  Sheet ↔ model translation, club-name resolution, Google Sheets write helpers,
                              and the glue that fetches + eval()s the pipeline sources

main.js                       User-facing bound script: configuration + trigger functions
```

`sheet.js` is the file `main.js` loads first; it in turn loads the `leaderboard/`, `requests/`, and
`pipeline.js` sources and calls `runPipeline()`.

---

## Version Management

`version.txt` on GitHub is compared against the local `version` constant in `main.js` on every run. A mismatch
logs a warning in the Apps Script execution log, prompting the user to update their copy of `main.js`. Because
all other logic is fetched from GitHub at runtime, `main.js` only needs re-copying when its own configuration
surface changes.
