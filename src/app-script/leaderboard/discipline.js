class Discipline {
    /**
     * Represents one swimming event defined by distance, course length, stroke, and gender.
     *
     * Each discipline owns its result list and is the unit of comparison for the leaderboard.
     * Disciplines are identified by a compact uid that is also written into the Google Sheet,
     * allowing sheet rows to be matched back to the correct Discipline without relying
     * on fragile fixed-row-position assumptions.
     *
     * @param {number} distance - Distance in metres (e.g. 50, 100, 200).
     * @param {number} lane - Course length in metres: 50 (long course) or 25 (short course).
     * @param {string} stroke - German stroke name as stored in STROKES values (e.g. "Freistil").
     * @param {string} gender - German gender label as stored in GENDERS values (e.g. "Männlich").
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

    /**
     * Compact identifier built from the first characters of stroke, distance, course, and gender.
     * Format: "#" + stroke[0] + distance[0..1] + lane[0] + gender[0], all lowercase.
     * Example: Freestyle 50m short course male → "#f502m".
     *
     * This uid is written into the sheet by getSheetData() so that Sheet.extractResults()
     * can route each row back to the correct Discipline without relying on row positions.
     */
    get uid() {
        return ('#' + this.stroke.substring(0, 1) + this.distance.toString().substring(0, 2) + this.lane.toString().substring(0, 1) + this.gender.substring(0, 1)).toLowerCase();
    }

    /**
     * Sorts results ascending by time so the fastest entry is at index 0.
     * Must be called after removeDuplicateResults() and before cutResults().
     */
    sortResults() {
        this._results.sort((result1, result2) => Time.compare(result1.time, result2.time));
    }

    /**
     * Adds a result only if an identical entry (same person, time, and location) is not
     * already present. Prevents double-counting the same performance when it appears in
     * both the existing sheet data and the freshly fetched DSV results.
     */
    addResult(result) {
        if (!this._results.some(existingResult => existingResult.equals(result))) {
            this._results.push(result);
        }
    }

    /**
     * Keeps only the fastest result per swimmer, discarding slower duplicates.
     *
     * Must be called before sortResults(): at this point the list is unsorted, so
     * all results for the same swimmer are still present and can be compared.
     * After this method, each swimmer appears at most once.
     */
    removeDuplicateResults() {
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

    /**
     * Truncates the result list to the top N entries.
     * Must be called after sortResults() so that the retained entries are the fastest N.
     *
     * @param {number} entries - Maximum number of results to keep.
     */
    cutResults(entries) {
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
