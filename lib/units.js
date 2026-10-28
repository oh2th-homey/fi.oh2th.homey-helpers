'use strict';

/*
 * Temperature units. Homey stores temperatures in °C and converts capability values with unit °C for display in a
 * °F home. Apps convert what Homey does not: texts, differences and other apps' values read through the Web API,
 * which reports and takes °F in a °F home. homey.i18n.getUnits() can stay 'metric' there (SDK issue #485).
 */

function trim1(value) {
  return String(Math.round(value * 10) / 10);
}

/**
 * @description °F or not: Homey says imperial, or a temperature from the Web API came in °F.
 * @param {string} system - ctx.homey.i18n.getUnits(): 'metric' | 'imperial'
 * @param {boolean} reportedFahrenheit - A capability read through the Web API had units °F
 * @returns {boolean}
 */
exports.isImperial = function (system, reportedFahrenheit) {
  return reportedFahrenheit === true || system === 'imperial';
};

/**
 * @description True when capability units (Web API capabilitiesObj[id].units) say °F.
 * @param {string} capabilityUnits
 * @returns {boolean}
 */
exports.isFahrenheit = function (capabilityUnits) {
  return typeof capabilityUnits === 'string' && capabilityUnits.trim().toUpperCase() === '°F';
};

/**
 * @description °F to °C, two decimals; anything not a finite number is returned as is.
 * @param {number} fahrenheit
 * @returns {number}
 */
exports.toCelsius = function (fahrenheit) {
  return typeof fahrenheit === 'number' && Number.isFinite(fahrenheit) ? Math.round(((fahrenheit - 32) / 1.8) * 100) / 100 : fahrenheit;
};

/**
 * @description °C to °F, two decimals; anything not a finite number is returned as is.
 * @param {number} celsius
 * @returns {number}
 */
exports.toFahrenheit = function (celsius) {
  return typeof celsius === 'number' && Number.isFinite(celsius) ? Math.round((celsius * 1.8 + 32) * 100) / 100 : celsius;
};

/**
 * @description A temperature in °C as text in the home's unit, one decimal at most: '21.5 °C' or '70.7 °F'.
 * @param {number} celsius
 * @param {boolean} imperial
 * @returns {string}
 */
exports.formatTemperature = function (celsius, imperial) {
  if (typeof celsius !== 'number' || !Number.isFinite(celsius)) return String(celsius);
  return imperial ? `${trim1(celsius * 1.8 + 32)} °F` : `${trim1(celsius)} °C`;
};

/**
 * @description A temperature difference in °C as text in the home's unit (×1.8, no +32): '0.5 °C' or '0.9 °F'.
 * @param {number} celsius
 * @param {boolean} imperial
 * @returns {string}
 */
exports.formatDifference = function (celsius, imperial) {
  if (typeof celsius !== 'number' || !Number.isFinite(celsius)) return String(celsius);
  return imperial ? `${trim1(celsius * 1.8)} °F` : `${trim1(celsius)} °C`;
};
