# Task Trunk App

Task Trunk App is an open-source, local-first PWA for managing tickets,
vouchers, serial numbers, and redemption links. It is built for people who keep
digital coupons, event tickets, store vouchers, or barcode-based benefits across
screenshots, chat messages, and email.

The app keeps data in the browser with IndexedDB, supports image-based barcode
scanning, and provides import/export tools so users can control their own data.

Live demo: https://task-trunk-app.vercel.app

## Why This Exists

Many personal ticket and voucher workflows are scattered across screenshots,
notes, wallets, and messaging apps. Task Trunk App aims to provide a small,
transparent, open-source tool for:

- Saving ticket names, serial numbers, redemption URLs, tags, notes, and images.
- Tracking whether a ticket is unused, redeemed, or deleted.
- Scanning barcode or QR code images when the serial number is hidden in a
  screenshot.
- Reusing templates for repeated voucher types.
- Exporting and importing local data without depending on a hosted backend.

## Current Status

Task Trunk App is actively maintained by the primary maintainer,
[@neochiu1004](https://github.com/neochiu1004). The project is early-stage but
usable as a public PWA, with recent maintenance focused on mobile usability,
data safety, lint cleanup, and clearer project documentation.

The project welcomes bug reports, usability feedback, and focused pull requests.

## Features

- Ticket lifecycle views: unused, redeemed, and trash.
- Quick ticket creation with name, serial number, expiry date, redemption URL,
  tags, image, and notes.
- Barcode and QR recognition from uploaded images.
- Template management for repeated voucher formats.
- Tag filtering and keyword search across names, tags, serial numbers, and
  notes.
- Batch actions for selected tickets.
- JSON export/import for local backups and device migration.
- Data health checks before imports.
- Optional Telegram reminder settings for expiry workflows.
- PWA install support for mobile-first use.

## Tech Stack

- React 18
- TypeScript
- Vite 8
- Tailwind CSS
- shadcn/ui and Radix UI
- Framer Motion
- IndexedDB for local storage
- ZXing for barcode recognition
- React Query
- Supabase client foundation for future integrations

## Getting Started

### Requirements

- Node.js 20 or newer is recommended.
- npm is used by the checked-in lockfile.

### Install

```bash
npm install
```

### Environment

Copy `.env.example` to `.env` and fill in your Supabase project values if you
use Supabase-backed features. The current app remains local-first and stores
ticket data in the browser.

### Run Locally

```bash
npm run dev
```

The Vite dev server starts at `http://localhost:8080` by default.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Project Structure

```text
src/
├── components/
│   ├── layout/           # Header and bottom navigation
│   ├── modals/           # Add, settings, import/export, batch flows
│   ├── ticket/           # Ticket cards, barcode UI, redemption flows
│   └── ui/               # Shared shadcn/Radix components
├── hooks/                # App state and interaction hooks
├── lib/                  # IndexedDB, helpers, validation, constants
├── pages/                # Route pages
├── types/                # Ticket, template, and settings types
└── index.css             # Theme tokens and global styles
```

## Maintenance

The maintainer currently focuses on:

- Keeping ticket data import/export safe and predictable.
- Improving mobile ergonomics for repeated daily use.
- Making barcode scanning clearer when an image contains multiple codes.
- Adding small, testable improvements instead of large rewrites.
- Documenting project decisions so contributors can understand the codebase.

See [ROADMAP.md](ROADMAP.md) for planned work and
[CHANGELOG.md](CHANGELOG.md) for notable changes.

## Contributing

Contributions are welcome when they are focused and easy to review. Please read
[CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

Good first contributions include:

- Reproducible bug reports.
- Mobile layout fixes with before/after screenshots.
- Import/export validation improvements.
- Documentation clarifications.
- Small accessibility improvements.

## Security

Task Trunk App handles user-provided images and backup JSON files. Please report
security-sensitive issues privately using the guidance in
[SECURITY.md](SECURITY.md).

## License

Task Trunk App is released under the [MIT License](LICENSE).
