import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { browse, letterCounts, posValues, devaLetter, LATIN, DEVA } from "../src/browse.js";

const words = JSON.parse(readFileSync(new URL("../data/words.json", import.meta.url), "utf8"));

test("every entry is reachable from both indexes", () => {
  const latin = letterCounts(words, "latin"), deva = letterCounts(words, "deva");
  for (const k of latin.keys()) assert.ok(LATIN.includes(k), `latin letter ${k} missing from A–Z`);
  for (const k of deva.keys()) assert.ok(DEVA.includes(k), `Devanagari letter ${k} missing from the index`);
  assert.equal([...latin.values()].reduce((a, b) => a + b), words.length);
  assert.equal([...deva.values()].reduce((a, b) => a + b), words.length);
});

test("letter and part-of-speech filters", () => {
  assert.ok(browse(words, { letter: "D" }).every((w) => w.romanised[0].startsWith("d")));
  assert.ok(browse(words, { script: "deva", letter: "ध" }).some((w) => w.headword === "धर्म"));
  assert.equal(devaLetter({ headword: "ज़मीन" }), "ज"); // nukta letters file under their base letter
  const fem = browse(words, { pos: "noun (f.)" });
  assert.ok(fem.length > 0 && fem.every((w) => w.pos === "noun (f.)"));
  assert.deepEqual(posValues(words), ["adjective", "interjection", "noun (f.)", "noun (m.)"]);
});

test("results are sorted", () => {
  const r = browse(words).map((w) => w.romanised[0]);
  assert.deepEqual(r, [...r].sort(new Intl.Collator("en").compare));
});
