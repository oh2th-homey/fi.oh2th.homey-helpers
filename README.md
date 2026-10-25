# oh2th-homey-helpers

Shared helpers for Homey Apps SDK v3 apps. Plain CommonJS, no dependencies.
Every function takes a Homey context (`ctx`: the App, Driver or Device) and uses Homey's own
timers (`ctx.homey.setTimeout` / `setInterval`), so nothing outlives the app.

## Install

Until published, install from GitHub with a tag:

```sh
npm install github:oh2th-homey/fi.oh2th.homey-helpers#v0.1.0
```

For local development next to an app, install as a real copy (Homey CLI does not follow
symlinks): `npm install --install-links ../fi.oh2th.homey-helpers`.

## API

### Timers

- `sleep(ctx, ms)`: promise that resolves after `ms`, using `ctx.homey.setTimeout`.

### One interval for the whole app

The app owns a single minute-aligned interval and hands each tick to its devices.
Devices never create intervals; they implement `async onInterval(now)` and decide what is due.

```js
const { startMinuteInterval, stopMinuteInterval, dispatchInterval } = require('oh2th-homey-helpers');

async onInit() {
  this.appInterval = startMinuteInterval(this, async (now) => {
    // app-level periodic work here
    await dispatchInterval(this, now); // calls device.onInterval(now) on every device
  });
}

async onUninit() {
  stopMinuteInterval(this, this.appInterval);
}
```

- `startMinuteInterval(ctx, onTick)`: first tick at the next full minute, then every minute.
  Re-aligns if Homey's interval drifts 5 s or more, skips a tick while the previous one still
  runs, catches and logs tick errors. Returns a handle.
- `stopMinuteInterval(ctx, handle)`
- `forEachDevice(ctx, fn)`: `await fn(device)` for every device of every driver; one failing
  device does not stop the others.
- `dispatchInterval(ctx, now)`: `forEachDevice` calling `device.onInterval(now)` where it exists.

### Capabilities

- `checkCapabilities(ctx)`: await in `Device.onInit`. Diffs the driver manifest against the
  device and removes/adds capabilities, so a changed `driver.compose.json` upgrades existing
  devices. Returns `{ added, removed }`.
- `updateCapabilities(ctx, driverCapabilities, deviceCapabilities, delay = 500)`
- `setValue(ctx, key, value, firstRun = false, delay = 10)`: sets the value if the device has
  the capability. When the value changed and `firstRun` is false, fires the device trigger
  `<key>_changed` (dots as underscores) for `is_*` booleans and `num_*` numbers, if that trigger
  exists in the app manifest, with token `{ <key>: value }`. Returns `true` when changed.

Typical device wrapper:

```js
async setValue(key, value, firstRun = false, delay = 10) {
  return setValue(this, key, value, firstRun, delay);
}
```

### Time

- `localTime(ctx, date = new Date())`: local date/time parts in the Homey's timezone
  (`Date.getHours()` on Homey is UTC). Returns `{ year, month, day, hours, minutes, seconds,
  weekday, date: 'YYYY-MM-DD', time: 'HH:mm', minutesOfDay }`.
- `strToMins('HH:mm')` → minutes since midnight; `minsToStr(minutes)` → `'HH:mm'`.

## Development

```sh
npm test   # node --test, no dependencies needed
```

## License

MIT
