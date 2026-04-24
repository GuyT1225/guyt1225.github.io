/* =============================================
   PasteLint — Main Script
   ============================================= */

// -----------------------------------------------
// DOM REFERENCES
// -----------------------------------------------
const inputText     = document.getElementById('input-text');
const outputText    = document.getElementById('output-text');
const inputCount    = document.getElementById('input-count');
const outputCount   = document.getElementById('output-count');

const btnClean      = document.getElementById('btn-clean');
const btnCopy       = document.getElementById('btn-copy');
const btnDownload   = document.getElementById('btn-download');
const btnClear      = document.getElementById('btn-clear');
const btnShowDiff   = document.getElementById('btn-show-diff');
const copyFeedback  = document.getElementById('copy-feedback');

const modeBasic     = document.getElementById('mode-basic');
const modeHidden    = document.getElementById('mode-hidden');
const modeIVR       = document.getElementById('mode-ivr');

const toggleParagraph = document.getElementById('toggle-paragraph');
const toggleLines     = document.getElementById('toggle-lines');
const paragraphSection = document.getElementById('paragraph-section');
const linesTableWrapper = document.getElementById('lines-table-wrapper');
const linesTbody      = document.getElementById('lines-tbody');
const linesSummary    = document.getElementById('lines-summary');
const btnCopyLines    = document.getElementById('btn-copy-lines');

const reportSection = document.getElementById('report-section');
const reportBadge   = document.getElementById('report-badge');
const reportList    = document.getElementById('report-list');

const diffSection     = document.getElementById('diff-section');
const diffOutput      = document.getElementById('diff-output');
const diffSummary     = document.getElementById('diff-summary');
const advancedDetails = document.getElementById('advanced-details');

const presetsList       = document.getElementById('presets-list');
const btnSavePreset     = document.getElementById('btn-save-preset');

const rulesList         = document.getElementById('rules-list');
const btnAddRule        = document.getElementById('btn-add-rule');

const historyList       = document.getElementById('history-list');
const btnClearHistory   = document.getElementById('btn-clear-history');

// Active view mode: 'paragraph' or 'lines'
let currentMode = 'paragraph';

// -----------------------------------------------
// HELPERS
// -----------------------------------------------

/**
 * Counts visible words in a string.
 * @param {string} text
 * @returns {number}
 */
function wordCount(text) {
  return (text.trim().match(/\S+/g) || []).length;
}

/**
 * Updates the word + character counter for a given textarea.
 * @param {HTMLTextAreaElement} textarea
 * @param {HTMLElement} counter
 */
function updateCount(textarea, counter) {
  const text = textarea.value;
  const chars = text.length;
  const words = wordCount(text);
  counter.textContent = `${words.toLocaleString()} word${words !== 1 ? 's' : ''} · ${chars.toLocaleString()} character${chars !== 1 ? 's' : ''}`;
}

/**
 * Escapes a string for safe insertion into innerHTML.
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

let feedbackTimer = null;

/**
 * Shows a brief status message below the buttons.
 * @param {string} message
 * @param {number} duration  ms before clearing
 */
function showFeedback(message, duration = 2500) {
  copyFeedback.textContent = message;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => { copyFeedback.textContent = ''; }, duration);
}

// Live word+char count as user types
inputText.addEventListener('input', () => updateCount(inputText, inputCount));

// -----------------------------------------------
// SMART DETECTION & ANALYSIS (Feature 2 + 5)
// -----------------------------------------------

/**
 * Analyses the raw input text and returns a list of human-readable
 * findings plus a detected source type.
 *
 * @param {string} text
 * @returns {{ findings: string[], sourceType: string|null }}
 */
function analyzeText(text) {
  const findings = [];

  // Count specific issues
  const smartQuotes  = (text.match(/[\u201C\u201D\u2018\u2019\u201E\u201F\u2032\u2035]/g) || []).length;
  const longDashes   = (text.match(/[\u2013\u2014\u2015]/g) || []).length;
  const zwSpaces     = (text.match(/\u200B/g) || []).length;
  const nbSpaces     = (text.match(/\u00A0/g) || []).length;
  const softHyphens  = (text.match(/\u00AD/g) || []).length;
  const bom          = (text.match(/\uFEFF/g) || []).length;
  const extraSpaces  = (text.match(/ {2,}/g) || []).length;
  const excessLines  = (text.match(/\n{3,}/g) || []).length;
  const mdBoldItalic = (text.match(/\*{1,2}[^*\n]+\*{1,2}/g) || []).length;
  const mdHeaders    = (text.match(/^#{1,6}\s/gm) || []).length;
  const backticks    = (text.match(/`/g) || []).length;
  const emailQuotes  = (text.match(/^>/gm) || []).length;
  const ivrSymbols   = (text.match(/[&@#$%]/g) || []).length;
  const pdfHyphens   = (text.match(/\w-\n[a-z]/g) || []).length;

  // Detect likely source
  const aiScore     = mdBoldItalic * 2 + mdHeaders * 3 + backticks;
  const emailScore  = emailQuotes * 3;
  const pdfScore    = (pdfHyphens + softHyphens) * 3;
  const officeScore = smartQuotes + longDashes;
  const top = Math.max(aiScore, emailScore, pdfScore, officeScore);

  let sourceType = null;
  if (top > 0) {
    if      (aiScore    === top) sourceType = 'AI Output';
    else if (emailScore === top) sourceType = 'Email Forward';
    else if (pdfScore   === top) sourceType = 'PDF';
    else if (officeScore=== top) sourceType = 'Word / Office';
  }

  // Build plain-English findings
  if (smartQuotes > 0)
    findings.push(`${smartQuotes} smart quote${smartQuotes !== 1 ? 's' : ''} — will be straightened`);
  if (longDashes > 0)
    findings.push(`${longDashes} long dash${longDashes !== 1 ? 'es' : ''} (em/en dash) — will become hyphens`);
  if (zwSpaces > 0)
    findings.push(`${zwSpaces} zero-width space${zwSpaces !== 1 ? 's' : ''} — will be removed`);
  if (nbSpaces > 0)
    findings.push(`${nbSpaces} non-breaking space${nbSpaces !== 1 ? 's' : ''} — will become normal spaces`);
  if (softHyphens > 0)
    findings.push(`${softHyphens} invisible soft hyphen${softHyphens !== 1 ? 's' : ''} — will be removed`);
  if (bom > 0)
    findings.push(`Byte-order mark (BOM) detected — will be removed`);
  if (extraSpaces > 0)
    findings.push(`${extraSpaces} instance${extraSpaces !== 1 ? 's' : ''} of extra whitespace — will be collapsed`);
  if (excessLines > 0)
    findings.push(`Excessive blank lines detected — will be reduced`);
  if (mdBoldItalic + mdHeaders > 0) {
    const n = mdBoldItalic + mdHeaders;
    findings.push(`${n} markdown formatting marker${n !== 1 ? 's' : ''} (bold/italic/headers) — present`);
  }
  if (backticks > 0)
    findings.push(`${backticks} backtick${backticks !== 1 ? 's' : ''} (code formatting) — present`);
  if (emailQuotes > 0)
    findings.push(`${emailQuotes} quoted email line${emailQuotes !== 1 ? 's' : ''} (>) — present`);
  if (pdfHyphens > 0)
    findings.push(`${pdfHyphens} hyphenated line break${pdfHyphens !== 1 ? 's' : ''} (PDF artifact) — detected`);
  if (ivrSymbols > 0)
    findings.push(`${ivrSymbols} IVR/TTS-problematic symbol${ivrSymbols !== 1 ? 's' : ''} (&, @, #, $, %) — detected`);

  return { findings, sourceType };
}

/**
 * Renders the analysis report panel.
 * Hides the panel when there is nothing to report.
 *
 * @param {string} original  - raw input text
 */
function renderReport(original) {
  const { findings, sourceType } = analyzeText(original);

  if (findings.length === 0) {
    // No issues — show a clean bill of health briefly
    reportList.innerHTML = '<li class="report-clean" style="list-style:none;padding-left:0">✓ No formatting issues detected — text looks clean.</li>';
    reportBadge.textContent = '';
    reportSection.hidden = false;
    return;
  }

  reportBadge.textContent = sourceType || 'Mixed / Unknown';
  reportList.innerHTML = findings
    .map(f => `<li>${escapeHtml(f)}</li>`)
    .join('');
  reportSection.hidden = false;
}

// -----------------------------------------------
// CLEANING LOGIC
// -----------------------------------------------

/**
 * Applies all active custom find-and-replace rules to the text.
 * @param {string} text
 * @returns {string}
 */
function applyCustomRules(text) {
  const rules = loadRules().filter(r => r.enabled && r.find.trim() !== '');
  for (const rule of rules) {
    // Plain-text find/replace (not regex) to keep it accessible
    const escaped = rule.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(escaped, 'g'), rule.replace);
  }
  return text;
}

/**
 * Main clean function — applies all enabled cleaning modes then custom rules.
 * @param {string} text
 * @returns {string}
 */
function cleanText(text) {

  // Step 1: Remove Hidden Characters
  if (modeHidden.checked) {
    text = text.replace(/\u200B/g, '');
    text = text.replace(/[\u200C\u200D]/g, '');
    text = text.replace(/[\u2060\u2061]/g, '');
    text = text.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');
    text = text.replace(/\u00AD/g, '');
    text = text.replace(/\uFEFF/g, '');
    text = text.replace(/\u00A0/g, ' ');
    text = text.replace(/\u202F/g, ' ');
    text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  }

  // Step 2: Basic Clean
  if (modeBasic.checked) {
    text = text.replace(/[\u201C\u201D\u201E\u201F]/g, '"');
    text = text.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");
    text = text.replace(/[\u2013\u2014\u2015]/g, '-');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.split('\n').map(line => line.trim()).join('\n');
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();
  }

  // Step 3: IVR / TTS Mode
  if (modeIVR.checked) {
    text = text.replace(/\s*&\s*/g, ' and ');
    text = text.replace(/\s*@\s*/g, ' at ');
    text = text.replace(/#(\d)/g, 'number $1');
    text = text.replace(/#/g, '');
    text = text.replace(/(\d)\s*%/g, '$1 percent');
    text = text.replace(/\$(\d)/g, 'dollar $1');
    text = text.replace(/(\w)\/(\w)/g, '$1 or $2');
    text = text.replace(/\*+/g, '');
    text = text.replace(/_+/g, '');
    text = text.replace(/`+/g, '');
    text = text.replace(/\u2026/g, '...');
    text = text.replace(/\[([^\]]*)\]/g, '$1');
    text = text.replace(/[ \t]{2,}/g, ' ').trim();
  }

  // Step 4: Custom Rules (always last)
  text = applyCustomRules(text);

  return text;
}

// -----------------------------------------------
// BUTTON: CLEAN TEXT
// -----------------------------------------------
btnClean.addEventListener('click', () => {
  const raw = inputText.value;

  if (!raw.trim()) {
    outputText.value = '';
    updateCount(outputText, outputCount);
    btnShowDiff.disabled = true;
    btnDownload.disabled = true;
    diffSection.hidden   = true;
    reportSection.hidden = true;
    linesTableWrapper.hidden = true;
    btnShowDiff.textContent  = 'Show Changes';
    return;
  }

  // Run analysis BEFORE cleaning (analyses raw input)
  renderReport(raw);

  const cleaned = cleanText(raw);
  outputText.value = cleaned;
  updateCount(outputText, outputCount);

  btnShowDiff.disabled = false;
  btnDownload.disabled = false;

  // Update diff if already open
  if (!diffSection.hidden) renderDiff(raw, cleaned);

  // Update line table if in lines mode
  if (currentMode === 'lines') renderLineTable(raw, cleaned);

  // Auto-save to history
  if (cleaned.trim()) addHistoryEntry(raw, cleaned);
});

// -----------------------------------------------
// BUTTON: COPY OUTPUT
// -----------------------------------------------
btnCopy.addEventListener('click', () => {
  const text = outputText.value;
  if (!text) { showFeedback('Nothing to copy yet.'); return; }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => showFeedback('Copied to clipboard!'))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
});

function fallbackCopy(text) {
  outputText.select();
  try {
    document.execCommand('copy');
    showFeedback('Copied to clipboard!');
  } catch {
    showFeedback('Could not copy — please select and copy manually.');
  }
}

// -----------------------------------------------
// BUTTON: DOWNLOAD .TXT
// -----------------------------------------------
btnDownload.addEventListener('click', () => {
  const text = outputText.value;
  if (!text) return;

  const now      = new Date();
  const date     = now.toISOString().slice(0, 10);
  const time     = now.toTimeString().slice(0, 5).replace(':', '-');
  const filename = `pastelint-${date}_${time}.txt`;

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showFeedback(`Downloaded as ${filename}`);
});

// -----------------------------------------------
// DIFF ENGINE (LCS-based, iterative)
// -----------------------------------------------

function tokenize(text) {
  return text.match(/[^\s]+|\s+/g) || [];
}

function lcsTable(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
  return dp;
}

function backtrack(dp, a, b) {
  const ops = [];
  let i = a.length, j = b.length;
  while (i > 0 || j > 0) {
    if      (i === 0)                         ops.push({ type: 'add',    text: b[--j] });
    else if (j === 0)                         ops.push({ type: 'remove', text: a[--i] });
    else if (a[i-1] === b[j-1])               { ops.push({ type: 'equal', text: a[i-1] }); i--; j--; }
    else if (dp[i-1][j] >= dp[i][j-1])        ops.push({ type: 'remove', text: a[--i] });
    else                                       ops.push({ type: 'add',    text: b[--j] });
  }
  ops.reverse();
  return ops;
}

function renderDiff(original, cleaned) {
  if (original === cleaned) {
    diffOutput.innerHTML = '<span class="diff-no-changes">No changes were made — the text was already clean.</span>';
    diffSummary.textContent = '';
    return;
  }

  const MAX_TOKENS = 2000;
  const aT = tokenize(original), bT = tokenize(cleaned);

  if (aT.length > MAX_TOKENS || bT.length > MAX_TOKENS) {
    diffOutput.innerHTML = '<span class="diff-no-changes">Text is too long for inline diff — see the cleaned output above.</span>';
    const delta = original.length - cleaned.length;
    diffSummary.textContent = delta > 0
      ? `${delta.toLocaleString()} character${delta !== 1 ? 's' : ''} removed`
      : `${Math.abs(delta).toLocaleString()} character${Math.abs(delta) !== 1 ? 's' : ''} added`;
    return;
  }

  const ops = backtrack(lcsTable(aT, bT), aT, bT);
  let html = '', removed = 0, added = 0;

  for (const op of ops) {
    const s = escapeHtml(op.text);
    if      (op.type === 'equal')  html += s;
    else if (op.type === 'remove') { removed++; html += `<mark class="diff-removed">${s}</mark>`; }
    else                           { added++;   html += `<mark class="diff-added">${s}</mark>`; }
  }

  diffOutput.innerHTML = html;
  const parts = [];
  if (removed > 0) parts.push(`${removed} token${removed !== 1 ? 's' : ''} removed`);
  if (added   > 0) parts.push(`${added} token${added !== 1 ? 's' : ''} added`);
  diffSummary.textContent = parts.join(', ');
}

// -----------------------------------------------
// BUTTON: SHOW / HIDE CHANGES
// -----------------------------------------------
btnShowDiff.addEventListener('click', () => {
  if (diffSection.hidden) {
    renderDiff(inputText.value, outputText.value);
    diffSection.hidden = false;
    btnShowDiff.textContent = 'Hide Changes';
    // Ensure the Advanced section is open so the diff is visible
    advancedDetails.open = true;
    // Smooth scroll to bring it into view
    setTimeout(() => diffSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  } else {
    diffSection.hidden = true;
    btnShowDiff.textContent = 'Show Changes';
  }
});

// -----------------------------------------------
// VIEW MODE TOGGLE (Feature 4 — Line by Line)
// -----------------------------------------------

/**
 * Switches between Paragraph and Line-by-Line view modes.
 * @param {'paragraph'|'lines'} mode
 */
function setViewMode(mode) {
  currentMode = mode;

  if (mode === 'paragraph') {
    paragraphSection.classList.remove('line-mode');
    linesTableWrapper.hidden = true;
    toggleParagraph.classList.add('active');
    toggleParagraph.setAttribute('aria-checked', 'true');
    toggleLines.classList.remove('active');
    toggleLines.setAttribute('aria-checked', 'false');
  } else {
    paragraphSection.classList.add('line-mode');
    toggleLines.classList.add('active');
    toggleLines.setAttribute('aria-checked', 'true');
    toggleParagraph.classList.remove('active');
    toggleParagraph.setAttribute('aria-checked', 'false');

    // If we already have output, render the table immediately
    if (outputText.value.trim()) {
      renderLineTable(inputText.value, outputText.value);
    }
  }
}

toggleParagraph.addEventListener('click', () => setViewMode('paragraph'));
toggleLines.addEventListener('click',     () => setViewMode('lines'));

/**
 * Renders the line-by-line comparison table.
 * @param {string} original
 * @param {string} cleaned
 */
function renderLineTable(original, cleaned) {
  const origLines    = original.split('\n');
  const cleanedLines = cleaned.split('\n');
  const maxLen       = Math.max(origLines.length, cleanedLines.length);

  let changedCount = 0;
  let html = '';

  for (let i = 0; i < maxLen; i++) {
    const orig = origLines[i]  !== undefined ? origLines[i]  : '';
    const cln  = cleanedLines[i] !== undefined ? cleanedLines[i] : '';
    const changed  = orig !== cln;
    if (changed) changedCount++;

    const rowClass  = changed ? 'line-changed' : '';
    const origCell  = orig.trim()
      ? escapeHtml(orig)
      : '<span class="line-empty-label">(blank)</span>';
    const clnCell   = cln.trim()
      ? escapeHtml(cln)
      : '<span class="line-empty-label">(blank)</span>';

    html += `
      <tr class="${rowClass}">
        <td class="line-num">${i + 1}</td>
        <td class="line-original">${origCell}</td>
        <td>${clnCell}</td>
        <td><button class="btn-copy-line" data-line="${escapeHtml(cln)}" title="Copy this line">Copy</button></td>
      </tr>`;
  }

  linesTbody.innerHTML = html;
  const total = maxLen;
  linesSummary.textContent =
    `${total} line${total !== 1 ? 's' : ''} · ${changedCount} changed`;
  linesTableWrapper.hidden = false;
}

// Copy a single line from the table
linesTbody.addEventListener('click', (e) => {
  if (!e.target.classList.contains('btn-copy-line')) return;
  const text = e.target.dataset.line;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showFeedback('Line copied!'));
  } else {
    showFeedback('Could not copy automatically.');
  }
});

// Copy all cleaned lines
btnCopyLines.addEventListener('click', () => {
  const text = outputText.value;
  if (!text) { showFeedback('Nothing to copy yet.'); return; }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showFeedback('All lines copied!'));
  }
});

// -----------------------------------------------
// PRESETS (Feature 3)
// -----------------------------------------------

const PRESETS_KEY = 'pastelint_presets';

// Built-in presets — always shown, not deletable
const BUILTIN_PRESETS = [
  { id: '__email',  name: 'Email',    basic: true,  hidden: true,  ivr: false, builtin: true },
  { id: '__ivr',    name: 'IVR/TTS',  basic: true,  hidden: true,  ivr: true,  builtin: true },
  { id: '__minimal',name: 'Minimal',  basic: true,  hidden: false, ivr: false, builtin: true },
  { id: '__deep',   name: 'Deep Clean',basic: true, hidden: true,  ivr: true,  builtin: true },
];

/**
 * Loads user-saved presets from localStorage.
 * @returns {Object[]}
 */
function loadUserPresets() {
  try { return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]'); }
  catch { return []; }
}

function saveUserPresets(presets) {
  try { localStorage.setItem(PRESETS_KEY, JSON.stringify(presets)); }
  catch {}
}

/**
 * Returns the id of the currently matching preset, or null.
 */
function activePresetId() {
  const b = modeBasic.checked, h = modeHidden.checked, v = modeIVR.checked;
  const all = [...BUILTIN_PRESETS, ...loadUserPresets()];
  const match = all.find(p => p.basic === b && p.hidden === h && p.ivr === v);
  return match ? match.id : null;
}

/**
 * Applies a preset's checkbox values.
 * @param {Object} preset
 */
function applyPreset(preset) {
  modeBasic.checked  = preset.basic;
  modeHidden.checked = preset.hidden;
  modeIVR.checked    = preset.ivr;
  renderPresets();
}

/**
 * Renders all presets (built-in + user) as pill buttons.
 */
function renderPresets() {
  const userPresets = loadUserPresets();
  const activeId    = activePresetId();
  const all         = [...BUILTIN_PRESETS, ...userPresets];

  presetsList.innerHTML = all.map(p => {
    const isActive = p.id === activeId;
    const deleteBtn = p.builtin
      ? ''
      : `<span class="preset-delete" data-delete-preset="${p.id}" title="Delete this preset" role="button" aria-label="Delete preset ${p.name}">×</span>`;
    return `<button class="preset-btn${isActive ? ' active' : ''}" data-preset-id="${p.id}">${escapeHtml(p.name)}${deleteBtn}</button>`;
  }).join('');
}

// Re-render preset highlights when checkboxes change
[modeBasic, modeHidden, modeIVR].forEach(cb => cb.addEventListener('change', renderPresets));

// Click: apply preset or delete it
presetsList.addEventListener('click', (e) => {
  // Delete button inside the pill
  const deleteTarget = e.target.closest('[data-delete-preset]');
  if (deleteTarget) {
    e.stopPropagation();
    const id = deleteTarget.dataset.deletePreset;
    const presets = loadUserPresets().filter(p => p.id !== id);
    saveUserPresets(presets);
    renderPresets();
    return;
  }

  // Apply preset
  const btn = e.target.closest('.preset-btn[data-preset-id]');
  if (!btn) return;
  const id  = btn.dataset.presetId;
  const all = [...BUILTIN_PRESETS, ...loadUserPresets()];
  const preset = all.find(p => p.id === id);
  if (preset) applyPreset(preset);
});

// Save current settings as a new named preset
btnSavePreset.addEventListener('click', () => {
  const name = prompt('Name this preset:');
  if (!name || !name.trim()) return;

  const preset = {
    id:     `user_${Date.now()}`,
    name:   name.trim(),
    basic:  modeBasic.checked,
    hidden: modeHidden.checked,
    ivr:    modeIVR.checked,
    builtin: false,
  };

  const existing = loadUserPresets();
  saveUserPresets([...existing, preset]);
  renderPresets();
  showFeedback(`Preset "${preset.name}" saved.`);
});

// -----------------------------------------------
// CUSTOM RULES (Feature 1)
// -----------------------------------------------

const RULES_KEY = 'pastelint_rules';

function loadRules() {
  try { return JSON.parse(localStorage.getItem(RULES_KEY) || '[]'); }
  catch { return []; }
}

function saveRules(rules) {
  try { localStorage.setItem(RULES_KEY, JSON.stringify(rules)); }
  catch {}
}

/**
 * Renders the list of custom find-and-replace rules.
 */
function renderRules() {
  const rules = loadRules();

  if (rules.length === 0) {
    rulesList.innerHTML = '<p class="rules-empty">No custom rules yet. Add a rule to apply persistent find &amp; replace after cleaning.</p>';
    return;
  }

  rulesList.innerHTML = rules.map(rule => `
    <div class="rule-row" data-rule-id="${rule.id}">
      <input type="checkbox" class="rule-toggle" ${rule.enabled ? 'checked' : ''}
             data-rule-toggle="${rule.id}" title="Enable/disable this rule" />
      <input type="text" class="rule-input rule-find"
             value="${escapeHtml(rule.find)}"
             placeholder="Find…"
             data-rule-find="${rule.id}" />
      <span class="rule-arrow">→</span>
      <input type="text" class="rule-input rule-replace"
             value="${escapeHtml(rule.replace)}"
             placeholder="Replace with…"
             data-rule-replace="${rule.id}" />
      <button class="rule-delete" data-rule-delete="${rule.id}" title="Delete rule" aria-label="Delete rule">×</button>
    </div>
  `).join('');
}

/**
 * Adds a new blank rule and re-renders.
 */
function addRule() {
  const rules = loadRules();
  rules.push({ id: `rule_${Date.now()}`, enabled: true, find: '', replace: '' });
  saveRules(rules);
  renderRules();
  // Focus the new find input
  const inputs = rulesList.querySelectorAll('.rule-find');
  if (inputs.length) inputs[inputs.length - 1].focus();
}

// Delegate all rule interactions to the container
rulesList.addEventListener('change', (e) => {
  const id = e.target.dataset.ruleToggle;
  if (!id) return;
  const rules = loadRules();
  const rule  = rules.find(r => r.id === id);
  if (rule) { rule.enabled = e.target.checked; saveRules(rules); }
});

rulesList.addEventListener('input', (e) => {
  const findId    = e.target.dataset.ruleFindId || e.target.dataset.ruleFind;
  const replaceId = e.target.dataset.ruleReplace;
  if (!findId && !replaceId) return;

  const rules = loadRules();
  if (findId) {
    const rule = rules.find(r => r.id === findId);
    if (rule) { rule.find = e.target.value; saveRules(rules); }
  }
  if (replaceId) {
    const rule = rules.find(r => r.id === replaceId);
    if (rule) { rule.replace = e.target.value; saveRules(rules); }
  }
});

rulesList.addEventListener('click', (e) => {
  const id = e.target.dataset.ruleDelete;
  if (!id) return;
  const rules = loadRules().filter(r => r.id !== id);
  saveRules(rules);
  renderRules();
});

btnAddRule.addEventListener('click', addRule);

// -----------------------------------------------
// BUTTON: CLEAR
// -----------------------------------------------
btnClear.addEventListener('click', () => {
  inputText.value  = '';
  outputText.value = '';
  updateCount(inputText,  inputCount);
  updateCount(outputText, outputCount);
  copyFeedback.textContent = '';

  btnShowDiff.disabled = true;
  btnDownload.disabled = true;
  btnShowDiff.textContent  = 'Show Changes';
  diffSection.hidden       = true;
  reportSection.hidden     = true;
  linesTableWrapper.hidden = true;

  inputText.focus();
});

// -----------------------------------------------
// HISTORY
// -----------------------------------------------
const HISTORY_KEY    = 'pastelint_history';
const HISTORY_MAX    = 10;
const PREVIEW_LENGTH = 90;

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}

function saveHistory(entries) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries)); }
  catch {}
}

function addHistoryEntry(original, cleaned) {
  if (!cleaned.trim()) return;
  let entries = loadHistory().filter(e => e.cleaned !== cleaned);
  entries.unshift({
    id:          Date.now(),
    timestamp:   Date.now(),
    original,
    cleaned,
    originalLen: original.length,
    cleanedLen:  cleaned.length,
  });
  saveHistory(entries.slice(0, HISTORY_MAX));
  renderHistory();
}

function deleteHistoryEntry(id) {
  saveHistory(loadHistory().filter(e => e.id !== id));
  renderHistory();
}

function relativeTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  const m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (m < 60) return `${m} minute${m !== 1 ? 's' : ''} ago`;
  if (h < 24) return `${h} hour${h !== 1 ? 's' : ''} ago`;
  return `${d} day${d !== 1 ? 's' : ''} ago`;
}

function renderHistory() {
  const entries = loadHistory();

  if (entries.length === 0) {
    historyList.innerHTML = '<p class="history-empty">No sessions yet. Clean some text and it will appear here.</p>';
    btnClearHistory.style.visibility = 'hidden';
    return;
  }

  btnClearHistory.style.visibility = 'visible';
  historyList.innerHTML = entries.map(e => {
    const preview = e.cleaned.slice(0, PREVIEW_LENGTH).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const ellipsis = e.cleaned.length > PREVIEW_LENGTH ? '…' : '';
    const delta = e.originalLen - e.cleanedLen;
    const deltaLabel = delta > 0
      ? `−${delta.toLocaleString()} chars`
      : delta < 0 ? `+${Math.abs(delta).toLocaleString()} chars` : 'no size change';
    return `
      <div class="history-entry" data-id="${e.id}">
        <div class="history-entry-info">
          <div class="history-entry-preview">${preview}${ellipsis}</div>
          <div class="history-entry-meta">
            <span>${relativeTime(e.timestamp)}</span>
            <span>${e.cleanedLen.toLocaleString()} chars</span>
            <span>${deltaLabel}</span>
          </div>
        </div>
        <div class="history-entry-actions">
          <button class="btn-restore" data-id="${e.id}">Restore</button>
          <button class="btn-delete-entry" data-id="${e.id}" aria-label="Delete entry">×</button>
        </div>
      </div>`;
  }).join('');
}

function restoreHistoryEntry(id) {
  const entry = loadHistory().find(e => e.id === id);
  if (!entry) return;

  inputText.value  = entry.original;
  outputText.value = entry.cleaned;
  updateCount(inputText,  inputCount);
  updateCount(outputText, outputCount);

  btnShowDiff.disabled = false;
  btnDownload.disabled = false;

  if (!diffSection.hidden) renderDiff(entry.original, entry.cleaned);
  if (currentMode === 'lines') renderLineTable(entry.original, entry.cleaned);

  renderReport(entry.original);

  // Open advanced section if diff is showing so it stays visible
  if (!diffSection.hidden) advancedDetails.open = true;

  inputText.scrollIntoView({ behavior: 'smooth', block: 'center' });
  showFeedback('Session restored.');
}

historyList.addEventListener('click', (e) => {
  const id = parseInt(e.target.dataset.id, 10);
  if (isNaN(id)) return;
  if (e.target.classList.contains('btn-restore'))      restoreHistoryEntry(id);
  else if (e.target.classList.contains('btn-delete-entry')) deleteHistoryEntry(id);
});

btnClearHistory.addEventListener('click', () => {
  if (!confirm('Clear all saved sessions?')) return;
  saveHistory([]);
  renderHistory();
});

// -----------------------------------------------
// INIT
// -----------------------------------------------
updateCount(inputText,  inputCount);
updateCount(outputText, outputCount);
renderPresets();
renderRules();
renderHistory();
