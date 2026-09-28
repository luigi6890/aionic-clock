# Aionic Clock

> *As the Moment, So the Eternal*

A complete time-keeping workspace in **three files** — no frameworks, no build step, no
network calls, and no bundled assets. Every sound, sky, and motion is generated live in
code, and everything you configure is remembered in your browser.

**Latest release: [v1.5.0](https://github.com/luigi6890/aionic-clock/releases/tag/v1.5.0)** ·
Full history in [CHANGELOG.md](CHANGELOG.md)

---

## Table of contents

- [Quick start](#quick-start)
- [What's inside](#whats-inside)
- [The tools](#the-tools)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Look and feel](#look-and-feel)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Browser support](#browser-support)
- [Contributing and versioning](#contributing-and-versioning)
- [Credits](#credits)

---

## Quick start

It is a static site, so there is nothing to install.

**Just open it**

```
index.html
```

Double-click the file, or drag it into a browser. That is the whole setup.

**Or serve it locally** (optional, useful if your browser restricts `file://`)

```powershell
python -m http.server 8000
# then visit http://localhost:8000
```

Deploying is equally simple: push the files to any static host — GitHub Pages, Netlify,
Cloudflare Pages, or plain nginx. There is no server-side component and no API to
configure.

---

## What's inside

| Area | What it does |
| --- | --- |
| **Clock** | Analog and digital faces, 12/24H, three dial styles, sweep or ticking seconds |
| **Timer** | Countdown with stacking presets, a green finish state |
| **Stopwatch** | Centisecond readout, live split timer, lap table graded by pace |
| **Alarms** | Groups that ring as one event, in-row editor, test mode, floating widget |
| **Pomodoro** | Focus cycles with tasks, priorities, and Do Not Disturb |
| **World clock** | Ten cities with DST-correct offsets and click-to-preview |
| **Ambience** | Eight procedurally synthesized soundscapes with a live visualizer |
| **Sky** | A 24-hour gradient cycle with stars, haze, grain, and a clickable horizon |
| **Wall mode** | Fullscreen screensaver clock with auto-hiding chrome |

State is persisted in `localStorage`, so your alarms, tasks, themes, and mixes survive a
refresh or a return visit. Nothing is ever uploaded — there is no account and no server.

---

## The tools

### ⏱️ Stopwatch

Press **Lap** to freeze a segment. A small split timer appears under the main readout
once you record the first lap, and every lap adds a row to the table below:

- **Splits are centered and bold** in each row, with the lap number and running total
  flanking them.
- **Color grading** compares each split against your *running average* of prior splits —
  green for faster, red for slower, and a neutral baseline for the first lap. A ±20 ms
  dead zone keeps centisecond jitter from flickering a color.
- **Paused time never counts.** A segment measures only the time the stopwatch was
  actually running, so a long pause between laps cannot inflate the next split.
- **Reset** clears the total, the laps, and the splits together.

### ⏰ Alarms

Click any row to expand its editor and change the time, label, repeat days, category, or
sound. Notable behavior:

- **Grouped ringing.** Alarms sharing the same minute fire as *one* event and speak with
  the first alarm's voice, but you snooze or dismiss each individually.
- **Test mode** rehearses the real code path — the same group selection, the same
  sounds — without touching your schedule.
- **Overlap warnings** flag a new alarm that collides with one you already have.
- **Reordering** by drag, or by sorting on time, city, country, or manual position.
- **The floating widget** keeps the time visible in every view and becomes the control
  surface while something is ringing.

### 🍅 Pomodoro

Focus, Short, and Long phases (25/5/15 by default, four sessions per cycle) with a
depleting ring and session dots. Pressing the dial toggles **Do Not Disturb**; the skip
button steps to whatever the cycle order dictates next. Tasks carry a priority and a
tomato-block estimate, and the active one becomes the panel headline. Each phase gets
its own sky palette, with rolling waves while working and rising bubbles on breaks.

### 🌐 World clock

Ten zones — UTC, New York, Los Angeles, London, Paris, Dubai, Singapore, Mumbai, Tokyo,
and Sydney — each with a day-phase emoji, local date, and GMT offset. Clicking a zone
re-times the entire main clock to that city; click the badge to return home.

### 🎧 Ambience

Eight soundscapes synthesized with the Web Audio API — Stormfall, Dawn Chorus, Falling
Leaves, Babbling Brook, Pond Chorus, Bamboo Fountain, Night Field, and Hearthside. Each
is built from independent oscillator and noise layers, so you can mix them freely, let
the auto-DJ rotate a fresh track every minute or so, or play everything at once while
watching the live spectrum visualizer.

---

## Keyboard shortcuts

### Views

| Key | Action |
| --- | --- |
| <kbd>C</kbd> | Clock |
| <kbd>T</kbd> | Timer |
| <kbd>S</kbd> | Stopwatch |
| <kbd>A</kbd> | Alarm |
| <kbd>P</kbd> | Pomodoro |
| <kbd>W</kbd> | World clock panel |
| <kbd>~</kbd> | Ambience panel |
| <kbd>Esc</kbd> | Back to clock, or close the topmost panel |

### Running tools

| Key | Action |
| --- | --- |
| <kbd>Space</kbd> | Start / pause timer, stopwatch, or Pomodoro |
| <kbd>R</kbd> | Reset the running tool |

### Clock display

| Key | Action |
| --- | --- |
| <kbd>M</kbd> | Toggle analog / digital |
| <kbd>F</kbd> | Toggle 12H / 24H |
| <kbd>D</kbd> | Cycle dial: Standard → Roman → Markers |
| <kbd>/</kbd> | Toggle sweep / tick second hand |

### Look and help

| Key | Action |
| --- | --- |
| <kbd>1</kbd> | Toggle light / dark |
| <kbd>2</kbd> | Toggle glass / solid cards |
| <kbd>3</kbd> | Toggle the living sky |
| <kbd>`</kbd> | Toggle About |
| <kbd>?</kbd> / <kbd>H</kbd> | Toggle Help |

### Wall mode

| Key | Action |
| --- | --- |
| <kbd>X</kbd> | Enter fullscreen wall clock |
| <kbd>Esc</kbd> | Exit wall mode |
| Move mouse | Reveal the hidden controls |

In wall mode the display keys still work silently, so you can restyle the clock without
disturbing a screensaver.

---

## Look and feel

**Two independent axes.** Light/dark theme and glass/solid cards are separate from the
sky, and every combination is supported.

**The living sky.** When enabled, the background follows a real 24-hour cycle built from
interpolated color stops — dawn, morning, midday, afternoon, evening, night. A twinkling
starfield fades in after dusk, daylight haze and a subtle film grain fade in by day, and
three colored blobs drift slowly and re-tint to the hour. Contrast is automatic: the
palette measures the sky's luminance and flips text, cards, inputs, and dials between
light and dark ink so nothing washes out.

**A clickable horizon.** Tap the landscape to cycle **hills → mountains → city → off**.
The silhouettes cross-fade between shapes and re-tint with the time of day, staying
subtle against a bright sky and deepening once the night arrives. They hide during
Pomodoro so the phase visuals stay unobstructed.

**Three dials.** Standard, Roman, and Markers, each drawing all twelve hour positions.
The four cardinals are emphasized and the eight minor markers are set smaller; in Markers
style they become inward-pointing triangles. The compact top-right widget keeps only the
cardinals so it stays legible at that size.

---

## How it works

### No dependencies, by design

There is no `package.json`, no bundler, and no external request at runtime. `index.html`
loads one stylesheet and one script; that is the entire dependency graph. The only assets
are SVG paths and procedurally generated audio.

### Timing

Digits, colons, and clock hands share a single boundary-locked loop, so they update in
the same frame instead of drifting apart. The sky re-evaluates its gradient every 20
seconds rather than every frame — smooth enough to look continuous, cheap enough to
ignore. Stopwatch and timer math is built on monotonic elapsed accumulators, which is
why a pause cannot leak into the next lap.

### The dial scales itself

Analog faces are sized with container query units (`cqw`), so hands, ticks, and numerals
scale proportionally from the compact widget to a fullscreen wall clock with no
JavaScript measurement and no media queries.

### Storage

| Key | Holds |
| --- | --- |
| `modern-clock-prefs` | Theme, dial, format, volume, landscape, zone order, Pomodoro settings |
| `digital-clock-alarms` | Alarms, snooze state, categories, and per-alarm sound |
| `pomodoro-tasks` | Tasks, priorities, block estimates, completion |

### Dial styles in the code

```js
const NUMERAL_CLASSES = ['n12', 'n1', 'n2', 'n3', 'n4', 'n5',
                         'n6', 'n7', 'n8', 'n9', 'n10', 'n11'];
const CARDINALS = ['n12', 'n3', 'n6', 'n9'];
```

Positions are computed once on the 37% ring at 30° increments; marker triangles rotate by
`clock bearing + 180°` so every apex points at the center dot. The main face renders all
twelve; the compact widget renders only the cardinals.

---

## Project structure

```
aionic-clock/
├── index.html      582 lines   structure, panels, and the About/Help modals
├── style.css      1,313 lines   all styling, including the sky and dial scales
├── script.js      2,320 lines   every feature: time, alarms, audio, sky, storage
├── CHANGELOG.md      79 lines   release history, following Keep a Changelog
├── .gitattributes               pins LF in the repo, CRLF on Windows checkouts
└── README.md
```

About 4,200 lines of hand-written code. The long single-file layout is deliberate: it
keeps the project dependency-free and trivial to read end to end, and every feature is
organized under a banner comment in `script.js`.

Line endings are normalized by `.gitattributes` (`* text=auto eol=crlf`) so the files
behave identically on Windows, macOS, and Linux.

---

## Browser support

Targets current evergreen browsers and uses only broadly available standards: CSS
custom properties, container queries, `Intl.DateTimeFormat`, the Web Audio API, and
`localStorage`. Because the whole app is plain ES2020+ with no transpilation, older
browsers are not supported.

Two behaviors are worth knowing:

- **Sky locks the theme to dark.** While the sky is on, light/dark is held at dark so the
  gradient stays readable; turning the sky off restores your previous choice.
- **Alarms need the tab awake.** Browsers may throttle timers in background tabs. Keep
  the tab visible if you depend on a firing alarm while working elsewhere.

---

## Contributing and versioning

The project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** — breaking changes
- **MINOR** — new features (v1.4.0's twelve-numeral dial, v1.5.0's full marker set)
- **PATCH** — bug fixes (v1.4.1's contrast pass)

Each release is tagged and published with notes generated from `CHANGELOG.md`, so the
changelog and the releases page cannot drift apart. If you change user-facing behavior,
add a section to the changelog under the version you are preparing.

---

## Credits

A personal project by **luigi6890**.

The name fuses two ideas of time: **Aion**, the Hellenistic deity of unbounded, eternal
time, stands for the infinite — cycles, skies, and ambient moods that never repeat the
same way twice. The **atomic clock** stands for the opposite pole: absolute precision.
The logo brings them together in a gradient `A` ringed by twelve hour markers, the same
twelve the dial now carries.
