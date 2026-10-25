# oh2th-homey-helpers

Shared helper module for the author's Homey Apps SDK v3 apps (public repos in the GitHub org
`oh2th-homey`). Public repo: no personal or installation-specific information in any file.

- Plain JavaScript, CommonJS, `'use strict';`, no runtime dependencies. Node >= 18.
- Every helper takes a Homey context `ctx` (App, Driver or Device) as its first argument.
- Timers: only `ctx.homey.setTimeout / setInterval / clear*`, never the globals.
- One interval per app: `startMinuteInterval` in app.js, devices get `onInterval(now)`.
- Only add code that is reused by more than one app; app-specific logic stays in the app.
  Candidates are suggested while working on apps; the author decides what moves here.
- License MIT.
- Every helper has a JSDoc block and a unit test in `test/` (`node --test`, fake ctx objects).
- Style: `.prettierrc` (2 spaces, single quotes, semicolons, printWidth 200, no trailing commas),
  `.eslintrc.json` extends `athom`.
- Breaking change → bump the major version (minor while 0.x) and tag `vX.Y.Z`; apps pin a tag.
- Keep README.md API section in sync with `index.js` exports.
