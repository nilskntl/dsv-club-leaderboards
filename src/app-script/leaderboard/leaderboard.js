class Leaderboard {
    /**
     * Orchestrates the full leaderboard update pipeline for a single sheet tab.
     *
     * Intended call order:
     *   1. extractResultsFromSheet() — loads existing results from the raw sheet data
     *   2. requestResults()          — fetches current-year results from the DSV website
     *   3. adjustResults()           — deduplicates, sorts, and trims each discipline
     *
     * After these three steps, `results` and `newResults` reflect the updated state
     * and can be written back to the sheet.
     *
     * @param {string|number} clubId - DSV club ID used to query the DSV website.
     * @param {Array[]} data - Raw 2D array from the Google Sheet (sheet.getDataRange().getValues()).
     * @param {number} [entriesPerDiscipline=10] - How many top results to keep per discipline.
     * @param {{requestDelayMs?: string|number, rateLimitRetryDelayMs?: string|number}} [requestConfig]
     *   Optional DSV request tuning forwarded to the RequestHandler (pause between POSTs and
     *   the 429 retry pause). Blank or invalid values fall back to the handler's defaults.
     */
    constructor(clubId, data, entriesPerDiscipline = 10, requestConfig = {}) {
        this._clubId = clubId.toString();
        this._oldData = data;
        this._disciplines = [];
        this._requestHandler = new RequestHandler(this, requestConfig);
        this._sheet = new Sheet(this);
        this._entriesPerDiscipline = entriesPerDiscipline;
        console.log('[Leaderboard] Initialising for clubId=' + this._clubId + ', entriesPerDiscipline=' +
            this._entriesPerDiscipline + ', sheet rows=' + (Array.isArray(data) ? data.length : 0));
        this._createDisciplines();
        console.log('[Leaderboard] Created ' + this._disciplines.length + ' discipline(s).');
    }

    get clubId() {
        return this._clubId;
    }

    get disciplines() {
        return this._disciplines;
    }

    get entriesPerDiscipline() {
        return this._entriesPerDiscipline;
    }

    /**
     * Returns the full leaderboard as a 2D array ready to be written to the sheet via setValues().
     * Delegates to Sheet.getSheetData() which encodes the fixed 14-column layout.
     */
    get results() {
        return this._sheet.getSheetData();
    }

    /**
     * Returns formatted log strings for results that are both new this run (fetched from DSV,
     * newRecord=true) and survived the top-N cut in adjustResults(). This avoids re-reporting
     * existing records on every run: a result only appears here if it displaced a previous
     * entry or filled a previously empty rank slot.
     *
     * @returns {string[]} Each entry: "<timestamp>: <discipline>: <person> - <time> - <location> - <date>"
     */
    get newResults() {
        let newResults = [];
        for (let discipline of this._disciplines) {
            for (let result of discipline.results) {
                if (result.newRecord) {
                    let date = new Date().toLocaleString();
                    newResults.push(date + ': ' + discipline.toString() + ': ' + result.toString());
                }
            }
        }
        console.log('[Leaderboard] newResults: ' + newResults.length + ' new record(s) survived the top-N cut.');
        return newResults;
    }

    /**
     * Problems encountered while fetching from DSV this run (persistent rate limits,
     * unexpected responses). Included in the Web App response so the user's bound script
     * can log them — users cannot see the hosting account's execution log.
     *
     * @returns {string[]}
     */
    get warnings() {
        return this._requestHandler.warnings;
    }

    /**
     * Creates one Discipline instance per combination of stroke, distance, course, and gender
     * defined in the DISCIPLINES config. Female is pushed before male for each combination;
     * getSheetData() re-sorts them so that male appears first in each pair.
     */
    _createDisciplines() {
        for (let discipline in DISCIPLINES) {
            let stroke = DISCIPLINES[discipline].Lage;
            let longCourse = DISCIPLINES[discipline].Langbahn;
            let shortCourse = DISCIPLINES[discipline].Kurzbahn;
            for (let distance of longCourse) {
                this._disciplines.push(new Discipline(distance, LANES.LONG_COURSE, stroke, GENDERS.FEMALE));
                this._disciplines.push(new Discipline(distance, LANES.LONG_COURSE, stroke, GENDERS.MALE));
            }
            for (let distance of shortCourse) {
                this._disciplines.push(new Discipline(distance, LANES.SHORT_COURSE, stroke, GENDERS.FEMALE));
                this._disciplines.push(new Discipline(distance, LANES.SHORT_COURSE, stroke, GENDERS.MALE));
            }
        }
    }

    /**
     * Routes a result to its discipline by uid. Throws if the uid does not match any known
     * discipline — an unrecognised uid in the sheet would otherwise cause silent data loss.
     *
     * @param {Result} result
     * @param {string} disciplineUid - e.g. "#f502m"
     */
    addResult(result, disciplineUid) {
        let discipline = this._disciplines.find(discipline => discipline.uid === disciplineUid);
        try {
            discipline.addResult(result);
        } catch (error) {
            console.error('[Leaderboard] addResult: no discipline matches uid "' + disciplineUid +
                '" for result ' + result.toString());
            throw new Error('Result could not be added to the leaderboard: ' + result.toString());
        }
    }

    extractResultsFromSheet() {
        console.log('[Leaderboard] extractResultsFromSheet: loading existing results from the sheet...');
        this._sheet.extractResults(this._oldData);
    }

    /**
     * Fetches DSV results, optionally restricted to a subset of disciplines.
     * Disciplines excluded by the filter keep their sheet-loaded results untouched.
     *
     * @param {{genders?: string[], strokes?: string[], lanes?: number[], distances?: (string|number)[]}} [filter]
     */
    requestResults(filter) {
        console.log('[Leaderboard] requestResults: delegating to RequestHandler' +
            (filter ? ' with filter ' + JSON.stringify(filter) : ' (full update)') + '...');
        this._requestHandler.requestResults(filter);
    }

    /**
     * Deduplicates, sorts, and trims every discipline. The order is intentional:
     * removeDuplicateResults() must run first (on the unsorted pool) so the slower
     * duplicate of a swimmer is discarded before the sort determines the final ranking.
     */
    adjustResults() {
        console.log('[Leaderboard] adjustResults: deduplicating, sorting and trimming ' +
            this._disciplines.length + ' discipline(s) to top ' + this.entriesPerDiscipline + '...');
        let totalBefore = 0;
        let totalAfter = 0;
        for (let discipline of this._disciplines) {
            totalBefore += discipline.results.length;
            discipline.removeDuplicateResults();
            discipline.sortResults();
            discipline.cutResults(this.entriesPerDiscipline);
            totalAfter += discipline.results.length;
        }
        console.log('[Leaderboard] adjustResults: ' + totalBefore + ' pooled result(s) reduced to ' +
            totalAfter + ' after dedup + top-N cut.');
    }

    /**
     * @param {string} stroke - German stroke name matching a STROKES value (e.g. "Freistil").
     * @returns {Discipline[]}
     */
    disciplineByStroke(stroke) {
        return this._disciplines.filter(discipline => discipline.stroke === stroke);
    }
}
