/**
 * Appends new record strings to column P (col 16), starting after the last non-empty cell.
 * Column P is excluded from the data range cleared by _writeNewDataToSheet, so entries
 * accumulate permanently across runs. P1 is reserved for the "Neue Ergebnisse" header
 * written by formatSheet(), so appending always starts from row 2 at the earliest.
 *
 * @param {string[]} results - Formatted record strings to append.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 */
function _writeNewRecordsToSheet(results, sheet) {
    console.log('[Sheet] _writeNewRecordsToSheet: appending ' + results.length + ' new record(s) to column P...');
    if (results.length === 0) {
        console.log('[Sheet] _writeNewRecordsToSheet: no new records this run — nothing to append.');
        return;
    }
    for (let i = 0; i < results.length; i++) {
        console.log('[Sheet] _writeNewRecordsToSheet: new record ' + (i + 1) + '/' + results.length + ': ' + results[i]);
    }

    let column = 16; // column P
    let lastRow = sheet.getLastRow();
    let values = sheet.getRange(2, column, lastRow, 1).getValues();

    let row = lastRow + 1;
    for (let i = 0; i < values.length; i++) {
        if (values[i][0] === '') {
            row = i + 2;
            break;
        }
    }
    console.log('[Sheet] _writeNewRecordsToSheet: first empty cell found at row ' + row + ' — appending from there.');

    for (let i = 0; i < results.length; i++) {
        sheet.getRange(row + i, column).setValue(results[i]);
    }
    console.log('[Sheet] _writeNewRecordsToSheet: wrote records to rows ' + row + '–' + (row + results.length - 1) + '.');
}

/**
 * Writes the leaderboard data array to the sheet starting at row 3, then clears any
 * stale rows that remain below the new data block. Rows 1–2 (season header and reserved
 * row set by formatSheet()) are never touched. Column P (new records log) is outside
 * the write range and is also preserved.
 *
 * @param {Array[]} data - 2D array from Sheet.getSheetData().
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 */
function _writeNewDataToSheet(data, sheet) {
    console.log('[Sheet] _writeNewDataToSheet: writing ' + data.length + ' row(s) × ' +
        (data[0] ? data[0].length : 0) + ' column(s) starting at row 3...');

    let range = sheet.getRange(3, 1, data.length, data[0].length);

    range.clearContent();
    range.setValues(data);
    console.log('[Sheet] _writeNewDataToSheet: data block written (rows 3–' + (data.length + 2) + ').');

    // Clear stale rows below the new data block (data starts at row 3, so last data row is data.length + 2)
    let lastRow = sheet.getLastRow();
    if (lastRow > data.length + 2) {
        let staleRows = lastRow - data.length - 2;
        console.log('[Sheet] _writeNewDataToSheet: clearing ' + staleRows + ' stale row(s) below the data block (rows ' +
            (data.length + 3) + '–' + lastRow + ').');
        let rangeToDelete = sheet.getRange(data.length + 3, 1, staleRows, data[0].length);
        rangeToDelete.clearContent();
    } else {
        console.log('[Sheet] _writeNewDataToSheet: no stale rows to clear below the data block.');
    }
}

/**
 * @param {Array[]} data - 2D array from Sheet.getSheetData().
 * @param {string[]} results - New record strings from Leaderboard.newResults.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 */
function writeDataToSheet(data, results, sheet) {
    console.log('[Sheet] writeDataToSheet: writing data + new records to sheet "' + sheet.getName() + '"...');

    _writeNewDataToSheet(data, sheet);
    _writeNewRecordsToSheet(results, sheet);

    console.log('[Sheet] writeDataToSheet: data written successfully.');
}

/**
 * Applies colours, row heights, column widths, and cell merges to match the fixed
 * 14-column leaderboard structure. Safe to call repeatedly — clearFormats() runs first
 * so existing formatting is fully replaced rather than layered.
 *
 * The `strokes` array encodes [startRow, disciplineCount] for each of the five stroke groups.
 * Start rows are derived from numberOfEntries because each distance/course combination
 * occupies numberOfEntries + 1 rows (1 distance header row + N result rows).
 *
 * Missing keys in `format` are filled in from DEFAULT_FORMAT at every nesting level,
 * so users can override only specific values without providing the entire format object.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} numberOfEntries - Entries per discipline; drives all row position calculations.
 * @param {object} [format] - Partial or full format override; falls back to DEFAULT_FORMAT.
 */
function formatSheet(sheet, numberOfEntries, format) {
    console.log('[formatSheet] Formatting sheet "' + sheet.getName() + '" with ' + numberOfEntries + ' entries per discipline...');

    if (!format) {
        console.log('[formatSheet] No format supplied — using DEFAULT_FORMAT.');
        format = DEFAULT_FORMAT;
    } else {
        console.log('[formatSheet] Custom format supplied — filling missing keys from DEFAULT_FORMAT.');
    }

    for (let key in DEFAULT_FORMAT) {
        if (!format[key]) format[key] = DEFAULT_FORMAT[key];
        if (typeof DEFAULT_FORMAT[key] === 'object') {
            for (let subKey in DEFAULT_FORMAT[key]) {
                if (!format[key][subKey]) format[key][subKey] = DEFAULT_FORMAT[key][subKey];
                if (typeof DEFAULT_FORMAT[key][subKey] === 'object') {
                    for (let subSubKey in DEFAULT_FORMAT[key][subKey]) {
                        if (!format[key][subKey][subSubKey]) format[key][subKey][subSubKey] = DEFAULT_FORMAT[key][subKey][subSubKey];
                    }
                }
            }
        }
    }

    console.log('[formatSheet] Clearing existing formats before re-applying...');
    sheet.clearFormats();

    sheet.getRange('A:P').setHorizontalAlignment(format.Allgemein.Textausrichtung).setVerticalAlignment(format.Allgemein["Vertikale Ausrichtung"]).setNumberFormat('@');
    sheet.getRange("P:P").setHorizontalAlignment(format['Neue Ergebnisse'].Textausrichtung).setVerticalAlignment(format.Allgemein["Vertikale Ausrichtung"]).setNumberFormat('@').setFontWeight(format['Neue Ergebnisse'].Textgewicht).setBackground(format['Neue Ergebnisse'].Hintergrundfarbe).setFontColor(format['Neue Ergebnisse'].Textfarbe);

    // Each entry [startRow, disciplineCount] for each of the five stroke groups.
    // Start rows are calculated based on numberOfEntries: each distance/course pair
    // occupies numberOfEntries + 1 rows, and there are fixed offsets between stroke groups.
    let strokes = [[3, 12], [((numberOfEntries + 1) * 12) + 7, 6], [((numberOfEntries + 1) * 18) + 11, 6], [((numberOfEntries + 1) * 24) + 15, 6], [((numberOfEntries + 1) * 30) + 19, 5]];
    console.log('[formatSheet] Stroke group start rows (derived from numberOfEntries): ' +
        strokes.map(s => s[0]).join(', '));

    sheet.getRange(1, 1, 1, 14).merge().setBackground(format.Farben.Hintergrundfarben.Saison).setFontColor(format.Farben.Textfarben.Saison).setFontWeight('bold');
    sheet.setRowHeight(1, format.Zeilen.Hoehen.Saison);
    let season = sheet.getName()
    sheet.getRange(1, 1).setValue(season);
    console.log('[formatSheet] Season header set to "' + season + '".');

    console.log('[formatSheet] Applying colours, merges and row heights for ' + strokes.length + ' stroke group(s)...');
    strokes.forEach(function (stroke) {
        sheet.getRange(stroke[0], 1, 1, 14).merge().setBackground(format.Farben.Hintergrundfarben.Lage).setFontColor(format.Farben.Textfarben.Lage).setFontWeight('bold');
        sheet.setRowHeight(stroke[0], format.Zeilen.Hoehen.Lage);
        sheet.getRange(stroke[0] + 1, 1, 1, 7).merge().setBackground(format.Farben.Hintergrundfarben.Maennlich.Kopfzeile).setFontColor(format.Farben.Textfarben.Maennlich.Kopfzeile).setFontWeight('bold');
        sheet.getRange(stroke[0] + 1, 8, 1, 7).merge().setBackground(format.Farben.Hintergrundfarben.Weiblich.Kopfzeile).setFontColor(format.Farben.Textfarben.Weiblich.Kopfzeile).setFontWeight('bold');
        sheet.setRowHeight(stroke[0] + 1, format.Zeilen.Hoehen.Geschlecht);
        sheet.getRange(stroke[0] + 2, 1, 1, 14).setBackground(format.Farben.Hintergrundfarben.Kopfzeile).setFontColor(format.Farben.Textfarben.Kopfzeile).setFontWeight('bold');
        sheet.setRowHeight(stroke[0] + 2, format.Zeilen.Hoehen.Kopfzeile);

        for (let i = 0; i < stroke[1]; i++) {
            sheet.getRange(stroke[0] + 3 + i * (numberOfEntries + 1), 1, 1, 7).merge().setBackground(format.Farben.Hintergrundfarben.Streckenangabe.Maennlich).setFontColor(format.Farben.Textfarben.Streckenangabe.Maennlich).setFontWeight('bold');
            sheet.getRange(stroke[0] + 3 + i * (numberOfEntries + 1), 8, 1, 7).merge().setBackground(format.Farben.Hintergrundfarben.Streckenangabe.Weiblich).setFontColor(format.Farben.Textfarben.Streckenangabe.Weiblich).setFontWeight('bold');
            sheet.setRowHeight(stroke[0] + 3 + i * (numberOfEntries + 1), format.Zeilen.Hoehen.Streckenangabe);
            for (let j = 0; j < numberOfEntries; j++) {
                if (j % 2 === 0) {
                    sheet.getRange(stroke[0] + 4 + i * (numberOfEntries + 1) + j, 1, 1, 7).setBackground(format.Farben.Hintergrundfarben.Maennlich.Gerade).setFontColor(format.Farben.Textfarben.Maennlich.Gerade);
                    sheet.getRange(stroke[0] + 4 + i * (numberOfEntries + 1) + j, 8, 1, 7).setBackground(format.Farben.Hintergrundfarben.Weiblich.Gerade).setFontColor(format.Farben.Textfarben.Weiblich.Gerade);
                } else {
                    sheet.getRange(stroke[0] + 4 + i * (numberOfEntries + 1) + j, 1, 1, 7).setBackground(format.Farben.Hintergrundfarben.Maennlich.Ungerade).setFontColor(format.Farben.Textfarben.Maennlich.Ungerade);
                    sheet.getRange(stroke[0] + 4 + i * (numberOfEntries + 1) + j, 8, 1, 7).setBackground(format.Farben.Hintergrundfarben.Weiblich.Ungerade).setFontColor(format.Farben.Textfarben.Weiblich.Ungerade);
                }
            }
        }
    });

    sheet.setColumnWidth(1, format.Spalten.Breiten["A/H"]);
    sheet.setColumnWidth(8, format.Spalten.Breiten["A/H"]);
    sheet.setColumnWidth(2, format.Spalten.Breiten["B/I"]);
    sheet.setColumnWidth(9, format.Spalten.Breiten["B/I"]);
    sheet.setColumnWidth(3, format.Spalten.Breiten["C/J"]);
    sheet.setColumnWidth(10, format.Spalten.Breiten["C/J"]);
    sheet.setColumnWidth(4, format.Spalten.Breiten["D/K"]);
    sheet.setColumnWidth(11, format.Spalten.Breiten["D/K"]);
    sheet.setColumnWidth(5, format.Spalten.Breiten["E/L"]);
    sheet.setColumnWidth(12, format.Spalten.Breiten["E/L"]);
    sheet.setColumnWidth(6, format.Spalten.Breiten["F/M"]);
    sheet.setColumnWidth(13, format.Spalten.Breiten["F/M"]);
    sheet.setColumnWidth(7, format.Spalten.Breiten["G/N"]);
    sheet.setColumnWidth(14, format.Spalten.Breiten["G/N"]);

    sheet.setColumnWidth(16, format.Spalten.Breiten['Neue Ergebnisse']);
    sheet.getRange(1, 16).setFontColor(format['Neue Ergebnisse'].Textfarbe).setBackground(format['Neue Ergebnisse'].Hintergrundfarbe);
    sheet.getRange(1, 16).setValue(format['Neue Ergebnisse'].Text);

    console.log('[formatSheet] Formatting complete for sheet "' + sheet.getName() + '".');
}

/**
 * Resolves a human-readable DSV club name to the internal ClubID that every data request uses.
 *
 * The DSV site uses two unrelated identifiers: the public "VereinsID" printed on the club page
 * (e.g. 6544) and an internal, site-wide sequential ClubID that appears only in the Club.aspx
 * URL (e.g. 7985). The scraper needs the internal ClubID, but users only know their club by
 * name, so this resolves the name via the DSV club search (Search.aspx) before any scraping.
 *
 * The search behaves in two ways, both handled here:
 *   Case 1 — exactly one match: the site answers with a 302 redirect straight to
 *            Club.aspx?ClubID=<internal>. We read the ClubID from the Location header.
 *   Case 2 — several matches: an HTML table is returned; we take the first row. Its cells are
 *            [Verein, Region, VereinsID, Internet] and the link carries the internal ClubID.
 *   Case 3 — no match: an empty table. We return null so the caller can abort with guidance.
 *
 * @param {string} clubName - Club name as listed by the DSV.
 * @returns {{clubId: string, name: string, vereinsId: string, matches: number}|null}
 *   Resolved club, or null when nothing matched.
 */
function resolveClubId(clubName) {
    console.log('[resolveClubId] Resolving club name "' + clubName + '" via DSV club search...');
    let searchUrl = 'https://dsvdaten.dsv.de/Modules/Clubs/Search.aspx';

    let extract = function (html, begin, end) {
        let start = html.indexOf(begin);
        if (start === -1) return '';
        let stop = html.indexOf(end, start + begin.length);
        if (stop === -1) return '';
        return html.substring(start + begin.length, stop);
    };

    // 1. GET the search page for the ASP.NET WebForms session tokens.
    console.log('[resolveClubId] Step 1: GET search page for session tokens...');
    let searchPage = UrlFetchApp.fetch(searchUrl, {
        method: 'get',
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://dsvdaten.dsv.de/'
        },
        muteHttpExceptions: true
    }).getContentText();

    // 2. POST the search form. The body is manually URL-encoded (matching what a browser sends)
    //    and followRedirects is disabled so a single-match 302 exposes the ClubID in Location.
    let fields = {
        '__EVENTTARGET': '',
        '__EVENTARGUMENT': '',
        '__LASTFOCUS': '',
        '__VIEWSTATE': extract(searchPage, '__VIEWSTATE" value="', '" />'),
        '__VIEWSTATEGENERATOR': extract(searchPage, '__VIEWSTATEGENERATOR" value="', '" />'),
        '__EVENTVALIDATION': extract(searchPage, '__EVENTVALIDATION" value="', '" />'),
        'ctl00$ContentSection$_clubnameTextBox': clubName,
        'ctl00$ContentSection$_cityTextBox': '',
        'ctl00$ContentSection$_zipTextBox': '',
        'ctl00$ContentSection$_regionDropDownList': '0',
        'ctl00$ContentSection$_updateButton': 'Suche'
    };
    let body = Object.keys(fields)
        .map(function (key) { return encodeURIComponent(key) + '=' + encodeURIComponent(fields[key]); })
        .join('&');

    console.log('[resolveClubId] Step 2: POST search form for "' + clubName + '"...');
    let response = UrlFetchApp.fetch(searchUrl, {
        method: 'post',
        payload: body,
        contentType: 'application/x-www-form-urlencoded',
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': searchUrl
        },
        followRedirects: false,
        muteHttpExceptions: true
    });
    console.log('[resolveClubId] Search responded with HTTP ' + response.getResponseCode() + '.');

    // Case 1: exactly one match -> 302 redirect to the club page.
    if (response.getResponseCode() === 302) {
        console.log('[resolveClubId] Case 1: single match (302 redirect) — reading ClubID from Location header.');
        let headers = response.getHeaders();
        let location = headers['Location'] || headers['location'] || '';
        let match = location.match(/ClubID=(\d+)/);
        if (match) {
            console.log('[resolveClubId] Extracted ClubID ' + match[1] + ' — loading club details...');
            let details = _clubDetails(match[1], searchUrl, extract);
            return { clubId: match[1], name: details.name || clubName, vereinsId: details.vereinsId, matches: 1 };
        }
        console.warn('[resolveClubId] 302 redirect had no ClubID in its Location header — falling back to HTML parsing.');
    }

    // Case 2/3: HTML result list. Collect every row that links to a club.
    console.log('[resolveClubId] Case 2/3: parsing HTML result list for club rows...');
    let html = response.getContentText();
    let strip = function (s) { return s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(); };
    let rows = [];
    let rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(html)) !== null) {
        let rowHtml = rowMatch[1];
        let idMatch = rowHtml.match(/ClubID=(\d+)/);
        if (!idMatch) continue; // header row / non-club row
        let cells = [];
        let cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
        let cellMatch;
        while ((cellMatch = cellRegex.exec(rowHtml)) !== null) cells.push(strip(cellMatch[1]));
        rows.push({ clubId: idMatch[1], name: cells[0] || clubName, vereinsId: cells[2] || '' });
    }

    if (rows.length === 0) {
        console.warn('[resolveClubId] Case 3: no club rows found for "' + clubName + '" — returning null.');
        return null; // Case 3: no match
    }

    let first = rows[0];
    first.matches = rows.length;
    console.log('[resolveClubId] Found ' + rows.length + ' matching row(s). Using first: "' + first.name +
        '" (ClubID ' + first.clubId + ', VereinsID ' + (first.vereinsId || 'n/a') + ').');
    return first;
}

/**
 * Loads a club page and reads its display name and public VereinsID. Used only for the
 * single-match (302) case, where the search redirect gives the internal ClubID but no
 * name/VereinsID for the confirmation log.
 *
 * @param {string} clubId - Internal ClubID.
 * @param {string} referer - Referer to send (the search page).
 * @param {function(string, string, string): string} extract - Delimiter-based substring helper.
 * @returns {{name: string, vereinsId: string}}
 */
function _clubDetails(clubId, referer, extract) {
    console.log('[_clubDetails] Loading club page for ClubID ' + clubId + ' to read name and VereinsID...');
    let strip = function (s) { return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); };
    let html = UrlFetchApp.fetch('https://dsvdaten.dsv.de/Modules/Clubs/Club.aspx?ClubID=' + clubId, {
        method: 'get',
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'sec-fetch-site': 'same-origin',
            'Referer': referer
        },
        muteHttpExceptions: true
    }).getContentText();
    let details = {
        name: strip(extract(html, 'headerLabel">', '</span>')),
        vereinsId: strip(extract(html, 'clubidLabel">', '</span>'))
    };
    console.log('[_clubDetails] ClubID ' + clubId + ' → name="' + details.name + '", VereinsID=' + (details.vereinsId || 'n/a') + '.');
    return details;
}

/**
 * Entry point for a single sheet tab update. Runs the whole update inside the user's own
 * Google account: after resolving the club name to a ClubID, it fetches the pipeline sources
 * (leaderboard/, requests/, pipeline.js) from GitHub, eval()s them, and calls runPipeline()
 * directly to scrape the DSV website and produce the updated leaderboard data. There is no
 * hosted Web App — everything executes under the user's credentials.
 *
 * The pipeline sources are fetched from GitHub (not bundled into main.js) so the scraping and
 * merging logic can be updated centrally without users changing their local script.
 *
 * Error handling: runPipeline() reports failures inside its return value. A result with an
 * `error` field means the run failed — it is logged and the sheet is left untouched. A
 * `warnings` field lists non-fatal problems (e.g. the DSV rate limiter aborted the run
 * partway); warnings are logged to this script's execution log (Apps Script → Executions) —
 * column P stays a pure record history.
 *
 * @param {string} version - Current script version; compared against GitHub to warn about outdated scripts.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The tab to update.
 * @param {object} format - Format config passed through to formatSheet().
 * @param {boolean} formatSheetEveryTime - If true, reformats the sheet after every data update.
 * @param {{genders?: string[], strokes?: string[], lanes?: number[], distances?: (string|number)[]}} [filter] -
 *   Optional discipline filter forwarded to the Web App. Restricts which disciplines are
 *   fetched from DSV so a full update can be split across several trigger runs, each staying
 *   under the Apps Script 6-minute limit. Unfetched disciplines keep their current sheet data.
 */
function getNewSheetData(version, sheet, format, formatSheetEveryTime, filter) {
    let startTime = new Date().getTime();
    console.log('[getNewSheetData] ===== Update started for sheet "' + sheet.getName() + '" =====');
    console.log('[getNewSheetData] Local script version: ' + version);
    console.log('[getNewSheetData] formatSheetEveryTime=' + formatSheetEveryTime +
        ', filter=' + (filter ? JSON.stringify(filter) : 'none (full update)'));

    console.log('[getNewSheetData] Checking for a newer script version on GitHub...');
    let newestVersion = null;
    try {
        let response = UrlFetchApp.fetch('https://raw.githubusercontent.com/nilskntl/dsv-club-leaderboards/refs/heads/master/version.txt', {muteHttpExceptions: true});
        if (response.getResponseCode() === 200) {
            newestVersion = response.getContentText().trim();
        }
    } catch (e) {
        // Network error, timeout, etc. — treated the same as a missing file below.
    }

    if (newestVersion === null) {
        console.warn('--------------------------------------------------');
        console.warn('⚠️ Could not determine the latest version (version file not found or unreachable).');
        console.warn('This can happen if the file was moved in a newer release. Consider copying the latest main.js.');
        console.warn('Find the latest script here: https://github.com/nilskntl/dsv-club-leaderboards');
        console.warn('--------------------------------------------------');
    } else if (newestVersion !== version) {
        console.warn('--------------------------------------------------');
        console.warn('A new version is available. Please update the script.');
        console.warn('Latest version: ' + newestVersion + ' (you have: ' + version + ')');
        console.warn('Find the latest script here: https://github.com/nilskntl/dsv-club-leaderboards')
        console.warn('--------------------------------------------------');
    } else {
        console.log('[getNewSheetData] Script is up to date (version ' + version + ').');
    }

    // Resolve the configured club name to the internal ClubID the Web App scrapes with.
    // Everything past this point stays ID-based.
    console.log('[getNewSheetData] Resolving club name "' + clubName + '" to a DSV ClubID...');
    let club = resolveClubId(clubName);
    if (!club) {
        console.error('--------------------------------------------------');
        console.error('❌ No club found for "' + clubName + '". Update aborted.');
        console.error('Please set clubName to the exact club name as listed by the DSV and try again.');
        console.error('Look up the exact name here: https://www.dsv.de/de/leistungs--und-wettkampfsport/schwimmen/wettkampf-regional/vereine/');
        console.error('--------------------------------------------------');
        return;
    }
    if (club.matches > 1) {
        console.warn('[getNewSheetData] Found club "' + club.name + '" — DSV VereinsID: ' + club.vereinsId + ', ClubID (used for requests): ' + club.clubId +
            ' (first of ' + club.matches + ' matches — if this is not your club, set clubName to a more exact name)');
    } else {
        console.log('[getNewSheetData] Found club "' + club.name + '" — DSV VereinsID: ' + (club.vereinsId || 'n/a') + ', ClubID (used for requests): ' + club.clubId);
    }

    let sheetData = sheet.getDataRange().getValues();
    console.log('[getNewSheetData] Read ' + sheetData.length + ' row(s) from the sheet.');

    let requestConfig = {
        requestDelayMs: (typeof requestDelayMs !== 'undefined') ? requestDelayMs : '',
        rateLimitRetryDelayMs: (typeof rateLimitRetryDelayMs !== 'undefined') ? rateLimitRetryDelayMs : ''
    };

    // Load the pipeline sources from GitHub and run everything in this account. Each file is a
    // plain script; eval() in this (non-strict) scope makes runPipeline() available in the
    // caller scope. The Sheet class is fetched here too (sheet/sheet-model.js) rather than being
    // defined in this file, so it shares an eval scope with the domain classes it instantiates
    // (Result, Person, Time, CalendarDate) — a nested eval's class declarations are not visible
    // to the outer sheet.js scope.
    console.log('[getNewSheetData] Fetching the pipeline sources from GitHub...');
    let scriptBase = 'https://raw.githubusercontent.com/nilskntl/dsv-club-leaderboards/refs/tags/1.2.1/src/app-script/';
    let scriptFiles = [
        'sheet/sheet-model.js',
        'leaderboard/calendar-date.js',
        'leaderboard/time.js',
        'leaderboard/person.js',
        'leaderboard/result.js',
        'leaderboard/discipline.js',
        'leaderboard/leaderboard.js',
        'requests/request-handler.js',
        'pipeline.js'
    ];
    let code = scriptFiles
        .map(file => UrlFetchApp.fetch(scriptBase + file).getContentText())
        .join('\n\n');
    eval(code);

    console.log('[getNewSheetData] Running the leaderboard pipeline for season "' + sheet.getName() + '"...');
    let runStart = new Date().getTime();
    let result = runPipeline(club.clubId, sheetData, numberOfEntries, filter, requestConfig);
    console.log('[getNewSheetData] Pipeline finished in ' + (new Date().getTime() - runStart) + 'ms.');

    let warnings = (result.warnings || []).map(warning => new Date().toLocaleString() + ': ⚠️ ' + warning);
    if (warnings.length > 0) {
        console.warn('[getNewSheetData] Pipeline reported ' + warnings.length + ' warning(s):');
        for (let warning of warnings) {
            console.warn(warning);
        }
    } else {
        console.log('[getNewSheetData] Pipeline reported no warnings.');
    }

    if (result.error) {
        console.error('[getNewSheetData] The pipeline reported an error — the sheet was not changed.');
        console.error('Error: ' + result.error.message);
        if (result.error.stack) console.error('Stack: ' + result.error.stack);
        return;
    }

    console.log('[getNewSheetData] Data updated successfully — received ' +
        (result.data ? result.data.length : 0) + ' data row(s) and ' +
        (result.newResults ? result.newResults.length : 0) + ' new record(s).');

    writeDataToSheet(result.data, result.newResults, sheet);
    if (formatSheetEveryTime) {
        console.log('[getNewSheetData] formatSheetEveryTime is enabled — reformatting sheet...');
        formatSheet(sheet, numberOfEntries, format);
    }

    console.log('[getNewSheetData] ===== Leaderboard updated successfully in ' +
        (new Date().getTime() - startTime) + 'ms =====');
}

let DEFAULT_FORMAT = {
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
