let DEFAULT_SETTINGS = {
    SHOW_STATISTICS: true,
    ROUNDED_CORNERS: true,
    TRANSITION_DURATION: '0.3s',
    PRIMARY_COLOR: '#31353E',
    SECONDARY_COLOR: '#424959',
    TERTIARY_COLOR: '#f2f4ef',
    CONTRAST_COLOR: '#ffffff',
    PRIMARY_BACKGROUND: '#f3f3f3',
    SECONDARY_BACKGROUND: '#ffffff'
}

/**
 * Substitutes all template placeholders in the HTML string with values derived
 * from `keys` and `settings`. Placeholders are HTML comments (e.g. <!-- PRIMARY_COLOR_PLACEHOLDER -->)
 * so they are inert if the substitution is skipped.
 *
 * The SHOW_STATISTICS flag controls both the dropdown top offset and the visibility
 * of the statistics button row — both must change together to keep the layout consistent.
 *
 * @param {string} htmlContent - Raw HTML fetched from GitHub.
 * @param {object} keys - Season/tab key-value pairs injected as a JSON literal.
 * @param {object} settings - Resolved settings (already merged with DEFAULT_SETTINGS).
 * @returns {string} HTML with all placeholders replaced.
 */
function replaceHtmlContent(htmlContent, keys, settings) {
    htmlContent = htmlContent.replace('<!-- KEYS_PLACEHOLDER -->', JSON.stringify(keys));
    htmlContent = htmlContent.replace('<!-- DROPDOWN_LIST_TOP_PLACEHOLDER -->', settings.SHOW_STATISTICS ? '144px' : '76px');
    htmlContent = htmlContent.replace('<!-- SELECTION_BUTTON_LIST_DISPLAY_PLACEHOLDER -->', settings.SHOW_STATISTICS ? 'flex' : 'none');
    htmlContent = htmlContent.replace('<!-- PRIMARY_COLOR_PLACEHOLDER -->', settings.PRIMARY_COLOR);
    htmlContent = htmlContent.replace('<!-- SECONDARY_COLOR_PLACEHOLDER -->', settings.SECONDARY_COLOR);
    htmlContent = htmlContent.replace('<!-- TERTIARY_COLOR_PLACEHOLDER -->', settings.TERTIARY_COLOR);
    htmlContent = htmlContent.replace('<!-- CONTRAST_COLOR_PLACEHOLDER -->', settings.CONTRAST_COLOR);
    htmlContent = htmlContent.replace('<!-- PRIMARY_BACKGROUND_PLACEHOLDER -->', settings.PRIMARY_BACKGROUND);
    htmlContent = htmlContent.replace('<!-- SECONDARY_BACKGROUND_PLACEHOLDER -->', settings.SECONDARY_BACKGROUND);
    htmlContent = htmlContent.replace('<!-- ROUNDED_CORNERS_PLACEHOLDER -->', settings.ROUNDED_CORNERS ? '8px' : '0');
    htmlContent = htmlContent.replace('<!-- TRANSITION_DURATION_PLACEHOLDER -->', settings.TRANSITION_DURATION);

    return htmlContent;
}

/**
 * Fetches the leaderboard HTML from GitHub, merges caller-supplied settings with
 * DEFAULT_SETTINGS, and returns the fully substituted HTML string.
 *
 * Settings are merged by overwriting DEFAULT_SETTINGS keys — unknown keys in
 * `settings` are silently ignored so callers cannot accidentally break the layout
 * by passing extra properties.
 *
 * The HTML is fetched from GitHub rather than bundled locally so that UI updates
 * can be deployed centrally without requiring users to update their embedding page.
 *
 * @param {object} keys - Season/tab identifiers passed through to replaceHtmlContent.
 * @param {object} settings - Partial settings object; unrecognised keys are ignored.
 * @returns {Promise<string>} Fully substituted HTML, ready to be written into an iframe.
 */
async function loadHtmlContent(keys, settings) {
    for (let key in settings) {
        try {
            DEFAULT_SETTINGS[key] = settings[key];
        } catch (ignore) {
        }
    }
    settings = DEFAULT_SETTINGS;

    try {
        let response = await fetch('https://raw.githubusercontent.com/nilskntl/dsv-club-leaderboards/refs/tags/1.2.0/src/website/index.html');
        if (response.ok) {
            return replaceHtmlContent(await response.text(), keys, settings);
        } else {
            return new Error('Network response was not ok');
        }
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

/**
 * Writes HTML content into an iframe identified by `frameId` using document.write().
 *
 * document.write() is used intentionally here — the iframe is treated as a full
 * self-contained document, not a component, so src-based loading is not applicable.
 *
 * @param {string} frameId - The id attribute of the target iframe element.
 * @param {string} htmlContent - Fully substituted HTML from loadHtmlContent().
 */
function insertHtmlIntoContainer(frameId, htmlContent) {
    let frame = document.getElementById(frameId);
    let doc = frame.contentDocument || frame.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();
}
