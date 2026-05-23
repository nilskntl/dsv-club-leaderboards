class Result {
    /**
     * Represents a single competition performance by one swimmer in one discipline.
     *
     * @param {Person} person - The swimmer who achieved this result.
     * @param {Time} time - The time achieved.
     * @param {string} location - Name of the competition venue.
     * @param {CalendarDate} date - Date of the competition.
     * @param {boolean} newRecord - True if this result was fetched from the DSV website
     *   in the current run; false if it was already present in the sheet. After adjustResults()
     *   trims each discipline to the top N, only results still present with newRecord=true
     *   are reported as newly entered records.
     */
    constructor(person, time, location, date, newRecord) {
        this._person = person;
        this._time = time;
        this._location = location;
        this._date = date;
        this.newRecord = newRecord;
    }

    get person() {
        return this._person;
    }

    get time() {
        return this._time;
    }

    get location() {
        return this._location;
    }

    get date() {
        return this._date;
    }

    /**
     * Location is included in the equality check because the same swimmer can post
     * the same time at two different meets — those are distinct results and must not
     * be collapsed into one.
     */
    equals(result) {
        return this._person.equals(result.person) && this._time.equals(result.time) && this._location === result.location;
    }

    toString() {
        return this._person.toString() + " - " + this._time + " - " + this._location + " - " + this._date.toString();
    }

}
