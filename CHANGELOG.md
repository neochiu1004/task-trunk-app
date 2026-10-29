# Changelog

Notable project changes are tracked here.

## 1.6.0 - 2026-10-29

- Slimmed down the tickets page (features and data unchanged):
  the fixed top bar drops from six stacked rows to four — the title
  row now carries the view name inline and a primary "+ 新增"
  button, grid/selection controls moved into the "more" menu, the
  gradient summary hero and the scope line became a single small
  summary line (count + status, with the active filter and a clear
  action only while filtering), and the full-width tag dropdown
  became one horizontally scrollable row of filter chips next to a
  slimmer sort select. The version pill left the bar (the version
  still shows in Settings and the sidebar). The bar stays
  `position: fixed` and the spacer is still re-measured on render
  and resize, so the shorter bar simply gives the list more room.
- Ticket cards show only decision-relevant info: name, one expiry
  pill (date and countdown together — the expiry used to render
  twice per card), status and the redeem entry (card tap). The
  serial line and the full note preview no longer render on cards
  (both stay in the data, the edit form and the redeem view), and
  tag chips are capped at two with a "+N" indicator.
- Cleanup: removed the now-unused `ticket-expiry-chip` CSS and the
  version constants in the tickets page. React app mirrors the
  same slimming (summary hero + static chips became one line,
  duplicated expiring label folded into the expiry pill, compact
  cards drop the tag subtitle, card tags capped at two).

## 1.5.0 - 2026-10-29

- Templates now store the original ticket image (originalImage):
  saving a template from the add/edit form captures it, and applying
  a template (manually, as default, or via the 85度C title rule)
  restores it, so the redeem view shows the original ticket image
  (format 1) instead of the generated barcode card.
- Startup backfill for previously entered tickets: 85度C tickets
  missing an original image adopt the default template's one; when
  the template has none, it first adopts one from an existing
  JSON-imported 85度C ticket. Thumbnails are filled the same way
  when empty. Pure helper `backfillTitleTemplateImages` in utils
  with unit tests (13 passing).

## 1.4.0 - 2026-10-29

- Title rule: when a ticket's name contains "85度C", the default
  template is auto-applied while typing (legacy JS app and React app).
  The typed name and serial are preserved; the template fills expiry,
  tags, barcode format, thumbnail and redeem URL. It fires once per
  match and re-arms when the title no longer contains the keyword.
  If no default template is set, a template whose label/product name
  contains "85度C" is used instead. Shared matcher
  `findTitleAutoTemplate` in utils with unit tests (10 passing).

## 1.3.0 - 2026-10-29

- Blue/white masculine re-theme (visual only): deep steel-navy canvas
  (#0c2b52 -> #061831) with an ice-blue glow, pure-white cards with
  sharper corners (cards 14px, top bar 16px, chips 10px), royal-blue
  primary (#0b5ed7, gradient #38a1f2 -> #0b5ed7), ice-blue selected
  states (#dbeafe), deep-ocean summary hero (#06264d -> #0b5ed7),
  deep-navy desktop sidebar, PWA theme color #0a2a52. Replaces the
  sunny theme from 1.2.0; fixed dashboard and gear hardening stay.

## 1.2.0 - 2026-10-29

- Sunny youth re-theme (visual only): warm cream canvas
  (#fff6e0 -> #ffefd0) with a sun glow, sunshine-orange primary
  (gradient #ffb020 -> #ff7a45), peach selected states, grass-green
  success, sky-blue accents, sunshine-gradient desktop sidebar and
  PWA theme color #ff9a3d. Replaces the short-lived OmniPass navy
  theme from 1.1.x; the fixed dashboard from 1.1.1 stays.
- Hardened the top-right gear settings link: it now also navigates via
  an explicit click handler, after a report that the gear felt
  unresponsive on a phone (desktop re-test passed; the handler makes
  the tap work even if the anchor's default behaviour is swallowed).

## 1.1.1 - 2026-10-29

- The tickets dashboard (top bar with title, search, summary and tag
  filter) is now `position: fixed`: it never scrolls with the ticket
  list below. A spacer matched to the bar height (re-measured on every
  render and on resize/orientation changes) keeps the list clear of it.

## 1.1.0 - 2026-10-29

- OmniPass-style redesign (visual only, all features unchanged): deep-navy
  canvas (#0b1020 -> #10172b gradient with a soft indigo glow), light
  floating cards (20px radius, layered shadow), indigo primary
  (#536dfe -> #3656db gradient buttons, #e8edff selected chips/tabs),
  OmniPass wallet-style summary hero (#111827 -> #1d4ed8), full-width
  light bottom navigation on mobile and a deep-navy sidebar on desktop.
- Palette remapped in one place per stack: Tailwind `wabi-*` tokens and
  CSS variables in the legacy JS app, HSL theme tokens in the React app;
  default ticket-card border now #dfe3ec. PWA theme/background color
  updated to #0b1020.

## 1.0.5 - 2026-10-29

- Shrunk the top summary card on the ticket lists: single-row compact
  layout, smaller count type, slimmer padding, and the version/update
  info collapsed into one pill (legacy JS app and React app).
- Lazy-load `bwip-js` and `qrious`: they are only needed when drawing a
  barcode/QR in redeem mode, so they are now separate on-demand chunks.
  The tickets page chunk drops from ~922 kB to ~72 kB (gzip ~257 kB to
  ~18 kB).
- TypeScript is clean: `tsc --noEmit` went from 15 errors to 0, and
  `strictNullChecks` is now enabled (the root cause of one error was
  truthiness narrowing being unavailable without it).
- Removed the stale Bun lockfiles (`bun.lock`, `bun.lockb`); npm with
  `package-lock.json` is the single supported package manager, matching
  the README.

## 1.0.4 - 2026-10-29

- Pinned （置頂） now applies only to unused tickets: the pin toggle, pin
  badges, batch pin actions, and pinned-first sorting are limited to the
  unused view; redeeming, completing, or trashing a ticket clears its pin,
  and legacy pins on used/trashed tickets are cleaned during data
  normalization (both the legacy JS app and the React app).
- Fixed `package-lock.json` being out of sync with `package.json`
  (`npm ci` failed on missing `@emnapi/core` / `@emnapi/runtime`).
- The displayed app update time is now generated at build time
  (Asia/Taipei) instead of a hardcoded date.
- The unused-view sort now precomputes expiry urgency once per ticket
  instead of re-parsing dates on every comparison.
- Added lightweight `node --test` coverage for the ticket normalization
  pin rule (`npm test`).

## 1.0.3 - 2026-06-01

- Added open-source project documentation for contributors and reviewers.
- Added license, security policy, roadmap, issue templates, and pull request
  template.
- Expanded README with project purpose, live demo, maintenance scope, and
  contribution guidance.

## 1.0.2 - 2026-05-29

- Improved card opacity and shared list controls.
- Refined mobile ticket app UI.
- Cleared lint debt after UI and data-safety improvements.

## 1.0.1 - 2026-05-28

- Improved UI and data safety flows through PR-based maintenance.

## 1.0.0 - 2026-05

- Initial public PWA release for ticket and voucher management.
