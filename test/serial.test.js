'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const { serialize } = require('..');

test('serialize runs one at a time and merges calls during a run into one rerun', async () => {
  const runs = [];
  let release;
  const run = serialize(
    async (arg) => {
      runs.push(arg);
      if (runs.length === 1) {
        await new Promise((resolve) => {
          release = resolve;
        });
      }
    },
    (a, b) => ({ urgent: a.urgent || b.urgent })
  );
  const first = run({ urgent: false });
  const second = run({ urgent: true });
  const third = run({ urgent: false });
  assert.strictEqual(second, first);
  assert.strictEqual(third, first);
  release();
  await first;
  assert.deepStrictEqual(runs, [{ urgent: false }, { urgent: true }]);
  await run({ urgent: false });
  assert.strictEqual(runs.length, 3);
});

test('serialize recovers after a failing run', async () => {
  let calls = 0;
  const run = serialize(async () => {
    calls += 1;
    if (calls === 1) throw new Error('boom');
  });
  await assert.rejects(run(), /boom/);
  await run();
  assert.strictEqual(calls, 2);
});
