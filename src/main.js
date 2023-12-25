/*
Settings
*/
const clubId = '7985'; // Club-ID
const numberOfRankings = 5; // Wieviele sollen pro Strecke angezeigt werden (Top3, Top4, Top5 ...)
const sheetName = 'Bestenlisten';

// Disciplines
const disciplines = [
    {position: "Freistil", distances: ["50", "100", "200", "400", "800", "1500"]},
    {position: "Schmetterling", distances: ["50", "100", "200"]},
    {position: "Rücken", distances: ["50", "100", "200"]},
    {position: "Brust", distances: ["50", "100", "200"]},
    {position: "Lagen", distances: ["100", "200", "400"]}
]

// Categories and width of the columns
const categories = [
    {categorie: 'Platz', cellWidth: 75},
    {categorie: 'Name', cellWidth: 150},
    {categorie: 'Zeit', cellWidth: 100},
    {categorie: 'Jahrgang', cellWidth: 75},
    {categorie: 'Ort', cellWidth: 150},
    {categorie: 'Datum', cellWidth: 75}
]

// Automatically adjusts the width of the columns to the content, the width of the categories then no longer has any influence
const automaticColumnWidth = false;

// Update the current data
function update() {
    Logger.log('Start by updating the data...');
    Logger.log('---------------');
    updateData();
    Logger.log('All data updated. Program is terminated.');
}

// Format the current sheet
function formatSheet() {
    sheet();
}
