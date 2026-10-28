'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const { isImperial, isFahrenheit, toCelsius, toFahrenheit, formatTemperature, formatDifference } = require('..');

test('temperatures and differences as text in the home unit', () => {
  assert.strictEqual(formatTemperature(21.5, false), '21.5 °C');
  assert.strictEqual(formatTemperature(21.5, true), '70.7 °F');
  assert.strictEqual(formatTemperature(-10, true), '14 °F');
  assert.strictEqual(formatDifference(0.5, false), '0.5 °C');
  assert.strictEqual(formatDifference(0.5, true), '0.9 °F');
  assert.strictEqual(formatTemperature(null, true), 'null');
});

test('Web API values in °F convert both ways', () => {
  assert.strictEqual(isFahrenheit('°F'), true);
  assert.strictEqual(isFahrenheit('°C'), false);
  assert.strictEqual(isFahrenheit(undefined), false);
  assert.strictEqual(toCelsius(50), 10);
  assert.strictEqual(toCelsius(68.9), 20.5);
  assert.strictEqual(toFahrenheit(20), 68);
  assert.strictEqual(toCelsius(toFahrenheit(21.5)), 21.5);
  assert.strictEqual(toCelsius(null), null);
});

test('°F when Homey says imperial or a reported temperature is °F', () => {
  assert.strictEqual(isImperial('imperial', false), true);
  assert.strictEqual(isImperial('metric', true), true);
  assert.strictEqual(isImperial('metric', false), false);
  assert.strictEqual(isImperial(undefined, undefined), false);
});
