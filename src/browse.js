// Pure helpers for the Browse view (no DOM), so they can be unit-tested.

export const LATIN = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
// independent vowels, then consonants, in dictionary order
export const DEVA = [..."अआइईउऊऋएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह"];

const latinSort = new Intl.Collator("en").compare;
const devaSort = new Intl.Collator("hi").compare;

// first letter for each script; NFD splits ज़ into ज + nukta, so it files under ज
export const latinLetter = (w) => w.romanised[0][0].toUpperCase();
export const devaLetter = (w) => w.headword.normalize("NFD")[0];

export function letterCounts(words, script) {
  const key = script === "deva" ? devaLetter : latinLetter;
  const counts = new Map();
  for (const w of words) counts.set(key(w), (counts.get(key(w)) ?? 0) + 1);
  return counts;
}

export const posValues = (words) => [...new Set(words.map((w) => w.pos))].sort(latinSort);

export function browse(words, { script = "latin", letter = null, pos = null } = {}) {
  const key = script === "deva" ? devaLetter : latinLetter;
  return words
    .filter((w) => (!letter || key(w) === letter) && (!pos || w.pos === pos))
    .sort(script === "deva" ? (a, b) => devaSort(a.headword, b.headword) : (a, b) => latinSort(a.romanised[0], b.romanised[0]));
}
