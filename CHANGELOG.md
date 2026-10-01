# Changelog

All notable changes to Aionic Clock, following [Semantic Versioning](https://semver.org/).

Only changes to the released software are listed here. Documentation and repository
metadata updates — such as the README — are committed to `main` without a version bump.

## [1.6.0] - 2026-10-01

### Added
- Stopwatch status line under the controls, matching the Timer's: it reports the
  running and paused states and confirms each recorded lap.
- Ambience: the volume icon is now a button that mutes and unmutes without
  changing your level, so the slider keeps its setting while sound is silenced.
- The blinking colons can be clicked to re-sync them to the second, for the rare
  occasions when they drift. Added as an Easter egg card.

### Fixed
- Dropdowns no longer paint gray under white text in Dark + Glass or with the Sky
  on. The native widget background was bleeding through the translucent input
  color, so selects now declare a color scheme that follows the theme, like the
  time pickers. They keep the palette's own input color, so daytime Sky and the
  Light themes stay white while the dark contexts stay translucent.

## [1.5.2] - 2026-09-29

### Fixed
- Wall mode now closes the Ambience panel on entry, so the dock cannot sit over the
  enlarged clock. Ambience is still reachable afterwards. The world clock needs no
  change, since it collapses into a horizontal row at the bottom.
- Dropdowns no longer turn gray under white text in Dark + Glass or with the Sky on.
  The native widget background was bleeding through the translucent input color, so
  selects now declare a color scheme that follows the theme, like the time pickers.
- The finished timer uses the deep green under the Light theme as well, not just the
  daytime Sky, so the finish state reads clearly on a white card.
- Hover glows on the toolbar, world clock, Ambience, its play buttons, and the About
  and Help buttons turn deep blue in the Light theme and under the daytime Sky, where
  the cyan glow disappeared against light surfaces.

### Added
- Pomodoro's Clear all asks for confirmation and reports the number of tasks, matching
  the alarm delete, so a stray click cannot wipe the list.

## [1.5.1] - 2026-09-28

### Fixed
- About: the Tech stack paragraph no longer describes the audio engine as
  "hand-rolled", which asserted something about how the project was built rather than
  what it does.

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
