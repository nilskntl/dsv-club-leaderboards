class Leaderboard {
    /**
     * Klasse für die Bestenliste
     * @param {any} clubId - ID des Vereins
     * @param {Array} data - Daten des Google Sheets
     * @param {number} entriesPerDiscipline - Anzahl der Einträge pro Disziplin
     * @property {Discipline[]} disciplines - Disziplinen der Bestenliste
     * @property {number} entriesPerDiscipline - Anzahl der Einträge pro Disziplin
     * @property {[[]]} results - Daten der Bestenliste
     * @property {String[]} newResults - Neue Ergebnisse
     * @property {string} clubId - ID des Vereins
     * @property {Array} _oldData - Daten des Google Sheets
     * @property {RequestHandler} _requestHandler - Handler für die Anfragen an die Datenbank
     * @property {Sheet} _sheet - Verwaltet die Daten des Google Sheets
     * @method addResult - Fügt ein Ergebnis hinzu
     * @method extractResultsFromSheet - Extrahiert die bisherigen Ergebnisse aus dem Google Sheet
     * @method requestResults - Fordert die Ergebnisse von der Datenbank an
     * @method adjustResults - Bereitet die Ergebnisse für die Anzeige auf
     * @method disciplineByStroke - Gibt alle Disziplinen eines Schwimmstils zurück
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

    get results() {
        /**
         * Gibt die Daten der Bestenliste zurück als zweidimensionales Array für das Google Sheet
         */
        return this._sheet.getSheetData();
    }

    get newResults() {
        /**
         * Gibt die neuen Ergebnisse zurück
         */
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

    _createDisciplines() {
        /**
         * Erstellt alle Disziplinen
         */

        for (let discipline in DISCIPLINES) {
            let stroke = DISCIPLINES[discipline].Lage;
            let longCourse = DISCIPLINES[discipline].Langbahn;
            let shortCourse = DISCIPLINES[discipline].Kurzbahn;
            for (let distance of longCourse) {
                this._disciplines.push(new Discipline(distance, LANES.Lanbahn, stroke, GENDERS.Weiblich));
                this._disciplines.push(new Discipline(distance, LANES.Lanbahn, stroke, GENDERS.Maennlich));
            }
            for (let distance of shortCourse) {
                this._disciplines.push(new Discipline(distance, LANES.Kurzbahn, stroke, GENDERS.Weiblich));
                this._disciplines.push(new Discipline(distance, LANES.Kurzbahn, stroke, GENDERS.Maennlich));
            }
        }

    }

    addResult(result, disciplineUid) {
        /**
         * Fügt ein Ergebnis hinzu
         */
        let discipline = this._disciplines.find(discipline => discipline.uid === disciplineUid);
        try {
            discipline.addResult(result);
        } catch (error) {
            throw new Error('Result could not be added to the leaderboard: ' + result.toString());
        }
    }

    extractResultsFromSheet() {
        /**
         * Extrahiert die Ergebnisse aus dem Google Sheet
         */
        this._sheet.extractResults(this._oldData);
    }

    requestResults() {
        /**
         * Fordert die Ergebnisse von der Datenbank an
         */
        this._requestHandler.requestResults();
    }

    adjustResults() {
        /**
         * Bereitet die Ergebnisse für die Anzeige auf
         */
        for (let discipline of this._disciplines) {
            discipline.removeDuplicateResults();
            discipline.sortResults();
            discipline.cutResults(this.entriesPerDiscipline);
        }
    }

    disciplineByStroke(stroke) {
        /**
         * Gibt alle Disziplinen eines Schwimmstils zurück
         * @param {string} stroke - Schwimmstil
         * @returns {Discipline[]} - Disziplinen des Schwimmstils
         */

        return this._disciplines.filter(discipline => discipline.stroke === stroke);
    }
}