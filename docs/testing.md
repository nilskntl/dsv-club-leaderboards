# Testing

> How the Node.js test suite works, what it covers, and how to run it locally without Google Apps Script.

For what the pipeline does see [Pipeline](pipeline.md).
For class responsibilities see [Data Model](data-model.md).

---

## Table of Contents

- [Why a Node.js Test Suite?](#why-a-nodejs-test-suite)
- [Directory Layout](#directory-layout)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Environment Variables](#environment-variables)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [How the vm Context Works](#how-the-vm-context-works)
- [Adding New Tests](#adding-new-tests)

---

## Why a Node.js Test Suite?

All source code lives in `src/app-script/` and is written for the Google Apps Script runtime. Running it
normally requires copying it into a Google Sheet's Apps Script project and manually triggering it — a slow feedback loop
for every small change.

The test suite loads the same unmodified source files into Node.js using the built-in `vm` module, shims the
two Google-specific globals (`UrlFetchApp`, `Logger`), and runs tests with Node's built-in `node:test` runner.
No extra test framework, no transpiler, no cloud deployment needed.

---

## Directory Layout

```
test/
  package.json          npm scripts and the single dependency (sync-request)
  setup.js              vm context factory — loads source files, wires up shims
  unit/
    time.test.js        Time parsing and comparison
    calendar-date.test.js  CalendarDate normalisation and equality
    discipline.test.js  UID generation, deduplication, sort, cut
    sheet.test.js       Sheet ↔ domain model translation
  integration/
    pipeline.test.js    Real HTTP to dsvdaten.dsv.de — full pipeline smoke tests
```

The `test/` directory has its own `package.json` so the project root stays clean (only `index.html`,
`main.js`, and `README.md`).

---

## Setup

```bash
cd test
npm install
```

This installs `sync-request`, the one runtime dependency that provides synchronous HTTP (needed only for
integration tests). Unit tests have no external dependencies.

Node.js 18 or later is required (`node:test` is built-in from 18.x).

---

## Running Tests

```bash
cd test

# Unit tests only (no network, fast)
npm test

# Integration tests only (real HTTP to DSV website)
npm run test:integration

# All tests
npm run test:all
```

Expected output for unit tests (no network required):

```
▶ Time
  ✔ parses mm:ss,xx correctly (1ms)
  ✔ compare sorts fastest first (0ms)
▶ CalendarDate
  ...
▶ 22 tests (22 passed, 0 failed)  ~250ms
```

---

## Environment Variables

| Variable  | Default | Effect                                                                                                 |
|-----------|---------|--------------------------------------------------------------------------------------------------------|
| `VERBOSE` | unset   | Set to any non-empty value to print the code's `console.log` output to stdout during integration tests |
| `CLUB_ID` | `7985`  | DSV club ID used by integration tests. Override to test against your own club's live data              |

```bash
VERBOSE=1 CLUB_ID=1234 npm run test:integration
```

---

## Unit Tests

Unit tests cover the pure domain logic and do not make any network requests.

| File                    | What it tests                                                                                      |
|-------------------------|----------------------------------------------------------------------------------------------------|
| `time.test.js`          | `Time.parse`, `totalHundredth`, `totalSeconds`, `compare` (ascending sort)                         |
| `calendar-date.test.js` | Full date parsing, year-only normalisation to `00.00.yyyy`, `isCurrentYear`                        |
| `discipline.test.js`    | `uid` derivation, `addResult` deduplication, `removeDuplicateResults`, `sortResults`, `cutResults` |
| `sheet.test.js`         | `Sheet.extractResults` UID routing, male/female column splitting, skipping non-data rows           |

Unit tests share a single `getContext()` singleton so the source files are only loaded once across all files.

---

## Integration Tests

`integration/pipeline.test.js` makes real HTTP requests to `dsvdaten.dsv.de` and tests the full pipeline
end-to-end against live data.

**Tests:**

1. `_fetchNewData` returns correctly shaped objects — verifies that the raw DSV response can be parsed into
   `{name, time, birthYear, location, date}` objects with the expected formats.

2. Single-discipline pipeline — runs `extractResultsFromSheet → requestResults → adjustResults` for one
   discipline, verifies the results are sorted fastest-first and capped at `entriesPerDiscipline`.

3. Merge deduplication — seeds the leaderboard with a synthetic sheet row, merges it with live DSV data, and
   asserts no swimmer appears twice in the final result set.

**Why only one discipline per test?** The full leaderboard makes ~80 HTTP requests (one GET + one POST per
discipline combination). Restricting each test to a single discipline keeps integration tests fast (2 requests
per test) without sacrificing meaningful coverage:

```javascript
lb._disciplines = [lb.disciplines.find(d => d.uid === '#f502m')];
```

Each integration test calls `createContext()` (not `getContext()`) to get a fresh leaderboard with no
pre-loaded state.

---

## How the vm Context Works

Google Apps Script source files use `class` declarations and globals with no module system. Loading them in
Node.js requires working around two constraints:

**Constraint 1 — `class` declarations don't persist across `vm.runInContext` calls.**
`class`, `const`, and `let` are block-scoped. Running each file in a separate `vm.runInContext` call would
make each file's declarations invisible to the next. The solution is to concatenate all source files into a
single string and run them in one call:

```javascript
const srcCode = SRC_FILES.map(f => fs.readFileSync(f)).join('\n\n');
vm.runInContext(srcCode, context);
```

**Constraint 2 — classes must be reachable from tests.**
Even after the concatenated run, classes are local to the executed script. They are explicitly assigned to
`this` (which is the context object inside `vm.runInContext`) so tests can destructure them:

```javascript
const exportCode = EXPORTS.map(name => `this.${name} = ${name};`).join('\n');
vm.runInContext(srcCode + '\n\n' + exportCode, context);
```

**Constraint 3 — `UrlFetchApp.fetch` is synchronous.**
Apps Script's `UrlFetchApp.fetch` blocks until the HTTP response arrives. Node.js `fetch` is async. Wrapping
all test code in `async/await` would require modifying the source files. Instead, `sync-request` provides a
truly synchronous HTTP client that is used only in the `UrlFetchApp` shim — the source code runs unmodified.

---

## Adding New Tests

**New unit test file:**

```javascript
'use strict';
const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {getContext} = require('../setup');

describe('MyClass', () => {
    it('does something', () => {
        const {MyClass} = getContext();
        // ...
    });
});
```

Register it in `setup.js`:

- Add the source file path to `SRC_FILES` if it's a new source file.
- Add the export name to `EXPORTS` if the class/constant isn't there yet.

Run with `npm test` (unit) or add to the glob in `package.json` if in a new subdirectory.

**New integration test:**

Use `createContext()` instead of `getContext()` — each integration test should start from a clean state
with no pre-loaded results. Restrict the active disciplines to one using `lb._disciplines = [...]` unless
the test explicitly needs to exercise the full discipline set.
