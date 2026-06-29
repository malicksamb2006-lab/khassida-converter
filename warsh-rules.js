
// warsh-rules.js
// Ce fichier contient les constantes Unicode arabes et les fonctions JavaScript pour appliquer les règles de Tajweed (Riwayat Warsh).
// Il est conçu pour être inclus dans une application web via une balise <script> et s'intègre avec une fonction `handleConvert`.
// Documentation détaillée en français pour faciliter l'intégration et la maintenance.

/**
 * @const {object} UNICODE_WARSH - Table de correspondance des codes Unicode pour les caractères arabes,
 * les diacritiques et les symboles spécifiques à la riwaya de Warsh.
 * Ces constantes sont essentielles pour une manipulation précise des textes arabes et éviter les bugs de glyphes.
 * Les valeurs ont été ajustées selon les requêtes spécifiques de l'utilisateur.
 */
const UNICODE_WARSH = {
    // Harakat (Voyelles courtes et signes diacritiques)
    FATHA: '\u064E',       // فتحة (Fatḥah) - [a]
    DAMMA: '\u064F',       // ضمة (Ḍammah) - [u]
    KASRA: '\u0650',       // كسرة (Kasrah) - [i]
    SUKUN: '\u0652',       // سكون (Sukūn) - Absence de voyelle
    SHADDA: '\u0651',      // شدة (Shaddah) - Redoublement de consonne
    MADDA_ALIF: '\u0622',  // ا (Alif Madda) - Alif avec une hamza de prolongation
    MADDA_SIGN: '\u0653',  // مدة (Maddah) - Signe de prolongation (sur Alif, Waw, Ya)
    TANWEEN_FATHA: '\u064B', // تنوين الفتح (Tanwīn Fatḥah) - [an]
    TANWEEN_DAMMA: '\u064C', // تنوين الضم (Tanwīn Ḍammah) - [un]
    TANWEEN_KASRA: '\u064D', // تنوين الكسر (Tanwīn Kasrah) - [in]
    KASRATAYN: '\u064D',   // تنوين الكسر (Kasratayn) - alias pour TANWEEN_KASRA

    // Lettres arabes fondamentales (liste étendue pour faciliter les regex)
    ALIF: '\u0627',        // ا (Alif)
    BA: '\u0628',          // ب (Bāʾ)
    TA: '\u062A',          // ت (Tāʾ)
    THA: '\u062B',         // ث (Thāʾ)
    JEEM: '\u062C',        // ج (Jīm)
    HA_LETTER: '\u062D',    // ح (Ḥāʾ)
    KHA: '\u062E',         // خ (Khāʾ)
    DAL: '\u062F',         // د (Dāl)
    ZAL: '\u0630',         // ذ (Dhāl)
    RA: '\u0631',          // ر (Rāʾ)
    ZAY: '\u0632',         // ز (Zayn)
    SEEN: '\u0633',        // س (Sīn)
    SHEEN: '\u0634',       // ش (Shīn)
    SAD: '\u0635',         // ص (Ṣād)
    DAD: '\u0636',         // ض (Ḍād)
    TA_LETTER: '\u0637',   // ط (Ṭāʾ)
    ZA_LETTER: '\u0638',   // ظ (Ẓāʾ)
    AIN: '\u0639',         // ع (ʿAyn)
    GHAIN: '\u063A',       // غ (Ghayn)
    FA: '\u0641',          // ف (Fāʾ)
    QAF: '\u0642',         // ق (Qāf)
    KAF: '\u0643',         // ك (Kāf)
    LAM: '\u0644',         // ل (Lām)
    MEEM: '\u0645',        // م (Mīm)
    NOON: '\u0646',        // ن (Nūn)
    HA: '\u0647',          // ه (Hāʾ)
    WAW: '\u0648',         // و (Wāw)
    YA: '\u064A',          // ي (Yāʾ)
    ALIF_MAKSURA: '\u0649', // ى (Alif Maqṣūrah)
    TA_MARBUTA: '\u0629',   // ة (Tāʾ Marbūṭah)

    // Formes de Hamzah (هَمْزَة)
    HAMZA: '\u0621',       // ء (Hamzah isolée)
    HAMZA_ON_ALIF: '\u0623', // أ (Hamzah sur Alif)
    HAMZA_BELOW_ALIF: '\u0625', // إ (Hamzah sous Alif)
    HAMZA_ON_WAW: '\u0624',  // ؤ (Hamzah sur Wāw)
    HAMZA_ON_YA: '\u0626',   // ئ (Hamzah sur Yāʾ)

    // Symboles spécifiques à Warsh ou à la récitation / lecture coranique
    SMALL_WAW: '\u06E5',  // ۥ (petit Wāw de prolongation, spécifié par l'utilisateur)
    SMALL_YA: '\u06EA',   // ۜ (petit Yāʾ de prolongation, moins courant pour Warsh que le Wāw)
    IMALA_POINT: '\u06EC', // Point d'Imāla/Taqleel (spécifié par l'utilisateur)
    IQLAB_MEEM: '\u06E2', // ◌۠ (petit Meem vertical pour l'Iqlāb, spécifié par l'utilisateur)
    WASLA: '\u0671',       // وصلة (Alif Waṣl) - Alif de liaison
    LA_ALIF: '\u0644\u0627', // لا (Lām Alif, comme combinaison)
    ALIF_KHANJARIYA: '\u0670', // Alif Khankhariya (mini-alif)

    // Caractères de contrôle et invisibles fréquemment rencontrés
    ZERO_WIDTH_SPACE: '\u200B', // Espace sans chasse (Zero Width Space)
    ZERO_WIDTH_NON_JOINER: '\u200C', // Non-jointure sans chasse (Zero Width Non-Joiner)
    RIGHT_TO_LEFT_MARK: '\u200F', // Marque de droite à gauche (Right-to-Left Mark)
    LEFT_TO_RIGHT_MARK: '\u200E' // Marque de gauche à droite
};

// Patterns regex pour les groupes de caractères fréquemment utilisés.
const ARABIC_LETTERS_ONLY_PATTERN = '[\u0621-\u063A\u0641-\u064A]'; // Toutes les lettres arabes, y compris Alif, mais excluant les diacritiques
const HAMZA_FORMS_PATTERN_REGEX = `(?:${[UNICODE_WARSH.HAMZA, UNICODE_WARSH.HAMZA_ON_ALIF, UNICODE_WARSH.HAMZA_BELOW_ALIF, UNICODE_WARSH.HAMZA_ON_WAW, UNICODE_WARSH.HAMZA_ON_YA].map(h => h.replace(/[.*+?^${}()|[\\]/g, '\\$&')).join('|')})`;
const VOWEL_FORMS_PATTERN_REGEX = `(?:${[UNICODE_WARSH.FATHA, UNICODE_WARSH.DAMMA, UNICODE_WARSH.KASRA, UNICODE_WARSH.TANWEEN_FATHA, UNICODE_WARSH.TANWEEN_DAMMA, UNICODE_WARSH.TANWEEN_KASRA].map(v => v.replace(/[.*+?^${}()|[\\]/g, '\\$&')).join('|')})`;
const ALL_DIACRITICS_PATTERN = '[\u064B-\u0652\u0655-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED]'; // Tous les diacritiques arabes, y compris Alif Khanjariya
const PROLONGATION_LETTERS_PATTERN = `(?:${[UNICODE_WARSH.ALIF, UNICODE_WARSH.WAW, UNICODE_WARSH.YA].map(l => l.replace(/[.*+?^${}()|[\\]/g, '\\$&')).join('|')})`;
const SUKOON_OR_NO_DIACRITIC = `(?:${UNICODE_WARSH.SUKUN}|(?!${ALL_DIACRITICS_PATTERN}))`;

/**
 * @function cleanArabicString
 * @param {string} text - La chaîne de caractères arabe à nettoyer.
 * @returns {string} La chaîne nettoyée, sans espaces superflus ni caractères de contrôle.
 * Cette fonction prépare le texte pour une analyse plus facile en éliminant les éléments perturbateurs.
 */
function cleanArabicString(text) {
    if (typeof text !== 'string') {
        console.error("cleanArabicString: L'entrée doit être une chaîne de caractères.");
        return "";
    }
    let cleanedText = text;
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    cleanedText = cleanedText.replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '');
    return cleanedText;
}

/**
 * @function removeDiacritics
 * @param {string} text - La chaîne de caractères arabe dont on veut supprimer les diacritiques.
 * @returns {string} La chaîne sans diacritiques.
 */
function removeDiacritics(text) {
    // Remplace tous les diacritiques définis par ALL_DIACRITICS_PATTERN par une chaîne vide.
    return text.replace(new RegExp(ALL_DIACRITICS_PATTERN, 'g'), '');
}

/**
 * @function isDiacritic
 * @param {string} char - Le caractère à vérifier.
 * @returns {boolean} True si le caractère est un diacritique, False sinon.
 */
function isDiacritic(char) {
    return new RegExp(ALL_DIACRITICS_PATTERN).test(char);
}

/**
 * @function getNextMeaningfulChar
 * @param {string} text - Le texte à analyser.
 * @param {number} startIndex - L'index de départ.
 * @returns {{char: string, index: number}|null} Le prochain caractère significatif et son index, ou null.
 * Un caractère significatif est une lettre arabe, non un espace ou un diacritique.
 */
function getNextMeaningfulChar(text, startIndex) {
    for (let i = startIndex; i < text.length; i++) {
        if (text[i] !== ' ' && !isDiacritic(text[i])) {
            return { char: text[i], index: i };
        }
    }
    return null;
}

/**
 * @function getPrevMeaningfulChar
 * @param {string} text - Le texte à analyser.
 * @param {number} startIndex - L'index de départ (exclusif).
 * @returns {{char: string, index: number}|null} Le caractère significatif précédent et son index, ou null.
 * Un caractère significatif est une lettre arabe, non un espace ou un diacritique.
 */
function getPrevMeaningfulChar(text, startIndex) {
    for (let i = startIndex - 1; i >= 0; i--) {
        if (text[i] !== ' ' && !isDiacritic(text[i])) {
            return { char: text[i], index: i };
        }
    }
    return null;
}

// =======================================================
//                  MODULES WARSH
// =======================================================

/**
 * @function applyBasicNaql
 * @param {string} text - Le texte arabe à traiter.
 * @returns {string} Le texte avec la règle de base du Naql appliquée.
 * Règle de base du Naql (Warsh) : Déplacement de la voyelle (Fatha, Damma, Kasra) d'une Hamzat al-Qat'
 * (أَ, إِ, أُ, etc.) vers la consonne muette (portant un Soukoun) qui la précède immédiatement,
 * puis suppression de la Hamzah et de son support.
 *
 * Simplification : Cette implémentation recherche un Soukoun sur une consonne, suivi d'un espace, d'une forme de Hamzah,
 * suivie immédiatement d'une voyelle. Elle déplace cette voyelle sur la consonne initiale et supprime le Soukoun et la Hamzah.
 * Ex: "قَدْ أَفْلَحَ" (qad aflaha) -> "قَدَ فْلَحَ" (qadafalaha)
 *
 * EXCLUSION : Bloque le Naql si la situation se produit au milieu d'un seul et même mot.
 * (Nous nous basons sur l'absence d'espace entre la consonne à Soukoun et la Hamzah pour cette exclusion implicite).
 * Exception Strict: رِدْءًا (rid'an) devient رِدًا (ridan). Géré séparément pour plus de précision.
 */
function applyBasicNaql(text) {
    let processedText = text;
    const { SUKUN, TANWEEN_FATHA } = UNICODE_WARSH;

    // --- EXCEPTION STRICTE: رِدْءًا -> رِدًا ---
    // La transformation est spécifique et ne suit pas le pattern général du Naql.
    // On remplace le Hamza et son diacritique par rien, laissant le Tanwin Fatha sur le Dal.
    // Note: l'Alif de prolongation après tanwin n'est pas géré ici (aspect purement graphique).
    processedText = processedText.replace(new RegExp(`رِدْء${TANWEEN_FATHA}`, 'g'), `رِد${TANWEEN_FATHA}`);

    // --- Règle de Naql inter-mots ---
    // Regex: (Lettre arabe non-hamza) + SUKUN + (un ou plusieurs espaces) + (Hamza sous toutes ses formes) + (Voyelle de la Hamza)
    // Capture 1: la consonne précédente (qui portait le Sukun)
    // Capture 2: le Sukun (à supprimer)
    // Capture 3: les espaces intermédiaires (à conserver ou supprimer si pas d'espace)
    // Capture 4: la forme de Hamza (à supprimer)
    // Capture 5: la voyelle de la Hamza (à transférer)
    const naqlRegex = new RegExp(`(${ARABIC_LETTERS_ONLY_PATTERN})(${SUKUN})(\s*)(${HAMZA_FORMS_PATTERN_REGEX})(${VOWEL_FORMS_PATTERN_REGEX})`, 'gu');

    processedText = processedText.replace(naqlRegex, (match, prevConsonant, sukun, spaces, hamzaForm, vowel) => {
        // On transfère la voyelle de la Hamza sur la consonne précédente, et on supprime le Sukun et la Hamza.
        // Les espaces sont supprimés dans ce contexte pour simuler la liaison phonétique.
        return `${prevConsonant}${vowel}`;
    });

    return processedText;
}

/**
 * @function applyExtendedNaql
 * @param {string} text - Le texte arabe à traiter.
 * @returns {string} Le texte avec les variantes avancées du Naql appliquées.
 * Cette fonction est un *placeholder* pour les variantes avancées ou spécifiques du Naql (Warsh).
 * L'implémentation nécessiterait une analyse linguistique avancée, y compris la reconnaissance morphologique
 * des mots et la gestion des Alif-Lam de définition ou des liaisons inter-mots spécifiques.
 * Pour une implémentation complète, il faudrait un moteur d'analyse NLP arabe plus sophistiqué.
 *
 * Ex: Gestion de "الْأَرْضَ" -> "لَرْضَ" (Al-Ardha -> Lardha)
 * Cette règle est très contextuelle et nécessite de distinguer le Alif Wasl du Alif Qat'.
 * Pour l'instant, elle retourne le texte original. C'est une tâche complexe pour de simples regex.
 */
function applyExtendedNaql(text) {
    // console.log("applyExtendedNaql: Fonctionnalité avancée de Naql non implémentée, renvoie le texte original.");
    // TODO: Implémenter le Naql pour le Alif Lam de définition (ex: الْأَرْضَ -> لَرْضَ).
    return text;
}

/**
 * @function applyIltiqaaSakinayn
 * @param {string} text - Le texte arabe à traiter.
 * @returns {string} Le texte avec la règle d'Iltiqaa'i Sakinayn appliquée.
 * Règle : Si une lettre portant un Sukoon se trouve avant une Hamzatul Wasl dont la voyelle d'origine est une Dhammah,
 * le Sukoon se transforme alors en Dhammah.
 * Exemple : "ان اعبدوا" -> "انُ اعبدوا" (lecture : "انُعْبُدُوا"), "فمن اضطر" -> "فمنُ اضطر" (lecture : "فَمَنُضْطُرَّ")
 *
 * Simplification : Nous ciblons les cas de `consonne + SUKUN + WASLA`. Le Sukun de la consonne est remplacé par Damma.
 * La détection de la voyelle d'origine de Hamzatul Wasl est simplifiée ou implicite.
 */
function applyIltiqaaSakinayn(text) {
    let processedText = text;
    const { SUKUN, DAMMA, WASLA } = UNICODE_WARSH;

    // Regex: (Lettre arabe) + SUKUN + (WASLA)
    // Capture 1: la consonne précédente (qui portait le Sukun)
    // Capture 2: le Sukun (à supprimer)
    // Capture 3: la Hamzatul Wasl (à conserver, potentiellement avec une Dhammah implicite)
    // L'implémentation la plus simple remplace le Sukun par Damma.
    const iltiqaaRegex = new RegExp(`(${ARABIC_LETTERS_ONLY_PATTERN})(${SUKUN})(\s*${WASLA})`, 'gu');

    processedText = processedText.replace(iltiqaaRegex, (match, consonant, sukun, wasla) => {
        // Le Sukun est remplacé par Damma sur la consonne précédente.
        return `${consonant}${DAMMA}${wasla}`;
    });

    return processedText;
}

/**
 * @function applyMaddSilah
 * @param {string} text - Le texte arabe à traiter.
 * @returns {string} Le texte avec la prolongation de Madd Silat Meem al-Jam' appliquée.
 * Règle : Lorsqu'un Meem de pluriel (مُ, c'est-à-dire un Meem avec Damma) est suivi d'une Hamzat al-Qat'
 * (أ, إ, ؤ, ئ, ء), une prolongation est appliquée en ajoutant le petit Waw (ۥ) après la Damma du Meem.
 * Cette règle ne s'applique pas aux Meem singuliers (mْ) ou aux Meem qui ne sont pas suivis d'une Hamza.
 * Ex: "أَنذَرْتَهُمْ أَمْ" (Anzartahum am) -> "أَنذَرْتَهُمُۥ أَمْ" (Anzartahumu am)
 */
function applyMaddSilah(text) {
    let processedText = text;
    const { MEEM, DAMMA, SMALL_WAW } = UNICODE_WARSH;

    // Regex pour détecter : (MEEM) + (DAMMA) + (éventuels diacritiques/espaces) + (Hamza sous toutes ses formes)
    // Utilise une lookahead pour ne pas consommer la Hamza, permettant ainsi d'autres règles si nécessaire.
    // La détection du 'Meem de pluriel' est simplifiée à 'Meem + Damma' pour cette implémentation.
    const regex = new RegExp(`(${MEEM})(${DAMMA})(?=\s*${ALL_DIACRITICS_PATTERN}*${HAMZA_FORMS_PATTERN_REGEX})`, 'gu');

    // Remplacement : Insère le SMALL_WAW (ۥ) entre le Damma du Meem et la Hamza qui le suit.
    // Note: Le Madd Silah est une prolongation phonétique, le SMALL_WAW est une indication orthographique.
    processedText = processedText.replace(regex, `$1$2${SMALL_WAW}`);

    // Exclusion Meem singulier: La règle se base sur le Meem al-Jam' (Meem pluriel avec Damma).
    // Si un Meem n'a pas de Damma, il ne sera pas matché par la regex ci-dessus.
    // Exemple: "كم أهلكنا" (où le Meem est Sukun) ne sera pas modifié.
    return processedText;
}

/**
 * @function applyMaddBadal
 * @param {string} text - Le texte arabe à traiter.
 * @returns {string} Le texte avec Madd Badal appliqué.
 * Règle : Lorsqu'une Hamzah précède une lettre de prolongation (و , ي , ا). La prolongation est marquée.
 * Pour Warsh, la lettre de prolongation est intégrée à la Hamzah.
 * Ex: "أمنوا" -> "آمنوا", "أوتوا" -> "أُوتوا", "إيمان" -> "إِيمان"
 *
 * Exceptions (où Madd Badal NE s'applique PAS) :
 * 1. Lorsqu'une lettre portant un Sukoon précède directement la Hamzah. Ex: "قرآن", "مذءوما", "الظمآن", "مسئولا".
 *    (Exception à cette exception : "موءودة" -> Madd Badal s'applique).
 * 2. Le mot "إسرائيل" (Isra'il).
 * 3. La Hamzah n'est pas la première lettre du mot ou est au milieu d'un mot et est précédée d'un Sukun.
 */
function applyMaddBadal(text) {
    let processedText = text;
    const { ALIF, WAW, YA, SUKUN, FATHA, DAMMA, KASRA,
            HAMZA, HAMZA_ON_ALIF, HAMZA_BELOW_ALIF, HAMZA_ON_WAW, HAMZA_ON_YA,
            MADDA_ALIF, ALIF_MAKSURA, MEEM, DAL, TA_MARBUTA, NOON, RA, SEEN, QAF, ZAL, TA_LETTER, MADDA_SIGN } = UNICODE_WARSH;

    // --- Pré-traitements pour les cas spécifiques de Madd Badal ---
    // Cas "آمنوا" (Hamza sur Alif + Alif -> Alif Madda)
    // Recherche (Hamza sur Alif ou Alif sans Hamza) suivi directement de Alif.
    processedText = processedText.replace(new RegExp(`(${HAMZA_ON_ALIF}|${ALIF})${ALL_DIACRITICS_PATTERN}*(${ALIF})`, 'g'), MADDA_ALIF);

    // Cas "أوتوا" (Hamza sur Waw + Waw -> Waw prolongé par Madd Sign)
    processedText = processedText.replace(new RegExp(`(${HAMZA_ON_ALIF}|${HAMZA_ON_WAW})${ALL_DIACRITICS_PATTERN}*(${WAW})`, 'g'), `${DAMMA}${WAW}${MADDA_SIGN}`);

    // Cas "إيمان" (Hamza sous Alif + Ya -> Ya prolongé par Madd Sign)
    processedText = processedText.replace(new RegExp(`(${HAMZA_BELOW_ALIF}|${HAMZA_ON_YA})${ALL_DIACRITICS_PATTERN}*(${YA})`, 'g'), `${KASRA}${YA}${MADDA_SIGN}`);

    // --- Exceptions par mots spécifiques en texte sans diacritiques ---
    // Préparation pour la détection des mots exclusifs/exceptionnels.
    const textWithoutDiacritics = removeDiacritics(processedText);

    const excludedWords = [
        removeDiacritics(`${QAF}${RA}${SUKUN}${ALIF}${HAMZA}${NOON}`), // قرآن
        removeDiacritics(`${MEEM}${ZAL}${HAMZA}${WAW}${MEEM}${ALIF}`), // مذءوما
        removeDiacritics(`${ALIF}${LAM}${ZAL}${MEEM}${ALIF}${HAMZA}${NOON}`), // الظمآن
        removeDiacritics(`${MEEM}${SEEN}${HAMZA}${WAW}${LAM}${ALIF}`), // مسئولا
        removeDiacritics(`${HAMZA_BELOW_ALIF}${SEEN}${RA}${ALIF}${YA}${LAM}`) // إسرائيل
    ];

    // Exception de l'exception : موءودة (Maw'ooda) - le Madd Badal s'applique ici malgré un Sukun précédent.
    const mawuoodaWord = removeDiacritics(`${MEEM}${WAW}${HAMZA_ON_WAW}${WAW}${DAL}${TA_MARBUTA}`);

    // --- Regex générale pour Hamza suivie d'une lettre de prolongation ---
    // Cette regex cherche le pattern général et le bloc de remplacement gère les exclusions contextuelles.
    // Nous utilisons une fonction de remplacement pour une logique conditionnelle plus complexe.
    const generalBadalRegex = new RegExp(`(${HAMZA_FORMS_PATTERN_REGEX})${ALL_DIACRITICS_PATTERN}*(${PROLONGATION_LETTERS_PATTERN})`, 'gu');

    processedText = processedText.replace(generalBadalRegex, (match, hamza, prolongationLetter) => {
        let applyRule = true;

        const currentMatchClean = removeDiacritics(hamza + prolongationLetter);

        // Vérification des exclusions par mot (sauf pour 'موءودة').
        if (excludedWords.some(ex => textWithoutDiacritics.includes(ex)) && !textWithoutDiacritics.includes(mawuoodaWord)) {
            applyRule = false;
        }

        // Si une Hamzah est précédée par un Sukun (à l'exception de 'موءودة').
        // C'est une vérification complexe à faire avec une seule regex, la lookbehind a des limites.
        // Pour une approche robuste, il faudrait soit itérer, soit une regex très spécifique.
        // L'implémentation actuelle se concentre sur les cas de début de mot/après espace et les exceptions par mot.
        // Une lookbehind comme `(?<!${ARABIC_LETTERS_ONLY_PATTERN}${SUKUN})` pourrait être utilisée si elle était compatible avec toutes les plateformes JS et ne bloquait pas d'autres regex.

        if (!applyRule) {
            return match; // Ne pas modifier si c'est une exception.
        }

        // Application générale : insère le signe de Madd après la lettre de prolongation
        // Si ce n'est pas déjà un Alif Madda (qui a été géré en pré-traitement).
        if (prolongationLetter === ALIF && hamza !== MADDA_ALIF) { // Si ce n'est pas déjà un Alif Madda
            return hamza + prolongationLetter + MADDA_SIGN; // Ex: أ + ا -> أَاْ (simplifié)
        } else if (prolongationLetter === WAW) {
            return hamza + prolongationLetter + MADDA_SIGN; // Ex: ؤ + و -> ؤوْ
        } else if (prolongationLetter === YA) {
            return hamza + prolongationLetter + MADDA_SIGN; // Ex: ئ + ي -> ئِي
        }

        return match; // Retourne l'original si aucune règle d'application spécifique n'est trouvée.
    });

    return processedText;
}

/**
 * @function applyMaddLeen
 * @param {string} text - Le texte arabe à traiter.
 * @returns {string} Le texte avec Madd Leen appliqué.
 * Règle : Lorsqu'une Fathah précède un Waw (و) ou un Ya (ي) portant un Sukoon (Sakin), et que cette séquence
 * est suivie d'une lettre avec Sukoon ou d'un arrêt (Waqf), une prolongation est appliquée.
 * (Simplification : Nous allons marquer le Waw/Ya avec un signe de prolongation si la condition est remplie et non exclue).
 * Ex: "شَيْءٌ" (shay'un) -> "شَيْءٌ" (avec prolongation phonétique), "سَوْءٌ" (saw'un) -> "سَوْءٌ"
 *
 * Exceptions : Les mots "مُؤَيِّلاً" (Mu'ayyilan) et "مَوْعُودَةً" (Maw'oodatan).
 */
function applyMaddLeen(text) {
    let processedText = text;
    const { FATHA, WAW, YA, SUKUN, MADDA_SIGN, MEEM, HAMZA_ON_WAW, ALIF, LAM, TA_MARBUTA, AIN, DAL } = UNICODE_WARSH;

    // Exclusions par mots spécifiques (recherche sans diacritiques pour plus de robustesse)
    const textWithoutDiacritics = removeDiacritics(processedText);
    const excludedWords = [
        removeDiacritics(`${MEEM}${HAMZA_ON_WAW}${YA}${ALIF}${LAM}`), // مُؤَيِّلاً (Mu'ayyilan) - Simplifié
        removeDiacritics(`${MEEM}${WAW}${AIN}${WAW}${DAL}${TA_MARBUTA}`)  // مَوْعُودَةً (Maw'oodatan) - Simplifié
    ];

    // Regex pour détecter : (Lettre avec Fatha) + (Waw/Ya avec Sukun)
    // Capture 1: La lettre précédant le Waw/Ya (doit avoir Fatha)
    // Capture 2: Le Fatha (à conserver)
    // Capture 3: Le Waw ou le Ya
    // Capture 4: Le Sukun sur le Waw/Ya (à conserver)
    const leenRegex = new RegExp(`(${ARABIC_LETTERS_ONLY_PATTERN})(${FATHA})(${WAW}|${YA})(${SUKUN})`, 'gu');

    processedText = processedText.replace(leenRegex, (match, prevLetter, fathah, leenLetter, sukun) => {
        const currentMatchClean = removeDiacritics(prevLetter + fathah + leenLetter + sukun);

        // Vérifier les exclusions par mot
        if (excludedWords.some(ex => textWithoutDiacritics.includes(ex))) {
            return match; // Ne pas appliquer Madd Leen si le mot est une exception.
        }

        // Appliquer Madd Leen en insérant le MADDA_SIGN après le Waw/Ya et son Sukun.
        // Cela marque la prolongation visuellement.
        return `${prevLetter}${fathah}${leenLetter}${sukun}${MADDA_SIGN}`;
    });

    return processedText;
}

/**
 * @function applyMaddAna
 * @param {string} text - Le texte arabe à traiter.
 * @returns {string} Le texte avec Madd de "أنا" appliqué.
 * Règle : Si le mot "أنا" précède une Hamzah, il sera prolongé de la même manière qu'un Madd Munfasil.
 * (Simplification : On marque l'Alif final de "أنا" avec le MADDA_SIGN).
 * Ex: "أنا أحي" (Ana uhyi) -> "أناٰ أحي" ou "أنا اْ أحي"
 *
 * Exception : Si "أنا" se trouve juste avant le mot "إلّا" (illa), il ne sera pas prolongé.
 * Ex: "إن أنا إلا نذير" (In ana illa nazeer)
 */
function applyMaddAna(text) {
    let processedText = text;
    const { ALIF, NOON, HAMZA, HAMZA_ON_ALIF, HAMZA_BELOW_ALIF, HAMZA_ON_WAW, HAMZA_ON_YA, LAM, MADDA_SIGN } = UNICODE_WARSH;

    const anaWord = `${ALIF}${NOON}${ALIF}`; // أنا
    const illaWord = `${HAMZA_BELOW_ALIF}${LAM}${ALIF}`; // إلّا

    // Regex pour détecter "أنا" (anaWord) suivi de près par une Hamza (hamzaFormsPatternRegex).
    // `(?:\s*${ALL_DIACRITICS_PATTERN}*)` gère les espaces et diacritiques entre "أنا" et la Hamza.
    const maddAnaRegex = new RegExp(`(${anaWord})(?:\s*${ALL_DIACRITICS_PATTERN}*)(${HAMZA_FORMS_PATTERN_REGEX})`, 'gu');

    processedText = processedText.replace(maddAnaRegex, (match, ana, hamza) => {
        // Vérifier l'exception : "أنا" suivi de "إلّا".
        // Il faut vérifier le contexte du match pour voir si "إلّا" suit immédiatement la Hamza.
        // Cette logique est plus facile à gérer avec un parcours ou une fonction de remplacement plus complexe.
        const matchIndex = processedText.indexOf(match);
        const afterHamzaIndex = matchIndex + match.length;
        const remainingText = processedText.substring(afterHamzaIndex);

        if (removeDiacritics(remainingText).startsWith(removeDiacritics(illaWord))) {
            return match; // Ne pas appliquer Madd Ana si "إلّا" suit.
        }

        // Appliquer Madd Ana : ajouter le MADDA_SIGN sur l'Alif final de "أنا".
        // Cela pourrait être fait en insérant le signe directement après le dernier Alif de anaWord.
        const lastAlifIndex = ana.lastIndexOf(ALIF);
        if (lastAlifIndex !== -1) {
            // Reconstruire anaWord avec le MADDA_SIGN après le dernier Alif.
            const anaWithMadd = ana.substring(0, lastAlifIndex + 1) + MADDA_SIGN + ana.substring(lastAlifIndex + 1);
            return anaWithMadd + hamza; // Retourne "أناٰ" + Hamza
        }

        return match; // Par défaut, retourne le match original si aucune modification n'est faite.
    });

    return processedText;
}

/**
 * @function applyImala
 * @param {string} text - Le texte arabe à traiter.
 * @returns {string} Le texte avec l'Imāla appliquée.
 * Cette fonction identifie les Alif Maqsoora (ى) en fin de mot (ou avant un espace/ponctuation)
 * et y injecte le point d'Imāla traditionnel (IMALA_POINT) après la lettre.
 *
 * Simplification : La règle de l'Imāla est complexe et dépend de nombreux facteurs phonétiques et contextuels.
 * Cette implémentation cible la principale manifestation de l'Imāla chez Warsh sur l'Alif Maqsoora en fin de mot.
 * Une implémentation exhaustive requerrait une liste de mots éligibles ou des règles phonologiques détaillées.
 * Ex: "موسى" (Mousa) -> "موسىٰ" (Mousa avec Imala).
 */
function applyImala(text) {
    let processedText = text;
    const { ALIF_MAKSURA, IMALA_POINT } = UNICODE_WARSH;

    // Regex pour détecter un Alif Maqsoora (ى) suivi de la fin d'un mot (non-arabe, espace, ou fin de chaîne).
    // Capture 1: L'Alif Maqsoora
    // Capture 2: Le délimiteur de fin de mot (pour le conserver)
    const imalaRegex = new RegExp(`(${ALIF_MAKSURA})([\s\p{P}]|$)`, 'gu'); // \p{P} pour la ponctuation Unicode

    // Insère le point d'Imāla après l'Alif Maqsoora
    processedText = processedText.replace(imalaRegex, `$1${IMALA_POINT}$2`);

    return processedText;
}

/**
 * @function applyIqlab
 * @param {string} text - Le texte arabe à traiter.
 * @returns {string} Le texte avec la règle de l'Iqlāb appliquée.
 * Règle : Si un Noon Sakin (نْ) ou un Tanween (ً ٍ ٌ) rencontre la lettre Bāʾ (ب),
 * insérer automatiquement le petit Meem vertical de l'Iqlāb (IQLAB_MEEM) au-dessus de la lettre (avant le Bāʾ),
 * et supprimer le diacritique d'origine du Noon Sakin/Tanween (Sukūn ou Tanween).
 * Ex: "مِن بَعدُ" (min ba'du) -> "مِمْ بَعدُ" (mim ba'du), "سميعٌ بصيرٌ" (samee'un baseer) -> "سميعٌ۠ بصيرٌ"
 */
function applyIqlab(text) {
    let processedText = text;
    const { NOON, SUKUN, TANWEEN_FATHA, TANWEEN_DAMMA, TANWEEN_KASRA, BA, IQLAB_MEEM } = UNICODE_WARSH;

    // Pattern pour Noon Sakin ou Tanween
    const noonSakinOrTanweenPattern = `(${NOON}${SUKUN}|${TANWEEN_FATHA}|${TANWEEN_DAMMA}|${TANWEEN_KASRA})`;

    // Regex: (Noon Sakin ou Tanween) + (éventuels diacritiques/espaces) + (Bāʾ)
    // Capture 1: Le Noon Sakin ou Tanween
    // Capture 2: Le Bāʾ
    // Le diacritique d'origine du Noon Sakin/Tanween sera supprimé par le remplacement.
    const iqlabRegex = new RegExp(`(${NOON}${SUKUN}|${TANWEEN_FATHA}|${TANWEEN_DAMMA}|${TANWEEN_KASRA})(${ALL_DIACRITICS_PATTERN}*\s*)(${BA})`, 'gu');

    processedText = processedText.replace(iqlabRegex, (match, noonOrTanween, spaceAndDiacritics, ba) => {
        // Supprimer le Sukun ou le Tanween d'origine, insérer le Meem de l'Iqlab juste avant le Bāʾ.
        // Pour Noon Sakin, il devient juste Noon sans Sukun, puis le Meem d'Iqlab.
        // Pour Tanween, le Tanween est remplacé par le Meem d'Iqlab.
        if (noonOrTanween.includes(NOON) && noonOrTanween.includes(SUKUN)) {
            return `${NOON}${IQLAB_MEEM}${spaceAndDiacritics}${ba}`; // Ex: نْ -> نْ۠
        } else {
            // Si c'est un Tanween, le remplacer par le IQLAB_MEEM sur la lettre précédente (simplification).
            // La position exacte du IQLAB_MEEM est importante (sur la lettre précédant le Ba).
            // Une approche plus précise serait de remonter à la lettre avant le Tanween.
            // Pour une implémentation regex simple, on le met juste avant le Ba en supprimant le Tanween.
            return `${IQLAB_MEEM}${spaceAndDiacritics}${ba}`; // Ex: ٌ -> ٌ۠ (le ۠ sera sur la lettre avant le Tanween)
        }
    });

    return processedText;
}

// =======================================================
//             MODULES TAQLEEL & IMALAH
// =======================================================
// TODO: Implémenter Taqleel et Imalah selon les règles de Warsh.
// Ces règles sont très contextuelles et dépendent de la racine du mot et de sa position.
// Elles nécessiteront probablement des listes de mots prédéfinis ou une analyse morphologique.

// =======================================================
//             MODULES IDGHAAM & IZHAAR
// =======================================================
// TODO: Implémenter Idghaam (intégration) et Izhaar (manifestation).
// Règles pour Noon Sakin et Tanween avec différentes lettres. Ex: Idghaam بغنّة, Idghaam بلا غنّة, Izhaar.

// =======================================================
//             MODULES TARQEEQ & TAGHLEETH
// =======================================================
// TODO: Implémenter Tarqeeq (amincissement) et Taghleeth (épaississement).
// Ces règles concernent principalement le Lām (ل) et le Rāʾ (ر) selon leur contexte et diacritiques.

// =======================================================
//             MODULES YA'UL IDHAFAH & ZA'IDAH
// =======================================================
// TODO: Implémenter Ya'ul Idhafah (Ya de possession) et Ya'ul Za'idah (Ya additionnel).

// =======================================================
//           MODULE D'ORCHESTRATION DES RÈGLES
// =======================================================

/**
 * @function orchestrerReglesWarsh
 * @param {string} inputText - Le texte arabe brut à convertir.
 * @returns {string} Le texte arabe après application de toutes les règles de Tajweed de Warsh.
 * Cette fonction applique toutes les règles de Tajweed implémentées dans un ordre logique.
 * L'ordre d'application est crucial car certaines règles peuvent affecter la détection ou l'application d'autres règles.
 */
function orchestrerReglesWarsh(inputText) {
    let resultText = cleanArabicString(inputText); // Toujours commencer par nettoyer le texte.

    // 1. Appliquer les règles de Naql et Iltiqaa'i Sakinayn (affectent directement les séquences de caractères).
    resultText = applyBasicNaql(resultText);
    resultText = applyIltiqaaSakinayn(resultText);
    resultText = applyExtendedNaql(resultText); // Placeholder pour l'instant.

    // 2. Appliquer Madd Badal (peut modifier les formes de Hamza).
    resultText = applyMaddBadal(resultText);

    // 3. Appliquer Iqlab (introduit le petit Meem).
    resultText = applyIqlab(resultText);

    // 4. Appliquer Madd Silah (introduit le petit Waw).
    resultText = applyMaddSilah(resultText);

    // 5. Appliquer Madd Leen (dépend des Fathah + Waw/Ya Sukun existants).
    resultText = applyMaddLeen(resultText);

    // 6. Appliquer Madd Ana (spécifique au mot 'أنا').
    resultText = applyMaddAna(resultText);

    // 7. Appliquer Imala (modifie Alif Maqsoora).
    resultText = applyImala(resultText);

    // TODO: Intégrer les autres modules (Tasheel, Ibdaal, Hamzatul Mufrad, Taqleel & Imalah, Idghaam & Izhaar, Tarqeeq & Taghleeth, Ya'ul Idhafah & Za'idah) ici
    // lorsque leurs fonctions respectives seront implémentées.

    return resultText;
}

// =======================================================
//             FONCTION D'INTERFACE EXTERNE
// =======================================================

/**
 * @function handleConvert
 * @param {string} inputText - Le texte arabe d'entrée depuis le frontend.
 * @returns {string} Le texte arabe traité avec les règles de Warsh.
 * Cette fonction sert de point d'entrée pour l'application frontend (par exemple, un `index.html`).
 * Elle prend le texte brut, l'orchestre à travers les règles de Tajweed, et retourne le résultat.
 */
function handleConvert(inputText) {
    if (typeof inputText !== 'string') {
        console.error("handleConvert: L'entrée doit être une chaîne de caractères.");
        return "";
    }
    console.log("Début de la conversion Warsh...");
    const convertedText = orchestrerReglesWarsh(inputText);
    console.log("Conversion Warsh terminée.");
    return convertedText;
}

// Pour les tests en environnement Node.js ou pour rendre les fonctions accessibles en dehors d'un contexte de navigateur,
// on pourrait utiliser module.exports si ce fichier était un module CommonJS.
// Dans le contexte d'une application web chargée via <script>, ces fonctions seront disponibles globalement via window.
// Si utilisé en module ESM:
// export { UNICODE_WARSH, cleanArabicString, removeDiacritics, isDiacritic, getNextMeaningfulChar, getPrevMeaningfulChar,
//          applyBasicNaql, applyExtendedNaql, applyIltiqaaSakinayn, applyMaddSilah, applyMaddBadal, applyMaddLeen, applyMaddAna, applyImala, applyIqlab,
//          orchestrerReglesWarsh, handleConvert };

// Pour un usage direct dans le navigateur (global scope via <script> tag):
// Aucune instruction d'exportation n'est nécessaire, les fonctions sont attachées à window si besoin.
