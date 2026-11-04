import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { skeleton } from "../src/normalise.js";
import { buildIndex, search, findEntry, slug, schwaVariants } from "../src/search.js";

const words = JSON.parse(readFileSync(new URL("../data/words.json", import.meta.url), "utf8"));
const idx = buildIndex(words);
const top = (q) => search(idx, q).results[0]?.headword;
const guess = (q) => search(idx, q).suggestions[0]?.headword;

test("Devanagari and every stored romanised spelling reach the same entry", () => {
  for (const w of words) {
    assert.equal(top(w.headword), w.headword, w.headword);
    assert.equal(top(w.transliteration), w.headword, w.transliteration);
    for (const r of w.romanised) assert.equal(top(r), w.headword, r);
  }
});

test("spellings not in the romanised list", () => {
  const cases = {
    shikshaa: "शिक्षा", SHIKSHA: "शिक्षा", "  shiksha  ": "शिक्षा",
    vruksha: "वृक्ष", vrikshaa: "वृक्ष",
    shaanthi: "शांति", shanthi: "शांति", "शान्ति": "शांति",
    prakaash: "प्रकाश", bhaashaa: "भाषा", satyaa: "सत्य", premm: "प्रेम",
  };
  for (const [q, want] of Object.entries(cases)) assert.equal(top(q), want, q);
});

test("an extra schwa is a confident match, in Roman or Devanagari", () => {
  const cases = {
    karam: "कर्म", shabad: "शब्द", sapana: "सपना", paran: "प्राण", paraan: "प्राण",
    "करम": "कर्म", "शबद": "शब्द", "परेम": "प्रेम", "सतय": "सत्य",
  };
  for (const [q, want] of Object.entries(cases)) assert.equal(top(q), want, q);
  assert.deepEqual([...schwaVariants("karam")].sort(), ["kram", "karm", "krm"].sort());
  assert.equal(schwaVariants("dost").size, 0); // no "a" between two consonants, nothing to drop
});

test("an extra schwa never turns one stored word into another", () => {
  const keys = new Map(words.map((w) => [skeleton(w.headword), w.headword]));
  for (const [k, head] of keys) for (const v of schwaVariants(k))
    assert.ok(!keys.has(v), `${head} (${k}) collides with ${keys.get(v)} once an "a" is dropped`);
});

test("while typing, words spelled that way come first", () => {
  const sha = search(idx, "sha").results.map((w) => w.headword);
  assert.ok(sha.length > 0, "no list while typing");
  assert.deepEqual(sha.slice(0, 3).sort(), ["शक्ति", "शब्द", "शांति"].sort()); // shabd, shanti, shakti, before samay and sukh
  assert.ok(search(idx, "dh").results.length > 0);
});

test("a clear match comes without guesses beside it", () => {
  assert.equal(top("dhyan"), "ध्यान");
  assert.deepEqual(search(idx, "dhyan").suggestions, []);  // not ज्ञान
  assert.deepEqual(search(idx, "Dharmmm").suggestions, []); // not कर्म
  assert.equal(guess("prakesh"), "प्रकाश");                 // no clear match, so guesses still show
});

test("typos and Sanskrit -am endings are offered as suggestions, not results", () => {
  assert.equal(top("shikhsa"), "शिक्षा"); // folds to the same key, so a confident match
  assert.equal(top("prakesh"), undefined);
  assert.equal(guess("prakesh"), "प्रकाश");
  assert.equal(guess("satyam"), "सत्य");
  assert.equal(guess("vriksham"), "वृक्ष");
});

test("a word not in the data is never shown as a confident match", () => {
  // ज्ञानी (gyani) and योगी (yogi) are absent; their nearest entries may only be suggestions
  assert.equal(top("gyani"), undefined);
  assert.equal(guess("gyani"), "ज्ञान");
  assert.equal(top("yogi"), undefined);
  assert.equal(guess("yogi"), "योग");
  assert.equal(top("shakti"), "शक्ति"); // and once a word is added, it wins outright
});

test("curated dataset: 60+ entries and no two headwords share a search key", () => {
  assert.ok(words.length >= 60, `only ${words.length} entries`);
  const seen = new Map();
  for (const w of words) {
    const k = skeleton(w.headword);
    assert.ok(!seen.has(k), `${w.headword} and ${seen.get(k)} share the key "${k}"`);
    seen.set(k, w.headword);
  }
});

test("near pairs stay apart", () => {
  const pairs = { sukh: "सुख", dukh: "दुःख", ped: "पेड़", ved: "वेद", gun: "गुण", guru: "गुरु",
    pita: "पिता", mata: "माता", rat: "रात", fool: "फूल", larki: "लड़की", zameen: "ज़मीन", gyan: "ज्ञान" };
  for (const [q, want] of Object.entries(pairs)) assert.equal(top(q), want, q);
  assert.deepEqual(search(idx, "tree").results.map((w) => w.headword).sort(), ["पेड़", "वृक्ष"].sort());
});

test("English meaning is a fallback", () => {
  assert.equal(top("education"), "शिक्षा");
  assert.equal(top("truth"), "सत्य");
});

test("no results", () => {
  const none = { results: [], suggestions: [] };
  assert.deepEqual(search(idx, "xyzq"), none);
  assert.deepEqual(search(idx, ""), none);
  assert.deepEqual(search(idx, "   "), none);
});

test("skeleton regression guards (over-eager rules broke these)", () => {
  assert.equal(skeleton("धर्म"), skeleton("dharm"));
  assert.notEqual(skeleton("हरि"), skeleton("हर"));
  assert.equal(skeleton("agni"), skeleton("अग्नि"));
  assert.equal(skeleton("priya"), skeleton("प्रिय"));
  // precomposed ज़ (U+095B) and ज + nukta must give the same key
  assert.equal(skeleton("ज़मीन"), skeleton("ज़मीन"));
});

test("word links (#/word/...) resolve to the right entry", () => {
  for (const w of words) assert.equal(findEntry(idx, slug(w))?.id, w.id, slug(w));
  assert.equal(findEntry(idx, "dharma").headword, "धर्म");
  assert.equal(findEntry(idx, "dharm").headword, "धर्म");   // any spelling works
  assert.equal(findEntry(idx, "धर्म").headword, "धर्म");    // so does Devanagari
  assert.equal(findEntry(idx, "xyzq"), null);
  assert.equal(findEntry(idx, "prakesh"), null);          // a typo suggestion is not a link target
});
