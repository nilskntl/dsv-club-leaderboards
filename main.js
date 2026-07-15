const version = '1.1.0';

/**
 * Automatically creates and updates a swimming club leaderboard in Google Sheets
 * by fetching results from the German Swimming Federation (DSV) website.
 *
 * How it works:
 * The update is split by gender so each run stays under the Apps Script 6-minute
 * execution limit: call updateAllTimeMale() and updateAllTimeFemale() to refresh the
 * all-time leaderboard, or updateSeasonMale() and updateSeasonFemale() for the current
 * season only. Each function sends the current sheet data and club config to a hosted
 * Web App, which scrapes the DSV website for the requested gender and returns the
 * updated leaderboard; the other gender's entries pass through unchanged.
 * To run on a schedule, set up one Google Apps Script time trigger per function.
 * IMPORTANT: schedule the male and female triggers at different times (e.g. one hour
 * apart) — overlapping runs read and write the whole sheet and would overwrite each
 * other's results.
 *
 * See: https://developers.google.com/apps-script/guides/triggers/
 *
 * Setup:
 * 1. Create a new Google Sheet.
 * 2. In Google Sheets, go to Extensions → Apps Script, create a new script, and paste this code.
 * 3. Set `clubName` to your club's name as listed by the DSV (looked up automatically to the
 *    internal club ID before each update). If several clubs match, the first is used and logged.
 * 4. Optional: adjust `numberOfEntries` (default: 5 entries per discipline).
 * 5. Optional: customise colours and sizes in the FORMAT object below.
 * 6. Optional: set `formatSheetEveryTime` to true to reformat the sheet on every update.
 *
 * Important notes:
 * Because the DSV only exposes results for the current season, the all-time leaderboard
 * must be seeded manually after the first run. Run updateAllTime() once to initialise the
 * sheet structure, then fill in historical results by hand.
 * Do not change the sheet structure — the script relies on a fixed 14-column layout to
 * identify and update result rows. The formatting can be changed freely at any time.
 *
 * If an error occurs:
 * Try running the script again. If the error persists, check the configuration and verify
 * that the sheet structure has not been altered. Check whether a newer version is available.
 * Lost data can be recovered via Google Sheets → File → Version history.
 */

const clubName = 'Bielefelder Wasserfreunde' // Set this to your club's name as listed by the DSV. Look it up at: https://www.dsv.de/de/leistungs--und-wettkampfsport/schwimmen/wettkampf-regional/vereine/
const numberOfEntries = 5 // Optional: number of entries to display per discipline
const formatSheetEveryTime = true // Optional: reformat the sheet on every update

// Optional: fine-tune the DSV request pacing to stay under the rate limit.
// Leave empty ('') to use the defaults. requestDelayMs is the pause between requests
// (default 1500), rateLimitRetryDelayMs is the pause before retrying after a rate limit
// (HTTP 429) (default 12000). Increase them if you keep hitting the DSV rate limit.
const requestDelayMs = '' // Optional: ms between DSV requests (empty = default 1500)
const rateLimitRetryDelayMs = '' // Optional: ms to wait before retrying after a 429 (empty = default 12000)

/**
 * Updates the male half of the all-time leaderboard. Set up a time trigger for this
 * function, offset from the updateAllTimeFemale() trigger.
 */
function updateAllTimeMale() {
    _updateSheet('All-Time', {genders: ['Männlich']});
}

/**
 * Updates the female half of the all-time leaderboard. Set up a time trigger for this
 * function, offset from the updateAllTimeMale() trigger.
 */
function updateAllTimeFemale() {
    _updateSheet('All-Time', {genders: ['Weiblich']});
}

/**
 * Updates the male half of the current season's leaderboard. Set up a time trigger for
 * this function, offset from the updateSeasonFemale() trigger.
 */
function updateSeasonMale() {
    _updateSheet(new Date().getFullYear().toString(), {genders: ['Männlich']});
}

/**
 * Updates the female half of the current season's leaderboard. Set up a time trigger for
 * this function, offset from the updateSeasonMale() trigger.
 */
function updateSeasonFemale() {
    _updateSheet(new Date().getFullYear().toString(), {genders: ['Weiblich']});
}

/**
 * Updates one leaderboard tab, creating it if it does not exist. Loads the shared sheet.js
 * logic at runtime from GitHub so that the Web App endpoint and formatting code can be
 * updated centrally without requiring users to change this script.
 *
 * @param {string} nameOfSheet - Tab to update: 'All-Time' or a season year like '2026'.
 * @param {{genders?: string[], strokes?: string[], lanes?: number[], distances?: (string|number)[]}} [filter] -
 *   Restricts which disciplines are fetched from DSV; disciplines outside the filter keep
 *   their current sheet entries. Omit to fetch everything.
 */
function _updateSheet(nameOfSheet, filter) {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nameOfSheet);
    if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(nameOfSheet);
    if (sheet.getName() !== nameOfSheet) {
        console.log("Something went wrong. Sheet name doesn't match '" + nameOfSheet + "'");
    }
    let code = UrlFetchApp.fetch('https://raw.githubusercontent.com/nilskntl/dsv-club-leaderboards/refs/heads/master/src/app-script/sheet/sheet.js').getContentText();
    eval(code);
    getNewSheetData(version, sheet, FORMAT, formatSheetEveryTime, filter);
}

const FORMAT = {
    'Allgemein': {
        'Textausrichtung': 'center',
        'Vertikale Ausrichtung': 'middle',
    },
    'Farben': {
        'Hintergrundfarben': {
            'Saison': '#252626',
            'Lage': '#252626',
            'Streckenangabe': {
                'Weiblich': '#652a5f',
                'Maennlich': '#25476a'
            },
            'Kopfzeile': '#252626',
            'Maennlich': {
                'Kopfzeile': '#25476a',
                'Gerade': '#d1e5ef',
                'Ungerade': '#bbd5ea'
            },
            'Weiblich': {
                'Kopfzeile': '#652a5f',
                'Gerade': '#e6dfe5',
                'Ungerade': '#dacbdd'
            }
        },
        'Textfarben': {
            'Saison': '#ffffff',
            'Lage': '#ffffff',
            'Streckenangabe': {
                'Weiblich': '#ffffff',
                'Maennlich': '#ffffff'
            },
            'Kopfzeile': '#ffffff',
            'Maennlich': {
                'Kopfzeile': '#ffffff',
                'Gerade': '#2E2727',
                'Ungerade': '#2E2727'
            },
            'Weiblich': {
                'Kopfzeile': '#ffffff',
                'Gerade': '#2E2727',
                'Ungerade': '#2E2727'
            }
        }
    },
    'Spalten': {
        'Breiten': {
            'A/H': 75,
            'B/I': 50,
            'C/J': 200,
            'D/K': 100,
            'E/L': 100,
            'F/M': 150,
            'G/N': 100,
            'Neue Ergebnisse': 800
        }
    },
    'Zeilen': {
        'Hoehen': {
            'Saison': 34,
            'Lage': 34,
            'Geschlecht': 26,
            'Kopfzeile': 26,
            'Streckenangabe': 26,
            'Ergebnis': 21,
        }
    },
    'Neue Ergebnisse': {
        'Textfarbe': '#2E2727',
        'Hintergrundfarbe': '#ffffff',
        'Textgewicht': 'bold',
        'Textausrichtung': 'left',
        'Text': 'Neue Ergebnisse'
    }
}
