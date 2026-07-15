# Club Leaderboards – Automated

[🇩🇪 Deutsche Version](README.md)

> Keeps your swimming club's leaderboards up to date automatically –  
> pulling results directly from the German Swimming Federation (DSV).

A live example: [www.wsg-wunstorf.de/bestenlisten](https://www.wsg-wunstorf.de/bestenlisten)

---

## What does this project do?

The project has two independent parts that can also be used separately:

**Part 1 – Leaderboards in Google Sheets**  
A script regularly fetches your club's current results from the DSV portal and writes them into a Google Sheet
automatically. The sheet contains the best times across all disciplines, sorted by stroke, course length, and gender –
both for the current year and as an all-time ranking.

**Part 2 – Leaderboards on the club website** *(optional)*  
Once the sheet is populated, it can be embedded on the club website in a few steps. Visitors can filter the view by
season, stroke, course length, and gender.

---

## Prerequisites

- A **Google account** (free)
- Your club's **name** as listed by the DSV

### What is my club name?

You don't need to look up any ID – before each update the script searches for your club via the
DSV club search and resolves the matching internal ID automatically.

1. Open [dsv.de](https://www.dsv.de/de/leistungs--und-wettkampfsport/schwimmen/wettkampf-regional/vereine/) and search
   for your club.
2. Note the club name **exactly as shown there**.

> **Tip:** Use the full name. If exactly one club matches, it is resolved directly. If several clubs
> match your term, the script uses the **first** match and writes it to the
> log – check there that the correct club was found.

---

## Part 1 – Setting up the Google Sheets leaderboard

### Step 1 – Create a new Google Sheet

1. Open [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. Give it a name, e.g. *"Club Leaderboards"*.

---

### Step 2 – Add the script

1. In Google Sheets, click **Extensions → Apps Script** at the top.  
   A new window with the script editor opens.
2. Delete all existing code in the editor.
3. Open [`main.js`](main.js) from this repository and copy the full contents.
4. Paste the code into the editor and save with **Ctrl + S** (Mac: **⌘ + S**).

---

### Step 3 – Enter your club name

Find this line near the top of the script and replace the name with your own:

```js
const clubName = 'Bielefelder Wasserfreunde'  // ← enter your club's name here
```

You can also adjust the number of entries shown per discipline:

```js
const numberOfEntries = 5  // How many places to show per event
```

If the DSV portal keeps throttling you (a "Rate limited" message in the log), you can optionally
increase the wait times between requests (leave empty to use the defaults):

```js
const requestDelayMs = ''          // Pause between requests in ms (default: 1500)
const rateLimitRetryDelayMs = ''   // Wait before retrying after a rate limit in ms (default: 12000)
```

---

### Step 4 – Populate the sheet for the first time

1. In the script editor, select **`updateAllTimeMale`** from the function dropdown and click the **Run button (▶)**.
2. On the first run, Google will ask for permissions – click **"Allow"**. The script only needs access to your own
   spreadsheet.
3. Then run **`updateAllTimeFemale`** as well.
4. Once complete, a new sheet tab named **"All-Time"** will appear with the full discipline structure and this year's
   results.

The update is split by gender so each run stays under the Google Apps Script 6-minute execution limit.

To also create a **season leaderboard** for the current year, run **`updateSeasonMale`** and **`updateSeasonFemale`**
as well. This creates a tab named after the current year (e.g. "2026") automatically.

> **Note:** The DSV portal only provides results for the current calendar year. Older results for the all-time ranking
> must be entered manually once (→ next step).

---

### Step 5 – Enter historical results *(one-time, all-time only)*

Since the DSV does not provide archival data, past results must be added to the all-time sheet manually once:

1. Enter older times directly into the appropriate rows in the sheet.
2. **Important:** Do not change the column structure – especially the identifiers in columns A and H. The script uses
   them to assign results to the correct discipline.
3. From the next run onwards, the script will update all entries automatically.

---

### Step 6 – Set up automatic updates *(optional)*

To update the leaderboards daily without manual intervention:

1. In the script editor, click the **clock icon (Triggers)** in the left sidebar.
2. Click **"+ Add Trigger"** in the bottom right.
3. Select **`updateAllTimeMale`** as the function and **"Time-driven"** → **"Daily"** as the event type, and pick a
   time window (e.g. 2–3 AM).
4. Click **"Save"**.
5. Add a second trigger for **`updateAllTimeFemale`** the same way – **at least 6 min apart** to avoid race conditions.

> **Important:** The male and female triggers must not run at the same time. Each run reads and writes the entire
> sheet – overlapping runs would overwrite each other's results.

Two more triggers for **`updateSeasonMale`** and **`updateSeasonFemale`** can be set up the same way if needed – also
offset in time.

---

## Part 2 – Embedding leaderboards on the website *(optional)*

### Step 1 – Publish the sheet as a public link

A public link is required for each sheet tab you want to show on the website:

1. In Google Sheets, open **File → Share → Publish to web**.
2. Select the desired sheet (e.g. "All-Time" or "2024") and choose **"Tab-separated values (.tsv)"** as the format.
3. Click **"Publish"** and copy the link.
4. Repeat for each additional sheet tab.

---

### Step 2 – Enter the links in the HTML file

1. Open [`index.html`](index.html) from this repository.
2. Find the section `const KEYS = { ... }` and enter the copied links:

```js
const KEYS = {
    'All-Time': {
        'name': 'All-Time',  // Do not change this name
        'link': 'YOUR_LINK_TO_THE_ALL-TIME_SHEET'
    },
    '2024': {
        'name': '2024',
        'link': 'YOUR_LINK_TO_THE_2024_SHEET'
    }
    // Add further seasons following the same pattern
}
```

3. Optional: adjust colours and appearance in the `const SETTINGS = { ... }` section just above.

---

### Step 3 – Embed in your website

Embed `index.html` into your website, or open it directly in a browser to preview the result.

---

## Settings

### Script (`main.js`)

| Setting                 | Default                       | Description                                                                       |
|-------------------------|-------------------------------|-----------------------------------------------------------------------------------|
| `clubName`              | `'Bielefelder Wasserfreunde'` | Your club's name as listed by the DSV (resolved to the internal ID automatically) |
| `numberOfEntries`       | `5`                           | Number of places shown per discipline                                             |
| `formatSheetEveryTime`  | `true`                        | Reformat the sheet on every update                                                |
| `requestDelayMs`        | `''` (→ 1500)                 | Pause between DSV requests in ms; empty = default                                 |
| `rateLimitRetryDelayMs` | `''` (→ 12000)                | Wait before retrying after a rate limit (HTTP 429) in ms; empty = default         |

Colours, column widths, and row heights can be adjusted via the `FORMAT` object at the bottom of `main.js`.

### Website (`index.html`)

| Setting               | Default     | Description                          |
|-----------------------|-------------|--------------------------------------|
| `SHOW_STATISTICS`     | `true`      | Show or hide the statistics panel    |
| `ROUNDED_CORNERS`     | `true`      | Rounded corners on cards and buttons |
| `TRANSITION_DURATION` | `'0.3s'`    | Duration of transition animations    |
| `PRIMARY_COLOR`       | `'#31353E'` | Primary colour (buttons, headings)   |
| `PRIMARY_BACKGROUND`  | `'#f3f3f3'` | Page background colour               |

---

## Frequently asked questions

**The script reports "No club found".**  
The `clubName` you entered doesn't match any club. Search for your club at
[dsvdaten.dsv.de](https://dsvdaten.dsv.de/Modules/Clubs/Search.aspx) or
[dsv.de](https://www.dsv.de/de/leistungs--und-wettkampfsport/schwimmen/wettkampf-regional/vereine/)
and copy the name exactly as shown there.

**The wrong club was found.**  
If your search term matches several clubs, the script uses the first match. The log (under **Executions**)
shows which club was picked (`Found club "…"`). Enter a more specific/complete name to make the search
unambiguous.

**The sheet stays empty after running the script.**  
Check the logs in the script editor under **Executions**: they show which club was found and whether the DSV
portal throttled the requests (a "Rate limited" message). If so, increase the wait times (see Step 3) or run
the trigger less frequently.

**Can I edit the sheet manually after setup?**  
Yes – adding and correcting entries is always possible. The identifiers in columns A and H and the overall column
structure should not be changed, as the script relies on them to route results correctly.

**Why are there no results from previous years?**  
The DSV only provides results for the current calendar year. Older data for the all-time ranking must be entered
manually once (→ Step 5).

**The script asks for permissions – is that safe?**  
Yes. The script runs entirely within your Google account and only accesses the spreadsheet it is attached to. The
permission prompt is a normal step in Google Apps Script.

**How often should the trigger run?**  
Daily is usually sufficient. To avoid putting unnecessary load on the DSV server, the trigger should not be set to run
more frequently than once per hour.

---

## Further reading

| Document                             | Content                                           |
|--------------------------------------|---------------------------------------------------|
| [Architecture](docs/architecture.md) | Two-layer design, component map, `eval()` pattern |
| [Data Model](docs/data-model.md)     | All domain classes and their relationships        |
| [Pipeline](docs/pipeline.md)         | Step-by-step walkthrough of a leaderboard update  |
| [Sheet Layout](docs/sheet-layout.md) | Column and row structure of the Google Sheet      |
| [DSV Scraping](docs/dsv-scraping.md) | How results are fetched from the DSV website      |
| [Testing](docs/testing.md)           | Node.js test suite setup and usage                |
