'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const { utcOffset, localDate, addDays, midnight, isDate, isTime } = require('..');

const TZ = 'Europe/Helsinki';

test('local date and offset follow the time zone and daylight saving', () => {
  assert.strictEqual(localDate(TZ, Date.UTC(2026, 10, 9, 22, 30)), '2026-11-10');
  assert.strictEqual(localDate('UTC', Date.UTC(2026, 10, 9, 22, 30)), '2026-11-09');
  assert.strictEqual(utcOffset(TZ, Date.UTC(2026, 10, 10)), 2 * 3600000);
  assert.strictEqual(utcOffset(TZ, Date.UTC(2026, 6, 1)), 3 * 3600000);
});

test('addDays crosses months and years', () => {
  assert.strictEqual(addDays('2026-12-31', 1), '2027-01-01');
  assert.strictEqual(addDays('2026-03-01', -1), '2026-02-28');
});

test('local midnight is a real instant; daylight saving days are 23 or 25 hours', () => {
  assert.strictEqual(new Date(midnight(TZ, '2026-11-10')).toISOString(), '2026-11-09T22:00:00.000Z');
  const hours = (date) => (midnight(TZ, addDays(date, 1)) - midnight(TZ, date)) / 3600000;
  assert.strictEqual(hours('2026-10-25'), 25);
  assert.strictEqual(hours('2027-03-28'), 23);
  assert.strictEqual(hours('2026-11-10'), 24);
  assert.strictEqual((midnight('UTC', '2026-10-26') - midnight('UTC', '2026-10-25')) / 3600000, 24);
});

test('date and time settings are validated', () => {
  assert.strictEqual(isDate('2026-02-28'), true);
  assert.strictEqual(isDate('2026-02-30'), false);
  assert.strictEqual(isDate('2026-2-3'), false);
  assert.strictEqual(isDate(null), false);
  assert.strictEqual(isTime('00:00'), true);
  assert.strictEqual(isTime('23:59'), true);
  assert.strictEqual(isTime('24:00'), false);
  assert.strictEqual(isTime('7:00'), false);
});
