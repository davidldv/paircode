---
name: PairCode
description: A secure-document world for an access-control system — safety-paper stock, intaglio ink, and issued credentials that only ever print real facts.
colors:
  stock: "#e4e7df"
  stock-face: "#f5f7f2"
  stock-rack: "#dbdfd5"
  stock-sunk: "#d3d9cd"
  ink: "#0f1a15"
  ink-2: "#46504a"
  ink-3: "#525b56"
  rule: "#b3bbad"
  rule-strong: "#8b948660"
  secure: "#0c4b33"
  secure-deep: "#073323"
  secure-ink: "#f5f7f2"
  secure-tint: "rgba(12, 75, 51, 0.1)"
  secure-wash: "rgba(12, 75, 51, 0.04)"
  lamp: "#10774f"
  provisional: "#7d5205"
  provisional-ink: "#ffffff"
  provisional-tint: "rgba(125, 82, 5, 0.13)"
  cancel: "#a52a1a"
  cancel-tint: "rgba(165, 42, 26, 0.1)"
typography:
  display:
    fontFamily: "Archivo, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(2rem, 5vw, 2.875rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 80"
  designation:
    fontFamily: "'Courier Prime', 'Courier New', monospace"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.04em"
    fontFeature: "tabular-nums"
  title:
    fontFamily: "Archivo, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "Archivo, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  note:
    fontFamily: "Archivo, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "Archivo, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.11em"
    fontVariation: "'wdth' 78"
  mark:
    fontFamily: "Archivo, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.5625rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.16em"
    fontVariation: "'wdth' 78"
  value:
    fontFamily: "'Courier Prime', 'Courier New', monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.01em"
    fontFeature: "tabular-nums"
  mrz:
    fontFamily: "'Courier Prime', 'Courier New', monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.14em"
rounded:
  hairline: "2px"
  credential: "12px"
  dot: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1.25rem"
  xl: "2rem"
components:
  sheet:
    backgroundColor: "{colors.stock-face}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
  sheet-head:
    backgroundColor: "{colors.secure}"
    textColor: "{colors.secure-ink}"
    typography: "{typography.label}"
    padding: "0.4rem 0.75rem"
  credential:
    backgroundColor: "{colors.stock-face}"
    textColor: "{colors.ink}"
    rounded: "{rounded.credential}"
  band-owner:
    backgroundColor: "{colors.secure}"
    textColor: "{colors.secure-ink}"
    typography: "{typography.label}"
    padding: "0.25rem 0.6rem"
  band-plain:
    backgroundColor: "{colors.stock-rack}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    padding: "0.25rem 0.6rem"
  band-provisional:
    backgroundColor: "{colors.provisional}"
    textColor: "{colors.provisional-ink}"
    typography: "{typography.label}"
    padding: "0.25rem 0.6rem"
  mrz:
    backgroundColor: "{colors.stock-sunk}"
    textColor: "{colors.ink}"
    typography: "{typography.mrz}"
    padding: "0.5rem 0.65rem"
  button-primary:
    backgroundColor: "{colors.secure}"
    textColor: "{colors.secure-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.hairline}"
    padding: "0 0.875rem"
    height: "2.25rem"
  button-primary-hover:
    backgroundColor: "{colors.secure-deep}"
    textColor: "{colors.secure-ink}"
  button-secondary:
    backgroundColor: "{colors.stock-face}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.hairline}"
    padding: "0 0.875rem"
    height: "2.25rem"
  button-secondary-hover:
    backgroundColor: "{colors.stock-rack}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.hairline}"
    height: "2.25rem"
  button-ghost-hover:
    backgroundColor: "{colors.secure-tint}"
    textColor: "{colors.ink}"
  button-cancel:
    backgroundColor: "transparent"
    textColor: "{colors.cancel}"
    typography: "{typography.label}"
    rounded: "{rounded.hairline}"
    height: "2.25rem"
  button-cancel-hover:
    backgroundColor: "{colors.cancel-tint}"
  field:
    backgroundColor: "{colors.stock-sunk}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
    padding: "0.5rem 0.65rem"
    height: "2.25rem"
  field-focus:
    backgroundColor: "{colors.stock-face}"
    textColor: "{colors.ink}"
  badge-default:
    backgroundColor: "{colors.stock-rack}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.hairline}"
    padding: "0.15rem 0.375rem"
  badge-success:
    backgroundColor: "{colors.secure}"
    textColor: "{colors.secure-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.hairline}"
    padding: "0.15rem 0.375rem"
  badge-provisional:
    backgroundColor: "{colors.provisional-tint}"
    textColor: "{colors.provisional}"
    typography: "{typography.label}"
    rounded: "{rounded.hairline}"
    padding: "0.15rem 0.375rem"
  badge-danger:
    backgroundColor: "{colors.cancel-tint}"
    textColor: "{colors.cancel}"
    typography: "{typography.label}"
    rounded: "{rounded.hairline}"
    padding: "0.15rem 0.375rem"
  stamp:
    backgroundColor: "transparent"
    textColor: "{colors.cancel}"
    typography: "{typography.label}"
    rounded: "{rounded.hairline}"
    padding: "0.1rem 0.35rem"
  lamp:
    backgroundColor: "{colors.ink-3}"
    rounded: "{rounded.dot}"
    size: "0.5rem"
  lamp-live:
    backgroundColor: "{colors.lamp}"
    rounded: "{rounded.dot}"
    size: "0.5rem"
---

# Design System: PairCode

## Overview

**Creative North Star: "The Credential"**

PairCode is an access-control system, so its interface is a credential and a reader — not a dashboard about security. The world is borrowed from secured document printing: safety-paper stock in a green-grey that no word processor produces by accident, one committed intaglio green for anything the server has actually decided, ruled hairlines instead of gaps, and issued cards carrying a portrait panel, a role band and a machine-readable strip. A reviewer landing cold should be able to tell within seconds that identity, permission and liveness are facts being printed onto an artifact, not decorations arranged around one.

The governing commitment is that **every credential device on the surface encodes a real fact**. A role band is the real role the server returned. An expiry is the real invite expiry. The MRZ strip is the real signed invite token, chevron-padded into fixed 30-character courses but never case-normalised, because the strip has to remain the payload. The guilloché rosette is a deterministic hypotrochoid derived from the identity's own id — a visual hash, so the same operator carries the same figure in every room on every device, and two operators cannot collide by accident. A cancellation stamp appears only where access has actually been revoked. Ornament that means nothing is out of system and should be deleted rather than restyled.

The density is high and deliberately clerical: a fixed-height three-column desk at desktop, columns that scroll inside themselves, near-zero decorative whitespace. What the world refuses is the elevated-card grid every collaboration tool ships — floating rounded panels on a neutral page, separated by shadow and air. Here separation is done with a 1px rule and a tonal shift in the stock, and lift is reserved for the two things that are physically loose objects. The build ships one authored moment of motion: the reader sweep that crosses a panel while the room agent is actually streaming.

**Key Characteristics:**
- Safety-paper green-grey stock, never cream and never pure white
- One committed colour (intaglio green) plus two exception colours that appear only when their fact is true
- Archivo condensed caps for printed legends, Courier Prime for machine-typed values — two voices, never blended
- Hairline rules and banded stock in place of gaps and shadows
- Square 2px corners everywhere; the 12px ID-1 corner belongs to issued credentials alone
- Every device on the surface is decodable from a legend printed on the same page

## Colors

A single-hue system: one intaglio green does all committed work, sitting on four tonal steps of green-grey paper, with an ochre and a vermilion held in reserve for exactly two states.

The palette is defined twice in `app/globals.css` — an unlayered `:root` block for light and an `html[data-theme="dark"]` block for dark. The frontmatter above carries the light values, which are canonical; the dark rendition is recorded in `.impeccable/design.json`. Dark is not an inversion. It is the same door after hours, the credential lit by the reader's own lamp: greens brighten, the stock drops to near-black greens, and the exception colours warm rather than dim. It is authored, and it passes the contrast suite, but it has only been spot-checked visually.

### Primary
- **Intaglio Green** (`secure`): the only committed colour on the surface. It fills the masthead, every sheet head, the owner band, the primary button, and any badge saying the server said yes. It is a printing ink, not a highlight — always a solid field with `secure-ink` text on it, never a tint behind body copy.
- **Intaglio Deep** (`secure-deep`): the border and pressed state under intaglio green. It is what makes a green band read as printed onto the sheet rather than laid over it.
- **Plate Wash / Plate Tint** (`secure-wash`, `secure-tint`): the two dilutions. `secure-wash` at 4% is the safety-paper tint on `body::before` and the alternating course in the access register; `secure-tint` at 10% is the only hover fill a ghost control gets.

### Secondary
- **Visitor Ochre** (`provisional`): the guest-session band. It marks a session that is real but short-lived, and it is explicitly *not* a role — a visitor can own a room. It appears on the visitor chip, on the amber reading lamp, and nowhere else.
- **Visitor Ink** (`provisional-ink`): the text printed onto the ochre band, themed exactly the way `secure-ink` is — white in light, a near-black brown in dark — so the visitor mark stays legible in both renditions. Ochre never carries text in a raw literal colour.
- **Cancellation Vermilion** (`cancel`): the stamp pad. It appears only where access was actually revoked or a request was actually refused — the revoke control, the struck stamp, the refusal mark on an audit record, the agent's error strip.

### Neutral
- **Safety Stock** (`stock`): the page ground. Every surface is read against this, never against white.
- **Sheet Face** (`stock-face`): the printed sheet — lighter than the page, which is what makes a sheet read as laid on top of it.
- **Banded Course** (`stock-rack`): darker than the page. Column heads, course heads, the keys strip, the entry line — any band that organises the sheet rather than carrying content.
- **Sunk Well** (`stock-sunk`): the darkest step. Input fields, the MRZ strip, the panel behind a guilloché, small recessed data wells.
- **Committed Ink** (`ink`): all primary text. **Legend Ink** (`ink-2`): legends, secondary copy, plain-band text. **Dimmed Ink** (`ink-3`): placeholders, timestamps, serials, running `.note` prose.
- **Rule** (`rule`): the 1px hairline that does nearly all separation in this system; it is also the default `border-color` on `*` in the base layer, so an unstyled border is already correct. **Rule Strong** (`rule-strong`, a 6-digit hex with an appended alpha byte) is the heavier hairline — dashed empty states, scrollbar thumbs, grid seams, and the underline of a form field.

### Named Rules

**The One Green Rule.** Intaglio green is the system's only committed colour. Ochre and vermilion are not accents available for emphasis — each is bound to one condition (a live guest session; an actual revocation or refusal). If a new panel wants a third colour to make something stand out, the answer is a rule, a band, or a legend, not a new hue.

**The Never-By-Eye Rule.** `lib/theme-contrast.test.ts` parses the token values straight out of `app/globals.css` and asserts 4.5:1 in **both** themes for every foreground/background pair that ships text — there is no shipped text pair the suite does not cover — plus 3:1 for the lamp against the sheet. Retuning a colour because it looked better on your monitor will fail the suite before it ships. Change a token, run `bun test`, and if a pair fails, move the token — do not relax the pair. A new coloured surface that carries text arrives with its own themed ink token and its own asserted pair; that is what keeps this rule true.

**The Fact-Bound Ink Rule.** A colour on this surface is a claim. Green means the server committed; ochre means provisional and short-lived; vermilion means refused or revoked. Never reach for one because a control needed to look important.

## Typography

**Display Font:** Archivo (variable, with the `wdth` axis requested in `app/layout.tsx`), fallback Helvetica Neue / Arial
**Body Font:** Archivo, same family at normal width
**Label/Mono Font:** Courier Prime (400/700, roman and italic), fallback Courier New

**Character:** Two voices that never blend. Archivo compressed to `font-stretch: 78%`, uppercase, tracked 0.11em, is the text *printed on the blank before anything is issued* — headings, field labels, role names, button faces. Courier Prime with tabular figures is *what the machine typed into the blank* — ids, tokens, room codes, timestamps, counts, file paths. A reader can tell at a glance which parts of the page are the form and which are the record.

The direction contract called for Archivo Narrow. The build ships the Archivo variable family with the `wdth` axis and compresses it in CSS instead; the printed effect is the same and the font payload is one family, but a future editor should know the narrowing is a variation-axis value, not a separate family. `font-synthesis-weight: none` is set on `body`, so nothing is faked.

### Hierarchy
- **Display** (700, `2rem` rising to `2.875rem` at `sm`, line-height 1.02, `wdth 80`, uppercase): one size, one place — the door headline on the auth screen. This world has exactly one display setting; a new surface that needs a hero uses this rather than inventing a size.
- **Designation** (Courier Prime, `1.0625rem`, 0.04em tracking, tabular figures, uppercase): the room screen's one step of display scale, and the only place the value voice is set large. It carries the document's own identity — the active room code in the header register — set above everything around it so the desk has a register of scale. It is deliberately the *value* voice rather than the Archivo display size: the room code is a machine fact, and enlarging it must not turn it into a headline.
- **Title** (600, `0.9375rem`, tight leading): the name on a credential, the operator in the bearer strip. Sentence case at normal width — a person's name is never set in tracked caps.
- **Body** (400, `0.875rem`, line-height 1.65): message text in the access register, rendered from `<pre class="font-sans whitespace-pre-wrap">` so authored line breaks survive without losing the sans voice. Prose columns are held to roughly `62ch` on the auth surface.
- **Note** (400, `0.75rem`, line-height 1.55, `ink-3`): the running voice for asides, hints and status prose beside a legend.
- **Label / Legend** (600, `0.625rem`, 0.11em tracking, `wdth 78`, uppercase): every printed legend, column head, role band, badge and button face. `.legend-lg` steps it to `0.75rem` / 0.1em for sheet titles. Its colour is set through `:where(.legend)` at zero specificity, so a Tailwind text-colour utility overrides it without a fight.
- **Mark** (700, `0.5625rem`, `wdth 78`, uppercase; 0.16em tracking on a stamp, tightened to 0.04em for a two-letter initial): the smallest step, and it is a *marking* step rather than a reading step. It is legal in exactly two places — a word stamped onto an object (the `Owner only` corner stamp on an overprinted field) and initials struck inside a credential mark (the `IdentityChip` at 24px). It is never legal on reading matter.
- **Value** (Courier Prime, tabular figures, 0.01em): every machine-produced string. Counts are zero-padded (`004 entries`, `02`) because a register pads its columns.
- **MRZ** (Courier Prime, `0.6875rem`, 0.14em tracking, `word-break: break-all`): the machine-readable strip only.

### Named Rules

**The Two-Voice Rule.** If a human or a designer wrote it, it is Archivo. If a machine produced it — an id, a token, a code, a timestamp, a path, a count — it is Courier Prime via `.value`. There is no third voice, and no mixing inside one string.

**The Sentence Is Never Tracked Rule.** Tracked caps are for fixed printed legends of one to three words. A full sentence goes in `.note` or body, in sentence case. A legend that has grown into a sentence is a `.note` that was mislabelled.

**The Mark Step Rule.** `0.5625rem` is a mark, not a size. It is available only for a word stamped onto an object or an initial set inside a credential mark, where the reader decodes a symbol rather than reads a line. Anything a person actually reads — a label, a caption, a divider, a hint — starts at the `0.625rem` legend and goes up. If you are reaching for the mark step to fit more text into a space, the answer is less text or a bigger space.

**The Payload Is Not Copy Rule.** Strings that are real payloads — the invite token in the MRZ, a socket id, a user id — are never case-normalised, prettified, or truncated for looks. Pad and wrap them; do not edit them.

## Layout

**The room** is a fixed-height desk at desktop and a stacked document below it. `<main>` becomes `h-[100dvh]`, `flex-col`, `overflow-hidden` at `lg`; the header is `sticky top-0 z-30`; the body is a three-column grid `19rem | minmax(0,1fr) | 22rem` capped at `max-w-[1560px]`, with each column scrolling inside itself so the masthead and the register's column heads never leave the viewport. Below `lg` the grid collapses to one column and the page scrolls normally. All three columns are ordered explicitly so the task leads: the register first (`order-1`), the rack second (`order-2`), the issuing desk last (`order-3`). Leaving any one of them unordered drops it to `order-0` and floats it above the register, which is the whole point of ordering them. At `lg` all three wrappers become `lg:contents`, so the real grid children are the panels themselves.

**Gutters and rhythm** run on a 0.25rem step. The page gutter is `0.75rem` rising to `1.25rem` at `md`, the column gap is `0.75rem`, and inside a sheet the standard block is `px-3 py-2.5` with band heads at `py-1`. Spacing is tight on purpose; air is not how this system separates things.

**The header** is three stacked full-bleed strips, each divided by a rule: the intaglio masthead (mark, wordmark, tagline, connection lamp, theme toggle, sign-out), the bearer strip on `stock-face` (operator credential chip, room designation field, Join/Leave, and a bordered `<dl>` register of Room / Present / Entries / Agent divided by `divide-x`), and a dismissible keys strip on `stock-rack`.

**The auth surface** is a two-column `max-w-6xl` grid, `minmax(0,1fr) | 25rem` at `lg`, gap `2rem` rising to `3rem`: the door's conformance table on the left, the blank credential filling in as you type on the right.

**Responsive coverage.** The room was captured at 1366px in both themes. The mobile treatment — single column, masthead action trigger, bottom-sheet palette — was verified by temporarily raising `--breakpoint-lg` so the stacked layout rendered at the only viewport this environment can capture: column order, horizontal overflow, and the composer's clearance were all checked that way and the override reverted. What that technique cannot prove is anything that depends on real viewport width — tap-target size, text wrapping at 390px, the sheet's height against a soft keyboard, safe-area insets. Confirm those on a device.

### Named Rules

**The Ruled Course Rule.** Regions are separated by a 1px `rule` and a tonal shift in the stock, not by a gap plus a shadow. A new panel joins the desk by adopting `.sheet` and a `.sheet-head`; it does not float beside the others.

**The Internal Scroll Rule.** At `lg` the shell owns the viewport height and every column scrolls in place. A new panel must survive `min-h-0` inside a flex column — give it `flex min-h-0 flex-col` and put the scroll on its own content, never on the page.

## Elevation & Depth

This system is flat by intent. Depth comes from four tonal steps of stock and from hairline rules, not from shadows: the page is `stock`, a printed sheet sits *lighter* on it at `stock-face`, an organising band goes *darker* at `stock-rack`, and a well or field goes darker still at `stock-sunk`. That non-monotonic ladder is the point — paper laid on paper reads lighter, a groove reads darker.

Shadow appears on exactly two kinds of thing, both genuinely loose objects rather than printed regions: an issued credential, and a slip or panel actually floating over the desk. Both shadows are two-part — a 1px hard contact line plus a wide soft drop — so the object reads as resting on the sheet rather than hovering in a void. In dark theme both are re-authored in near-black rather than reused.

### Shadow Vocabulary
- **Lift** (`box-shadow: 0 1px 0 rgba(15,26,21,0.06), 0 8px 18px -12px rgba(15,26,21,0.45)`): the resting shadow of `.credential`. Nothing else in the room carries it.
- **Lift High** (`box-shadow: 0 2px 0 rgba(15,26,21,0.07), 0 22px 44px -22px rgba(15,26,21,0.55)`): toast slips and the mobile palette sheet — objects that really are above the desk.

### Named Rules

**The Only Credentials Lift Rule.** If a surface is not an issued credential or a genuinely floating overlay, it gets a border and a tonal step, never a shadow. A new sheet carrying a `box-shadow` has left the world.

**The Contact Line Rule.** Every shadow in this system opens with a 1px zero-blur line before its soft drop. A single soft blur alone reads as a web card, not as paper on paper.

## Shapes

The form language is square. `2px` is the house radius and it appears on nearly everything — sheets, buttons, badges, fields, stamps, kbd keys, identity panels, the theme toggle. It is not a rounded corner; it is a printed corner that has been trimmed.

`12px` is reserved absolutely. It is the ISO/IEC 7810 ID-1 corner (3.18mm on an 85.6mm card) scaled to the on-screen credential, and it appears on `.credential` alone: a member card in the rack, the room pass at the issuing desk, the credential application on the auth screen, the session-loading card. A `12px` corner on this surface is a promise that the thing inside it is an issued document.

One derived value belongs to this scale and is not a stray: a role band across the foot of a credential is radiused `calc(var(--card-radius) - 1px)`, the ID-1 corner inset by the card's own 1px border, so the band sits flush inside the border rather than poking through its curve. It reads as an arbitrary `11px` if you evaluate the `calc` and is correct as written — do not replace it with a literal.

The one circle in the system is the reader lamp — a `0.5rem` dot with a soft ring — and it never carries state by colour alone; every lamp is accompanied by a word or a label.

Borders are 1px `rule` hairlines by default (set on `*` in the base layer). Heavier separations use `rule-strong`. Two recurring devices are worth naming: **grid seams**, where a segmented control or an action grid uses `gap-px` over a `rule-strong` background so the seams are drawn by the parent rather than by per-child borders; and the **dashed blank**, a 1px dashed `rule-strong` border on `stock-sunk` used for every empty course.

### Named Rules

**The ID-1 Corner Rule.** `12px` belongs to issued credentials. Everything else on the surface is `2px`. If you find yourself wanting a rounded panel, you are building a card in a world that has no cards — build a `.sheet`.

## Components

The vocabulary lives in `app/globals.css` under an explicit cascade-layer structure that is load-bearing: **tokens are unlayered on `:root`**, **element defaults sit in `@layer base`**, and **the printed vocabulary (`.legend`, `.sheet`, `.credential`, `.band`, `.mrz`, `.field`, `.stamp`, `.overprint`, `.lamp`, `.log-row`) sits in `@layer components`** so Tailwind utilities, which come later in the layer order, always win over it. A future editor must not move these classes out of `@layer components` or wrap the tokens in a layer; either change silently breaks every per-instance override in `components/`.

### Buttons
- **Shape:** trimmed square (`2px`), 1px border on every variant including ghost (transparent), so all four variants share one silhouette.
- **Typography:** the legend voice — 600, uppercase, 0.11em tracking, `wdth 78`. A button face is a printed legend, not a sentence.
- **Sizes:** `sm` 1.75rem / `default` 2.25rem / `lg` 2.75rem / `icon` 2rem square.
- **Primary:** intaglio green on a `secure-deep` border with `secure-ink` text; hover darkens to `secure-deep`.
- **Secondary:** sheet face on a `rule-strong` border; hover shifts to `stock-rack`.
- **Ghost:** transparent with `ink-2` text; hover fills `secure-tint`.
- **Cancel:** vermilion border and text on transparent; hover fills `cancel-tint`. Reserved for revocation.
- **Press:** the primary button uses `.stamp-press`, a 190ms press-overshoot-settle keyframe, so it lands like a stamp. Every other variant translates down 1px on `:active`. Nothing scales up on hover.

### Chips and Badges
- **Style:** legend type in a `2px` box with a 1px border. Four variants: default (banded stock), success (solid intaglio), provisional (ochre on ochre tint), danger (vermilion on vermilion tint).
- **State never rides on hue.** Every variant carries a word — `Visitor`, `Away`, `Revoked`, `Machine issued`. Two chips are built inline in the rack rather than through the badge component: the ochre `Visitor` chip and the dashed-border `Away` chip. The ochre chips draw their text from `provisional-ink`, the same way anything on an intaglio field draws from `secure-ink`.

### Cards / Containers
There are two container types, and confusing them is the fastest way to break this world.
- **Sheet** (`Card` in `components/ui/card.tsx` renders `<section class="sheet">`): a page of the room's paperwork. Square `2px`, 1px `rule` border, `stock-face` ground, flat. Its header (`.sheet-head`) is a solid intaglio band carrying a `legend-lg` title and, optionally, a right-aligned legend at 75% opacity. Internal padding `0.75rem`. Every panel on the desk is a sheet.
- **Credential** (`.credential`): an issued document. `12px` ID-1 corner, resting lift, `overflow-hidden`, typically composed of a portrait panel, a data block, an optional MRZ strip, and a role band whose bottom corners are computed as `calc(var(--card-radius) - 1px)` so the band sits inside the border radius exactly.

### Inputs / Fields
- **Style** (`.field`, shared by `Input` and `Textarea`): recessed — `stock-sunk` ground, 1px `rule` border with a 2px `rule-strong` bottom edge. It reads as a ruled blank on a form, filled from the left.
- **Focus:** the ground lifts to `stock-face` and the bottom edge turns intaglio green, reinforced by an inset `0 -2px 0` shadow. The underline moving is the focus signal; fields get no glow and no ring. Elsewhere, `:focus-visible` is a 2px `secure` outline at 2px offset.
- **Disabled:** `ink-3` text and `not-allowed`. Owner-only fields are additionally wrapped in `.overprint`.
- **Overprint** is the system's answer to permission: a locked field is shown in its real state under a 45° hatch, with a small bordered word in the bottom-right corner (`data-overprint="Owner only"`), positioned there so the label never lands across the copy it protects. Owner-only capabilities are never hidden.

### Navigation
There is no nav bar. The masthead is the only persistent chrome: full-bleed intaglio, mark at 26px, wordmark at `0.9375rem` / 700 / 0.2em tracking / `wdth 78`, a hairline `secure-ink/25` divider, the connection lamp with its status word and a 6-character socket id, then the theme toggle and the auth control. On small screens an Actions control sits in the masthead itself, beside the theme toggle, and opens a bottom sheet of four gridded actions plus the keys table; that sheet is `border-t-2 border-secure` and animates in with `.print-in`. The trigger belongs in the masthead rather than floating over the page: a fixed button on a scrolling document eventually lands on something, and here it landed on the entry field — the one control a phone user needs most.

### The Access Register
The centre panel is a ruled register, not a chat log. Every row is a `.log-row`: a fixed `4rem` Courier timestamp column, then an identity chip, a name, and the message body. Even rows are washed with `secure-wash`, giving the alternating course of a printed ledger. System and audit events print as their own compressed row on `stock-rack` with the actor in legend caps — a join, a denial or a link rotation is a record in the register, not a toast that scrolls away. An audit record whose metadata says `member-removed` carries a `Revoked` stamp inline. The empty state is four ruled blank courses, drawn rather than illustrated.

### The Guilloché Portrait
`components/paircode/guilloche.tsx` draws a hypotrochoid whose lobe count (5–13), pen amplitude and phase are derived from an FNV-1a hash of the identity's own id, memoised in a module-level cache keyed by `seed:detail`. It renders in a `-50 -50 100 100` viewBox with `vectorEffect="non-scaling-stroke"`, a `currentColor` stroke, and `aria-hidden`. `detail={4}` (four nested traces, 260 steps, 0.5 stroke) is the credential portrait; `detail={1}` (130 steps, 0.8 stroke) is the register-scale chip. `IdentityPanel` is `3.5rem × 3rem` on `stock-sunk`; `IdentityChip` is `1.5rem` square. Both strike the operator's initials over the figure. The `machine` variant flips the panel to solid intaglio and is used only for the room agent (`ROOM_AGENT_ID`), so a machine-issued identity stays visually distinct from a person's at every scale. The same rosette geometry is engraved into `public/brand/paircode-mark.svg` and `app/icon.svg`, framed by two chevrons.

This is the signature device of the system, and its rule is absolute: the seed is a real, stable identity — a user id, or an email on the auth surface where no id exists yet. Never seed it with a random value, a list index, a display name, or a timestamp. A guilloché that is not a hash of a real identity is ornament, and ornament is out of system.

### Motion
Every authored animation is under 300ms except the two that indicate ongoing work, and all of them collapse to 1ms under `prefers-reduced-motion` (the reader sweep is removed entirely).
- **`print-in`** (260ms, a `clip-path` sweeping left to right): a slip or pass that was just printed — toasts, the issued room pass, the mobile sheet. Things print; they do not fade in.
- **`rail-in`** (240ms, 10px from the left): credentials arriving on the rack rail, staggered 35ms per item and capped at the 6th so a long list never crawls.
- **`stamp-down`** (220ms, scale 1.5 → 0.94 → 1 at a fixed −9° rotation): the cancellation stamp landing on a revoked credential.
- **`stamp-press`** (190ms): the primary button under `:active`.
- **`lamp-read`** (900ms, `steps(1, end)`): the amber reading lamp — a hard blink, not a pulse, because a reader LED does not breathe.
- **`reader-sweep`** (900ms, infinite, a lamp-tinted gradient crossing the element): the one authored moment. It runs only while something is genuinely being read — the agent streaming, or the session credential being verified on load.

## Do's and Don'ts

### Do:
- **Do** make every credential device encode a real fact. A band is a real role; an expiry is the real expiry; an MRZ strip is a real signed token; a guilloché is a hash of a real id; a stamp means access was actually revoked. If you cannot bind a device to a fact, delete it.
- **Do** build a new panel as a `.sheet` with a `.sheet-head` — square `2px`, 1px `rule` border, `stock-face` ground, flat, intaglio head carrying a `legend-lg` title.
- **Do** keep the vocabulary in `@layer components` and the tokens unlayered, so Tailwind utilities keep overriding the vocabulary. Do not restructure the layers in `app/globals.css`.
- **Do** run `bun test` after touching any colour. `lib/theme-contrast.test.ts` reads the tokens straight out of the stylesheet and asserts 4.5:1 in both themes.
- **Do** print a legend for any new mark you introduce. The rack's "Key to the marks" is held level with the rack it explains; a device the reader cannot decode from the same page does not ship.
- **Do** carry state in a word as well as in a colour or a shape — `Visitor`, `Away`, `Revoked`, `Machine issued`, `connected`.
- **Do** show owner-only controls in their real disabled state under `.overprint` with a reason, rather than hiding them.
- **Do** set machine-produced strings in `.value` (Courier Prime, tabular figures), and zero-pad counts.
- **Do** author both themes when you add a token. Dark is a real rendition of the same door, not a filter.

### Don't:
- **Don't** put a `12px` radius on anything that is not an issued credential, and don't introduce a third radius. `2px` everywhere, `12px` for `.credential`, `9999px` for the lamp dot.
- **Don't** add a `box-shadow` to a sheet, a row, a field, or a badge. Only credentials and genuinely floating overlays lift, and both shadows open with a 1px contact line.
- **Don't** introduce a fourth colour. If something needs emphasis, use a rule, a band, a legend, or a tonal step in the stock. Ochre and vermilion are bound to guest sessions and to revocation or refusal respectively.
- **Don't** set a sentence in tracked caps, or a person's name in the legend voice. `.legend` is for one-to-three-word printed labels.
- **Don't** case-normalise, prettify, or truncate a real payload for the sake of the layout. Pad and wrap it.
- **Don't** seed a guilloché with anything but a stable real identity. No random seeds, no list indices, no display names.
- **Don't** separate panels with air and elevation. This world separates with a hairline and a tonal shift.
- **Don't** print text onto a coloured field with a literal colour. A coloured field gets a themed ink token — `secure-ink`, `provisional-ink` — and an asserted contrast pair alongside it.
- **Don't** claim the mobile layout works. It is authored but has never been captured; verify it before you rely on it.
