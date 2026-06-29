// ==========================================================================
// MOTEUR TAJWEED SÉNÉGALAIS ÉPURÉ (MODULE ISOLÉ) - VERSION 4.4 SÉCURISÉE
// ==========================================================================

const UW = {
    SUKUN: '\u0652', 
    TANWEEN_FATHA: '\u064B', TANWEEN_DAMMA: '\u064C', TANWEEN_KASRA: '\u064D',
    ALIF: '\u0627', NOON: '\u0646', WAW: '\u0648', YA: '\u064A', ALIF_MAKSURA: '\u0649',
    MADDA_SIGN: '\u0653', // ٓ Vague de prolongation
    OPEN_FATHATAYN: '\u08F0',  // ࣰ Tanwīn Fath ouvert
    OPEN_DAMMATAYN: '\u08F1',  // ࣱ Tanwīn Damma ouvert
    OPEN_KASRATAYN: '\u08F2',  // ࣲ Tanwīn Kasra ouvert
    PERIOD: '.',              // . Un seul point de contrôle pour la ligature
    ALIF_FINAL: '\uFE8E'       // ﺎ Alif relié
};

const ALL_DIACRITICS = '[\u064B-\u0652\u0655-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u08F0-\u08F2.]';
const rawDiacriticsPattern = ALL_DIACRITICS.replace('[', '').replace(']', '');

const IKHFĀ_LETTERS = ['ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك'];
const IZHĀR_LETTERS = ['ء', 'أ', 'إ', 'ا', 'هـ', 'ع', 'ح', 'غ', 'خ'];
const PROLONGATION_LETTERS = ['ا', 'ى', '\uFEF0', 'و', 'ي'];
const MADDAH_TRIGGERS = ['ء', 'أ', 'إ', '\u0651', '\u0652'];

// --- AL-IKHFĀ' SÉNÉGALAIS OPTIMISÉ (SANS DOUBLONS) ---
function applyIkhfaSenegal(text) {
    const ikhfaClass = IKHFĀ_LETTERS.join('');
    let r = text;
    
    // 1. FATHATAYN PERMUTATION (ًا) -> Alif + Tanwīn standard + Un seul point (.)
    const ikhfaFathaPermutRegex = new RegExp(
        `(${UW.TANWEEN_FATHA})(${UW.ALIF}|${UW.ALIF_FINAL})(([\\s${rawDiacriticsPattern}]*)([${ikhfaClass}]))`, 
        'g'
    );
    r = r.replace(ikhfaFathaPermutRegex, `$2${UW.TANWEEN_FATHA}${UW.PERIOD}$3`);
    
    // 2. DAMMATAYN PERMUTATION (ٌا) -> Alif + Tanwīn ouvert + Un seul point (.)
    const ikhfaDammaPermutRegex = new RegExp(
        `(${UW.TANWEEN_DAMMA})(${UW.ALIF}|${UW.ALIF_FINAL})(([\\s${rawDiacriticsPattern}]*)([${ikhfaClass}]))`, 
        'g'
    );
    r = r.replace(ikhfaDammaPermutRegex, `$2${UW.OPEN_DAMMATAYN}${UW.PERIOD}$3`);
    
    // 3. Sécurité pour les cas déjà bien ordonnés (اً ou اٌ) devant Ikhfā'
    const ikhfaFathaStandardRegex = new RegExp(`(${UW.ALIF}|${UW.ALIF_FINAL})(${UW.TANWEEN_FATHA})(([\\s${rawDiacriticsPattern}]*)([${ikhfaClass}]))`, 'g');
    r = r.replace(ikhfaFathaStandardRegex, (match, alif, fatha, reste) => {
        if (reste.startsWith(UW.PERIOD)) return match; // Évite les doublons
        return `${alif}${fatha}${UW.PERIOD}${reste}`;
    });

    const ikhfaDammaStandardRegex = new RegExp(`(${UW.ALIF}|${UW.ALIF_FINAL})(${UW.TANWEEN_DAMMA}|${UW.OPEN_DAMMATAYN})(([\\s${rawDiacriticsPattern}]*)([${ikhfaClass}]))`, 'g');
    r = r.replace(ikhfaDammaStandardRegex, (match, alif, damma, reste) => {
        if (reste.startsWith(UW.PERIOD)) return `${alif}${UW.OPEN_DAMMATAYN}${reste}`;
        return `${alif}${UW.OPEN_DAMMATAYN}${UW.PERIOD}${reste}`;
    });
    
    // 4. Traitements Ikhfā' génériques restants (sans Alif)
    r = r.replace(new RegExp(`${UW.TANWEEN_FATHA}(\\s*)([${ikhfaClass}])`, 'g'), `${UW.OPEN_FATHATAYN}$1$2`);
    r = r.replace(new RegExp(`${UW.NOON}${UW.SUKUN}(\\s*)([${ikhfaClass}])`, 'g'), `${UW.NOON}$1$2`);
    r = r.replace(new RegExp(`${UW.TANWEEN_DAMMA}(\\s*)([${ikhfaClass}])`, 'g'), `${UW.OPEN_DAMMATAYN}$1$2`);
    r = r.replace(new RegExp(`${UW.TANWEEN_KASRA}(\\s*)([${ikhfaClass}])`, 'g'), `${UW.OPEN_KASRATAYN}$1$2`);
    return r;
}

// --- AL-IZHĀR OPTIMISÉ (SANS DOUBLONS) ---
function applyIzhaar(text) {
    const izharClass = IZHĀR_LETTERS.join('');
    let result = text;

    // 1. Gestion du Noon Sakin standard
    result = result.replace(new RegExp(`${UW.NOON}(\\s*)([${izharClass}])`, 'g'), (match, espaces, lettreSuivante) => {
        if (!match.includes(UW.SUKUN)) return `${UW.NOON}${UW.SUKUN}${espaces}${lettreSuivante}`;
        return match;
    });

    // 2. IZHĀR FATHATAYN PERMUTATION (ًا) -> Devient Alif + Tanwīn standard (اً) devant Izhār
    const izharFathaPermutRegex = new RegExp(
        `(${UW.TANWEEN_FATHA})(${UW.ALIF}|${UW.ALIF_FINAL})(([\\s${rawDiacriticsPattern}]*)([${izharClass}]))`, 
        'g'
    );
    result = result.replace(izharFathaPermutRegex, `$2${UW.TANWEEN_FATHA}$3`);

    // 3. IZHĀR DAMMATAYN PERMUTATION (ٌا ou ࣱا) -> Devient Alif + Damma Standard + Un seul point (.)
    const izharDammaPermutRegex = new RegExp(
        `(${UW.TANWEEN_DAMMA}|${UW.OPEN_DAMMATAYN})(${UW.ALIF}|${UW.ALIF_FINAL})(([\\s${rawDiacriticsPattern}]*)([${izharClass}]))`, 
        'g'
    );
    result = result.replace(izharDammaPermutRegex, (match, damma, alif, reste) => {
        // Si le reste contient déjà un point technique, on ne le double pas
        if (reste.startsWith(UW.PERIOD)) return `${alif}${UW.TANWEEN_DAMMA}${reste}`;
        return `${alif}${UW.TANWEEN_DAMMA}${UW.PERIOD}${reste}`;
    });

    // 4. Réajustements si l'ordre initial était déjà correct sur l'Alif
    const izharFathataynRegex = new RegExp(`(${UW.ALIF}|${UW.ALIF_FINAL})(${UW.OPEN_FATHATAYN})(([\\s${rawDiacriticsPattern}]*)([${izharClass}]))`, 'g');
    result = result.replace(izharFathataynRegex, `$1${UW.TANWEEN_FATHA}$3`);

    const izharDammataynStandardRegex = new RegExp(`(${UW.ALIF}|${UW.ALIF_FINAL})(${UW.TANWEEN_DAMMA}|${UW.OPEN_DAMMATAYN})(([\\s${rawDiacriticsPattern}]*)([${izharClass}]))`, 'g');
    result = result.replace(izharDammataynStandardRegex, (match, alif, damma, reste) => {
        if (reste.startsWith(UW.PERIOD)) return `${alif}${UW.TANWEEN_DAMMA}${reste}`;
        return `${alif}${UW.TANWEEN_DAMMA}${UW.PERIOD}${reste}`;
    });

    // 5. IZHĀR POUR KASRATAYN
    const izharKasrataynRegex = new RegExp(`(${UW.OPEN_KASRATAYN})(([\\s${rawDiacriticsPattern}]*)([${izharClass}]))`, 'g');
    result = result.replace(izharKasrataynRegex, `${UW.TANWEEN_KASRA}$2`);

    return result;
}

// --- LA VAGUE DE PROLONGATION GLOBALE ---
function applyGlobalMaddah(text) {
    const prolongationClass = PROLONGATION_LETTERS.join('');
    const triggerClass = MADDAH_TRIGGERS.join('');
    const regex = new RegExp(`([${prolongationClass}])(\\s*)([${triggerClass}])`, 'g');

    return text.replace(regex, (match, lettreProlongation, espaces, declencheur) => {
        if (declencheur === '\u0651' || declencheur === UW.SUKUN) {
            return `${lettreProlongation}${UW.MADDA_SIGN}${espaces}${declencheur}`;
        }
        if (declencheur === 'أ' || declencheur === 'إ') {
            return `${lettreProlongation}${espaces}${declencheur}${UW.MADDA_SIGN}`;
        }
        return `${lettreProlongation}${UW.MADDA_SIGN}${espaces}${declencheur}`;
    });
}

// --- COLORATION ---
export function colorize(text) {
    if (!text) return '';
    let escaped = text.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
    let decomposed = escaped.normalize('NFD');
    return decomposed.replace(new RegExp(ALL_DIACRITICS, 'g'), match => `<span class="diacritic">${match}</span>`);
}

// --- PIPELINE PRINCIPAL DE RENDU ---
export function processTajweed(rawText, options = { runIzhaar: true, customRules: [] }) {
    if (!rawText.trim()) return '';
    let text = rawText;

    // --- SÉCURITÉ ANTI-DOUBLONS ---
    // On nettoie d'abord les points résiduels accidentels pour travailler proprement
    text = text.replace(/\.{2,}/g, '.');

    // 1. Ikhfa
    text = applyIkhfaSenegal(text);

    // 2. Izhar
    if (options.runIzhaar) {
        text = applyIzhaar(text);
    }

    // 3. Maddah systématique
    text = applyGlobalMaddah(text);

    // Nettoyage final de sécurité (au cas où deux règles isolées auraient quand même créé un double point)
    text = text.replace(/\.{2,}/g, '.');

    // 4. Règles manuelles / personnalisées de l'utilisateur
    if (options.customRules && options.customRules.length > 0) {
        for (let rule of options.customRules) {
            const regex = new RegExp(rule.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            text = text.replace(regex, rule.replace);
        }
    }

    return text;
}
