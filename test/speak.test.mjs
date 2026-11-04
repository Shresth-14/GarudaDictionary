import { test } from "node:test";
import assert from "node:assert/strict";
import { pickVoice, canSpeak } from "../src/ui/speak.js";

const v = (lang, name = lang) => ({ lang, name });

test("picks the Hindi voice a phone actually has", () => {
  assert.equal(pickVoice([v("en-US"), v("hi-IN", "Google हिन्दी")]).name, "Google हिन्दी");
  assert.equal(pickVoice([v("en-GB"), v("hi_IN", "Android")]).name, "Android"); // Android writes hi_IN
  assert.equal(pickVoice([v("en-US"), v("hi")]).lang, "hi");                   // any Hindi voice will do
  assert.equal(pickVoice([v("hi"), v("hi-IN", "exact")]).name, "exact");       // exact match wins
});

test("no Hindi voice means null, not a wrong-language voice", () => {
  assert.equal(pickVoice([v("en-US"), v("hr-HR"), v("hu-HU")]), null); // "hr" and "hu" are not Hindi
  assert.equal(pickVoice([]), null);
});

test("speech is optional: no speechSynthesis means no button, no crash", () => {
  assert.equal(canSpeak(), false); // plain Node has none
});

test("prefers the clearer voice over the first one in the list", () => {
  const compact = { lang: "hi-IN", name: "Lekha", localService: true };
  const neural = { lang: "hi-IN", name: "Microsoft Madhur Online (Natural)", localService: false };
  const google = { lang: "hi-IN", name: "Google हिन्दी", localService: false };
  assert.equal(pickVoice([compact, neural]).name, neural.name);
  assert.equal(pickVoice([compact, google]).name, google.name);
  assert.equal(pickVoice([{ lang: "hi", name: "Google हिन्दी" }, { lang: "hi-IN", name: "Plain" }]).name, "Plain"); // exact locale still counts most
});
