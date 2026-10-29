# Changelog

Notable project changes are tracked here.

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
