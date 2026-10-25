'use strict';

const { sleep } = require('./timers');

/**
 * @description Add and remove device capabilities so they match the driver manifest.
 * @param {Object} ctx - Homey Device
 * @param {string[]} driverCapabilities - Capabilities from the driver manifest
 * @param {string[]} deviceCapabilities - Capabilities the device has now
 * @param {number} delay - Delay in ms between each add/remove
 * @returns {Promise<Object>} { added, removed }
 */
exports.updateCapabilities = async function (ctx, driverCapabilities, deviceCapabilities, delay = 500) {
  const newC = driverCapabilities.filter((d) => !deviceCapabilities.includes(d));
  const oldC = deviceCapabilities.filter((d) => !driverCapabilities.includes(d));

  if (newC.length === 0 && oldC.length === 0) return { added: [], removed: [] };

  ctx.log(`${ctx.getName()} - updateCapabilities - remove: ${JSON.stringify(oldC)}, add: ${JSON.stringify(newC)}`);

  for (const c of oldC) {
    await ctx.removeCapability(c).catch(ctx.error);
    await sleep(ctx, delay);
  }
  for (const c of newC) {
    await ctx.addCapability(c).catch(ctx.error);
    await sleep(ctx, delay);
  }
  return { added: newC, removed: oldC };
};

/**
 * @description Check if the driver's capabilities have changed and update the device.
 * Call (and await) from Device.onInit so a changed driver.compose.json upgrades existing devices.
 * @param {Object} ctx - Homey Device
 * @returns {Promise<Object>} { added, removed }
 */
exports.checkCapabilities = async function (ctx) {
  const driverCapabilities = ctx.driver.manifest.capabilities || [];
  const deviceCapabilities = ctx.getCapabilities();
  return exports.updateCapabilities(ctx, driverCapabilities, deviceCapabilities);
};

/**
 * @description Set a capability value and fire its "<key>_changed" device trigger when the value changed.
 * Triggers fire for booleans whose id starts with "is_" and numbers whose id starts with "num_",
 * when a trigger "<key>_changed" (dots as underscores) exists in the app manifest.
 * @param {Object} ctx - Homey Device
 * @param {string} key - Capability id
 * @param {any} value - New value
 * @param {boolean} firstRun - true during init: set the value but fire no triggers
 * @param {number} delay - Delay in ms before setting the value
 * @returns {Promise<boolean>} true when the value changed
 */
exports.setValue = async function (ctx, key, value, firstRun = false, delay = 10) {
  if (!ctx.hasCapability(key)) return false;

  const oldVal = ctx.getCapabilityValue(key);
  const changed = oldVal !== value;
  if (changed) ctx.log(`${ctx.getName()} - setValue - ${key}: ${oldVal} => ${value}`);

  if (delay) await sleep(ctx, delay);

  try {
    await ctx.setCapabilityValue(key, value);
  } catch (error) {
    ctx.error(`${ctx.getName()} - setValue - ${key} error: ${error}`);
    return false;
  }

  if (changed && !firstRun) {
    const isBoolean = typeof value === 'boolean' && key.startsWith('is_');
    const isNumber = typeof value === 'number' && key.startsWith('num_');
    if (isBoolean || isNumber) {
      const newKey = key.replace(/\./g, '_');
      const triggers = (ctx.homey.manifest.flow && ctx.homey.manifest.flow.triggers) || [];
      if (triggers.find((trigger) => trigger.id === `${newKey}_changed`)) {
        await ctx.homey.flow
          .getDeviceTriggerCard(`${newKey}_changed`)
          .trigger(ctx, { [newKey]: value })
          .then(() => ctx.log(`${ctx.getName()} - setValue - triggered ${newKey}_changed: ${value}`))
          .catch(ctx.error);
      }
    }
  }
  return changed;
};
