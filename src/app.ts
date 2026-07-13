import { processTajweed, poetryEngine, scannerTawil, detecterMetre } from './tajweed-engine.js';

type CustomRule = {
  search: string;
  replace: string;
};

type SectionState = {
  fontSize: number;
  lineHeight: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  textAlign: 'left' | 'right' | 'justify';
  history?: string[];
  historyIdx?: number;
};

const STORAGE_KEY = 'tajweed_custom_rules';
let customRules: CustomRule[] = [];

function getElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Element introuvable : ${id}`);
  }
  return el as T;
}

async function loadRules(): Promise<void> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        customRules = parsed;
        renderRulesList();
        handleConvert();
        return;
      }
    } catch (e) {
      console.warn('Impossible de parser les règles en localStorage.', e);
    }
  }

  try {
    const response = await fetch('rules.json');
    if (response.ok) {
      const json = await response.json();
      if (Array.isArray(json) && json.length > 0) {
        customRules = json;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customRules));
        renderRulesList();
        handleConvert();
        return;
      }
    }
  } catch (e) {
    console.warn('Impossible de charger rules.json, utilisation de règles vides.');
  }

  customRules = [];
  renderRulesList();
  handleConvert();
}

function saveRulesToLocalStorage(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customRules));
  } catch (e) {
    console.warn('Impossible de sauvegarder les règles dans localStorage.', e);
  }
}

function renderRulesList(): void {
  const container = getElement<HTMLDivElement>('rulesListContainer');
  if (customRules.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:#aa9c88;">Aucune règle</div>';
    return;
  }

  let html = '';
  customRules.forEach((rule, index) => {
    html += `<div class="rule-item"><div class="rule-pattern arabic">🔍 ${escapeHtml(rule.search)} → ✨ ${escapeHtml(rule.replace)}</div><button class="rule-delete" data-index="${index}">✖</button></div>`;
  });
  container.innerHTML = html;

  document.querySelectorAll<HTMLButtonElement>('.rule-delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const idx = Number(btn.dataset.index);
      if (Number.isFinite(idx)) {
        await deleteRule(idx);
      }
    });
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char] ?? char));
}

async function addRule(search: string, replace: string): Promise<void> {
  if (!search.trim()) return;
  customRules.push({ search: search.trim(), replace: replace.trim() });
  renderRulesList();
  saveRulesToLocalStorage();
  handleConvert();
}

async function deleteRule(index: number): Promise<void> {
  customRules.splice(index, 1);
  renderRulesList();
  saveRulesToLocalStorage();
  handleConvert();
}

async function resetRules(): Promise<void> {
  if (confirm('Effacer toutes les règles ?')) {
    customRules = [];
    renderRulesList();
    saveRulesToLocalStorage();
    handleConvert();
  }
}

function handleConvert(): void {
  const raw = getElement<HTMLTextAreaElement>('inputText').value;
  const badgeGroup = getElement<HTMLDivElement>('metreBadgeGroup');
  const metreDisplay = getElement<HTMLSpanElement>('metreDisplay');

  if (!raw.trim()) {
    getElement<HTMLDivElement>('outputText').innerHTML = '';
    badgeGroup.style.display = 'none';
    return;
  }

  const processed = processTajweed(raw, { customRules });
  const colored = colorizeDiacritics(processed);
  getElement<HTMLDivElement>('outputText').innerHTML = colored;
  applyStyles(outputEl, sectionsState.output);

  badgeGroup.style.display = 'inline-flex';
  metreDisplay.textContent = '📜 Mètre : en cours…';

  const buyut = poetryEngine.parsePoemToBuyut(raw);
  if (buyut.length > 0 && buyut[0].sadr) {
    const premierBayt = buyut[0];
    if (premierBayt.ajuz) {
      const textAvecMarqueurs = `${premierBayt.sadr}\u200C${premierBayt.ajuz}`;
      const metre = detecterMetre(textAvecMarqueurs);
      metreDisplay.textContent = metre ? `📜 ${metre}` : '📜 Mètre : non reconnu';
    } else {
      const sadrPattern = scannerTawil(premierBayt.sadr, true);
      metreDisplay.textContent = sadrPattern.length > 0 ? '📜 Sadr (pas d\'Ajuz)' : '📜 Mètre : texte non reconnu';
    }
  } else {
    metreDisplay.textContent = '📜 Mètre : aucun vers détecté';
  }
}

const ALL_DIACRITICS = '[\u064B-\u0652\u0655-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED]';

function colorizeDiacritics(text: string): string {
  if (!text) return '';
  const escaped = text.replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] ?? m));
  const decomposed = escaped.normalize('NFD');
  return decomposed.replace(new RegExp(ALL_DIACRITICS, 'g'), (match) => `<span class="diacritic">${match}</span>`);
}

const sectionsState: { input: SectionState; output: SectionState } = {
  input: { fontSize: 22, lineHeight: '2.2', bold: false, italic: false, underline: false, textAlign: 'right', history: [], historyIdx: -1 },
  output: { fontSize: 50, lineHeight: '0.9', bold: false, italic: false, underline: false, textAlign: 'right' }
};

let currentTarget: 'input' | 'output' = 'input';

const inputEl = getElement<HTMLTextAreaElement>('inputText');
const outputEl = getElement<HTMLDivElement>('outputText');
const targetInput = getElement<HTMLButtonElement>('targetInputBtn');
const targetOutput = getElement<HTMLButtonElement>('targetOutputBtn');
const actUndo = getElement<HTMLButtonElement>('actionUndo');
const actRedo = getElement<HTMLButtonElement>('actionRedo');
const decSize = getElement<HTMLButtonElement>('actionDecSize');
const incSize = getElement<HTMLButtonElement>('actionIncSize');
const sizeVal = getElement<HTMLSpanElement>('actionSizeVal');
const decLH = getElement<HTMLButtonElement>('actionDecLineHeight');
const incLH = getElement<HTMLButtonElement>('actionIncLineHeight');
const sliderLH = getElement<HTMLInputElement>('actionLineHeightSlider');
const lhVal = getElement<HTMLSpanElement>('actionLineHeightVal');
const boldBtn = getElement<HTMLButtonElement>('actionBold');
const italicBtn = getElement<HTMLButtonElement>('actionItalic');
const underlineBtn = getElement<HTMLButtonElement>('actionUnderline');
const alignR = getElement<HTMLButtonElement>('actionAlignRight');
const alignJ = getElement<HTMLButtonElement>('actionJustify');
const alignL = getElement<HTMLButtonElement>('actionAlignLeft');

function applyStyles(element: HTMLElement, state: SectionState): void {
  element.style.fontSize = `${state.fontSize}px`;
  element.style.lineHeight = state.lineHeight;
  element.style.fontWeight = state.bold ? 'bold' : 'normal';
  element.style.fontStyle = state.italic ? 'italic' : 'normal';
  element.style.textDecoration = state.underline ? 'underline' : 'none';
  element.style.textAlign = state.textAlign;
}

function switchTarget(target: 'input' | 'output'): void {
  currentTarget = target;
  if (currentTarget === 'input') {
    targetInput.classList.add('active');
    targetOutput.classList.remove('active');
    getElement<HTMLDivElement>('paneInput').classList.add('targeted');
    getElement<HTMLDivElement>('paneOutput').classList.remove('targeted');
    actUndo.disabled = false;
    actRedo.disabled = false;
  } else {
    targetInput.classList.remove('active');
    targetOutput.classList.add('active');
    getElement<HTMLDivElement>('paneInput').classList.remove('targeted');
    getElement<HTMLDivElement>('paneOutput').classList.add('targeted');
    actUndo.disabled = true;
    actRedo.disabled = true;
  }
  syncToolbar();
}

function syncToolbar(): void {
  const state = sectionsState[currentTarget];
  sizeVal.textContent = String(state.fontSize);
  sliderLH.value = state.lineHeight;
  lhVal.textContent = state.lineHeight;
  boldBtn.classList.toggle('active', state.bold);
  italicBtn.classList.toggle('active', state.italic);
  underlineBtn.classList.toggle('active', state.underline);
  [alignR, alignJ, alignL].forEach((button) => button.classList.remove('active'));
  if (state.textAlign === 'right') alignR.classList.add('active');
  if (state.textAlign === 'justify') alignJ.classList.add('active');
  if (state.textAlign === 'left') alignL.classList.add('active');
  applyStyleToCurrent();
}

function applyStyleToCurrent(): void {
  const element = currentTarget === 'input' ? inputEl : outputEl;
  applyStyles(element, sectionsState[currentTarget]);
}

incSize.onclick = () => {
  const state = sectionsState[currentTarget];
  if (state.fontSize < 120) {
    state.fontSize += state.fontSize >= 50 ? 5 : 2;
    if (state.fontSize > 120) state.fontSize = 120;
    sizeVal.textContent = String(state.fontSize);
    applyStyleToCurrent();
  }
};

decSize.onclick = () => {
  const state = sectionsState[currentTarget];
  if (state.fontSize > 12) {
    state.fontSize -= state.fontSize > 50 ? 5 : 2;
    if (state.fontSize < 12) state.fontSize = 12;
    sizeVal.textContent = String(state.fontSize);
    applyStyleToCurrent();
  }
};

function setLH(value: number): void {
  const n = Math.min(5, Math.max(0.1, value));
  sectionsState[currentTarget].lineHeight = n.toFixed(1);
  sliderLH.value = sectionsState[currentTarget].lineHeight;
  lhVal.textContent = sectionsState[currentTarget].lineHeight;
  applyStyleToCurrent();
}

incLH.onclick = () => setLH(parseFloat(sectionsState[currentTarget].lineHeight) + 0.1);
decLH.onclick = () => setLH(parseFloat(sectionsState[currentTarget].lineHeight) - 0.1);
sliderLH.oninput = () => setLH(parseFloat(sliderLH.value));

boldBtn.onclick = () => { sectionsState[currentTarget].bold = !sectionsState[currentTarget].bold; syncToolbar(); };
italicBtn.onclick = () => { sectionsState[currentTarget].italic = !sectionsState[currentTarget].italic; syncToolbar(); };
underlineBtn.onclick = () => { sectionsState[currentTarget].underline = !sectionsState[currentTarget].underline; syncToolbar(); };

function clearAlign(): void {
  [alignR, alignJ, alignL].forEach((button) => button.classList.remove('active'));
}

alignR.onclick = () => { clearAlign(); alignR.classList.add('active'); sectionsState[currentTarget].textAlign = 'right'; applyStyleToCurrent(); };
alignJ.onclick = () => { clearAlign(); alignJ.classList.add('active'); sectionsState[currentTarget].textAlign = 'justify'; applyStyleToCurrent(); };
alignL.onclick = () => { clearAlign(); alignL.classList.add('active'); sectionsState[currentTarget].textAlign = 'left'; applyStyleToCurrent(); };

function saveHistory(): void {
  const state = sectionsState.input;
  if (state.historyIdx !== undefined && state.history && state.historyIdx < state.history.length - 1) {
    state.history = state.history.slice(0, state.historyIdx + 1);
  }
  state.history = state.history || [];
  state.history.push(inputEl.value);
  state.historyIdx = (state.historyIdx ?? -1) + 1;
}

function undo(): void {
  if (currentTarget !== 'input') return;
  const state = sectionsState.input;
  if (state.history && state.historyIdx !== undefined && state.historyIdx > 0) {
    state.historyIdx -= 1;
    inputEl.value = state.history[state.historyIdx];
    handleConvert();
  }
}

function redo(): void {
  if (currentTarget !== 'input') return;
  const state = sectionsState.input;
  if (state.history && state.historyIdx !== undefined && state.historyIdx < state.history.length - 1) {
    state.historyIdx += 1;
    inputEl.value = state.history[state.historyIdx];
    handleConvert();
  }
}

const btnConvert = getElement<HTMLButtonElement>('btnConvert');
const btnCopyResult = getElement<HTMLButtonElement>('btnCopyResult');
const btnAddRule = getElement<HTMLButtonElement>('btnAddRule');
const btnResetRules = getElement<HTMLButtonElement>('btnResetRules');

btnConvert.addEventListener('click', handleConvert);
btnCopyResult.addEventListener('click', () => {
  const temp = document.createElement('div');
  temp.innerHTML = outputEl.innerHTML;
  navigator.clipboard.writeText(temp.textContent || '');
});
btnAddRule.addEventListener('click', async () => {
  await addRule(getElement<HTMLInputElement>('ruleSearchInput').value, getElement<HTMLInputElement>('ruleReplaceInput').value);
  getElement<HTMLInputElement>('ruleSearchInput').value = '';
  getElement<HTMLInputElement>('ruleReplaceInput').value = '';
});
btnResetRules.addEventListener('click', resetRules);
targetInput.onclick = () => switchTarget('input');
targetOutput.onclick = () => switchTarget('output');
inputEl.addEventListener('input', () => {
  saveHistory();
  handleConvert();
});

applyStyleToCurrent();
applyStyles(outputEl, sectionsState.output);
inputEl.value = 'قَدْ أَفْلَحَ الْمُؤْمِنُونَ وَالْقَانِتُونَ وَالْفَائِزُونَ مِنْ قَبْلِ';
sectionsState.input.history = [inputEl.value];
sectionsState.input.historyIdx = 0;

await loadRules();
