import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { skeleton } from "../src/normalise.js";
import { buildIndex, search } from "../src/search.js";

const words = JSON.parse(readFileSync(new URL("../data/words.json", import.meta.url), "utf8"));
const idx = buildIndex(words);
const top = (q) => search(idx, q)[0]?.headword;

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

test("typos within the length-based edit limit", () => {
  assert.equal(top("shikhsa"), "शिक्षा");
  assert.equal(top("prakesh"), "प्रकाश");
});

test("English meaning is a fallback", () => {
  assert.equal(top("education"), "शिक्षा");
  assert.equal(top("truth"), "सत्य");
});

test("no results", () => {
  assert.deepEqual(search(idx, "xyzq"), []);
  assert.deepEqual(search(idx, ""), []);
  assert.deepEqual(search(idx, "   "), []);
});

test("skeleton regression guards (over-eager rules broke these)", () => {
  assert.equal(skeleton("धर्म"), skeleton("dharm"));
  assert.notEqual(skeleton("हरि"), skeleton("हर"));
  assert.equal(skeleton("agni"), skeleton("अग्नि"));
  assert.equal(skeleton("priya"), skeleton("प्रिय"));
  // precomposed ज़ (U+095B) and ज + nukta must give the same key
  assert.equal(skeleton("ज़मीन"), skeleton("ज़मीन"));
});
