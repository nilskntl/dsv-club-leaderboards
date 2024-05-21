class Sheet {
    /**
     * Klasse zum Verwalten der Daten des Sheets
     * @param {Leaderboard} leaderboard - Bestenliste
     * @property {Leaderboard} _leaderboard - Bestenliste
     * @method extractResults - Extrahiert die Ergebnisse aus den Daten des Sheets
     * @method getSheetData - Holt die Daten des Sheets
     */

    constructor(leaderboard) {
        this._leaderboard = leaderboard;
    }

    extractResults(data) {
        /**
         * Extrahiert die Ergebnisse aus den Daten des Sheets
         * @param {Array} data - Daten des Sheets
         */
        for (let i = 0; i < data.length; i++) {
            if (data[i].length > 9) {
                if (data[i][0].startsWith('#') && data[i][7].startsWith('#')) {
                    this._addResult(data, i, 0);
                    this._addResult(data, i, 7);
                }
            }
        }
    }

    _addResult(data, i, j) {
        /**
         * Fügt ein Ergebnis zur Bestenliste hinzu
         * @param {Array} row - Zeile des Ergebnisses
         * @param {number} index - Index des ersten Feldes des Ergebnisses
         */
        let uid = data[i][j];
        let name = data[i][j + 2];
        if (name.toString().trim() === '') return;
        let time = data[i][j + 3];
        let birthdate = data[i][j + 4];
        let location = data[i][j + 5];
        let date = data[i][j + 6];
        let result = new Result(new Person(name, birthdate), new Time(time), location, new CalenderDate(date), false);
        this._leaderboard.addResult(result, uid);
    }

    getSheetData() {
        /**
         * Bringt die neuen Daten in das Format für das Google Sheet
         * @returns {Array} - Daten für das Google Sheet
         */

        let disciplinesByStroke = {
            'Freistil': this._leaderboard.disciplineByStroke('Freistil'),
            'Schmetterling': this._leaderboard.disciplineByStroke('Schmetterling'),
            'Ruecken': this._leaderboard.disciplineByStroke('Rücken'),
            'Brust': this._leaderboard.disciplineByStroke('Brust'),
            'Lagen': this._leaderboard.disciplineByStroke('Lagen')
        };

        let data = [];

        for (let stroke in disciplinesByStroke) {
            let disciplines = disciplinesByStroke[stroke]; // Disziplinen des Schwimmstils
            if (disciplines.length === 0) continue; // Wenn keine Disziplinen vorhanden sind, wird der Schwimmstil übersprungen
            disciplines.sort((discipline1, discipline2) => { // Sortiert die Disziplinen nach Distanz, Bahn und Geschlecht
                if (discipline1.distance === discipline2.distance) {
                    if (discipline1.lane === discipline2.lane) {
                        return discipline1.gender === 'Männlich' ? -1 : 1;
                    } else {
                        return discipline1.lane - discipline2.lane;
                    }
                } else {
                    return discipline1.distance - discipline2.distance;
                }
            });

            data.push([disciplines[0].stroke, '', '', '', '', '', '', '', '', '', '', '', '', '']); // Erste Zeile der Disziplin (Schwimmstil)
            data.push(['Männlich', '', '', '', '', '', '', 'Weiblich', '', '', '', '', '', '']); // Zweite Zeile der Disziplin (Geschlecht)
            data.push(['UID', 'Platz', 'Name', 'Zeit', 'Jahrgang', 'Ort', 'Datum', 'UID', 'Platz', 'Name', 'Zeit', 'Jahrgang', 'Ort', 'Datum']); // Dritte Zeile der Disziplin (Header)

            for (let i = 0; i < disciplines.length; i = i + 2) {
                let disciplineMale = disciplines[i];
                let disciplineFemale = disciplines[i + 1];
                let resultsMale = disciplineMale.results;
                let resultsFemale = disciplineFemale.results;

                data.push([disciplineMale.distance + 'm (' + (disciplineMale.lane === 25 ? 'Kurzbahn' : 'Langbahn') + ')', '', '', '', '', '', '', disciplineMale.distance + 'm (' + (disciplineMale.lane === 25 ? 'Kurzbahn' : 'Langbahn') + ')', '', '', '', '', '', '']); // Zeile mit der Disziplin (Distanz und Bahn) 'Freistil 50m (Kurzbahn)'

                for (let j = 0; j < this._leaderboard.entriesPerDiscipline; j++) {
                    let rank = (j + 1).toString() + '.';
                    if (j < resultsMale.length) {
                        data.push([disciplineMale.uid, rank, resultsMale[j].person.name, resultsMale[j].time.toString(), resultsMale[j].person.birth, resultsMale[j].location, resultsMale[j].date.toString()]);
                    } else {
                        data.push([disciplineMale.uid, rank, '', '', '', '', '']);
                    }
                    if (j < resultsFemale.length) {
                        data[data.length - 1].push(disciplineFemale.uid, rank, resultsFemale[j].person.name, resultsFemale[j].time.toString(), resultsFemale[j].person.birth, resultsFemale[j].location, resultsFemale[j].date.toString());
                    } else {
                        data[data.length - 1].push(disciplineFemale.uid, rank, '', '', '', '', '');
                    }
                }
            }

            data.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '']); // Leere Zeile zwischen den Lagen
        }
        return data;
    }

}

function #writeDataToSheet(data, sheet) {
    /**
     * Schreibt die neuen Daten in das Sheet
     * Diese Funktion sollte nicht eigenständig aufgerufen werden!
     * @param {Array} data - Daten für das Sheet
     */

    let range = sheet.getRange(1, 1, data.length, data[0].length); // Definiere die Range

    range.clearContent(); // Lösche vorhandene Daten in der Range
    range.setValues(data); // Schreibe die neuen Daten in die Range
}

function #writeNewRecordsToSheet(results, sheet) {
    /**
     * Schreibt die Ergebnisse die neu hinzugekommen sind in das Sheet
     * Diese Funktion sollte nicht eigenständig aufgerufen werden!
     * @param {Array} results - Neue Ergebnisse
     */

    let column = 16; // Reihe P
    let values = sheet.getRange(1, column, 1, sheet.getLastColumn()).getValues()[0];

    let row = 1;
    for (let i = 0; i < values.length; i++) {
        if (values[i] === "") {
            row = i + 1;
            break;
        }
    }

    for (let i = 0; i < results.length; i++) {
        sheet.getRange(row + i, column).setValue(results[i]);
    }
}

function writeDataToSheet(data, results, sheet) {
    /**
     * Schreibt die neuen Daten in das Sheet
     * @param {Array} data - Daten für das Sheet
     * @param {Array} results - Neue Ergebnisse
     */
    #writeDataToSheet(data, sheet);
    #writeNewRecordsToSheet(results, sheet);
}