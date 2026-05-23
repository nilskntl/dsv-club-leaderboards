'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getContext } = require('../setup');

describe('Discipline', () => {
    const { Discipline, Time, Person, Result, CalendarDate, LANES } = getContext();

    function makeResult(name, birth, timeStr, location = 'Berlin') {
        return new Result(
            new Person(name, birth),
            new Time(timeStr),
            location,
            new CalendarDate('01.01.2024'),
            false
        );
    }

    it('uid encodes stroke, distance, course, and gender', () => {
        assert.equal(new Discipline('50', LANES.SHORT_COURSE, 'Freistil', 'Männlich').uid, '#f502m');
        assert.equal(new Discipline('100', LANES.LONG_COURSE, 'Freistil', 'Weiblich').uid, '#f105w');
        assert.equal(new Discipline('50', LANES.SHORT_COURSE, 'Rücken', 'Männlich').uid, '#r502m');
    });

    it('addResult ignores exact duplicates (same person, time, location)', () => {
        const d = new Discipline('50', LANES.SHORT_COURSE, 'Freistil', 'Männlich');
        const r = makeResult('Max Müller', '2005', '0:25,12');
        d.addResult(r);
        d.addResult(r);
        assert.equal(d.results.length, 1);
    });

    it('addResult accepts same person with different location as distinct entry', () => {
        const d = new Discipline('50', LANES.SHORT_COURSE, 'Freistil', 'Männlich');
        d.addResult(makeResult('Max Müller', '2005', '0:25,12', 'Berlin'));
        d.addResult(makeResult('Max Müller', '2005', '0:25,12', 'Hamburg'));
        assert.equal(d.results.length, 2);
    });

    it('removeDuplicateResults keeps only the fastest time per swimmer', () => {
        const d = new Discipline('50', LANES.SHORT_COURSE, 'Freistil', 'Männlich');
        d.addResult(makeResult('Max Müller', '2005', '0:26,00', 'Hamburg'));
        d.addResult(makeResult('Max Müller', '2005', '0:25,12', 'Berlin'));
        d.removeDuplicateResults();
        assert.equal(d.results.length, 1);
        assert.equal(d.results[0].time.toString(), '0:25,12');
    });

    it('sortResults orders by time ascending', () => {
        const d = new Discipline('50', LANES.SHORT_COURSE, 'Freistil', 'Männlich');
        d.addResult(makeResult('A', '2000', '0:27,00'));
        d.addResult(makeResult('B', '2001', '0:25,00'));
        d.addResult(makeResult('C', '2002', '0:26,00'));
        d.sortResults();
        assert.equal(d.results[0].person.name, 'B');
        assert.equal(d.results[1].person.name, 'C');
        assert.equal(d.results[2].person.name, 'A');
    });

    it('cutResults keeps only the top N entries', () => {
        const d = new Discipline('50', LANES.SHORT_COURSE, 'Freistil', 'Männlich');
        ['0:25,00', '0:26,00', '0:27,00', '0:28,00', '0:29,00'].forEach((t, i) => {
            d.addResult(makeResult(`Swimmer ${i}`, `200${i}`, t));
        });
        d.cutResults(3);
        assert.equal(d.results.length, 3);
    });

    it('full adjust pipeline: deduplicate → sort → cut', () => {
        const d = new Discipline('50', LANES.SHORT_COURSE, 'Freistil', 'Männlich');
        // Two results for same swimmer (slow and fast), plus two other swimmers
        d.addResult(makeResult('A', '2000', '0:28,00', 'City1'));
        d.addResult(makeResult('A', '2000', '0:25,00', 'City2')); // A's faster result
        d.addResult(makeResult('B', '2001', '0:26,00'));
        d.addResult(makeResult('C', '2002', '0:27,00'));
        d.removeDuplicateResults();
        d.sortResults();
        d.cutResults(2);
        assert.equal(d.results.length, 2);
        assert.equal(d.results[0].person.name, 'A'); // fastest overall
        assert.equal(d.results[0].time.toString(), '0:25,00');
        assert.equal(d.results[1].person.name, 'B');
    });
});
