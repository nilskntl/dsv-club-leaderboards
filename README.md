# Automatische Bestenlisten-Aktualisierung für Schwimmverein

Dieses Programm ermöglicht eine mühelose Aktualisierung der Bestenlisten eines Schwimmvereins mithilfe der Daten des Deutschen Schwimmverbands (DSV). Automatisiere den Prozess, erweitere deinen Code in Google Apps Script und halte die Bestenlisten deines Vereins stets auf dem neuesten Stand!

## Einrichtung

1. **Kopiere den Code in Google Apps Script:**
   - Öffne Google Sheets und erstelle ein neues Tabellenblatt oder öffne ein vorhandenes.
   - Klicke oben auf "Erweiterungen" und wähle "Apps Script" aus.
   - Füge den Code aus `main.js` in ein Skriptdateie ein.
   - Speichere die Datei.

2. **Einstellungen im `main.js`-Skript anpassen:**
   - Passe die `clubId` (Club-ID deines Vereins) und optional die `numberOfEntries` (Anzahl der anzuzeigenden Platzierungen pro Strecke) an.

3. **Trigger für automatische Aktualisierung einrichten:**
   - In Google Apps Script, öffne das `main.js`-Skript.
   - Klicke auf das Uhrsymbol (Trigger-Symbol) in der Symbolleiste.
   - Füge einen neuen Trigger hinzu, der die Funktion `main()` ausführt. Dies ermöglicht die automatische Aktualisierung der Bestenlisten.

4. **Manuelle Hinzufügung von All-Time Bestenlisten:**
   - Da der DSV nur Zugriff auf die Bestenlisten des aktuellen Jahres bietet, müssen All-Time Bestenlisten einmalig manuell in Google Sheets hinzugefügt werden.

5. **Anpassung der Formatierung in:**
   - Du kannst die Formatierung der Bestenlisten mit der Funktion `formatSheet()` anpassen. Diese Funktion kann beliebig oft ausgeführt werden und beeinflusst nur die Formatierung, nicht die Daten in den Zellen.

## Hinweise

- Stelle sicher, dass du die notwendigen Berechtigungen für den Zugriff auf Google Sheets und das Ausführen von Skripten erteilt hast.
- Um eine Überlastung des DSV-Servers zu verhindern, setze den Trigger nicht all zu oft.

## Nutzung

- Führe die Funktion `main()` im `main.js`-Skript aus, um die Bestenlisten zu aktualisieren.
- Die Funktion `formatSheet()` in `main.js` ermöglicht es dir, die Formatierung der Bestenlisten jederzeit zu überarbeiten.

Viel Spaß mit deinem automatisierten Bestenlisten-Aktualisierungsprogramm für deinen Schwimmverein! Ein Beispiel der Implementierung findet man auf https://www.wsg-wunstorf.de/bestenlisten
