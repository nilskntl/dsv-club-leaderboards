async function loadHtmlContent() {
    /**
     * Lädt den HTML-Inhalt von einer URL
     * @returns {string} - HTML-Inhalt
     * @throws {Error} - Fehlermeldung, wenn der Netzwerk-Response nicht erfolgreich war
     * @throws {Error} - Fehlermeldung, wenn es ein Problem mit dem Fetch-Vorgang gab
     */

    try {
        let response = await fetch('https://raw.githubusercontent.com/nilskntl/dsv-club-leaderboards/master/src/website/index.html');
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return await response.text();
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

function insertHtmlIntoContainer(container, htmlContent) {
    /**
     * Fügt den HTML-Inhalt in ein Html Element ein
     * @param {HTMLElement} container - Container
     * @param {string} htmlContent - HTML-Inhalt
     */

    let doc = container.contentDocument || container.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();
}