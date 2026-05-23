class Person {
    /**
     * Minimal identity model for a swimmer, derived from DSV data.
     *
     * The DSV website exposes birth year only, not a full date of birth, so this is
     * the highest-fidelity identity that can be consistently derived from both the
     * DSV source and the Google Sheet.
     *
     * @param {string} name - Full name of the swimmer as provided by the DSV.
     * @param {string} birth - Birth year as a 4-digit string (e.g. "2005").
     */
    constructor(name, birth) {
        this._name = name;
        this._birth = birth;
    }

    get name() {
        return this._name;
    }

    get birth() {
        return this._birth;
    }

    toString() {
        return this._name + " (" + this._birth + ")";
    }

    /**
     * Both name and birth year must match for two Person instances to be considered equal.
     * Name alone is insufficient because different active swimmers can share the same name.
     */
    equals(person) {
        return this._name === person.name && this._birth === person.birth;
    }
}
