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

test('midnight where the clocks change at 00:00: a skipped midnight starts the day at the jump', () => {
  const santiago = 'America/Santiago';
  const hours = (date) => (midnight(santiago, addDays(date, 1)) - midnight(santiago, date)) / 3600000;
  // 2026-09-06 00:00 (−4) jumps to 01:00 (−3): the day starts at 01:00 local and lasts 23 hours.
  assert.strictEqual(new Date(midnight(santiago, '2026-09-06')).toISOString(), '2026-09-06T04:00:00.000Z');
  assert.strictEqual(localDate(santiago, midnight(santiago, '2026-09-06')), '2026-09-06');
  assert.strictEqual(hours('2026-09-05'), 24);
  assert.strictEqual(hours('2026-09-06'), 23);
  // 2026-04-05 00:00 (−3) goes back to 23:00 (−4) on the 4th: the 4th has 25 hours, the 5th starts at its one 00:00.
  assert.strictEqual(hours('2026-04-04'), 25);
  assert.strictEqual(new Date(midnight(santiago, '2026-04-05')).toISOString(), '2026-04-05T04:00:00.000Z');
  assert.strictEqual(hours('2026-04-05'), 24);
});

test('midnight with half-hour offsets and zones far from UTC', () => {
  assert.strictEqual(new Date(midnight('Asia/Kolkata', '2026-11-01')).toISOString(), '2026-10-31T18:30:00.000Z');
  assert.strictEqual((midnight('America/St_Johns', '2026-11-02') - midnight('America/St_Johns', '2026-11-01')) / 3600000, 25);
  assert.strictEqual(new Date(midnight('Pacific/Kiritimati', '2026-11-01')).toISOString(), '2026-10-31T10:00:00.000Z');
  assert.strictEqual(new Date(midnight('Pacific/Pago_Pago', '2026-11-01')).toISOString(), '2026-11-01T11:00:00.000Z');
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
