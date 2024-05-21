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

function _writeNewRecordsToSheet(results, sheet) {
    /**
     * Schreibt die Ergebnisse die neu hinzugekommen sind in das Sheet
     * Diese Funktion sollte nicht eigenständig aufgerufen werden!
     * @param {Array} results - Neue Ergebnisse
     * @param {Sheet} sheet - Sheet
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

function _writeNewDataToSheet(data, sheet) {
    /**
     * Schreibt die neuen Daten in das Sheet
     * Diese Funktion sollte nicht eigenständig aufgerufen werden!
     * @param {Array} data - Daten für das Sheet
     * @param {Sheet} sheet - Sheet
     */

    let range = sheet.getRange(3, 1, data.length, data[0].length); // Definiere die Range

    range.clearContent(); // Lösche vorhandene Daten in der Range
    range.setValues(data); // Schreibe die neuen Daten in die Range

    let lastRow = sheet.getLastRow(); // Sollten sich unterhalb der Range noch Daten befinden, werden diese gelöscht (außer sie befinden sich in Reihe P)
    if (lastRow > data.length) {
        let rangeToDelete = sheet.getRange(data.length + 3, 1, lastRow - data.length, data[0].length);
        rangeToDelete.clearContent();
    }
}

function writeDataToSheet(data, results, sheet) {
    /**
     * Schreibt die neuen Daten in das Sheet
     * @param {Array} data - Daten für das Sheet
     * @param {Array} results - Neue Ergebnisse
     */

    Logger.log('Übertrage neue Daten in das Tabellenblatt...');

    _writeNewDataToSheet(data, sheet);
    _writeNewRecordsToSheet(results, sheet);

    Logger.log('Daten erfolgreich übertragen.');
}

function formatSheet(sheet, numberOfEntries, format) {
    /** Formatiert das Sheet
     * Die Funktion lässt sich beliebig oft ausführen, um das Sheet (neu) zu formatieren
     * Die Funktion setzt die Hintergrundfarben, Textfarben, Textausrichtungen, Zeilen- und Spaltenhöhen und verbindet Zellen
     * @param {Sheet} sheet - Sheet
     * @param {number} numberOfEntries - Anzahl der Einträge pro Disziplin
     * @param {object} format - Format für das Sheet
     */

    Logger.log('Formatiere das Tabellenblatt...');

    if (!format) format = DEFAULT_FORMAT; // Setze das Standardformat, wenn kein Format übergeben wird

    // Um Konflikte mit verschiedenen Versionen zu vermeiden, überprüfe jeden Schlüssel in 'format' und ersetze ihn durch den Standardwert, wenn er nicht vorhanden ist
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

    sheet.clearFormats(); // Lösche die Formatierung des gesamten Sheets

    sheet.getRange('A:P').setHorizontalAlignment(format.Allgemein.Textausrichtung).setVerticalAlignment(format.Allgemein["Vertikale Ausrichtung"]).setNumberFormat('@'); // Textausrichtung für Reihe A bis N setzen und Format auf Text setzen
    sheet.getRange("P:P").setHorizontalAlignment(format['Neue Ergebnisse'].Textausrichtung); // Textausrichtung für Reihe P setzen

    let strokes = [[3, 12], [((numberOfEntries + 1) * 12) + 7, 6], [((numberOfEntries + 1) * 18) + 11, 6], [((numberOfEntries + 1) * 24) + 15, 6], [((numberOfEntries + 1) * 30) + 19, 5]] // Zeilen in denen eine neue Disziplin beginnt

    // Setze die Zeile für die Saison
    sheet.getRange(1, 1, 1, 14).merge().setBackground(format.Farben.Hintergrundfarben.Saison).setFontColor(format.Farben.Textfarben.Saison).setFontWeight('bold'); // Verbinde die Zellen für die Saison und setze die Hintergrundfarbe und Textfarbe
    sheet.setRowHeight(1, format.Zeilen.Hoehen.Saison); // Setze die Höhe der Zeile mit der Saison
    // Schreibe die aktuelle Saison in die erste Zelle
    let season = sheet.getName()
    sheet.getRange(1, 1).setValue(season);

    strokes.forEach(function (stroke) {
        sheet.getRange(stroke[0], 1, 1, 14).merge().setBackground(format.Farben.Hintergrundfarben.Lage).setFontColor(format.Farben.Textfarben.Lage).setFontWeight('bold'); // Verbinde die Zellen für die Lage und setze die Hintergrundfarbe und Textfarbe
        sheet.setRowHeight(stroke[0], format.Zeilen.Hoehen.Lage); // Setze die Höhe der Zeile mit der Lage
        sheet.getRange(stroke[0] + 1, 1, 1, 7).merge().setBackground(format.Farben.Hintergrundfarben.Maennlich.Kopfzeile).setFontColor(format.Farben.Textfarben.Maennlich.Kopfzeile).setFontWeight('bold'); // Verbinde die Kopfzeile der Tabelle und setze die Hintergrundfarbe und Textfarbe
        sheet.getRange(stroke[0] + 1, 8, 1, 7).merge().setBackground(format.Farben.Hintergrundfarben.Weiblich.Kopfzeile).setFontColor(format.Farben.Textfarben.Weiblich.Kopfzeile).setFontWeight('bold'); // Verbinde die Kopfzeile der Tabelle und setze die Hintergrundfarbe und Textfarbe
        sheet.setRowHeight(stroke[0] + 1, format.Zeilen.Hoehen.Geschlecht); // Setze die Höhe der Zeile mit den Geschlechtern
        sheet.getRange(stroke[0] + 2, 1, 1, 14).setBackground(format.Farben.Hintergrundfarben.Kopfzeile).setFontColor(format.Farben.Textfarben.Kopfzeile).setFontWeight('bold'); // Setze die Hintergrundfarbe und Textfarbe für die Kopfzeile
        sheet.setRowHeight(stroke[0] + 2, format.Zeilen.Hoehen.Kopfzeile); // Setze die Höhe der Kopfzeile

        for (let i = 0; i < stroke[1]; i++) {
            sheet.getRange(stroke[0] + 3 + i * (numberOfEntries + 1), 1, 1, 7).merge().setBackground(format.Farben.Hintergrundfarben.Streckenangabe.Maennlich).setFontColor(format.Farben.Textfarben.Streckenangabe.Maennlich).setFontWeight('bold'); // Verbinde die Zellen für die Kopfzeile der Disziplin und setze die Hintergrundfarbe und Textfarbe
            sheet.getRange(stroke[0] + 3 + i * (numberOfEntries + 1), 8, 1, 7).merge().setBackground(format.Farben.Hintergrundfarben.Streckenangabe.Weiblich).setFontColor(format.Farben.Textfarben.Streckenangabe.Weiblich).setFontWeight('bold'); // Verbinde die Zellen für die Kopfzeile der Disziplin und setze die Hintergrundfarbe und Textfarbe
            sheet.setRowHeight(stroke[0] + 3 + i * (numberOfEntries + 1), format.Zeilen.Hoehen.Streckenangabe); // Setze die Höhe der Zeile mit der Streckenangabe
            for (let j = 0; j < numberOfEntries; j++) {
                // Setze die Hintergrundfarbe und Textfarbe für ein einzelnes Ergebnis
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
    sheet.getRange(1, 16).setValue(format['Neue Ergebnisse'].Text); // Schreibe in P:1 die Überschrift für die neuen Ergebnisse

    Logger.log('Formatierung abgeschlossen.');
}

function getNewSheetData(version, sheet, format, formatSheetEveryTime) {
    /**
     * Diese Funktion ruft die Daten von der Datenbank des DSV ab und schreibt sie in das Sheet das übergeben wird
     * @param {string} version - Version des Skripts
     * @param {Sheet} sheet - Sheet
     * @param {object} format - Format für das Sheet
     * @param {boolean} formatSheetEveryTime - Gibt an, ob das Sheet jedes Mal formatiert werden soll
     */

    Logger.log('Version: ' + version);
    let newestVersion = UrlFetchApp.fetch('https://raw.githubusercontent.com/nilskntl/dsv-club-leaderboards/master/web-app/version.txt').getContentText();


    if (newestVersion !== version) {
        Logger.log('--------------------------------------------------');
        Logger.log('Es ist eine neue Version verfügbar. Bitte aktualisieren Sie das Skript.');
        Logger.log('Neueste Version: ' + newestVersion);
        Logger.log('Das neueste Skript finden Sie hier: https://github.com/nilskntl/dsv-club-leaderboards')
        Logger.log('--------------------------------------------------');
    }

    let payload = {
        clubId: clubId,
        data: sheet.getDataRange().getValues(),
        entriesPerDiscipline: numberOfEntries
    };

    let options = {
        'method': 'post',
        'contentType': 'application/json',
        'payload': JSON.stringify(payload)
    }

    let endpoint = UrlFetchApp.fetch('https://github.com/nilskntl/dsv-club-leaderboards/raw/master/web-app/endpoint.txt').getContentText();

    Logger.log('Aktualisiere Daten für die Saison: ' + sheet.getName() + '...');

    let response = UrlFetchApp.fetch(endpoint, options).getContentText();

    // Überprüfe, ob die Antwort erfolgreich war
    if (response.startsWith('<!DOCTYPE html>')) {
        Logger.log('Es ist ein Fehler aufgetreten. Bitte überprüfen Sie, ob Sie alles richtig eingegeben haben. Falls der Fehler weiterhin besteht, kontaktieren Sie den Entwickler.');
        Logger.log('Antwort: ' + response);
        return;
    }

    response = JSON.parse(response);

    Logger.log('Daten erfolgreich aktualisiert.');

    writeDataToSheet(response.data, response.newResults, sheet); // Schreibe die neuen Daten in das Sheet
    if (formatSheetEveryTime) formatSheet(sheet, numberOfEntries, format); // Formatiere das Sheet, wenn 'formatSheetEveryTime' auf 'true' gesetzt ist

    Logger.log('Bestenliste wurde erfolgreich aktualisiert. Das Programm wurde beendet.');
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
        'Textausrichtung': 'left',
        'Text': 'Neue Ergebnisse'
    }
}