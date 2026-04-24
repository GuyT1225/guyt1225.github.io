/* =============================================
   Fix Copy Paste Formatting — Main Script
   ============================================= */

// --- DOM References ---
const inputText   = document.getElementById('input-text');
const outputText  = document.getElementById('output-text');
const inputCount  = document.getElementById('input-count');
const outputCount = document.getElementById('output-count');
const btnClean    = document.getElementById('btn-clean');
const btnCopy     = document.getElementById('btn-copy');
const btnDownload = document.getElementById('btn-download');
const btnClear    = document.getElementById('btn-clear');
const btnShowDiff = document.getElementById('btn-show-diff');
const diffSection = document.getElementById('diff-section');
const diffOutput  = document.getElementById('diff-output');
const diffSummary = document.getElementById('diff-summary');
const copyFeedback = document.getElementById('copy-feedback');

const modeBasic  = document.getElementById('mode-basic');
const modeHidden = document.getElementById('mode-hidden');
const modeIVR    = document.getElementById('mode-ivr');

// --- Character Count Helpers ---

/**
 * Updates the character count display for a given textarea and counter element.
 * @param {HTMLTextAreaElement} textarea
 * @param {HTMLElement} counter
 */
function updateCount(textarea, counter) {
  const len = textarea.value.length;
  counter.textContent = len === 1 ? '1 character' : `${len.toLocaleString()} characters`;
}

// Update input count as user types
inputText.addEventListener('input', () => updateCount(inputText, inputCount));

// --- Cleaning Logic ---

/**
 * Main clean function. Applies selected cleaning modes to the input text.
 * @param {string} text - Raw input text
 * @returns {string} - Cleaned output text
 */
function cleanText(text) {

  // Step 1: Remove Hidden Characters (runs first so later steps see clean text)
  if (modeHidden.checked) {
    // Remove zero-width spaces (U+200B)
    text = text.replace(/\u200B/g, '');

    // Remove zero-width non-joiner (U+200C) and zero-width joiner (U+200D)
    text = text.replace(/[\u200C\u200D]/g, '');

    // Remove word joiner (U+2060) and function application (U+2061)
    text = text.replace(/[\u2060\u2061]/g, '');

    // Remove left-to-right / right-to-left marks and embedding characters
    text = text.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');

    // Remove soft hyphens (U+00AD) — invisible but break layout
    text = text.replace(/\u00AD/g, '');

    // Remove byte-order mark (BOM) if present
    text = text.replace(/\uFEFF/g, '');

    // Convert non-breaking spaces (U+00A0) to regular spaces
    text = text.replace(/\u00A0/g, ' ');

    // Convert narrow no-break space (U+202F) to regular space
    text = text.replace(/\u202F/g, ' ');

    // Remove other miscellaneous invisible/control characters (except normal whitespace)
    text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  }

  // Step 2: Basic Clean
  if (modeBasic.checked) {
    // Normalize smart/curly double quotes to straight quotes
    text = text.replace(/[\u201C\u201D\u201E\u201F]/g, '"');

    // Normalize smart/curly single quotes and apostrophes to straight apostrophes
    text = text.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");

    // Normalize long dashes (em dash, en dash, horizontal bar) to a hyphen
    text = text.replace(/[\u2013\u2014\u2015]/g, '-');

    // Collapse multiple spaces on each line (preserve newlines)
    text = text.replace(/[ \t]+/g, ' ');

    // Trim trailing and leading spaces on each individual line
    text = text.split('\n').map(line => line.trim()).join('\n');

    // Reduce more than two consecutive blank lines to a single blank line
    text = text.replace(/\n{3,}/g, '\n\n');

    // Trim leading and trailing whitespace from the entire result
    text = text.trim();
  }

  // Step 3: IVR / TTS Mode — only runs if explicitly enabled
  if (modeIVR.checked) {
    // Replace & with "and" (with spacing awareness)
    text = text.replace(/\s*&\s*/g, ' and ');

    // Replace @ with "at"
    text = text.replace(/\s*@\s*/g, ' at ');

    // Replace # (hash/number) with "number" when followed by digits
    text = text.replace(/#(\d)/g, 'number $1');

    // Replace standalone # with nothing (avoid "hashtag" confusion in TTS)
    text = text.replace(/#/g, '');

    // Replace % with " percent"
    text = text.replace(/(\d)\s*%/g, '$1 percent');

    // Replace $ with "dollar" or "dollars" — simplified as "dollar"
    text = text.replace(/\$(\d)/g, 'dollar $1');

    // Replace / between words/numbers with " or " (e.g. "yes/no" → "yes or no")
    text = text.replace(/(\w)\/(\w)/g, '$1 or $2');

    // Remove asterisks used as bullets or emphasis (common in AI output)
    text = text.replace(/\*+/g, '');

    // Remove underscores used as emphasis
    text = text.replace(/_+/g, '');

    // Remove backticks (code formatting)
    text = text.replace(/`+/g, '');

    // Replace ellipsis character with three dots (pause cue for TTS)
    text = text.replace(/\u2026/g, '...');

    // Remove square brackets and their contents (e.g. markdown link syntax)
    text = text.replace(/\[([^\]]*)\]/g, '$1');

    // Collapse any double spaces that may have been introduced above
    text = text.replace(/[ \t]{2,}/g, ' ').trim();
  }

  return text;
}

// --- Button: Clean Text ---
btnClean.addEventListener('click', () => {
  const raw = inputText.value;

  if (!raw.trim()) {
    outputText.value = '';
    updateCount(outputText, outputCount);
    // Reset diff and download state
    btnShowDiff.disabled  = true;
    btnDownload.disabled  = true;
    diffSection.hidden = true;
    btnShowDiff.textContent = 'Show Changes';
    return;
  }

  const cleaned = cleanText(raw);
  outputText.value = cleaned;
  updateCount(outputText, outputCount);

  // Enable action buttons now that we have a before/after pair
  btnShowDiff.disabled = false;
  btnDownload.disabled = false;

  // If diff panel was already open, refresh it automatically
  if (!diffSection.hidden) {
    renderDiff(raw, cleaned);
  }
});

// --- Button: Copy Output ---
btnCopy.addEventListener('click', () => {
  const text = outputText.value;

  if (!text) {
    showFeedback('Nothing to copy yet.');
    return;
  }

  // Use Clipboard API if available, else fall back to execCommand
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => showFeedback('Copied to clipboard!'))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
});

/**
 * Fallback copy method for older browsers.
 * @param {string} text
 */
function fallbackCopy(text) {
  outputText.select();
  try {
    document.execCommand('copy');
    showFeedback('Copied to clipboard!');
  } catch (e) {
    showFeedback('Could not copy. Please select and copy manually.');
  }
}

// --- Button: Clear ---
btnClear.addEventListener('click', () => {
  inputText.value  = '';
  outputText.value = '';
  updateCount(inputText, inputCount);
  updateCount(outputText, outputCount);
  copyFeedback.textContent = '';
  inputText.focus();
});

// --- Feedback Message Helper ---
let feedbackTimer = null;

/**
 * Briefly shows a feedback message below the buttons, then fades it out.
 * @param {string} message
 */
function showFeedback(message) {
  copyFeedback.textContent = message;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    copyFeedback.textContent = '';
  }, 2500);
}

// --- Button: Show / Hide Changes (Diff View) ---
btnShowDiff.addEventListener('click', () => {
  const isHidden = diffSection.hidden;

  if (isHidden) {
    // Build and show the diff
    renderDiff(inputText.value, outputText.value);
    diffSection.hidden = false;
    btnShowDiff.textContent = 'Hide Changes';
  } else {
    // Hide the diff panel
    diffSection.hidden = true;
    btnShowDiff.textContent = 'Show Changes';
  }
});

// --- Diff Engine ---

/**
 * Tokenizes text into an array of word and whitespace chunks.
 * This preserves all spacing so the diff output looks natural.
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  return text.match(/[^\s]+|\s+/g) || [];
}

/**
 * Computes the Longest Common Subsequence (LCS) length table
 * between two token arrays. Used as the basis for diffing.
 * @param {string[]} a - "before" tokens
 * @param {string[]} b - "after" tokens
 * @returns {number[][]} LCS table
 */
function lcsTable(a, b) {
  const m = a.length;
  const n = b.length;
  // Initialise a (m+1) x (n+1) table filled with 0
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
}

/**
 * Iteratively backtracks through the LCS table to produce a list of diff
 * operations. Each operation is { type: 'equal'|'remove'|'add', text }.
 * Iterative version avoids call-stack overflow for large token arrays.
 * @param {number[][]} dp - LCS table
 * @param {string[]} a - "before" tokens
 * @param {string[]} b - "after" tokens
 * @returns {{ type: string, text: string }[]}
 */
function backtrack(dp, a, b) {
  const ops = [];
  let i = a.length;
  let j = b.length;

  while (i > 0 || j > 0) {
    if (i === 0) {
      ops.push({ type: 'add',    text: b[--j] });
    } else if (j === 0) {
      ops.push({ type: 'remove', text: a[--i] });
    } else if (a[i - 1] === b[j - 1]) {
      ops.push({ type: 'equal',  text: a[i - 1] });
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      ops.push({ type: 'remove', text: a[--i] });
    } else {
      ops.push({ type: 'add',    text: b[--j] });
    }
  }

  // The loop builds ops in reverse order; flip it
  ops.reverse();
  return ops;
}

/**
 * Safely escapes text for insertion as HTML so angle brackets etc.
 * are never interpreted as markup.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renders the diff between the original and cleaned text into the diff panel.
 * Falls back to a simple "no changes" message when texts are identical.
 * @param {string} original - The raw input text
 * @param {string} cleaned  - The cleaned output text
 */
function renderDiff(original, cleaned) {
  // Nothing to diff
  if (original === cleaned) {
    diffOutput.innerHTML = '<span class="diff-no-changes">No changes were made — the text was already clean.</span>';
    diffSummary.textContent = '';
    return;
  }

  // For very large texts, cap token count to avoid UI freeze
  const MAX_TOKENS = 2000;
  const aTokens = tokenize(original);
  const bTokens = tokenize(cleaned);

  if (aTokens.length > MAX_TOKENS || bTokens.length > MAX_TOKENS) {
    // Fallback: simple character-count summary without inline diff
    diffOutput.innerHTML = '<span class="diff-no-changes">Text is too long for inline diff. See the cleaned output above.</span>';
    const delta = original.length - cleaned.length;
    diffSummary.textContent = delta > 0
      ? `${delta.toLocaleString()} character${delta !== 1 ? 's' : ''} removed`
      : `${Math.abs(delta).toLocaleString()} character${Math.abs(delta) !== 1 ? 's' : ''} added`;
    return;
  }

  // Compute diff
  const dp   = lcsTable(aTokens, bTokens);
  const ops  = backtrack(dp, aTokens, bTokens);

  // Build HTML and count changes
  let removedCount = 0;
  let addedCount   = 0;
  let html = '';

  for (const op of ops) {
    const safe = escapeHtml(op.text);
    if (op.type === 'equal') {
      html += safe;
    } else if (op.type === 'remove') {
      removedCount++;
      html += `<mark class="diff-removed">${safe}</mark>`;
    } else if (op.type === 'add') {
      addedCount++;
      html += `<mark class="diff-added">${safe}</mark>`;
    }
  }

  diffOutput.innerHTML = html;

  // Summary line
  const parts = [];
  if (removedCount > 0) parts.push(`${removedCount} token${removedCount !== 1 ? 's' : ''} removed`);
  if (addedCount   > 0) parts.push(`${addedCount} token${addedCount !== 1 ? 's' : ''} added`);
  diffSummary.textContent = parts.join(', ');
}

// --- Button: Download .txt ---
btnDownload.addEventListener('click', () => {
  const text = outputText.value;
  if (!text) return;

  // Build a filename with the current date and time (e.g. cleaned-2026-04-24_14-30.txt)
  const now  = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5).replace(':', '-');
  const filename = `cleaned-${date}_${time}.txt`;

  // Create a temporary Blob URL, click it, then revoke it
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showFeedback(`Downloaded as ${filename}`);
});

// --- Clear also resets diff and download state ---
btnClear.addEventListener('click', () => {
  diffSection.hidden = true;
  btnShowDiff.textContent = 'Show Changes';
  btnShowDiff.disabled = true;
  btnDownload.disabled = true;
}, { capture: false });

// ==============================================
// --- History Feature ---
// Saves the last 10 cleaned sessions to
// localStorage so users can revisit them.
// ==============================================

const HISTORY_KEY     = 'fcpf_history';
const HISTORY_MAX     = 10;   // maximum entries to keep
const PREVIEW_LENGTH  = 90;   // characters shown as preview

const historyList     = document.getElementById('history-list');
const btnClearHistory = document.getElementById('btn-clear-history');

/**
 * Loads history entries from localStorage.
 * Returns an empty array if nothing is stored or if parsing fails.
 * @returns {Object[]}
 */
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Persists the history array back to localStorage.
 * Silently swallows quota errors so the tool still works.
 * @param {Object[]} entries
 */
function saveHistory(entries) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full — skip saving
  }
}

/**
 * Adds a new entry to the front of the history list and trims to HISTORY_MAX.
 * Duplicate entries (identical cleaned text) replace the existing one.
 * @param {string} original - Raw input text
 * @param {string} cleaned  - Cleaned output text
 */
function addHistoryEntry(original, cleaned) {
  let entries = loadHistory();

  // Avoid saving if cleaned text is empty
  if (!cleaned.trim()) return;

  // Remove any existing entry with the same cleaned text (dedup)
  entries = entries.filter(e => e.cleaned !== cleaned);

  // Build the new entry
  const entry = {
    id:        Date.now(),
    timestamp: Date.now(),
    original,
    cleaned,
    originalLen: original.length,
    cleanedLen:  cleaned.length
  };

  // Newest first, cap at max
  entries.unshift(entry);
  entries = entries.slice(0, HISTORY_MAX);

  saveHistory(entries);
  renderHistory();
}

/**
 * Deletes a single history entry by its id.
 * @param {number} id
 */
function deleteHistoryEntry(id) {
  const entries = loadHistory().filter(e => e.id !== id);
  saveHistory(entries);
  renderHistory();
}

/**
 * Returns a human-readable relative time string (e.g. "2 minutes ago").
 * @param {number} timestamp - Unix ms timestamp
 * @returns {string}
 */
function relativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const s  = Math.floor(diff / 1000);
  const m  = Math.floor(s / 60);
  const h  = Math.floor(m / 60);
  const d  = Math.floor(h / 24);

  if (s < 10)  return 'just now';
  if (s < 60)  return `${s} second${s !== 1 ? 's' : ''} ago`;
  if (m < 60)  return `${m} minute${m !== 1 ? 's' : ''} ago`;
  if (h < 24)  return `${h} hour${h !== 1 ? 's' : ''} ago`;
  return `${d} day${d !== 1 ? 's' : ''} ago`;
}

/**
 * Renders the history list into the #history-list element.
 * Shows an empty-state message when there are no entries.
 */
function renderHistory() {
  const entries = loadHistory();

  if (entries.length === 0) {
    historyList.innerHTML = '<p class="history-empty">No sessions yet. Clean some text and it will appear here.</p>';
    btnClearHistory.style.visibility = 'hidden';
    return;
  }

  btnClearHistory.style.visibility = 'visible';

  historyList.innerHTML = entries.map(entry => {
    // Build a safe text preview (no HTML injection)
    const preview = entry.cleaned.slice(0, PREVIEW_LENGTH).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const ellipsis = entry.cleaned.length > PREVIEW_LENGTH ? '…' : '';
    const delta = entry.originalLen - entry.cleanedLen;
    const deltaLabel = delta > 0
      ? `−${delta.toLocaleString()} chars`
      : delta < 0
        ? `+${Math.abs(delta).toLocaleString()} chars`
        : 'no size change';

    return `
      <div class="history-entry" data-id="${entry.id}">
        <div class="history-entry-info">
          <div class="history-entry-preview">${preview}${ellipsis}</div>
          <div class="history-entry-meta">
            <span>${relativeTime(entry.timestamp)}</span>
            <span>${entry.cleanedLen.toLocaleString()} chars cleaned</span>
            <span>${deltaLabel}</span>
          </div>
        </div>
        <div class="history-entry-actions">
          <button class="btn-restore" data-id="${entry.id}" title="Load this session back into the tool">Restore</button>
          <button class="btn-delete-entry" data-id="${entry.id}" title="Remove this entry" aria-label="Delete entry">×</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Restores a history entry into the input and output textareas.
 * @param {number} id
 */
function restoreHistoryEntry(id) {
  const entry = loadHistory().find(e => e.id === id);
  if (!entry) return;

  inputText.value  = entry.original;
  outputText.value = entry.cleaned;
  updateCount(inputText,  inputCount);
  updateCount(outputText, outputCount);

  // Enable action buttons since we now have a before/after pair
  btnShowDiff.disabled = false;
  btnDownload.disabled = false;

  // If diff panel is open, re-render it with the restored content
  if (!diffSection.hidden) {
    renderDiff(entry.original, entry.cleaned);
  }

  // Scroll smoothly back to the top of the tool
  inputText.scrollIntoView({ behavior: 'smooth', block: 'center' });
  showFeedback('Session restored.');
}

// --- Event delegation for Restore and Delete buttons inside the list ---
historyList.addEventListener('click', (e) => {
  const id = parseInt(e.target.dataset.id, 10);
  if (isNaN(id)) return;

  if (e.target.classList.contains('btn-restore')) {
    restoreHistoryEntry(id);
  } else if (e.target.classList.contains('btn-delete-entry')) {
    deleteHistoryEntry(id);
  }
});

// --- Clear All History ---
btnClearHistory.addEventListener('click', () => {
  if (!confirm('Clear all saved sessions?')) return;
  saveHistory([]);
  renderHistory();
});

// --- Hook into Clean Text to auto-save ---
// (adds a second listener that fires after the main clean listener)
btnClean.addEventListener('click', () => {
  // Only save if there is cleaned output to record
  const raw     = inputText.value;
  const cleaned = outputText.value;
  if (raw.trim() && cleaned.trim()) {
    addHistoryEntry(raw, cleaned);
  }
});

// --- Initial render ---
renderHistory();

// --- Initial count display ---
updateCount(inputText, inputCount);
updateCount(outputText, outputCount);
