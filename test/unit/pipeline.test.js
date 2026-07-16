'use strict';
const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {createContext} = require('../setup');

describe('runPipeline', () => {
    const resp = (code, body) => ({getResponseCode: () => code, getContentText: () => body});
    const tokens = (vs, ev) => `<input type="hidden" name="__VIEWSTATE" value="${vs}" /><input type="hidden" name="__EVENTVALIDATION" value="${ev}" />`;
    const RESULT_ROW = '<tr><td>1.</td><td>Test Schwimmer</td><td>2005</td><td>00:27,10</td><td>25</td><td>Berlin</td><td>01.06.2026</td></tr>';
    const table = (rows) => `<table class="table table-sm table-stripe"><tr><th>Header</th></tr>${rows}</table>`;

    it('runs extract → request → adjust in-process and returns data/newResults/warnings', () => {
        const ctx = createContext();
        ctx.UrlFetchApp.fetch = (url, options = {}) => {
            if ((options.method || 'get') === 'get') return resp(200, tokens('vs0', 'ev0'));
            return resp(200, tokens('vs1', 'ev1') + table(RESULT_ROW));
        };

        const result = ctx.runPipeline('7985', [], 5,
            {genders: ['Männlich'], strokes: ['Freistil'], distances: ['50']}, {});

        assert.ok(!result.error, 'expected no error, got ' + JSON.stringify(result.error));
        assert.ok(Array.isArray(result.data) && result.data.length > 0, 'expected sheet data rows');
        assert.deepEqual([...result.warnings], []);
        // the fetched swimmer must show up as a new record
        assert.ok(result.newResults.some(r => r.includes('Test Schwimmer')));
    });

    it('captures a thrown error as { error, warnings } instead of throwing', () => {
        const ctx = createContext();
        ctx.UrlFetchApp.fetch = () => {
            throw new Error('network down');
        };

        const result = ctx.runPipeline('7985', [], 5,
            {genders: ['Männlich'], strokes: ['Freistil'], distances: ['50']}, {});

        assert.ok(result.error, 'expected an error field');
        assert.match(result.error.message, /network down/);
        assert.ok(Array.isArray(result.warnings));
    });
});
