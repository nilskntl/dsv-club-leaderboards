/**
 * Remember the cell for the last update date
 */
let cellForUpdateDate = {};

function updateData() {
    /**
     * Update data for all disciplines and distances
     */

        // Get current spreadsheet
    let currentSheet = spreadsheet.getSheetByName(sheetName);

    // Check if the sheet exists
    if (!spreadsheet.getSheetByName(sheetName)) {
        Logger.log(`Sheet "${sheetName}" not found. Creating a new sheet...`);
        sheet();
    }

    // Retrieve data
    const updater = (position, gender, pool, distance) => {
        let data = new Data(position, distance, gender, pool);
        data.updateAll();
        try {
            Logger.log(distance + 'm ' + position + ' ' + gender + ' (' + pool + '): Successful');
        } catch (err) {
            Logger.log(distance + 'm ' + position + ' ' + gender + ' (' + pool + '): Failed, Error Code: ' + err);
        }
    }

    // Format current date
    let date = Utilities.formatDate(new Date(), "GMT+1", "dd.MM.yyyy, HH:mm");

    // Find cell for the update date
    cellForUpdateDate = _findUpdateCell();

    // Write last updated date to the table
    currentSheet.getRange('A' + cellForUpdateDate.row).setValue('Zuletzt aktualisiert am ' + date);
    currentSheet.getRange('A' + cellForUpdateDate.row + ':' + _increaseChar('A', categories.length * 2 - 1) + 1000).setHorizontalAlignment('left');
    currentSheet.getRange('A' + cellForUpdateDate.row + ':' + _increaseChar('A', categories.length * 2 - 1) + cellForUpdateDate.row).merge();

    // Update data for various disciplines and distances
    for (const discipline of disciplines) {
        for (const distance of discipline.distances) {
            // Data for Long course (except 100m Individual Medley)
            if (discipline.position !== "Lagen" || distance !== discipline.distances[0]) {
                updater(discipline.position, "Weiblich", "Langbahn", distance);
                updater(discipline.position, "Männlich", "Langbahn", distance);
            }
            // Data for Short course
            updater(discipline.position, "Weiblich", "Kurzbahn", distance);
            updater(discipline.position, "Männlich", "Kurzbahn", distance);
        }
    }

    // Adjust column width automatically if enabled
    if (automaticColumnWidth) {
        resizeColumnsAutomatically();
        Logger.log('Column width has been adjusted automatically.')
    }
}

class Data {
    /**
     * Data class
     * Contains all necessary methods for data fetching processing
     * @param stroke
     * @param distance
     * @param gender
     * @param poolLength
     */

    constructor(stroke, distance, gender, poolLength) {

        this.stroke = stroke;
        this.distance = distance;
        this.gender = gender;
        this.poolLength = poolLength;
        this.currentSheet = spreadsheet.getSheetByName(sheetName);
        this.range = spreadsheet.getRangeByName(this.stroke + this.gender + this.poolLength + this.distance + 'm');
        if (!this.range) {
            sheet();
            this.range = spreadsheet.getRangeByName(this.stroke + this.gender + this.poolLength + this.distance + 'm');
        }
        this.leaderboard = _formatValues(this.range.getValues());
        _fillEmptyObjects(this.leaderboard);
        this.oldLeaderboard = _formatValues(this.range.getValues());
        _fillEmptyObjects(this.oldLeaderboard);
        this.newRecords = [];

    }

    updateAll() {
        /**
         * Perform all necessary steps to update the data
         */
        this.updateLeaderboard();
        this.updateNewRecords();
        this.writeLeaderboardToSheet();
        if (this.newRecords.length > 0) {
            this.writeNewRecordsToSheet();
        }
    }

    updateLeaderboard() {
        /**
         * Update the leaderboard
         */

            // Get current values
        let currentLeaderboard = this.leaderboard;
        // Get new data
        let newLeaderboard = this._fetchNewData();
        // Merge current with new values
        newLeaderboard = newLeaderboard.concat(currentLeaderboard);
        // Remove duplicates and sort by time
        newLeaderboard = _sortByTime(_removeDuplicates(newLeaderboard));
        // Trim/extend array to length <top>
        newLeaderboard.length = numberOfRankings;
        this.leaderboard = newLeaderboard;
    }

    updateNewRecords() {
        /**
         * Update new records (write new records separately to track changes)
         * @returns {Array}
         */

        // Filter objects that are in the new array but not in the old array
        this.newRecords = this.leaderboard.filter(newObj => {
            // Check if the current object exists in the old array
            return !this.oldLeaderboard.some(oldObj => {
                // Compare properties of the two objects
                return (
                    newObj.name === oldObj.name &&
                    newObj.time === oldObj.time &&
                    newObj.birthYear === oldObj.birthYear &&
                    newObj.location === oldObj.location &&
                    newObj.date === oldObj.date
                );
            });
        });
    }

    writeLeaderboardToSheet() {
        /**
         * Write leaderboard to sheet
         */
            // Format values
        let values = this.leaderboard.map(row => Object.values(row));
        // Transfer data to the table
        try {
            this.range.setValues(values);
        } catch (err) {
            Logger.log(err);
        }
    }

    writeNewRecordsToSheet() {
        /**
         * Write new records to sheet
         */
        let currentDate = new Date();
        let formattedDate = Utilities.formatDate(currentDate, "GMT+1", "dd.MM.yyyy, HH:mm");

        // Load values from column 'A' into an array
        let columnA = this.currentSheet.getRange('A' + (parseInt(cellForUpdateDate.row) + 1) + ':' + 'A' + (parseInt(cellForUpdateDate.row) + 100));
        let currentValues = columnA.getValues();

        if (currentValues[49][0] !== '') {
            columnA.clear();
            currentValues = columnA.getValues();
        }

        // Find start cell
        let start = 0;
        for (let i = 0; i < 49; ++i) {
            if (currentValues[i][0] === '') {
                start = i + parseInt(cellForUpdateDate.row) + 1;
                break;
            }
        }

        // Write new records to cell
        for (let x = 0; x < this.newRecords.length; ++x) {
            this.currentSheet.getRange('A' + (start + x)).setValue("Zuletzt hinzugefügt am " + formattedDate + ": " + this.newRecords[x].name + ", " + this.distance + "m " + this.stroke + ' (' + this.poolLength + '); ' + this.newRecords[x].time + '.');
            this.currentSheet.getRange('A' + (start + x) + ':' + _increaseChar('A', categories.length * 2 - 1) + (start + x)).merge();
        }
    }

    _fetchNewData() {
        /**
         * Fetch new data from the DSV website
         * @returns {Array}
         */

            // Perform URL request for login
        let loginResponse = UrlFetchApp.fetch(`https://dsvdaten.dsv.de/Modules/Clubs/Club.aspx?ClubID=${clubId}`, {});

        // Check if login was successful and extract session information
        let loginContext = loginResponse.getContentText();

        // Determine viewstate
        let viewState = _extractData(loginContext, '__VIEWSTATE" value="', '" />');
        // Determine event validation
        let eventValidation = _extractData(loginContext, '__EVENTVALIDATION" value="', '" />');

        // Determine current year
        let year = String(new Date().getFullYear()).substring(0, 4);

        // Determine current month
        let month = parseInt(new Date().getUTCMonth());

        // If the current month is greater than or equal to 6, the year is incremented by cause a new season has started
        if (month >= 6) {
            year += 1;
        }

        // Create POST parameters
        let payload = {
            "ClubID": clubId,
            "__EVENTTARGET": "ctl00$ContentSection$_rankingsButton",
            "__VIEWSTATE": viewState,
            "__EVENTVALIDATION": eventValidation,
            "ctl00$ContentSection$_genderRadioButtonList": this.gender.substring(0, 1),
            "ctl00$ContentSection$_courseRadioButtonList": (this.poolLength === "Langbahn") ? "L" : "S",
            "ctl00$ContentSection$_eventDropDownList": `${this.distance + this.stroke.substring(0, 1)}|GL`,
            "ctl00$ContentSection$_timerangeDropDownList": `01.06.${year - 1}|31.05.${year}`
        };

        // Configure Fetch call
        let options = {
            method: "post",
            payload: payload
        };

        // Perform Fetch call and extract table
        let content = _extractData(UrlFetchApp.fetch(`https://dsvdaten.dsv.de/Modules/Clubs/Club.aspx?ClubID=${clubId}`, options).getContentText(), 'class="table table-sm table-stripe"', '</table>');

        // Extract elements into a one-dimensional array
        let contentArray = _splitElement(content, '<tr>', '</tr>');
        contentArray.shift(); // Remove the first empty entry
        contentArray.shift(); // Remove the second (header) entry

        // Format data into a two-dimensional array
        return _convertToArray(contentArray);
    }
}

/**
 Utils functions
 */


function _formatValues(values) {
    /**
     * Format values
     * @param values
     * @returns {Array}
     */
    return values
        .filter(row => row[0] !== '')
        .map(row => ({
            name: row[0],
            time: row[1],
            birthYear: row[2],
            location: row[3],
            date: row[4],
        }));
}

function _findUpdateCell() {
    /**
     * Find cell for the update date
     */

    let sheet = spreadsheet.getSheetByName(sheetName);

    let i = 1;
    while (true) {
        let currentCellValue = sheet.getRange('A' + i).getValue();
        let nextCellValue = sheet.getRange('A' + (i + 1)).getValue();
        if ((currentCellValue === '' && nextCellValue === '') || String(currentCellValue).includes('Zuletzt')) {
            return {column: 'A', row: !String(currentCellValue).includes('Zuletzt') ? String(i + 1) : String(i)};
        }
        ++i;
    }
}

function _fillEmptyObjects(arr) {
    /**
     * Fill empty objects
     */
    while (arr.length < numberOfRankings) {
        arr.push({name: " ", time: " ", birthYear: " ", location: "", date: " "});
    }
}

function _splitElement(input, begin, end) {
    /**viewstate
     * Split elements
     * @param input input string
     * @param begin begin string
     * @param end end string
     * @returns {Array}
     */
    return input.split(begin).map(element => element.split(end)[0]);
}

function _extractData(context, begin, end) {
    /**
     * Extract data from the raw HTML
     * @param context raw HTML
     * @param begin begin string
     * @param end end string
     * @returns {string} extracted data
     */
    let startIndex = context.indexOf(begin);
    let endIndex = context.indexOf(end, startIndex);
    return context.substring(startIndex + begin.length, endIndex);

}

function _convertToArray(elements, top) {
    /**
     * Convert elements to array
     * @param elements elements
     * @param top top
     * @returns {Array}
     */
    return elements.slice(0, top).map(element => {
        let [, position, name, birthYear, time, , location, date] = _splitElement(element, '<td>', '</td>');
        return {name, time, birthYear, location, date: date.substring(6)};
    });
}

function _sortByTime(arr) {
    /**
     * Sort the array by time (from fastest to slowest)
     * @param arr array
     * @returns {Array} sorted array
     */
    arr.sort((a, b) => convertStringToTime(a.time) - convertStringToTime(b.time));
    return arr;
}

function convertStringToTime(timeString) {
    /**
     * Convert time string to integer. The integer is not in a correct format for time, but it is sufficient for comparison.
     * @param timeString time string
     * @returns {number} time in an integer format
     */
    return parseInt(timeString.replace(/[:,]/g, ""));
}

function _removeDuplicates(arr) {
    /**
     * Remove duplicates from the array
     * @param arr array
     * @returns {Array} array without duplicates
     */
    let uniqueObjects = {};
    for (let object of arr) {
        let name = object.name;
        if (!(name in uniqueObjects) || convertStringToTime(object.time) < convertStringToTime(uniqueObjects[name].time)) {
            uniqueObjects[name] = object;
        }
    }
    return Object.values(uniqueObjects);
}
