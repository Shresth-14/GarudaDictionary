// Dataset checks: run before every build and test. Exits non-zero on any problem.
import { readFileSync } from "node:fs";

const words = JSON.parse(readFileSync(new URL("../data/words.json", import.meta.url), "utf8"));
const errors = [];
const ids = new Set();
const variantOwner = new Map();
const isStr = (v) => typeof v === "string" && v.trim() !== "";
const nfc = (v) => v === v.normalize("NFC");

for (const w of words) {
  const at = `entry ${w.id} (${w.headword})`;
  if (!Number.isInteger(w.id)) errors.push(`${at}: id must be an integer`);
  if (ids.has(w.id)) errors.push(`${at}: duplicate id`);
  ids.add(w.id);

  for (const f of ["headword", "transliteration", "pos", "example"])
    if (!isStr(w[f])) errors.push(`${at}: missing ${f}`);
  for (const f of ["romanised", "meanings"])
    if (!Array.isArray(w[f]) || !w[f].length || !w[f].every(isStr)) errors.push(`${at}: ${f} must be a non-empty list of strings`);
  if (errors.length) continue;

  if (!/^[ऀ-ॿ\s]+$/.test(w.headword)) errors.push(`${at}: headword must be Devanagari only`);
  for (const s of [w.headword, w.transliteration, w.example, ...w.romanised, ...w.meanings])
    if (!nfc(s)) errors.push(`${at}: "${s}" is not NFC-normalised`);

  // the first romanised spelling is the entry's link (#/word/dharma), so it must be plain lowercase letters
  if (!/^[a-z]+$/.test(w.romanised[0])) errors.push(`${at}: first romanised spelling "${w.romanised[0]}" must be lowercase a–z (it is the word link)`);

  for (const r of w.romanised) {
    const v = r.toLowerCase();
    if (variantOwner.has(v) && variantOwner.get(v) !== w.id && !w.homograph)
      errors.push(`${at}: variant "${v}" also belongs to entry ${variantOwner.get(v)} (set "homograph": true if intended)`);
    variantOwner.set(v, w.id);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`words.json OK: ${words.length} entries`);
