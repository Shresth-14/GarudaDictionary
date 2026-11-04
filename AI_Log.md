# AI Log

## What I used

I used Claude Code (Claude Opus 5.5) for most of this project. It helped me research Garuda Prakashan and how Indic search is usually done, plan the app, write the search and setup code, draft the dictionary entries, and later build the redesign, the Browse/Saved/Recent pages and the JSON files for other apps. I tested and reviewed what it gave me. I also used Claude to help tidy the wording of this log. The facts in it are from my own project.

To check the output I used the Node test runner, the Vite build, and the app in the browser.

## What I kept, changed or rejected

**Stack.** Claude suggested a static Vite web app that works offline and is hosted on GitHub Pages. I kept it. I chose it over an Expo APK because free builds can queue for 90+ minutes and reviewers would have to sideload the file. I also skipped Vercel's free plan since it is non-commercial only, and Garuda is a publisher.

**Search.** The idea was to turn every query (Devanagari, IAST or loose Roman) into one spelling key and then rank matches. I kept that, but fixed a few things. Three of its first spelling rules merged different words: हरि turned into हर, and अग्नि and प्रिय broke. The tests caught these, so I removed the rules and added each one as a regression test.

**Transliteration library.** Claude proposed Sanscript for the search keys. I rejected it because it treats शांति and शान्ति as different words and leaves stray nukta marks. The key builder is written by hand.

**Typo results.** At first near matches were shown next to exact ones. A stress test showed "shakti" returning शांति and भक्ति as if they were answers. Now near matches only appear under "Did you mean…".

**Dataset.** I first built an import from open dictionaries (Monier-Williams and Apte through the Cologne dictionaries, and Wiktionary through kaikki.org). The bulk entries had no example sentences or romanised spellings, and there were too many to check. The brief wants entries in its own format and checked for accuracy, so I dropped the import. I curated 65 entries with AI help, went through each one by hand, and used Wiktionary only to cross-check genders.

**JSON files for other apps and AI tools.** The build writes `api/words.json` and one file per word from `data/words.json`, plus an `llms.txt`. A real search endpoint (`?q=dharm`) needs a server, so I left it in the "2 more weeks" list.

**Gold text.** The brand gold was too faint on the ivory background, so text uses a darker gold (#8A6D3B). The brand gold is only used for lines and accents.

**Links.** I used hash links (`#/word/dharma`) instead of real paths, because they work on any static host without server rules.

**Fonts.** I self-host Noto Serif Devanagari and Inter (Latin and Devanagari only, about 380 KB) so the serif headwords show on phones and work offline.

## Prompts that shaped the work

1. *"Here are draft entries. Flag anything likely to be wrong (gender, IAST, anusvara vs chandrabindu, invented meanings) and say which reference to check it against. Don't fix anything yourself."*
   It flagged आत्मा's gender (Hindi f., Sanskrit m.), the "sum" meaning of योग, the ṃ convention in IAST, and its own example sentences.
2. *"Give me real spellings Indian users would type that are likely to break my search."*
   I ran 28 spellings. Four failed: shakti, yogi, satyam and vriksham. I fixed them with the separate "Did you mean…" list and a stem guess for Sanskrit "-am" endings. All 28 now work and each has a test.
3. *"Why does it take dharma as karma?"*
   I asked this after "dharm" suggested कर्म in the browser. धर्म was not in the live data yet, so कर्म (one letter away) correctly showed only as a suggestion. After the dataset was merged, "dharm" went straight to धर्म.

## How I checked things

- **Gender:** I compared all 65 entries with Wiktionary's Hindi data. 61 matched, including आत्मा (f.) and योग. The other 4 (वेद, पुराण, तपस्या, सूरज) had no noun entry on Wiktionary to compare against.
- **Search:** one test checks that all 324 stored forms (headword, IAST and every romanised spelling) return their own entry first. Other tests check that no two headwords share a key, that close pairs stay apart (sukh/dukh, ped/ved, gun/guru, pita/mata), and that unseen spellings, typos, nukta forms and the English fallback work.
- **Dataset:** a validator runs before every build and test. It checks required fields, unique ids, NFC normalisation, Devanagari-only headwords and duplicate spellings across entries.
- **Saved, recent and Browse:** these have their own tests (`test/store.test.mjs`, `test/browse.test.mjs`): newest first, no duplicates, a limit of 8, saving and unsaving, broken storage not crashing the app, and the letter and part-of-speech filters. Word links like `#/word/dharm` and `#/word/धर्म` are tested too.
- **Layout:** I checked for sideways overflow at 320, 375, 768 and 1440px.
- **Example sentences:** read by native Hindi speakers, including me.
- **Removed:** Claude wrote short "why not just *religion*?" notes for six words. I couldn't verify every claim in them, so I took them out.
- **Attribution:** I couldn't confirm an existing Garuda dictionary product, so the app is described as a prototype.
- **Still open:** the 4 unmatched genders should be checked in Platts.
