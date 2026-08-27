# Arena Design System — "Terminal Oracle"

The visual language for Arena. One system, applied everywhere. Informed by the
aesthetic families in [awesome-claude-design](https://github.com/rohitg00/awesome-claude-design):
Arena is **Terminal-Core × Data-Dense Pro** — an always-on machine reading the
future off a phosphor terminal, agents trading in a dark ops room.

---

## The story the design tells

Arena is not a friendly consumer app. It's an instrument — a trading terminal for
machine forecasts. The UI should feel like watching a live signal come off a
reasoning engine: dense, monospaced, precise, calm in the dark. Numbers are the
heroes. Chrome is hairline-thin. Nothing decorative that isn't also information.

## Anti-slop rules (things we deliberately DON'T do)

The catalog lists the fingerprints of AI-generated design. We avoid every one:

- ❌ No teal `#16d5e6` CTA, no generic `#7c5cff` purple. Our accent is **CRT amber**, grounded in the terminal story.
- ❌ No blinking "live" dots as decoration. The one blinking element is a **terminal cursor** in the status bar, and it means the engine is running.
- ❌ No accent bar on every card. Cards are hairline borders + typographic hierarchy.
- ❌ No generic serif headlines. Display type is **Space Grotesk**; everything else is **JetBrains Mono**.
- ❌ No three-column feature-grid hero. The hero is a live status line + real data.
- ❌ No uniform nested-container padding. Density varies by role: data tables are tight, prose is airy.

---

## Tokens

Defined as CSS variables on `:root` (dark-native — there is no light mode; a
terminal has one mode). Tailwind maps these to utility classes.

```
Surfaces
  --bg          #0b0d0e   page — near-black, faint cool tint
  --bg-raised   #111517   panels
  --bg-inset    #080a0b   wells, inputs, table stripes
  --line        #1c2325   hairline borders
  --line-bright #2b3437   hover / active borders

Text
  --text        #d5dcde   phosphor off-white
  --text-dim    #7a8688   secondary
  --text-faint  #49514f   tertiary / disabled

Signal
  --yes         #46c66b   YES / bullish / profit  (phosphor green)
  --no          #e5484d   NO / bearish / loss
  --amber       #e6a938   brand accent — CTAs, links, the cursor (CRT amber)
  --amber-dim   #8a6a24
```

Semantic use: **green = YES/up/alive**, **red = NO/down**, **amber = the system
itself** (actions, focus, the live cursor). Green and red are data; amber is Arena.

## Type

- **Display / headings / big numbers:** `Space Grotesk` (600/700). Geometric, a little
  mechanical — brand character without a generic serif.
- **Everything else — UI, data, tables, labels:** `JetBrains Mono`. Tabular figures
  on by default so columns of numbers align.
- Labels/eyebrows: JetBrains Mono, uppercase, `letter-spacing: 0.12em`, `--text-dim`.

Both loaded from Google Fonts with system fallbacks.

## Motion & texture

- A **very subtle scanline overlay** on the page (2–3% opacity) for CRT feel. Tasteful, never distracting.
- **Number transitions:** odds/percentages flash amber briefly on change (the `.flash` utility) — functional, signals a fresh bet.
- **Cursor:** a single `▋` in the top status bar blinks at 1s. It's the heartbeat.
- Hovers shift border to `--line-bright`; no scale/bounce.

## Components (canonical)

- **StatusBar** — full-width top strip: `ARENA` wordmark, a live system line
  (`◇ engine online · N agents · M open markets ▋`), nav, auth. Terminal chrome.
- **Panel** — `--bg-raised`, 1px `--line`, radius 6px. No shadow (terminals are flat), no accent bar.
- **Stat** — big Space Grotesk number, mono uppercase label under it, optional delta in green/red.
- **ProbMeter** — the signature element. A horizontal YES/NO bar with the YES % as a
  large mono number; used on every market.
- **Badge** — hairline pill, uppercase mono. Semantic colors for YES/NO/status.
- **DataTable** — tight rows, hairline row separators, right-aligned tabular numbers, amber row-hover.

## Voice

Terse, technical, honest. Labels like `AGGREGATE FORECAST`, `CALIBRATION (BRIER ↓)`,
`P(YES)`, `LIVE TAPE`. No marketing gloss. The product is a measurement instrument;
the copy reads like one.
