# DSV Scraping

> How `RequestHandler` fetches competition results from the DSV website, including the two-step HTTP sequence
> required by the ASP.NET WebForms backend.

For where the scraper fits in the overall flow see [Pipeline](pipeline.md).

---

## Table of Contents

- [Target URL](#target-url)
- [Why Two HTTP Requests?](#why-two-http-requests)
- [Step 1 — GET: Obtain Session Tokens](#step-1--get-obtain-session-tokens)
- [Step 2 — POST: Submit the Filter Form](#step-2--post-submit-the-filter-form)
- [Response Parsing](#response-parsing)
- [Rate Limiting and Error Reporting](#rate-limiting-and-error-reporting)
- [Required Headers](#required-headers)
- [Scope Limitation — Current Year Only](#scope-limitation--current-year-only)
- [HTML Parsing Helpers](#html-parsing-helpers)

---

## Target URL

```
https://dsvdaten.dsv.de/Modules/Clubs/Club.aspx?ClubID=<clubId>
```

This is the club page on the DSV data portal. The same URL is used for both the GET and the POST.

---

## Why Two HTTP Requests?

The DSV site runs on **ASP.NET WebForms**, which uses hidden form fields to manage server-side state:

- `__VIEWSTATE` — serialised server-side state, re-sent with every form submission
- `__EVENTVALIDATION` — anti-CSRF token tied to the current page instance

Both values are generated fresh by the server on each page load and must be echoed back in the POST body.
Without them, the server rejects the form submission. This forces a two-request sequence:

```
1. GET  https://dsvdaten.dsv.de/.../Club.aspx?ClubID=…
        ↳  extract __VIEWSTATE + __EVENTVALIDATION from the HTML

2. POST https://dsvdaten.dsv.de/.../Club.aspx?ClubID=…
        with form body including the tokens + discipline filter parameters
        ↳  returns the results table HTML
```

---

## Step 1 — GET: Obtain Session Tokens

```javascript
let loginResponse = UrlFetchApp.fetch(this._url, {
    method: "get",
    headers: {
        "User-Agent": "Mozilla/5.0",
        "sec-fetch-site": "same-origin",
        "Referer": "https://dsvdaten.dsv.de/Modules/Clubs/Search.aspx",
    },
    followRedirects: false,
    muteHttpExceptions: true
});
```

The response HTML contains the tokens as hidden input values:

```html
<input type="hidden" name="__VIEWSTATE" value="<long base64 string>"/>
<input type="hidden" name="__EVENTVALIDATION" value="<another string>"/>
```

`_extractData()` pulls each value out with a simple substring search:

```javascript
let viewState = this._extractData(html, '__VIEWSTATE" value="', '" />');
let eventValidation = this._extractData(html, '__EVENTVALIDATION" value="', '" />');
```

---

## Step 2 — POST: Submit the Filter Form

The form body encodes the discipline parameters alongside the session tokens:

```javascript
let payload = {
    "ClubID": this._clubId,
    "__EVENTTARGET": "ctl00$ContentSection$_rankingsButton",
    "__VIEWSTATE": viewState,
    "__EVENTVALIDATION": eventValidation,

    // Gender: first character of the German gender label ("M" or "W")
    "ctl00$ContentSection$_genderRadioButtonList": discipline.gender.substring(0, 1),

    // Course: "L" for long course (50m), "S" for short course (25m)
    "ctl00$ContentSection$_courseRadioButtonList": (discipline.lane === LANES.LONG_COURSE) ? "L" : "S",

    // Event: distance + first letter of German stroke name + "|GL"
    // e.g. Freistil 50m → "50F|GL",  Rücken 100m → "100R|GL"
    "ctl00$ContentSection$_eventDropDownList": `${discipline.distance + discipline.stroke.substring(0, 1)}|GL`,

    // Time range: always the full current calendar year
    "ctl00$ContentSection$_timerangeDropDownList": `01.01.${this._year}|31.12.${this._year}`
};
```

Apps Script automatically sends this object as `application/x-www-form-urlencoded`.

---

## Response Parsing

The POST response is an HTML page. The results table is identified by its CSS class:

```javascript
let tableHtml = this._extractData(response, 'class="table table-sm table-stripe"', '</table>');
```

The table is then split into rows and converted to objects:

```javascript
let rows = this._splitElement(tableHtml, '<tr>', '</tr>');
rows.shift(); // remove fragment before first <tr>
rows.shift(); // remove the header row

return rows.map(row => {
    let [, position, name, birthYear, time, , location, date] = this._splitElement(row, '<td>', '</td>');
    return {name, time, birthYear, location, date};
});
```

The DSV table has 8 columns. Columns at index 1 (rank) and 5 (pool size) are skipped via destructuring.
The remaining 6 fields are returned as plain objects.

---

## Rate Limiting and Error Reporting

The DSV server rate-limits aggressive clients with **HTTP 429**. `RequestHandler` mitigates this in
several layers:

1. Only **one GET** per run — the fresh `__VIEWSTATE`/`__EVENTVALIDATION` tokens embedded in every POST
   response are reused for the next POST, halving the request count.
2. A fixed delay (`_requestDelayMs`, 1200 ms) between POSTs.
3. On a 429, the POST is retried **once** after a 5-second pause.

Failures that survive these mitigations are collected as human-readable strings in
`RequestHandler.warnings` and returned to the client inside the Web App's JSON response (see
[Pipeline, Step 6](pipeline.md#step-6--return-and-write)) — the hosting account's execution log is not
visible to users, so the response body is the only error channel:

| Situation                                   | Behaviour                                                                                  |
|---------------------------------------------|--------------------------------------------------------------------------------------------|
| Initial GET returns no tokens               | Warning recorded, run aborted before any POST                                              |
| POST still 429 after the retry              | Warning recorded, **run aborted** — further POSTs would keep triggering the limiter        |
| Other non-200 response or page without tokens | Warning recorded, discipline skipped; the previous (still valid) tokens are kept          |

In every failure case the affected disciplines simply keep their existing sheet data — the sheet is never
overwritten with garbage.

---

## Required Headers

| Header                        | Why required                                                                          |
|-------------------------------|---------------------------------------------------------------------------------------|
| `User-Agent: Mozilla/5.0`     | The server returns an empty page or redirect for non-browser user agents              |
| `Referer: .../Search.aspx`    | The server validates that requests originate from the search page                     |
| `sec-fetch-site: same-origin` | Not automatically set by `UrlFetchApp`; required for the server to accept the request |

Omitting any of these headers causes the server to return a non-data response (redirect or error page)
without any indication in the HTTP status code.

---

## Scope Limitation — Current Year Only

The time range filter is always set to January 1 – December 31 of the **current calendar year**:

```javascript
`01.01.${this._year}|31.12.${this._year}`
```

The DSV club page does not expose a multi-year filter. Historical results must be entered into the sheet
manually. Only the all-time sheet tab requires this — the season tab is always for the current year anyway.

---

## HTML Parsing Helpers

Three private methods handle all HTML extraction without a DOM parser:

### `_extractData(context, begin, end)`

Extracts the **first** substring between `begin` and `end`. Used to pull the ViewState tokens and the
results table out of raw HTML. Returns an empty string if either delimiter is not found — callers rely
on this to detect error pages (a page without a `__VIEWSTATE` is not a regular WebForms response).

### `_splitElement(input, begin, end)`

Splits `input` on every `begin` and discards everything after `end` in each fragment:

```javascript
'<tr>A</tr><tr>B</tr>'.split('<tr>').map(s => s.split('</tr>')[0])
// → ['', 'A', 'B']
```

The first element is always the content before the first `begin` occurrence (usually empty or whitespace).
`requestResults()` calls `shift()` twice to remove it and the header row.

### `_convertToArray(elements)`

Maps each HTML row fragment to a plain object. Uses destructuring to skip the rank and pool-size columns:

```javascript
let [, position, name, birthYear, time, , location, date] = this._splitElement(row, '<td>', '</td>');
//    ^^ rank                                ^^ pool size — both discarded
```
