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
