'use strict';
/**
 * Integration tests — make real HTTP requests to dsvdaten.dsv.de.
 * These tests are intentionally narrow (one discipline at a time) to stay fast.
 * Run with: npm run test:integration
 *
 * Set CLUB_ID to your club's DSV ID to test against real data.
 * Set VERBOSE=1 to print Logger output.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createContext } = require('../setup');

const CLUB_ID = process.env.CLUB_ID || '7985';

// Pause between tests to stay under the DSV rate limit.
// The DSV server rate-limits by session, so back-to-back test runs can trigger 429.
const pause = (ms) => new Promise(r => setTimeout(r, ms));
const INTER_TEST_DELAY_MS = 4000;

describe(`DSV pipeline — club ${CLUB_ID} (real HTTP)`, () => {

    it('_fetchNewData returns correctly shaped objects for freestyle 50m short course male', async () => {
        const ctx = createContext();
        const lb = new ctx.Leaderboard(CLUB_ID, [], 5);
        const handler = lb._requestHandler;
        const discipline = lb.disciplines.find(d => d.uid === '#f502m');

        const pageHtml = handler._getPage();
        const viewState = handler._extractData(pageHtml, '__VIEWSTATE" value="', '" />');
        const eventValidation = handler._extractData(pageHtml, '__EVENTVALIDATION" value="', '" />');
        const { data } = handler._fetchNewData(discipline, viewState, eventValidation);

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

    it('single-discipline pipeline: results are sorted and capped at entriesPerDiscipline', async () => {
        await pause(INTER_TEST_DELAY_MS);

        const ctx = createContext();
        const lb = new ctx.Leaderboard(CLUB_ID, [], 3);

        // Restrict to one discipline so we make only 1 GET + 1 POST, not ~140 requests
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

    it('merging sheet data with DSV data does not produce duplicates', async () => {
        await pause(INTER_TEST_DELAY_MS);

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

    it('VIEWSTATE chain: single GET provides tokens that chain through multiple sequential POSTs', async (t) => {
        await pause(INTER_TEST_DELAY_MS);

        const ctx = createContext();
        const lb = new ctx.Leaderboard(CLUB_ID, [], 5);
        const handler = lb._requestHandler;

        const DISCIPLINE_UIDS = ['#f502m', '#b502w', '#r502m'];

        // ONE GET for all disciplines — this is the invariant we are testing
        const pageHtml = handler._getPage();
        let viewState = handler._extractData(pageHtml, '__VIEWSTATE" value="', '" />');
        let eventValidation = handler._extractData(pageHtml, '__EVENTVALIDATION" value="', '" />');

        // The live DSV server rate-limits by IP; a suite run (or repeated runs) can trip it.
        // A GET without tokens is the rate limiter answering, not a code defect — skip, don't fail.
        if (viewState.length === 0 && eventValidation.length === 0) {
            t.skip('DSV rate limited the initial GET (no tokens in response) — try again later');
            return;
        }

        assert.ok(viewState.length > 0, 'initial viewState must not be empty');
        assert.ok(eventValidation.length > 0, 'initial eventValidation must not be empty');

        for (const uid of DISCIPLINE_UIDS) {
            const discipline = lb.disciplines.find(d => d.uid === uid);
            assert.ok(discipline, `discipline ${uid} must exist`);

            const { data, nextViewState, nextEventValidation } =
                handler._fetchNewData(discipline, viewState, eventValidation);

            assert.ok(nextViewState.length > 0, `${uid}: POST response must contain a fresh viewState`);
            assert.ok(nextEventValidation.length > 0, `${uid}: POST response must contain a fresh eventValidation`);
            assert.ok(Array.isArray(data), `${uid}: data must be an array`);

            if (data.length > 0) {
                const r = data[0];
                assert.ok(typeof r.name === 'string' && r.name.length > 0, `${uid}: name must be a non-empty string`);
                assert.ok(typeof r.time === 'string', `${uid}: time must be a string`);
            }

            // Forward tokens to the next POST — this is the chain being tested
            viewState = nextViewState;
            eventValidation = nextEventValidation;

            await pause(2000);
        }
    });
});
