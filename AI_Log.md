# AI Log

## What I used

I used Claude Code (Claude Opus 5.5) for most of this project. It helped me research Garuda Prakashan and how Indic search is usually done, plan the app, write the search and setup code, draft the dictionary entries, and later build the redesign, the Browse/Saved/Recent pages and the JSON files for other apps. I tested and reviewed what it gave me.

To check the output I used the Node test runner, the Vite build, and the app in the browser.

## What I kept, changed or rejected

**Stack.** Claude suggested a static Vite web app that works offline and is hosted on GitHub Pages. I kept it. I chose it over an Expo APK because free builds can queue for 90+ minutes and reviewers would have to sideload the file. I also skipped Vercel's free plan since it is non-commercial only, and Garuda is a publisher.

**Search.** The idea was to turn every query (Devanagari, IAST or loose Roman) into one spelling key and then rank matches. I kept that, but fixed a few things. Three of its first spelling rules merged different words: हरि turned into हर, and अग्नि and प्रिय broke. The tests caught these, so I removed the rules and added each one as a regression test.

**Transliteration library.** Claude proposed Sanscript for the search keys. I rejected it because it treats शांति and शान्ति as different words and leaves stray nukta marks. The key builder is written by hand.

**Typo results.** At first near matches were shown next to exact ones. A stress test showed "shakti" returning शांति and भक्ति as if they were answers. Now near matches only appear under "Did you mean…".

**Dataset.** I first built an import from open dictionaries (Monier-Williams and Apte through the Cologne dictionaries, and Wiktionary through kaikki.org). The bulk entries had no example sentences or romanised spellings, and there were too many to check. The brief wants entries in its own format and checked for accuracy, so I dropped the import. I curated 65 entries with AI help, went through each one by hand, and used Wiktionary only to cross-check genders.

**JSON files for other apps and AI tools.** The build writes `api/words.json` and one file per word from `data/words.json`, plus an `llms.txt`. A real search endpoint (`?q=dharm`) needs a server, so I left it in the "2 more weeks" list.

**Links.** I used hash links (`#/word/dharma`) instead of real paths, because they work on any static host without server rules.

**Fonts.** I self-host Noto Serif Devanagari and Inter (Latin and Devanagari only, about 380 KB) so the serif headwords show on phones and work offline.

## Prompts that shaped the work

1. *"Here are draft entries. Flag anything likely to be     wrong (gender, IAST, anusvara vs chandrabindu, invented  meanings) and say which reference to check it against. Don't fix anything yourself."*
   It flagged आत्मा's gender (Hindi f., Sanskrit m.), the "sum" meaning of योग, the ṃ convention in IAST, and its own example sentences.

2. *"Give me real spellings Indian users would type that are likely to break my search."*
   I ran 28 spellings. Four failed: shakti, yogi, satyam and vriksham. I fixed them with the separate "Did you mean…" list and a stem guess for Sanskrit "-am" endings. All 28 now work and each has a test.

3. *"Why does it take dharma as karma?"*
   I asked this after "dharm" suggested कर्म in the browser. धर्म was not in the live data yet, so कर्म (one letter away) correctly showed only as a suggestion. After the dataset was merged, "dharm" went straight to धर्म.

4. *"Read the guidelines completely. Check what is done, what is left, and what I can improve for selection."*
   This turned up the biggest problem: the GitHub repo was still private, and the brief says private repos can't be reviewed. It also showed the demo video and Drive folder were still missing.

## How I checked things

**Automated tests (24, run with `npm test` and again in CI before every deploy)**
- **Round trip:** every one of the 331 stored forms (headword, IAST and each romanised spelling) must return its own entry first.
- **No collisions:** no two headwords may share a search key, and dropping an extra "a" must never turn one stored word into another.
- **Close pairs:** sukh/dukh, ped/ved, gun/guru and pita/mata must stay apart.
- **Real typing:** spellings that aren't stored (shaanthi, vruksha, karam, shabad, करम), typos, both Unicode forms of nukta letters, and the English fallback.
- **Guesses:** a typo may only appear under "Did you mean", never as the answer (shakti must not become शांति).
- **App behaviour:** recent and saved lists (order, no duplicates, limit of 8, broken storage), the Browse filters, word links like `#/word/dharm` and `#/word/धर्म`, and the voice picker.

**Backtesting against real inputs**
- I ran 28 spellings that Indian users would type. 4 failed, and the fixes are now tests.
- Later I ran 134 more. 13 failed, mostly an extra "a" (karam, shabad), and that became its own rule and test. The 4 that still miss are different words or shown as suggestions.

**Dataset**
- **Validator:** it runs before every build and test. It checks required fields, unique ids, NFC normalisation, Devanagari-only headwords and duplicate spellings.
- **Gender:** I compared the first 65 entries with Wiktionary's Hindi data. 61 matched. The other 4 (वेद, पुराण, तपस्या, सूरज) had no noun entry there, so I checked them in Platts' dictionary (University of Chicago, DSAL). All 4 match: वेद s.m., पुराण adj. & s.m. (the noun sense is masculine), तपस्या s.f., सूरज s.m. So every gender in the first 65 entries is now checked against a published source.
- **श्रेष्ठ (śreṣṭha):** the 66th entry, added because it is my name. I checked it against Wiktionary's Hindi and Sanskrit entries and the Sanskrit dictionary pages on Wisdom Library. It is an adjective ("best, most excellent") with no gender, borrowed into Hindi from Sanskrit. The example sentence is a common saying, "ज्ञान सबसे श्रेष्ठ धन है।"
- **Example sentences:** read by native Hindi speakers, including me.
- **Removed:** Claude wrote short "why not just *religion*?" notes for six words. I couldn't verify every claim in them, so I took them out.

**The running app**
- I checked the layout in a real browser at 320, 360, 375, 390, 412 and 768px, with a script that flags anything past the page margin. It found tiles overflowing at 320px, which I fixed.
- I tapped through the main flows: opening the word of the day, clearing the search back to home, and the Browse letter strip.

