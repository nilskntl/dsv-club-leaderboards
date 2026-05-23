class CalendarDate {
    /**
     * Wraps a competition date sourced from either the DSV website or the Google Sheet.
     *
     * Accepts two input formats:
     * - Full date "dd.mm.yyyy" — produced by the DSV website for individual results.
     * - Year only "yyyy" (4-char string) — used for historical results already stored in
     *   the sheet where only the season year was recorded. Day and month are set to 0 and
     *   the date is normalised to "00.00.yyyy" to keep equality checks consistent.
     *
     * @param {string} date - Date string in "dd.mm.yyyy" or "yyyy" format.
     */
    constructor(date) {
        this._date = date;
        if(date.toString().trim().length === 4) {
            this._day = 0;
            this._month = 0;
            this._year = parseInt(date);
            this._date = "00.00." + date;
        } else {
            let dateParts = date.split(".");
            this._day = parseInt(dateParts[0]);
            this._month = parseInt(dateParts[1]);
            this._year = parseInt(dateParts[2]);
        }
    }

    get date() {
        return this._date;
    }

    get day() {
        return this._day;
    }

    get month() {
        return this._month;
    }

    get year() {
        return this._year;
    }

    /**
     * Returns true if the stored year matches the current calendar year.
     * Relevant because the DSV API only exposes results for the ongoing season,
     * so only current-year sheet entries can be verified or superseded by fresh DSV data.
     */
    get isCurrentYear() {
        let today = new Date();
        return today.getFullYear() === this._year;
    }

    /**
     * Equality is based on the normalised date string. A year-only input "2023" is stored
     * as "00.00.2023" and will not equal a full-date "01.06.2023" even though the years match.
     */
    equals(calenderDate) {
        return this._date === calenderDate.date;
    }

    toString() {
        return this._date;
    }
}
