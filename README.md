# Aionic Clock

> *As the Moment, So the Eternal*

A complete time-keeping workspace in **three files** — no frameworks, no build step, no
network calls, and no bundled assets. Every sound, sky, and motion is generated live in
code, and everything you configure is remembered in your browser.

**Try it live: [luigi6890.github.io/aionic-clock](https://luigi6890.github.io/aionic-clock/)**

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

**Use it online** — no install, nothing to download:

**https://luigi6890.github.io/aionic-clock/**

**Or run it yourself.** It is a static site, so there is nothing to build.

Open `index.html` directly — double-click it, or drag it into a browser. That is the whole
setup.

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
| **Timer** | Countdown with stacking presets, a progress bar, and a green finish state |
| **Stopwatch** | Centisecond readout, live split timer, lap table graded by pace |
| **Alarms** | Groups that ring as one event, in-row editor, test mode, live countdowns |
| **Pomodoro** | Focus cycles with tasks, priorities, auto-start, and Do Not Disturb |
| **World clock** | Ten cities with DST-correct offsets and click-to-preview |
| **Ambience** | Eight procedurally synthesized soundscapes with a live visualizer |
| **Compact widget** | A mini clock docked top-right in every view, and the ringing-alarm control surface |
| **Sky** | A 24-hour gradient cycle with stars, haze, grain, and a clickable horizon |
| **Wall mode** | Fullscreen screensaver clock with auto-hiding chrome |
| **About** | The guide: overview, name and inspiration, key features, how to use, FAQ |
| **Help** | The full keyboard shortcut map, always one keypress away |

State is persisted in `localStorage`, so your alarms, tasks, themes, and mixes survive a
refresh or a return visit. Nothing is ever uploaded — there is no account and no server.

---

## The tools

### 🕒 Clock

The default view, and the one that stays visible everywhere else. It has two faces and a
set of hidden niceties:

- **Analog and digital** are one toggle (<kbd>M</kbd>). The analog face draws all twelve
  hour positions; hovering it reveals a digital readout, and the center dot flips the
  second hand between sweep and tick.
- **Three dial styles** — Standard, Roman, and Markers — cycled with <kbd>D</kbd> or by
  clicking any numeral directly.
- **12H and 24H** (<kbd>F</kbd>), with an AM/PM badge that fits without reflowing the
  digits, and a second-synced colon that only blinks on whole-second boundaries.
- The **date** sits under the title, and a **primary-zone badge** appears whenever a
  world-clock city is driving the display.

### ⏳ Timer

A plain countdown for one job, with two ways to set it:

- **Type it** into the Hours / Minutes / Seconds boxes, or tap a **preset** — 10s, 30s,
  1m, 5m, or 10m.
- **Presets stack.** Tap 10s three times and you get 30 seconds; tap 5m after that and
  you get 5:30. A preset adds to the current total instead of replacing it, and the status
  line spells out the new total so nothing is silently dropped.
- <kbd>Space</kbd> starts and pauses, <kbd>R</kbd> resets (clearing the boxes too). A
  progress bar fills as the countdown runs.
- **At zero** it beeps, the status reads "⏰ Time is up!", and the display turns green
  until you reset.
- If a duration is already set, Start resumes it; the H/M/S boxes are only read on a
  fresh start.

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

Pick a time, optionally add a label, and press **Add**. The box clears itself afterwards
so nothing you are typing gets silently dropped. Click any row to expand its editor.

- **Repeat options** are Once, Every day, Weekdays, Weekends, or Custom days; **five
  tones** are available, and each alarm gets a category — Personal, Work, Focus, Reminder,
  or Important — shown as a colored dot.
- **Grouped ringing.** Alarms sharing the same minute fire as *one* event and speak with
  the first alarm's voice, but you snooze or dismiss each individually. Snooze lengths
  are +5, +10, +15, or +30 minutes.
- **Test mode** rehearses the real code path — the same group selection, the same
  sounds — without touching your schedule.
- **Overlap warnings** flag a new alarm that collides with one you already have, and a
  **live countdown** chip can be switched on to watch the next ring approach.
- **Sorting** by Manual, Time, or Label; drag to reorder in Manual.
- The **floating widget** docks top-right in every view and becomes the control surface
  while something is ringing.

### 🍅 Pomodoro

Focus, Short, and Long phases — 25/5/15 minutes by default over a four-session cycle —
with a depleting ring and session dots for the cycle.

- **Phase buttons** switch phases manually, and the header tracks "Session 1/4".
- <kbd>Space</kbd> starts and pauses, <kbd>R</kbd> resets, and the skip button ⏭ steps
  forward in *true cycle order* rather than simply advancing one step.
- **Do Not Disturb** toggles by pressing the dial or the DND button, which strips the
  page back to the countdown and essential controls only.
- **Configurable**: work (1–180m), short (1–60m), and long (1–90m) lengths, sessions per
  cycle (1–12), plus auto-breaks and auto-work so the chain runs hands-free.
- **Tasks** carry a priority — High, Med, or Low — and a tomato-block estimate (1–99).
  Click one to make it active and it becomes the panel headline. Filter by All, Active,
  or Done, filter by priority, and optionally sort finished tasks to the bottom.
- **Phase palettes**: see [Look and feel](#look-and-feel) for the skies and motion each
  phase brings.

### 🌐 World clock

Ten zones — UTC, New York, Los Angeles, London, Paris, Dubai, Singapore, Mumbai, Tokyo,
and Sydney — each with a day-phase emoji, the local date, and a GMT offset.

- **Sort** by Manual, City, Country, or Time. Time sort follows live countdown order, so
  pin **Manual** if you want your own arrangement.
- **Toggles** for GMT offsets, 12H/24H, and seconds.
- **Drag to reorder** is enabled in Manual sort.
- **Click a zone** to make it primary: the whole main clock re-times to that city and a
  badge appears so you can click back home.

### 🎧 Ambience

Eight soundscapes synthesized with the Web Audio API — Stormfall, Dawn Chorus, Falling
Leaves, Babbling Brook, Pond Chorus, Bamboo Fountain, Night Field, and Hearthside. Each
is built from independent oscillator and noise layers.

- **Play or stop any track** independently and layer several at once.
- **🔀 auto-DJ** keeps the mix restless, rotating a fresh track every 40–80 seconds.
- **All** starts every soundscape together, staggered so they blend instead of stacking.
- A **volume slider** (with a live readout) governs the whole panel, and a **live
  color-coded spectrum visualizer** runs above the list.
- The panel opens with the dock's Ambience button or <kbd>~</kbd>. No audio files are
  loaded — the note under the list says so.

### 🔍 Compact widget

Whenever a tool other than the clock is open, a mini version of the clock docks in the
top-right corner so the time is never lost.

- It **follows the clock mode** — analog or digital, dial style included — and keeps only
  the four cardinals on its tiny dial so they stay legible.
- The **AM/PM badge** appears in the same corner without resizing the widget.
- While an alarm is ringing it **becomes the alarm panel**, with per-alarm snooze, a
  snooze-length picker, and a dismiss-all button.
- Hovering it **reveals the volume level**.

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

**Pomodoro phase themes.** With the Sky on, opening Pomodoro hands the palette over to
the current phase instead of the time of day: a calm teal-green for **Focus**, a bright
sky-blue for a **Short** break, and a soft violet for a **Long** break. Each phase also
brings its own motion — layered **rolling waves** while you focus, and **rising bubbles**
on breaks. With the Sky off, none of this applies and the normal theme is used.

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

About 4,200 lines of code. The long single-file layout is deliberate: it
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

Three behaviors are worth knowing:

- **Sky takes over the theme — but not the way it looks.** While the Sky is on, the
  light/dark *setting* is pinned to dark and the toggle is disabled, because the sky now
  owns contrast; your previous choice is restored the moment you switch the Sky off. The
  *rendering* then follows the sky's luminance instead, so the app looks **light with dark
  text on a bright daytime sky** and **dark with light text at night**. The pinned setting
  and the visible result are two different things.
- **Alarms survive background tabs.** Due alarms are matched against the wall-clock
  `HH:MM`, not against accumulated ticks, so a throttled or delayed loop still fires the
  right alarm — it may ring a little late, but it will not ring for the wrong time. Keep
  the tab open for it to ring at all; a discarded tab only catches up when restored.
- **Audio needs one click first.** Browsers block sound until you interact with the page,
  so press a key or click once before relying on an alarm or the ambience mixer.

---

## Contributing and versioning

The project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** — incompatible changes to established behavior or interfaces
- **MINOR** — new backward-compatible features and substantial improvements
- **PATCH** — backward-compatible bug fixes and small corrections

### When a version is bumped

The rule:

> A software change is not complete until it has been assigned the appropriate version,
> recorded in the changelog, and released. Documentation and repository metadata changes do
> not require a version increment or release.

Concretely, by file:

- **A change to `index.html`, `style.css`, or `script.js`** is a software change, released
  under the appropriate MAJOR, MINOR, or PATCH increment, however small. This includes the
  About and Help modals: their copy and layout ship inside the app, so editing them counts
  as changing the software, not as documentation.
- **A change to `README.md` or `CHANGELOG.md`** is documentation. No version increment, no
  release — committed straight to `main`.

A software change therefore moves like this:

```
change → test it → increment version → update changelog → commit → push → tag and release
```

The code, the version increment, and the changelog entry all land in the **same commit**,
so one commit is one versioned change and one tag points at exactly one logical change.
The release is part of finishing the work rather than a later chore, so there is never a
window in which software sits on `main` unreleased.

Two habits keep that true:

- **One logical change is one commit.** A feature built across three commits is squashed
  into one before it is pushed, so it yields one increment rather than three.
- **Work in progress stays off `main`.** A half-finished change is kept on a branch or
  locally, because any pushed software commit counts as a change awaiting release.

That keeps one invariant true: **`main`, the live site deployed from it, the version badge
in the app, and the latest release all describe the same software.** The only expected
exception is a documentation-only commit sitting ahead of the newest tag, because it does
not change the software.

Each release is tagged and published with notes generated from `CHANGELOG.md`, so the
changelog and the releases page cannot drift apart. If you change user-facing behavior,
add an entry to the changelog under the version you are releasing.

---

## Credits

A personal project by **luigi6890**.

The name fuses two ideas of time: **Aion**, the Hellenistic deity of unbounded, eternal
time, stands for the infinite — cycles, skies, and ambient moods that never repeat the
same way twice. The **atomic clock** stands for the opposite pole: absolute precision.
The logo brings them together in a gradient `A` ringed by twelve hour markers, the same
twelve the dial now carries.
