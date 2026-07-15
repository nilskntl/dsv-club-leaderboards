'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getContext, createContext } = require('../setup');

describe('RequestHandler discipline filter', () => {
    const { Leaderboard, GENDERS, STROKES, LANES } = getContext();

    function makeHandler() {
        return new Leaderboard('7985', [], 5)._requestHandler;
    }

    it('no filter or empty filter matches every discipline', () => {
        const handler = makeHandler();
        const lb = handler._leaderboard;
        assert.ok(lb.disciplines.every(d => handler._matchesFilter(d, undefined)));
        assert.ok(lb.disciplines.every(d => handler._matchesFilter(d, {})));
        assert.ok(lb.disciplines.every(d => handler._matchesFilter(d, { genders: [] })));
    });

    it('gender filter splits the disciplines into two complete halves', () => {
        const handler = makeHandler();
        const all = handler._leaderboard.disciplines;
        const male = all.filter(d => handler._matchesFilter(d, { genders: [GENDERS.MALE] }));
        const female = all.filter(d => handler._matchesFilter(d, { genders: [GENDERS.FEMALE] }));

        assert.equal(male.length + female.length, all.length);
        assert.equal(male.length, female.length);
        assert.ok(male.every(d => d.gender === GENDERS.MALE));
        assert.ok(female.every(d => d.gender === GENDERS.FEMALE));
    });

    it('provided filter keys combine with AND; lanes and distances match across string/number', () => {
        const handler = makeHandler();
        const matches = handler._leaderboard.disciplines.filter(d => handler._matchesFilter(d, {
            genders: [GENDERS.FEMALE],
            strokes: [STROKES.FREESTYLE],
            lanes: [LANES.SHORT_COURSE],
            distances: [50, '100']
        }));

        // Spread into a Node-realm array — vm-context arrays fail deepEqual's prototype check
        assert.deepEqual([...matches.map(d => d.uid)].sort(), ['#f102w', '#f502w']);
    });

    it('requestResults with a filter that matches nothing makes no HTTP requests', () => {
        const ctx = createContext();
        let fetchCalls = 0;
        ctx.UrlFetchApp.fetch = () => {
            fetchCalls++;
            throw new Error('unexpected HTTP request');
        };

        const lb = new ctx.Leaderboard('7985', [], 5);
        lb.requestResults({ genders: ['does-not-exist'] });

        assert.equal(fetchCalls, 0);
    });
});
