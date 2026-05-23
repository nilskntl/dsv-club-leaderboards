'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getContext } = require('../setup');

describe('CalendarDate', () => {
    const { CalendarDate } = getContext();

    it('parses dd.mm.yyyy correctly', () => {
        const d = new CalendarDate('15.06.2023');
        assert.equal(d.day, 15);
        assert.equal(d.month, 6);
        assert.equal(d.year, 2023);
        assert.equal(d.toString(), '15.06.2023');
    });

    it('normalises year-only input to 00.00.yyyy', () => {
        const d = new CalendarDate('2023');
        assert.equal(d.day, 0);
        assert.equal(d.month, 0);
        assert.equal(d.year, 2023);
        assert.equal(d.toString(), '00.00.2023');
    });

    it('year-only and full-date are not equal even when year matches', () => {
        assert.ok(!new CalendarDate('2023').equals(new CalendarDate('01.06.2023')));
    });

    it('equals matches identical normalised date strings', () => {
        assert.ok(new CalendarDate('15.06.2023').equals(new CalendarDate('15.06.2023')));
        assert.ok(!new CalendarDate('15.06.2023').equals(new CalendarDate('16.06.2023')));
    });

    it('isCurrentYear returns true for the current year', () => {
        const currentYear = new Date().getFullYear().toString();
        assert.ok(new CalendarDate(currentYear).isCurrentYear);
        assert.ok(!new CalendarDate('2000').isCurrentYear);
    });
});
