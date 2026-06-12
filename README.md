# Vereinsbestenlisten – automatisch aktualisiert

[🇬🇧 English version](README_en.md)

> Hält die Bestenlisten deines Schwimmvereins automatisch auf dem neuesten Stand –  
> direkt aus den offiziellen Daten des Deutschen Schwimm-Verbands (DSV).

Ein Beispiel der fertigen Implementierung: [www.wsg-wunstorf.de/bestenlisten](https://www.wsg-wunstorf.de/bestenlisten)

---

## Was macht dieses Projekt?

Das Projekt besteht aus zwei unabhängigen Teilen, die sich auch einzeln nutzen lassen:

**Teil 1 – Bestenlisten in Google Sheets**  
Ein Skript liest regelmäßig die aktuellen Vereinsergebnisse vom DSV-Portal ab und trägt sie automatisch in eine
Google-Tabelle ein. Die Tabelle enthält die besten Zeiten aller Disziplinen, sortiert nach Lage, Bahnlänge und
Geschlecht – sowohl für das aktuelle Jahr als auch für die All-Time-Wertung.

**Teil 2 – Bestenlisten auf der Vereinswebsite** *(optional)*  
Die befüllte Tabelle lässt sich mit wenigen Schritten auf der Vereinswebsite einbinden. Besucher können dort die Ansicht
nach Saison, Lage, Bahnlänge und Geschlecht filtern.

---

## Voraussetzungen

- Ein **Google-Konto** (kostenlos)
- Die **Club-ID** deines Vereins beim DSV

### Wo finde ich meine Club-ID?

1. Öffne [dsv.de](https://www.dsv.de/de/leistungs--und-wettkampfsport/schwimmen/wettkampf-regional/vereine/) und suche nach deinem Verein.
2. Klicke auf den Vereinsnamen, um die Vereinsseite zu öffnen.
3. Die Club-ID steht in der URL der Seite hinter `ClubID=`:  
   `…/Club.aspx?ClubID=`**7985**

---

## Teil 1 – Google Sheets Bestenliste einrichten

### Schritt 1 – Neue Google-Tabelle erstellen

1. Öffne [Google Sheets](https://sheets.google.com) und erstelle eine neue leere Tabelle.
2. Gib ihr einen Namen, z. B. *„Vereinsbestenlisten"*.

---

### Schritt 2 – Skript einfügen

1. Klicke in Google Sheets oben auf **Erweiterungen → Apps Script**.  
   Ein neues Fenster mit dem Skripteditor öffnet sich.
2. Lösche den gesamten vorhandenen Code im Editor.
3. Öffne die Datei [`main.js`](main.js) aus diesem Repository und kopiere den vollständigen Inhalt.
4. Füge den Code in den Editor ein und speichere mit **Strg + S** (Mac: **⌘ + S**).

---

### Schritt 3 – Club-ID eintragen

Suche am Anfang des Skripts diese Zeile und trage deine Club-ID ein:

```js
const clubId = 7985  // ← hier deine Club-ID eintragen
```

Optional kannst du außerdem die Anzahl der angezeigten Plätze pro Disziplin anpassen:

```js
const numberOfEntries = 5  // Wie viele Plätze pro Strecke angezeigt werden sollen
```

---

### Schritt 4 – Tabelle zum ersten Mal befüllen

1. Wähle im Skripteditor oben in der Funktionsauswahl **`updateAllTime`** aus und klicke auf das **Ausführen-Symbol (▶)
   **.
2. Beim ersten Ausführen erscheint eine Berechtigungsabfrage von Google – klicke auf **„Zulassen"**. Das Skript benötigt
   nur Zugriff auf deine eigene Tabelle.
3. Nach Abschluss erscheint in deiner Tabelle ein neues Blatt namens **„All-Time"** mit der vollständigen
   Disziplinstruktur und den aktuellen Jahresergebnissen.

Für eine separate **Saisonbestenliste** des aktuellen Jahres führe zusätzlich **`updateSeason`** aus. Dabei wird
automatisch ein Blatt mit dem aktuellen Jahr als Name angelegt (z. B. „2026").

> **Hinweis:** Das DSV-Portal stellt nur Ergebnisse des laufenden Jahres zur Verfügung. Ältere Ergebnisse für die
> All-Time-Wertung müssen einmalig von Hand eingetragen werden (→ nächster Schritt).

---

### Schritt 5 – Historische Ergebnisse eintragen *(einmalig, nur für All-Time)*

Da das DSV keine Archivdaten bereitstellt, müssen vergangene Jahresergebnisse für die All-Time-Bestenliste einmalig
manuell ergänzt werden:

1. Trage ältere Zeiten direkt in die passenden Zeilen der Tabelle ein.
2. **Wichtig:** Verändere die Spaltenstruktur nicht – besonders die Kürzel in Spalte A und H dürfen nicht gelöscht oder
   überschrieben werden, da das Skript sie zur Zuordnung der Ergebnisse benötigt.
3. Ab der nächsten Ausführung aktualisiert das Skript alle Einträge automatisch.

---

### Schritt 6 – Automatische Aktualisierung einrichten *(optional)*

Damit die Bestenlisten täglich ohne manuellen Eingriff aktualisiert werden:

1. Klicke im Skripteditor links in der Seitenleiste auf das **Uhrsymbol (Trigger)**.
2. Klicke unten rechts auf **„+ Trigger hinzufügen"**.
3. Wähle als Funktion **`updateAllTime`** und als Ereignistyp **„Zeitgesteuert"** → **„Täglich"**.
4. Klicke auf **„Speichern"**.

Für die Saisonbestenliste kann auf dieselbe Weise ein zweiter Trigger für **`updateSeason`** eingerichtet werden.

---

## Teil 2 – Bestenlisten auf der Website einbinden *(optional)*

### Schritt 1 – Tabelle als öffentlichen Link bereitstellen

Für jedes Blatt, das auf der Website erscheinen soll, wird ein öffentlicher Link benötigt:

1. Öffne in Google Sheets **Datei → Freigeben → Im Web veröffentlichen**.
2. Wähle das gewünschte Blatt (z. B. „All-Time" oder „2024") und als Format **„Tabulatorgetrennte Werte (.tsv)"**.
3. Klicke auf **„Veröffentlichen"** und kopiere den Link.
4. Wiederhole diesen Schritt für alle weiteren Blätter.

---

### Schritt 2 – Links in die HTML-Datei eintragen

1. Öffne [`index.html`](index.html) aus diesem Repository.
2. Suche den Abschnitt `const KEYS = { ... }` und trage die kopierten Links ein:

```js
const KEYS = {
    'All-Time': {
        'name': 'All-Time',  // Dieser Name darf nicht geändert werden
        'link': 'DEIN_LINK_ZUM_ALL-TIME-BLATT'
    },
    '2024': {
        'name': '2024',
        'link': 'DEIN_LINK_ZUM_2024-BLATT'
    }
    // Weitere Saisons nach demselben Muster ergänzen
}
```

3. Optional: Passe Farben und Aussehen im Abschnitt `const SETTINGS = { ... }` an (direkt darüber im Code).

---

### Schritt 3 – In die Website einbinden

Binde `index.html` in deine Website ein oder öffne sie direkt im Browser, um das Ergebnis zu prüfen.

---

## Einstellungen

### Skript (`main.js`)

| Einstellung            | Standard | Beschreibung                                     |
|------------------------|----------|--------------------------------------------------|
| `clubId`               | `7985`   | Club-ID deines Vereins beim DSV                  |
| `numberOfEntries`      | `5`      | Anzahl der angezeigten Plätze pro Disziplin      |
| `formatSheetEveryTime` | `true`   | Tabelle bei jeder Aktualisierung neu formatieren |

Farben, Spaltenbreiten und Zeilenhöhen lassen sich über das `FORMAT`-Objekt am Ende von `main.js` anpassen.

### Website (`index.html`)

| Einstellung           | Standard    | Beschreibung                        |
|-----------------------|-------------|-------------------------------------|
| `SHOW_STATISTICS`     | `true`      | Statistik-Bereich ein-/ausblenden   |
| `ROUNDED_CORNERS`     | `true`      | Abgerundete Ecken                   |
| `TRANSITION_DURATION` | `'0.3s'`    | Dauer der Übergangsanimationen      |
| `PRIMARY_COLOR`       | `'#31353E'` | Hauptfarbe (Buttons, Überschriften) |
| `PRIMARY_BACKGROUND`  | `'#f3f3f3'` | Hintergrundfarbe der Seite          |

---

## Häufige Fragen

**Ich finde meine Club-ID nicht.**  
Suche deinen Verein auf [dsvdaten.dsv.de](https://dsvdaten.dsv.de/Modules/Clubs/Search.aspx). Die Club-ID steht in der
URL der Vereinsseite hinter `ClubID=`.

**Die Tabelle bleibt nach dem Ausführen leer.**  
Überprüfe, ob die eingetragene `clubId` korrekt ist. Im Skripteditor unter **Ausführungen** kannst du die Protokolle
einsehen und mögliche Fehlermeldungen nachlesen.

**Darf ich die Tabelle nach der Einrichtung manuell bearbeiten?**  
Ja – Einträge ergänzen und korrigieren ist jederzeit möglich. Die Kürzel in Spalte A und H sowie die Gesamtstruktur der
Spalten sollten jedoch nicht verändert werden, da das Skript sie zur Ergebniszuordnung benötigt.

**Warum erscheinen keine Ergebnisse aus vergangenen Jahren?**  
Das DSV stellt nur Ergebnisse des laufenden Jahres bereit. Ältere Daten für die All-Time-Wertung müssen einmalig manuell
eingetragen werden (→ Schritt 5).

**Das Skript fragt nach Berechtigungen – ist das sicher?**  
Ja. Das Skript läuft ausschließlich in deinem Google-Konto und greift nur auf die Tabelle zu, in der es eingebunden ist.
Die Berechtigungsabfrage ist ein normaler Schritt bei Google Apps Script.

**Wie oft sollte der Trigger ausgeführt werden?**  
Täglich ist in der Regel ausreichend. Um den DSV-Server nicht unnötig zu belasten, sollte der Trigger nicht häufiger als
stündlich eingestellt werden.

---

## Weiterführende Dokumentation

Für Entwickler und technisch Interessierte gibt es ausführliche Hintergrunddokumente:

| Dokument                                 | Inhalt                                                        |
|------------------------------------------|---------------------------------------------------------------|
| [Architektur](docs/architecture.md)      | Zweischichtiges Design, Komponentenübersicht, `eval()`-Muster |
| [Datenmodell](docs/data-model.md)        | Alle Domain-Klassen und ihre Beziehungen                      |
| [Pipeline](docs/pipeline.md)             | Schrittweise Beschreibung einer Bestenlisten-Aktualisierung   |
| [Tabellenstruktur](docs/sheet-layout.md) | Spalten- und Zeilenaufbau der Google-Tabelle                  |
| [DSV-Datenabruf](docs/dsv-scraping.md)   | Wie Ergebnisse vom DSV-Portal abgerufen werden                |
| [Tests](docs/testing.md)                 | Node.js-Testsuite – Einrichtung und Verwendung                |

