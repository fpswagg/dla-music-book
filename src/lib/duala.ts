/**
 * Duala orthography helpers.
 *
 * The printed book writes the open vowels with an underline (e̱ = ɛ, o̱ = ɔ, using U+0331
 * COMBINING MACRON BELOW), the velar nasal as ń / ŋ, syllabic ḿ, and elisions with ’ (Mun’a).
 * Search ignores all of that so people can type on any keyboard.
 */

/** Characters offered by the Duala keyboard helper, in display order. */
export const DUALA_CHARS: ReadonlyArray<{ char: string; hint: string }> = [
  { char: "e̱", hint: "e souligné (ɛ)" },
  { char: "o̱", hint: "o souligné (ɔ)" },
  { char: "ɛ", hint: "ɛ" },
  { char: "ɔ", hint: "ɔ" },
  { char: "ŋ", hint: "ŋ" },
  { char: "ń", hint: "ń" },
  { char: "ḿ", hint: "ḿ" },
  { char: "é", hint: "é" },
  { char: "è", hint: "è" },
  { char: "ô", hint: "ô" },
  { char: "’", hint: "apostrophe (Mun’a)" },
];

const LETTER_FOLD: Record<string, string> = { ɛ: "e", ɔ: "o", ŋ: "n", œ: "oe", æ: "ae", ß: "ss" };

/**
 * Lower-case, strip every diacritic (including the underline), fold ɛ/ɔ/ŋ to e/o/n, drop
 * apostrophes (so "Mun’a" = "mun'a" = "muna") and collapse punctuation to single spaces.
 */
export function normalizeForSearch(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[ɛɔŋœæß]/g, (c) => LETTER_FOLD[c] ?? c)
    .replace(/['’ʼ‘`´]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Words of a search query, normalised. */
export function searchTokens(query: string): string[] {
  return normalizeForSearch(query).split(" ").filter(Boolean);
}

/** Text stored in Song.searchText. */
export function buildSearchText(parts: Array<string | null | undefined>): string {
  return normalizeForSearch(parts.filter(Boolean).join(" \n "));
}

/** Insert `text` at the caret of an input/textarea and keep React in sync. */
export function insertAtCursor(el: HTMLInputElement | HTMLTextAreaElement, text: string): string {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const next = el.value.slice(0, start) + text + el.value.slice(end);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(start + text.length, start + text.length);
  });
  return next;
}
