/**
 * Get access to the active spreadsheet
 */
const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

function sheet() {
    /**
     * Main function to create and format the sheet
     */
    _createSheet();
    _formatSheet();
}

function resizeColumnsAutomatically() {
    /**
     * Automatically adjust the width of all columns based on content
     */
    let sheet = spreadsheet.getSheetByName(sheetName);
    sheet.autoResizeColumns(1, sheet.getLastColumn());
}

function _createSheet() {
    /**
     * Function to create a new sheet if it doesn't already exist
     */
        // Check if a sheet with the name "Test" already exists
    let sheet = spreadsheet.getSheetByName(sheetName);

    // If the sheet doesn't exist, create it
    if (!sheet) {
        // Create a new sheet with the name "Test"
        sheet = spreadsheet.insertSheet(sheetName);
        Logger.log(`New sheet "${sheetName}" created.`);
    }
}

/**
 * Constants for styling and coloring
 */
const standardAlignment = 'center';
const alignmentNames = 'left'
const font = 'Questrial';

const primaryTextColor = '#2E2727';
const secondaryTextColor = '#FFFFFF';

const colorEvenFemale = '#e6dfe5';
const colorOddFemale = '#dacbdd';
const colorEvenMale = '#d1e5ef';
const colorOddMale = '#bbd5ea';
const colorHeader = '#252626';
const colorSwimPosition = colorHeader;

const colorFemale = '#652a5f';
const colorMale = '#25476a';

const colorDistanceFemale = colorFemale;
const colorDistanceMale = colorMale;
const colorLaneLengthFemale = '#936091';
const colorLaneLengthMale = '#6992b4';

const textColorDistanceFemale = secondaryTextColor;
const textColorDistanceMale = secondaryTextColor;
const textColorHeaderColor = secondaryTextColor;
const textColorSwimPosition = secondaryTextColor;
const textColorLaneLengthFemale = secondaryTextColor;
const textColorLaneLengthMale = secondaryTextColor;
const textColorFemale = secondaryTextColor;
const textColorMale = secondaryTextColor;

/**
 * Arrays for different disciplines and categories
 */
const laneLength = ['Kurzbahn', 'Langbahn'];
const genders = ['Weiblich', 'Männlich']

function _formatSheet() {
    /**
     * Function to format the sheet
     */
    Logger.log('Formatting sheet...');

    let sheet = spreadsheet.getSheetByName(sheetName);

    sheet.getDataRange().clearFormat();

    // Format the entire sheet
    for (var col = 1; col <= sheet.getMaxColumns(); col++) {
        let fullSheet = sheet.getRange(1, col, sheet.getMaxRows(), 1)

        fullSheet.setHorizontalAlignment(standardAlignment);
        fullSheet.setFontColor(primaryTextColor);
        fullSheet.setNumberFormat("@");
        fullSheet.setFontFamily(font);
    }

    // Loop through different disciplines
    for (const discipline of disciplines) {
        let startCell = _findStartCell(discipline.position);
        let column = startCell.column;
        let row = parseInt(startCell.row);

        // Header styling for each discipline
        let headerStroke = sheet.getRange(column + row + ':' + _increaseChar(column, categories.length * 2 - 1) + String(row));
        headerStroke.merge();
        headerStroke.setBackground(colorSwimPosition);
        headerStroke.setFontColor(textColorSwimPosition);
        headerStroke.setValue(discipline.position);

        // Gender headers
        row++;
        let headerFemale = sheet.getRange(column + row + ':' + _increaseChar(column, categories.length - 1) + row);
        let headerMale = sheet.getRange(_increaseChar(column, categories.length) + row + ':' + _increaseChar(column, categories.length * 2 - 1) + String(row));

        headerFemale.merge();
        headerFemale.setFontColor(textColorFemale);
        headerFemale.setBackground(colorFemale);
        headerFemale.setValue(genders[0]);

        headerMale.merge();
        headerMale.setFontColor(textColorMale);
        headerMale.setBackground(colorMale);
        headerMale.setValue(genders[1]);

        row++;

        // Actual header for categories
        for (let i = 0; i < categories.length * 2; ++i) {
            let header = sheet.getRange(_increaseChar(column, i) + row)
            header.setValue(i >= categories.length ? categories[i - categories.length].categorie : categories[i].categorie);
            header.setBackground(colorHeader);
            header.setFontColor(textColorHeaderColor);

            // Column width
            if (!resizeColumnsAutomatically) {
                sheet.setColumnWidth(_increaseChar(column, i).charCodeAt(0) - 64, i >= categories.length ? categories[i - categories.length].cellWidth : categories[i].cellWidth);
            }
        }

        ++row;

        // Loop through different distances for each discipline
        for (let y = 0; y < discipline.distances.length; ++y) {
            let disciplineLengthFemale = sheet.getRange(column + row + ':' + _increaseChar(column, categories.length - 1) + row);
            let disciplineLengthMale = sheet.getRange(_increaseChar(column, categories.length) + row + ':' + _increaseChar(column, categories.length * 2 - 1) + String(row++));

            disciplineLengthFemale.merge();
            disciplineLengthMale.merge();

            disciplineLengthFemale.setValue(discipline.distances[y] + 'm');
            disciplineLengthMale.setValue(discipline.distances[y] + 'm');

            disciplineLengthFemale.setBackground(colorDistanceFemale);
            disciplineLengthMale.setBackground(colorDistanceMale);

            disciplineLengthFemale.setFontColor(textColorDistanceFemale);
            disciplineLengthMale.setFontColor(textColorDistanceMale);

            // Set up named ranges for each cell range
            let rangeLongCourseFemale = sheet.getRange(_increaseChar(column, 1) + (row + 1) + ':' + _increaseChar(column, categories.length - 1) + (row + numberOfRankings));
            let rangeLongCourseMale = sheet.getRange(_increaseChar(column, categories.length + 1) + (row + 1) + ':' + _increaseChar(column, categories.length * 2 - 1) + (row + numberOfRankings));
            let rangeShortCourseFemale = sheet.getRange(_increaseChar(column, 1) + (row + numberOfRankings + 2) + ':' + _increaseChar(column, categories.length - 1) + (row + numberOfRankings * 2 + 1));
            let rangeShortCourseMale = sheet.getRange(_increaseChar(column, categories.length + 1) + (row + numberOfRankings + 2) + ':' + _increaseChar(column, categories.length * 2 - 1) + (row + numberOfRankings * 2 + 1));

            if (discipline.position !== 'Lagen' || discipline.distances[y] !== '100') spreadsheet.setNamedRange(discipline.position + 'Weiblich' + 'Langbahn' + discipline.distances[y] + 'm', rangeLongCourseFemale);
            if (discipline.position !== 'Lagen' || discipline.distances[y] !== '100') spreadsheet.setNamedRange(discipline.position + 'Männlich' + 'Langbahn' + discipline.distances[y] + 'm', rangeLongCourseMale);
            spreadsheet.setNamedRange(discipline.position + 'Weiblich' + 'Kurzbahn' + discipline.distances[y] + 'm', discipline.position !== 'Lagen' || discipline.distances[y] !== '100' ? rangeShortCourseFemale : rangeLongCourseFemale);
            spreadsheet.setNamedRange(discipline.position + 'Männlich' + 'Kurzbahn' + discipline.distances[y] + 'm', discipline.position !== 'Lagen' || discipline.distances[y] !== '100' ? rangeShortCourseMale : rangeLongCourseMale);

            // Format each row of the range
            for (let i = 0; discipline.position !== 'Lagen' || discipline.distances[y] !== '100' ? i < numberOfRankings * 2 + 2 : i < numberOfRankings + 1; ++i, ++row) {
                let female = sheet.getRange(column + row + ':' + _increaseChar(column, categories.length - 1) + row);
                let male = sheet.getRange(_increaseChar(column, categories.length) + row + ':' + _increaseChar(column, categories.length * 2 - 1) + row);

                if (i === 0 || i === numberOfRankings + 1) {
                    female.merge();
                    male.merge();

                    female.setValue(i === 0 && (discipline.position !== 'Lagen' || discipline.distances[y] !== '100') ? laneLength[1] : laneLength[0]);
                    male.setValue(i === 0 && (discipline.position !== 'Lagen' || discipline.distances[y] !== '100') ? laneLength[1] : laneLength[0]);

                    female.setBackground(colorLaneLengthFemale);
                    male.setBackground(colorLaneLengthMale);

                    female.setFontColor(textColorLaneLengthFemale);
                    male.setFontColor(textColorLaneLengthMale);

                } else {
                    female.setBackground(row % 2 === 0 ? colorEvenFemale : colorOddFemale);
                    male.setBackground(row % 2 === 0 ? colorEvenMale : colorOddMale);

                    sheet.getRange(column + row).setValue(i > numberOfRankings + 1 ? (i - numberOfRankings - 1) + '.' : i + '.');
                    sheet.getRange(_increaseChar(column, categories.length) + row).setValue(i > numberOfRankings + 1 ? (i - numberOfRankings - 1) + '.' : i + '.');
                    sheet.getRange(_increaseChar(column, 1) + row).setHorizontalAlignment(alignmentNames);
                    sheet.getRange(_increaseChar(column, categories.length + 1) + row).setHorizontalAlignment(alignmentNames);
                }
            }
        }
    }

    Logger.log('Formatting complete.');
    Logger.log('---------------');
}

function _findStartCell(stroke) {
    /**
     * Function to find the first empty cell (followed by another empty cell) in the first column. If the stroke
     * already exists, return the cell of the stroke
     * @param {string} stroke - The stroke to find the first empty cell for
     */
    let sheet = spreadsheet.getSheetByName(sheetName)
    let i = 1;

    if (sheet.getRange('A' + 1).getValue() === stroke) {
        return {column: 'A', row: '1'};
    }

    if (sheet.getRange(_increaseChar('A', categories.length * 2 + 1) + 1).getValue() === stroke) {
        return {column: _increaseChar('A', categories.length * 2 + 1), row: '1'};
    }

    while (true) {
        if ((sheet.getRange('A' + i).getValue() === '' && sheet.getRange('A' + (i + 1)).getValue() === '') || sheet.getRange('A' + i).getValue() === stroke) {
            return {
                column: 'A',
                row: i > 1 && sheet.getRange('A' + i).getValue() !== stroke ? String(i + 1) : String(i)
            };
        }

        if (_increaseChar('A', categories.length * 4).charCodeAt(0) <= 90 && ((sheet.getRange(_increaseChar('A', categories.length * 2 + 1) + i).getValue() === '' && sheet.getRange(_increaseChar('A', categories.length * 2 + 1) + (i + 1)).getValue() === '') || sheet.getRange(_increaseChar('A', categories.length * 2 + 1) + i).getValue() === stroke)) {
            return {
                column: _increaseChar('A', categories.length * 2 + 1),
                row: i > 1 && sheet.getRange(_increaseChar('A', categories.length * 2 + 1) + i).getValue() !== stroke ? String(i + 1) : String(i)
            };
        }
        ++i;
    }
}

function _increaseChar(char, increaseBy) {
    /**
     * Function to increase a character by a certain amount
     * @param {string} char - The character to increase
     * @param {number} increaseBy - The amount to increase the character by
     */
    return String.fromCharCode(char.charCodeAt(0) + increaseBy);
}
