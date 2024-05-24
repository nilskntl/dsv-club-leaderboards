class CalenderDate {
    /**
     * Erstellt ein Datum-Objekt
     * @param {string} date - Datum im Format dd.mm.yyyy
     * @throws {Error} - Wird geworfen, wenn das Datum nicht im Format dd.mm.yyyy ist
     * @property {string} date - Datum im Format dd.mm.yyyy
     * @property {number} day - Tag des Datums
     * @property {number} month - Monat des Datums
     * @property {number} year - Jahr des Datums
     * @property {boolean} isCurrentYear - Gibt an, ob das Datum im aktuellen Jahr liegt
     * @method equals - Vergleicht das Datum mit einem anderen Datum
     * @method toString - Gibt das Datum als String zurück
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

    get isCurrentYear() {
        let today = new Date();
        return today.getFullYear() === this._year;
    }

    equals(calenderDate) {
        return this._date === calenderDate.date;
    }

    toString() {
        return this._date;
    }
}