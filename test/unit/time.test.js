'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getContext } = require('../setup');

describe('Time', () => {
    const { Time } = getContext();

    it('parses mm:ss,xx format', () => {
        const t = new Time('1:23,45');
        assert.equal(t.minutes, 1);
        assert.equal(t.seconds, 23);
        assert.equal(t.hundredth, 45);
    });

    it('totalHundredth converts to integer hundredths', () => {
        const t = new Time('1:23,45');
        assert.equal(t.totalHundredth, 1 * 6000 + 23 * 100 + 45);
    });

    it('compare returns negative when first time is faster', () => {
        const fast = new Time('0:25,12');
        const slow = new Time('0:27,34');
        assert.ok(Time.compare(fast, slow) < 0);
        assert.ok(Time.compare(slow, fast) > 0);
        assert.equal(Time.compare(fast, fast), 0);
    });

    it('sorting an array produces ascending (fastest first) order', () => {
        const times = ['1:02,00', '0:58,32', '1:00,15'].map(s => new Time(s));
        times.sort(Time.compare);
        assert.equal(times[0].toString(), '0:58,32');
        assert.equal(times[1].toString(), '1:00,15');
        assert.equal(times[2].toString(), '1:02,00');
    });

    it('equals matches identical time strings only', () => {
        assert.ok(new Time('1:23,45').equals(new Time('1:23,45')));
        assert.ok(!new Time('1:23,45').equals(new Time('1:23,46')));
    });
});
