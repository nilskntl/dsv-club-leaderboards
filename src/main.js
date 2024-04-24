/**
* Settings
*/
const clubId = '7985'; // Club-ID
const numberOfRankings = 5; // How many people should be displayed in the rankings
const sheetName = 'Bestenlisten';
const automaticColumnWidth = false;

/**
 * Disciplines and distances for the different strokes
 */
const disciplines = [
    {position: "Freistil", distances: ["50", "100", "200", "400", "800", "1500"]},
    {position: "Schmetterling", distances: ["50", "100", "200"]},
    {position: "Rücken", distances: ["50", "100", "200"]},
    {position: "Brust", distances: ["50", "100", "200"]},
    {position: "Lagen", distances: ["100", "200", "400"]}
]

/**
 * Categories for the sheet and the width of the cells
 * The width of the cells is only relevant if automaticColumnWidth is set to false
 */
const categories = [
    {categorie: 'Platz', cellWidth: 50},
    {categorie: 'Name', cellWidth: 200},
    {categorie: 'Zeit', cellWidth: 100},
    {categorie: 'Jahrgang', cellWidth: 100},
    {categorie: 'Ort', cellWidth: 150},
    {categorie: 'Datum', cellWidth: 100}
]

function update() {
    /**
     * Update the data (main function)
     */
    Logger.log('Start by updating the data...');
    Logger.log('---------------');
    updateData();
    Logger.log('All data updated. Program is terminated.');
}

function formatSheet() {
    /**
     * Format the current sheet
     */
    sheet();
}
