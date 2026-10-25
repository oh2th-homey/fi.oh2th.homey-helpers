'use strict';

const { sleep } = require('./lib/timers');
const { startMinuteInterval, stopMinuteInterval, forEachDevice, dispatchInterval } = require('./lib/interval');
const { checkCapabilities, updateCapabilities, setValue } = require('./lib/capabilities');
const { strToMins, minsToStr, localTime } = require('./lib/time');

module.exports = {
  sleep,
  strToMins,
  minsToStr,
  localTime,
  startMinuteInterval,
  stopMinuteInterval,
  forEachDevice,
  dispatchInterval,
  checkCapabilities,
  updateCapabilities,
  setValue
};
