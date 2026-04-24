# PasteLint

## Overview
PasteLint is a zero-cost, static HTML/CSS/JavaScript text cleaning and linting utility. All processing runs entirely in the browser. No backend, no database, no login. Originally built as "Fix Copy Paste Formatting," renamed to PasteLint for stronger SEO and brand recognition in the dev/tech community.

## Stack
- `index.html` — page structure and SEO markup
- `style.css` — responsive, mobile-friendly styling
- `script.js` — all feature logic in vanilla JS

## Features

### Cleaning Modes
- **Basic Clean**: Trims spaces, collapses duplicates, normalizes smart quotes and dashes, reduces excessive blank lines
- **Remove Hidden Characters**: Strips zero-width spaces, invisible Unicode, non-breaking spaces, and control characters
- **IVR / TTS Mode**: Replaces symbols (&, @, #, $, %) with spoken words, removes markdown formatting

### Smart Detection & Explanation Report (Feature 2 + 5)
- Analyses raw input before cleaning and shows a plain-English report
- Detects likely paste source: AI Output, Email Forward, PDF, Word/Office
- Lists every issue found with counts and what will happen to each

### Named Cleaning Presets (Feature 3)
- Built-in presets: Email, IVR/TTS, Minimal, Deep Clean
- User-saved presets (stored in localStorage) — saved with a custom name
- Active preset is highlighted; presets auto-detect when checkboxes match

### Custom Find & Replace Rules (Feature 1)
- Persistent rules stored in localStorage (key: `pastelint_rules`)
- Each rule: enable/disable toggle, find input, replace input, delete button
- Applied after all cleaning modes, plain-text (not regex) for accessibility

### Line-by-Line Mode (Feature 4)
- Toggle between Paragraph and Line-by-Line view
- Shows a comparison table: original | cleaned per line
- Changed rows highlighted in amber
- Per-line copy button + "Copy all cleaned lines"

### Diff View
- Toggle "Show Changes" for inline before/after diff
- Red strikethrough = removed, green highlight = added
- Iterative LCS algorithm, capped at 2,000 tokens

### Session History
- Last 10 sessions saved to localStorage (key: `pastelint_history`)
- Shows preview, relative time, char delta
- Per-entry restore and delete, "Clear all"
- Deduplicates by cleaned text

### Utility
- Word count + character count for both textareas (live on input)
- Copy to clipboard (with fallback)
- Download .txt with timestamped filename (`pastelint-YYYY-MM-DD_HH-MM.txt`)
- Clear resets all panels and state

## localStorage Keys
- `pastelint_history` — session history (max 10 entries)
- `pastelint_presets` — user-saved presets
- `pastelint_rules` — custom find & replace rules

## SEO
- Title: "PasteLint — Free Online Text Cleaner, Formatter & Linter"
- H1: "Clean, Lint & Fix Copied Text — Free & Instant"
- Target keywords: text cleaner online, paste formatter, remove hidden characters, text linter, IVR text cleaner

## Workflow
- Served via `python3 -m http.server 5000` (no build step required)
- Workflow name: "Start application"
