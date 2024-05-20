/**
 * Dieses Skript erstellt und aktualisiert die Bestenliste für einen deutschen Schwimmverein vollautomatisch.
 *
 * Funktionsweise:
 * Um die Bestenliste zu aktualisieren, muss die Funktion `updateAllTime()` ausgeführt werden. Diese Funktion ruft die Daten
 * vom Deutschen Schwimm-Verband (DSV) ab und schreibt sie in das Google Sheet.
 *
 * Einrichtung:
 * 1. Erstellen Sie ein neues Google Sheet.
 * 2. Navigieren Sie in Google Sheets zu Erweiterungen -> Apps Script, erstellen Sie ein neues Skript und fügen Sie diesen Code ein.
 * 3. Setzen Sie die `clubId` auf die ID Ihres Vereins.
 * 4. Optional: Passen Sie den Namen des Sheets und die Anzahl der Einträge pro Disziplin an. Falls Sie die Anzahl der Einträge ändern,
 *      ändern Sie bitte auch den Namen des Sheets, um sicherzustellen, dass die Daten korrekt angezeigt werden, und kopieren Sie die
 *      ursprünglichen Daten in das neue Sheet.
 *
 * Um die Bestenliste automatisch zu aktualisieren, richten Sie einen Trigger ein, der die Funktion `updateAllTime()` regelmäßig ausführt.
 * @see https://developers.google.com/apps-script/guides/triggers/
 * Das Skript enthält außerdem eine Funktion `updateSeason()`, die die Bestenliste für die aktuelle Saison aktualisiert. Hierfür
 * muss nichts weiter eingerichtet werden, da die Funktion die aktuelle Saison automatisch erkennt. Auch hier lässt sich ein Trigger
 * einrichten, um die Funktion regelmäßig auszuführen.
 *
 * Hinweise:
 * Da vom DSV jeweils nur die Zeiten der aktuellen Saison abgerufen werden können, muss nach der erstmaligen Ausführung
 * die Bestenliste einmal manuell aktualisiert werden. Führen Sie dazu die Funktion `updateAllTime()` einmal aus, um das Sheet zu initialisieren
 * und zu formatieren, und aktualisieren Sie anschließend die Bestenliste manuell.
 * Die Struktur des Sheets sollte nicht geändert werden, da das Skript davon ausgeht, dass die Daten in einer bestimmten Struktur vorliegen.
 * Die Formatierung des Sheets kann sowohl manuell als auch per Skript beliebig oft geändert werden.
 */


const clubId = '7985' // Setze hier die ID des Vereins
const sheetName = 'Sheet' // Optional: Setze hier den Namen des Sheets, in dem die Bestenliste gespeichert wird
const numberOfEntries = 5 // Optional: Anzahl der Einträge pro Disziplin

function updateAllTime() {
    /**
     * All-Time Bestenliste
     * Diese Funktion aktualisiert die Bestenliste und schreibt die neuen Daten in das Sheet
     * In Google Apps Script kann man diese Funktion als Trigger einrichten, um sie regelmäßig auszuführen
     * Die Funktion ruft die Daten von der Datenbank des DSV ab und schreibt sie in das Sheet
     */

    getNewData(sheetName);
}

function updateSeason() {
    /**
     * Saison Bestenliste
     * Diese Funktion aktualisiert die Bestenliste und schreibt die neuen Daten in das Sheet
     */

    let year = new Date().getMonth() < 6 ? new Date().getFullYear() - 1 : new Date().getFullYear();
    getNewData(year + '/' + (year + 1));
}

function getNewData(nameOfSheet) {
    /**
     * Diese Funktion ruft die Daten von der Datenbank des DSV ab und schreibt sie in das Sheet das übergeben wird
     * @param {string} nameOfSheet - Name des Sheets
     */

    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nameOfSheet); // Definiere das Sheet
    if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(nameOfSheet); // Erstelle ein neues Sheet, wenn keins vorhanden ist
        formatSheet(sheet); // Formatiere das Sheet
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

    let response = UrlFetchApp.fetch('https://script.google.com/macros/s/AKfycbwW9R5mT7j608cnJCKz0YtwnSaOWCOHOWkiFPNNoTBr1cI4DILwtoYvz3BvO0tR_15F/exec', options).getContentText();
    response = JSON.parse(response);

    _writeDataToSheet(response.data, sheet);

    _writeNewRecordsToSheet(response.newResults, sheet);
}

function formatSheet(sheet) {
    /**
     * Formatiert das Sheet
     * Die Funktion lässt sich beliebig oft ausführen, um das Sheet (neu) zu formatieren
     * In {colors} können die Farben für das Sheet definiert werden
     * In {columns} können die Breiten der Spalten definiert werden
     * Die Funktion setzt die Hintergrundfarben, Textfarben, Textausrichtungen, Zeilen- und Spaltenhöhen und verbindet Zellen
     */

    if (!sheet) Logger.log('Sheet ist nicht vorhanden. Überprüfe den Namen des Sheets.');

    let colors = {
        // Farben für das Sheet
        'Hintergrundfarbe': {
            'Kopfzeile': {
                'Primear': '#252626',
                'Sekundaer': '#252626',
                'Maennlich': '#25476a',
                'Weiblich': '#652a5f'
            },
            'Koerper': {
                'Primear': '#ffffff',
            },
            'Maennlich': {
                'Gerade': '#d1e5ef',
                'Ungerade': '#bbd5ea'
            },
            'Weiblich': {
                'Gerade': '#e6dfe5',
                'Ungerade': '#dacbdd'
            }
        },
        'Textfarbe': {
            'Kopfzeile': {
                'Primear': '#ffffff',
            },
            'Koerper': {
                'Primear': '#2E2727',
            },
        }
    }

    let columns = [75, 50, 200, 100, 100, 150, 100] // Breite der Spalten

    sheet.getRange('A:P').setHorizontalAlignment("center").setVerticalAlignment("middle").setNumberFormat('@'); // Textausrichtung auf zentriert für Reihe A bis N setzen und Format auf Text setzen
    sheet.getRange("P:P").setHorizontalAlignment("left"); // Textausrichtung  auf linksbündig für Reihe P setzen

    let strokes = [[1, 12], [((numberOfEntries + 1) * 12) + 5, 6], [((numberOfEntries + 1) * 18) + 9, 6], [((numberOfEntries + 1) * 24) + 13, 6], [((numberOfEntries + 1) * 30) + 17, 5]] // Zeilen in denen eine neue Disziplin beginnt

    strokes.forEach(function (stroke) {
        sheet.getRange(stroke[0], 1, 1, 14).merge().setBackground(colors.Hintergrundfarbe.Kopfzeile.Primear).setFontColor(colors.Textfarbe.Kopfzeile.Primear).setFontWeight('bold'); // Verbinde die Zellen für die Lage und setze die Hintergrundfarbe und Textfarbe
        sheet.setRowHeight(stroke[0], 34); // Setze die Höhe der Reihe auf 34
        sheet.getRange(stroke[0] + 1, 1, 1, 7).merge().setBackground(colors.Hintergrundfarbe.Kopfzeile.Maennlich).setFontColor(colors.Textfarbe.Kopfzeile.Primear).setFontWeight('bold'); // Verbinde die Kopfzeile der Tabelle und setze die Hintergrundfarbe und Textfarbe
        sheet.getRange(stroke[0] + 1, 8, 1, 7).merge().setBackground(colors.Hintergrundfarbe.Kopfzeile.Weiblich).setFontColor(colors.Textfarbe.Kopfzeile.Primear).setFontWeight('bold'); // Verbinde die Kopfzeile der Tabelle und setze die Hintergrundfarbe und Textfarbe
        sheet.setRowHeight(stroke[0] + 1, 26); // Setze die Höhe der Reihe auf 26
        sheet.getRange(stroke[0] + 2, 1, 1, 14).setBackground(colors.Hintergrundfarbe.Kopfzeile.Primear).setFontColor(colors.Textfarbe.Kopfzeile.Primear).setFontWeight('bold'); // Setze die Hintergrundfarbe und Textfarbe für die Kopfzeile
        sheet.setRowHeight(stroke[0] + 2, 26); // Setze die Höhe der Reihe auf 26

        for (let i = 0; i < stroke[1]; i++) {
            sheet.getRange(stroke[0] + 3 + i * (numberOfEntries + 1), 1, 1, 7).merge().setBackground(colors.Hintergrundfarbe.Kopfzeile.Maennlich).setFontColor(colors.Textfarbe.Kopfzeile.Primear).setFontWeight('bold'); // Verbinde die Zellen für die Kopfzeile der Disziplin und setze die Hintergrundfarbe und Textfarbe
            sheet.getRange(stroke[0] + 3 + i * (numberOfEntries + 1), 8, 1, 7).merge().setBackground(colors.Hintergrundfarbe.Kopfzeile.Weiblich).setFontColor(colors.Textfarbe.Kopfzeile.Primear).setFontWeight('bold'); // Verbinde die Zellen für die Kopfzeile der Disziplin und setze die Hintergrundfarbe und Textfarbe
            sheet.setRowHeight(stroke[0] + 3 + i * (numberOfEntries + 1), 26); // Setze die Höhe der Reihe auf 26
            for (let j = 0; j < numberOfEntries; j++) {
                // Setze die Hintergrundfarbe und Textfarbe für ein einzelnes Ergebnis
                if (j % 2 === 0) {
                    sheet.getRange(stroke[0] + 4 + i * (numberOfEntries + 1) + j, 1, 1, 7).setBackground(colors.Hintergrundfarbe.Maennlich.Gerade).setFontColor(colors.Textfarbe.Koerper.Primear);
                    sheet.getRange(stroke[0] + 4 + i * (numberOfEntries + 1) + j, 8, 1, 7).setBackground(colors.Hintergrundfarbe.Weiblich.Gerade).setFontColor(colors.Textfarbe.Koerper.Primear);
                } else {
                    sheet.getRange(stroke[0] + 4 + i * (numberOfEntries + 1) + j, 1, 1, 7).setBackground(colors.Hintergrundfarbe.Maennlich.Ungerade).setFontColor(colors.Textfarbe.Koerper.Primear);
                    sheet.getRange(stroke[0] + 4 + i * (numberOfEntries + 1) + j, 8, 1, 7).setBackground(colors.Hintergrundfarbe.Weiblich.Ungerade).setFontColor(colors.Textfarbe.Koerper.Primear);
                }
            }
        }
    });

    for (let i = 0; i < columns.length; i++) {
        // Setze die Breite der Spalten
        sheet.setColumnWidth(i + 1, columns[i]);
        sheet.setColumnWidth(i + 8, columns[i]);
    }

    sheet.getRange(1, 16).setValue('Neue Ergebnisse'); // Schreibe in P:1 die Überschrift für die neuen Ergebnisse
    sheet.setColumnWidth(16, 800); // Setze die Breite der Reihe auf 400
}

function _writeDataToSheet(data, sheet) {
    /**
     * Schreibt die neuen Daten in das Sheet
     * Diese Funktion sollte nicht eigenständig aufgerufen werden!
     * @param {Array} data - Daten für das Sheet
     */

    let range = sheet.getRange(1, 1, data.length, data[0].length); // Definiere die Range

    range.clearContent(); // Lösche vorhandene Daten in der Range
    range.setValues(data); // Schreibe die neuen Daten in die Range
}

function _writeNewRecordsToSheet(results, sheet) {
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