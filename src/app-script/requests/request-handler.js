class RequestHandler {
    /**
     * Handles requests to the DSV database
     * @param {Leaderboard} leaderboard - Leaderboard
     * @property {Leaderboard} _leaderboard - Leaderboard
     * @property {string} _clubId - Club ID
     * @property {string} _url - URL of the DSV database
     * @property {number} _year - Year of the season
     * @method requestResults - Requests new results from the DSV database
     * @method _fetchNewData - Fetches new data from the DSV database
     * @method _extractData - Extracts data from the raw HTML
     * @method _splitElement - Splits elements into a one-dimensional array based on a begin and end string
     * @method _convertToArray - Converts elements to an array
     */

    constructor(leaderboard) {
        this._leaderboard = leaderboard;
        this._clubId = leaderboard.clubId;
        this._url = `https://dsvdaten.dsv.de/Modules/Clubs/Club.aspx?ClubID=${this._clubId}`;
        this._year = new Date().getFullYear();
        if (new Date().getUTCMonth() >= 6) {
            this._year += 1; // A new season has started, so the year is incremented
        }
    }

    requestResults() {
        /**
         * Fragt neue Daten von der Datenbank des DSV an und fügt sie zur Bestenliste hinzu
         */

        for (let discipline of this._leaderboard.disciplines) {
            let data = this._fetchNewData(discipline);
            for (let i = 0; i < data.length; i++) {
                let result = data[i];
                let person = new Person(result.name, result.birthYear);
                let time = new Time(result.time);
                let date = new CalenderDate(result.date);
                let location = result.location;
                let newResult = new Result(person, time, location, date, true);
                this._leaderboard.addResult(newResult, discipline.uid);
            }
        }
    }

    _fetchNewData(discipline) {
        /**
         * Fetch new data from the DSV website
         */

        let loginResponse = UrlFetchApp.fetch(this._url, {}); // Perform URL request for login credentials

        let loginContext = loginResponse.getContentText(); // Check if login was successful and extract session information

        let viewState = this._extractData(loginContext, '__VIEWSTATE" value="', '" />'); // Determine viewstate
        let eventValidation = this._extractData(loginContext, '__EVENTVALIDATION" value="', '" />'); // Determine event validation

        // Create POST parameters
        let payload = {
            "ClubID": this._clubId,
            "__EVENTTARGET": "ctl00$ContentSection$_rankingsButton",
            "__VIEWSTATE": viewState,
            "__EVENTVALIDATION": eventValidation,
            "ctl00$ContentSection$_genderRadioButtonList": discipline.gender.substring(0, 1),
            "ctl00$ContentSection$_courseRadioButtonList": (discipline.lane === LANES.Lanbahn) ? "L" : "S",
            "ctl00$ContentSection$_eventDropDownList": `${discipline.distance + discipline.stroke.substring(0, 1)}|GL`,
            "ctl00$ContentSection$_timerangeDropDownList": `01.06.${this._year - 1}|31.05.${this._year}`
        };

        // Configure Fetch call
        let options = {
            method: "post",
            payload: payload
        };

        Logger.log(discipline.gender + " " + discipline.lane + " " + discipline.distance + " " + discipline.stroke);

        let response = UrlFetchApp.fetch(this._url, options); // Perform fetch call for the data

        let content = this._extractData(response.getContentText(), 'class="table table-sm table-stripe"', '</table>'); // Extract the table from the response

        let contentArray = this._splitElement(content, '<tr>', '</tr>'); // Extract elements into a one-dimensional array (each element is a row)
        contentArray.shift(); // Remove the first empty entry
        contentArray.shift(); // Remove the second (header) entry

        return this._convertToArray(contentArray); // Format data into a two-dimensional array
    }

    _extractData(context, begin, end) {
        /**
         * Extract data from the raw HTML
         * @param context raw HTML
         * @param begin begin string
         * @param end end string
         * @returns {string} extracted data
         */
        let startIndex = context.indexOf(begin);
        let endIndex = context.indexOf(end, startIndex);
        return context.substring(startIndex + begin.length, endIndex);

    }

    _splitElement(input, begin, end) {
        /**viewstate
         * Split elements
         * @param input input string
         * @param begin begin string
         * @param end end string
         * @returns {Array}
         */
        return input.split(begin).map(element => element.split(end)[0]);
    }

    _convertToArray(elements, top) {
        /**
         * Convert elements to array
         * @param elements elements
         * @param top top
         * @returns {Array}
         */
        return elements.slice(0, top).map(element => {
            let [, position, name, birthYear, time, , location, date] = this._splitElement(element, '<td>', '</td>');
            return {name, time, birthYear, location, date: date};
        });
    }

}