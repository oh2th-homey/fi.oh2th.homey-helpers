'use strict';

const { sleep } = require('./lib/timers');
const { startMinuteInterval, stopMinuteInterval, forEachDevice, dispatchInterval } = require('./lib/interval');
const { checkCapabilities, updateCapabilities, setValue } = require('./lib/capabilities');
const { strToMins, minsToStr, localTime, utcOffset, localDate, addDays, midnight, isDate, isTime } = require('./lib/time');
const { isImperial, isFahrenheit, toCelsius, toFahrenheit, formatTemperature, formatDifference } = require('./lib/units');
const { serialize } = require('./lib/serial');

module.exports = {
  sleep,
  strToMins,
  minsToStr,
  localTime,
  utcOffset,
  localDate,
  addDays,
  midnight,
  isDate,
  isTime,
  isImperial,
  isFahrenheit,
  toCelsius,
  toFahrenheit,
  formatTemperature,
  formatDifference,
  serialize,
  startMinuteInterval,
  stopMinuteInterval,
  forEachDevice,
  dispatchInterval,
  checkCapabilities,
  updateCapabilities,
  setValue
};
