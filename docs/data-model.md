# Data Model

> All domain classes, their responsibilities, and the relationships between them.

For how these classes flow through an update see [Pipeline](pipeline.md).
For how they map to the Google Sheet see [Sheet Layout](sheet-layout.md).

---

## Table of Contents

- [Class Overview](#class-overview)
- [Leaderboard](#leaderboard)
- [Discipline](#discipline)
- [Result](#result)
- [Person](#person)
- [Time](#time)
- [CalendarDate](#calendardate)
- [Constants](#constants)
- [RequestHandler](#requesthandler)
- [Sheet](#sheet)

---

## Class Overview

```
Leaderboard
  │  owns
  ├── Discipline[]           one per (distance × course × stroke × gender) combination
  │     └── Result[]         competition performances in that discipline
  │           ├── Person     swimmer identity
  │           ├── Time       swim time
  │           └── CalendarDate  competition date
  │
  ├── RequestHandler         scrapes DSV → produces Results
  └── Sheet                  reads from / writes to the raw 2D Google Sheet array
```

---

## Leaderboard

**File:** `src/app-script/leaderboard/leaderboard.js`

The central orchestrator. It is created fresh for every update run (by `runPipeline()`) and coordinates the
three pipeline stages: extraction, fetching, and adjustment.

### Lifecycle

```
new Leaderboard(clubId, rawSheetData, entriesPerDiscipline, requestConfig)
    └── _createDisciplines()   creates one Discipline per event combination from DISCIPLINES config
    └── requestConfig          optional {requestDelayMs, rateLimitRetryDelayMs} forwarded to RequestHandler
```

```
leaderboard.extractResultsFromSheet()   reads existing results from rawSheetData (newRecord = false)
leaderboard.requestResults()            scrapes DSV website (newRecord = true)
leaderboard.adjustResults()             deduplicates → sorts → cuts every Discipline
```

### `newResults`

After `adjustResults()`, the `newResults` getter returns log strings only for results that are **both**
marked `newRecord = true` (came from DSV this run) **and** survived the top-N cut. This prevents
re-reporting existing records on every run — a result only appears here if it displaced a previous entry.

### `adjustResults()` — order matters

```javascript
discipline.removeDuplicateResults();  // must run first: keeps fastest per swimmer from unsorted pool
discipline.sortResults();             // ascending by time
discipline.cutResults(N);             // slice to top N
```

If `sortResults()` ran before `removeDuplicateResults()`, the slower duplicate of a swimmer might be
retained while the faster one is discarded. The current order guarantees the fastest time is always kept.

---

## Discipline

**File:** `src/app-script/leaderboard/discipline.js`

Represents one swimming event defined by four dimensions:

| Property   | Example values                                                    |
|------------|-------------------------------------------------------------------|
| `distance` | `'50'`, `'100'`, `'200'`, `'400'`, `'800'`, `'1500'`              |
| `lane`     | `50` (long course) or `25` (short course)                         |
| `stroke`   | `'Freistil'`, `'Brust'`, `'Rücken'`, `'Schmetterling'`, `'Lagen'` |
| `gender`   | `'Männlich'`, `'Weiblich'`                                        |

### UID

Each discipline has a compact identifier derived from these four dimensions:

```
format:  '#' + stroke[0] + distance[0..1] + lane[0] + gender[0]   (all lowercase)
example: Freistil 50m Kurzbahn Männlich  →  '#f502m'
example: Rücken 100m Langbahn Weiblich   →  '#r105w'
```

The UID is written into the Google Sheet (column A / H) for every result row. `Sheet.extractResults()` uses
the UID to route each row back to the correct `Discipline` instance without relying on fixed row positions.

### `addResult()` — deduplication on insert

A result is only added if no structurally identical result (same person, same time, same location) already
exists. This prevents double-counting when both the existing sheet data and the fresh DSV results contain the
same performance.

---

## Result

**File:** `src/app-script/leaderboard/result.js`

A single competition performance by one swimmer.

| Property    | Type           | Notes                                                          |
|-------------|----------------|----------------------------------------------------------------|
| `person`    | `Person`       | The swimmer                                                    |
| `time`      | `Time`         | Time achieved                                                  |
| `location`  | `string`       | Venue name                                                     |
| `date`      | `CalendarDate` | Date of the competition                                        |
| `newRecord` | `boolean`      | `true` = fetched from DSV this run; `false` = already in sheet |

### `equals()` — location included

```javascript
equals(result)
{
    return this._person.equals(result.person)
        && this._time.equals(result.time)
        && this._location === result.location;
}
```

Location is part of the equality check because the same swimmer can post the same time at two different meets.
Those are distinct performances and must not be collapsed into one. Date is intentionally excluded — the same
performance can appear in both sheet data (with a year-only date) and DSV data (with a full date), and they
should be treated as the same result.

---

## Person

**File:** `src/app-script/leaderboard/person.js`

Minimal swimmer identity derived from DSV data.

| Property | Type     | Notes                                         |
|----------|----------|-----------------------------------------------|
| `name`   | `string` | Full name as provided by DSV                  |
| `birth`  | `string` | Birth year as a 4-digit string, e.g. `'2005'` |

The DSV website exposes birth year only, not a full date of birth. This is the highest-fidelity identity
consistently available from both the DSV source and the Google Sheet.

### `equals()` — both fields required

```javascript
equals(person)
{
    return this._name === person.name && this._birth === person.birth;
}
```

Name alone is insufficient because different active swimmers can share the same name. Both name and birth year
must match.

---

## Time

**File:** `src/app-script/leaderboard/time.js`

Parses and compares swim times in `mm:ss,xx` format (minutes, seconds, hundredths of a second).

### Why hundredths?

All comparisons use `totalHundredth` (an integer) rather than `totalSeconds` (a float):

```javascript
// Good: integer arithmetic, no precision issues
get
totalHundredth()
{
    return this._minutes * 6000 + this._seconds * 100 + this._hundredth;
}

// Risky: floating-point representation errors can produce wrong sort order
get
totalSeconds()
{
    return this._minutes * 60 + this._seconds + this._hundredth / 100;
}
```

### `compare()` — ascending (fastest first)

```javascript
static
compare(time1, time2)
{ ...
}
```

Returns negative if `time1` is faster. Intended for `Array.sort()` to produce a fastest-first leaderboard.

---

## CalendarDate

**File:** `src/app-script/leaderboard/calendar-date.js`

Handles competition dates from two sources with different formats.

| Source                    | Format             | Example        |
|---------------------------|--------------------|----------------|
| DSV website               | `dd.mm.yyyy`       | `'15.06.2023'` |
| Google Sheet (historical) | `yyyy` (year only) | `'2023'`       |

Year-only dates are normalised to `'00.00.yyyy'` internally so equality checks are consistent. A year-only
`'2023'` and a full date `'01.06.2023'` are never considered equal even if the year matches — they represent
different levels of precision.

### `isCurrentYear`

Used to distinguish current-season data (which the DSV provides) from historical data. Only relevant when
merging multi-year sheet data with fresh DSV results.

---

## Constants

**File:** `src/app-script/leaderboard/discipline.js`

All enumerations use English keys and German values (for display in the sheet).

```javascript
const STROKES = {FREESTYLE: 'Freistil', BREASTSTROKE: 'Brust', BACKSTROKE: 'Rücken', ...}
const GENDERS = {MALE: 'Männlich', FEMALE: 'Weiblich'}
const LANES = {LONG_COURSE: 50, SHORT_COURSE: 25}
```

`DISCIPLINES` defines which distances are contested in each stroke on each course:

```javascript
const DISCIPLINES = {
    FREESTYLE: {Lage: STROKES.FREESTYLE, Langbahn: ['50', '100', '200', '400', '800', '1500'], Kurzbahn: [...]},
    BUTTERFLY: {Lage: STROKES.BUTTERFLY, Langbahn: ['50', '100', '200'], Kurzbahn: [...]},
    BACKSTROKE: {...},
    BREASTSTROKE: {...},
    MEDLEY: {Lage: STROKES.MEDLEY, Langbahn: ['200', '400'], Kurzbahn: ['100', '200', '400']}
}
```

`Leaderboard._createDisciplines()` iterates `DISCIPLINES` and creates one `Discipline` instance per
combination. **To add a new distance, add it to the relevant array here** — no other code changes are needed.

---

## RequestHandler

**File:** `src/app-script/requests/request-handler.js`

Fetches results from the DSV website and converts them into `Result` instances. See [DSV Scraping](dsv-scraping.md)
for the full technical explanation of the HTTP sequence.

---

## Sheet

**File:** `src/app-script/sheet/sheet.js`

Translates between the domain model and the Google Sheet's raw 2D array. See [Sheet Layout](sheet-layout.md)
for the full column and row structure.
