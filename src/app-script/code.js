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
 *   5. Return { data, newResults } where data is the 2D array for setValues() and
 *      newResults contains log strings for entries that are new this run and made the top N.
 *
 * @param {object} e - Apps Script POST event; e.postData.contents holds the JSON body.
 * @returns {TextOutput} JSON with fields `data` (Array[][]) and `newResults` (string[]).
 */
function doPost(e) {
    let requestData = JSON.parse(e.postData.contents);
    let clubId = requestData.clubId;
    let data = requestData.data;
    let entriesPerDiscipline = requestData.entriesPerDiscipline;
    let filter = requestData.filter;

    let leaderboard = new Leaderboard(clubId, data, parseInt(entriesPerDiscipline));
    leaderboard.extractResultsFromSheet();
    leaderboard.requestResults(filter);
    leaderboard.adjustResults();
    let newData = leaderboard.results;
    let newResults = leaderboard.newResults;

    let payload = {
        data: newData,
        newResults: newResults
    };

    return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
