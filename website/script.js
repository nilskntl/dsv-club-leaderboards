class Statistics {
    constructor(leaderboard) {
        this._leaderboard = leaderboard;
    }

    get leaderboard() {
        return this._leaderboard;
    }

    get totalResults() {
        return this._leaderboard.length;
    }

    get uniqueAthletes() {
        let athletes = [];
        this._leaderboard.disciplines.forEach(discipline => {
            discipline.results.forEach(result => {
                if (!athletes.includes(result.person)) {
                    athletes.push(result.person);
                }
            });
        });
        return athletes;
    }

    get totalUniqueAthletes() {
        return this.uniqueAthletes.length;
    }

    get occurrenceOfEachAthlete() {
        let occurrences = [];
        this._leaderboard.disciplines.forEach(discipline => {
            discipline.results.forEach(result => {
                let athlete = result.person;
                let occurrence = occurrences.find(occurrence => occurrence.person.equals(athlete));
                if (occurrence) {
                    occurrence.occurrences++;
                } else {
                    occurrences.push({person: athlete, occurrences: 1});
                }
            });
        });
        return occurrences.sort((a, b) => b.occurrences - a.occurrences);
    }

    get occurrenceOfEachAthleteOnFirstPlace() {
        let occurrences = [];
        this._leaderboard.disciplines.forEach(discipline => {
            if (discipline.results.length > 0) {
                let athlete = discipline.results[0].person;
                let occurrence = occurrences.find(occurrence => occurrence.person.equals(athlete));
                if (occurrence) {
                    occurrence.occurrences++;
                } else {
                    occurrences.push({person: athlete, occurrences: 1});
                }
            }
        });
        return occurrences.sort((a, b) => b.occurrences - a.occurrences);
    }

    get athleteWithMostOccurrences() {
        let occurrences = this.occurrenceOfEachAthlete;
        return occurrences.reduce((a, b) => a.occurrences > b.occurrences ? a : b);
    }

    get athleteWithMostOccurrencesOnFirstPlace() {
        let occurrences = this.occurrenceOfEachAthleteOnFirstPlace;
        return occurrences.reduce((a, b) => a.occurrences > b.occurrences ? a : b);
    }

    get oldestRecord() {
        let oldestRecord = this._leaderboard.disciplines.reduce((a, b) => a.results[0].date.compare(b.results[0].date) < 0 ? a : b);
        return oldestRecord.results[0];
    }

    get newestRecord() {
        let newestRecord = this._leaderboard.disciplines.reduce((a, b) => a.results[0].date.compare(b.results[0].date) > 0 ? a : b);
        return newestRecord.results[0];
    }

    get newRecordsThisYear() {
        let newRecords = [];
        this._leaderboard.disciplines.forEach(discipline => {
            discipline.results.forEach(result => {
                if (result.date.isCurrentYear) {
                    newRecords.push(result);
                }
            });
        });
        return newRecords;
    }

    get totalNewRecordsThisYear() {
        return this.newRecordsThisYear.length;
    }

    get occurrenceOfLocation() {
        let occurrences = [];
        this._leaderboard.disciplines.forEach(discipline => {
            discipline.results.forEach(result => {
                let location = result.location;
                let occurrence = occurrences.find(occurrence => occurrence.location === location);
                if (occurrence) {
                    occurrence.occurrences++;
                } else {
                    occurrences.push({location: location, occurrences: 1});
                }
            });
        });
        return occurrences.sort((a, b) => b.occurrences - a.occurrences);
    }

    occurrenceOfEachAthleteByGender(gender) {
        let occurrences = this.occurrenceOfEachAthlete;
        return occurrences.filter(occurrence => occurrence.person.gender === gender).sort((a, b) => b.occurrences - a.occurrences);
    }

    occurrenceOfEachAthleteOnFirstPlaceByGender(gender) {
        let occurrences = this.occurrenceOfEachAthleteOnFirstPlace;
        return occurrences.filter(occurrence => occurrence.person.gender === gender).sort((a, b) => b.occurrences - a.occurrences);
    }

    athleteWithMostOccurrencesByGender(gender) {
        let occurrences = this.occurrenceOfEachAthlete;
        occurrences = occurrences.filter(occurrence => occurrence.person.gender === gender);
        return occurrences.reduce((a, b) => a.occurrences > b.occurrences ? a : b);
    }

    athleteWithMostOccurrencesOnFirstPlaceByGender(gender) {
        let occurrences = this.occurrenceOfEachAthleteOnFirstPlace;
        occurrences = occurrences.filter(occurrence => occurrence.person.gender === gender);
        return occurrences.reduce((a, b) => a.occurrences > b.occurrences ? a : b);
    }

    oldestRecordByGender(gender) {
        let oldestRecord = this._leaderboard.disciplines.filter(disciplines => disciplines.gender === gender).reduce((a, b) => a.results[0].date.compare(b.results[0].date) < 0 ? a : b);
        return oldestRecord.results[0];
    }

    newestRecordByGender(gender) {
        let newestRecord = this._leaderboard.disciplines.filter(disciplines => disciplines.gender === gender).reduce((a, b) => a.results[0].date.compare(b.results[0].date) > 0 ? a : b);
        return newestRecord.results[0];
    }
}

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
        if (date.toString().trim().length === 4) {
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

    compare(calenderDate) {
        if (this._year < calenderDate.year) {
            return -1;
        } else if (this._year > calenderDate.year) {
            return 1;
        } else {
            if (this._month < calenderDate.month) {
                return -1;
            } else if (this._month > calenderDate.month) {
                return 1;
            } else {
                if (this._day < calenderDate.day) {
                    return -1;
                } else if (this._day > calenderDate.day) {
                    return 1;
                } else {
                    return 0;
                }
            }
        }
    }

    toString() {
        return this._date;
    }
}

class Time {
    /**
     * Represents a time in the format mm:ss,xx
     * @param {string} time - Time in the format mm:ss,xx
     * @property {string} time - Time in the format mm:ss,xx
     * @property {number} minutes - Minutes of the time
     * @property {number} seconds - Seconds of the time
     * @property {number} hundredth - Hundredth of the time
     * @property {number} totalSeconds - Total seconds of the time
     * @property {number} totalHundredth - Total hundredth of the time
     * @method compare - Compares two times
     * @method toString - Returns the time as a string
     * @method equals - Compares the time with another time
     */

    constructor(time) {
        this._time = time;
        let timeParts = time.split(":");
        this._minutes = parseInt(timeParts[0]);
        let secondsAndHundredth = timeParts[1].split(",");
        this._seconds = parseInt(secondsAndHundredth[0]);
        this._hundredth = parseInt(secondsAndHundredth[1]);
    }

    get time() {
        return this._time;
    }

    get minutes() {
        return this._minutes;
    }

    get seconds() {
        return this._seconds;
    }

    get hundredth() {
        return this._hundredth;
    }

    get totalSeconds() {
        return this._minutes * 60 + this._seconds + this._hundredth / 100;
    }

    get totalHundredth() {
        return this._minutes * 6000 + this._seconds * 100 + this._hundredth;
    }

    equals(time) {
        return this._time === time.time;
    }

    toString() {
        return this._time;
    }

    static compare(time1, time2) {
        if (time1.totalHundredth < time2.totalHundredth) {
            return -1;
        } else if (time1.totalHundredth > time2.totalHundredth) {
            return 1;
        } else {
            return 0;
        }
    }
}

class Person {
    /**
     * Definiert eine Person
     * @param {string} name - Name der Person
     * @param {string} birth - Geburtsdatum der Person (yyyy)
     * @param {string} gender - Geschlecht der Person
     * @property {string} name - Name der Person
     * @property {string} birth - Geburtsdatum der Person (yyyy)
     * @method equals - Vergleicht die Person mit einer anderen Person
     * @method toString - Gibt die Person als String zurück
     */

    constructor(name, birth, gender) {
        this._name = name;
        this._birth = birth;
        this._gender = gender;
    }

    get name() {
        return this._name;
    }

    get birth() {
        return this._birth;
    }

    get gender() {
        return this._gender;
    }

    toString() {
        return this._name + " (" + this._birth + ")";
    }

    equals(person) {
        return this._name === person.name && this._birth === person.birth;
    }
}

class Result {
    /**
     * Speichert ein Ergebnis einer Disziplin für eine Person
     * @param {Person} person - Person des Ergebnisses
     * @param {Time} time - Zeit des Ergebnisses
     * @param {string} location - Ort des Ergebnisses
     * @param {CalenderDate} date - Datum des Ergebnisses
     * @property {Discipline} discipline - Disziplin des Ergebnisses
     * @property {Person} person - Person des Ergebnisses
     * @property {Time} time - Zeit des Ergebnisses
     * @property {string} location - Ort des Ergebnisses
     * @property {CalenderDate} date - Datum des Ergebnisses
     * @property {boolean} newRecord - Gibt an, ob das Ergebnis ein neuer Rekord ist
     * @method equals - Vergleicht zwei Ergebnisse
     * @method toString - Gibt das Ergebnis als String zurück
     */

    constructor(person, time, location, date) {
        this._person = person;
        this._time = time;
        this._location = location;
        this._date = date;
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
     * @method cutResults - Schneidet die Ergebnisse auf die Anzahl der Einträge
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

    static uidToProperties(uid) {
        /**
         * Generiert die Eigenschaften einer Disziplin basierend auf der eindeutigen ID
         * @param {string} uid - Eindeutige ID der Disziplin
         */

        let stroke = uid.substring(1, uid.length - 2);
        let distance = parseInt(uid.substring(2, uid.length - 1));
        let lane = parseInt(uid.substring(uid.length - 1));
        if (lane === 2) {
            lane = Discipline.LANES.Kurzbahn;
        } else if (lane === 5) {
            lane = Discipline.LANES.Langbahn;
        }
        let gender = uid.substring(uid.length);
        if (gender === 'm') {
            gender = Discipline.GENDERS.Maennlich;
        } else {
            gender = Discipline.GENDERS.Weiblich;
        }
        let strokeKey = Object.keys(Discipline.STROKES).find(key => Discipline.STROKES[key].substring(0, 1).toLowerCase() === stroke);
        let distanceKey = Object.keys(Discipline.DISTANCES).find(key => Discipline.DISTANCES[key].substring(0, 2) === distance.toString());

        return {
            'stroke': Discipline.STROKES[strokeKey],
            'distance': Discipline.DISTANCES[distanceKey],
            'lane': lane,
            'gender': gender
        };

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
        return this.distance + 'm ' + this.stroke + ' ' + this.gender + ' (' + (this.lane === Discipline.LANES.Kurzbahn ? 'Kurzbahn' : 'Langbahn') + ')';
    }

    static STROKES = {
        'Freistil': 'Freistil',
        'Brust': 'Brust',
        'Ruecken': 'Rücken',
        'Schmetterling': 'Schmetterling',
        'Lagen': 'Lagen'

    }

    static GENDERS = {
        'Maennlich': 'Männlich',
        'Weiblich': 'Weiblich'

    }

    static LANES = {
        'Langbahn': 50,
        'Kurzbahn': 25
    }

    static DISTANCES = {
        '50m': '50',
        '100m': '100',
        '200m': '200',
        '400m': '400',
        '800m': '800',
        '1500m': '1500'
    }

    static DISCIPLINES = {
        'Freistil': {
            'Lage': Discipline.STROKES.Freistil,
            'Langbahn': ['50', '100', '200', '400', '800', '1500'],
            'Kurzbahn': ['50', '100', '200', '400', '800', '1500']
        },
        'Schmetterling': {
            'Lage': Discipline.STROKES.Schmetterling,
            'Langbahn': ['50', '100', '200'],
            'Kurzbahn': ['50', '100', '200']
        },
        'Ruecken': {
            'Lage': Discipline.STROKES.Ruecken,
            'Langbahn': ['50', '100', '200'],
            'Kurzbahn': ['50', '100', '200']
        },
        'Brust': {
            'Lage': Discipline.STROKES.Brust,
            'Langbahn': ['50', '100', '200'],
            'Kurzbahn': ['50', '100', '200']
        },
        'Lagen': {
            'Lage': Discipline.STROKES.Lagen,
            'Langbahn': ['200', '400'],
            'Kurzbahn': ['100', '200', '400']
        }
    }
}

class Leaderboard {
    /**
     * Klasse für die Bestenliste
     * @param {string} season - Saison der Bestenliste
     * @property {string} season - Saison der Bestenliste
     * @property {Discipline[]} disciplines - Disziplinen der Bestenliste
     * @method createDisciplines - Erstellt alle Disziplinen
     * @method addResult - Fügt ein Ergebnis hinzu
     * @method addRawData - Fügt die Rohdaten der Bestenliste hinzu
     */

    constructor(season) {
        this._disciplines = [];
        this.createDisciplines();
        this._season = season;
        this._statistics = new Statistics(this); // Statistiken für die Bestenlisten
    }

    get disciplines() {
        return this._disciplines;
    }

    get season() {
        return this._season;
    }

    get statistics() {
        return this._statistics;
    }

    createDisciplines() {
        /**
         * Erstellt alle Disziplinen
         */

        for (let discipline in Discipline.DISCIPLINES) {
            let stroke = Discipline.DISCIPLINES[discipline].Lage;
            let longCourse = Discipline.DISCIPLINES[discipline].Langbahn;
            let shortCourse = Discipline.DISCIPLINES[discipline].Kurzbahn;
            for (let distance of longCourse) {
                this._disciplines.push(new Discipline(distance, Discipline.LANES.Langbahn, stroke, Discipline.GENDERS.Weiblich));
                this._disciplines.push(new Discipline(distance, Discipline.LANES.Langbahn, stroke, Discipline.GENDERS.Maennlich));
            }
            for (let distance of shortCourse) {
                this._disciplines.push(new Discipline(distance, Discipline.LANES.Kurzbahn, stroke, Discipline.GENDERS.Weiblich));
                this._disciplines.push(new Discipline(distance, Discipline.LANES.Kurzbahn, stroke, Discipline.GENDERS.Maennlich));
            }
        }
    }

    addResult(result, disciplineUid) {
        /**
         * Fügt ein Ergebnis hinzu
         */
        let discipline = this._disciplines.find(discipline => discipline.uid === disciplineUid);
        try {
            discipline.addResult(result);
        } catch (error) {
            throw new Error('Result could not be added to the leaderboard: ' + result.toString());
        }
    }

    addRawData(data) {
        /**
         * Fügt die Rohdaten der Bestenliste hinzu
         */

        for (let i = 0; i < data.length; i++) {
            let uidMale = data[i][0];
            if (uidMale.startsWith('#')) {
                let nameMale = data[i][2];
                if (nameMale.toString().trim() !== '') {
                    let timeMale = new Time(data[i][3]);
                    let birthMale = data[i][4];
                    let locationMale = data[i][5];
                    let dateMale = new CalenderDate(data[i][6]);
                    let personMale = new Person(nameMale, birthMale, Discipline.GENDERS.Maennlich);
                    let resultMale = new Result(personMale, timeMale, locationMale, dateMale);
                    this.addResult(resultMale, uidMale);
                }

                let uidFemale = data[i][7];
                let nameFemale = data[i][9];
                if (nameFemale.toString().trim() !== '') {
                    let timeFemale = new Time(data[i][10]);
                    let birthFemale = data[i][11];
                    let locationFemale = data[i][12];
                    let dateFemale = new CalenderDate(data[i][13]);
                    let personFemale = new Person(nameFemale, birthFemale, Discipline.GENDERS.Weiblich);
                    let resultFemale = new Result(personFemale, timeFemale, locationFemale, dateFemale);
                    this.addResult(resultFemale, uidFemale);
                }
            }
        }
    }
}

class Leaderboards {
    constructor() {
        this._leaderboards = []; // Liste von Bestenlisten
        this._filter = new Filter(); // Filter für die Bestenlisten
        this.#createLeaderboards(); // Erstelle die Bestenlisten für die Saisons
        this._filter.createDropdownListeners(); // Erstelle die Listener für die Dropdown-Menüs
        this.updateTable(); // Lade die Bestenlisten in die Tabelle
    }

    get leaderboards() {
        return this._leaderboards;
    }

    get filter() {
        return this._filter;
    }

    addLeaderboard(leaderboard) {
        this._leaderboards.push(leaderboard);
    }

    filterDisciplines(filter) {
        /**
         * Funktion zum Filtern der Bestenlisten nach Disziplin und Geschlecht
         * @param {Filter} filter - Filterkriterien
         * @returns {Leaderboard[]} - Liste von Bestenlisten, die den Filterkriterien entsprechen
         */

        if (!(filter instanceof Filter)) throw new Error("Filter ist kein Filter-Objekt"); // Überprüfe, ob der Filter ein Filter-Objekt ist

        let filteredDisciplines = []; // Liste von gefilterten Bestenlisten
        for (let i = 0; i < this.leaderboards.length; i++) {
            if (this.leaderboards[i].season === filter.season) {
                for (let j = 0; j < this.leaderboards[i].disciplines.length; j++) {
                    if (this.leaderboards[i].disciplines[j].stroke === filter.stroke &&
                        this.leaderboards[i].disciplines[j].lane === filter.lane &&
                        this.leaderboards[i].disciplines[j].gender === filter.gender) {
                        filteredDisciplines.push(this.leaderboards[i].disciplines[j]);
                    }
                }
            }
        }

        return filteredDisciplines;
    }

    #createLeaderboards() {
        /**
         * Erstellt die Bestenlisten für die Saisons
         */

        for (let key in KEYS) {
            let leaderboard = new Leaderboard(KEYS[key].name);
            this.addLeaderboard(leaderboard);
        }
    }

    async #getData(season) {

        if (season === '') season = 'All-Time';
        let link = KEYS[season].link;

        // Find the index for the season
        let index = -1;
        for (let i = 0; i < this.leaderboards.length; i++) {
            if (this.leaderboards[i].season === season) {
                if (this.leaderboards[i].disciplines.length === 0) {
                    return;
                }
                index = i;
            }
        }

        let data = await this.#fetchData(link);

        this.leaderboards[index].addRawData(data);
    }

    #fetchData(tsvUrl) {
        /**
         * Lade die Daten von der angegebenen TSV-URL und speichere sie im LocalStorage.
         * @param {string} tsvUrl - Die URL des TSV-Dokuments
         * @param {string} range - Der Bereich der Daten, der geladen werden soll
         * @param {string} storageKey - Der Schlüssel, unter dem die Daten im LocalStorage gespeichert werden sollen
         * @returns {Promise} - Ein Promise-Objekt, das den Status des Fetch-Vorgangs angibt
         * @throws {Error} - Ein Fehler wird geworfen, wenn der Fetch-Vorgang fehlschlägt
         */

        return new Promise((resolve, reject) => {
            fetch(tsvUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.text();
                })
                .then(data => {
                    let rows = data.split('\n');
                    let result = [];
                    for (let i = 0; i < rows.length; i++) {
                        result.push(rows[i].split('\t'));
                    }
                    resolve(result); // Erfolgreiches Auflösen des Promise mit den Daten
                })
                .catch(error => {
                    console.error('Fehler beim Laden der TSV-Daten:', error);
                    reject(error); // Ablehnen des Promise bei einem Fehler
                });
        });
    }

    async updateTable() {
        /**
         * Aktualisiert die Tabelle basierend auf den Filterkriterien
         * @param {Filter} filter - Filterkriterien
         */

        let filteredDisciplines = this.filterDisciplines(this._filter); // Filtere die Disziplinen basierend auf den Filterkriterien

        let numResults = 0;
        for (let discipline of filteredDisciplines) {
            numResults += discipline.results.length;
        }

        let loading = document.getElementById('loading');
        let leaderboards = document.getElementById('leaderboards');
        let lastUpdated = document.getElementById('last-updated');
        let statistics = document.getElementById('statistics');

        let genderDropdown = document.getElementById('dropdown__gender');
        let strokeDropdown = document.getElementById('dropdown__stroke');
        let laneDropdown = document.getElementById('dropdown__lane');

        if (this._filter.showLeaderboards) {
            statistics.style.display = 'none'; // Statistiken ausblenden
            laneDropdown.style.display = 'flex'; // Bahnlänge anzeigen
            strokeDropdown.style.display = 'flex'; // Schwimmstil anzeigen
            genderDropdown.style.display = 'flex'; // Geschlecht anzeigen
        } else {
            leaderboards.style.display = 'none'; // Tabelle ausblenden
            lastUpdated.style.display = 'none'; // Letztes Update ausblenden
            laneDropdown.style.display = 'none'; // Bahnlänge ausblenden
            strokeDropdown.style.display = 'none'; // Schwimmstil ausblenden
            genderDropdown.style.display = 'none'; // Geschlecht ausblenden
        }

        if (numResults === 0) {
            loading.style.display = 'block'; // Ladekreis anzeigen
            leaderboards.style.display = 'none'; // Tabelle ausblenden
            lastUpdated.style.display = 'none'; // Letztes Update ausblenden
            statistics.style.display = 'none'; // Statistiken ausblenden
            await this.#getData(this._filter.season); // Lade die Daten für die Saison
            filteredDisciplines = this.filterDisciplines(this._filter); // Filtere die Disziplinen basierend auf den Filterkriterien
        }

        if (this._filter.showLeaderboards) {
            this.#loadLeaderboardsIntoTable(filteredDisciplines); // Lade die Bestenlisten in die Tabelle
            leaderboards.style.display = 'block'; // Tabelle anzeigen
            lastUpdated.style.display = 'block'; // Letztes Update anzeigen
        } else {
            let currentLeaderboard = this.leaderboards.find(leaderboard => leaderboard.season === this._filter.season);
            console.log('Current Leaderboard: ' + currentLeaderboard.season);
            this.#loadStatistics(currentLeaderboard.statistics);
            statistics.style.display = 'block'; // Statistiken anzeigen
        }
        loading.style.display = 'none'; // Ladekreis ausblenden
    }

    #loadLeaderboardsIntoTable(disciplines) {
        /**
         * Funktion zum Laden der Bestenliste (eine Lage, ein Geschlecht, eine Bahnlänge) in die Tabelle
         * @param {Leaderboards[]} leaderboards - Bestenlisten, die in die Tabelle geladen werden sollen
         */

        let leaderboardsDiv = document.getElementById('leaderboards'); // Hole das Element mit der ID 'leaderboards'
        leaderboardsDiv.innerHTML = ''; // Setze den Inhalt des Elements auf leer

        function createHeader() {
            /**
             * Funktion zum Erstellen der Kopfzeile der Tabelle
             * @returns {HTMLTableRowElement} - Kopfzeile der Tabelle
             */
            let row = document.createElement('tr');
            let headerCells = ['Platz', 'Name', 'Zeit', 'Jg.', 'Ort', 'Jahr'];

            for (let i = 0; i < headerCells.length; i++) {
                let cell = document.createElement('th');
                cell.textContent = headerCells[i];
                cell.className = 'header-cells';
                row.appendChild(cell);
            }
            return row;
        }

        for (let i = 0; i < disciplines.length; i++) {
            /**
             * Gehe jede Bestenliste zu einer Disziplin durch und füge die Ergebnisse in die Tabelle ein
             */
            let dividerContainer = document.createElement('div'); // Erstelle ein neues Div-Element, in dem der Rest eingefügt wird
            let leaderboard = disciplines[i]; // Bestenliste zu einer Disziplin
            let disciplineDiv = document.createElement('div'); // Erstelle ein neues Div-Element
            let table = document.createElement('table'); // Erstelle eine neue Tabelle
            let distanceCell = document.createElement('div'); // Erstelle einen Div für die Distanz

            table.innerHTML = '<colgroup><col class="col1"><col class="col2"><col class="col3"><col class="col4"><col class="col5"><col class="col6"></colgroup>'; // Übernehme die in col1 - col6 definierten Größen für die Spalten

            distanceCell.className = 'distance'; // Setze die Klasse des Containers auf 'distance'
            distanceCell.innerText = leaderboard.distance + 'm '; // Setze den Text des Containers auf die Distanz

            table.appendChild(createHeader()); // Füge die Kopfzeile in den Body der Tabelle ein (Platz, Name, Zeit, Jg., Ort, Jahr

            for (let j = 0; j < leaderboard.results.length; j++) {
                let row = document.createElement('tr'); // Erstelle eine neue Zeile

                let result = leaderboard.results[j]; // Ergebnis in der Bestenliste

                let rank = document.createElement('td'); // Erstelle eine Zelle für den Rang
                let name = document.createElement('td'); // Erstelle eine Zelle für den Namen
                let time = document.createElement('td'); // Erstelle eine Zelle für die Zeit
                let birth = document.createElement('td'); // Erstelle eine Zelle für das Geburtsjahr
                let location = document.createElement('td'); // Erstelle eine Zelle für den Ort
                let year = document.createElement('td'); // Erstelle eine Zelle für das Jahr

                // Setze die obere linke Ecke der ersten Zelle auf gerundet
                let borderRadius = parseInt(document.documentElement.style.getPropertyValue('--border-radius')) * 2;
                rank.style.borderTopLeftRadius = borderRadius + 'px';
                rank.style.borderBottomLeftRadius = borderRadius + 'px';
                year.style.borderTopRightRadius = borderRadius + 'px';
                year.style.borderBottomRightRadius = borderRadius + 'px';

                rank.textContent = (j + 1).toString() + '.'; // Setze den Text der Zelle auf den Rang
                row.append(rank); // Füge die Zelle in die Zeile ein

                name.textContent = result.person.name; // Setze den Text der Zelle auf den Namen
                row.append(name); // Füge die Zelle in die Zeile ein

                time.textContent = result.time; // Setze den Text der Zelle auf die Zeit
                row.append(time); // Füge die Zelle in die Zeile ein

                birth.textContent = result.person.birth.toString(); // Setze den Text der Zelle auf das Geburtsjahr
                row.append(birth); // Füge die Zelle in die Zeile ein

                location.textContent = result.location; // Setze den Text der Zelle auf den Ort
                row.append(location); // Füge die Zelle in die Zeile ein

                if (this._filter.season === 'All-Time') {
                    let currentYear = new Date().getFullYear(); // Get the current year (yyyy)
                    if (result.date.year.toString() === currentYear.toString()) { // Überprüfe, ob das Jahr dem aktuellen Jahr entspricht
                        row.className = 'current-year'; // Setze die Klasse der Zelle auf 'current-year'
                    }
                    year.textContent = result.date.year; // Setze den Text der Zelle auf das Jahr
                } else {
                    year.textContent = result.date; // Setze den Text der Zelle auf das Datum
                }
                row.append(year); // Füge die Zelle in die Zeile ein

                table.appendChild(row);
            }

            dividerContainer.className = 'divider-container'; // Setze die Klasse des Div-Elements auf 'divider-container'
            let mobileSize = getComputedStyle(document.documentElement).getPropertyValue('--mobile-size');
            if (window.innerWidth <= parseInt(mobileSize.slice(0, -2))) {
                disciplineDiv.appendChild(distanceCell); // Füge die Zelle für die Distanz in das Div-Element ein
                // Füge eine horizontale Linie ein
                let hr = document.createElement('hr');
                hr.style.width = '100%';
                hr.style.margin = '8px 0';
                hr.style.border = '0';
                hr.style.borderTop = '1px solid #ccc';
                disciplineDiv.appendChild(hr);
            } else {
                dividerContainer.appendChild(distanceCell); // Füge die Zelle für die Distanz in das Div-Element ein
            }
            disciplineDiv.appendChild(table); // Füge die Tabelle in das Div-Element ein
            disciplineDiv.className = 'discipline'; // Setze die Klasse des Div-Elements auf 'discipline'
            dividerContainer.appendChild(disciplineDiv); // Füge das Div-Element in das Div-Element ein
            leaderboardsDiv.appendChild(dividerContainer); // Füge das Div-Element in das Element mit der ID 'leaderboards' ein
        }
    }

    #loadStatistics(statistics) {
        /**
         * Funktion zum Laden der Statistiken in die Tabelle
         */

        function createRanking(arrNames, arrValues, title, color) {

            let ranking = document.createElement('div');
            ranking.className = 'statistics__ranking';

            let rankingHeader = document.createElement('div');
            rankingHeader.className = 'statistics__ranking-header';
            rankingHeader.style.backgroundColor = color;

            let rankingTitle = document.createElement('div');
            rankingTitle.className = 'statistics__ranking-title';
            rankingTitle.innerText = title;
            rankingHeader.appendChild(rankingTitle);

            let rankingList = document.createElement('div');
            rankingList.className = 'statistics__ranking-list';

            for (let i = 0; i < 5 && i < arrNames.length; i++) {
                let listItem = document.createElement('div');
                listItem.className = 'statistics__list-item';
                let rank = document.createElement('div');
                rank.className = 'statistics__rank';
                rank.innerText = (i + 1).toString() + '.';
                listItem.appendChild(rank);
                let name = document.createElement('div');
                name.className = 'statistics__name';
                name.innerText = arrNames[i];
                listItem.appendChild(name);
                let value = document.createElement('div');
                value.className = 'statistics__value';
                value.innerText = arrValues[i];
                listItem.appendChild(value);

                if (i <= 2) {
                    console.log(i);
                    let image = document.createElement('img');
                    image.className = 'statistics__rank-image';
                    image.alt = 'Position' + (i + 1) + 'Medal';
                    switch (i) {
                        case 0:
                            image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAD+0lEQVR4nO1XX2xTVRw+El4WDA/T0HsTIDzMRB5MBF4kBkhJwPb2Khi553S6GGaEQQkQxu0gstE5XxR9NFFe9NkXNfEPPafoEolEOoQwyhY22MpCWwgkuAeLMMln7r3tVlxv/2y9t33ol/yeepvzfef35zs/QppooomKkPLLX6YVGcVD6iJVAj3KWujqDMIq5oWujiCyZSmpJTLbPCtSijxdTEBKke/e97Uur0qArv5UlLwZAYU4gbQi9dplIeWXP6qYfFjx2pLX1V+JU5jSVrak/dKtoiL8UjalyqvLko9ElkAP/FmcfOAJwup64iQyimd3iSx8XVZAj9ppf/uBrxwlbxKIkCVpv3zRRsCTdEDeYPvfI1oLwoEpm7rPonvHKuIGMorHWyILtjUMPdBn37jqAHETKb/8o52IjOIJzCN/9M0VCKvTNrd/Fwd9y90VoMovphR5xqahR7GFPDXHoaunS4zNva6Sr9bcXDetWpjblF+6N+ZrXVk301qsuSW2yhj2es7VzbQWY263fDLimyTEN0v4t1tJ1M20Fmpuw14ZFzZJGPWtQV1NayHmNvmaRd7IQDbkRd1Nq1pzu+KVTAE3Xm9Dw5hWpRjbJscN8kObJTw+vB0NY1qVIvluW8fEoXXInvYD32nAzxQ4w4DvNeCbXcDnO4FTO/pIowFRrRWcfgxOH0IwlA3OYohpL5FGADh9FZzeMYnFGHD+feBKNzB2ApiIAJP9wHgvkAgDf3QBZ9tzIuhjcNpVZ/LBXRDsH5PQufeA6x8AyYHScfMkcGFfYTY+qxN5bQME+9skMRQCJj8sT74who8CsWBORPCAy+Q7loGz2+bh8VB1xAsjoQMiaGRhBrHgOvcECHbSJP/b7upv/v8RD+V7YtAd8ue1Fgg6bR46eqw4qcGO4tNnvG/+txMR4Jd3rN9j2kbnBYjgG7O3b3er1QhIDgAXD+Sz8KnzAjj7wjzs8qHy5ZEXYkc8mYvR4/mJdM0NATHzsGvHaidgst9qZmMkgzzjrABBEyap6ydqJyA5UNAHO59zWAC76oyAt61vo1qrwwIoNw8a6alxCTGjiR86X0L5Jr5UwyYecbOJo0y1xmhn7cboUM7MBPvEHSPj7C+rjGpgZDcjc/Uv6CuOCzBFcNo7l4VFPiWG9ufLJ+oKeUtAxzIIOmU95vYvnPzV/GPO2A20l10TYIo4Q9cv7jndXfCcpiFXyc+KiNG3ql5obhgLTVfBQkOdf/+UFqFtBGeZ2ZXyd2OlPGIZXX6lHDNWSv3plVKwRxDaHtIIwKD2LDjrB2fZipZ6QX+AaH+BNBow2P48BO2EoN8apgTOHuREjYPTs+AsjKjWVm+eTTRB5vAf9gOBzJBOTw8AAAAASUVORK5CYII=';
                            listItem.style.backgroundColor = color;
                            listItem.style.border = '0';
                            listItem.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
                            break;
                        case 1:
                            image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAD4klEQVR4nO1YTU8TURR9URcadWXUGUTjxo1GE3+AQDBKZ1qIiSEu3KkbxQ8S27hwAYkbdacrP2BaJOmMxbiAahGiYHQMoOJHEDqvClpoi3GlNW4Ar7kzHSDQKWVoZ2rSk9ykIUPnnPfuO+e+ElJEEUVkhTjHdMZ5FtJVzMlWkWUC3LwDPC4wqFDuBTiY3TGenUorgGc/QTlZkzX52trV4HZ9TE/eOQ2XuL05F6CK4Jgmw13g2ZNZC/C4Thmuvtt5l+QLk9VbtsY49ldaARw7+aNm08YlyTfUbgCPK25APgn1VSzJJ2Ic22i4CxzbuKQAj7PRePVdDSTfiNaWrovzzHhaERzzZ9yxrdSYfE0JeFy/DVY/BhcPrSdWAPvdaBfwnBgKcLuajZ3HecIS8iqRBrIqzjODBm00M+Eo2b+YfPU+1WHSk/+AzkSsRILbWpnBkZ4uEuBxPsnQ+4dJIYeb5aGVi3D75mAjY+VkrW2htdJwe1/BwlAl22JbaK0k3EYPs9B/gIE3ZQwe2oRtoWU23N5VMKqA0ZpdYGtomQm3z6nVf13GwFR9FdgeWssJtxjPwttybfXHj+6Bggit5YSbcpCJIvnBihL46+ahYEIrW/QfO3gtVFcHwZtt8NAnQ6t/SC383HW7HYavX4WvVy4fJ4UGX0DZJkj0tiAq016JQuZSZrySEvCKIztJIcArhY94RZpEcr77FB4ExyD0bAJ65Di86JtUCz/j39o6xtRnVCEi/eXzR2psJS+I9IK2olQl1ysnQB74nrHwGXx2djf8ynn7Vj5FPtgdXZL4wgp2RVO7ocxYvhN3Wmmp3jZmyM+K6I7OtlOTf6TEMgFeURH0tjFLXq+29lQ7idSauagl8GUHug1u/8KeX9qBtJr/P89fJdRWwu/Enc27ADx0SALdZuFqmhEgD3yHB/qh9ofr8i5AkJQQvqzz2YRhWywkakRcThV+V6qNHuVdgFdUIviyngyWuVwBPXJcFxC2QIDmPhhQuRLwom9SF5D8rwUIkvIz7wIEiSr4sl45nrsWeqm1kCDREcsOMc42uRIQemrhIRZE5axRiJm20aBmo80iPW2BgMh2Lcgii5zIjIBeWQsyr0inLAkyVYSkNOVqlAh0jOrtc4tYeYHBAUwd5rrMD3MdXdFZ92ltHbb2JxafGOb0mcjMRNoxb5wWJFpN7IA2F6UuNO1jGdN5LnXxQjM6/3p5jtgJvIzo7YQHGwcznG3Q2+eulAnVdtFt8Bm9bZpF6iKFgOYA3SxI9AY6STaXekFS7lne81nf1PzhOkGijzFV1bFDpMnU50eCRM9YZpVFFEGywj9c+pb6dWwGxwAAAABJRU5ErkJggg=='
                            break;
                        case 2:
                            image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAD/UlEQVR4nO1Yz28TVxB+Kj1QQU8I2A0p6qUXflTqHwAJQRDv2omQUE4gDsClpRSqet8LIJQcYpG3IZEIEqEkxQQ4YbIvULXgIpqIqIekjlsQCBC/VFIbpJ5Cql6SMGjWXhcRr+043l0j+ZNG2sSW9vvmzcw3z4RUUEEFBSGpSNeTqgzZIuGX68k8AUHVB1oAbOJa6QX4pDUJVZ7OKkCV70EN+bBg8k1NiyAYuJOdvH8GmLK+5AJMEYrUZ3sKqrynYAFaYK9t9oP+XuIUXjasWJlQ5FdZBSjyy38al32cl3xL01LQAkkb8lNwsF4mTiKhyK22p6DIrXkFaP5W++wHWojTeN5U/VFSlSayilCk/yZ8q6rtyTdWgRb41yb7CfhuyxLiBrDe7U4B+8RWQDDwg/3k8e92hbxJpIV8kFSluE0Zzf7tq/piLvmGz80Jk538bZxMxE28UFbW5ZhIN+cI0PzRHLW/lZSzubluWqUwt7988qNnNWSxZ6a1UHP7s1aGu3Vyv2emtRBze7pVhtENEsQ2Sti0LzwzrWLN7Y9ayRTwtPEz8NS0ijG3x+ns/75RgumD9eC5ac3H3BKqDOM1qexPbF8LZWFa8zG3h5ul50g+XlsFr4MqlI1pFYrYtnX8112bYOjoXrhx7Fu4yjUz8Pm3tn3w5OguSBzZuYOUG37sPLxK6PR7wdmM0BnkDjordHpJHGOfknKA4No2odMpJDfY0QzRnhCMXDgJo5EzMC7CZuAz/g8/w+/gdw2dvRrkWqOn5A3ODqQyyiDa0wZjkT6IX+nPGWOXe+H6qbbMaQx00G+8zPys0JthONyVl/i7MRTugsG0CNdPYqCdVltlUwx5K4bDnW+XU5VrAgydnbXKpljyVkR7QmkR1J296Go7W43TBpsR6xlJ5J882SOe7gmzsTmbwZN1XAA2XSr7oUwWFyIgfqUffkmfwoDO9jkuQHB6DV82crF7Tjm8Syzf3/F03LrQbZXRT44LMHT6CF82GuktmYDRyBmrmR84LsCaPjERLpmAmAhbvjD1XgoYTwswOJ10XgCnD80SulzKEupNfcbp/feyiUfOn3Cxidvp16Ueo9GMmbEvHRcgjh/5xDQyvRnGIiUwskifaWSGTqddMTKEwVkfEsCtcmGrxLnMZmpwdpq4eYHBBQxfjFtlsQKGrGWO08mBrsPu/sRidFAlVUq4kXbOO/PDZ/9fp0UHayBeILUXWReaUKYncgWOzOhbFxqhs/3ES+BlxConbGxczHC3QaJodrHMlbI7daXU01dKTicNrgVIOeBS6NBywdkJnCT5pw+dNXR23vWaLwQ4BnElFpz9jK6aWjvoFD6jSQmufeXaqKygAlIQ3gA3Ks8HiF0lWwAAAABJRU5ErkJggg=='
                            break;
                        default:
                            break;
                    }
                    listItem.appendChild(image);
                }
                rankingList.appendChild(listItem);
            }
            ranking.appendChild(rankingHeader);
            ranking.appendChild(rankingList);

            return ranking;
        }

        let statisticsDiv = document.getElementById('statistics');
        statisticsDiv.innerHTML = '';

        // Erstelle ein Ranking für die meisten Aufkommen von Sportlern (Weiblich)
        let occurrencesAthletesFemale = statistics.occurrenceOfEachAthleteByGender(Discipline.GENDERS.Weiblich);
        let namesFemale = occurrencesAthletesFemale.map(entry => entry.person.name);
        let valuesFemale = occurrencesAthletesFemale.map(entry => entry.occurrences);
        let rankingFemale = createRanking(namesFemale, valuesFemale, 'Meiste Aufkommen von Sportlern (Weiblich)', '#f0f0f0');
        statisticsDiv.appendChild(rankingFemale);

        // Erstelle ein Ranking für die meisten Aufkommen von Sportlern (Männlich)
        let occurrencesAthletesMale = statistics.occurrenceOfEachAthleteByGender(Discipline.GENDERS.Maennlich);
        let namesMale = occurrencesAthletesMale.map(entry => entry.person.name);
        let valuesMale = occurrencesAthletesMale.map(entry => entry.occurrences);
        let rankingMale = createRanking(namesMale, valuesMale, 'Meiste Aufkommen von Sportlern (Männlich)', '#f0f0f0');
        statisticsDiv.appendChild(rankingMale);

        // Erstelle ein Ranking für die meisten Rekordhalter (Weiblich)
        let occurrencesRecordHoldersFemale = statistics.occurrenceOfEachAthleteOnFirstPlaceByGender(Discipline.GENDERS.Weiblich);
        let namesRecordHoldersFemale = occurrencesRecordHoldersFemale.map(entry => entry.person.name);
        let valuesRecordHoldersFemale = occurrencesRecordHoldersFemale.map(entry => entry.occurrences);
        let rankingRecordHoldersFemale = createRanking(namesRecordHoldersFemale, valuesRecordHoldersFemale, 'Meiste Rekordhalter (Weiblich)', '#f0f0f0');
        statisticsDiv.appendChild(rankingRecordHoldersFemale);

        // Erstelle ein Ranking für die meisten Rekordhalter (Männlich)
        let occurrencesRecordHoldersMale = statistics.occurrenceOfEachAthleteOnFirstPlaceByGender(Discipline.GENDERS.Maennlich);
        let namesRecordHoldersMale = occurrencesRecordHoldersMale.map(entry => entry.person.name);
        let valuesRecordHoldersMale = occurrencesRecordHoldersMale.map(entry => entry.occurrences);
        let rankingRecordHoldersMale = createRanking(namesRecordHoldersMale, valuesRecordHoldersMale, 'Meiste Rekordhalter (Männlich)', '#f0f0f0');
        statisticsDiv.appendChild(rankingRecordHoldersMale);

        // Erstellt ein Ranking für die am häufigsten vertretenen Orte
        let occurrencesLocations = statistics.occurrenceOfLocation;
        let namesLocations = occurrencesLocations.map(entry => entry.location);
        let valuesLocations = occurrencesLocations.map(entry => entry.occurrences);
        let rankingLocations = createRanking(namesLocations, valuesLocations, 'Meist vertretene Orte', '#f0f0f0');
        statisticsDiv.appendChild(rankingLocations);
    }
}

class Filter {
    /**
     * Klasse für die Filterung der Bestenlisten nach Schwimmstil, Bahnlänge und Geschlecht
     * @property {string} stroke - Schwimmstil (Freistil, Brust, Schmetterling, Rücken, Lagen)
     * @property {string} lane - Bahnlänge (Kurzbahn, Langbahn)
     * @property {string} gender - Geschlecht (Männlich, Weiblich)
     * @property {string} season - Saison (yyyy)
     */

    constructor() {
        this.stroke = Discipline.STROKES.Freistil;
        this.lane = Discipline.LANES.Kurzbahn
        this.gender = Discipline.GENDERS.Weiblich;
        this.season = 'All-Time';
        this.showLeaderboards = false;
    }

    useFilter(filter) {
        /**
         * Funktion zum Anwenden des Filters
         * @param {string} id - ID des Dropdown-List-Elements
         * @param {String} filter - Filterkriterium
         */

        if (filter === 'All-Time' || filter.length === 9) {
            if (filter === 'All-Time') {
                this.season = filter;
            }
            let split = filter.split('/');
            if (split.length === 2) {
                if (parseInt(split[0]).toString().length === 4 && parseInt(split[1]).toString().length === 4) {
                    this.season = filter;
                }
            }
        }
        if (filter === 'Weiblich' || filter === 'Männlich') {
            this.gender = filter;
        }
        if (filter === 'Freistil' || filter === 'Rücken' || filter === 'Brust' || filter === 'Schmetterling' || filter === 'Lagen') {
            this.stroke = filter;
        }
        if (filter === 'Kurzbahn' || filter === 'Langbahn') {
            if (filter === 'Kurzbahn') {
                this.lane = Discipline.LANES.Kurzbahn;
            } else {
                this.lane = Discipline.LANES.Langbahn;
            }
        }
    }

    createDropdownListeners() {
        /**
         * Die Funktion erstellt für jedes Dropdown-List-Element einen Event-Listener
         */

        let mobileSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mobile-size'));

        for (let key in KEYS) {
            let dropdownItem = document.createElement('div');
            dropdownItem.className = 'dropdown-list__item';
            dropdownItem.innerText = KEYS[key].name;
            null
            document.getElementById('dropdown-list__season').appendChild(dropdownItem);
        }

        document.getElementById('dropdown-list__season').firstElementChild.setAttribute('data-radius', 'top');
        document.getElementById('dropdown-list__season').lastElementChild.setAttribute('data-radius', 'bottom');

        // Event Listener für jedes dropdown-select Element
        document.querySelectorAll('.dropdown-list__item').forEach(item => {
            item.addEventListener('click', event => {
                let dropdownItem = event.target;
                let dropdownSelect = dropdownItem.parentElement.previousElementSibling;
                let dropdownList = dropdownItem.parentElement;
                let text = dropdownItem.textContent;
                // Wende einen Filter an
                this.useFilter(text);
                // Verberge die zugehörige dropdown-list
                dropdownItem.parentElement.classList.remove('visible');
                // Setze den Text des dropdown-select Elements auf den ausgewählten Wert
                dropdownSelect.querySelector('span').textContent = text;
                // Drehe auch das Icon um 180 Grad (transform)
                dropdownSelect.querySelector('svg').style.transform = 'rotate(0deg)';
                // Verberge die Dropdown-Liste
                dropdownList.style.visibility = 'hidden';
                dropdownList.style.opacity = '0'
                if (window.innerWidth <= mobileSize) {
                    setTimeout(() => {
                        dropdownList.style.display = 'none';
                    }, 300);
                }
                // Lade die Bestenliste in die Tabelle
                LEADERBOARDS.updateTable();
            });
        });

        // Event Listener für jedes dropdown-select Element
        document.querySelectorAll('.dropdown-select').forEach(item => {

            if (window.innerWidth <= mobileSize) item.addEventListener('click', event => {

                let dropdownList = item.nextElementSibling;
                if (dropdownList.style.visibility === 'visible') {
                    dropdownList.style.visibility = 'hidden';
                    dropdownList.style.opacity = '0';
                    dropdownList.classList.toggle('expanded');
                    setTimeout(() => {
                        dropdownList.style.display = 'none';
                    }, 300);
                } else {
                    dropdownList.style.visibility = 'hidden';
                    dropdownList.style.opacity = '0';
                    dropdownList.style.display = 'block';
                    // Warte 10ms, um den Browser Zeit zu geben, das Display-Attribut zu setzen
                    setTimeout(() => {
                        dropdownList.style.visibility = 'visible';
                        dropdownList.style.opacity = '1';
                        dropdownList.classList.toggle('expanded');
                    }, 10);
                }
            });

            if (window.innerWidth > mobileSize) item.addEventListener('mouseenter', event => {

                let dropdownList = item.nextElementSibling;
                // Verberge alle anderen Dropdown-Listen
                document.querySelectorAll('.dropdown-list').forEach(list => {
                    if (list !== dropdownList) {
                        list.style.visibility = 'hidden';
                        list.style.opacity = '0';
                    }
                });
                if (dropdownList.style.visibility === 'visible') {
                    dropdownList.style.visibility = 'hidden';
                    dropdownList.style.opacity = '0';
                } else {
                    dropdownList.style.visibility = 'visible';
                    dropdownList.style.opacity = '1';
                    let timeout = setTimeout(() => {
                        // Überprüfe, ob der User gerade mit der Maus auf der Dropdown-Liste ist
                        if (dropdownList.matches(':hover')) {
                            clearTimeout(timeout);
                        } else {
                            dropdownList.style.visibility = 'hidden';
                            dropdownList.style.opacity = '0';
                        }
                    }, 1500);
                }
            });
        });

        // Event Listener für jeden election-button
        document.querySelectorAll('.selection-button').forEach(button => {
            button.addEventListener('click', event => {
                let otherButton;
                if (button.id === 'statistics-button') {
                    otherButton = document.getElementById('leaderboards-button');
                    this.showLeaderboards = false;
                } else {
                    otherButton = document.getElementById('statistics-button');
                    this.showLeaderboards = true;
                }
                otherButton.classList.remove('selection-button-selected');
                button.classList.add('selection-button-selected');
                LEADERBOARDS.updateTable();
            });
        });

        if (window.innerWidth > mobileSize) document.body.addEventListener('click', event => {
            // Wenn der Klick nicht auf einem Dropdown-List-Element oder Dropdown-Select war, verberge alle Dropdown-Listen
            if (!event.target.classList.contains('dropdown-list__item') && !event.target.classList.contains('dropdown-select')) {
                document.querySelectorAll('.dropdown-list').forEach(list => {
                    list.style.visibility = 'hidden';
                    list.style.opacity = '0';
                    if (window.innerWidth < mobileSize) {
                        setTimeout(() => {
                            list.style.display = 'none';
                        }, 300);
                    }
                });
            }
        });
    }

    toString() {
        return 'FILTER: Lage: ' + this.stroke + ', Geschlecht: ' + this.gender + ', Bahnlänge: ' + this.lane + ', Saison: ' + this.season;
    }
}

const KEYS = {
    'All-Time': {
        'name': 'All-Time',
        'link': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSMwxC7Lt2jmPudP3caTAR2tkKAwFXB_YTa4t-TxGX61cYzvaysZiX_4NoTAsDLaRsE85TZ4MfkUtmQ/pub?gid=1023752348&single=true&output=tsv'
    },
    '2023/2024': {
        'name': '2023/2024',
        'link': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSMwxC7Lt2jmPudP3caTAR2tkKAwFXB_YTa4t-TxGX61cYzvaysZiX_4NoTAsDLaRsE85TZ4MfkUtmQ/pub?gid=339397320&single=true&output=tsv'
    }
}

let LEADERBOARDS = new Leaderboards();
