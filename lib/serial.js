'use strict';

/**
 * @description Run an async job one at a time. A call while the job runs does not start a second run: its argument
 * is merged into one pending rerun that starts when the current run ends. Callers get a promise that settles when
 * the runs (including that rerun) are done. Use it for "re-evaluate" style work that must not write or trigger twice.
 * @param {Function} job - async (arg) => void
 * @param {Function} merge - (pending, next) => merged argument for the rerun; default keeps the newest
 * @returns {Function} async (arg) => void
 * @example
 * this.evaluate = serialize((opts) => this.evaluateNow(opts), (a, b) => ({ urgent: a.urgent || b.urgent }));
 */
exports.serialize = function (job, merge = (pending, next) => next) {
  let running = null;
  let pending;
  let hasPending = false;
  return function run(arg) {
    if (running) {
      pending = hasPending ? merge(pending, arg) : arg;
      hasPending = true;
      return running;
    }
    running = (async () => {
      try {
        await job(arg);
        while (hasPending) {
          const next = pending;
          hasPending = false;
          pending = undefined;
          await job(next);
        }
      } finally {
        running = null;
      }
    })();
    return running;
  };
};
