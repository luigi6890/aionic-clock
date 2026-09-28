# Changelog

All notable changes to Aionic Clock, following [Semantic Versioning](https://semver.org/).

## [1.5.0] - 2026-09-28

### Added
- Markers dial style now draws all twelve hour positions. The eight minor
  triangles are sized down from the four cardinals, and each is rotated so its
  apex points at the center dot — matching the arabic and roman dials.

### Changed
- The floating alarm widget's per-row dismiss button is now a full red button
  like Delete alarm and Close ambience, rather than red text on a neutral chip.
- About's "How to use" is restructured into labeled steps, and picks up what it
  was missing: `Space` and `R` to start and reset, timer preset stacking,
  stopwatch lap splits, and clicking the horizon to swap landscapes.
- Key features cards refreshed for the twelve-numeral dial, split grading, sky
  detail and the widget's alarm role.
- Name & inspiration notes that the logo's twelve markers echo the dial.

## [1.4.1] - 2026-09-28

### Fixed
- Ringing and floating widget rows now use the theme's inset color instead of a
  hardcoded black, so alarm times, labels and snooze buttons stay legible under
  the light theme and a bright daytime sky, and the per-row dismiss no longer
  sinks into the row.
- The finished timer switches to a deep green under a daytime sky, matching the
  palette used by lap splits, instead of a pale green on a translucent card.
- Single-row dismiss buttons in the floating widget are now red in both light and
  dark themes rather than plain text color.

## [1.4.0] - 2026-09-28

### Added
- All twelve numerals on the main and wall analog faces, with the eight minor
  ones set smaller than 12/3/6/9. Roman dials get the full set too, and the
  compact widget keeps only the cardinals.
- Lap split colors follow the daytime palette instead of washing out.

### Fixed
- Washed-out controls under a bright daytime sky: danger buttons, delete icons,
  the ambience close button and native time pickers now switch to the deep red
  and light color scheme.
- An expanded alarm row now keeps its border highlight while open.
- About and Help now close each other when opened by keyboard, so the two modals
  can no longer stack.

## [1.3.0] - 2026-09-26

### Added
- Stopwatch split times: a live split readout under the main timer, per-lap
  splits centered and bold in the lap table, and green/red grading against the
  running average of prior splits with the first lap as the neutral baseline.
  Paused time never counts toward a segment, and Reset clears totals and splits.

## [1.2.0] - 2026-09-25

### Added
- Living sky overhaul: a 24-hour gradient cycle with a twinkling starfield at
  night, daylight haze, film grain and slowly drifting color blobs.
- Clickable horizon silhouettes — hills, mountains and city — that cycle on tap.
- Per-phase focus palettes: rolling waves while working, rising bubbles on breaks.

### Changed
- Sky-aware contrast: text, cards, modals, dials and inputs re-tint as the sky
  brightens or darkens.
- Light/dark themes and glass/solid card variants, now fully independent of the
  sky.

## [1.1.0] - 2026-09-19

- Alarm features expanded (see commit history for detail).

## [1.0.0] - 2026-09-17

- Initial release: dual clock, timer, stopwatch, alarms, Pomodoro, world clock,
  ambience and wall mode.
