# Fix Copy Paste Formatting

## Overview
A zero-cost, static HTML/CSS/JavaScript text cleaning utility website. No backend, no database, no login required. All processing happens in the user's browser.

## Stack
- `index.html` — page structure and SEO markup
- `style.css` — responsive, mobile-friendly styling
- `script.js` — all cleaning logic in vanilla JS

## Features
- **Basic Clean**: Trims spaces, collapses duplicates, normalizes smart quotes and dashes, reduces excessive blank lines
- **Remove Hidden Characters**: Strips zero-width spaces, invisible Unicode, non-breaking spaces, and control characters
- **IVR / TTS Mode**: Replaces symbols (`&`, `@`, `#`, `$`, `%`, `/`) with spoken words, removes markdown formatting
- **Diff View**: Toggle "Show Changes" reveals an inline before/after diff with red strikethrough (removed) and green highlight (added). Uses iterative LCS algorithm, capped at 2,000 tokens to prevent browser freeze.
- **Session History**: Last 10 cleaned sessions saved to localStorage. Each entry shows a text preview, relative timestamp, and character delta. Supports per-entry restore and delete, plus "Clear all". Deduplicates by cleaned text content.
- Character count display for both input and output
- Copy to clipboard with fallback for older browsers
- Clear button

## Workflow
- Served via `python3 -m http.server 5000` (no build step required)
- Workflow name: "Start application"
