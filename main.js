const version = '1.0.5';

/**
 * Automatically creates and updates a swimming club leaderboard in Google Sheets
 * by fetching results from the German Swimming Federation (DSV) website.
 *
 * How it works:
 * Call updateAllTime() to refresh the all-time leaderboard, or updateSeason() for
 * the current season only. Both functions send the current sheet data and club config
 * to a hosted Web App, which scrapes the DSV website and returns the updated leaderboard.
 * To run on a schedule, set up a Google Apps Script trigger for either function.
 * See: https://developers.google.com/apps-script/guides/triggers/
 *
 * Setup:
 * 1. Create a new Google Sheet.
 * 2. In Google Sheets, go to Extensions → Apps Script, create a new script, and paste this code.
 * 3. Set `clubId` to your club's DSV ID.
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

const clubId = 7985 // Set this to your club's DSV ID
const numberOfEntries = 5 // Optional: number of entries to display per discipline
const formatSheetEveryTime = true // Optional: reformat the sheet on every update

/**
 * Updates the all-time leaderboard tab. Creates the "All-Time" sheet if it does not exist.
 * Loads the shared sheet.js logic at runtime from GitHub so that the Web App endpoint and
 * formatting code can be updated centrally without requiring users to change this script.
 */
function updateAllTime() {
    let nameOfSheet = 'All-Time';
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nameOfSheet);
    if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(nameOfSheet);
    if (sheet.getName() !== nameOfSheet) {
        Logger.log("Something went wrong. Sheet name doesn't match '" + nameOfSheet + "'");
    }
    let code = UrlFetchApp.fetch('https://raw.githubusercontent.com/nilskntl/dsv-club-leaderboards/master/src/app-script/sheet/sheet.js').getContentText();
    eval(code);
    getNewSheetData(version, sheet, FORMAT, formatSheetEveryTime);
}

/**
 * Updates the current season's leaderboard tab. The sheet is named after the current year
 * (e.g. "2026") and is created automatically if it does not exist yet.
 * Loads the shared sheet.js logic at runtime from GitHub — see updateAllTime() for details.
 */
function updateSeason() {
    let year = new Date().getFullYear();
    let nameOfSheet = year.toString();
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nameOfSheet);
    if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(nameOfSheet);
    if (sheet.getName() !== nameOfSheet) {
        Logger.log("Something went wrong. Sheet name doesn't match '" + nameOfSheet + "'");
    }
    let code = UrlFetchApp.fetch('https://raw.githubusercontent.com/nilskntl/dsv-club-leaderboards/master/src/app-script/sheet/sheet.js').getContentText();
    eval(code);
    getNewSheetData(version, sheet, FORMAT, formatSheetEveryTime);
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
