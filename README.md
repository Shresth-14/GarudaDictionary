<p align="center"><img src="public/logo.png" alt="Garuda" height="96"></p>

# Garuda Dictionary (prototype)

A phone-first, offline-capable prototype front-end for Garuda Prakashan's dictionary. Type a Hindi or Sanskrit word in Devanagari (धर्म), IAST (dharma) or the way most people actually type it in Roman letters (dharm, dharam), and land on the same entry.

- **Live app:** https://shresth-14.github.io/GarudaDictionary/
- **Demo video:** _add link_
- **Dataset:** 65 curated entries in [`data/words.json`](data/words.json)

## Features

| Brief | What the app does |
|---|---|
| **Must:** Devanagari and Roman search return the same entry | धर्म, dharma, dharm, dharam and DHARMA all open धर्म, including spellings that aren't stored (shaanthi, vruksha, zameen) |
| **Must:** entry detail screen with all fields | Headword, IAST, part of speech, numbered meanings, example sentence and every romanised spelling. Each word has its own link (`#/word/dharma`), and any spelling works in the link (`#/word/dharm`, `#/word/धर्म`) |
| **Must:** works well on a phone | Phone-first layout with a sticky search bar, 44px+ tap targets, large Devanagari type, and light and dark themes. Installable to the home screen |
| **Must:** clear no-results state | Shows the query, explains what to type, and offers example searches to tap |
| **Bonus:** typo-tolerant search | Typos are offered under "Did you mean…", never shown as if they were the answer |
| **Bonus:** works offline | A service worker caches the app and dataset after the first visit |
| **Bonus:** recent searches or bookmarks | The last 8 words viewed, plus saved words (☆ Save), both on the home screen |

The home screen also shows a **word of the day**.

## How to run

```bash
npm install
npm run dev      # local dev server at http://localhost:5173
npm test         # dataset validator + search tests
npm run build    # production build in dist/
```

Every push to `main` runs the tests, builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`).

## How it works

| File | Role |
|---|---|
| `data/words.json` | The dataset, in the brief's format: `id, headword, transliteration, romanised, pos, meanings, example` |
| `src/normalise.js` | Turns any input (Devanagari, IAST or loose Roman) into one ASCII "skeleton" key |
| `src/search.js` | Finds and ranks matches; returns confident **results** and **"Did you mean…"** suggestions separately; resolves word links |
| `src/store.js` | Recently viewed and saved words, stored as entry ids in the browser's `localStorage` |
| `src/main.js`, `src/style.css` | The UI: home, results and detail views, switched by the URL hash with no router library |
| `scripts/validate.mjs` | Dataset checks, run before every test and build |
| `test/` | Search tests on the real dataset, including Indic edge cases; storage tests |

The app is fully static: no backend, no database. The dataset is bundled with the app and cached by a service worker, so search works offline after the first visit.

## Typing in Roman beyond the stored spellings

Each entry already lists common spellings (`dharma`, `dharm`, `dharam`), but users type many more. So search doesn't depend on that list. Every query and every entry is reduced to the same **skeleton key**:

1. **Devanagari is converted to Latin letters** with a small hand-written table. It deletes the silent final "a" (कर्म → karm), treats ज्ञ as "gy", maps nukta letters (ज़ → z, ड़ → d), and treats anusvara and chandrabindu alike.
2. **IAST diacritics are stripped**, and ṛ becomes "ri".
3. **Common spelling differences are folded:**
   - sh/s, ch/c and v/w are treated as the same;
   - ph/f, z/j and ksh/x are treated as the same;
   - aspirate "h" after a consonant is dropped (dh → d);
   - long vowels are shortened (aa → a, ee → i, oo → u);
   - doubled letters and the final "a" are dropped.

| Query | Key | Finds |
|---|---|---|
| धर्म · dharma · dharm · DHARMA | `darm` | धर्म |
| shikshaa · śikṣā · shiksa | `siks` | शिक्षा |
| vruksha · vṛkṣa · vrikshaa | `vrks` | वृक्ष |
| shaanthi · शान्ति · shanti | `santi` | शांति |
| gyan · jnana · gnana | `gyan` | ज्ञान |
| zameen · jamin · ज़मीन (either Unicode form) | `jamin` | ज़मीन |

**Ranking, in order:**
1. exact Devanagari headword;
2. exact stored spelling or IAST;
3. same skeleton key;
4. prefix, for live typing;
5. typos, allowing 0, 1 or 2 letter changes depending on word length;
6. English meaning, only when nothing else matches ("truth" finds सत्य).

Typo matches never pose as answers. They appear under **"Did you mean…"**, so "shakti" can't silently become शांति. Sanskrit "-am" endings (satyam, vriksham) are tried as a stem, and also only as a suggestion.

**Tested edge cases:**
- **Unicode:** precomposed vs decomposed nukta (U+095B vs ज + ़).
- **Matching spellings:** half-न vs anusvara (शान्ति = शांति), and South Indian "th" (shanthi).
- **Rule guards:** हरि must not collapse to हर, and अग्नि and प्रिय must survive.
- **Near pairs stay apart:** sukh/dukh, ped/ved, gun/guru, pita/mata.
- **Coverage:** all 324 stored forms in the dataset return their own entry first.

## Data

There are 65 entries:
- the 10 starter entries, unchanged;
- 33 Indic and civilisational terms (dharma, yoga, guru, ātmā, mokṣa, saṃskṛti, yajña, darśana…);
- 22 everyday words (pānī, ghar, kitāb, nadī, phūl, sapnā…).

Entries were drafted with AI and reviewed by hand. Genders were cross-checked against Wiktionary's Hindi data (61 of 65 matched; the rest are listed in the AI log), and example sentences were read by native Hindi speakers. Words were chosen so that no two headwords share a search key, and a test enforces this.

## Trade-offs

- **Static JSON, not a database.** At 65 entries a linear scan takes under a millisecond and works offline. Past roughly 10,000 entries the search would need an n-gram or trie index.
- **A hand-written key builder, not a transliteration library.** Sanscript and similar tools are built for display. They keep the silent "a" and treat शांति and शान्ति as different words, so they make poor search keys.
- **A lossy key.** Folding spellings means some real pairs share a key (कम and काम both become "kam"). Ranking and the stored spellings resolve this. The curated set avoids such pairs, and adding them later would need a test like the near-pairs one.
- **Simplified schwa rule.** It handles common words but not every compound.
- **Web app, not an APK.** One link works on any phone with no install, and it can still be added to the home screen and used offline.
- **No backend.** Saved and recent words live in the browser, so they stay on one device and don't sync. Storage errors (for example in private browsing) are caught, and the app works without them.
- **Hash links (`#/word/dharma`) rather than real paths.** They work on any static host with no server rewrite rules.

## With 2 more weeks

- A larger, editor-reviewed dataset, with Garuda's editors checking every entry.
- Short notes on words that lose meaning in translation (dharma ≠ "religion"), reviewed by Garuda's editors.
- Audio pronunciation recorded by native speakers.
- A public JSON API and an embeddable widget, so other sites, apps and AI assistants can look up Garuda's definitions.
- Learning new spelling variants from what users actually search for.

## AI use

Built with AI assistance (Claude Code) and reviewed and tested by me. See [`AI_Log.md`](AI_Log.md) for the tools used, key prompts, and what was kept, changed or rejected.
