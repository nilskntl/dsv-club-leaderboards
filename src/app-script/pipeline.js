/**
 * In-process leaderboard pipeline. Runs entirely inside the user's own Google account:
 * `sheet.js` fetches this file (together with the leaderboard/ and requests/ sources) from
 * GitHub, eval()s them, and calls runPipeline() directly — there is no longer a hosted Web App.
 *
 * Given the resolved club ID and the current sheet contents, it scrapes the DSV website for
 * current-year results, merges them with the existing sheet data, and returns the updated
 * leaderboard.
 *
 * Pipeline:
 *   1. Build a Leaderboard from clubId, the raw 2D sheet data, entriesPerDiscipline, and the
 *      optional requestConfig (requestDelayMs / rateLimitRetryDelayMs tuning).
 *   2. extractResultsFromSheet() — load existing sheet entries into each Discipline (newRecord=false).
 *   3. requestResults(filter)    — scrape DSV and add fresh results (newRecord=true).
 *      The optional filter restricts which disciplines are fetched so callers can split a
 *      full update into several runs that each stay under the Apps Script 6-minute limit;
 *      unfetched disciplines pass their sheet data through unchanged. A missing filter
 *      performs a full update.
 *   4. adjustResults()           — deduplicate per swimmer, sort ascending by time, cut to top N.
 *   5. Return { data, newResults, warnings } where data is the 2D array for setValues(),
 *      newResults contains log strings for entries that are new this run and made the top N,
 *      and warnings lists non-fatal problems (e.g. DSV rate limits) from this run.
 *
 * Error handling: a thrown exception is caught and returned as { error: { message, stack }, warnings }
 * so the caller (getNewSheetData) can log it and leave the sheet untouched — the pipeline never
 * writes to the sheet itself.
 *
 * @param {string|number} clubId - Internal DSV ClubID resolved from the configured club name.
 * @param {Array[]} data - Raw 2D sheet data from sheet.getDataRange().getValues().
 * @param {number} entriesPerDiscipline - Max results kept per discipline.
 * @param {{genders?: string[], strokes?: string[], lanes?: number[], distances?: (string|number)[]}} [filter]
 *   Optional discipline filter restricting which disciplines are fetched from DSV.
 * @param {{requestDelayMs?: string|number, rateLimitRetryDelayMs?: string|number}} [requestConfig]
 *   Optional DSV request pacing; blank/invalid values fall back to the RequestHandler defaults.
 * @returns {{data: Array[], newResults: string[], warnings: string[]}} on success, or
 *   {{error: {message: string, stack: string}, warnings: string[]}} on failure.
 */
function runPipeline(clubId, data, entriesPerDiscipline, filter, requestConfig) {
    let startTime = new Date().getTime();
    console.log('[runPipeline] ===== Leaderboard pipeline started =====');

    let leaderboard;
    let payload;

    try {
        requestConfig = requestConfig || {};

        console.log('[runPipeline] clubId=' + clubId + ', entriesPerDiscipline=' + entriesPerDiscipline);
        console.log('[runPipeline] Incoming sheet data: ' + (Array.isArray(data) ? data.length + ' row(s)' : 'none'));
        console.log('[runPipeline] Discipline filter: ' + (filter ? JSON.stringify(filter) : 'none (full update)'));
        console.log('[runPipeline] Request tuning: requestDelayMs=' + (requestConfig.requestDelayMs || 'default') +
            ', rateLimitRetryDelayMs=' + (requestConfig.rateLimitRetryDelayMs || 'default'));

        console.log('[runPipeline] Building leaderboard...');
        leaderboard = new Leaderboard(clubId, data, parseInt(entriesPerDiscipline), requestConfig);

        console.log('[runPipeline] Step 1/3: extracting existing results from sheet...');
        leaderboard.extractResultsFromSheet();

        console.log('[runPipeline] Step 2/3: requesting fresh results from DSV...');
        leaderboard.requestResults(filter);

        console.log('[runPipeline] Step 3/3: deduplicating, sorting and trimming results...');
        leaderboard.adjustResults();

        payload = {
            data: leaderboard.results,
            newResults: leaderboard.newResults,
            warnings: leaderboard.warnings
        };

        console.log('[runPipeline] Result ready: ' + payload.data.length + ' data row(s), ' +
            payload.newResults.length + ' new record(s), ' + payload.warnings.length + ' warning(s)');
    } catch (error) {
        console.error('[runPipeline] Pipeline failed: ' + error.message);
        if (error.stack) console.error('[runPipeline] Stack: ' + error.stack);
        payload = {
            error: {
                message: error.message,
                stack: error.stack
            },
            warnings: leaderboard ? leaderboard.warnings : []
        };
    }

    let durationMs = new Date().getTime() - startTime;
    console.log('[runPipeline] ===== Pipeline finished in ' + durationMs + 'ms =====');

    return payload;
}
