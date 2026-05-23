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
     * Results are always scoped to the current calendar year because the DSV club page
     * does not expose multi-year filtering.
     *
     * @param {Leaderboard} leaderboard - Provides the club ID and list of disciplines,
     *   and receives fetched results via addResult().
     */
    constructor(leaderboard) {
        this._leaderboard = leaderboard;
        this._clubId = leaderboard.clubId;
        this._url = `https://dsvdaten.dsv.de/Modules/Clubs/Club.aspx?ClubID=${this._clubId}`;
        this._year = new Date().getFullYear();
    }

    /**
     * Fetches results for every discipline in the leaderboard and adds them.
     * All results created here carry newRecord=true so they can be identified as
     * new entries after adjustResults() trims each discipline to the top N.
     */
    requestResults() {
        for (let discipline of this._leaderboard.disciplines) {
            let data = this._fetchNewData(discipline);
            for (let i = 0; i < data.length; i++) {
                let result = data[i];
                let person = new Person(result.name, result.birthYear);
                let time = new Time(result.time);
                let date = new CalendarDate(result.date);
                let location = result.location;
                let newResult = new Result(person, time, location, date, true);
                this._leaderboard.addResult(newResult, discipline.uid);
            }
        }
    }

    /**
     * Performs the two-step HTTP scrape for one discipline:
     *   1. GET the club page to extract __VIEWSTATE and __EVENTVALIDATION tokens.
     *   2. POST the filter form with discipline parameters to receive the results table.
     *
     * The event dropdown value encodes distance and the first letter of the stroke name
     * (e.g. "50F|GL" for 50m Freestyle). The time range is fixed to the full current year.
     *
     * @param {Discipline} discipline - The discipline to fetch results for.
     * @returns {Array<{name: string, time: string, birthYear: string, location: string, date: string}>}
     */
    _fetchNewData(discipline) {
        let loginResponse = UrlFetchApp.fetch(this._url, {
            method: "get",
            headers: {
                "User-Agent": "Mozilla/5.0", // required — server rejects requests without a browser UA
                "sec-fetch-site": "same-origin", // must be set manually; UrlFetchApp does not send this by default
                "Referer": "https://dsvdaten.dsv.de/Modules/Clubs/Search.aspx", // required — server validates the referer
            },
            followRedirects: false,
            muteHttpExceptions: true
        });

        let loginContext = loginResponse.getContentText();

        let viewState = this._extractData(loginContext, '__VIEWSTATE" value="', '" />');
        let eventValidation = this._extractData(loginContext, '__EVENTVALIDATION" value="', '" />');

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

        let options = {
            method: "post",
            payload: payload
        };

        Logger.log(discipline.gender + " " + (discipline.lane === 50 ? "Langbahn" : "Kurzbahn") + " " + discipline.distance + "m " + discipline.stroke);

        let response = UrlFetchApp.fetch(this._url, options);

        let content = this._extractData(response.getContentText(), 'class="table table-sm table-stripe"', '</table>');

        let contentArray = this._splitElement(content, '<tr>', '</tr>');
        contentArray.shift(); // remove the empty fragment before the first <tr>
        contentArray.shift(); // remove the table header row

        return this._convertToArray(contentArray);
    }

    /**
     * Extracts the first substring between `begin` and `end` within `context`.
     * Used to pull ViewState tokens and the results table out of raw HTML.
     * Returns an empty string if `begin` is not found.
     *
     * @param {string} context - Raw HTML to search in.
     * @param {string} begin - Start delimiter, not included in the result.
     * @param {string} end - End delimiter, not included in the result.
     * @returns {string}
     */
    _extractData(context, begin, end) {
        let startIndex = context.indexOf(begin);
        let endIndex = context.indexOf(end, startIndex);
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
