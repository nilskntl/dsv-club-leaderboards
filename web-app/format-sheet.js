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