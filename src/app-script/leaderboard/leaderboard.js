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
     */
    constructor(clubId, data, entriesPerDiscipline = 10) {
        this._clubId = clubId.toString();
        this._oldData = data;
        this._disciplines = [];
        this._requestHandler = new RequestHandler(this);
        this._sheet = new Sheet(this);
        this._entriesPerDiscipline = entriesPerDiscipline;
        this._createDisciplines();
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
        return newResults;
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
            throw new Error('Result could not be added to the leaderboard: ' + result.toString());
        }
    }

    extractResultsFromSheet() {
        this._sheet.extractResults(this._oldData);
    }

    requestResults() {
        this._requestHandler.requestResults();
    }

    /**
     * Deduplicates, sorts, and trims every discipline. The order is intentional:
     * removeDuplicateResults() must run first (on the unsorted pool) so the slower
     * duplicate of a swimmer is discarded before the sort determines the final ranking.
     */
    adjustResults() {
        for (let discipline of this._disciplines) {
            discipline.removeDuplicateResults();
            discipline.sortResults();
            discipline.cutResults(this.entriesPerDiscipline);
        }
    }

    /**
     * @param {string} stroke - German stroke name matching a STROKES value (e.g. "Freistil").
     * @returns {Discipline[]}
     */
    disciplineByStroke(stroke) {
        return this._disciplines.filter(discipline => discipline.stroke === stroke);
    }
}
