// ---------- World clock zone catalog (popular zones + UTC) ----------
const ZONES = [
  { id: 'UTC', city: 'UTC', country: 'Universal' },
  { id: 'America/New_York', city: 'New York', country: 'USA' },
  { id: 'America/Los_Angeles', city: 'Los Angeles', country: 'USA' },
  { id: 'Europe/London', city: 'London', country: 'UK' },
  { id: 'Europe/Paris', city: 'Paris', country: 'France' },
  { id: 'Asia/Dubai', city: 'Dubai', country: 'UAE' },
  { id: 'Asia/Singapore', city: 'Singapore', country: 'Singapore' },
  { id: 'Asia/Kolkata', city: 'Mumbai', country: 'India' },
  { id: 'Asia/Tokyo', city: 'Tokyo', country: 'Japan' },
  { id: 'Australia/Sydney', city: 'Sydney', country: 'Australia' },
];
const DEFAULT_ZONE_ORDER = ZONES.map(z => z.id);

// ---------- Prefs ----------
const PREF_KEY = 'modern-clock-prefs';
let prefs = { theme: 'dark', variant: 'glass', sky: true, clockMode: 'digital', dial: 'arabic', sweep: 'smooth', is12Hour: false, ambVol: 70, alarmSort: 'manual', showAlarmCountdown: false, landscape: 'hills',
  zones: { order: [...DEFAULT_ZONE_ORDER], sort: 'time', showOffset: true, h12: null, showSeconds: true, open: false },
  pomo: { workMin: 25, shortMin: 5, longMin: 15, cycle: 4, autoBreaks: false, autoWork: false } };
try {
  const saved = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
  // Migrate the retired auto-lighting flag to the sky background toggle.
  if (saved.sky === undefined && saved.autoTheme !== undefined) saved.sky = saved.autoTheme;
  delete saved.autoTheme;
  Object.assign(prefs, saved);
  prefs.zones = Object.assign({ order: [...DEFAULT_ZONE_ORDER], sort: 'time', showOffset: true, h12: null, showSeconds: true, open: false }, saved.zones || {});
  prefs.pomo = Object.assign({ workMin: 25, shortMin: 5, longMin: 15, cycle: 4, autoBreaks: false, autoWork: false }, saved.pomo || {});
  // One-time restore of the standard minutes (25 / 5 / 15) in the boxes.
  if (!saved.pomoStd1) {
    prefs.pomo.workMin = 25; prefs.pomo.shortMin = 5; prefs.pomo.longMin = 15;
    saved.pomoStd1 = true;
    try { localStorage.setItem(PREF_KEY, JSON.stringify(Object.assign({}, saved, { pomo: prefs.pomo }))); } catch (e) {}
  }
} catch (e) {}
const zprefs = prefs.zones;
function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) {} }

// ---------- Clock (digital) ----------
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const ampmEl = document.getElementById('ampm');
const dateEl = document.getElementById('date');
const toggleBtn = document.getElementById('formatToggle');
const label12 = document.getElementById('label12');
const label24 = document.getElementById('label24');
const clockTitle = document.getElementById('clockTitle');
let is12Hour = prefs.is12Hour === true;
const pad = (n) => String(n).padStart(2, '0');

function digitalString(now) {
  const tz = primaryZone;
  let h, m, s;
  if (tz) { const p = zonedHMS(tz, now); h = p.h; m = p.m; s = p.s; }
  else { h = now.getHours(); m = now.getMinutes(); s = now.getSeconds(); }
  let suffix = '';
  if (is12Hour) { suffix = h >= 12 ? ' PM' : ' AM'; h = h % 12 || 12; }
  return `${pad(h)}:${pad(m)}:${pad(s)}${suffix}`;
}

function updateClock() {
  const now = new Date();
  const tz = primaryZone;
  let h, m, s;
  if (tz) { const p = zonedHMS(tz, now); h = p.h; m = p.m; s = p.s; }
  else { h = now.getHours(); m = now.getMinutes(); s = now.getSeconds(); }
  if (is12Hour) {
    ampmEl.textContent = h >= 12 ? 'PM' : 'AM';
    ampmEl.classList.remove('hidden');
    h = h % 12 || 12;
  } else ampmEl.classList.add('hidden');
  hoursEl.textContent = pad(h);
  minutesEl.textContent = pad(m);
  secondsEl.textContent = pad(s);
  const dateOpts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  if (primaryZone) dateOpts.timeZone = primaryZone;
  dateEl.textContent = now.toLocaleDateString(undefined, dateOpts);
  // Short in-face format for analog wall mode: abbreviated weekday + numeric date (e.g. "Fri, 9/12").
  const faceOpts = { weekday: 'short', month: 'numeric', day: 'numeric' };
  if (primaryZone) faceOpts.timeZone = primaryZone;
  analogDateEl.textContent = now.toLocaleDateString(undefined, faceOpts);
  renderZoneTimes(now);
  tickAlarmCountdowns(now);
  checkAlarms(now);
}
function setFormat(to12) {
  is12Hour = to12; prefs.is12Hour = to12; savePrefs();
  toggleBtn.setAttribute('aria-checked', String(is12Hour));
  label12.classList.toggle('active', is12Hour);
  label24.classList.toggle('active', !is12Hour);
  updateClock(); renderAlarms();
}
toggleBtn.addEventListener('click', () => setFormat(!is12Hour));

// ---------- View switching (clock shrinks to widget) ----------
const navBtns = document.querySelectorAll('.nav-btn');
const panels = { timer: document.getElementById('panel-timer'), stopwatch: document.getElementById('panel-stopwatch'), alarm: document.getElementById('panel-alarm'), pomodoro: document.getElementById('panel-pomodoro') };
function setView(view) {
  // Opening a tool exits wall mode so the feature can take center stage.
  if (document.body.dataset.wall === 'on' && view !== 'clock') setWall(false);
  // Entering the alarm panel: its ringing banner takes over from the widget.
  // Leaving it mid-ring brings the widget back so it stays dismissable.
  if (view === 'alarm') document.getElementById('alarmWidget').classList.add('hidden');
  else if (ringingActive) document.getElementById('alarmWidget').classList.remove('hidden');
  document.body.dataset.view = view;
  // Refresh the sky at once so the pomodoro focus palette applies/retreats instantly.
  if (prefs.sky === true) applySky();
  navBtns.forEach(b => b.classList.toggle('active', b.dataset.goto === view));
  Object.entries(panels).forEach(([k, el]) => el.classList.toggle('active', k === view));
  // Keep the selected tab fully in view so its pill never sits cut or hidden.
  const sc = document.getElementById('navScroll');
  const btn = document.querySelector('.nav-btn.active');
  if (sc && btn) sc.scrollTo({ left: btn.offsetLeft - (sc.clientWidth - btn.offsetWidth) / 2, behavior: 'smooth' });
}
navBtns.forEach(b => b.addEventListener('click', () => { setView(b.dataset.goto); b.blur(); }));

// ---------- Analog mode ----------
const clockModeBtn = document.getElementById('clockModeBtn');
const hourHand = document.getElementById('hourHand');
const minuteHand = document.getElementById('minuteHand');
const secondHand = document.getElementById('secondHand');
const tickRing = document.getElementById('tickRing');
const numeralsEl = document.getElementById('numerals');
const centerDot = document.getElementById('centerDot');
const sweepBtn = document.getElementById('sweepBtn');
const digitalOverlay = document.getElementById('digitalOverlay');
const analogDateEl = document.getElementById('analogDate');
const wHour = document.getElementById('wHour');
const wMinute = document.getElementById('wMinute');
const wSecond = document.getElementById('wSecond');
const widgetTicks = document.getElementById('widgetTicks');
const widgetNumerals = document.getElementById('widgetNumerals');
const dialBtns = document.querySelectorAll('.dial-btn');

function setClockMode(mode) {
  prefs.clockMode = mode; savePrefs();
  document.body.dataset.clock = mode;
  clockTitle.textContent = mode === 'analog' ? 'Analog Clock' : 'Digital Clock';
  clockModeBtn.textContent = mode === 'analog' ? '🕰️' : '🔢';
  if (mode === 'digital') { updateClock(); resyncColons(); }
}

// Restart the blinking-colon animation aligned to the next whole second
// so it stays in sync with the seconds digits after returning from analog.
// The wait happens blinkers-off (dim), then the cycle restarts blinkers-on
// exactly as the seconds digits change.
let colonSyncTimer = null;
function resyncColons() {
  const colons = document.querySelectorAll('.colon');
  clearTimeout(colonSyncTimer);
  colons.forEach(c => { c.style.animation = 'none'; c.style.opacity = '0.2'; void c.offsetWidth; });
  const wait = 1000 - (Date.now() % 1000);
  colonSyncTimer = setTimeout(() => colons.forEach(c => { c.style.animation = ''; c.style.opacity = ''; }), wait);
}
clockModeBtn.addEventListener('click', () => { setClockMode(document.body.dataset.clock === 'analog' ? 'digital' : 'analog'); clockModeBtn.blur(); });

// Ticks: 60 minimal flat markers (main face + compact widget face)
function buildTicks(ring) {
  for (let i = 0; i < 60; i++) {
    const t = document.createElement('div');
    t.className = 'tick' + (i % 5 === 0 ? ' major' : '');
    t.style.transform = `rotate(${i * 6}deg)`;
    t.innerHTML = '<i></i>';
    ring.appendChild(t);
  }
}
buildTicks(tickRing);
buildTicks(widgetTicks);

// Dial styles: arabic / roman / markers — click numerals to cycle
const DIALS = ['arabic', 'roman', 'markers'];
const DIAL_VALUES = {
  arabic: { n12: '12', n3: '3', n6: '6', n9: '9' },
  roman: { n12: 'XII', n3: 'III', n6: 'VI', n9: 'IX' },
  markers: { n12: '', n3: '', n6: '', n9: '' },
};
function setDial(d) {
  prefs.dial = d; savePrefs();
  document.body.dataset.dial = d;
  dialBtns.forEach(b => b.classList.toggle('active', b.dataset.dial === d));
  renderNumerals();
}
const TRI_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 L20 19 L4 19 Z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>';
function numeralSpan(d, cls, val) {
  const s = document.createElement('span');
  if (d === 'markers') {
    // Rounded triangle pointing at the center dot (orientation via CSS rotation).
    s.className = `numeral ${cls} tri`;
    s.innerHTML = TRI_SVG;
  }
  else { s.className = `numeral ${cls}`; s.textContent = val; }
  return s;
}
function renderNumerals() {
  const d = prefs.dial, v = DIAL_VALUES[d];
  const defs = [
    { cls: 'n12', val: v.n12 }, { cls: 'n3', val: v.n3 },
    { cls: 'n6', val: v.n6 }, { cls: 'n9', val: v.n9 },
  ];
  // Main face and compact widget face stay in sync (dial style included).
  numeralsEl.innerHTML = '';
  widgetNumerals.innerHTML = '';
  defs.forEach(({ cls, val }) => {
    numeralsEl.appendChild(numeralSpan(d, cls, val));
    widgetNumerals.appendChild(numeralSpan(d, cls, val));
  });
}
function cycleDial() {
  const i = DIALS.indexOf(prefs.dial);
  setDial(DIALS[(i + 1) % DIALS.length]);
}
numeralsEl.addEventListener('click', cycleDial);
dialBtns.forEach(b => b.addEventListener('click', () => setDial(b.dataset.dial)));

// Sweep vs tick — toggle via center dot
function setSweep(s) {
  prefs.sweep = s; savePrefs();
  document.body.dataset.sweep = s;
  sweepBtn.textContent = s === 'smooth' ? 'Sweep: Smooth' : 'Sweep: Tick';
  sweepBtn.classList.toggle('active', s === 'smooth');
}
centerDot.addEventListener('click', (e) => { e.stopPropagation(); setSweep(prefs.sweep === 'smooth' ? 'tick' : 'smooth'); });
sweepBtn.addEventListener('click', () => setSweep(prefs.sweep === 'smooth' ? 'tick' : 'smooth'));

// Smooth analog loop (rAF) — rAF is scheduled first so one bad frame can never stop time
function analogLoop() {
  requestAnimationFrame(analogLoop);
  const now = new Date();
  const ms = now.getMilliseconds();
  let s, m, h;
  if (primaryZone) { const p = zonedHMS(primaryZone, now); s = p.s; m = p.m; h = p.h; }
  else { s = now.getSeconds(); m = now.getMinutes(); h = now.getHours(); }
  let sec, min, hr;
  if (prefs.sweep === 'smooth') {
    sec = s + ms / 1000;
    min = m + sec / 60;
    hr = (h % 12) + min / 60;
  } else {
    sec = s; // traditional tick
    min = m + s / 60;
    hr = (h % 12) + min / 60;
  }
  secondHand.style.transform = `rotate(${sec * 6}deg)`;
  minuteHand.style.transform = `rotate(${min * 6}deg)`;
  hourHand.style.transform = `rotate(${hr * 30}deg)`;
  wSecond.style.transform = `rotate(${sec * 6}deg)`;
  wMinute.style.transform = `rotate(${min * 6}deg)`;
  wHour.style.transform = `rotate(${hr * 30}deg)`;
  digitalOverlay.textContent = digitalString(now);
}

// ---------- Theme (light / dark + glass / solid toggle) ----------
const themeBtn = document.getElementById('themeBtn');
const variantBtn = document.getElementById('variantBtn');
const skyBtn = document.getElementById('skyBtn');
function applyThemeIcon() {
  // Sun while light, moon while dark; window icon while glass, brick while solid.
  themeBtn.textContent = document.body.dataset.theme === 'light' ? '☀️' : '🌙';
  themeBtn.disabled = prefs.sky === true;
  themeBtn.title = prefs.sky === true ? 'Turn off Sky to switch theme' : 'Light / Dark (L)';
  skyBtn.classList.toggle('on', prefs.sky === true);
  variantBtn.textContent = document.body.dataset.variant === 'solid' ? '🧱' : '🪟';
  syncDockWidth();
}
function setVariant(v) {
  prefs.variant = v; savePrefs();
  document.body.dataset.variant = v;
  applyThemeIcon();
}
variantBtn.addEventListener('click', () => {
  setVariant(document.body.dataset.variant === 'solid' ? 'glass' : 'solid');
  variantBtn.blur();
});
function setTheme(t) {
  if (prefs.sky === true) return; // theme is locked while the sky drives contrast
  prefs.theme = t; savePrefs();
  document.body.dataset.theme = t;
  applyThemeIcon();
}
themeBtn.addEventListener('click', () => {
  setTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
  themeBtn.blur();
});

// ---------- Time-of-day sky background (smooth 24h gradient cycle) ----------
// Keyed palette stops; colors are interpolated continuously between them so
// the background, blobs and digit colors shift smoothly all day long.
const SKY_STOPS = [
  { h: 5,  top: '#3b2d5e', bottom: '#ff9a6a', b1: '#ff8c42', b2: '#ff5e78', b3: '#7b5cff', dFrom: '#ffffff', dTo: '#ffd9a0' }, // dawn
  { h: 7,  top: '#6ec1f5', bottom: '#fff3b0', b1: '#ffd93b', b2: '#7ec8f7', b3: '#ffffff', dFrom: '#0e3a68', dTo: '#1f7fc4' }, // morning
  { h: 10, top: '#2f80ed', bottom: '#dff3ff', b1: '#ffffff', b2: '#4aa8ff', b3: '#bfe6ff', dFrom: '#0b2f5e', dTo: '#1668c4' }, // midday
  { h: 14, top: '#3a6fd8', bottom: '#ffcf6e', b1: '#ffb703', b2: '#3a6fd8', b3: '#ffe6a3', dFrom: '#0d2a5c', dTo: '#8a5a00' }, // afternoon
  { h: 17, top: '#4a2a6e', bottom: '#ff6b4a', b1: '#ff4d4d', b2: '#ff9a3c', b3: '#7b2ff7', dFrom: '#ffffff', dTo: '#ffb3a0' }, // evening
  { h: 20, top: '#050914', bottom: '#1b2451', b1: '#2b3a8f', b2: '#6d28d9', b3: '#0ea5e9', dFrom: '#e8ecff', dTo: '#9db4ff' }, // night
  { h: 24, top: '#050914', bottom: '#1b2451', b1: '#2b3a8f', b2: '#6d28d9', b3: '#0ea5e9', dFrom: '#e8ecff', dTo: '#9db4ff' }, // night
  { h: 29, top: '#3b2d5e', bottom: '#ff9a6a', b1: '#ff8c42', b2: '#ff5e78', b3: '#7b5cff', dFrom: '#ffffff', dTo: '#ffd9a0' }, // next dawn
];
function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
function mixHex(a, b, t) {
  const ca = hexRgb(a), cb = hexRgb(b);
  return '#' + ca.map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function luminance(hex) {
  const [r, g, b] = hexRgb(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
// Per-phase pomodoro skies, independent of the actual time of day:
// calm teal/green for focus, sky-blue for short breaks, violet for long breaks.
const POMO_SKIES = {
  work:  { top: '#0b3b3c', bottom: '#8fd8b8', b1: '#2dd4bf', b2: '#34d399', b3: '#a7f3d0', dFrom: '#ffffff', dTo: '#b8f0d4' },
  short: { top: '#0b3b5e', bottom: '#5eb3e8', b1: '#38bdf8', b2: '#7dd3fc', b3: '#e0f2fe', dFrom: '#ffffff', dTo: '#cfeaff' },
  long:  { top: '#2e1065', bottom: '#a78bfa', b1: '#8b5cf6', b2: '#c4b5fd', b3: '#f5d0fe', dFrom: '#ffffff', dTo: '#e6d9ff' },
};
function applySky(now = new Date()) {
  if (document.body.dataset.view === 'pomodoro') {
    const P = POMO_SKIES[pomo.phase] || POMO_SKIES.work;
    const s = document.body.style;
    s.setProperty('--sky-top', P.top);
    s.setProperty('--sky-bottom', P.bottom);
    s.setProperty('--blob-1', P.b1);
    s.setProperty('--blob-2', P.b2);
    s.setProperty('--blob-3', P.b3);
    s.setProperty('--digit-from', P.dFrom);
    s.setProperty('--digit-to', P.dTo);
    s.setProperty('--stars-opacity', '0');
    s.setProperty('--haze-opacity', '0');
    document.body.dataset.skyInk = 'light';
    return;
  }
  let t = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  if (t < 5) t += 24;
  let i = 0;
  while (i < SKY_STOPS.length - 2 && t >= SKY_STOPS[i + 1].h) i++;
  const a = SKY_STOPS[i], b = SKY_STOPS[i + 1];
  const f = Math.min(1, Math.max(0, (t - a.h) / (b.h - a.h)));
  const s = document.body.style;
  const top = mixHex(a.top, b.top, f), bottom = mixHex(a.bottom, b.bottom, f);
  s.setProperty('--sky-top', top);
  s.setProperty('--sky-bottom', bottom);
  s.setProperty('--blob-1', mixHex(a.b1, b.b1, f));
  s.setProperty('--blob-2', mixHex(a.b2, b.b2, f));
  s.setProperty('--blob-3', mixHex(a.b3, b.b3, f));
  s.setProperty('--digit-from', mixHex(a.dFrom, b.dFrom, f));
  s.setProperty('--digit-to', mixHex(a.dTo, b.dTo, f));
  // Palette-driven contrast: light ink on dark skies, dark ink on bright ones.
  document.body.dataset.skyInk = (luminance(top) + luminance(bottom)) / 2 > 0.28 ? 'dark' : 'light';
  // Stars fade in at night, haze banks up by day (both eased, never abrupt).
  const h24 = t % 24;
  const sstep = (e0, e1, x) => { const k = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return k * k * (3 - 2 * k); };
  const night = (h24 >= 21 || h24 < 4) ? 1 : h24 < 8 ? 1 - sstep(4, 8, h24) : h24 < 17 ? 0 : sstep(17, 21, h24);
  s.setProperty('--stars-opacity', (Math.pow(night, 1.4) * 0.9).toFixed(3));
  s.setProperty('--haze-opacity', (Math.pow(1 - night, 1.3) * 0.9).toFixed(3));
}
let skyPrevTheme = null;
function setSky(on) {
  prefs.sky = on; savePrefs();
  document.body.dataset.sky = on ? 'on' : 'off';
  if (on) {
    skyPrevTheme = prefs.theme;
    if (prefs.theme !== 'dark') { prefs.theme = 'dark'; document.body.dataset.theme = 'dark'; }
    applySky();
  } else if (skyPrevTheme) {
    prefs.theme = skyPrevTheme; document.body.dataset.theme = skyPrevTheme;
    skyPrevTheme = null; savePrefs();
  }
  applyThemeIcon();
}
skyBtn.addEventListener('click', () => { setSky(prefs.sky !== true); skyBtn.blur(); });

// Layered abstract waves for the focus phase — one fill color per layer,
// each drifting at its own speed for parallax.
function wavePath(amp, phase) {
  const W = 2880, H = 320, mid = 150;
  let d = `M0,${H} L0,${(mid + amp * Math.sin(phase)).toFixed(1)}`;
  for (let x = 0; x <= W; x += 48) {
    d += ` L${x},${(mid + amp * Math.sin((x / W) * Math.PI * 4 + phase)).toFixed(1)}`;
  }
  return d + ` L${W},${H} Z`;
}
(function buildMist() {
  const layer = document.getElementById('mist');
  if (!layer) return;
  const NS = 'http://www.w3.org/2000/svg';
  [
    { amp: 42, fill: 'rgba(45,212,191,0.15)', dur: '26s', h: '58vh', phase: 0, reverse: false },
    { amp: 56, fill: 'rgba(52,211,153,0.18)', dur: '19s', h: '45vh', phase: 2.1, reverse: true },
    { amp: 70, fill: 'rgba(167,243,208,0.20)', dur: '13s', h: '32vh', phase: 4.2, reverse: false },
  ].forEach(cfg => {
    const wrap = document.createElement('div');
    wrap.className = 'wave' + (cfg.reverse ? ' reverse' : '');
    wrap.style.height = cfg.h;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 2880 320');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.setProperty('--slide', cfg.dur);
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', wavePath(cfg.amp, cfg.phase));
    path.setAttribute('fill', cfg.fill);
    svg.appendChild(path);
    wrap.appendChild(svg);
    layer.appendChild(wrap);
  });
})();
// Static horizon landscapes: hills, mountains, city silhouettes.
const LANDSCAPES = ['hills', 'mountains', 'city', 'off'];
function setLandscape(mode) {
  prefs.landscape = mode; savePrefs();
  document.body.dataset.landscape = mode;
}
(function buildLandscape() {
  const layer = document.getElementById('landscape');
  if (!layer) return;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 1440 400');
  svg.setAttribute('preserveAspectRatio', 'xMidYMax slice');
  const mk = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    parent.appendChild(el);
    return el;
  };
  const hills = mk('g', { 'data-land': 'hills', id: 'land-hills' }, svg);
  // Far range flows upward with taller peaks; near range descends the other way.
  mk('path', { d: 'M0,200 C180,280 260,180 420,170 C560,162 620,220 760,215 C900,210 960,140 1120,130 C1260,122 1360,170 1440,200 L1440,400 L0,400 Z', class: 'land-far' }, hills);
  mk('path', { d: 'M0,280 C100,285 200,215 300,215 C400,215 440,285 540,285 C640,285 660,250 760,250 C860,250 880,330 960,330 C1040,330 1090,290 1190,290 C1290,290 1340,305 1440,250 L1440,400 L0,400 Z', class: 'land-near' }, hills);
  const mtn = mk('g', { 'data-land': 'mountains', id: 'land-mountains' }, svg);
  // Smoothly rounded summits — curves only, no sharp points.
  mk('path', { d: 'M0,190 L95,175 Q107,171 119,175 L195,220 L275,150 Q287,137 299,150 L375,225 L465,230 L545,180 Q557,172 569,180 L645,230 L735,180 L815,160 Q827,157 839,160 L915,180 L1005,210 L1085,168 Q1097,160 1109,168 L1185,240 L1275,210 L1355,190 Q1367,187 1379,192 L1440,210 L1440,400 L0,400 Z', class: 'land-far' }, mtn);
  mk('path', { d: 'M0,400 L0,330 L140,275 L220,220 Q232,210 244,220 L330,295 L450,330 L530,245 Q544,236 554,240 L640,260 L760,325 L840,265 Q849,262 864,268 L950,320 L1070,340 L1150,260 Q1154,256 1174,260 L1260,280 L1360,310 L1440,330 L1440,400 Z', class: 'land-near' }, mtn);
  const city = mk('g', { 'data-land': 'city', id: 'land-city' }, svg);
  // Far range: low band broken by a few tall slabs. Near range: varied blocks,
  // some running together — no metronome alternation, no windows anywhere.
  mk('path', { d: 'M0,400 L0,170 L120,170 L120,200 L200,200 L200,250 L300,250 L300,220 L420,220 L420,180 L540,180 L540,150 L680,150 L680,210 L790,210 L790,250 L900,250 L900,190 L990,190 L990,170 L1130,170 L1130,250 L1210,250 L1210,230 L1300,230 L1300,190 L1440,190 L1440,400 Z', class: 'land-far' }, city);
  mk('path', { d: 'M0,400 L0,240 L90,240 L90,310 L170,310 L170,270 L250,270 L250,330 L310,330 L310,270 L410,270 L410,220 L520,220 L520,260 L600,260 L600,300 L710,300 L710,250 L800,250 L800,330 L870,330 L870,285 L960,285 L960,200 L1070,200 L1070,285 L1150,285 L1150,315 L1250,315 L1250,270 L1340,270 L1340,220 L1440,220 L1440,400 Z', class: 'land-near' }, city);
  layer.appendChild(svg);
  layer.addEventListener('click', () => {
    const next = LANDSCAPES[(LANDSCAPES.indexOf(prefs.landscape) + 1) % LANDSCAPES.length];
    setLandscape(next);
  });
})();
// Soft bubble/cloud field drifting behind the pomodoro dial.
(function buildBubbles() {
  const layer = document.getElementById('bubbles');
  if (!layer) return;
  for (let i = 0; i < 26; i++) {
    const b = document.createElement('i');
    const cloud = i < 5;
    const size = cloud ? 80 + Math.random() * 90 : 8 + Math.random() * 36;
    b.style.left = (Math.random() * 100).toFixed(2) + '%';
    b.style.width = b.style.height = size.toFixed(0) + 'px';
    b.style.setProperty('--rise', (cloud ? 26 + Math.random() * 18 : 11 + Math.random() * 14).toFixed(1) + 's');
    b.style.setProperty('--bo', (cloud ? 0.14 + Math.random() * 0.08 : 0.3 + Math.random() * 0.35).toFixed(2));
    b.style.animationDelay = (-Math.random() * 30).toFixed(1) + 's';
    if (cloud) b.classList.add('cloud');
    layer.appendChild(b);
  }
})();

// Scattered soft star field (shown only on night skies via --stars-opacity).
(function buildStars() {
  const layer = document.getElementById('stars');
  if (!layer) return;
  for (let i = 0; i < 90; i++) {
    const s = document.createElement('i');
    const big = Math.random() < 0.08; // a few larger soft blobs
    const size = big ? 7 + Math.random() * 7 : 1 + Math.random() * 2;
    s.style.left = (Math.random() * 100).toFixed(2) + '%';
    s.style.top = (Math.random() * 100).toFixed(2) + '%';
    s.style.width = s.style.height = size.toFixed(1) + 'px';
    s.style.setProperty('--tw', (2 + Math.random() * 3).toFixed(2) + 's');
    s.style.animationDelay = (-Math.random() * 5).toFixed(2) + 's';
    if (big) s.classList.add('neb');
    layer.appendChild(s);
  }
})();

// ---------- Wall clock / screensaver mode ----------
const wallBtn = document.getElementById('wallBtn');
let wallPrevView = 'clock';
let wallIdleTimer = null;
const WALL_IDLE_MS = 2600;
function wakeWall() {
  if (document.body.dataset.wall !== 'on') return;
  document.body.classList.add('wall-awake');
  clearTimeout(wallIdleTimer);
  wallIdleTimer = setTimeout(() => document.body.classList.remove('wall-awake'), WALL_IDLE_MS);
}
function setWall(on) {
  const isOn = document.body.dataset.wall === 'on';
  if (on === isOn) return;
  if (on) {
    wallPrevView = document.body.dataset.view || 'clock';
    toggleAbout(false); toggleHelp(false); // modals stay out of the screensaver
    document.body.dataset.wall = 'on';
    document.body.dataset.view = 'clock';
    navBtns.forEach(b => b.classList.toggle('active', b.dataset.goto === 'clock'));
    Object.values(panels).forEach(el => el.classList.remove('active'));
    wallBtn.textContent = '✕';
    wakeWall();
    if (document.fullscreenEnabled) document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.body.dataset.wall = 'off';
    document.body.classList.remove('wall-awake');
    clearTimeout(wallIdleTimer);
    wallBtn.textContent = '⛶';
    setView(wallPrevView);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }
}
wallBtn.addEventListener('click', () => { setWall(document.body.dataset.wall !== 'on'); wallBtn.blur(); });
['mousemove', 'touchstart', 'mousedown'].forEach(ev => document.addEventListener(ev, wakeWall, { passive: true }));
document.addEventListener('fullscreenchange', () => {
  // Browser-chrome exit (e.g. native Esc) also leaves wall mode.
  if (!document.fullscreenElement && document.body.dataset.wall === 'on') setWall(false);
});

// ---------- Sound (WebAudio, no file needed) ----------
let audioCtx = null;
function unlockAudio() {
  try { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) {}
}
// Browsers suspend audio until the user interacts — unlock on first gesture
// so timer/alarm sounds actually play.
['pointerdown', 'keydown', 'touchstart'].forEach(ev =>
  document.addEventListener(ev, unlockAudio, { passive: true }));
const TONES = {
  chime:   { freq: 880, type: 'sine', times: 3, gap: 0.55, dur: 0.4, vol: 0.5 },
  bell:    { freq: 659.25, type: 'triangle', times: 3, gap: 0.75, dur: 0.65, vol: 0.45 },
  digital: { freq: 1200, type: 'square', times: 4, gap: 0.28, dur: 0.16, vol: 0.2 },
  gentle:  { freq: 523.25, type: 'sine', times: 2, gap: 0.9, dur: 0.85, vol: 0.4 },
  urgent:  { freqs: [880, 1174.66], type: 'square', times: 6, gap: 0.32, dur: 0.2, vol: 0.25 },
};
const SOUND_NAMES = { chime: 'Chime', bell: 'Bell', digital: 'Digital', gentle: 'Gentle', urgent: 'Urgent' };
function beep(times = 3, sound = 'chime') {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const T = TONES[sound] || TONES.chime;
    let t = audioCtx.currentTime;
    for (let i = 0; i < times; i++) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.frequency.value = T.freqs ? T.freqs[i % T.freqs.length] : T.freq;
      o.type = T.type;
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(T.vol, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + T.dur);
      o.start(t); o.stop(t + T.dur + 0.05); t += T.gap;
    }
  } catch (e) { /* audio blocked */ }
}

// ---------- Timer ----------
const timerDisplay = document.getElementById('timerDisplay');
const timerProgress = document.getElementById('timerProgress');
const timerStatus = document.getElementById('timerStatus');
const timerH = document.getElementById('timerH'), timerM = document.getElementById('timerM'), timerS = document.getElementById('timerS');
const timerStartBtn = document.getElementById('timerStart');
let timerTotal = 0, timerRemaining = 0, timerEndAt = null, timerId = null, timerRunning = false;

function fmtHMS(sec) { sec = Math.max(0, Math.ceil(sec)); return `${pad(Math.floor(sec/3600))}:${pad(Math.floor(sec%3600/60))}:${pad(sec%60)}`; }
function renderTimer() {
  timerDisplay.textContent = fmtHMS(timerRemaining);
  timerProgress.style.width = timerTotal ? `${(100 * (1 - timerRemaining / timerTotal)).toFixed(1)}%` : '0%';
  timerStartBtn.textContent = timerRunning ? 'Pause ' : 'Start ';
  const k = document.createElement('kbd'); k.textContent = 'Space'; timerStartBtn.appendChild(k);
  timerDisplay.classList.toggle('finished', !timerRunning && timerTotal > 0 && timerRemaining === 0);
}
function timerTick() {
  timerRemaining = Math.max(0, Math.round((timerEndAt - Date.now()) / 1000));
  renderTimer();
  if (timerRemaining <= 0) { stopTimerTick(); timerRunning = false; timerStatus.textContent = '⏰ Time is up!'; beep(3); renderTimer(); }
}
function stopTimerTick() { if (timerId) clearInterval(timerId); timerId = null; }
function startPauseTimer() {
  if (timerRunning) {
    timerRemaining = Math.max(0, Math.round((timerEndAt - Date.now()) / 1000));
    stopTimerTick(); timerRunning = false; timerStatus.textContent = 'Paused.';
  } else {
    if (timerRemaining <= 0) {
      const h = +timerH.value || 0, m = +timerM.value || 0, s = +timerS.value || 0;
      timerTotal = h * 3600 + m * 60 + s;
      if (timerTotal <= 0) { timerStatus.textContent = 'Enter a duration greater than 0.'; return; }
      timerRemaining = timerTotal;
    }
    timerEndAt = Date.now() + timerRemaining * 1000;
    stopTimerTick(); timerId = setInterval(timerTick, 200);
    timerRunning = true; timerStatus.textContent = 'Running...';
  }
  renderTimer();
}
function resetTimer() {
  stopTimerTick(); timerRunning = false; timerRemaining = 0; timerTotal = 0;
  timerH.value = 0; timerM.value = 0; timerS.value = 0; // Reset clears the boxes too
  timerStatus.textContent = 'Set a duration and press Start.'; renderTimer();
}
timerStartBtn.addEventListener('click', startPauseTimer);
document.getElementById('timerReset').addEventListener('click', resetTimer);
// The boxes are the source of truth while idle: any manual edit replaces the
// loaded counter (presets included), so nothing typed is ever silently dropped.
[timerH, timerM, timerS].forEach(el => el.addEventListener('input', () => {
  if (timerRunning) return;
  timerTotal = Math.max(0, +timerH.value || 0) * 3600 + Math.max(0, +timerM.value || 0) * 60 + Math.max(0, +timerS.value || 0);
  timerRemaining = timerTotal;
  timerStatus.textContent = timerTotal > 0 ? `Set to ${fmtHMS(timerTotal)}.` : 'Set a duration and press Start.';
  renderTimer();
}));
document.querySelectorAll('.chip[data-preset]').forEach(c => c.addEventListener('click', () => {
  // Stacking presets: each click adds time on top instead of replacing it.
  const t = +c.dataset.preset;
  timerTotal += t; timerRemaining += t;
  if (timerRunning) timerEndAt += t * 1000; // extend a running timer live
  timerH.value = Math.floor(timerTotal / 3600);
  timerM.value = Math.floor(timerTotal % 3600 / 60);
  timerS.value = timerTotal % 60;
  timerStatus.textContent = `Added ${c.textContent} (total ${fmtHMS(timerTotal)}).`;
  renderTimer();
}));
renderTimer();

// ---------- Stopwatch ----------
const swDisplay = document.getElementById('swDisplay');
const swStartBtn = document.getElementById('swStart');
const swLaps = document.getElementById('swLaps');
const swSplitLive = document.getElementById('swSplit');
const swSplitTime = document.getElementById('swSplitTime');
let swElapsed = 0, swStartAt = 0, swRunning = false, swId = null, lapCount = 0;
let swLapBase = 0, swSplits = [];
const SW_SPLIT_TOL = 20;
function fmtSW(ms) {
  const m = Math.floor(ms/60000), s = Math.floor(ms%60000/1000), cs = Math.floor(ms%1000/10);
  return `${pad(m)}:${pad(s)}.<span class="cs">${pad(cs)}</span>`;
}
function swTotal() { return swRunning ? swElapsed + (Date.now() - swStartAt) : swElapsed; }
function renderSW() {
  const ms = swTotal();
  swDisplay.innerHTML = fmtSW(ms);
  swSplitTime.innerHTML = fmtSW(Math.max(0, ms - swLapBase));
  swStartBtn.textContent = swRunning ? 'Pause ' : (swElapsed > 0 ? 'Resume ' : 'Start ');
  const k = document.createElement('kbd'); k.textContent = 'Space'; swStartBtn.appendChild(k);
}
function startPauseSW() {
  if (swRunning) { swElapsed += Date.now() - swStartAt; swRunning = false; cancelAnimationFrame(swId); swId = null; }
  else { swStartAt = Date.now(); swRunning = true; const loop = () => { renderSW(); if (swRunning) swId = requestAnimationFrame(loop); }; loop(); }
  renderSW();
}
function resetSW() { swRunning = false; cancelAnimationFrame(swId); swId = null; swElapsed = 0; lapCount = 0; swLapBase = 0; swSplits = []; swLaps.innerHTML = ''; swSplitLive.classList.add('hidden'); renderSW(); }
swStartBtn.addEventListener('click', startPauseSW);
document.getElementById('swReset').addEventListener('click', resetSW);
document.getElementById('swLap').addEventListener('click', () => {
  if (!swRunning && swElapsed === 0) return;
  const total = swTotal();
  const split = total - swLapBase;
  let tone = '';
  if (swSplits.length) {
    const avg = swSplits.reduce((a, b) => a + b, 0) / swSplits.length;
    const d = split - avg;
    if (d <= -SW_SPLIT_TOL) tone = 'faster';
    else if (d >= SW_SPLIT_TOL) tone = 'slower';
  }
  swSplits.push(split);
  lapCount++;
  swLapBase = total;
  const li = document.createElement('li');
  li.innerHTML = `<span class="n">Lap ${lapCount}</span><span class="split ${tone}">${fmtSW(split)}</span><span class="tot">${fmtSW(total)}</span>`;
  swLaps.prepend(li);
  swSplitLive.classList.remove('hidden');
});
renderSW();

// ---------- Alarm ----------
const alarmInput = document.getElementById('alarmInput');
const alarmList = document.getElementById('alarmList');
const alarmStatus = document.getElementById('alarmStatus');
const ringing = document.getElementById('ringing');
const alarmWidget = document.getElementById('alarmWidget');
let alarms = [];
const ALARM_DEFAULTS = { label: '', repeat: 'once', days: [], snoozeMin: 5, snoozeCount: 0, snoozedUntil: null, snoozeDate: '', firedOnce: false, category: '', sound: 'chime' };
const SOUND_OPTIONS = [['chime', '🔔 Chime'], ['bell', '🛎️ Bell'], ['digital', '🤖 Digital'], ['gentle', '🎵 Gentle'], ['urgent', '🚨 Urgent']];
function soundOptions(selected) {
  return SOUND_OPTIONS.map(([v, n]) => `<option value="${v}"${v === selected ? ' selected' : ''}>${n}</option>`).join('');
}
function previewSound(sel) { unlockAudio(); beep(3, sel.value); }
const CATEGORIES = { personal: '🟢', work: '🔵', focus: '🟣', reminder: '🟡', important: '🔴' };
const CATEGORY_NAMES = { personal: 'Personal', work: 'Work', focus: 'Focus', reminder: 'Reminder', important: 'Important' };
try { 
  alarms = JSON.parse(localStorage.getItem('digital-clock-alarms') || '[]')
    .map(a => Object.assign({}, ALARM_DEFAULTS, a));
} catch (e) { alarms = []; }
const alarmLabelInput = document.getElementById('alarmLabel');
const alarmRepeat = document.getElementById('alarmRepeat');
const alarmSnoozeLen = document.getElementById('alarmSnoozeLen');
const alarmDays = document.getElementById('alarmDays');
const widgetSnoozeLen = document.getElementById('widgetSnoozeLen');
const overlapWarn = document.getElementById('overlapWarn');
const REPEAT_LABEL = { once: 'Once', daily: 'Daily', weekdays: 'Weekdays', weekends: 'Weekends', custom: 'Custom' };
const DAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
function saveAlarms() { try { localStorage.setItem('digital-clock-alarms', JSON.stringify(alarms)); } catch (e) {} }
function fmtAlarm(t) {
  let [h, m] = t.split(':').map(Number);
  if (!is12Hour) return `${pad(h)}:${pad(m)}`;
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${pad(h)}:${pad(m)} ${ap}`;
}
function repeatDetail(a) {
  if (a.repeat === 'custom') {
    const ds = (a.days || []).slice().sort((x, y) => x - y).map(d => DAY_SHORT[d]).join(' ');
    return ds ? ` ${ds}` : 'Custom';
  }
  return REPEAT_LABEL[a.repeat] || 'Once';
}
function orderedAlarms() {
  // Time sort means next-to-ring (countdown) order, not wall-clock order.
  if (prefs.alarmSort === 'time') {
    const now = new Date();
    return [...alarms].sort((a, b) => {
      const na = nextOccurrence(a, now), nb = nextOccurrence(b, now);
      if (na && nb) return na - nb;
      if (na) return -1;
      if (nb) return 1;
      return a.time.localeCompare(b.time);
    });
  }
  if (prefs.alarmSort === 'label') return [...alarms].sort((a, b) =>
    (a.label || '~').localeCompare(b.label || '~') || a.time.localeCompare(b.time));
  return alarms;
}
function renderAlarms() {
  alarmList.innerHTML = '';
  updateAlarmFooter();
  orderedAlarms().forEach(a => {
    const li = document.createElement('li');
    if (!a.enabled) li.classList.add('disabled');
    const snoozing = a.enabled && a.snoozedUntil;
    if (snoozing) li.classList.add('snoozed');
    const main = document.createElement('div'); main.className = 'alarm-main';
    const tm = document.createElement('span'); tm.className = 'alarm-time';
    tm.textContent = a.label ? `${fmtAlarm(a.time)} - ${a.label}` : fmtAlarm(a.time);
    tm.title = tm.textContent;
    main.appendChild(tm);
    const sub = document.createElement('span'); sub.className = 'alarm-sub';
    sub.textContent = (CATEGORIES[a.category] ? CATEGORIES[a.category] + ' ' : '') + repeatDetail(a);
    if (snoozing) {
      const tag = document.createElement('span'); tag.className = 'snooze-tag';
      tag.textContent = ` 🌙 → ${fmtAlarm(a.snoozedUntil)} (${a.snoozeCount}x)`;
      sub.appendChild(tag);
    }
    if (prefs.showAlarmCountdown) {
      const c = document.createElement('span'); c.className = 'alarm-count'; c.dataset.id = a.id;
      const t = countdownText(a, new Date());
      c.textContent = t ? ` · ${t}` : '';
      sub.appendChild(c);
    }
    main.appendChild(sub);
    const acts = document.createElement('div'); acts.className = 'alarm-actions';
    const tst = document.createElement('button'); tst.className = 'btn ghost'; tst.textContent = 'Test'; tst.title = 'Ring now (schedule untouched)';
    tst.setAttribute('aria-label', 'Test alarm ' + ringShort(a));
    tst.addEventListener('click', (e) => { e.stopPropagation(); testAlarm(a.id); });
    const tg = document.createElement('button'); tg.className = 'mini-toggle' + (a.enabled ? '' : ' off'); tg.textContent = a.enabled ? 'ON' : 'OFF';
    tg.addEventListener('click', () => {
      a.enabled = !a.enabled;
      if (a.enabled) { a.firedOnce = false; a.snoozeCount = 0; a.snoozedUntil = null; a.snoozeDate = ''; } // re-arm
      saveAlarms(); renderAlarms();
      if (!a.enabled && ringingIds.includes(a.id)) dismissOne(a.id); // toggling off stops the ring
    });
    const del = document.createElement('button'); del.className = 'btn danger'; del.textContent = '✕'; del.setAttribute('aria-label', 'Delete alarm'); del.title = 'Delete alarm';
    del.addEventListener('click', () => {
      if (!confirm(`Delete alarm ${fmtAlarm(a.time)}${a.label ? ' — ' + a.label : ''}?`)) return;
      const wasRinging = ringingIds.includes(a.id);
      alarms = alarms.filter(x => x.id !== a.id);
      saveAlarms(); renderAlarms();
      if (wasRinging) {
        ringingIds = ringingIds.filter(x => x !== a.id);
        if (!ringingIds.length) { stopRingingFx(); ringing.classList.add('hidden'); }
        else refreshRingingUI();
      }
    });
    acts.append(tst, tg, del); li.append(main, acts);
    if (ringingIds.includes(a.id)) li.classList.add('locked');
    li.addEventListener('click', (e) => {
      if (suppressAlarmClick) return;
      if (e.target.closest('button, input, select, textarea, .alarm-editor')) return;
      if (ringingIds.includes(a.id)) return; // ringing alarms can't be edited mid-ring
      editingId = (editingId === a.id) ? null : a.id;
      renderAlarms();
    });
    // Drag to reorder (manual sort only); suppressed click after a drop.
    li.draggable = prefs.alarmSort !== 'manual' ? false : true;
    if (prefs.alarmSort !== 'manual') { /* sorted views lock order */ }
    else {
      li.addEventListener('dragstart', (e) => {
        alarmDragId = a.id; suppressAlarmClick = true; li.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', String(a.id)); } catch (err) {}
      });
      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        const r = li.getBoundingClientRect();
        const after = (e.clientY - r.top) > r.height / 2;
        alarmDropAfter = after;
        li.classList.toggle('drop-before', !after);
        li.classList.toggle('drop-after', after);
      });
      li.addEventListener('dragleave', () => li.classList.remove('drop-before', 'drop-after'));
      li.addEventListener('drop', (e) => {
        e.preventDefault();
        if (alarmDragId !== null && alarmDragId !== a.id) {
          const order = alarms.filter(x => x.id !== alarmDragId);
          order.splice(order.findIndex(x => x.id === a.id) + (alarmDropAfter ? 1 : 0), 0, alarms.find(x => x.id === alarmDragId));
          alarms = order; saveAlarms(); renderAlarms();
        }
      });
      li.addEventListener('dragend', () => {
        document.querySelectorAll('.alarm-list li').forEach(c => c.classList.remove('dragging', 'drop-before', 'drop-after'));
        setTimeout(() => { suppressAlarmClick = false; }, 60);
      });
    }
    if (editingId === a.id) {
      li.classList.add('editing');
      li.appendChild(buildAlarmEditor(a));
    }
    alarmList.appendChild(li);
  });
}
let editingId = null;
let alarmDragId = null, alarmDropAfter = false, suppressAlarmClick = false;
function buildAlarmEditor(a) {
  const ed = document.createElement('div');
  ed.className = 'alarm-editor';
  ed.innerHTML = `
    <div class="row">
      <input type="time" class="e-time" required />
      <input type="text" class="e-label" placeholder="Label (optional)" maxlength="40" />
    </div>
    <div class="row">
      <select class="e-repeat" aria-label="Repeat schedule">
        <option value="once">Once</option>
        <option value="daily">Every day</option>
        <option value="weekdays">Weekdays</option>
        <option value="weekends">Weekends</option>
        <option value="custom">Custom…</option>
      </select>
      <select class="e-snooze" aria-label="Snooze length">
        <option value="5">+5m</option>
        <option value="10">+10m</option>
        <option value="15">+15m</option>
        <option value="30">+30m</option>
      </select>
      <select class="e-category" aria-label="Category">
        <option value="">Category</option>
        <option value="personal">🟢 Personal</option>
        <option value="work">🔵 Work</option>
        <option value="focus">🟣 Focus</option>
        <option value="reminder">🟡 Reminder</option>
        <option value="important">🔴 Important</option>
      </select>
      <select class="e-sound" aria-label="Alarm sound"></select>
      <button class="btn ghost e-preview" title="Preview sound">▶</button>
    </div>
    <div class="day-pick hidden"></div>
    <div class="row">
      <button class="btn primary e-save">Save</button>
      <button class="btn ghost e-cancel">Cancel</button>
    </div>`;
  const tIn = ed.querySelector('.e-time'); tIn.value = a.time;
  const lIn = ed.querySelector('.e-label'); lIn.value = a.label || '';
  const rSel = ed.querySelector('.e-repeat'); rSel.value = a.repeat;
  const sSel = ed.querySelector('.e-snooze'); sSel.value = String(a.snoozeMin || 5);
  const cSel = ed.querySelector('.e-category'); cSel.value = a.category || '';
  const sndSel = ed.querySelector('.e-sound'); sndSel.innerHTML = soundOptions(a.sound || 'chime');
  ed.querySelector('.e-preview').addEventListener('click', () => previewSound(sndSel));
  const dayWrap = ed.querySelector('.day-pick');
  const days = new Set(a.days || []);
  const paintDays = () => {
    dayWrap.innerHTML = '';
    dayWrap.classList.toggle('hidden', rSel.value !== 'custom');
    DAY_SHORT.forEach((name, d) => {
      const b = document.createElement('button');
      b.textContent = name; b.classList.toggle('on', days.has(d));
      b.addEventListener('click', () => { days.has(d) ? days.delete(d) : days.add(d); paintDays(); });
      dayWrap.appendChild(b);
    });
  };
  rSel.addEventListener('change', paintDays);
  paintDays();
  ed.querySelector('.e-save').addEventListener('click', () => {
    if (!tIn.value) { alarmStatus.textContent = 'Pick a time first.'; return; }
    if (rSel.value === 'custom' && !days.size) { alarmStatus.textContent = 'Pick at least one day.'; return; }
    const scheduleChanged = tIn.value !== a.time || rSel.value !== a.repeat ||
      [...days].sort().join() !== [...(a.days || [])].sort().join();
    a.time = tIn.value;
    a.label = lIn.value.trim();
    a.repeat = rSel.value;
    a.days = [...days];
    a.snoozeMin = +sSel.value || 5;
    a.category = cSel.value;
    a.sound = sndSel.value || 'chime';
    if (scheduleChanged) { a.firedOnce = false; a.snoozeCount = 0; a.snoozedUntil = null; a.snoozeDate = ''; }
    editingId = null;
    saveAlarms(); renderAlarms();
    alarmStatus.textContent = `Alarm updated — ${fmtAlarm(a.time)}.`;
  });
  ed.querySelector('.e-cancel').addEventListener('click', () => { editingId = null; renderAlarms(); });
  return ed;
}
// Custom-day chips for the add form
const customDays = new Set();
function renderAlarmDays() {
  alarmDays.innerHTML = '';
  DAY_SHORT.forEach((name, d) => {
    const b = document.createElement('button');
    b.textContent = name; b.classList.toggle('on', customDays.has(d));
    b.setAttribute('aria-label', 'Repeat ' + ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]);
    b.addEventListener('click', () => { customDays.has(d) ? customDays.delete(d) : customDays.add(d); renderAlarmDays(); checkOverlap(); });
    alarmDays.appendChild(b);
  });
}
alarmRepeat.addEventListener('change', () => alarmDays.classList.toggle('hidden', alarmRepeat.value !== 'custom'));
renderAlarmDays();
function daySet(rep, days) {
  if (rep === 'daily') return [0, 1, 2, 3, 4, 5, 6];
  if (rep === 'weekdays') return [1, 2, 3, 4, 5];
  if (rep === 'weekends') return [0, 6];
  if (rep === 'custom') return days || [];
  return [0, 1, 2, 3, 4, 5, 6]; // once: assume any day
}
function checkOverlap() {
  overlapWarn.classList.add('hidden');
  if (!alarmInput.value) return;
  const days = alarmRepeat.value === 'custom' ? [...customDays] : daySet(alarmRepeat.value);
  if (!days.length) return;
  const hits = alarms.filter(a => a.enabled && a.time === alarmInput.value &&
    daySet(a.repeat, a.days).some(d => days.includes(d)));
  if (!hits.length) return;
  const names = hits.slice(0, 2).map(a => a.label ? `'${a.label}' (${fmtAlarm(a.time)})` : fmtAlarm(a.time));
  overlapWarn.textContent = `⚠ Overlaps with ${names.join(', ')}${hits.length > 2 ? ` +${hits.length - 2} more` : ''} — adding anyway is fine.`;
  overlapWarn.classList.remove('hidden');
}
alarmInput.addEventListener('input', checkOverlap);
alarmInput.addEventListener('change', checkOverlap);
alarmRepeat.addEventListener('change', checkOverlap);
document.getElementById('alarmSound').innerHTML = soundOptions('chime');
document.getElementById('alarmPreview').addEventListener('click', () =>
  previewSound(document.getElementById('alarmSound')));
document.getElementById('alarmAdd').addEventListener('click', () => {
  if (!alarmInput.value) { alarmStatus.textContent = 'Pick a time first.'; return; }
  if (alarmRepeat.value === 'custom' && !customDays.size) { alarmStatus.textContent = 'Pick at least one day.'; return; }
  checkOverlap();
  const added = alarmInput.value;
  const catSel = document.getElementById('alarmCategory');
  alarms.push({
    id: Date.now(), time: added, enabled: true,
    label: alarmLabelInput.value.trim(),
    category: catSel ? catSel.value : '',
    sound: document.getElementById('alarmSound').value || 'chime',
    repeat: alarmRepeat.value,
    days: [...customDays],
    snoozeMin: +alarmSnoozeLen.value || 5,
    snoozeCount: 0, snoozedUntil: null, snoozeDate: '',
  });
  saveAlarms(); renderAlarms(); alarmStatus.textContent = `Alarm set for ${fmtAlarm(added)}.`;
  alarmInput.value = ''; // empty box so 12:00 AM can't be added by accident
  alarmLabelInput.value = '';
  alarmRepeat.value = 'once';
  alarmSnoozeLen.value = '5';
  alarmDays.classList.add('hidden');
  overlapWarn.classList.add('hidden');
  customDays.clear(); renderAlarmDays();
});
// Ringing effects: same sound as the timer, repeated until acknowledged,
// plus a flashing tab title so the alarm is noticed even in another tab.
const BASE_TITLE = document.title;
let ringRepeatId = null, titleFlashId = null, ringingActive = false;
const alarmNavBtn = document.querySelector('.nav-btn[data-goto="alarm"]');
function stopRingingFx() {
  if (ringRepeatId) clearInterval(ringRepeatId); ringRepeatId = null;
  if (titleFlashId) clearInterval(titleFlashId); titleFlashId = null;
  document.title = BASE_TITLE;
  ringingActive = false;
  testRingIds.clear();
  alarmWidget.classList.add('hidden');
  ambBtn.disabled = false;
  if (alarmNavBtn) alarmNavBtn.classList.remove('alarm-fire');
}
let ringingIds = [];
function ringShort(a) {
  // A ringing snooze announces its new time, not the original one.
  const t = a.snoozedUntil ? fmtAlarm(a.snoozedUntil) : fmtAlarm(a.time);
  return a.label ? `${t} — ${a.label}` : t;
}
function ringingAlarms() {
  return ringingIds.map(id => alarms.find(x => x.id === id)).filter(Boolean);
}
function ringEventLabel() {
  const list = ringingAlarms();
  if (!list.length) return '';
  const tag = (list.length && list.every(a => testRingIds.has(a.id))) ? ' · Test' : '';
  if (list.length === 1) return ringShort(list[0]) + tag;
  const names = list.map(a => a.label || fmtAlarm(a.time));
  return `${list.length} alarms — ${names.slice(0, 2).join(' · ')}${names.length > 2 ? ` +${names.length - 2}` : ''}${tag}`;
}
function refreshRingingUI() {
  const list = ringingAlarms();
  const multi = list.length > 1;
  document.getElementById('dismissAllRinging').style.display = multi ? '' : 'none';
  document.getElementById('widgetDismissAll').style.display = multi ? '' : 'none';
  const allTest = list.length > 0 && list.every(a => testRingIds.has(a.id));
  const head = document.getElementById('ringingHead');
  if (head) head.textContent = (multi ? `🔔 ${list.length} alarms ringing` : '🔔 Alarm ringing') + (allTest ? ' · Test' : '');
  const rl = document.getElementById('ringingList');
  rl.innerHTML = '';
  list.forEach(a => {
    const row = document.createElement('div'); row.className = 'ring-row';
    const info = document.createElement('div'); info.className = 'ring-info';
    const b = document.createElement('b');
    b.textContent = list.length === 1 ? ringShort(a) : (a.label || 'N/A');
    info.appendChild(b);
    if (a.snoozeCount > 0) {
      const s = document.createElement('span'); s.className = 'ring-sub2';
      s.textContent = `Snoozed ${a.snoozeCount}x`;
      info.appendChild(s);
    }
    const btns = document.createElement('div'); btns.className = 'ring-btns';
    const sn = document.createElement('button'); sn.className = 'btn ghost'; sn.textContent = `Snooze +${a.snoozeMin || 5}m`;
    sn.addEventListener('click', () => snoozeOne(a.id));
    const di = document.createElement('button'); di.className = 'btn danger'; di.textContent = '✕';
    di.setAttribute('aria-label', 'Dismiss ' + ringShort(a));
    di.addEventListener('click', () => dismissOne(a.id));
    btns.append(sn, di);
    row.append(info, btns);
    rl.appendChild(row);
  });
  // One shared time goes in the header; rows show just their labels.
  const sameTime = new Set(list.map(a => a.time)).size === 1;
  const wHead = document.getElementById('widgetHead');
  if (wHead) {
    if (!list.length) wHead.textContent = '🔔 Alarm';
    else if (list.length === 1) wHead.textContent = `🔔 ${list[0].snoozedUntil ? fmtAlarm(list[0].snoozedUntil) : fmtAlarm(list[0].time)}`;
    else if (sameTime) wHead.textContent = `🔔 ${fmtAlarm(list[0].time)} · ${list.length}`;
    else wHead.textContent = `🔔 ${list.length} alarms`;
    if (list.length && list.every(a => testRingIds.has(a.id))) wHead.textContent += ' · Test';
  }
  const wl = document.getElementById('widgetList');
  wl.innerHTML = '';
  list.forEach(a => {
    const row = document.createElement('div'); row.className = 'w-row';
    const mins = widgetSnoozeLenFor(a);
    const label = list.length === 1 ? (a.label || 'N/A') : (sameTime ? (a.label || 'N/A') : ringShort(a));
    const t = document.createElement('span'); t.className = 'w-time'; t.textContent = label; t.title = ringShort(a);
    const sn = document.createElement('button'); sn.className = 'icon-btn'; sn.textContent = '💤';
    sn.title = `Snooze +${mins}m`; sn.setAttribute('aria-label', 'Snooze ' + ringShort(a));
    sn.addEventListener('click', () => snoozeOne(a.id, mins));
    const di = document.createElement('button'); di.className = 'icon-btn'; di.textContent = '✕';
    di.setAttribute('aria-label', 'Dismiss ' + ringShort(a));
    di.addEventListener('click', () => dismissOne(a.id));
    row.append(t, sn, di);
    wl.appendChild(row);
  });
}
let ringSound = 'chime';
function startRingingEvent(ids) {
  const fresh = !ringingIds.length;
  ids.forEach(id => { if (!ringingIds.includes(id)) ringingIds.push(id); });
  // Multi-alarm events speak with the first alarm's voice.
  if (fresh) {
    const first = ringingAlarms()[0];
    ringSound = (first && first.sound) || 'chime';
  }
  if (editingId !== null && ids.includes(editingId)) { editingId = null; renderAlarms(); }
  if (fresh) { widgetSnoozeOverride = null; widgetSnoozeLen.value = ''; }
  if (!ringingIds.length) return;
  ringing.classList.remove('hidden');
  alarmWidget.classList.remove('hidden');
  ambBtn.disabled = true; // keep Ambience clear of the widget until acknowledged
  toggleAmbPanel(false); // never cover the widget with the panel
  beep(3, ringSound);
  ringingActive = true;
  if (alarmNavBtn) alarmNavBtn.classList.add('alarm-fire');
  if (!ringRepeatId) ringRepeatId = setInterval(() => beep(3, ringSound), 4000);
  if (!titleFlashId) {
    let on = false;
    titleFlashId = setInterval(() => {
      document.title = on ? `🔔 ${ringEventLabel()}` : BASE_TITLE;
      on = !on;
    }, 1000);
  }
  refreshRingingUI();
}
// Test rings: full experience, zero schedule impact. Testing one alarm also
// pulls in every other enabled alarm at the same minute, so multi-alarm
// events rehearse exactly as they would fire (dismiss anyone to narrow it
// down). This beats manual multi-select: no selection state to manage, and
// the group is always the true same-minute set.
const testRingIds = new Set();
function testAlarm(id) {
  const a = alarms.find(x => x.id === id);
  if (!a || !a.enabled) return;
  // Same minute AND scheduled today — otherwise the rehearsal lies about
  // which alarms would truly co-fire. The tapped row always plays solo;
  // the group joins only when it is itself scheduled today.
  const now = new Date();
  const grouped = dayMatches(a, now);
  alarms
    .filter(x => x.enabled && x.time === a.time && !ringingIds.includes(x.id) &&
      (x.id === a.id || (grouped && dayMatches(x, now))))
    .forEach(x => testRingIds.add(x.id));
  startRingingEvent([...testRingIds]);
}
function dismissOne(id) {
  const a = alarms.find(x => x.id === id);
  ringingIds = ringingIds.filter(x => x !== id);
  if (testRingIds.has(id)) testRingIds.delete(id); // test rings never touch the schedule
  else if (a) {
    a.snoozeCount = 0; a.snoozedUntil = null; a.snoozeDate = '';
    if (a.repeat === 'once') a.enabled = false; // back to original time, turned off
  }
  saveAlarms(); renderAlarms();
  if (!ringingIds.length) { stopRingingFx(); ringing.classList.add('hidden'); }
  else refreshRingingUI();
}
function dismissAllRinging() { [...ringingIds].forEach(dismissOne); }
function applySnooze(a, mins) {
  const d = new Date(Date.now() + mins * 60000);
  a.snoozedUntil = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  a.snoozeDate = dateStr(d);
  a.snoozeCount = (a.snoozeCount || 0) + 1;
}
function snoozeOne(id, minutes) {
  const a = alarms.find(x => x.id === id);
  if (!a) return;
  ringingIds = ringingIds.filter(x => x !== id);
  if (testRingIds.has(id)) {
    // Test snooze only silences; schedule untouched.
    testRingIds.delete(id);
    alarmStatus.textContent = 'Test silenced.';
  } else {
    applySnooze(a, minutes || a.snoozeMin || 5);
    alarmStatus.textContent = `Snoozed ${a.snoozeCount}x · Next ring ${fmtAlarm(a.snoozedUntil)}`;
  }
  saveAlarms(); renderAlarms();
  if (!ringingIds.length) { stopRingingFx(); ringing.classList.add('hidden'); }
  else refreshRingingUI();
}
// Next upcoming ring for one alarm (pending snooze first, then schedule), else null.
// Snooze wins even for retired once-alarms so the countdown never goes missing.
function nextOccurrence(a, now) {
  if (!a.enabled || ringingIds.includes(a.id)) return null;
  if (a.snoozedUntil && a.snoozeDate) {
    const d = new Date(`${a.snoozeDate}T${a.snoozedUntil}:00`);
    if (d > now) return d;
  }
  if (a.repeat === 'once' && a.firedOnce) return null;
  for (let off = 0; off < 8; off++) {
    const dt = new Date(now.getTime() + off * 86400000);
    if (!dayMatches(a, dt)) continue;
    const [h, m] = a.time.split(':').map(Number);
    const cand = new Date(dt); cand.setHours(h, m, 0, 0);
    if (cand > now) return cand;
  }
  return null;
}
function countdownText(a, now) {
  now = now || new Date();
  const nxt = nextOccurrence(a, now);
  if (!nxt) return '';
  const s = Math.max(0, Math.round((nxt - now) / 1000));
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
  if (h > 0) return `in ${h}h ${m}m`;
  if (m > 0) return `in ${m}m`;
  return `in ${s}s`;
}
function updateAlarmFooter() {
  if (!alarms.length) { alarmStatus.textContent = 'No alarms set.'; return; }
  const now = new Date();
  let best = null, bestA = null;
  for (const a of alarms) {
    const nxt = nextOccurrence(a, now);
    if (nxt && (!best || nxt < best)) { best = nxt; bestA = a; }
  }
  const on = alarms.filter(a => a.enabled).length;
  if (best) alarmStatus.textContent = `Next: ${fmtAlarm(`${pad(best.getHours())}:${pad(best.getMinutes())}`)}${bestA.label ? ' — ' + bestA.label : ''} · ${alarms.length} alarm(s), ${on} active`;
  else alarmStatus.textContent = `${alarms.length} alarm(s), ${on} active.`;
}
function tickAlarmCountdowns(now) {
  if (!prefs.showAlarmCountdown) return;
  document.querySelectorAll('.alarm-count').forEach(el => {
    const a = alarms.find(x => String(x.id) === el.dataset.id);
    el.textContent = a ? countdownText(a, now) : '';
    if (el.textContent) el.textContent = ' · ' + el.textContent;
  });
}
function dayMatches(a, now) {
  const d = now.getDay();
  if (a.repeat === 'daily') return true;
  if (a.repeat === 'weekdays') return d >= 1 && d <= 5;
  if (a.repeat === 'weekends') return d === 0 || d === 6;
  if (a.repeat === 'custom') return (a.days || []).includes(d);
  return true; // once
}
function dateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function checkAlarms(now) {
  const key = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const today = dateStr(now);
  const due = [];
  for (const a of alarms) {
    if (!a.enabled || ringingIds.includes(a.id) || testRingIds.has(a.id)) continue;
    // Per-alarm minute mark: snoozing/dismissing mid-minute can never re-fire it.
    if (a._firedMark === `${today}|${key}`) continue;
    if (a.snoozedUntil && a.snoozedUntil === key && a.snoozeDate === today) {
      a._firedMark = `${today}|${key}`;
      due.push(a.id);
    } else if (a.time === key && dayMatches(a, now) && !(a.repeat === 'once' && a.firedOnce)) {
      a._firedMark = `${today}|${key}`;
      a.snoozeCount = 0; a.snoozedUntil = null; a.snoozeDate = ''; // fresh ring resets the snooze chain
      if (a.repeat === 'once') a.firedOnce = true; // stays on while ringing/snoozed; off on dismiss
      due.push(a.id);
    }
  }
  if (due.length) { saveAlarms(); renderAlarms(); startRingingEvent(due); }
}
document.getElementById('dismissAllRinging').addEventListener('click', dismissAllRinging);
document.getElementById('widgetDismissAll').addEventListener('click', dismissAllRinging);
let widgetSnoozeOverride = null;
function widgetSnoozeLenFor(a) { return widgetSnoozeOverride || a.snoozeMin || 5; }
widgetSnoozeLen.addEventListener('change', () => {
  widgetSnoozeOverride = widgetSnoozeLen.value ? +widgetSnoozeLen.value : null;
  refreshRingingUI(); // row 💤 buttons adopt the new length
});
renderAlarms();

// ---------- World clock ----------
const zoneStrip = document.getElementById('zoneStrip');
const zoneRow = document.getElementById('zoneRow');
const zoneSort = document.getElementById('zoneSort');
const zoneOffsetBtn = document.getElementById('zoneOffsetBtn');
const zoneFormatBtn = document.getElementById('zoneFormatBtn');
const zoneSecsBtn = document.getElementById('zoneSecsBtn');
const zoneBtn = document.getElementById('zoneBtn');
let primaryZone = null; // IANA id previewed on the main clock (session-only)
let lastZoneMinute = -1;
let zoneRenderGuard = false;
let dragId = null, dropAfter = false, suppressZoneClick = false;
const zoneFmtCache = {}, zoneOffFmtCache = {};

function zonedHMS(tz, d) {
  let f = zoneFmtCache[tz];
  if (!f) { f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, hour: 'numeric', minute: 'numeric', second: 'numeric' }); zoneFmtCache[tz] = f; }
  const p = {};
  for (const x of f.formatToParts(d)) p[x.type] = x.value;
  return { h: (+p.hour) % 24, m: +p.minute, s: +p.second };
}
function zoneOffsetMin(tz, d) {
  let f = zoneOffFmtCache[tz];
  if (!f) { f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: 'numeric', second: 'numeric' }); zoneOffFmtCache[tz] = f; }
  const p = {};
  for (const x of f.formatToParts(d)) p[x.type] = x.value;
  return Math.round((Date.UTC(p.year, p.month - 1, p.day, (+p.hour) % 24, p.minute, p.second) - d.getTime()) / 60000);
}
function fmtOffset(min) {
  const sign = min < 0 ? '-' : '+', a = Math.abs(min);
  return `GMT${sign}${Math.floor(a / 60)}${a % 60 ? ':' + pad(a % 60) : ''}`;
}
function zoneOffText(id, now) {
  return zprefs.showOffset ? fmtOffset(zoneOffsetMin(id, now)) : '';
}
function zoneDateText(id, now) {
  return now.toLocaleDateString(undefined, { timeZone: id, weekday: 'short', month: 'numeric', day: 'numeric' });
}
function cityOf(id) { const z = ZONES.find(z => z.id === id); return z ? z.city : id; }
// Time-of-day emoji per local hour: sunrise, morning, midday, afternoon, sunset, night.
function dayPhaseEmoji(h) {
  if (h >= 5 && h < 7) return '🌅';
  if (h >= 7 && h < 11) return '🌤️';
  if (h >= 11 && h < 15) return '☀️';
  if (h >= 15 && h < 17) return '🌤️';
  if (h >= 17 && h < 20) return '🌇';
  return '🌙';
}
function orderedZones(now = new Date()) {
  const byId = Object.fromEntries(ZONES.map(z => [z.id, z]));
  if (zprefs.sort === 'city') return [...ZONES].sort((a, b) => a.city.localeCompare(b.city));
  if (zprefs.sort === 'country') return [...ZONES].sort((a, b) => a.country.localeCompare(b.country) || a.city.localeCompare(b.city));
  if (zprefs.sort === 'time') return [...ZONES].sort((a, b) => zoneOffsetMin(a.id, now) - zoneOffsetMin(b.id, now));
  const manual = zprefs.order.filter(id => byId[id]).map(id => byId[id]);
  ZONES.forEach(z => { if (!manual.includes(z)) manual.push(z); });
  return manual;
}
function fmtZoneTime(h, m, s) {
  let ap = '';
  if (zprefs.h12) { ap = h >= 12 ? ' PM' : ' AM'; h = h % 12 || 12; }
  return `${pad(h)}:${pad(m)}${zprefs.showSeconds ? ':' + pad(s) : ''}${ap}`;
}
function renderZones() {
  if (zoneRenderGuard) return;
  zoneRenderGuard = true;
  try {
    const now = new Date();
    lastZoneMinute = now.getMinutes();
    zoneRow.innerHTML = '';
    const manual = zprefs.sort === 'manual';
    orderedZones(now).forEach(z => {
      const el = document.createElement('div');
      el.className = 'zone-chip' + (primaryZone === z.id ? ' primary' : '');
      el.dataset.id = z.id;
      el.setAttribute('role', 'button');
      el.tabIndex = 0;
      el.title = `${z.city}, ${z.country} — click for primary preview`;
      el.innerHTML = '<span class="zone-day"></span>' +
        '<span class="zone-meta"><span class="zone-city"></span><span class="zone-sub"></span></span>' +
        '<span class="zone-side"><span class="zone-time"></span>' +
        (zprefs.showOffset ? '<span class="zone-off"></span>' : '') + '</span>';
      el.querySelector('.zone-city').textContent = z.city;
      el.draggable = manual;
      if (manual) {
        el.addEventListener('dragstart', (e) => {
          dragId = z.id; suppressZoneClick = true; el.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          try { e.dataTransfer.setData('text/plain', z.id); } catch (err) {}
        });
        el.addEventListener('dragover', (e) => {
          e.preventDefault();
          const r = el.getBoundingClientRect();
          // Vertical list in the docked panel, horizontal row for wall pills.
          const vertical = document.body.dataset.wall !== 'on';
          const after = vertical ? (e.clientY - r.top) > r.height / 2 : (e.clientX - r.left) > r.width / 2;
          dropAfter = after;
          el.classList.toggle('drop-before', !after);
          el.classList.toggle('drop-after', after);
        });
        el.addEventListener('dragleave', () => el.classList.remove('drop-before', 'drop-after'));
        el.addEventListener('drop', (e) => {
          e.preventDefault();
          if (dragId && dragId !== z.id) {
            const order = zprefs.order.filter(id => id !== dragId);
            order.splice(order.indexOf(z.id) + (dropAfter ? 1 : 0), 0, dragId);
            zprefs.order = order; savePrefs(); renderZones();
          }
        });
        el.addEventListener('dragend', () => {
          document.querySelectorAll('.zone-chip').forEach(c => c.classList.remove('dragging', 'drop-before', 'drop-after'));
          setTimeout(() => { suppressZoneClick = false; }, 60);
        });
      }
      el.addEventListener('click', () => { if (!suppressZoneClick) setPrimary(z.id); });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPrimary(z.id); }
      });
      zoneRow.appendChild(el);
    });
    renderZoneTimes(now);
  } finally { zoneRenderGuard = false; }
}
function renderZoneTimes(now = new Date()) {
  if (document.body.dataset.zones !== 'open') return;
  zoneRow.querySelectorAll('.zone-chip').forEach(ch => {
    const id = ch.dataset.id;
    const z = ZONES.find(z => z.id === id);
    const { h, m, s } = zonedHMS(id, now);
    ch.querySelector('.zone-time').textContent = fmtZoneTime(h, m, s);
    ch.querySelector('.zone-sub').textContent = `${z ? z.country : ''} · ${zoneDateText(id, now)}`;
    const off = ch.querySelector('.zone-off');
    if (off) off.textContent = zoneOffText(id, now);
    ch.querySelector('.zone-day').textContent = dayPhaseEmoji(h);
  });
  if (zprefs.sort === 'time' && now.getMinutes() !== lastZoneMinute) renderZones();
}
function setPrimary(id) {
  primaryZone = (primaryZone === id) ? null : id;
  const badge = document.getElementById('primaryBadge');
  if (!primaryZone) badge.classList.add('hidden');
  else { document.getElementById('primaryName').textContent = cityOf(primaryZone); badge.classList.remove('hidden'); }
  updateClock();
  renderZones();
}
// Keep the toggle + panel exactly as wide as the toolbar above them.
// Never measure while hidden (e.g. DND sets display:none → width 0 ruins the dock).
function syncDockWidth() {
  const dock = document.querySelector('.left-dock');
  const bar = dock ? dock.querySelector('.toolbar') : null;
  if (dock && bar && bar.offsetWidth > 0) dock.style.setProperty('--dock-w', bar.offsetWidth + 'px');
}
window.addEventListener('resize', syncDockWidth);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncDockWidth);
window.addEventListener('load', syncDockWidth);
function syncZoneControls() {
  zoneSort.value = zprefs.sort;
  zoneOffsetBtn.classList.toggle('active', zprefs.showOffset === true);
  zoneSecsBtn.classList.toggle('active', zprefs.showSeconds === true);
  zoneFormatBtn.textContent = zprefs.h12 ? '12H' : '24H';
  zoneFormatBtn.classList.toggle('active', zprefs.h12 === true);
  zoneBtn.setAttribute('aria-pressed', String(document.body.dataset.zones === 'open'));
  zoneBtn.classList.toggle('on', document.body.dataset.zones === 'open');
}
function setZones(open) {
  const will = open === undefined ? document.body.dataset.zones !== 'open' : open;
  document.body.dataset.zones = will ? 'open' : 'closed';
  zprefs.open = will; savePrefs();
  syncZoneControls();
  if (will) renderZones();
}
zoneBtn.addEventListener('click', () => { setZones(); zoneBtn.blur(); });
zoneSort.addEventListener('change', () => { zprefs.sort = zoneSort.value; savePrefs(); renderZones(); });
const alarmSortSel = document.getElementById('alarmSort');
const alarmCountBtn = document.getElementById('alarmCountBtn');
alarmSortSel.addEventListener('change', () => { prefs.alarmSort = alarmSortSel.value; savePrefs(); renderAlarms(); });
alarmCountBtn.addEventListener('click', () => {
  prefs.showAlarmCountdown = !prefs.showAlarmCountdown; savePrefs();
  alarmCountBtn.classList.toggle('active', prefs.showAlarmCountdown);
  renderAlarms();
});
zoneOffsetBtn.addEventListener('click', () => { zprefs.showOffset = !zprefs.showOffset; savePrefs(); syncZoneControls(); renderZones(); });
zoneFormatBtn.addEventListener('click', () => { zprefs.h12 = !zprefs.h12; savePrefs(); syncZoneControls(); renderZoneTimes(); });
zoneSecsBtn.addEventListener('click', () => { zprefs.showSeconds = !zprefs.showSeconds; savePrefs(); syncZoneControls(); renderZoneTimes(); });
document.getElementById('primaryBadge').addEventListener('click', (e) => { e.currentTarget.blur(); if (primaryZone) setPrimary(primaryZone); });

// ---------- Pomodoro ----------
const pomoPanel = document.getElementById('panel-pomodoro');
const pomoRing = document.getElementById('pomoRing');
const pomoCountdown = document.getElementById('pomoCountdown');
const pomoModeLabel = document.getElementById('pomoModeLabel');
const pomoCycle = document.getElementById('pomoCycle');
const pomoDots = document.getElementById('pomoDots');
const pomoStatus = document.getElementById('pomoStatus');
const pomoStartBtn = document.getElementById('pomoStart');
const pomoFace = document.getElementById('pomoFace');
const RING_C = 590.62;
const PHASE_LABEL = { work: 'Focus', short: 'Short break', long: 'Long break' };
let pomo = { phase: 'work', running: false, remaining: 25 * 60, total: 25 * 60, endAt: null, id: null, cycleDone: 0 };

function pomoPhaseMin() {
  const c = prefs.pomo;
  return pomo.phase === 'work' ? +c.workMin || 25 : pomo.phase === 'short' ? +c.shortMin || 5 : +c.longMin || 15;
}
function fmtPomo(sec) {
  sec = Math.max(0, Math.ceil(sec));
  if (sec >= 3600) return `${Math.floor(sec / 3600)}:${pad(Math.floor(sec % 3600 / 60))}:${pad(sec % 60)}`;
  return `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
}
function renderPomo() {
  pomoPanel.dataset.phase = pomo.phase;
  if (document.body.dataset.pomoPhase !== pomo.phase) document.body.dataset.pomoPhase = pomo.phase;
  pomoCountdown.textContent = fmtPomo(pomo.remaining);
  // Ring starts full and depletes as the session counts down.
  pomoRing.style.strokeDashoffset = (RING_C * (1 - (pomo.total ? pomo.remaining / pomo.total : 0))).toFixed(1);
  document.querySelectorAll('.phase-btn').forEach(b => b.classList.toggle('active', b.dataset.phase === pomo.phase));
  pomoModeLabel.textContent = PHASE_LABEL[pomo.phase];
  const cyc = Math.max(1, +prefs.pomo.cycle || 4);
  const pos = pomo.cycleDone % cyc;
  pomoCycle.textContent = `Session ${pos + 1}/${cyc}`;
  pomoDots.innerHTML = '';
  for (let i = 0; i < cyc; i++) {
    const d = document.createElement('i');
    if (i < pos) d.className = 'on';
    pomoDots.appendChild(d);
  }
  pomoStartBtn.childNodes[0].textContent = pomo.running ? 'Pause ' : (pomo.remaining < pomo.total ? 'Resume ' : 'Start ');
  document.getElementById('pomoSkip').classList.toggle('hidden', !pomo.running);
}
function setPhase(phase) {
  pomo.phase = phase;
  pomo.total = pomoPhaseMin() * 60;
  pomo.remaining = pomo.total;
  renderPomo();
  // Recolor the background the moment the phase changes.
  if (prefs.sky === true && document.body.dataset.view === 'pomodoro') applySky();
}
function stopPomoTick() { if (pomo.id) clearInterval(pomo.id); pomo.id = null; }
function startPomoNow() {
  pomo.endAt = Date.now() + pomo.remaining * 1000;
  stopPomoTick(); pomo.id = setInterval(pomoTick, 250);
  pomo.running = true; renderPomo();
}
function startPausePomo() {
  if (pomo.running) {
    pomo.remaining = Math.max(0, Math.round((pomo.endAt - Date.now()) / 1000));
    stopPomoTick(); pomo.running = false;
    pomoStatus.textContent = 'Paused.';
  } else {
    if (pomo.remaining <= 0) setPhase(pomo.phase);
    startPomoNow();
    pomoStatus.textContent = pomo.phase === 'work' ? 'Focusing...' : 'On break...';
  }
  renderPomo();
}
function resetPomo() {
  stopPomoTick(); pomo.running = false;
  setPhase(pomo.phase);
  pomoStatus.textContent = 'Press Start to begin a focus session.';
  renderPomo();
}
function switchPhase(phase) {
  stopPomoTick(); pomo.running = false;
  setPhase(phase);
  pomoStatus.textContent = `${PHASE_LABEL[phase]} selected — press Start.`;
  renderPomo();
}
function completePhase(completed) {
  stopPomoTick(); pomo.running = false;
  // Work always advances the cycle position (skips follow the same order);
  // only natural completions chime and credit the active task.
  if (pomo.phase === 'work') pomo.cycleDone++;
  if (completed) {
    beep(3);
    if (pomo.phase === 'work') creditActiveTask();
  }
  const cyc = Math.max(1, +prefs.pomo.cycle || 4);
  const next = pomo.phase === 'work' ? (pomo.cycleDone % cyc === 0 ? 'long' : 'short') : 'work';
  const auto = (next !== 'work' && prefs.pomo.autoBreaks) || (next === 'work' && prefs.pomo.autoWork);
  setPhase(next);
  if (auto) { startPomoNow(); pomoStatus.textContent = next === 'work' ? 'Focusing...' : 'On break...'; }
  else pomoStatus.textContent = `${PHASE_LABEL[next]} ready — press Start.`;
  renderPomo();
}
function phaseComplete() { completePhase(true); }
// Skip follows the natural cycle order (W–SB–W–…–W–LB) without chiming,
// crediting, or auto-starting — and only while a session is actually running.
function skipPhase() {
  if (!pomo.running) return;
  stopPomoTick(); pomo.running = false;
  const was = PHASE_LABEL[pomo.phase];
  if (pomo.phase === 'work') pomo.cycleDone++;
  const cyc = Math.max(1, +prefs.pomo.cycle || 4);
  const next = pomo.phase === 'work' ? (pomo.cycleDone % cyc === 0 ? 'long' : 'short') : 'work';
  setPhase(next);
  pomoStatus.textContent = `Skipped ${was.toLowerCase()} — ${PHASE_LABEL[next]} ready, press Start.`;
  renderPomo();
}
document.getElementById('pomoSkip').addEventListener('click', skipPhase);
document.querySelectorAll('.phase-btn').forEach(b => b.addEventListener('click', () => switchPhase(b.dataset.phase)));
function pomoTick() {
  pomo.remaining = Math.max(0, Math.round((pomo.endAt - Date.now()) / 1000));
  renderPomo();
  if (pomo.remaining <= 0) phaseComplete();
}
pomoStartBtn.addEventListener('click', startPausePomo);
document.getElementById('pomoReset').addEventListener('click', resetPomo);
// Config inputs apply live when idle
[['cfgWork', 'workMin'], ['cfgShort', 'shortMin'], ['cfgLong', 'longMin'], ['cfgCycle', 'cycle']].forEach(([id, key]) => {
  document.getElementById(id).addEventListener('change', (e) => {
    const v = Math.max(1, +e.target.value || 1);
    e.target.value = v; prefs.pomo[key] = v; savePrefs();
    if (!pomo.running) setPhase(pomo.phase);
    renderPomo();
  });
});
[['cfgAutoBreaks', 'autoBreaks'], ['cfgAutoWork', 'autoWork']].forEach(([id, key]) => {
  document.getElementById(id).addEventListener('change', (e) => { prefs.pomo[key] = e.target.checked; savePrefs(); });
});
// Do Not Disturb: toggled by pressing the dial itself; countdown + essential controls only
const pomoDndToggle = document.getElementById('pomoDndToggle');
function setDnd(on) {
  document.body.dataset.dnd = on ? 'on' : 'off';
  if (!on) syncDockWidth(); // re-measure now that the dock is visible again
  pomoDndToggle.classList.toggle('on', on);
  pomoDndToggle.setAttribute('aria-pressed', String(on));
  pomoDndToggle.textContent = on ? 'DND on' : 'DND';
}
pomoFace.addEventListener('click', () => setDnd(document.body.dataset.dnd !== 'on'));

// ---------- Pomodoro tasks ----------
const TASK_KEY = 'pomodoro-tasks';
let tasks = [];
try { tasks = JSON.parse(localStorage.getItem(TASK_KEY) || '[]'); } catch (e) { tasks = []; }
let taskFilter = 'all', taskPriFilter = 'all', taskBottom = true;
const taskList = document.getElementById('taskList');
const taskStatus = document.getElementById('taskStatus');
function saveTasks() { try { localStorage.setItem(TASK_KEY, JSON.stringify(tasks)); } catch (e) {} }
function creditActiveTask() {
  const t = tasks.find(t => t.active && !t.finished);
  if (t) { t.done++; saveTasks(); renderTasks(); }
}
function visibleTasks() {
  let list = tasks.filter(t =>
    (taskFilter === 'all' || (taskFilter === 'done') === t.finished) &&
    (taskPriFilter === 'all' || t.pri === taskPriFilter));
  if (taskBottom) list = [...list.filter(t => !t.finished), ...list.filter(t => t.finished)];
  return list;
}
function renderTasks() {
  taskList.innerHTML = '';
  const list = visibleTasks();
  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'task-empty'; li.textContent = 'No tasks — add one above.';
    taskList.appendChild(li);
  }
  list.forEach(t => {
    const li = document.createElement('li');
    if (t.finished) li.classList.add('done');
    if (t.active && !t.finished) li.classList.add('active');
    li.title = t.active && !t.finished ? 'Active task (click to deactivate)' : 'Click to set as active task';
    const box = document.createElement('input');
    box.type = 'checkbox'; box.checked = t.finished; box.setAttribute('aria-label', 'Mark finished');
    box.addEventListener('click', (e) => { e.stopPropagation(); t.finished = box.checked; saveTasks(); renderTasks(); });
    const txt = document.createElement('span'); txt.className = 't-text'; txt.textContent = t.text;
    const pri = document.createElement('span'); pri.className = 'pri ' + t.pri; pri.textContent = t.pri[0].toUpperCase() + t.pri.slice(1);
    const est = document.createElement('span'); est.className = 'est'; est.textContent = `🍅 ${t.done}/${t.est}`;
    const del = document.createElement('button'); del.className = 't-del'; del.textContent = '✕'; del.setAttribute('aria-label', 'Delete task');
    del.addEventListener('click', (e) => { e.stopPropagation(); tasks = tasks.filter(x => x.id !== t.id); saveTasks(); renderTasks(); });
    li.addEventListener('click', () => {
      tasks.forEach(x => { x.active = (x === t) ? !x.active : false; });
      saveTasks(); renderTasks();
    });
    li.append(box, txt, pri, est, del);
    taskList.appendChild(li);
  });
  const open = tasks.filter(t => !t.finished).length;
  taskStatus.textContent = tasks.length ? `${open} open · ${tasks.length - open} done` : '';
  updateActiveTaskLine();
}
function updateActiveTaskLine() {
  const el = document.getElementById('pomoActiveTask');
  if (!el) return;
  const t = tasks.find(t => t.active && !t.finished);
  el.textContent = t ? `🎯 ${t.text} · 🍅 ${t.done}/${t.est}` : 'No active task — click one below to focus it.';
  el.title = t ? t.text : '';
}
document.getElementById('taskAdd').addEventListener('click', () => {
  const input = document.getElementById('taskText');
  const text = input.value.trim();
  if (!text) { taskStatus.textContent = 'Type a task first.'; return; }
  tasks.push({
    id: Date.now(), text,
    pri: document.getElementById('taskPri').value,
    est: Math.max(1, +document.getElementById('taskEst').value || 1),
    done: 0, finished: false, active: false,
  });
  input.value = ''; saveTasks(); renderTasks();
});
document.getElementById('taskText').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); document.getElementById('taskAdd').click(); }
});
document.querySelectorAll('.task-filters .chip[data-filter]').forEach(c => c.addEventListener('click', () => {
  taskFilter = c.dataset.filter;
  document.querySelectorAll('.task-filters .chip[data-filter]').forEach(x => x.classList.toggle('active', x === c));
  renderTasks();
}));
document.getElementById('taskPriFilter').addEventListener('change', (e) => { taskPriFilter = e.target.value; renderTasks(); });
document.getElementById('taskBottomBtn').addEventListener('click', (e) => {
  taskBottom = !taskBottom;
  e.currentTarget.classList.toggle('active', taskBottom);
  renderTasks();
});
document.getElementById('taskClearDone').addEventListener('click', () => {
  tasks = tasks.filter(t => !t.finished); saveTasks(); renderTasks();
  taskStatus.textContent = 'Finished tasks cleared.';
});
document.getElementById('taskClearAll').addEventListener('click', () => {
  tasks = []; saveTasks(); renderTasks();
  taskStatus.textContent = 'All tasks cleared.';
});

// ---------- Ambient soundscapes (fully procedural Web Audio, no files) ----------
let ambCtx = null, ambMaster = null, ambAnalyser = null, ambNoiseBuf = null;
const ambActive = new Map(); // id -> { def, gain, stop }
let ambPaused = false;
const ambRand = (a, b) => a + Math.random() * (b - a);
function ambEnsure() {
  if (!ambCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ambCtx = new AC();
    ambMaster = ambCtx.createGain();
    ambMaster.gain.value = (prefs.ambVol ?? 70) / 100;
    ambAnalyser = ambCtx.createAnalyser();
    ambAnalyser.fftSize = 64;
    ambAnalyser.smoothingTimeConstant = 0.8;
    const comp = ambCtx.createDynamicsCompressor(); // glue layered mixes together
    ambMaster.connect(comp); comp.connect(ambAnalyser); ambAnalyser.connect(ambCtx.destination);
    const len = ambCtx.sampleRate * 2;
    ambNoiseBuf = ambCtx.createBuffer(1, len, ambCtx.sampleRate);
    const d = ambNoiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ambCtx.state === 'suspended' && !ambPaused) { try { ambCtx.resume(); } catch (e) {} }
  return ambCtx;
}
function ambNoiseSrc() { const s = ambCtx.createBufferSource(); s.buffer = ambNoiseBuf; s.loop = true; return s; }
function ambLFO(freq, depth, param, base) {
  const o = ambCtx.createOscillator(), g = ambCtx.createGain();
  o.frequency.value = freq; g.gain.value = depth;
  if (base !== undefined) param.value = base;
  o.connect(g); g.connect(param); o.start();
  return o;
}
function ambCleanup(timers, nodes) {
  timers.forEach(clearTimeout);
  nodes.forEach(n => { try { n.onended = null; } catch (e) {} try { n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
  nodes.length = 0;
}
// One-shot voices remove themselves from tracking when they end,
// so hours-long sessions don't accumulate dead nodes.
function ambOneShot(nodes, o) {
  try { o.onended = () => { const i = nodes.indexOf(o); if (i > -1) nodes.splice(i, 1); try { o.disconnect(); } catch (e) {} }; } catch (e) {}
  nodes.push(o);
}
function buildRain(out) {
  const timers = [], nodes = [];
  const rain = ambNoiseSrc();
  const lp = ambCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500;
  const g = ambCtx.createGain();
  rain.connect(lp); lp.connect(g); g.connect(out); rain.start();
  nodes.push(rain, ambLFO(0.11, 0.16, g.gain, 0.5));
  const hiss = ambNoiseSrc();
  const hp = ambCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
  const hg = ambCtx.createGain(); hg.gain.value = 0.05;
  hiss.connect(hp); hp.connect(hg); hg.connect(out); hiss.start(); nodes.push(hiss);
  (function rumble() {
    const t = ambCtx.currentTime + 0.05;
    const o = ambCtx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(ambRand(55, 70), t);
    o.frequency.exponentialRampToValueAtTime(ambRand(32, 40), t + 2.2);
    const og = ambCtx.createGain();
    og.gain.setValueAtTime(0.001, t);
    og.gain.exponentialRampToValueAtTime(ambRand(0.5, 0.9), t + 0.35);
    og.gain.exponentialRampToValueAtTime(0.001, t + ambRand(2.2, 3.4));
    o.connect(og); og.connect(out); o.start(t); o.stop(t + 3.6); ambOneShot(nodes, o);
    timers.push(setTimeout(rumble, ambRand(9000, 22000)));
  })();
  return () => ambCleanup(timers, nodes);
}
function buildBirds(out) {
  const timers = [], nodes = [];
  const wind = ambNoiseSrc();
  const bp = ambCtx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 480; bp.Q.value = 0.4;
  const wg = ambCtx.createGain();
  wind.connect(bp); bp.connect(wg); wg.connect(out); wind.start();
  nodes.push(wind, ambLFO(0.07, 0.06, wg.gain, 0.1));
  (function chirp() {
    const t0 = ambCtx.currentTime + 0.05;
    const base = ambRand(2400, 4200);
    const syl = 2 + Math.floor(Math.random() * 3);
    for (let k = 0; k < syl; k++) {
      const t = t0 + k * 0.14;
      const o = ambCtx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(base * ambRand(0.9, 1.1), t);
      o.frequency.linearRampToValueAtTime(base * ambRand(1.15, 1.35), t + 0.06);
      o.frequency.linearRampToValueAtTime(base * ambRand(0.85, 1), t + 0.12);
      const g = ambCtx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      o.connect(g);
      if (ambCtx.createStereoPanner) { const pan = ambCtx.createStereoPanner(); pan.pan.value = ambRand(-0.7, 0.7); g.connect(pan); pan.connect(out); }
      else g.connect(out);
      o.start(t); o.stop(t + 0.2); ambOneShot(nodes, o);
    }
    timers.push(setTimeout(chirp, ambRand(1200, 4500)));
  })();
  const SCALE = [523.25, 587.33, 659.25, 783.99, 880];
  (function chime() {
    const t = ambCtx.currentTime + 0.05;
    const f = SCALE[Math.floor(Math.random() * SCALE.length)];
    [[1, 0.12], [2, 0.04]].forEach(([mult, vol]) => {
      const o = ambCtx.createOscillator(); o.type = 'sine'; o.frequency.value = f * mult;
      const g = ambCtx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 3.7); ambOneShot(nodes, o);
    });
    timers.push(setTimeout(chime, ambRand(14000, 28000)));
  })();
  return () => ambCleanup(timers, nodes);
}
function buildLeaves(out) {
  const timers = [], nodes = [];
  const rustle = ambNoiseSrc();
  const bp = ambCtx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2500; bp.Q.value = 0.5;
  const g = ambCtx.createGain();
  rustle.connect(bp); bp.connect(g); g.connect(out); rustle.start();
  nodes.push(rustle, ambLFO(0.06, 0.06, g.gain, 0.12));
  (function gust() {
    g.gain.setTargetAtTime(ambRand(0.04, 0.16), ambCtx.currentTime, 0.9);
    timers.push(setTimeout(gust, ambRand(2500, 6000)));
  })();
  // Single leaves fluttering down: soft descending whistles + faint landing puffs
  (function drop() {
    const t = ambCtx.currentTime + 0.05;
    const o = ambCtx.createOscillator(); o.type = 'sine';
    const f = ambRand(700, 1100);
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * ambRand(0.4, 0.55), t + 0.28);
    const og = ambCtx.createGain();
    og.gain.setValueAtTime(0.001, t);
    og.gain.exponentialRampToValueAtTime(0.07, t + 0.06);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.4); ambOneShot(nodes, o);
    const puff = ambNoiseSrc();
    const lp = ambCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    const pg = ambCtx.createGain();
    pg.gain.setValueAtTime(0.001, t + 0.3);
    pg.gain.exponentialRampToValueAtTime(0.09, t + 0.33);
    pg.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    puff.connect(lp); lp.connect(pg); pg.connect(out);
    puff.start(t + 0.3); puff.stop(t + 0.55); ambOneShot(nodes, puff);
    timers.push(setTimeout(drop, ambRand(2000, 7000)));
  })();
  return () => ambCleanup(timers, nodes);
}
function buildStream(out) {
  const timers = [], nodes = [];
  // Babbling flow bed with burbling motion
  const flow = ambNoiseSrc();
  const bp = ambCtx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 1;
  const g = ambCtx.createGain();
  flow.connect(bp); bp.connect(g); g.connect(out); flow.start();
  nodes.push(flow, ambLFO(0.5, 0.1, g.gain, 0.3));
  // Bright sparkle over the water
  const spark = ambNoiseSrc();
  const hp = ambCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5200;
  const sg = ambCtx.createGain(); sg.gain.value = 0.035;
  spark.connect(hp); hp.connect(sg); sg.connect(out); spark.start(); nodes.push(spark);
  // Random droplet plinks
  (function plink() {
    const t = ambCtx.currentTime + 0.03;
    const o = ambCtx.createOscillator(); o.type = 'sine';
    o.frequency.value = ambRand(900, 2400);
    const og = ambCtx.createGain();
    og.gain.setValueAtTime(ambRand(0.04, 0.12), t);
    og.gain.exponentialRampToValueAtTime(0.001, t + ambRand(0.12, 0.25));
    o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.35); ambOneShot(nodes, o);
    if (Math.random() < 0.35) timers.push(setTimeout(plink, ambRand(120, 300)));
    else timers.push(setTimeout(plink, ambRand(350, 1200)));
  })();
  // Slow underwater gurgle wobble
  const gur = ambCtx.createOscillator(); gur.type = 'sine'; gur.frequency.value = 92;
  const gg = ambCtx.createGain(); gg.gain.value = 0.025;
  gur.connect(gg); gg.connect(out); gur.start();
  nodes.push(gur, ambLFO(7, 22, gur.frequency));
  return () => ambCleanup(timers, nodes);
}
function buildNight(out) {
  const timers = [], nodes = [];
  const wind = ambNoiseSrc();
  const lp = ambCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
  const wg = ambCtx.createGain();
  wind.connect(lp); lp.connect(wg); wg.connect(out); wind.start();
  nodes.push(wind, ambLFO(0.05, 0.1, wg.gain, 0.2));
  (function crickets() {
    const t0 = ambCtx.currentTime + 0.05;
    const f = ambRand(4000, 4500), step = 0.045;
    const n = Math.floor(ambRand(0.4, 0.9) / step);
    const o = ambCtx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const g = ambCtx.createGain(); g.gain.value = 0.001;
    for (let k = 0; k < n; k++) g.gain.setValueAtTime(k % 2 ? 0.001 : 0.16, t0 + k * step);
    g.gain.setValueAtTime(0.001, t0 + n * step);
    o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + n * step + 0.1); ambOneShot(nodes, o);
    timers.push(setTimeout(crickets, ambRand(2500, 6000)));
  })();
  return () => ambCleanup(timers, nodes);
}
function buildFrogs(out) {
  const timers = [], nodes = [];
  // Still pond bed
  const bed = ambNoiseSrc();
  const lp = ambCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
  const bg = ambCtx.createGain();
  bed.connect(lp); lp.connect(bg); bg.connect(out); bed.start();
  nodes.push(bed, ambLFO(0.07, 0.04, bg.gain, 0.09));
  // Croak groups: low ribbits with a fast throat warble
  (function chorus() {
    const t0 = ambCtx.currentTime + 0.05;
    const f = ambRand(85, 150);
    const n = 2 + Math.floor(Math.random() * 4);
    for (let k = 0; k < n; k++) {
      const t = t0 + k * 0.34, dur = 0.24;
      const o = ambCtx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 0.88, t + dur);
      const g = ambCtx.createGain(); g.gain.value = 0.001;
      const pulses = Math.floor(dur / (1 / 30));
      for (let j = 0; j <= pulses; j++) g.gain.setValueAtTime(j % 2 ? 0.001 : 0.4, t + j / 30);
      g.gain.setValueAtTime(0.001, t + dur + 0.02);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.1); ambOneShot(nodes, o);
    }
    timers.push(setTimeout(chorus, ambRand(3000, 8000)));
  })();
  return () => ambCleanup(timers, nodes);
}
function buildShishi(out) {
  const timers = [], nodes = [];
  // Constant thin trickle
  const trik = ambNoiseSrc();
  const hp = ambCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3800;
  const tg = ambCtx.createGain(); tg.gain.value = 0.035;
  trik.connect(hp); hp.connect(tg); tg.connect(out); trik.start(); nodes.push(trik);
  // Fill-and-tip cycle: rising water tone, hollow bamboo tok, splash
  (function cycle() {
    const t = ambCtx.currentTime + 0.05;
    const fill = ambRand(6, 9);
    const bp = ambCtx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3;
    bp.frequency.setValueAtTime(800, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + fill);
    const fg = ambCtx.createGain();
    fg.gain.setValueAtTime(0.001, t);
    fg.gain.exponentialRampToValueAtTime(0.12, t + fill);
    fg.gain.exponentialRampToValueAtTime(0.001, t + fill + 0.2);
    const fs = ambNoiseSrc();
    fs.connect(bp); bp.connect(fg); fg.connect(out);
    fs.start(t); fs.stop(t + fill + 0.4); ambOneShot(nodes, fs);
    // Bamboo clack + splash at the tip moment
    const ts = t + fill + 0.1;
    [[170, 0.5, 0.5], [340, 0.2, 0.3], [512, 0.1, 0.2]].forEach(([f, vol, dur]) => {
      const o = ambCtx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ambCtx.createGain();
      g.gain.setValueAtTime(vol, ts);
      g.gain.exponentialRampToValueAtTime(0.001, ts + dur);
      o.connect(g); g.connect(out); o.start(ts); o.stop(ts + dur + 0.05); ambOneShot(nodes, o);
    });
    const sp = ambNoiseSrc();
    const slp = ambCtx.createBiquadFilter(); slp.type = 'lowpass'; slp.frequency.value = 900;
    const sg = ambCtx.createGain();
    sg.gain.setValueAtTime(0.001, ts);
    sg.gain.exponentialRampToValueAtTime(0.22, ts + 0.08);
    sg.gain.exponentialRampToValueAtTime(0.001, ts + 0.5);
    sp.connect(slp); slp.connect(sg); sg.connect(out);
    sp.start(ts); sp.stop(ts + 0.7); ambOneShot(nodes, sp);
    timers.push(setTimeout(cycle, (fill + ambRand(2, 4)) * 1000));
  })();
  return () => ambCleanup(timers, nodes);
}
function buildFire(out) {
  const timers = [], nodes = [];
  const bed = ambNoiseSrc();
  const lp = ambCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240;
  const bg = ambCtx.createGain();
  bed.connect(lp); lp.connect(bg); bg.connect(out); bed.start();
  nodes.push(bed, ambLFO(0.09, 0.08, bg.gain, 0.3));
  (function crackle() {
    const t = ambCtx.currentTime + 0.02;
    const src = ambNoiseSrc();
    const bp = ambCtx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = ambRand(1200, 3500); bp.Q.value = 2;
    const g = ambCtx.createGain();
    const dur = ambRand(0.03, 0.12);
    g.gain.setValueAtTime(ambRand(0.1, 0.4), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(out);
    src.start(t); src.stop(t + dur + 0.05); ambOneShot(nodes, src);
    timers.push(setTimeout(crackle, ambRand(120, 900)));
  })();
  return () => ambCleanup(timers, nodes);
}
const AMB_SOUNDS = [
  { id: 'rain', name: 'Stormfall', emoji: '🌧️', build: buildRain },
  { id: 'birds', name: 'Dawn Chorus', emoji: '🐦', build: buildBirds },
  { id: 'leaves', name: 'Falling Leaves', emoji: '🍂', build: buildLeaves },
  { id: 'stream', name: 'Babbling Brook', emoji: '💧', build: buildStream },
  { id: 'frogs', name: 'Pond Chorus', emoji: '🐸', build: buildFrogs },
  { id: 'shishi', name: 'Bamboo Fountain', emoji: '🎋', build: buildShishi },
  { id: 'night', name: 'Night Field', emoji: '🦗', build: buildNight },
  { id: 'fire', name: 'Hearthside', emoji: '🔥', build: buildFire },
];
const AMB_COLORS = {
  rain: ['#38bdf8', '#bae6fd'],
  birds: ['#4ade80', '#bbf7d0'],
  leaves: ['#f59e0b', '#fde68a'],
  stream: ['#22d3ee', '#a5f3fc'],
  frogs: ['#84cc16', '#ecfccb'],
  shishi: ['#14b8a6', '#99f6e4'],
  night: ['#a78bfa', '#ddd6fe'],
  fire: ['#f97316', '#fed7aa'],
};
function ambStart(id, fade = 1.2) {
  ambEnsure();
  if (ambCtx.state === 'suspended') { try { ambCtx.resume(); } catch (e) {} }
  if (ambActive.has(id)) return;
  const def = AMB_SOUNDS.find(d => d.id === id);
  if (!def) return;
  const g = ambCtx.createGain(); g.gain.value = 0;
  g.connect(ambMaster);
  g.gain.linearRampToValueAtTime(0.9, ambCtx.currentTime + fade);
  ambActive.set(id, { def, gain: g, stop: def.build(g) });
  syncAmbUI();
}
function ambStop(id, fade = 0.8) {
  const a = ambActive.get(id);
  if (!a) return;
  ambActive.delete(id);
  try { a.gain.gain.cancelScheduledValues(ambCtx.currentTime); a.gain.gain.setTargetAtTime(0, ambCtx.currentTime, fade / 3); } catch (e) {}
  setTimeout(() => { try { a.stop(); } catch (e) {} try { a.gain.disconnect(); } catch (e) {} }, fade * 1000 + 300);
  if (ambAuto && ambActive.size === 0) setAutoMix(false);
  syncAmbUI();
}
// ---------- Ambience UI ----------
const ambBtn = document.getElementById('ambBtn');
const ambIco = document.getElementById('ambIco');
const ambLabel = document.getElementById('ambLabel');
const ambPanel = document.getElementById('ambPanel');
const ambList = document.getElementById('ambList');
const ambVol = document.getElementById('ambVol');
const ambVolVal = document.getElementById('ambVolVal');
const NOTE_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg>';
const ambViz = document.getElementById('ambViz');
const ambVctx = ambViz.getContext('2d');
let vizRaf = null;
let ambAuto = false, ambAutoTimer = null;
AMB_SOUNDS.forEach(d => {
  const li = document.createElement('li');
  const em = document.createElement('span'); em.className = 'amb-emoji'; em.textContent = d.emoji;
  const nm = document.createElement('span'); nm.className = 'amb-name'; nm.textContent = d.name;
  const btn = document.createElement('button');
  btn.className = 'amb-play'; btn.dataset.id = d.id; btn.textContent = '▶';
  btn.setAttribute('aria-label', 'Play ' + d.name);
  btn.addEventListener('click', () => { ambActive.has(d.id) ? ambStop(d.id) : ambStart(d.id); });
  li.append(em, nm, btn);
  ambList.appendChild(li);
});
function syncAmbUI() {
  ambList.querySelectorAll('.amb-play').forEach(b => {
    const on = ambActive.has(b.dataset.id);
    b.classList.toggle('active', on);
    b.textContent = on ? '⏸' : '▶';
  });
  const n = ambActive.size;
  ambBtn.classList.toggle('playing', n > 0);
  if (!n) {
    ambIco.innerHTML = NOTE_SVG; ambLabel.textContent = 'Ambience';
  } else if (n === 1) {
    const d = AMB_SOUNDS.find(x => x.id === [...ambActive.keys()][0]);
    ambIco.textContent = ambPaused ? '▶' : '⏸';
    ambLabel.textContent = `${d.emoji} ${d.name}`;
  } else {
    ambIco.textContent = ambPaused ? '▶' : '⏸';
    ambLabel.textContent = `🎶 Mix · ${n}`;
  }
  kickViz();
}
function toggleAmbPanel(force) {
  const open = force !== undefined ? force : !ambPanel.classList.contains('open');
  if (open && !alarmWidget.classList.contains('hidden')) return; // widget has the floor
  ambPanel.classList.toggle('open', open);
  kickViz();
}
function toggleAmbPause() {
  if (!ambCtx || !ambActive.size) return;
  if (ambCtx.state === 'running') { ambCtx.suspend(); ambPaused = true; }
  else { ambCtx.resume(); ambPaused = false; }
  syncAmbUI();
}
ambBtn.addEventListener('click', (e) => {
  if (ambActive.size && e.target.closest('#ambIco')) toggleAmbPause();
  else toggleAmbPanel();
});
document.getElementById('ambClose').addEventListener('click', () => toggleAmbPanel(false));
// Auto-mix: keep 2–3 layers, constantly rotating a random track in and out.
function setAutoMix(on) {
  ambAuto = on;
  document.getElementById('ambShuffle').classList.toggle('active', on);
  if (ambAutoTimer) { clearTimeout(ambAutoTimer); ambAutoTimer = null; }
  if (on) {
    ambPaused = false;
    const missing = 2 - ambActive.size;
    for (let i = 0; i < missing; i++) {
      const pool = AMB_SOUNDS.filter(d => !ambActive.has(d.id));
      if (pool.length) setTimeout(() => ambStart(pool[Math.floor(Math.random() * pool.length)].id), i * 400);
    }
    const rotate = () => {
      ambAutoTimer = null;
      if (!ambAuto) return;
      if (!ambActive.size) { setAutoMix(false); return; }
      const active = [...ambActive.keys()];
      const inactive = AMB_SOUNDS.filter(d => !ambActive.has(d.id));
      if (active.length >= 2 && inactive.length) {
        ambStop(active[Math.floor(Math.random() * active.length)]);
        const add = inactive[Math.floor(Math.random() * inactive.length)];
        setTimeout(() => { if (ambAuto) ambStart(add.id); }, 700);
      } else if (inactive.length) {
        ambStart(inactive[Math.floor(Math.random() * inactive.length)].id);
      }
      ambAutoTimer = setTimeout(rotate, ambRand(40000, 80000));
    };
    ambAutoTimer = setTimeout(rotate, ambRand(40000, 80000));
  }
  syncAmbUI();
}
document.getElementById('ambShuffle').addEventListener('click', () => setAutoMix(!ambAuto));
document.getElementById('ambAll').addEventListener('click', () => {
  // Toggle: all playing → silence everything; otherwise layer them all in.
  if (ambActive.size === AMB_SOUNDS.length) [...ambActive.keys()].forEach(id => ambStop(id));
  else {
    ambPaused = false;
    AMB_SOUNDS.forEach((d, i) => { if (!ambActive.has(d.id)) setTimeout(() => ambStart(d.id), i * 300); });
  }
  syncAmbUI();
});
function syncAmbVol() {
  ambVolVal.textContent = ambVol.value;
}
ambVol.addEventListener('input', () => {
  prefs.ambVol = +ambVol.value; savePrefs(); syncAmbVol();
  if (ambMaster) ambMaster.gain.setTargetAtTime(prefs.ambVol / 100, ambCtx.currentTime, 0.05);
});
function drawViz() {
  vizRaf = null;
  if (!ambPanel.classList.contains('open')) return;
  const W = ambViz.width, H = ambViz.height;
  ambVctx.clearRect(0, 0, W, H);
  if (ambCtx && ambActive.size && ambCtx.state === 'running') {
    const data = new Uint8Array(ambAnalyser.frequencyBinCount);
    ambAnalyser.getByteFrequencyData(data);
    // Bars take their color from whatever is playing (gradient across a mix).
    const cols = [...ambActive.keys()].map(id => (AMB_COLORS[id] || ['#22d3ee', '#a5f3fc'])[0]);
    const grad = cols.length < 2
      ? (() => { const g = ambVctx.createLinearGradient(0, H, 0, 0); g.addColorStop(0, cols[0]); g.addColorStop(1, '#ffffff'); return g; })()
      : (() => { const g = ambVctx.createLinearGradient(0, 0, W, 0); cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c)); return g; })();
    ambVctx.fillStyle = grad;
    const n = 28, bw = W / n;
    for (let i = 0; i < n; i++) {
      const v = data[Math.floor(i * data.length / n)] / 255;
      const h = Math.max(2, v * H);
      ambVctx.fillRect(i * bw + 1, H - h, bw - 2, h);
    }
  } else {
    ambVctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
    ambVctx.fillRect(0, H / 2 - 1, W, 2);
  }
  vizRaf = requestAnimationFrame(drawViz);
}
function kickViz() { if (!vizRaf) vizRaf = requestAnimationFrame(drawViz); }

// ---------- Help modal ----------
const helpModal = document.getElementById('helpModal');
const helpBtn = document.getElementById('helpBtn');
function toggleHelp(force) {
  const open = force !== undefined ? force : !helpModal.classList.contains('open');
  helpModal.classList.toggle('open', open);
  helpModal.setAttribute('aria-hidden', String(!open));
  if (open) helpModal.querySelector('.shortcuts').scrollTop = 0;
}
helpBtn.addEventListener('click', () => { toggleAbout(false); toggleHelp(); });
document.getElementById('helpClose').addEventListener('click', () => toggleHelp(false));
helpModal.addEventListener('click', (e) => { if (e.target === helpModal) toggleHelp(false); });

// ---------- About (Aionic Clock) ----------
const aboutModal = document.getElementById('aboutModal');
const TAGLINE_FULL = 'As the Moment, So the Eternal';
let tagTimer = null;
function stopTagline() { if (tagTimer) clearTimeout(tagTimer); tagTimer = null; }
function playTagline() {
  const el = document.getElementById('taglineText');
  if (!el) return;
  stopTagline();
  let i = 0, del = false;
  const step = () => {
    el.textContent = TAGLINE_FULL.slice(0, i);
    if (!del) {
      i++;
      if (i > TAGLINE_FULL.length) { del = true; tagTimer = setTimeout(step, 2300); return; }
      tagTimer = setTimeout(step, 55);
    } else {
      i--;
      if (i <= 0) { del = false; tagTimer = setTimeout(step, 700); return; }
      tagTimer = setTimeout(step, 26);
    }
  };
  step();
}
function toggleAbout(force) {
  const open = force !== undefined ? force : !aboutModal.classList.contains('open');
  aboutModal.classList.toggle('open', open);
  aboutModal.setAttribute('aria-hidden', String(!open));
  if (open) {
    aboutModal.querySelector('.about-body').scrollTop = 0;
    playTagline();
  } else {
    stopTagline();
    aboutModal.querySelectorAll('details[open]').forEach(d => d.removeAttribute('open'));
  }
}
document.getElementById('infoBtn').addEventListener('click', () => { toggleHelp(false); toggleAbout(); });
document.getElementById('aboutX').addEventListener('click', () => toggleAbout(false));
document.querySelector('#aboutModal .about-body').addEventListener('click', (e) => {
  const h = e.target.closest('h3[data-collapsible]');
  if (h && h.parentElement) h.parentElement.classList.toggle('collapsed');
});
aboutModal.querySelectorAll('details').forEach(d => d.addEventListener('toggle', () => {
  if (!d.open) return;
  const sec = d.closest('section');
  if (sec) sec.querySelectorAll('details[open]').forEach(x => { if (x !== d) x.removeAttribute('open'); });
}));
aboutModal.addEventListener('click', (e) => { if (e.target === aboutModal) toggleAbout(false); });

// ---------- Keyboard shortcuts ----------
// T timer, S stopwatch, A alarm, C clock, F format, M analog, D dial, L/1 theme, 2 variant, 3 sky,
// X wall, Esc collapse/exit, Space start/pause, R reset, `/About, ~/Ambience, ?/H help
document.addEventListener('keydown', (e) => {
  const inField = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
  const key = e.key;

  // Mostly locked down in wall mode: exit keys plus display/panel keys work
  // silently — everything else is swallowed so just the cursor reveals controls.
  const wallAllowed = ['1', '2', '3', 'd', 'f', 'h', 'm', 'w', '`', '~', '/'];
  if (document.body.dataset.wall === 'on' && key !== 'Escape' && key.toLowerCase() !== 'x' && !wallAllowed.includes(key.toLowerCase())) return;
  if (key === 'Escape') {
    if (aboutModal.classList.contains('open')) toggleAbout(false);
    else if (helpModal.classList.contains('open')) toggleHelp(false);
    else if (document.body.dataset.wall === 'on') setWall(false);
    else if (document.body.dataset.dnd === 'on') setDnd(false);
    else if (document.body.dataset.zones === 'open') setZones(false);
    else setView('clock');
    return;
  }
  if (key === '?' || key === 'H' || key === 'h') { if (!inField) { toggleHelp(); e.preventDefault(); } return; }
  if (key === '`') { if (!inField) toggleAbout(); return; }
  if (inField) return;
  if (key === '~') { toggleAmbPanel(); return; }

  switch (key.toLowerCase()) {
    case 'w': setZones(); break;
    case 'p': setView('pomodoro'); break;
    case 't': setView('timer'); break;
    case 's': setView('stopwatch'); break;
    case 'a': setView('alarm'); break;
    case 'c': setView('clock'); break;
    case 'f': setFormat(!is12Hour); break;
    case 'm': setClockMode(document.body.dataset.clock === 'analog' ? 'digital' : 'analog'); break;
    case 'x': setWall(document.body.dataset.wall !== 'on'); break;
    case 'd': if (document.body.dataset.clock === 'analog') cycleDial(); break;
    case '/': if (document.body.dataset.clock === 'analog') setSweep(prefs.sweep === 'smooth' ? 'tick' : 'smooth'); break;
    case 'l':
      setTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
      break;
    case '1':
      setTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
      break;
    case '2':
      setVariant(document.body.dataset.variant === 'solid' ? 'glass' : 'solid');
      break;
    case '3':
      setSky(prefs.sky !== true);
      break;
    case 'r':
      if (document.body.dataset.view === 'timer') resetTimer();
      if (document.body.dataset.view === 'stopwatch') resetSW();
      if (document.body.dataset.view === 'pomodoro') resetPomo();
      break;
    case ' ':
      if (document.body.dataset.view === 'timer') { e.preventDefault(); startPauseTimer(); }
      else if (document.body.dataset.view === 'stopwatch') { e.preventDefault(); startPauseSW(); }
      else if (document.body.dataset.view === 'pomodoro') { e.preventDefault(); startPausePomo(); }
      break;
  }
});

// ---------- Init ----------
// Fixed startup state: 24H digital clock card, dark/solid theme, collapsed zones.
prefs.is12Hour = false; prefs.clockMode = 'digital'; prefs.theme = 'dark'; prefs.variant = 'solid';
is12Hour = false;
zprefs.open = false;
savePrefs();
document.body.dataset.theme = prefs.theme;
document.body.dataset.variant = prefs.variant === 'solid' ? 'solid' : 'glass';
document.body.dataset.sky = prefs.sky === true ? 'on' : 'off';
document.body.dataset.landscape = LANDSCAPES.includes(prefs.landscape) ? prefs.landscape : 'hills';
document.body.dataset.sweep = prefs.sweep;
if (prefs.sky === true) applySky();
if (zprefs.h12 === null || zprefs.h12 === undefined) zprefs.h12 = is12Hour;
document.body.dataset.zones = zprefs.open ? 'open' : 'closed';
syncZoneControls();
alarmSortSel.value = prefs.alarmSort || 'manual';
alarmCountBtn.classList.toggle('active', prefs.showAlarmCountdown === true);
syncDockWidth();
if (zprefs.open) renderZones();
setClockMode(prefs.clockMode);
setDial(prefs.dial);
setSweep(prefs.sweep);
setFormat(is12Hour);
applyThemeIcon();
// Boundary-aligned tick: each update is scheduled for the next whole second,
// so the digits flip exactly on the boundary — the same timing source the
// 1s colon blink is phase-locked to. Unlike setInterval(..., 1000), which
// fires late and drifts, this keeps digits and blinkers in step.
function clockLoop() {
  try { updateClock(); } catch (e) { /* the clock must never stop ticking */ }
  setTimeout(clockLoop, 1000 - (Date.now() % 1000));
}
// Pomodoro init: config inputs, face, tasks, nav overflow arrows
document.getElementById('cfgWork').value = prefs.pomo.workMin;
document.getElementById('cfgShort').value = prefs.pomo.shortMin;
document.getElementById('cfgLong').value = prefs.pomo.longMin;
document.getElementById('cfgCycle').value = prefs.pomo.cycle;
document.getElementById('cfgAutoBreaks').checked = prefs.pomo.autoBreaks === true;
document.getElementById('cfgAutoWork').checked = prefs.pomo.autoWork === true;
document.body.dataset.dnd = 'off';
ambVol.value = prefs.ambVol ?? 70;
syncAmbVol();
syncAmbUI();
setPhase('work');
pomoStatus.textContent = 'Press Start to begin a focus session.';
renderTasks();
(function buildPomoTicks() {
  const ring = document.getElementById('pomoTicks');
  for (let i = 0; i < 60; i++) {
    const t = document.createElement('div');
    t.className = 'tick' + (i % 5 === 0 ? ' major' : '');
    t.style.transform = `rotate(${i * 6}deg)`;
    t.innerHTML = '<i></i>';
    ring.appendChild(t);
  }
})();
const navScroll = document.getElementById('navScroll');
function updateNavArrows() {
  const over = navScroll.scrollWidth > navScroll.clientWidth + 2;
  document.getElementById('navPrev').classList.toggle('hidden', !over);
  document.getElementById('navNext').classList.toggle('hidden', !over);
}
document.getElementById('navPrev').addEventListener('click', () => navScroll.scrollBy({ left: -170, behavior: 'smooth' }));
document.getElementById('navNext').addEventListener('click', () => navScroll.scrollBy({ left: 170, behavior: 'smooth' }));
window.addEventListener('resize', updateNavArrows);
updateNavArrows();
updateClock();
resyncColons();
clockLoop();
setInterval(() => { if (prefs.sky === true) applySky(); }, 20000); // keep the sky gradient drifting
setView('clock');
requestAnimationFrame(analogLoop);
