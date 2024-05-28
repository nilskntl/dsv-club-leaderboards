async function loadHtmlContent(keys, showStatistics) {
    /**
     * Lädt den HTML-Inhalt von einer URL
     * @param {object} keys - Schlüssel-Wert-Paare (für die Saisons)
     * @returns {string} - HTML-Inhalt
     * @throws {Error} - Fehlermeldung, wenn der Netzwerk-Response nicht erfolgreich war
     * @throws {Error} - Fehlermeldung, wenn es ein Problem mit dem Fetch-Vorgang gab
     */

    if (showStatistics === undefined || showStatistics === null) showStatistics = true;

    try {
        let response = await fetch('https://raw.githubusercontent.com/nilskntl/dsv-club-leaderboards/master/src/website/index.html');
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        let htmlContent = await response.text();
        // Replace die Keys im HTML-Inhalt
        htmlContent = htmlContent.replace('<!-- KEYS_PLACEHOLDER -->', JSON.stringify(keys));
        // Replace die Platzhalter für die Anzeige der Statistiken
        htmlContent = htmlContent.replace('<!-- DROPDOWN_LIST_TOP_PLACEHOLDER -->', showStatistics ? '144px' : '76px');
        htmlContent = htmlContent.replace('<!-- SELECTION_BUTTON_LIST_DISPLAY_PLACEHOLDER -->', showStatistics ? 'flex' : 'none');
        return htmlContent;
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

function insertHtmlIntoContainer(frameId, htmlContent) {
    /**
     * Fügt den HTML-Inhalt in ein Html Element ein
     * @param {string} frameId - ID des iFrames
     * @param {string} htmlContent - HTML-Inhalt
     */

    let frame = document.getElementById(frameId);
    let doc = frame.contentDocument || frame.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();
}
