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