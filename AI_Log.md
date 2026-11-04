# AI Log

## Tools

| Tool | Used for |
|---|---|
| Claude Code (Claude Opus 5.5) | Researching Garuda Prakashan and Indic search techniques, planning the architecture, writing the search and setup code, and drafting dictionary entries. I reviewed and tested all of it. |
| Claude Code (same workflow, later session work) | The second phase: editorial redesign (colour tokens, type scale, layouts), the Browse / Saved / Recent views, the word detail layout, and publishing the dataset as JSON for other apps and AI tools. |
| Node test runner, Vite build, browser | Checking the AI's output |

**Chat:** Claude Code sessions. The first built the search, data and setup; later ones did the redesign, extra views and JSON API.

## Key decisions: what AI proposed, and what I kept, changed or rejected

| Area | AI proposal | Outcome |
|---|---|---|
| Stack | Static Vite web app, offline-capable, hosted on GitHub Pages | **Kept.** I chose it over an Expo APK (free builds can queue 90+ minutes, and graders would have to sideload) and over Vercel's free plan (non-commercial use only, which conflicts with a publisher adopting the app). |
| Search | Reduce every query (Devanagari, IAST or loose Roman) to one shared spelling key, then rank results in tiers | **Kept, with corrections.** Three of its first spelling rules merged different words: हरि became हर, and अग्नि and प्रिय broke. Tests caught them, the rules were removed, and each is now a regression test. |
| Transliteration library | Use Sanscript to build search keys | **Rejected.** It treated शांति and शान्ति as different words and leaked stray nukta marks. The key builder is written by hand instead. |
| Typo results | Show near matches alongside exact ones | **Changed.** A stress test showed "shakti" returning शांति and भक्ति as if they were answers. Near matches now appear only under "Did you mean…". |
| Dataset source | Import entries from open-source dictionaries (Monier-Williams and Apte via the Cologne Digital Sanskrit Dictionaries, and Wiktionary via kaikki.org) | **Tried, then replaced.** I built the import, but bulk entries had no example sentences or romanised spellings and were too many to verify. The brief asks for entries in its own format, checked for accuracy, so I curated 65 entries myself with the help of AI, reviewed each one manually, and used Wiktionary only to cross-check genders. |
| Integration | Make the dictionary usable by other apps and AI tools | **Kept, scoped down.** The build writes static JSON (`api/words.json`, `api/words/<slug>.json`) from `data/words.json`, plus an `llms.txt` guide, so it can't drift from the app. A `?q=dharm` search endpoint would need a server, so it is listed under "2 more weeks" rather than faked. These files are kept out of the offline cache because the app already bundles the words. |
| Brand colour | Use the brand gold for text and metadata | **Changed.** Gold on ivory was too faint to read, so text uses a darker gold (#8A6D3B) and the brand gold is kept for rules and accents. |
| Links | Real URL paths for each word | **Changed to hash links** (`#/word/dharma`). They work on any static host with no rewrite rules, and any spelling or Devanagari works in the link. |
| Fonts | Rely on system fonts for Devanagari | **Changed to self-hosted fonts** (Noto Serif Devanagari, Inter; Latin and Devanagari subsets only). Most phones can't show serif Devanagari headwords, and self-hosting keeps them working offline, at about 380 KB. |

## Prompts that shaped the work

1. *"Here are draft entries. Flag anything likely to be wrong (gender, IAST, anusvara vs chandrabindu, invented meanings) and say which reference to check it against. Don't fix anything yourself."*
   The AI flagged आत्मा's gender (Hindi f. vs Sanskrit m.), योग's "sum" sense, the ṃ convention in IAST, and its own example sentences as needing review.
2. *"Give me real spellings Indian users would type that are likely to break my search."*
   Of 28 spellings run through the search, 4 failed: shakti, yogi, satyam and vriksham. The fixes were a separate "Did you mean…" list and a stem guess for Sanskrit "-am" endings. All 28 now behave correctly, and each case is covered by a test.
3. *"Why does it take dharma as karma?"* (after seeing "dharm" suggest कर्म in the browser)
   धर्म wasn't in the live data yet, so कर्म, one letter away, was correctly shown only as a suggestion. Once the dataset was merged, "dharm" went straight to धर्म.

## How I checked facts, data and code

- **Grammatical gender:** cross-checked all 65 entries against Wiktionary's Hindi data. 61 matched, including आत्मा (f.) and योग's "sum" sense. The other 4 (वेद, पुराण, तपस्या, सूरज) had no Wiktionary noun entry to compare against.
- **Search:** an automated test confirms that all 324 stored forms (headword, IAST and every romanised spelling) return their own entry first. Further tests check that no two headwords share a search key, that near pairs (sukh/dukh, ped/ved, gun/guru, pita/mata) stay apart, and that unseen spellings, typos, Unicode nukta forms and the English fallback all work.
- **Dataset:** a validator runs before every build and test. It checks required fields, unique ids, Unicode normalisation (NFC), Devanagari-only headwords, and duplicate spellings across entries.
- **Example sentences:** read by native Hindi speakers, including myself.
- **Unverified notes removed:** the AI drafted short "why not just *religion*?" notes for six words. I couldn't verify every claim in them, so I removed them rather than ship unchecked content.
- **Attribution:** no Garuda dictionary product could be confirmed, so the app is presented as a prototype.
- **Still open:** confirming the 4 unmatched genders in Platts.
