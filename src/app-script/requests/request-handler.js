class RequestHandler {
    /**
     * Scrapes swimming results for a given club from the DSV website (dsvdaten.dsv.de).
     *
     * The DSV site runs on ASP.NET WebForms, which requires a two-step HTTP sequence:
     * a GET request to load the page and extract the hidden __VIEWSTATE and
     * __EVENTVALIDATION tokens, followed by a POST that submits the filter form with
     * those tokens. Both User-Agent and Referer headers are required — the server
     * rejects requests that omit them.
     *
     * To avoid the DSV server's rate limiter (HTTP 429), the GET is performed only once
     * at the start of a full update run. Each POST response contains fresh VIEWSTATE and
     * EVENTVALIDATION values that are reused for the next POST, halving the total number
     * of HTTP requests. A fixed delay is inserted between POST requests, and a single
     * retry with a longer pause is attempted on a 429 response.
     *
     * Failures that would otherwise be invisible to the client (a 429 that persists after
     * the retry, or an unexpected error page) are collected as human-readable strings in
     * `warnings`. The Web App includes them in its JSON response so the user's bound script
     * can log them — the hosting account's execution log is not visible to users.
     *
     * Results are always scoped to the current calendar year because the DSV club page
     * does not expose multi-year filtering.
     *
     * @param {Leaderboard} leaderboard - Provides the club ID and list of disciplines,
     *   and receives fetched results via addResult().
     * @param {{requestDelayMs?: string|number, rateLimitRetryDelayMs?: string|number}} [config]
     *   Optional tuning forwarded from the request body: the pause between POSTs and the
     *   pause before retrying a 429. Blank, missing, or invalid values fall back to the
     *   defaults (1500ms and 12000ms).
     */
    constructor(leaderboard, config = {}) {
        this._leaderboard = leaderboard;
        this._clubId = leaderboard.clubId;
        this._url = `https://dsvdaten.dsv.de/Modules/Clubs/Club.aspx?ClubID=${this._clubId}`;
        this._year = new Date().getFullYear();
        // Pause between POST requests to stay under the DSV rate limit, and the longer pause
        // before retrying after a 429. Both are configurable via the request body so the delays
        // can be tuned without redeploying; blank/invalid values fall back to the defaults.
        this._requestDelayMs = this._resolveDelay(config.requestDelayMs, 1500);
        this._rateLimitRetryDelayMs = this._resolveDelay(config.rateLimitRetryDelayMs, 12000);
        this._warnings = [];
    }

    /**
     * Resolves a delay value coming from the request body. Blank, missing, or non-numeric
     * values (and negatives) fall back to the default so callers can omit the setting.
     *
     * @param {string|number} value - Raw value from the request config.
     * @param {number} fallback - Default used when value is empty or invalid.
     * @returns {number} Milliseconds to wait.
     */
    _resolveDelay(value, fallback) {
        let ms = parseInt(value, 10);
        return Number.isFinite(ms) && ms >= 0 ? ms : fallback;
    }

    /**
     * Problems encountered during this run (persistent rate limits, unexpected responses).
     * Returned to the client in the Web App response so failures show up in the user's
     * own execution log instead of only in the hosting account.
     *
     * @returns {string[]}
     */
    get warnings() {
        return this._warnings;
    }

    /**
     * Fetches results for every discipline matching the optional filter and adds them.
     *
     * One GET is performed at the start to obtain the initial session tokens. The VIEWSTATE
     * and EVENTVALIDATION returned by each POST are immediately reused for the next POST,
     * so no further GET requests are needed. A fixed delay between POSTs prevents the
     * rate limiter from triggering.
     *
     * The filter exists so callers can split a full update into several smaller runs that
     * each stay under the Apps Script 6-minute execution limit. Disciplines excluded by the
     * filter are not fetched — their existing sheet results pass through unchanged.
     *
     * All results carry newRecord=true so they can be identified after adjustResults()
     * trims each discipline to the top N.
     *
     * @param {{genders?: string[], strokes?: string[], lanes?: number[], distances?: (string|number)[]}} [filter]
     *   Each provided list restricts fetching to matching disciplines; omitted keys match everything.
     */
    requestResults(filter) {
        let disciplines = this._leaderboard.disciplines.filter(discipline => this._matchesFilter(discipline, filter));
        if (disciplines.length === 0) {
            Logger.log('No disciplines match the filter — nothing to fetch');
            return;
        }

        let pageHtml = this._getPage();
        let viewState = this._extractData(pageHtml, '__VIEWSTATE" value="', '" />');
        let eventValidation = this._extractData(pageHtml, '__EVENTVALIDATION" value="', '" />');

        if (!viewState || !eventValidation) {
            this._warnings.push('Initial GET returned no session tokens (likely rate limited or blocked by DSV) — no disciplines were fetched, existing sheet data is kept');
            return;
        }

        for (let i = 0; i < disciplines.length; i++) {
            let discipline = disciplines[i];
            Logger.log(discipline.gender + ' ' + (discipline.lane === 50 ? 'Langbahn' : 'Kurzbahn') + ' ' + discipline.distance + 'm ' + discipline.stroke);

            let { data, nextViewState, nextEventValidation, rateLimited } = this._fetchNewData(discipline, viewState, eventValidation);

            // A 429 that survives the retry will keep triggering — abort instead of burning
            // the remaining execution time. Unfetched disciplines keep their sheet data.
            if (rateLimited) {
                this._warnings.push('Rate limited by DSV (HTTP 429) despite retry at ' + discipline.toString() + ' — run aborted, ' + (disciplines.length - i) + ' discipline(s) not fetched, existing sheet data is kept');
                return;
            }

            // Fresh tokens from each POST response are valid for the next POST
            if (nextViewState) viewState = nextViewState;
            if (nextEventValidation) eventValidation = nextEventValidation;

            for (let result of data) {
                let person = new Person(result.name, result.birthYear);
                let time = new Time(result.time);
                let date = new CalendarDate(result.date);
                let newResult = new Result(person, time, result.location, date, true);
                this._leaderboard.addResult(newResult, discipline.uid);
            }

            Utilities.sleep(this._requestDelayMs);
        }
    }

    /**
     * Checks whether a discipline passes the filter. Every provided (non-empty) list must
     * contain the discipline's corresponding attribute. No filter or an empty object matches
     * every discipline, so requests without a filter still perform a full update.
     *
     * Lanes and distances are compared as strings because distances arrive as strings from
     * the DISCIPLINES config while callers may pass numbers.
     *
     * @param {Discipline} discipline
     * @param {{genders?: string[], strokes?: string[], lanes?: number[], distances?: (string|number)[]}} [filter]
     * @returns {boolean}
     */
    _matchesFilter(discipline, filter) {
        if (!filter) return true;
        if (filter.genders && filter.genders.length > 0 && !filter.genders.includes(discipline.gender)) return false;
        if (filter.strokes && filter.strokes.length > 0 && !filter.strokes.includes(discipline.stroke)) return false;
        if (filter.lanes && filter.lanes.length > 0 && !filter.lanes.map(String).includes(String(discipline.lane))) return false;
        if (filter.distances && filter.distances.length > 0 && !filter.distances.map(String).includes(String(discipline.distance))) return false;
        return true;
    }

    /**
     * Loads the club page with a GET request and returns the raw HTML.
     * Used once per update run to obtain the initial VIEWSTATE and EVENTVALIDATION tokens.
     *
     * @returns {string} Raw HTML of the club page.
     */
    _getPage() {
        let response = UrlFetchApp.fetch(this._url, {
            method: "get",
            headers: {
                "User-Agent": "Mozilla/5.0", // required — server rejects requests without a browser UA
                "sec-fetch-site": "same-origin", // must be set manually; UrlFetchApp does not send this by default
                "Referer": "https://dsvdaten.dsv.de/Modules/Clubs/Search.aspx", // required — server validates the referer
            },
            followRedirects: false,
            muteHttpExceptions: true
        });
        return response.getContentText();
    }

    /**
     * POSTs the filter form for one discipline and returns the parsed results alongside
     * fresh session tokens extracted from the response.
     *
     * The VIEWSTATE and EVENTVALIDATION embedded in every ASP.NET WebForms response are
     * returned so that requestResults() can pass them directly to the next call, avoiding
     * a GET round-trip per discipline.
     *
     * If the server responds with HTTP 429 (rate limit exceeded), the request is retried
     * once after a 5-second pause. If the retry is also rate limited, `rateLimited: true`
     * is returned so the caller can abort the run. Any other non-200 response (or a page
     * without a VIEWSTATE, i.e. an error page) records a warning and yields no results;
     * empty tokens are returned so the caller keeps the previous, still-valid ones.
     *
     * @param {Discipline} discipline
     * @param {string} viewState - Token from the previous GET or POST response.
     * @param {string} eventValidation - Token from the previous GET or POST response.
     * @returns {{ data: Array, nextViewState: string, nextEventValidation: string, rateLimited?: boolean }}
     */
    _fetchNewData(discipline, viewState, eventValidation) {
        let payload = {
            "ClubID": this._clubId,
            "__EVENTTARGET": "ctl00$ContentSection$_rankingsButton",
            "__VIEWSTATE": viewState,
            "__EVENTVALIDATION": eventValidation,
            "ctl00$ContentSection$_genderRadioButtonList": discipline.gender.substring(0, 1),
            "ctl00$ContentSection$_courseRadioButtonList": (discipline.lane === LANES.LONG_COURSE) ? "L" : "S",
            "ctl00$ContentSection$_eventDropDownList": `${discipline.distance + discipline.stroke.substring(0, 1)}|GL`,
            "ctl00$ContentSection$_timerangeDropDownList": `01.01.${this._year}|31.12.${this._year}`
        };

        let response = UrlFetchApp.fetch(this._url, {
            method: "post",
            payload: payload,
            muteHttpExceptions: true
        });

        if (response.getResponseCode() === 429) {
            Logger.log('Rate limited (429) — waiting ' + this._rateLimitRetryDelayMs + 'ms before retry');
            Utilities.sleep(this._rateLimitRetryDelayMs);
            response = UrlFetchApp.fetch(this._url, {
                method: "post",
                payload: payload,
                muteHttpExceptions: true
            });
        }

        let responseCode = response.getResponseCode();
        if (responseCode === 429) {
            Logger.log('Still rate limited (429) after retry');
            return { data: [], nextViewState: '', nextEventValidation: '', rateLimited: true };
        }

        let responseText = response.getContentText();
        // ASP.NET WebForms embeds fresh tokens in every regular response page; a page
        // without them is an error page whose content must not be parsed for results
        let nextViewState = this._extractData(responseText, '__VIEWSTATE" value="', '" />');
        let nextEventValidation = this._extractData(responseText, '__EVENTVALIDATION" value="', '" />');

        if (responseCode !== 200 || !nextViewState || !nextEventValidation) {
            this._warnings.push('Unexpected response (HTTP ' + responseCode + ') for ' + discipline.toString() + ' — discipline skipped, existing sheet data is kept');
            return { data: [], nextViewState: '', nextEventValidation: '' };
        }

        let content = this._extractData(responseText, 'class="table table-sm table-stripe"', '</table>');

        let rows = this._splitElement(content, '<tr>', '</tr>');
        rows.shift(); // remove the empty fragment before the first <tr>
        rows.shift(); // remove the table header row

        return {
            data: this._convertToArray(rows),
            nextViewState: nextViewState,
            nextEventValidation: nextEventValidation
        };
    }

    /**
     * Extracts the first substring between `begin` and `end` within `context`.
     * Used to pull ViewState tokens and the results table out of raw HTML.
     * Returns an empty string if either delimiter is not found — callers rely on this
     * to detect error pages instead of receiving garbage substrings.
     *
     * @param {string} context - Raw HTML to search in.
     * @param {string} begin - Start delimiter, not included in the result.
     * @param {string} end - End delimiter, not included in the result.
     * @returns {string}
     */
    _extractData(context, begin, end) {
        let startIndex = context.indexOf(begin);
        if (startIndex === -1) return '';
        let endIndex = context.indexOf(end, startIndex + begin.length);
        if (endIndex === -1) return '';
        return context.substring(startIndex + begin.length, endIndex);
    }

    /**
     * Splits `input` on every occurrence of `begin` and discards everything after `end`
     * in each fragment, producing a flat array of the content between each begin/end pair.
     * The first element is always the content before the first `begin` occurrence (usually empty).
     *
     * @param {string} input
     * @param {string} begin
     * @param {string} end
     * @returns {string[]}
     */
    _splitElement(input, begin, end) {
        return input.split(begin).map(element => element.split(end)[0]);
    }

    /**
     * Maps raw HTML table row fragments to plain result objects.
     * The DSV results table has 8 columns; rank (index 1) and pool size (index 5)
     * are skipped via destructuring — only the 6 meaningful fields are returned.
     *
     * @param {string[]} elements - One HTML fragment per table row, from _splitElement.
     * @returns {Array<{name: string, time: string, birthYear: string, location: string, date: string}>}
     */
    _convertToArray(elements) {
        return elements.map(element => {
            let [, position, name, birthYear, time, , location, date] = this._splitElement(element, '<td>', '</td>');
            return {name, time, birthYear, location, date: date};
        });
    }
}
