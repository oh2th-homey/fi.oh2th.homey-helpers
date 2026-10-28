'use strict';

/**
 * @description Convert string time value (HH:mm) to minutes since midnight
 * @param {string} t - Time as HH:mm
 * @returns {number} Minutes since midnight
 */
exports.strToMins = function (t) {
  const s = t.split(':');
  return Number(s[0]) * 60 + Number(s[1]);
};

/**
 * @description Convert minutes since midnight to string time value (HH:mm)
 * @param {number} m - Minutes since midnight
 * @returns {string} Time as HH:mm
 */
exports.minsToStr = function (m) {
  return `${`0${Math.trunc(m / 60)}`.slice(-2)}:${`0${m % 60}`.slice(-2)}`;
};

/**
 * @description Local date and time parts in the Homey's timezone.
 * Date.getHours() on Homey returns UTC, so always use this for local time.
 * @param {Object} ctx - Homey App, Driver or Device (anything with .homey)
 * @param {Date} date - Date to convert, default now
 * @returns {Object} { year, month, day, hours, minutes, seconds, weekday (0 = Sunday), date: 'YYYY-MM-DD', time: 'HH:mm', minutesOfDay }
 */
exports.localTime = function (ctx, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ctx.homey.clock.getTimezone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hourCycle: 'h23'
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hours = Number(p.hour);
  const minutes = Number(p.minute);
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hours,
    minutes,
    seconds: Number(p.second),
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday),
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}`,
    minutesOfDay: hours * 60 + minutes
  };
};

function partsIn(timeZone, ms) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(ms));
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

/**
 * @description UTC offset of a time zone at an instant, e.g. 7200000 for Europe/Helsinki in winter.
 * @param {string} timeZone - IANA time zone, e.g. ctx.homey.clock.getTimezone()
 * @param {number} ms - Instant (epoch ms)
 * @returns {number} Offset in ms
 */
exports.utcOffset = function (timeZone, ms) {
  const p = partsIn(timeZone, ms);
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return asUtc - Math.floor(ms / 1000) * 1000;
};

/**
 * @description Local date of an instant in a time zone.
 * @param {string} timeZone - IANA time zone
 * @param {number} ms - Instant (epoch ms)
 * @returns {string} 'YYYY-MM-DD'
 */
exports.localDate = function (timeZone, ms) {
  const p = partsIn(timeZone, ms);
  return `${p.year}-${p.month}-${p.day}`;
};

/**
 * @description A date plus n days (calendar days, no time zone involved).
 * @param {string} date - 'YYYY-MM-DD'
 * @param {number} n - Days, may be negative
 * @returns {string} 'YYYY-MM-DD'
 */
exports.addDays = function (date, n) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

/**
 * @description Local midnight of a date as a real instant. A local day is midnight(date) up to midnight(date + 1):
 * 23 or 25 hours on daylight saving days.
 * @param {string} timeZone - IANA time zone
 * @param {string} date - 'YYYY-MM-DD'
 * @returns {number} Instant (epoch ms)
 */
exports.midnight = function (timeZone, date) {
  const [y, m, d] = date.split('-').map(Number);
  const utc = Date.UTC(y, m - 1, d);
  const guess = utc - exports.utcOffset(timeZone, utc);
  return utc - exports.utcOffset(timeZone, guess);
};

/**
 * @description True for a real calendar date written as 'YYYY-MM-DD' (e.g. a date setting).
 * @param {string} value
 * @returns {boolean}
 */
exports.isDate = function (value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

/**
 * @description True for a time written as 'HH:mm' (00:00–23:59), e.g. a time setting.
 * @param {string} value
 * @returns {boolean}
 */
exports.isTime = function (value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
};
