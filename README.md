# Automatische Bestenlisten-Aktualisierung für Schwimmverein

Dieses Programm ermöglicht eine mühelose Aktualisierung der Bestenlisten eines Schwimmvereins mithilfe der Daten des Deutschen Schwimmverbands (DSV). Automatisiere den Prozess, erweitere deinen Code in Google Apps Script und halte die Bestenlisten deines Vereins stets auf dem neuesten Stand!

## Einrichtung

1. **Kopiere den Code in Google Apps Script:**
   - Öffne Google Sheets und erstelle ein neues Tabellenblatt oder öffne ein vorhandenes.
   - Klicke oben auf "Erweiterungen" und wähle "Apps Script" aus.
   - Füge den Code aus `main.js` in eine Skriptdatei ein.
   - Speichere die Datei.

2. **Einstellungen im `main.js`-Skript anpassen:**
   - Passe die `clubId` (Club-ID deines Vereins) und optional die `numberOfEntries` (Anzahl der anzuzeigenden Platzierungen pro Strecke) an.

3. **Trigger für automatische Aktualisierung einrichten:**
   - In Google Apps Script, öffne das `main.js`-Skript.
   - Klicke auf das Uhrsymbol (Trigger-Symbol) in der Symbolleiste.
   - Füge einen neuen Trigger hinzu, der die Funktion `updateAllTime()` ausführt. Dies ermöglicht die automatische Aktualisierung der Bestenlisten.

4. **Manuelle Hinzufügung von All-Time Bestenlisten:**
   - Da der DSV nur Zugriff auf die Bestenlisten des aktuellen Jahres bietet, müssen All-Time Bestenlisten einmalig manuell in Google Sheets hinzugefügt werden.

5. **Anpassung der Formatierung:**
   - Du kannst die Formatierung der Bestenlisten anpassen, indem du die Werte in `FORMAT` veränderst.

## Einbindung in Website

1. **Kopiere deine Google Sheets URLs:**
   - Öffne deine Google Sheets Datei
   - Gehe auf Datei -> Freigebene -> Im Web veröffentlichen
   - Wähle das Tabellenblatt aus, dass du freigeben willst und wähle die Option "Tabulatorgetrennte Werte (TSV)"
   - Führe diesen Schritt mit jedem Tabellenblatt durch, dass du auf deiner Website einbinden willst (z.B. All-Time Bestenliste, Bestenliste 2023/2024, etc.)

2. **Einrichtung der HTML:**
   - Kopiere den Code aus `index.html`
   - Ganz unten im Dokument befindet sich die Konstante "KEYS" in der du die Google Sheets URLs eintragen kannst

3. **Einbindung in Website:**
   - Kopiere den HTML Code in deine Website

## Hinweise

- Stelle sicher, dass du die notwendigen Berechtigungen für den Zugriff auf Google Sheets und das Ausführen von Skripten erteilt hast.
- Um eine Überlastung des DSV-Servers zu verhindern, setze den Trigger nicht all zu oft.

## Nutzung

- Führe die Funktion `updateAllTime()` im `main.js`-Skript aus, um die Bestenlisten zu aktualisieren.
- Das Skript enthält außerdem die Funktion `updateSeason()`, die die Bestenlisten des aktuellen Jahres aktualisiert.

Viel Spaß mit deinem automatisierten Bestenlisten-Aktualisierungsprogramm für deinen Schwimmverein! Ein Beispiel der Implementierung findet man auf https://www.wsg-wunstorf.de/bestenlisten
