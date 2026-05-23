class Discipline {
    /**
     * @param {number} distance
     * @param {number} lane
     * @param {string} stroke
     * @param {string} gender
     * @property {number} distance - Distanz der Disziplin
     * @property {number} lane - Bahn der Disziplin
     * @property {string} stroke - Schwimmstil der Disziplin
     * @property {string} gender - Geschlecht der Disziplin
     * @property {Result[]} results - Ergebnisse der Disziplin
     * @property {string} uid - Eindeutige ID der Disziplin
     * @method sortResults - Sortiert die Ergebnisse nach Zeit
     * @method addResult - Fügt ein Ergebnis hinzu
     * @method removeDuplicateResults - Entfernt Ergebnisse von Personen, die mehrere Ergebnisse in der Disziplin haben
     * @method equals - Vergleicht zwei Disziplinen
     */

    constructor(distance, lane, stroke, gender) {
        this._distance = distance;
        this._lane = lane;
        this._stroke = stroke
        this._gender = gender;
        this._results = [];
    }

    get distance() {
        return this._distance;
    }

    get lane() {
        return this._lane;
    }

    get stroke() {
        return this._stroke;
    }

    get gender() {
        return this._gender;
    }

    get results() {
        return this._results;
    }

    get uid() {
        /**
         * Generiert eine eindeutige ID für die Disziplin basierend auf der Distanz, der Bahn, dem Schwimmstil und dem Geschlecht
         */
        return ('#' + this.stroke.substring(0, 1) + this.distance.toString().substring(0, 2) + this.lane.toString().substring(0, 1) + this.gender.substring(0, 1)).toLowerCase();
    }

    sortResults() {
        /**
         * Sortiert die Ergebnisse nach Zeit (von schnell nach langsam)
         * @see Time.compare
         */
        this._results.sort((result1, result2) => Time.compare(result1.time, result2.time));
    }

    addResult(result) {
        /**
         * Fügt ein Ergebnis hinzu, wenn es noch nicht vorhanden ist
         */
        if (!this._results.some(existingResult => existingResult.equals(result))) {
            this._results.push(result);
        }
    }

    removeDuplicateResults() {
        /**
         * Wenn eine Person mehrere Ergebnisse in der Disziplin hat, wird nur das schnellste Ergebnis behalten
         */

        let uniqueResults = [];
        this._results.forEach(result => {
            if (!uniqueResults.some(uniqueResult => uniqueResult.person.equals(result.person))) {
                uniqueResults.push(result);
            } else {
                let index = uniqueResults.findIndex(uniqueResult => uniqueResult.person.equals(result.person));
                if (Time.compare(result.time, uniqueResults[index].time) < 0) {
                    uniqueResults[index] = result;
                }
            }
        });
        this._results = uniqueResults;
    }

    cutResults(entries) {
        /**
         * Schneidet die Ergebnisse auf die Anzahl der Einträge
         */
        this._results = this._results.slice(0, entries);
    }

    equals(discipline) {
        return this.uid === discipline.uid;
    }

    toString() {
        return this.distance + 'm ' + this.stroke + ' ' + this.gender + ' (' + (this.lane === LANES.SHORT_COURSE ? 'Kurzbahn' : 'Langbahn') + ')';
    }
}

const STROKES = {
    'FREESTYLE': 'Freistil',
    'BREASTSTROKE': 'Brust',
    'BACKSTROKE': 'Rücken',
    'BUTTERFLY': 'Schmetterling',
    'MEDLEY': 'Lagen'
}

const GENDERS = {
    'MALE': 'Männlich',
    'FEMALE': 'Weiblich'
}

const LANES = {
    'LONG_COURSE': 50,
    'SHORT_COURSE': 25
}

const DISTANCES = {
    '50m': '50',
    '100m': '100',
    '200m': '200',
    '400m': '400',
    '800m': '800',
    '1500m': '1500'
}

const DISCIPLINES = {
    'FREESTYLE': {
        'Lage': STROKES.FREESTYLE,
        'Langbahn': ['50', '100', '200', '400', '800', '1500'],
        'Kurzbahn': ['50', '100', '200', '400', '800', '1500']
    },
    'BUTTERFLY': {
        'Lage': STROKES.BUTTERFLY,
        'Langbahn': ['50', '100', '200'],
        'Kurzbahn': ['50', '100', '200']
    },
    'BACKSTROKE': {
        'Lage': STROKES.BACKSTROKE,
        'Langbahn': ['50', '100', '200'],
        'Kurzbahn': ['50', '100', '200']
    },
    'BREASTSTROKE': {
        'Lage': STROKES.BREASTSTROKE,
        'Langbahn': ['50', '100', '200'],
        'Kurzbahn': ['50', '100', '200']
    },
    'MEDLEY': {
        'Lage': STROKES.MEDLEY,
        'Langbahn': ['200', '400'],
        'Kurzbahn': ['100', '200', '400']
    }
}
