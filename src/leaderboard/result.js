class Result {
    /**
     * Speichert ein Ergebnis einer Disziplin für eine Person
     * @param {Person} person - Person des Ergebnisses
     * @param {string} time - Zeit des Ergebnisses
     * @param {string} location - Ort des Ergebnisses
     * @param {CalenderDate} date - Datum des Ergebnisses
     * @param {boolean} newRecord - Gibt an, ob das Ergebnis ein neuer Rekord ist
     * @property {Discipline} discipline - Disziplin des Ergebnisses
     * @property {Person} person - Person des Ergebnisses
     * @property {Time} time - Zeit des Ergebnisses
     * @property {string} location - Ort des Ergebnisses
     * @property {CalenderDate} date - Datum des Ergebnisses
     * @property {boolean} newRecord - Gibt an, ob das Ergebnis ein neuer Rekord ist
     * @method equals - Vergleicht zwei Ergebnisse
     * @method toString - Gibt das Ergebnis als String zurück
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

    equals(result) {
        return this._person.equals(result.person) && this._time.equals(result.time) && this._location === result.location;
    }

    toString() {
        return this._person.toString() + " - " + this._time + " - " + this._location + " - " + this._date.toString();
    }

}