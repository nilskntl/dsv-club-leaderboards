class Time {
    /**
     * Parses and compares swimming times in the format "mm:ss,xx"
     * (minutes, seconds, hundredths of a second).
     *
     * All comparisons use integer hundredths (totalHundredth) to avoid
     * floating-point precision issues that would arise from decimal seconds.
     *
     * @param {string} time - Time string in "mm:ss,xx" format, e.g. "1:23,45".
     */
    constructor(time) {
        this._time = time;
        let timeParts = time.split(":");
        this._minutes = parseInt(timeParts[0]);
        let secondsAndHundredth = (timeParts[1] || '').split(",");
        this._seconds = parseInt(secondsAndHundredth[0]);
        this._hundredth = parseInt(secondsAndHundredth[1]);
        if (Number.isNaN(this._minutes) || Number.isNaN(this._seconds) || Number.isNaN(this._hundredth)) {
            console.warn('[Time] Could not fully parse time "' + time + '" (expected "mm:ss,xx") — ' +
                'minutes=' + this._minutes + ', seconds=' + this._seconds + ', hundredth=' + this._hundredth);
        }
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

    /**
     * Total elapsed time as an integer number of hundredths of a second.
     * Used for all sorting and comparisons to avoid floating-point errors
     * that would occur when converting to decimal seconds.
     */
    get totalHundredth() {
        return this._minutes * 6000 + this._seconds * 100 + this._hundredth;
    }

    equals(time) {
        return this._time === time.time;
    }

    toString() {
        return this._time;
    }

    /**
     * Comparator for ascending order — faster (lower) time sorts first.
     * Intended for use with Array.sort() when building a top-N leaderboard.
     *
     * @param {Time} time1
     * @param {Time} time2
     * @returns {number} Negative if time1 is faster, positive if slower, 0 if equal.
     */
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
