class Sheet {
    /**
     * Translates between the Leaderboard domain model and the Google Sheet's
     * fixed 14-column layout (columns A–N).
     *
     * Sheet structure per stroke group:
     *   Row 1: stroke name merged across all 14 columns
     *   Row 2: "Männlich" (cols A–G) | "Weiblich" (cols H–N)
     *   Row 3: column headers (UID, Rank, Name, Time, Birth, Location, Date) × 2
     *   For each distance/course combination:
     *     Row N:   distance label spanning both halves
     *     Rows N+1 … N+entriesPerDiscipline: one result row each, male left / female right
     *
     * UIDs (e.g. "#f502m") in columns A and H are the join key between sheet rows
     * and Discipline instances. Rows without a "#"-prefixed UID in both halves are
     * header or label rows and are ignored during extraction.
     *
     * This class is loaded together with the domain classes (Result, Person, Time,
     * CalendarDate) in the pipeline bundle so its methods can instantiate them — the
     * write/format helpers and getNewSheetData() live separately in sheet.js.
     *
     * @param {Leaderboard} leaderboard
     */
    constructor(leaderboard) {
        this._leaderboard = leaderboard;
    }

    /**
     * Scans raw sheet data and loads existing results into the leaderboard.
     *
     * A row is treated as a result row only if it has more than 9 columns and both
     * column 0 (male UID) and column 7 (female UID) start with "#". Header, label,
     * and empty rows do not meet this condition and are silently skipped.
     *
     * @param {Array[]} data - Raw 2D array from sheet.getDataRange().getValues().
     */
    extractResults(data) {
        console.log('[Sheet] extractResults: scanning ' + data.length + ' sheet row(s) for existing results...');
        let resultRows = 0;
        for (let i = 0; i < data.length; i++) {
            if (data[i].length > 9) {
                if (data[i][0].startsWith('#') && data[i][7].startsWith('#')) {
                    resultRows++;
                    this._addResult(data, i, 0);
                    this._addResult(data, i, 7);
                }
            }
        }
        console.log('[Sheet] extractResults: identified ' + resultRows + ' result row(s) (male + female per row).');
    }

    /**
     * Reads one result entry from row i starting at column offset j and adds it to the leaderboard.
     *
     * Column layout relative to j:
     *   j+0: UID, j+1: rank (skipped), j+2: name, j+3: time, j+4: birth year,
     *   j+5: location, j+6: date.
     *
     * Empty name cells indicate an unfilled rank slot in the sheet and are skipped.
     * Results loaded from the sheet carry newRecord=false — they are existing entries,
     * not new DSV results from the current run.
     *
     * @param {Array[]} data - Full 2D sheet data array.
     * @param {number} i - Row index.
     * @param {number} j - Column offset: 0 for the male half, 7 for the female half.
     */
    _addResult(data, i, j) {
        let uid = data[i][j];
        let name = data[i][j + 2];
        if (name.toString().trim() === '') return; // unfilled rank slot
        let time = data[i][j + 3];
        let birthdate = data[i][j + 4];
        let location = data[i][j + 5];
        let date = data[i][j + 6];
        console.log('[Sheet] extractResults: row ' + (i + 1) + ' col ' + (j + 1) + ' → ' + uid +
            ' ' + name + ' (' + birthdate + ') ' + time + ' @ ' + location + ' ' + date);
        let result = new Result(new Person(name, birthdate), new Time(time), location, new CalendarDate(date), false);
        this._leaderboard.addResult(result, uid);
    }

    /**
     * Serialises all disciplines into a 2D array formatted for Google Sheets setValues().
     *
     * Disciplines within each stroke group are sorted by distance ascending, then by course
     * (short course before long course, i.e. 25m before 50m), then male before female.
     * This sort order determines both the visual layout and the pairing used in the loop
     * (disciplines[i] = male, disciplines[i+1] = female after sorting).
     *
     * Unfilled rank slots are written as empty strings so the sheet always has a fixed
     * number of rows per discipline, regardless of how many results exist.
     *
     * @returns {Array[]} 2D array written to the sheet starting at row 3.
     *   Rows 1–2 are the season header and the reserved row set by formatSheet().
     */
    getSheetData() {
        let disciplinesByStroke = {
            'Freistil': this._leaderboard.disciplineByStroke('Freistil'),
            'Schmetterling': this._leaderboard.disciplineByStroke('Schmetterling'),
            'Rücken': this._leaderboard.disciplineByStroke('Rücken'),
            'Brust': this._leaderboard.disciplineByStroke('Brust'),
            'Lagen': this._leaderboard.disciplineByStroke('Lagen')
        };

        console.log('[Sheet] getSheetData: serialising disciplines into the 14-column sheet layout...');

        let data = [];

        for (let stroke in disciplinesByStroke) {
            let disciplines = disciplinesByStroke[stroke];
            if (disciplines.length === 0) {
                console.log('[Sheet] getSheetData: no disciplines for stroke "' + stroke + '" — skipped.');
                continue;
            }
            console.log('[Sheet] getSheetData: stroke "' + stroke + '" → ' + disciplines.length + ' discipline(s).');
            disciplines.sort((discipline1, discipline2) => {
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

            data.push([disciplines[0].stroke, '', '', '', '', '', '', '', '', '', '', '', '', '']);
            data.push(['Männlich', '', '', '', '', '', '', 'Weiblich', '', '', '', '', '', '']);
            data.push(['UID', 'Platz', 'Name', 'Zeit', 'Jahrgang', 'Ort', 'Datum', 'UID', 'Platz', 'Name', 'Zeit', 'Jahrgang', 'Ort', 'Datum']);

            for (let i = 0; i < disciplines.length; i = i + 2) {
                let disciplineMale = disciplines[i];
                let disciplineFemale = disciplines[i + 1];
                let resultsMale = disciplineMale.results;
                let resultsFemale = disciplineFemale.results;

                data.push([disciplineMale.distance + 'm (' + (disciplineMale.lane === 25 ? 'Kurzbahn' : 'Langbahn') + ')', '', '', '', '', '', '', disciplineMale.distance + 'm (' + (disciplineMale.lane === 25 ? 'Kurzbahn' : 'Langbahn') + ')', '', '', '', '', '', '']);

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

            data.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        }
        console.log('[Sheet] getSheetData: produced ' + data.length + ' row(s) for the sheet.');
        return data;
    }

}
