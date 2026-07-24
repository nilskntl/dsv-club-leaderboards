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
 * The placeholder value shipped in the example KEYS. If it survives into a real
 * embed the user forgot to paste their own published-sheet TSV links, so the
 * affected season has no data to load.
 */
const LINK_PLACEHOLDER = 'LINK_TO_YOUR_SHEET_AS_TSV_FILE';

/**
 * Builds a minimal, self-contained HTML document shown inside the iframe when the
 * leaderboard cannot be loaded. Keeping the failure visible on the page (instead
 * of a blank or "undefined" frame) makes misconfiguration obvious, while the full
 * details are also written to the console.
 *
 * @param {string} message - Human-readable, already plain-text explanation.
 * @returns {string} A complete HTML document string.
 */
function buildErrorDocument(message) {
    return '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">'
        + '<style>body{font-family:sans-serif;color:#31353E;padding:16px;line-height:1.5}</style>'
        + '</head><body><p><strong>The leaderboard could not be loaded.</strong></p>'
        + '<p>' + message + '</p></body></html>';
}

/**
 * Returns the names of the KEYS entries whose 'link' is missing or still the
 * shipped placeholder. Such entries would fetch a non-URL and fail later with an
 * opaque error, so callers can warn about them before attempting to load anything.
 *
 * @param {object} keys - Season/tab identifiers as passed to loadHtmlContent.
 * @returns {string[]} Key names that are not configured.
 */
function findUnconfiguredKeys(keys) {
    let unconfigured = [];
    for (let key in keys) {
        let entry = keys[key];
        if (!entry || !entry.link || entry.link === LINK_PLACEHOLDER) {
            unconfigured.push(key);
        }
    }
    return unconfigured;
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
 * Error handling: this function never rejects and never propagates an error to the
 * caller. Any problem (leftover KEYS placeholders, GitHub non-200, network failure)
 * is logged to the console and turned into a readable error document so the iframe
 * shows *why* it failed instead of breaking the embedding page.
 *
 * @param {object} keys - Season/tab identifiers passed through to replaceHtmlContent.
 * @param {object} settings - Partial settings object; unrecognised keys are ignored.
 * @returns {Promise<string>} Substituted HTML, or an error document — always a valid HTML string.
 */
async function loadHtmlContent(keys, settings) {
    for (let key in settings) {
        try {
            DEFAULT_SETTINGS[key] = settings[key];
        } catch (ignore) {
        }
    }
    settings = DEFAULT_SETTINGS;

    /*
     * The most common misconfiguration: the example KEYS were pasted but the
     * placeholder links were never replaced. Warn per-key, and abort with a
     * readable message only if *nothing* is configured — a partially configured
     * KEYS (some seasons ready, others not) should still render.
     */
    let keyNames = Object.keys(keys || {});
    let unconfigured = findUnconfiguredKeys(keys);
    if (unconfigured.length > 0) {
        console.warn('[loadHtmlContent] These entries still point to the placeholder "'
            + LINK_PLACEHOLDER + '" and are not configured: ' + unconfigured.join(', ')
            + '. Replace the link with your Google Sheet published as a TSV file.');
    }
    if (keyNames.length === 0 || unconfigured.length === keyNames.length) {
        let message = 'No sheet links have been configured yet. Replace "' + LINK_PLACEHOLDER
            + '" in KEYS with your Google Sheets links published as TSV files.';
        console.error('[loadHtmlContent] ' + message);
        return buildErrorDocument(message);
    }

    try {
        let response = await fetch('https://raw.githubusercontent.com/nilskntl/dsv-club-leaderboards/refs/heads/feature/rework-table/src/website/index.html');
        if (!response.ok) {
            let message = 'The leaderboard template could not be loaded from GitHub (HTTP '
                + response.status + ').';
            console.error('[loadHtmlContent] ' + message);
            return buildErrorDocument(message);
        }
        return replaceHtmlContent(await response.text(), keys, settings);
    } catch (error) {
        let message = 'A network error occurred while loading the leaderboard template.';
        console.error('[loadHtmlContent] ' + message, error);
        return buildErrorDocument(message);
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
