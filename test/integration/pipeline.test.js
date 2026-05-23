'use strict';
/**
 * Integration tests — make real HTTP requests to dsvdaten.dsv.de.
 * These tests are intentionally narrow (one discipline at a time) to stay fast.
 * Run with: npm run test:integration
 *
 * Set CLUB_ID to your club's DSV ID to test against real data.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createContext } = require('../setup');

const CLUB_ID = process.env.CLUB_ID || '7985';

describe(`DSV pipeline — club ${CLUB_ID} (real HTTP)`, () => {

    it('_fetchNewData returns correctly shaped objects for freestyle 50m short course male', () => {
        const ctx = createContext();
        const lb = new ctx.Leaderboard(CLUB_ID, [], 5);
        const discipline = lb.disciplines.find(d => d.uid === '#f502m');

        const data = lb._requestHandler._fetchNewData(discipline);

        assert.ok(Array.isArray(data), 'response must be an array');
        if (data.length > 0) {
            const r = data[0];
            assert.ok(typeof r.name === 'string' && r.name.length > 0, 'name must be a non-empty string');
            assert.ok(typeof r.time === 'string', 'time must be a string');
            assert.match(r.time, /^\d+:\d{2},\d{2}$/, 'time must match mm:ss,xx');
            assert.ok(typeof r.birthYear === 'string', 'birthYear must be a string');
            assert.ok(typeof r.location === 'string', 'location must be a string');
            assert.ok(typeof r.date === 'string', 'date must be a string');
        }
    });

    it('single-discipline pipeline: results are sorted and capped at entriesPerDiscipline', () => {
        const ctx = createContext();
        const lb = new ctx.Leaderboard(CLUB_ID, [], 3);

        // Restrict to one discipline so we make only 2 HTTP requests (GET + POST), not ~80
        const target = lb.disciplines.find(d => d.uid === '#f502m');
        lb._disciplines = [target];

        lb.extractResultsFromSheet(); // no existing data
        lb.requestResults();
        lb.adjustResults();

        assert.ok(target.results.length <= 3, 'must not exceed entriesPerDiscipline');

        for (let i = 1; i < target.results.length; i++) {
            assert.ok(
                target.results[i - 1].time.totalHundredth <= target.results[i].time.totalHundredth,
                'results must be sorted fastest first'
            );
        }

        for (const r of target.results) {
            assert.equal(r.newRecord, true, 'all DSV results should be marked newRecord=true');
        }
    });

    it('merging sheet data with DSV data does not produce duplicates', () => {
        const ctx = createContext();

        // Seed the leaderboard with one existing result from the sheet
        const existingSheetData = [
            ['#f502m', '1.', 'Existing Swimmer', '0:25,00', '2005', 'Berlin', '01.01.2024',
             '#f502w', '1.', '', '', '', '', ''],
        ];
        const lb = new ctx.Leaderboard(CLUB_ID, existingSheetData, 5);
        lb._disciplines = [lb.disciplines.find(d => d.uid === '#f502m')];

        lb.extractResultsFromSheet(); // loads 'Existing Swimmer' as newRecord=false
        lb.requestResults();          // adds DSV results as newRecord=true
        lb.adjustResults();           // deduplicates, sorts, cuts

        const names = lb.disciplines[0].results.map(r => r.person.name);
        const unique = new Set(names);
        assert.equal(unique.size, names.length, 'no swimmer should appear more than once');
    });
});
