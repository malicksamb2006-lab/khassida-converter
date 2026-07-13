// ==========================================================================
// MOTEUR TAJWEED SÉNÉGALAIS & SCANSION POÉTIQUE - VERSION FINALE
// Avec détection automatique sur l'ensemble du poème (parcours des vers)
// ==========================================================================

type CustomRule = { search: string; replace: string };

type TajweedOptions = { customRules?: CustomRule[] };

type Bayt = { sadr: string; ajuz: string; originalLine: string };

type DetectorResult = { [key: string]: boolean };

// ==================== PARTIE 1 : TAJWEED (EXISTANT) ====================

// --- CONFIGURATION DES CARACTÈRES UNICODE (Dictionnaire UW) ---
const UW = {
    SUKUN: '\u0652',
    TANWEEN_FATHA: '\u064B', TANWEEN_DAMMA: '\u064C', TANWEEN_KASRA: '\u064D',
    FATHA: '\u064E',
    DAMMA: '\u064F',
    KASRA: '\u0650',
    ALIF: '\u0627', NOON: '\u0646', WAW: '\u0648', YA: '\u064A', ALIF_MAKSURA: '\u0649',
    MADDA_SIGN: '\u0653',
    OPEN_FATHATAYN: '\u08F0',
    OPEN_DAMMATAYN: '\u08F1',
    OPEN_KASRATAYN: '\u08F2',
    SMALL_MEEM: '\u06E2',
    PERIOD: '.',
    ALIF_FINAL: '\uFE8E'
};

const OPEN_FATHATAYN_DOT = String.fromCodePoint(0x08F0, 0x002E);
const OPEN_DAMMATAYN_DOT = String.fromCodePoint(0x08F1, 0x002E);
const OPEN_KASRATAYN_CHAR = String.fromCodePoint(0x08F2);
const SMALL_MEEM_CHAR = String.fromCodePoint(0x06E2);

const rawDiacritics = '\u064B-\u0652\u0655-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u08F0-\u08F2';
const SPATIAL_BUFFER = '[\\s❖' + rawDiacritics + ']*';
const SPATIAL_NO_DIACRITICS = '[\\s❖]*';

const IKHFĀ_LETTERS = ['ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك'];
const IDGHĀM_LETTERS = ['ي', 'ر', 'م', 'ل', 'و', 'ن'];
const IQLĀB_LETTERS = ['ب'];
const PROLONGATION_LETTERS = ['ا', 'ى', '\uFEF0', 'و', 'ي'];
const MADDAH_TRIGGERS = ['ء', 'أ', 'إ', '\u0651', '\u0652'];
const SOLAR_LETTERS = ['ت', 'ث', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ل', 'ن'];
const LUNAR_LETTERS = ['ء', 'أ', 'إ', 'ا', 'ب', 'ج', 'ح', 'خ', 'ع', 'غ', 'ف', 'ق', 'ك', 'م', 'هـ', 'و', 'ي'];
const SHADDAH = '\u0651';
const LAM = '\u0644';

function preparerTanweenSurAlif(text: string) {
    let r = text;
    const patternPreFatha = '([^\\s' + rawDiacritics + '])(' + UW.TANWEEN_FATHA + '|' + UW.OPEN_FATHATAYN + ')(' + UW.ALIF + '|' + UW.ALIF_FINAL + ')';
    r = r.replace(new RegExp(patternPreFatha, 'g'), `$1$3${OPEN_FATHATAYN_DOT}`);

    const patternPreDamma = '([^\\s' + rawDiacritics + '])(' + UW.TANWEEN_DAMMA + '|' + UW.OPEN_DAMMATAYN + ')(' + UW.ALIF + '|' + UW.ALIF_FINAL + ')';
    r = r.replace(new RegExp(patternPreDamma, 'g'), `$1$3${OPEN_DAMMATAYN_DOT}`);
    return r;
}

function appliquerNettoyageUniversel(text: string) {
    let r = text;
    const exceptions = {
        '  ': '___DOUBLE_SPACE___',
        '\t\t': '___DOUBLE_TAB___',
        'لل': '___DOUBLE_LAM___',
        'يي': '___DOUBLE_YA___',
        'وو': '___DOUBLE_WAW___'
    };

    const mapExceptions = new Map<string, string>();
    Object.entries(exceptions).forEach(([key, placeholder]) => {
        if (r.includes(key)) {
            r = r.split(key).join(placeholder);
            mapExceptions.set(placeholder, key);
        }
    });

    const diacritiquesDoublons = ['\u0651', '\u0652', '\u064E', '\u064F', '\u0650', '.', 'ـ'];
    diacritiquesDoublons.forEach((char) => {
        const safeChar = char === '.' ? '\\.' : char;
        const regex = new RegExp(`${safeChar}{2,}`, 'g');
        r = r.replace(regex, char);
    });

    r = r.replace(/([^_\s])\1+/g, '$1');

    mapExceptions.forEach((originalValue, placeholder) => {
        r = r.split(placeholder).join(originalValue);
    });
    return r;
}

function reorganiserDiacritiques(text: string) {
    const lettreArabe = '[\u0621-\u064A\u066E-\u06D5\u06D6-\u06ED]';
    const diacritiques = '[\u064B-\u0652\u0655-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u08F0-\u08F2]';
    const regex = new RegExp(`(${lettreArabe})(${diacritiques}+)`, 'g');
    return text.replace(regex, (match, lettre, diacSeq) => {
        const shaddas = diacSeq.match(/\u0651/g) || [];
        const autres = diacSeq.replace(/\u0651/g, '').split('');
        autres.sort();
        const newDiacSeq = shaddas.concat(autres).join('');
        return lettre + newDiacSeq;
    });
}

function applyIkhfaSenegal(text: string) {
    const ikhfaClass = IKHFĀ_LETTERS.join('');
    let r = text;

    const patternFatha = `(${UW.ALIF}|${UW.ALIF_FINAL})(${UW.TANWEEN_FATHA}|${UW.OPEN_FATHATAYN})(\\${UW.PERIOD})?(([${SPATIAL_BUFFER}])([${ikhfaClass}]))`;
    r = r.replace(new RegExp(patternFatha, 'g'), `${UW.ALIF}${OPEN_FATHATAYN_DOT}$4`);

    const patternDamma = `(${UW.ALIF}|${UW.ALIF_FINAL})(${UW.TANWEEN_DAMMA}|${UW.OPEN_DAMMATAYN})(\\${UW.PERIOD})?(([${SPATIAL_BUFFER}])([${ikhfaClass}]))`;
    r = r.replace(new RegExp(patternDamma, 'g'), `${UW.ALIF}${OPEN_DAMMATAYN_DOT}$4`);

    r = r.replace(new RegExp(`${UW.NOON}${UW.SUKUN}(${SPATIAL_NO_DIACRITICS})([${ikhfaClass}])`, 'g'), `${UW.NOON}$1$2`);
    r = r.replace(new RegExp(`${UW.TANWEEN_KASRA}(${SPATIAL_NO_DIACRITICS})([${ikhfaClass}])`, 'g'), `${OPEN_KASRATAYN_CHAR}$1$2`);

    return r;
}

function applyIdgham(text: string) {
    const idghamClass = IDGHĀM_LETTERS.join('');
    let r = text;

    const patternFatha = `(${UW.ALIF}|${UW.ALIF_FINAL})(${UW.TANWEEN_FATHA}|${UW.OPEN_FATHATAYN})(\\${UW.PERIOD})?(([${SPATIAL_BUFFER}])([${idghamClass}]))`;
    r = r.replace(new RegExp(patternFatha, 'g'), `${UW.ALIF}${OPEN_FATHATAYN_DOT}$4`);

    const patternDamma = `(${UW.ALIF}|${UW.ALIF_FINAL})(${UW.TANWEEN_DAMMA}|${UW.OPEN_DAMMATAYN})(\\${UW.PERIOD})?(([${SPATIAL_BUFFER}])([${idghamClass}]))`;
    r = r.replace(new RegExp(patternDamma, 'g'), `${UW.ALIF}${OPEN_DAMMATAYN_DOT}$4`);

    const patternKasra = new RegExp(`(${UW.TANWEEN_KASRA})([\\s❖${rawDiacritics}]*)(${`[${idghamClass}]`})`, 'g');
    r = r.replace(patternKasra, `${OPEN_KASRATAYN_CHAR}$2$3`);

    const patternNoon = `${UW.NOON}${UW.SUKUN}(([${SPATIAL_BUFFER}])([${idghamClass}]))`;
    r = r.replace(new RegExp(patternNoon, 'g'), '$1');

    return r;
}

function applyIqlab(text: string) {
    const iqlabClass = IQLĀB_LETTERS.join('');
    let r = text;

    const patternFatha = `(${UW.ALIF}|${UW.ALIF_FINAL})(${UW.TANWEEN_FATHA}|${UW.OPEN_FATHATAYN})(\\${UW.PERIOD})?(([${SPATIAL_BUFFER}])([${iqlabClass}]))`;
    r = r.replace(new RegExp(patternFatha, 'g'), `${UW.ALIF}${UW.FATHA}${SMALL_MEEM_CHAR}${UW.PERIOD}$4`);

    const patternDamma = `(${UW.ALIF}|${UW.ALIF_FINAL})(${UW.TANWEEN_DAMMA}|${UW.OPEN_DAMMATAYN})(\\${UW.PERIOD})?(([${SPATIAL_BUFFER}])([${iqlabClass}]))`;
    r = r.replace(new RegExp(patternDamma, 'g'), `${UW.ALIF}${UW.DAMMA}${SMALL_MEEM_CHAR}${UW.PERIOD}$4`);

    r = r.replace(new RegExp(`${UW.NOON}${UW.SUKUN}(${SPATIAL_NO_DIACRITICS})([${iqlabClass}])`, 'g'), `${SMALL_MEEM_CHAR}$1$2`);
    r = r.replace(new RegExp(`${UW.TANWEEN_KASRA}(${SPATIAL_NO_DIACRITICS})([${iqlabClass}])`, 'g'), `${UW.KASRA}${SMALL_MEEM_CHAR}$1$2`);

    return r;
}

function applySolarLetters(text: string) {
    const solarClass = SOLAR_LETTERS.join('');
    let r = text;
    const pattern = '(' + UW.ALIF + '|' + UW.ALIF_FINAL + ')' + LAM + UW.SUKUN + '?([' + solarClass + '])([\\u064E\\u064U\\u0650]?)';
    r = r.replace(new RegExp(pattern, 'g'), (match, alif, lettreSolaire, voyelle) => {
        if (voyelle === SHADDAH || match.includes(SHADDAH)) return `${alif}${LAM}${lettreSolaire}${voyelle}`;
        return `${alif}${LAM}${lettreSolaire}${SHADDAH}${voyelle}`;
    });
    return r;
}

function applyLunarLetters(text: string) {
    const lunarClass = LUNAR_LETTERS.join('');
    let r = text;
    r = r.replace(new RegExp(`(${UW.ALIF}|${UW.ALIF_FINAL})${LAM}(?!${UW.SUKUN})([${lunarClass}])`, 'g'), `$1${LAM}${UW.SUKUN}$2`);
    r = r.replace(new RegExp(`(${UW.ALIF}|${UW.ALIF_FINAL})${LAM}${UW.SUKUN}([${lunarClass}])${SHADDAH}`, 'g'), `$1${LAM}${UW.SUKUN}$2`);
    return r;
}

function applyGlobalMaddah(text: string) {
    const prolongationClass = PROLONGATION_LETTERS.join('');
    const triggerClass = MADDAH_TRIGGERS.join('');
    let result = text.replace(new RegExp(`([${prolongationClass}])(\\s*)([${triggerClass}])`, 'g'), (match, lettreProlongation, espaces, declencheur) => {
        if (declencheur === '\u0651' || declencheur === UW.SUKUN) return `${lettreProlongation}${UW.MADDA_SIGN}${espaces}${declencheur}`;
        if (declencheur === 'أ' || declencheur === 'إ') return `${lettreProlongation}${espaces}${declencheur}${UW.MADDA_SIGN}`;
        return `${lettreProlongation}${UW.MADDA_SIGN}${espaces}${declencheur}`;
    });
    return result.replace(/([\u064E[\u0621-\u064A])[\u0653]/g, '$1').replace(/غَيْ[\u0653]ْ?ر/g, 'غَيْر');
}

class PoetryTajweedEngine {
    buhurRegistry: { [key: string]: string };

    constructor() {
        this.buhurRegistry = {
            'طويل': 'Al-Tawīl (الطَّوِيل)',
            'مديد': 'Al-Madīd (المَدِيد)',
            'بسيط': 'Al-Basīt (البَسِيط)',
            'وافر': 'Al-Wāfir (الوَافِر)',
            'كامل': 'Al-Kāmil (الكامِل)',
            'هزج': 'Al-Hazaj (الهَزَج)',
            'رجز': 'Al-Rajaz (الرَّجَز)',
            'رمل': 'Al-Ramal (الرَّمَل)',
            'منسرح': 'Al-Munsarih (المُنْسَرِح)',
            'خفيف': 'Al-Khafīf (الخَفِيف)',
            'مضارع': "Al-Mudāri' (المُضَارِع)",
            'مقتضب': 'Al-Muqtadab (المُقْتَضَب)',
            'مجتث': 'Al-Mujtath (المُجْتَثّ)',
            'متقارب': 'Al-Mutaqārib (المُتَقَارِب)',
            'متدارك': 'Al-Mutadārak (المُتَدَارَك)',
            'محدث': 'Al-Muḥdath (المُحْدَث)'
        };
    }

    parsePoemToBuyut(rawText: string) {
        return rawText.split(/\n+/).filter((l) => l.trim()).map((line) => {
            let sadr = line.trim();
            let ajuz = '';
            if (line.includes('\t')) {
                [sadr, ajuz] = line.split('\t').map((p) => p.trim());
            } else if (line.includes('  ')) {
                [sadr, ajuz] = line.split(/\s{2,}/).map((p) => p.trim());
            }
            return { sadr, ajuz, originalLine: line };
        });
    }

    processTajweedTransversal(rawText: string, tajweedEngineCallback: (text: string) => string) {
        return this.parsePoemToBuyut(rawText).map((bayt) => {
            if (!bayt.ajuz) return tajweedEngineCallback(bayt.sadr);
            const unifiedText = `${bayt.sadr} ❖ ${bayt.ajuz}`;
            const processed = tajweedEngineCallback(unifiedText);
            const unified = processed.split(' ❖ ');
            return `${unified[0] || ''}\t\t${unified[1] || ''}`;
        }).join('\n');
    }
}

const poetryEngine = new PoetryTajweedEngine();

export function processTajweed(rawText: string, options: TajweedOptions = { customRules: [] }) {
    if (!rawText || !rawText.trim()) return '';

    return poetryEngine.processTajweedTransversal(rawText, function (text: string) {
        text = text.replace(/\.{2,}/g, '.');
        text = preparerTanweenSurAlif(text);

        text = applyIkhfaSenegal(text);
        text = applyIdgham(text);
        text = applyIqlab(text);
        text = applySolarLetters(text);
        text = applyLunarLetters(text);
        text = applyGlobalMaddah(text);

        text = text.replace(/ي[\u0640\.]+/g, 'ي')
                   .replace(/[\u0640\.]+(?=ا)/g, '')
                   .replace(/\.{2,}/g, '.');

        text = appliquerNettoyageUniversel(text);

        if (options.customRules && Array.isArray(options.customRules)) {
            options.customRules.forEach((rule) => {
                if (rule.search && rule.replace) {
                    const safeSearch = rule.search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                    text = text.replace(new RegExp(safeSearch, 'g'), rule.replace);
                }
            });
        }

        text = reorganiserDiacritiques(text);
        text = text.normalize('NFC');

        text = text.replace(/بِسْمِ\s+اللَّـ?هِ\s+الرَّحْمَنِ\s+الرَّحِيمِ/g, 'بِسْمِ اللَّـِه الرَّحْمَـٰنِ الرَّحِيمِ');
        text = text.replace(/بِسْمِ\s+اللَّـ?هـِ\s+الرَّحْمَنِ\s+الرَّحِيمِ/g, 'بِسْمِ اللَّـِه الرَّحْمَـٰنِ الرَّحِيمِ');

        return text.replace(/الرَّحْمَنِ/g, 'الرَّحْمَـٰنِ');
    });
}

function scannerTawil(text: string, isSadr = true) {
    if (!text) return '';

    let clean = text.replace(/[\u200B\u200C]/g, '');
    clean = clean.replace(/[\u200E\u200F\u00A0]/g, '');
    clean = clean.replace(/[\u064B-\u0652\u0655-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u08F0-\u08F2]/g, '');
    clean = clean.replace(/[،؛؟!؟.,:;()\[\]{}<>«»\s❖]/g, ' ')
                 .replace(/\s+/g, ' ')
                 .trim();

    clean = clean
        .replace(/آ/g, 'ا')
        .replace(/أ/g, 'ا')
        .replace(/إ/g, 'ا')
        .replace(/ٱ/g, 'ا')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه');

    clean = clean.replace(/[^ء-ي\s]/g, '');

    let pattern = '';
    const prolongations = ['ا', 'و', 'ي'];
    const mots = clean.split(/\s+/);

    for (const mot of mots) {
        if (!mot) continue;
        let i = 0;
        while (i < mot.length) {
            const char = mot[i];
            const nextChar = mot[i + 1] || '';
            if (prolongations.includes(char)) {
                pattern += '1';
                i++;
                continue;
            }
            if (prolongations.includes(nextChar)) {
                pattern += '1';
                i += 2;
                continue;
            }
            pattern += '0';
            i++;
        }
    }

    return pattern;
}

function nettoyerTexte(text: string) {
    if (!text) return '';
    return text
        .replace(/[\u200B\u200C\u200E\u200F\u00A0]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

const TAWIL_CONFIG = {
    tam: {
        sadr: /^11010?(1101010|110110)11010?110110$/,
        ajuz: /^11010?(1101010|110110)11010?(1101010|110110|11010)$/
    }
};

const MADID_CONFIG = {
    majzu: {
        sadr: /^((1011010|1111010)(10110|11110)(1011010|1111010|101100|10110))$/,
        ajuz: /^((1011010|1111010)(10110|11110)(1011010|1111010|101100|10110))$/
    }
};

const BASIT_CONFIG = {
    tam: {
        sadr: /^(1010110|1110110)(10110|11110)(1010110|1110110)(11110)$/,
        ajuz: /^(1010110|1110110)(10110|11110)(1010110|1110110)(11110|10110)$/
    },
    majzu: {
        sadr: /^(1010110|1110110)(10110|11110)(1010110|1110110)$/,
        ajuz: /^(1010110|1110110)(10110|11110)(1010110|1110110)$/
    }
};

const WAFIR_CONFIG = {
    tam: {
        sadr: /^(1101110|1101010)(1101110|1101010)(11010)$/,
        ajuz: /^(1101110|1101010)(1101110|1101010)(11010)$/
    },
    majzu: {
        sadr: /^(1101110|1101010)(1101110|1101010)$/,
        ajuz: /^(1101110|1101010)(1101110|1101010)$/
    }
};

const KAMIL_CONFIG = {
    tam: {
        sadr: /^(1110110|1010110)(1110110|1010110)(1110110|1010110|111010|101010|11110|10110)$/,
        ajuz: /^(1110110|1010110)(1110110|1010110)(1110110|1010110|111010|101010|11110|10110)$/
    },
    majzu: {
        sadr: /^(1110110|1010110)(1110110|1010110)$/,
        ajuz: /^(1110110|1010110)(1110110|1010110|111011010)$/
    }
};

const HAZJ_CONFIG = {
    majzu: {
        sadr: /^(1101010|110101|110110)(1101010|110101|110110)$/,
        ajuz: /^(1101010|110101|110110)(1101010|110101|110110|11010)$/
    }
};

const RAJAZ_CONFIG = {
    tam: {
        sadr: /^(1010110|1110110|1011110|1111110){3}$/,
        ajuz: /^(1010110|1110110|1011110|1111110){3}$/
    },
    majzu: {
        sadr: /^(1010110|1110110|1011110|1111110){2}$/,
        ajuz: /^(1010110|1110110|1011110|1111110){2}$/
    },
    mashtur: /^(1010110|1110110|1011110|1111110){3}$/
};

const RAMAL_CONFIG = {
    tam: {
        sadr: /^(1011010|1111010){2}(1011010|1111010|10110|101100)$/,
        ajuz: /^(1011010|1111010){2}(1011010|1111010|10110|101100)$/
    },
    majzu: {
        sadr: /^(1011010|1111010){2}$/,
        ajuz: /^(1011010|1111010)(1011010|1111010|10110100)$/
    }
};

const MUNSARIH_CONFIG = {
    tam: {
        sadr: /^(1010110|1110110|101110)(1010101|110101|101101)(1010110|1110110|101110|10110|10100)$/,
        ajuz: /^(1010110|1110110|101110)(1010101|110101|101101)(1010110|1110110|101110|10110|10100)$/
    },
    manhuk: /^(1010110|1110110|101110)(1010101|110101|101101)(1010110|1110110|101110|10110|10100)$/
};

const KHAFIF_CONFIG = {
    tam: {
        sadr: /^(1011010|111010|101101)(1010110|1110110|1010111)(1011010|111010)$/,
        ajuz: /^(1011010|111010|101101)(1010110|1110110|1010111)(1011010|111010|101010|101100)$/
    },
    majzu: {
        sadr: /^(1011010|111010|101101)(1010110|1110110|1010111)$/,
        ajuz: /^(1011010|111010|101101)(1010110|1110110|1010111|1010100)$/
    }
};

const MUDARI_CONFIG = {
    majzu: {
        sadr: /^(1101011|1101010|1101110)(1011010|111010)$/,
        ajuz: /^(1101011|1101010|1101110)(1011010|111010)$/
    }
};

const MUQTADAB_CONFIG = {
    majzu: {
        sadr: /^(101101|1010101)(1010110|101110)$/,
        ajuz: /^(101101|1010101)(1010110|101110)$/
    }
};

const MUJTATH_CONFIG = {
    majzu: {
        sadr: /^(1010110|1110110)(1011010|111010)$/,
        ajuz: /^(1010110|1110110)(1011010|111010|101010)$/
    }
};

const MUTAQARIB_CONFIG = {
    tam: {
        sadr: /^(11010|1101){3}(11010|1101)$/,
        ajuz: /^(11010|1101){3}(11010|1100|110|10)$/
    },
    majzu: {
        sadr: /^(11010|1101){2}(11010|1101)$/,
        ajuz: /^(11010|1101){2}(11010|1100|110)$/
    }
};

const MUTADARAK_CONFIG = {
    tam: {
        sadr: /^(10110|1110|1010){3}(10110|1110|1010)$/,
        ajuz: /^(10110|1110|1010){3}(10110|1110|1010)$/
    },
    majzu: {
        sadr: /^(10110|1110|1010){2}(10110|1110|1010)$/,
        ajuz: /^(10110|1110|1010){2}(10110|1110|1010|101100|1011010)$/
    }
};

const MUHDATH_CONFIG = MUTADARAK_CONFIG;

function detecterTawil(text: string) {
    const parts = text.split('\u200C');
    if (parts.length < 2) return { estTawil: false };
    const sadrPattern = scannerTawil(parts[0].trim(), true);
    const ajuzPattern = scannerTawil(parts[1].trim(), false);
    const sadrValide = TAWIL_CONFIG.tam.sadr.test(sadrPattern);
    const ajuzValide = TAWIL_CONFIG.tam.ajuz.test(ajuzPattern);
    return { estTawil: sadrValide && ajuzValide, sadrPattern, ajuzPattern };
}

function detecterMadid(text: string) {
    const parts = text.split('\u200C');
    if (parts.length < 2) return { estMadid: false };
    const sadrPattern = scannerTawil(parts[0].trim(), true);
    const ajuzPattern = scannerTawil(parts[1].trim(), false);
    const sadrValide = MADID_CONFIG.majzu.sadr.test(sadrPattern);
    const ajuzValide = MADID_CONFIG.majzu.ajuz.test(ajuzPattern);
    return { estMadid: sadrValide && ajuzValide, sadrPattern, ajuzPattern };
}

function detecterBasit(text: string) {
    const parts = text.split('\u200C');
    if (parts.length < 2) return { estBasit: false };
    const sadrPattern = scannerTawil(parts[0].trim(), true);
    const ajuzPattern = scannerTawil(parts[1].trim(), false);
    const tamSadr = BASIT_CONFIG.tam.sadr.test(sadrPattern);
    const tamAjuz = BASIT_CONFIG.tam.ajuz.test(ajuzPattern);
    const majzuSadr = BASIT_CONFIG.majzu.sadr.test(sadrPattern);
    const majzuAjuz = BASIT_CONFIG.majzu.ajuz.test(ajuzPattern);
    const estTam = tamSadr && tamAjuz;
    const estMajzu = majzuSadr && majzuAjuz;
    return { estBasit: estTam || estMajzu, forme: estTam ? 'Tām' : (estMajzu ? 'Majzū\'' : 'inconnue'), sadrPattern, ajuzPattern };
}

function detecterWafir(text: string) {
    const parts = text.split('\u200C');
    if (parts.length < 2) return { estWafir: false };
    const sadrPattern = scannerTawil(parts[0].trim(), true);
    const ajuzPattern = scannerTawil(parts[1].trim(), false);
    const tamSadr = WAFIR_CONFIG.tam.sadr.test(sadrPattern);
    const tamAjuz = WAFIR_CONFIG.tam.ajuz.test(ajuzPattern);
    const majzuSadr = WAFIR_CONFIG.majzu.sadr.test(sadrPattern);
    const majzuAjuz = WAFIR_CONFIG.majzu.ajuz.test(ajuzPattern);
    const estTam = tamSadr && tamAjuz;
    const estMajzu = majzuSadr && majzuAjuz;
    return { estWafir: estTam || estMajzu, forme: estTam ? 'Tām' : (estMajzu ? 'Majzū\'' : 'inconnue'), sadrPattern, ajuzPattern };
}

function detecterKamil(text: string) {
    const parts = text.split('\u200C');
    if (parts.length < 2) return { estKamil: false };
    const sadrPattern = scannerTawil(parts[0].trim(), true);
    const ajuzPattern = scannerTawil(parts[1].trim(), false);
    const tamSadr = KAMIL_CONFIG.tam.sadr.test(sadrPattern);
    const tamAjuz = KAMIL_CONFIG.tam.ajuz.test(ajuzPattern);
    const majzuSadr = KAMIL_CONFIG.majzu.sadr.test(sadrPattern);
    const majzuAjuz = KAMIL_CONFIG.majzu.ajuz.test(ajuzPattern);
    const estTam = tamSadr && tamAjuz;
    const estMajzu = majzuSadr && majzuAjuz;
    return { estKamil: estTam || estMajzu, forme: estTam ? 'Tām' : (estMajzu ? 'Majzū\'' : 'inconnue'), sadrPattern, ajuzPattern };
}

function detecterHazaj(text: string) {
    const parts = text.split('\u200C');
    if (parts.length < 2) return { estHazaj: false };
    const sadrPattern = scannerTawil(parts[0].trim(), true);
    const ajuzPattern = scannerTawil(parts[1].trim(), false);
    const sadrValide = HAZJ_CONFIG.majzu.sadr.test(sadrPattern);
    const ajuzValide = HAZJ_CONFIG.majzu.ajuz.test(ajuzPattern);
    return { estHazaj: sadrValide && ajuzValide, sadrPattern, ajuzPattern };
}

function detecterRajaz(text: string) {
    const clean = text.replace(/\u200B/g, '');
    if (clean.includes('\u200C')) {
        const parts = clean.split('\u200C');
        if (parts.length < 2) return { estRajaz: false };
        const sadrPattern = scannerTawil(parts[0].trim(), true);
        const ajuzPattern = scannerTawil(parts[1].trim(), false);
        const tamSadr = RAJAZ_CONFIG.tam.sadr.test(sadrPattern);
        const tamAjuz = RAJAZ_CONFIG.tam.ajuz.test(ajuzPattern);
        const majzuSadr = RAJAZ_CONFIG.majzu.sadr.test(sadrPattern);
        const majzuAjuz = RAJAZ_CONFIG.majzu.ajuz.test(ajuzPattern);
        const estTam = tamSadr && tamAjuz;
        const estMajzu = majzuSadr && majzuAjuz;
        return { estRajaz: estTam || estMajzu, forme: estTam ? 'Tām' : (estMajzu ? 'Majzū\'' : 'inconnue'), sadrPattern, ajuzPattern };
    } else {
        const fullPattern = scannerTawil(clean, true);
        const estMashtur = RAJAZ_CONFIG.mashtur.test(fullPattern);
        return { estRajaz: estMashtur, forme: estMashtur ? 'Mashtūr' : 'inconnue', fullPattern };
    }
}

function detecterRamal(text: string) {
    const parts = text.split('\u200C');
    if (parts.length < 2) return { estRamal: false };
    const sadrPattern = scannerTawil(parts[0].trim(), true);
    const ajuzPattern = scannerTawil(parts[1].trim(), false);
    const tamSadr = RAMAL_CONFIG.tam.sadr.test(sadrPattern);
    const tamAjuz = RAMAL_CONFIG.tam.ajuz.test(ajuzPattern);
    const majzuSadr = RAMAL_CONFIG.majzu.sadr.test(sadrPattern);
    const majzuAjuz = RAMAL_CONFIG.majzu.ajuz.test(ajuzPattern);
    const estTam = tamSadr && tamAjuz;
    const estMajzu = majzuSadr && majzuAjuz;
    return { estRamal: estTam || estMajzu, forme: estTam ? 'Tām' : (estMajzu ? 'Majzū\'' : 'inconnue'), sadrPattern, ajuzPattern };
}

function detecterMunsarih(text: string) {
    const clean = text.replace(/\u200B/g, '');
    if (clean.includes('\u200C')) {
        const parts = clean.split('\u200C');
        if (parts.length < 2) return { estMunsarih: false };
        const sadrPattern = scannerTawil(parts[0].trim(), true);
        const ajuzPattern = scannerTawil(parts[1].trim(), false);
        const sadrValide = MUNSARIH_CONFIG.tam.sadr.test(sadrPattern);
        const ajuzValide = MUNSARIH_CONFIG.tam.ajuz.test(ajuzPattern);
        return { estMunsarih: sadrValide && ajuzValide, forme: 'Tām', sadrPattern, ajuzPattern };
    } else {
        const fullPattern = scannerTawil(clean, true);
        const estManhuk = MUNSARIH_CONFIG.manhuk.test(fullPattern);
        return { estMunsarih: estManhuk, forme: estManhuk ? 'Manhūk' : 'inconnue', fullPattern };
    }
}

function detecterKhafif(text: string) {
    const parts = text.split('\u200C');
    if (parts.length < 2) return { estKhafif: false };
    const sadrPattern = scannerTawil(parts[0].trim(), true);
    const ajuzPattern = scannerTawil(parts[1].trim(), false);
    const tamSadr = KHAFIF_CONFIG.tam.sadr.test(sadrPattern);
    const tamAjuz = KHAFIF_CONFIG.tam.ajuz.test(ajuzPattern);
    const majzuSadr = KHAFIF_CONFIG.majzu.sadr.test(sadrPattern);
    const majzuAjuz = KHAFIF_CONFIG.majzu.ajuz.test(ajuzPattern);
    const estTam = tamSadr && tamAjuz;
    const estMajzu = majzuSadr && majzuAjuz;
    return { estKhafif: estTam || estMajzu, forme: estTam ? 'Tām' : (estMajzu ? 'Majzū\'' : 'inconnue'), sadrPattern, ajuzPattern };
}

function detecterMudari(text: string) {
    const parts = text.split('\u200C');
    if (parts.length < 2) return { estMudari: false };
    const sadrPattern = scannerTawil(parts[0].trim(), true);
    const ajuzPattern = scannerTawil(parts[1].trim(), false);
    const sadrValide = MUDARI_CONFIG.majzu.sadr.test(sadrPattern);
    const ajuzValide = MUDARI_CONFIG.majzu.ajuz.test(ajuzPattern);
    return { estMudari: sadrValide && ajuzValide, sadrPattern, ajuzPattern };
}

function detecterMuqtadab(text: string) {
    const parts = text.split('\u200C');
    if (parts.length < 2) return { estMuqtadab: false };
    const sadrPattern = scannerTawil(parts[0].trim(), true);
    const ajuzPattern = scannerTawil(parts[1].trim(), false);
    const sadrValide = MUQTADAB_CONFIG.majzu.sadr.test(sadrPattern);
    const ajuzValide = MUQTADAB_CONFIG.majzu.ajuz.test(ajuzPattern);
    return { estMuqtadab: sadrValide && ajuzValide, sadrPattern, ajuzPattern };
}

function detecterMujtath(text: string) {
    const parts = text.split('\u200C');
    if (parts.length < 2) return { estMujtath: false };
    const sadrPattern = scannerTawil(parts[0].trim(), true);
    const ajuzPattern = scannerTawil(parts[1].trim(), false);
    const sadrValide = MUJTATH_CONFIG.majzu.sadr.test(sadrPattern);
    const ajuzValide = MUJTATH_CONFIG.majzu.ajuz.test(ajuzPattern);
    return { estMujtath: sadrValide && ajuzValide, sadrPattern, ajuzPattern };
}

function detecterMutaqarib(text: string) {
    const parts = text.split('\u200C');
    if (parts.length < 2) return { estMutaqarib: false };
    const sadrPattern = scannerTawil(parts[0].trim(), true);
    const ajuzPattern = scannerTawil(parts[1].trim(), false);
    const tamSadr = MUTAQARIB_CONFIG.tam.sadr.test(sadrPattern);
    const tamAjuz = MUTAQARIB_CONFIG.tam.ajuz.test(ajuzPattern);
    const majzuSadr = MUTAQARIB_CONFIG.majzu.sadr.test(sadrPattern);
    const majzuAjuz = MUTAQARIB_CONFIG.majzu.ajuz.test(ajuzPattern);
    const estTam = tamSadr && tamAjuz;
    const estMajzu = majzuSadr && majzuAjuz;
    return { estMutaqarib: estTam || estMajzu, forme: estTam ? 'Tām' : (estMajzu ? 'Majzū\'' : 'inconnue'), sadrPattern, ajuzPattern };
}

function detecterMutadarak(text: string) {
    const parts = text.split('\u200C');
    if (parts.length < 2) return { estMutadarak: false };
    const sadrPattern = scannerTawil(parts[0].trim(), true);
    const ajuzPattern = scannerTawil(parts[1].trim(), false);
    const tamSadr = MUTADARAK_CONFIG.tam.sadr.test(sadrPattern);
    const tamAjuz = MUTADARAK_CONFIG.tam.ajuz.test(ajuzPattern);
    const majzuSadr = MUTADARAK_CONFIG.majzu.sadr.test(sadrPattern);
    const majzuAjuz = MUTADARAK_CONFIG.majzu.ajuz.test(ajuzPattern);
    const estTam = tamSadr && tamAjuz;
    const estMajzu = majzuSadr && majzuAjuz;
    return { estMutadarak: estTam || estMajzu, forme: estTam ? 'Tām' : (estMajzu ? 'Majzū\'' : 'inconnue'), sadrPattern, ajuzPattern };
}

function detecterMuhdath(text: string) {
    return detecterMutadarak(text);
}

export function detecterMetre(text: string) {
    const clean = nettoyerTexte(text);
    if (!clean) return null;

    const buyut = poetryEngine.parsePoemToBuyut(clean);
    if (buyut.length === 0) return null;

    const detecteurs = [
        { nom: 'Al-Tawīl (الطويل)', fn: detecterTawil, cle: 'estTawil' },
        { nom: 'Al-Madīd (المديد)', fn: detecterMadid, cle: 'estMadid' },
        { nom: 'Al-Basīt (البَسِيط)', fn: detecterBasit, cle: 'estBasit' },
        { nom: 'Al-Wāfir (الوَافِر)', fn: detecterWafir, cle: 'estWafir' },
        { nom: 'Al-Kāmil (الكامِل)', fn: detecterKamil, cle: 'estKamil' },
        { nom: 'Al-Hazaj (الهَزَج)', fn: detecterHazaj, cle: 'estHazaj' },
        { nom: 'Al-Rajaz (الرجز)', fn: detecterRajaz, cle: 'estRajaz' },
        { nom: 'Al-Ramal (الرمل)', fn: detecterRamal, cle: 'estRamal' },
        { nom: 'Al-Munsarih (المنسرح)', fn: detecterMunsarih, cle: 'estMunsarih' },
        { nom: 'Al-Khafīf (الخفيف)', fn: detecterKhafif, cle: 'estKhafif' },
        { nom: 'Al-Mudāri\' (المضارع)', fn: detecterMudari, cle: 'estMudari' },
        { nom: 'Al-Muqtadab (المقتضب)', fn: detecterMuqtadab, cle: 'estMuqtadab' },
        { nom: 'Al-Mujtath (المجتث)', fn: detecterMujtath, cle: 'estMujtath' },
        { nom: 'Al-Mutaqārib (المتقارب)', fn: detecterMutaqarib, cle: 'estMutaqarib' },
        { nom: 'Al-Mutadārak (المتدارك)', fn: detecterMutadarak, cle: 'estMutadarak' },
        { nom: 'Al-Muḥdath (المحدث)', fn: detecterMuhdath, cle: 'estMuhdath' }
    ];

    for (const bayt of buyut) {
        if (!bayt.ajuz) continue;
        const textAvecMarqueurs = `${bayt.sadr}\u200C${bayt.ajuz}`;
        for (const d of detecteurs) {
            const resultat = d.fn(textAvecMarqueurs) as DetectorResult;
            if (resultat[d.cle] === true) {
                return d.nom;
            }
        }
    }

    return null;
}

export {
    scannerTawil,
    detecterTawil,
    detecterMadid,
    detecterBasit,
    detecterWafir,
    detecterKamil,
    detecterHazaj,
    detecterRajaz,
    detecterRamal,
    detecterMunsarih,
    detecterKhafif,
    detecterMudari,
    detecterMuqtadab,
    detecterMujtath,
    detecterMutaqarib,
    detecterMutadarak,
    detecterMuhdath,
    TAWIL_CONFIG,
    MADID_CONFIG,
    BASIT_CONFIG,
    WAFIR_CONFIG,
    KAMIL_CONFIG,
    HAZJ_CONFIG,
    RAJAZ_CONFIG,
    RAMAL_CONFIG,
    MUNSARIH_CONFIG,
    KHAFIF_CONFIG,
    MUDARI_CONFIG,
    MUQTADAB_CONFIG,
    MUJTATH_CONFIG,
    MUTAQARIB_CONFIG,
    MUTADARAK_CONFIG,
    MUHDATH_CONFIG,
    poetryEngine
};
