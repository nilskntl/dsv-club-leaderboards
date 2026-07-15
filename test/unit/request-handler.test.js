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

describe('RequestHandler error handling and warnings', () => {
    // Filter matching exactly two disciplines: male 50m freestyle, long course first (#f505m), then short course (#f502m)
    const TWO_DISCIPLINES_FILTER = { genders: ['Männlich'], strokes: ['Freistil'], distances: ['50'] };

    function makeResponse(code, body) {
        return { getResponseCode: () => code, getContentText: () => body };
    }

    function tokenPage(viewState, eventValidation, tableRows = '') {
        let html = `<input type="hidden" name="__VIEWSTATE" value="${viewState}" /><input type="hidden" name="__EVENTVALIDATION" value="${eventValidation}" />`;
        if (tableRows) {
            html += `<table class="table table-sm table-stripe"><tr><th>Header</th></tr>${tableRows}</table>`;
        }
        return html;
    }

    const RESULT_ROW = '<tr><td>1.</td><td>Test Schwimmer</td><td>2005</td><td>00:27,10</td><td>25</td><td>Berlin</td><td>01.06.2026</td></tr>';

    it('a 429 that persists after the retry records a warning and aborts the run', () => {
        const ctx = createContext();
        let postCalls = 0;
        ctx.UrlFetchApp.fetch = (url, options = {}) => {
            if ((options.method || 'get') === 'get') return makeResponse(200, tokenPage('vs0', 'ev0'));
            postCalls++;
            return makeResponse(429, 'Too Many Requests');
        };

        const lb = new ctx.Leaderboard('7985', [], 5);
        lb.requestResults(TWO_DISCIPLINES_FILTER);

        // initial POST + one retry, then abort — the second discipline is never requested
        assert.equal(postCalls, 2);
        assert.equal(lb.warnings.length, 1);
        assert.match(lb.warnings[0], /429/);
        assert.match(lb.warnings[0], /2 discipline\(s\) not fetched/);
    });

    it('an error page without tokens records a warning, keeps the previous tokens, and continues', () => {
        const ctx = createContext();
        const postedViewStates = [];
        ctx.UrlFetchApp.fetch = (url, options = {}) => {
            if ((options.method || 'get') === 'get') return makeResponse(200, tokenPage('vs0', 'ev0'));
            postedViewStates.push(options.payload['__VIEWSTATE']);
            if (postedViewStates.length === 1) return makeResponse(200, '<html>error page without tokens</html>');
            return makeResponse(200, tokenPage('vs1', 'ev1', RESULT_ROW));
        };

        const lb = new ctx.Leaderboard('7985', [], 5);
        lb.requestResults(TWO_DISCIPLINES_FILTER);

        // garbage from the error page must not replace the still-valid tokens
        assert.deepEqual([...postedViewStates], ['vs0', 'vs0']);
        assert.equal(lb.warnings.length, 1);
        assert.match(lb.warnings[0], /Unexpected response \(HTTP 200\)/);

        // the second discipline was still fetched and parsed
        const shortCourse = lb.disciplines.find(d => d.uid === '#f502m');
        assert.equal(shortCourse.results.length, 1);
        assert.equal(shortCourse.results[0].person.name, 'Test Schwimmer');
    });

    it('a failed initial GET records a warning and makes no POST requests', () => {
        const ctx = createContext();
        let postCalls = 0;
        ctx.UrlFetchApp.fetch = (url, options = {}) => {
            if ((options.method || 'get') === 'get') return makeResponse(429, 'Too Many Requests');
            postCalls++;
            return makeResponse(200, '');
        };

        const lb = new ctx.Leaderboard('7985', [], 5);
        lb.requestResults(TWO_DISCIPLINES_FILTER);

        assert.equal(postCalls, 0);
        assert.equal(lb.warnings.length, 1);
        assert.match(lb.warnings[0], /Initial GET/);
    });

    it('a successful run reports no warnings', () => {
        const ctx = createContext();
        ctx.UrlFetchApp.fetch = (url, options = {}) => {
            if ((options.method || 'get') === 'get') return makeResponse(200, tokenPage('vs0', 'ev0'));
            return makeResponse(200, tokenPage('vs1', 'ev1', RESULT_ROW));
        };

        const lb = new ctx.Leaderboard('7985', [], 5);
        lb.requestResults(TWO_DISCIPLINES_FILTER);

        assert.deepEqual([...lb.warnings], []);
    });

    it('_extractData returns an empty string when a delimiter is missing', () => {
        const { Leaderboard } = getContext();
        const handler = new Leaderboard('7985', [], 5)._requestHandler;
        assert.equal(handler._extractData('no tokens here', '__VIEWSTATE" value="', '" />'), '');
        assert.equal(handler._extractData('open only: __VIEWSTATE" value="abc', '__VIEWSTATE" value="', '" />'), '');
    });
});

describe('RequestHandler configurable delays', () => {
    const { Leaderboard } = getContext();

    function handlerWith(requestConfig) {
        return new Leaderboard('7985', [], 5, requestConfig)._requestHandler;
    }

    it('defaults to 1500ms / 12000ms when no config is given', () => {
        const handler = new Leaderboard('7985', [], 5)._requestHandler;
        assert.equal(handler._requestDelayMs, 1500);
        assert.equal(handler._rateLimitRetryDelayMs, 12000);
    });

    it('empty strings fall back to the defaults', () => {
        const handler = handlerWith({ requestDelayMs: '', rateLimitRetryDelayMs: '' });
        assert.equal(handler._requestDelayMs, 1500);
        assert.equal(handler._rateLimitRetryDelayMs, 12000);
    });

    it('accepts numeric and numeric-string overrides', () => {
        const handler = handlerWith({ requestDelayMs: 800, rateLimitRetryDelayMs: '30000' });
        assert.equal(handler._requestDelayMs, 800);
        assert.equal(handler._rateLimitRetryDelayMs, 30000);
    });

    it('allows an explicit zero delay', () => {
        const handler = handlerWith({ requestDelayMs: 0, rateLimitRetryDelayMs: '0' });
        assert.equal(handler._requestDelayMs, 0);
        assert.equal(handler._rateLimitRetryDelayMs, 0);
    });

    it('invalid and negative values fall back to the defaults', () => {
        const handler = handlerWith({ requestDelayMs: 'abc', rateLimitRetryDelayMs: -500 });
        assert.equal(handler._requestDelayMs, 1500);
        assert.equal(handler._rateLimitRetryDelayMs, 12000);
    });

    it('waits the configured retry delay before retrying a 429', () => {
        const ctx = createContext();
        const sleeps = [];
        ctx.Utilities.sleep = (ms) => sleeps.push(ms);
        ctx.UrlFetchApp.fetch = (url, options = {}) => {
            if ((options.method || 'get') === 'get') {
                return { getResponseCode: () => 200, getContentText: () => '<input type="hidden" name="__VIEWSTATE" value="vs0" /><input type="hidden" name="__EVENTVALIDATION" value="ev0" />' };
            }
            return { getResponseCode: () => 429, getContentText: () => 'Too Many Requests' };
        };

        const lb = new ctx.Leaderboard('7985', [], 5, { requestDelayMs: 200, rateLimitRetryDelayMs: 7000 });
        lb.requestResults({ genders: ['Männlich'], strokes: ['Freistil'], distances: ['50'] });

        // the 429 retry pause must use the configured value
        assert.ok(sleeps.includes(7000), 'expected a 7000ms retry pause, got ' + JSON.stringify(sleeps));
    });
});
