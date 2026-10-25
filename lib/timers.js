'use strict';

/**
 * @description Wait for a number of milliseconds using Homey's timer, so it is cleared with the app.
 * @param {Object} ctx - Homey App, Driver or Device (anything with .homey)
 * @param {number} ms - Number of milliseconds to wait
 * @returns {Promise<void>} Promise
 */
exports.sleep = function (ctx, ms) {
  return new Promise((resolve) => ctx.homey.setTimeout(resolve, ms));
};
