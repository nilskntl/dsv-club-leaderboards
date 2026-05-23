'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getContext } = require('../setup');

describe('Sheet.extractResults', () => {
    const ctx = getContext();

    // Minimal mock sheet data matching the 14-column layout.
    // Only result rows (with '#'-prefixed UIDs in cols 0 and 7) are picked up.
    const MOCK_DATA = [
        // Row 1: season header (merged, no UIDs)
        ['All-Time', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        // Row 2: reserved
        ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        // Stroke group header rows
        ['Freistil', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['Männlich', '', '', '', '', '', 'Weiblich', '', '', '', '', '', '', ''],
        ['UID', 'Platz', 'Name', 'Zeit', 'Jahrgang', 'Ort', 'Datum', 'UID', 'Platz', 'Name', 'Zeit', 'Jahrgang', 'Ort', 'Datum'],
        // Distance label row
        ['50m (Kurzbahn)', '', '', '', '', '', '', '50m (Kurzbahn)', '', '', '', '', '', ''],
        // Rank 1: real result on both sides
        ['#f502m', '1.', 'Max Müller',   '0:25,12', '2005', 'Berlin',  '15.06.2023',
         '#f502w', '1.', 'Anna Schmidt', '0:27,34', '2006', 'Hamburg', '20.07.2023'],
        // Rank 2: empty slot (should be skipped)
        ['#f502m', '2.', '', '', '', '', '', '#f502w', '2.', '', '', '', '', ''],
    ];

    it('loads a male result into the correct discipline', () => {
        const lb = new ctx.Leaderboard('7985', MOCK_DATA, 5);
        lb.extractResultsFromSheet();
        const male = lb.disciplines.find(d => d.uid === '#f502m');
        assert.equal(male.results.length, 1);
        assert.equal(male.results[0].person.name, 'Max Müller');
        assert.equal(male.results[0].time.toString(), '0:25,12');
        assert.equal(male.results[0].person.birth, '2005');
        assert.equal(male.results[0].location, 'Berlin');
    });

    it('loads a female result into the correct discipline', () => {
        const lb = new ctx.Leaderboard('7985', MOCK_DATA, 5);
        lb.extractResultsFromSheet();
        const female = lb.disciplines.find(d => d.uid === '#f502w');
        assert.equal(female.results.length, 1);
        assert.equal(female.results[0].person.name, 'Anna Schmidt');
    });

    it('skips empty rank slots', () => {
        const lb = new ctx.Leaderboard('7985', MOCK_DATA, 5);
        lb.extractResultsFromSheet();
        const male = lb.disciplines.find(d => d.uid === '#f502m');
        assert.equal(male.results.length, 1); // rank 2 is empty → skipped
    });

    it('marks all sheet-sourced results as newRecord=false', () => {
        const lb = new ctx.Leaderboard('7985', MOCK_DATA, 5);
        lb.extractResultsFromSheet();
        const male = lb.disciplines.find(d => d.uid === '#f502m');
        assert.equal(male.results[0].newRecord, false);
    });

    it('getSheetData round-trips: extracted results appear in the output array', () => {
        const lb = new ctx.Leaderboard('7985', MOCK_DATA, 5);
        lb.extractResultsFromSheet();
        lb.adjustResults();
        const output = lb.results;
        assert.ok(Array.isArray(output));
        // Find the row that contains 'Max Müller'
        const row = output.find(r => r.includes('Max Müller'));
        assert.ok(row, 'Max Müller should appear in the output');
        assert.equal(row[2], 'Max Müller');
        assert.equal(row[3], '0:25,12');
    });
});
