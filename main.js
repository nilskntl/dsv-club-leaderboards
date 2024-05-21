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
        _formatSheet(sheet); // Formatiere das Sheet
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
    let response = UrlFetchApp.fetch(endpoint, options).getContentText();
    response = JSON.parse(response);

    let code = UrlFetchApp.fetch('https://raw.githubusercontent.com/nilskntl/dsv-club-leaderboards/master/src/sheet/sheet.js').getContentText(); // Externes Skript
    eval(code); //Code des externen Skripts ausführen
    writeDataToSheet(response.data, response.newResults, sheet); // Schreibe die neuen Daten in das Sheet
}

function format() {
    let sheetToFormat = 'Sheet'; // Name des Sheets, das formatiert werden soll
    _formatSheet(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetToFormat));
}

function _formatSheet(sheet) {
    /**
     * Formatiert das Sheet
     * Die Funktion lässt sich beliebig oft ausführen, um das Sheet (neu) zu formatieren
     * In {colors} können die Farben für das Sheet definiert werden
     * In {columns} können die Breiten der Spalten definiert werden
     * Die Funktion setzt die Hintergrundfarben, Textfarben, Textausrichtungen, Zeilen- und Spaltenhöhen und verbindet Zellen
     */

    if (!sheet) Logger.log('Sheet ist nicht vorhanden. Überprüfe den Namen des Sheets.');

    let colors = {
        /**
         * Farben für das Sheet
         * Die Farben können beliebig angepasst werden
         */
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

    /**
     * Spaltenbreiten
     * Die Breiten der Spalten können beliebig angepasst werden
     */
    let columns = [75, 50, 200, 100, 100, 150, 100]

    let code = UrlFetchApp.fetch('https://raw.githubusercontent.com/nilskntl/dsv-club-leaderboards/master/src/sheet/sheet.js').getContentText(); // Externes Skript
    eval(code); //Code des externen Skripts ausführen
    formatSheet(sheet, colors, columns); // Formatiere das Sheet
}
