'use strict';

const { test, mock } = require('node:test');
const assert = require('node:assert');

const { sleep, startMinuteInterval, stopMinuteInterval, dispatchInterval, updateCapabilities, setValue } = require('..');

function fakeHomey(triggerIds = []) {
  const fired = [];
  return {
    fired,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (h) => clearTimeout(h),
    setInterval: (fn, ms) => setInterval(fn, ms),
    clearInterval: (h) => clearInterval(h),
    manifest: { flow: { triggers: triggerIds.map((id) => ({ id })) } },
    flow: {
      getDeviceTriggerCard: (id) => ({
        trigger: async (device, tokens) => fired.push({ id, tokens })
      })
    }
  };
}

function fakeDevice(caps = {}, triggerIds = []) {
  const values = { ...caps };
  return {
    homey: fakeHomey(triggerIds),
    values,
    log: () => {},
    error: () => {},
    getName: () => 'test',
    hasCapability: (k) => k in values,
    getCapabilities: () => Object.keys(values),
    getCapabilityValue: (k) => values[k],
    setCapabilityValue: async (k, v) => {
      values[k] = v;
    },
    addCapability: async (k) => {
      values[k] = null;
    },
    removeCapability: async (k) => {
      delete values[k];
    }
  };
}

test('sleep uses homey.setTimeout', async () => {
  const ctx = { homey: { setTimeout: mock.fn((fn) => fn()) } };
  await sleep(ctx, 1000);
  assert.strictEqual(ctx.homey.setTimeout.mock.callCount(), 1);
});

test('updateCapabilities adds missing and removes old', async () => {
  const ctx = fakeDevice({ a: 1, old: 2 });
  const result = await updateCapabilities(ctx, ['a', 'b'], ctx.getCapabilities(), 0);
  assert.deepStrictEqual(result, { added: ['b'], removed: ['old'] });
  assert.deepStrictEqual(Object.keys(ctx.values).sort(), ['a', 'b']);
});

test('setValue fires is_ trigger only on change and not on first run', async () => {
  const ctx = fakeDevice({ is_on: false }, ['is_on_changed']);
  await setValue(ctx, 'is_on', true, true, 0);
  assert.strictEqual(ctx.homey.fired.length, 0);
  await setValue(ctx, 'is_on', false, false, 0);
  await setValue(ctx, 'is_on', false, false, 0);
  assert.deepStrictEqual(ctx.homey.fired, [{ id: 'is_on_changed', tokens: { is_on: false } }]);
});

test('setValue ignores missing capability and non-trigger keys', async () => {
  const ctx = fakeDevice({ measure_temperature: 20 }, ['measure_temperature_changed']);
  assert.strictEqual(await setValue(ctx, 'nope', 1, false, 0), false);
  assert.strictEqual(await setValue(ctx, 'measure_temperature', 21, false, 0), true);
  assert.strictEqual(ctx.homey.fired.length, 0);
});

test('dispatchInterval calls onInterval on all devices, errors isolated', async () => {
  const calls = [];
  const dev = (name, fail) => ({
    getName: () => name,
    onInterval: async (now) => {
      calls.push(name);
      if (fail) throw new Error('boom');
    }
  });
  const ctx = {
    error: () => {},
    homey: { drivers: { getDrivers: () => ({ d1: { getDevices: () => [dev('a', true), dev('b')] }, d2: { getDevices: () => [{ getName: () => 'c' }] } }) } }
  };
  await dispatchInterval(ctx, new Date());
  assert.deepStrictEqual(calls, ['a', 'b']);
});

test('startMinuteInterval ticks at the start of each minute', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: new Date('2026-10-25T12:00:30.000Z') });
  const ticks = [];
  const ctx = { ...fakeHomey(), log: () => {}, error: () => {} };
  ctx.homey = ctx;
  const timer = startMinuteInterval(ctx, async (now) => ticks.push(now.toISOString()));
  const settle = () => new Promise(setImmediate);
  t.mock.timers.tick(30000);
  await settle();
  t.mock.timers.tick(60000);
  await settle();
  assert.deepStrictEqual(ticks, ['2026-10-25T12:01:00.000Z', '2026-10-25T12:02:00.000Z']);
  stopMinuteInterval(ctx, timer);
  t.mock.timers.tick(60000);
  assert.strictEqual(ticks.length, 2);
});

test('strToMins / minsToStr round trip', () => {
  const { strToMins, minsToStr } = require('..');
  assert.strictEqual(strToMins('04:30'), 270);
  assert.strictEqual(minsToStr(270), '04:30');
  assert.strictEqual(minsToStr(23 * 60 + 5), '23:05');
});

test('localTime uses the Homey timezone, including DST change', () => {
  const { localTime } = require('..');
  const ctx = { homey: { clock: { getTimezone: () => 'Europe/Helsinki' } } };
  // 2026-10-25 is the DST end day in the EU: 00:30Z is 03:30 EEST, 01:30Z is 03:30 EET
  assert.strictEqual(localTime(ctx, new Date('2026-10-25T00:30:00Z')).time, '03:30');
  assert.strictEqual(localTime(ctx, new Date('2026-10-25T01:30:00Z')).time, '03:30');
  const t = localTime(ctx, new Date('2026-10-24T21:00:00Z'));
  assert.deepStrictEqual([t.date, t.time, t.weekday, t.minutesOfDay], ['2026-10-25', '00:00', 0, 0]);
});
