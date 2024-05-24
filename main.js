const version = '1.0.2';

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
 * 4. Optional: Passen Sie die Anzahl der Einträge pro Disziplin an. Standardmäßig sind es 5 Einträge pro Disziplin.
 * 5. Optional: Unter FORMAT können Sie die Formatierung des Sheets anpassen. Dazu einfach die Werte unter dem jeweiligen Schlüssel anpassen.
 * 6. Optional: Setzen Sie `formatSheetEveryTime` auf `true`, wenn das Sheet bei jedem Update formatiert werden soll.
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
 *
 * Bei Fehlern:
 * Wenn ein Fehler auftritt, versuchen Sie das Skript erneut auszuführen. Sollte der Fehler weiterhin bestehen, überprüfen Sie die Konfiguration
 * und die Eingaben im Sheet. Sollte der Fehler weiterhin bestehen, überprüfen Sie, ob eine neue Version des Skripts verfügbar ist.
 * Bei weiteren Fragen oder Problemen können Sie sich gerne an mich wenden.
 * Im unwahrscheinlichen Fall, dass die Daten im Sheet weg sein sollten, dann finden sie unter Google Sheets -> Datei -> Versionsverlauf
 * einen ausführlichen Verlauf aller Änderungen und können eine frühere Version ohne Probleme wiederherstellen.
 */

const clubId = '7985' // Setze hier die ID des Vereins
const numberOfEntries = 5 // Optional: Anzahl der Einträge pro Disziplin
const formatSheetEveryTime = true // Optional: Soll das Sheet bei jedem Update formatiert werden?

function updateAllTime() {
    /**
     * All-Time Bestenliste
     * Diese Funktion aktualisiert die Bestenliste und schreibt die neuen Daten in das Sheet
     * In Google Apps Script kann man diese Funktion als Trigger einrichten, um sie regelmäßig auszuführen
     * Die Funktion ruft die Daten von der Datenbank des DSV ab und schreibt sie in das Sheet
     */

    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('All-Time'); // Hole das Sheet mit dem Namen 'All-Time'
    if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('All-Time'); // Erstelle ein neues Sheet, wenn keins vorhanden ist
    let code = UrlFetchApp.fetch(externalScript).getContentText(); // Externes Skript
    eval(code); //Code des externen Skripts ausführen
    getNewSheetData(version, sheet, FORMAT, formatSheetEveryTime); // Aktualisiere die Bestenliste für die All-Time
}

function updateSeason() {
    /**
     * Saison Bestenliste
     * Diese Funktion aktualisiert die Bestenliste und schreibt die neuen Daten in das Sheet
     * In Google Apps Script kann man diese Funktion als Trigger einrichten, um sie regelmäßig auszuführen
     * Die Funktion ruft die Daten von der Datenbank des DSV ab und schreibt sie in das Sheet
     */

    let year = new Date().getMonth() < 6 ? new Date().getFullYear() - 1 : new Date().getFullYear();
    let nameOfSheet = year + '/' + (year + 1);
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nameOfSheet); // Hole das Sheet mit dem Namen der aktuellen Saison
    if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(nameOfSheet); // Erstelle ein neues Sheet, wenn keins vorhanden ist
    let code = UrlFetchApp.fetch(externalScript).getContentText(); // Externes Skript
    eval(code); //Code des externen Skripts ausführen
    getNewSheetData(version, sheet, FORMAT, formatSheetEveryTime); // Aktualisiere die Bestenliste für die aktuelle Saison
}

const FORMAT = {
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
        'Textgewicht': 'bold',
        'Textausrichtung': 'left',
        'Text': 'Neue Ergebnisse'
    }
}

let externalScript = 'https://raw.githubusercontent.com/nilskntl/dsv-club-leaderboards/master/src/app-script/sheet/sheet.js'; // Externes Skript (nicht ändern)
