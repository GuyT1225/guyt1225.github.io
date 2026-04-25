# PasteLint

## Clean Text for Everybody

PasteLint is a free, privacy-first text cleaning toolkit designed to fix copy-paste formatting issues and make text usable anywhere.

It helps clean text copied from PDFs, Word documents, websites, AI tools, and messaging apps — all directly in the browser with no login and no uploads.

---

## Core Features

- Fix copy-paste formatting
- Remove hidden characters (zero-width spaces, non-breaking spaces, Unicode artifacts)
- Clean text from PDFs and Word documents
- Normalize spacing and punctuation
- Prepare text for IVR and text-to-speech systems
- Clean AI-generated text output

---

## Privacy First

PasteLint runs entirely in the browser.

- No data is uploaded
- No text is stored
- No tracking of input content

---

## Project Structure

PasteLint is a static web application built with:

- HTML (landing pages and tool interfaces)
- CSS (shared styling)
- JavaScript (text cleaning logic)

Each page targets a specific use case while reusing a shared cleaning engine.

---

## Goal

PasteLint is designed as a scalable, low-maintenance utility site:

- Each page targets a specific search problem
- All tools run client-side (no backend required)
- New tools can be added quickly using the same core logic

---

## Vision

To provide a simple, reliable, and accessible set of tools for cleaning and preparing text for real-world use — including documents, communication, and voice systems.

Plain text that works everywhere.# PasteLint

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

### Text Brief / Insight Panel
- Appears after every clean, analyses the raw input text
- Content-type classifier: Email, Q&A/Chat, Code snippet, List/outline, Article/document, Invoice/table, Meeting notes, General text
- Stat chips: word count, sentence count, paragraph count, reading time, words/sentence, vocab richness %
- Reference extraction: URLs, email addresses, dates, phone numbers, citation markers ([1], superscript numbers)
- All runs in-browser — no API call, no data upload

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

## SEO & Landing Pages

### Main page (index.html)
- Title: "PasteLint — Free Online Text Cleaner, Formatter & Linter"
- H1: "Clean, Lint & Fix Copied Text — Free & Instant"

### Landing pages (preset auto-selected via `data-default-preset` on `<body>`)
| File | Preset | Target keywords |
|---|---|---|
| `word-paste-cleaner.html` | Email | fix Word copy paste formatting |
| `ai-text-cleaner.html` | Deep Clean | clean AI generated text, remove ChatGPT formatting |
| `ivr-text-prep.html` | IVR/TTS | IVR text cleaner, TTS text prep, Amazon Polly |
| `pdf-copy-fix.html` | Deep Clean | fix PDF copy paste, remove PDF formatting |
| `remove-hidden-characters.html` | Email | remove hidden characters, zero-width spaces |

Each page has: unique title, meta description, H1, intro callout, cross-links to sibling pages, unique SEO section.
Preset auto-selection also works via `?preset=Name` URL param on any page.

## Workflow
- Served via `python3 -m http.server 5000` (no build step required)
- Workflow name: "Start application"
