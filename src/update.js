function doPost(e) {
    /**
     * Funktion, die bei einem POST-Request ausgeführt wird
     * Die Funktion aktualisiert die Bestenliste und gibt die neuen Daten als JSON zurück
     * @param {object} e - POST-Request
     * @returns {object} - Neue Daten als JSON
     */

    let requestData = JSON.parse(e.postData.contents); // Anfrage als JSON parsen
    let clubId = requestData.clubId; // Club-ID
    let data = requestData.data; // Daten
    let entriesPerDiscipline = requestData.entriesPerDiscipline; // Einträge pro Disziplin

    let leaderboard = new Leaderboard(clubId, data, parseInt(entriesPerDiscipline)); // Bestenliste erstellen
    leaderboard.extractResultsFromSheet(); // Übermittelten Ergebnisse extrahieren
    leaderboard.requestResults(); // Ergebnisse von der Datenbank anfordern
    leaderboard.adjustResults(); // Ergebnisse für die Anzeige vorbereiten
    let newData = leaderboard.results; // Neue Daten
    let newResults = leaderboard.newResults; // Ergebnisse, die neu dazu gekommen sind

    let payload = {
        data: newData,
        newResults: newResults
    };

    return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON); // Daten als JSON zurückgeben
}
