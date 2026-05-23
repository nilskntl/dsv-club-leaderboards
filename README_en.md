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
- Your club's **Club ID** on the DSV portal

### Where do I find my Club ID?

1. Open [dsvdaten.dsv.de](https://dsvdaten.dsv.de) and search for your club.
2. Click on the club name to open the club page.
3. The Club ID appears in the URL behind `ClubID=`:  
   `…/Club.aspx?ClubID=`**7985**

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

### Step 3 – Enter your Club ID

Find this line near the top of the script and replace the ID with your own:

```js
const clubId = 7985  // ← enter your club's ID here
```

You can also adjust the number of entries shown per discipline:

```js
const numberOfEntries = 5  // How many places to show per event
```

---

### Step 4 – Populate the sheet for the first time

1. In the script editor, select **`updateAllTime`** from the function dropdown and click the **Run button (▶)**.
2. On the first run, Google will ask for permissions – click **"Allow"**. The script only needs access to your own
   spreadsheet.
3. Once complete, a new sheet tab named **"All-Time"** will appear with the full discipline structure and this year's
   results.

To also create a **season leaderboard** for the current year, run **`updateSeason`** as well. This creates a tab named
after the current year (e.g. "2026") automatically.

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
3. Select **`updateAllTime`** as the function and **"Time-driven"** → **"Daily"** as the event type.
4. Click **"Save"**.

A second trigger for **`updateSeason`** can be set up the same way if needed.

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

| Setting                | Default | Description                           |
|------------------------|---------|---------------------------------------|
| `clubId`               | `7985`  | Your club's DSV Club ID               |
| `numberOfEntries`      | `5`     | Number of places shown per discipline |
| `formatSheetEveryTime` | `true`  | Reformat the sheet on every update    |

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

**I can't find my Club ID.**  
Search for your club at [dsvdaten.dsv.de](https://dsvdaten.dsv.de/Modules/Clubs/Search.aspx). The Club ID appears in the
URL of the club page after `ClubID=`.

**The sheet stays empty after running the script.**  
Check that the `clubId` you entered is correct. In the script editor under **Executions**, you can view the logs and
check for any error messages.

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
