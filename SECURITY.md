# Security Policy

Task Trunk App is a local-first PWA that handles user-provided ticket data,
uploaded images, redemption links, and JSON backup files.

## Supported Versions

Security fixes target the latest version on the `main` branch.

## Reporting a Vulnerability

Please do not open a public issue for security-sensitive reports.

Instead, contact the maintainer through GitHub:

- GitHub: https://github.com/neochiu1004

When reporting, include:

- A clear description of the issue.
- Steps to reproduce.
- Browser and operating system details.
- Example input files only if they do not contain private data.
- The impact you believe the issue may have.

## Security-Sensitive Areas

Reports are especially helpful around:

- Backup JSON import/export validation.
- Uploaded ticket images and barcode parsing.
- Redemption URL handling.
- Local storage data integrity.
- PWA cache behavior.

## Maintainer Response

The maintainer will review reports as time allows and prioritize issues that
can affect user data integrity, unsafe URL handling, or unexpected execution of
user-provided content.
