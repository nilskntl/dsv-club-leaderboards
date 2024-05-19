class Person {
    /**
     * Definiert eine Person
     * @param {string} name - Name der Person
     * @param {string} birth - Geburtsdatum der Person (yyyy)
     * @property {string} name - Name der Person
     * @property {string} birth - Geburtsdatum der Person (yyyy)
     * @method equals - Vergleicht die Person mit einer anderen Person
     * @method toString - Gibt die Person als String zurück
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

    equals(person) {
        return this._name === person.name && this._birth === person.birth;
    }
}