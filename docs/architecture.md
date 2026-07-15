# Architecture

> High-level overview of the two-layer design, component responsibilities, and the key architectural decisions
> that shape the codebase.

For the domain model see [Data Model](data-model.md).
For the update pipeline see [Pipeline](pipeline.md).

---

## Table of Contents

- [Overview](#overview)
- [Two-Layer Design](#two-layer-design)
- [Why the Split Exists](#why-the-split-exists)
- [The eval() Pattern](#the-eval-pattern)
- [Why Not Move Everything to the Web App?](#why-not-move-everything-to-the-web-app)
- [Component Map](#component-map)
- [Endpoint and Version Management](#endpoint-and-version-management)

---

## Overview

The project automates a swimming club leaderboard in Google Sheets by pulling competition results from the
German Swimming Federation (DSV) website. It consists of two independently deployed layers:

- A **hosted Web App** (Google Apps Script) that handles all scraping, merging, and processing.
- A **bound script** (`main.js`) that the user copies into their own Google Sheet.

```
┌──────────────────────────────────────────────────────────────────┐
│  User's Google Sheet  (bound script: main.js)                    │
│                                                                  │
│  updateAllTime[Male|Female]() / updateSeason[Male|Female]()     │
│    1. Read current tab via SpreadsheetApp                        │
│    2. POST {clubId, sheetData, entriesPerDiscipline, filter} ──┐ │
│    5. Write returned data back to sheet                        │ │
└────────────────────────────────────────────────────────────────│─┘
                                                                 │
                    HTTP (JSON payload / response)               │
                                                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  Hosted Web App  (src/app-script/)                               │
│                                                                  │
│  doPost(e)                                                       │
│    3. Extract existing results from the raw sheet data           │
│    4. Scrape DSV for current-year results                        │
│    5. Merge → deduplicate → sort → trim → return JSON            │
└───────────────────────┬──────────────────────────────────────────┘
                        │  HTTP (2-step form POST)
                        ▼
                 dsvdaten.dsv.de
```

> Before step 2, the bound script resolves the configured **club name** to the internal `clubId`
> (via the DSV club search) and forwards it in the payload — along with the optional
> `requestDelayMs` / `rateLimitRetryDelayMs` pacing settings. See
> [DSV Scraping](dsv-scraping.md#resolving-a-club-name-to-a-clubid) and [Pipeline](pipeline.md#step-2--send-to-web-app).

---

## Two-Layer Design

| Layer                       | Where it runs              | Responsibility                              |
|-----------------------------|----------------------------|---------------------------------------------|
| Bound script (`main.js`)    | User's Google account      | Read sheet, send request, write result back |
| Web App (`src/app-script/`) | Developer's Google account | Scrape DSV, process data, return JSON       |

The bound script is intentionally minimal — it only contains configuration variables and two trigger functions.
All business logic lives in the Web App.

---

## Why the Split Exists

The split enables **centralised updates without requiring users to touch their script**.

When the scraping logic needs to change (e.g. because the DSV website was redesigned), only the Web App is
updated. All users benefit immediately. Without the split, every user would need to copy new code into their
Apps Script project manually.

The Web App receives the raw sheet data from the user, processes it, and sends back the result. The user's
bound script is just a thin client.

---

## The eval() Pattern

`main.js` dynamically loads `sheet.js` from GitHub at runtime before calling into it:

```javascript
let code = UrlFetchApp.fetch('https://raw.githubusercontent.com/.../sheet.js').getContentText();
eval(code);
getNewSheetData(version, sheet, FORMAT, formatSheetEveryTime);
```

`sheet.js` contains functions that call `SpreadsheetApp` — the Google Sheets API that can only run inside a
bound script (the user's own context). Those functions cannot run inside the hosted Web App. Loading them via
`eval()` injects them into the user's bound script context at call time.

This means `sheet.js` can be updated centrally on GitHub and every user automatically receives the new version
on their next run — without `main.js` ever changing.

**Risk:** The loaded code is fetched over HTTPS from GitHub. A compromised GitHub account or a MITM attack
could inject malicious code. For a swimming club leaderboard the risk is acceptable, but pinning the URL to a
specific commit hash (instead of `master`) would eliminate it.

---

## Why Not Move Everything to the Web App?

`SpreadsheetApp` (reading and writing cells) only works in the context of the Google account that owns the
spreadsheet. The Web App runs under the developer's account and cannot access the user's sheet without
explicit permission sharing.

To write to the user's sheet from the Web App, the user would need to share their spreadsheet with the Web
App's service account — an extra setup step that raises the barrier for non-technical users. The current
approach avoids that entirely.

---

## Component Map

```
src/app-script/
  code.js                     Web App entry point  →  doPost()
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
    sheet.js                  Sheet ↔ domain model translation + Google Sheets write helpers

main.js                       User-facing bound script: configuration + trigger functions
```

---

## Endpoint and Version Management

The Web App endpoint URL is **not hardcoded** in `main.js`. It is fetched from GitHub at runtime:

```
https://github.com/nilskntl/dsv-club-leaderboards/raw/master/src/app-script/endpoint.txt
```

This allows the endpoint to be redeployed and updated without requiring any change to users' scripts.

Similarly, `version.txt` on GitHub is compared against the local `version` constant in `main.js` on every
run. A mismatch logs a warning in the Apps Script execution log, prompting the user to update.
