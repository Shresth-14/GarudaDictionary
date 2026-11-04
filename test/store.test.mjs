import { test } from "node:test";
import assert from "node:assert/strict";

const mem = new Map();
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)) };
const { recent, addRecent, saved, isSaved, toggleSaved } = await import("../src/store.js");

test("recents: newest first, no duplicates, capped at 8", () => {
  for (const id of [1, 2, 3, 2]) addRecent(id);
  assert.deepEqual(recent(), [2, 3, 1]);
  for (let id = 10; id < 20; id++) addRecent(id);
  assert.equal(recent().length, 8);
  assert.equal(recent()[0], 19);
});

test("saved: toggles on and off", () => {
  assert.equal(toggleSaved(7), true);
  assert.ok(isSaved(7));
  assert.equal(toggleSaved(7), false);
  assert.deepEqual(saved(), []);
});

test("broken storage never crashes the app", () => {
  mem.set("recent", "{not json");
  assert.deepEqual(recent(), []);
});
