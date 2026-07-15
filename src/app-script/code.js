/**
 * Web App entry point. Receives the current sheet contents and club config,
 * scrapes the DSV website for current-year results, merges them with the existing
 * sheet data, and returns the updated leaderboard.
 *
 * Pipeline:
 *   1. Parse the JSON request body (clubId, raw 2D sheet data, entriesPerDiscipline,
 *      optional discipline filter).
 *   2. extractResultsFromSheet() — load existing sheet entries into each Discipline (newRecord=false).
 *   3. requestResults(filter)    — scrape DSV and add fresh results (newRecord=true).
 *      The optional filter restricts which disciplines are fetched so callers can split a
 *      full update into several runs that each stay under the Apps Script 6-minute limit;
 *      unfetched disciplines pass their sheet data through unchanged. Requests without a
 *      filter (older client scripts) still perform a full update.
 *   4. adjustResults()           — deduplicate per swimmer, sort ascending by time, cut to top N.
 *   5. Return { data, newResults, warnings } where data is the 2D array for setValues(),
 *      newResults contains log strings for entries that are new this run and made the top N,
 *      and warnings lists non-fatal problems (e.g. DSV rate limits) from this run.
 *
 * Error handling: Web Apps cannot set HTTP status codes and users cannot see this
 * account's execution log, so all failures travel in the JSON body. A thrown exception
 * is caught and returned as { error: { message, stack }, warnings } instead of letting
 * Apps Script render its HTML error page; the client must not write to the sheet when
 * `error` is present.
 *
 * @param {object} e - Apps Script POST event; e.postData.contents holds the JSON body.
 * @returns {TextOutput} JSON with fields `data` (Array[][]), `newResults` (string[]),
 *   and `warnings` (string[]) — or `error` ({message, stack}) and `warnings` on failure.
 */
function doPost(e) {
    let leaderboard;
    let payload;

    try {
        let requestData = JSON.parse(e.postData.contents);
        let clubId = requestData.clubId;
        let data = requestData.data;
        let entriesPerDiscipline = requestData.entriesPerDiscipline;
        let filter = requestData.filter;

        leaderboard = new Leaderboard(clubId, data, parseInt(entriesPerDiscipline));
        leaderboard.extractResultsFromSheet();
        leaderboard.requestResults(filter);
        leaderboard.adjustResults();

        payload = {
            data: leaderboard.results,
            newResults: leaderboard.newResults,
            warnings: leaderboard.warnings
        };
    } catch (error) {
        payload = {
            error: {
                message: error.message,
                stack: error.stack
            },
            warnings: leaderboard ? leaderboard.warnings : []
        };
    }

    return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
