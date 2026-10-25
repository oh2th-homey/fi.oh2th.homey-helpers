'use strict';

const MINUTE = 60000;
const MAX_DRIFT_SECONDS = 5;

/**
 * @description Start the one app-wide interval, aligned to the start of every minute.
 * Re-aligns itself if Homey's interval drifts, and skips a tick while the previous one still runs.
 * @param {Object} ctx - Homey App (owner of the interval)
 * @param {Function} onTick - async (now: Date) => void
 * @returns {Object} timer handle for stopMinuteInterval()
 */
exports.startMinuteInterval = function (ctx, onTick) {
  const timer = { timeout: null, interval: null, running: false };

  const tick = async () => {
    const now = new Date();
    if (now.getSeconds() >= MAX_DRIFT_SECONDS) {
      ctx.log(`startMinuteInterval - drift ${now.getSeconds()} s, re-aligning`);
      ctx.homey.clearInterval(timer.interval);
      timer.interval = null;
      align();
    }
    if (timer.running) {
      ctx.log('startMinuteInterval - previous tick still running, skipped');
      return;
    }
    timer.running = true;
    try {
      await onTick(now);
    } catch (error) {
      ctx.error(`startMinuteInterval - tick error: ${error}`);
    } finally {
      timer.running = false;
    }
  };

  const align = () => {
    const now = new Date();
    const startDelay = MINUTE - (now.getSeconds() * 1000 + now.getMilliseconds());
    timer.timeout = ctx.homey.setTimeout(() => {
      timer.timeout = null;
      timer.interval = ctx.homey.setInterval(tick, MINUTE);
      tick();
    }, startDelay);
  };

  ctx.log(`startMinuteInterval - every ${MINUTE} ms, aligned to minute`);
  align();
  return timer;
};

/**
 * @description Stop the interval started with startMinuteInterval().
 * @param {Object} ctx - Homey App
 * @param {Object} timer - handle returned by startMinuteInterval()
 */
exports.stopMinuteInterval = function (ctx, timer) {
  if (!timer) return;
  ctx.homey.clearTimeout(timer.timeout);
  ctx.homey.clearInterval(timer.interval);
  timer.timeout = null;
  timer.interval = null;
};

/**
 * @description Run fn for every device of every driver of the app. One failing device does not stop the others.
 * @param {Object} ctx - Homey App
 * @param {Function} fn - async (device) => void
 */
exports.forEachDevice = async function (ctx, fn) {
  const drivers = Object.values(ctx.homey.drivers.getDrivers());
  for (const driver of drivers) {
    for (const device of driver.getDevices()) {
      try {
        await fn(device);
      } catch (error) {
        ctx.error(`${device.getName()} - forEachDevice - error: ${error}`);
      }
    }
  }
};

/**
 * @description Call device.onInterval(now) on every device that implements it.
 * @param {Object} ctx - Homey App
 * @param {Date} now - tick time, the same for all devices
 */
exports.dispatchInterval = async function (ctx, now) {
  await exports.forEachDevice(ctx, async (device) => {
    if (typeof device.onInterval === 'function') await device.onInterval(now);
  });
};
