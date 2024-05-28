const DEFAULT_SETTINGS = {
    SHOW_STATISTICS: true,
    PRIMARY_COLOR: '#31353E',
    SECONDARY_COLOR: '#424959',
    TERTIARY_COLOR: '#f2f4ef',
    CONTRAST_COLOR: '#ffffff',
    PRIMARY_BACKGROUND: '#f3f3f3',
    SECONDARY_BACKGROUND: '#ffffff'
}

function replaceHtmlContent(htmlContent, keys, settings) {
    /**
     * Ersetzt die Placeholder im HTML-Code durch die eingestellten Werte
     */

    // Replace die Platzhalter für die Anzeige der Statistiken
    htmlContent = htmlContent.replace('<!-- KEYS_PLACEHOLDER -->', JSON.stringify(keys));
    // Replace die Platzhalter für die Anzeige der Statistiken
    htmlContent = htmlContent.replace('<!-- DROPDOWN_LIST_TOP_PLACEHOLDER -->', settings.SHOW_STATISTICS ? '144px' : '76px');
    htmlContent = htmlContent.replace('<!-- SELECTION_BUTTON_LIST_DISPLAY_PLACEHOLDER -->', settings.SHOW_STATISTICS ? 'flex' : 'none');
    // Replace die Platzhalter für die Farben
    htmlContent = htmlContent.replace('<!-- PRIMARY_COLOR_PLACEHOLDER -->', settings.PRIMARY_COLOR);
    htmlContent = htmlContent.replace('<!-- SECONDARY_COLOR_PLACEHOLDER -->', settings.SECONDARY_COLOR);
    htmlContent = htmlContent.replace('<!-- TERTIARY_COLOR_PLACEHOLDER -->', settings.TERTIARY_COLOR);
    htmlContent = htmlContent.replace('<!-- CONTRAST_COLOR_PLACEHOLDER -->', settings.CONTRAST_COLOR);
    htmlContent = htmlContent.replace('<!-- PRIMARY_BACKGROUND_PLACEHOLDER -->', settings.PRIMARY_BACKGROUND);
    htmlContent = htmlContent.replace('<!-- SECONDARY_BACKGROUND_PLACEHOLDER -->', settings.SECONDARY_BACKGROUND);

    return htmlContent; // Gib den HTML-Code zurück
}

async function loadHtmlContent(keys, settings) {
    /**
     * Lädt den HTML-Inhalt von einer URL
     * @param {object} keys - Schlüssel-Wert-Paare (für die Saisons)
     * @returns {string} - HTML-Inhalt
     * @throws {Error} - Fehlermeldung, wenn der Netzwerk-Response nicht erfolgreich war
     * @throws {Error} - Fehlermeldung, wenn es ein Problem mit dem Fetch-Vorgang gab
     */

    for (const key in DEFAULT_SETTINGS) {
        if (!settings.hasOwnProperty(key)) {
            settings[key] = DEFAULT_SETTINGS[key];
        }
    }

    try {
        let response = await fetch('https://raw.githubusercontent.com/nilskntl/dsv-club-leaderboards/master/src/website/index.html');
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return replaceHtmlContent(await response.text(), keys, settings);
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
