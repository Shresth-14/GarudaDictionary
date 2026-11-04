<p align="center"><img src="public/logo.png" alt="Garuda" height="96"></p>

# Garuda Dictionary (prototype)

A phone-first, offline-capable prototype front-end for Garuda Prakashan's dictionary. Type a Hindi or Sanskrit word in Devanagari (धर्म), IAST (dharma) or the way most people actually type it in Roman letters (dharm, dharam), and land on the same entry.

- **Live app:** https://shresth-14.github.io/GarudaDictionary/
- **Demo video:** _add link_
- **Dataset:** 66 curated entries in [`data/words.json`](data/words.json)

## Features

| Brief | What the app does |
|---|---|
| **Must:** Devanagari and Roman search return the same entry | धर्म, dharma, dharm, dharam and DHARMA all open धर्म, including spellings that aren't stored (shaanthi, vruksha, zameen) |
| **Must:** entry detail screen with all fields | Headword, IAST, part of speech and gender, numbered meanings, example sentence and every romanised spelling. After a search, results sit in a column beside the entry. Each word has its own link (`#/word/dharma`), and any spelling works in the link (`#/word/dharm`, `#/word/धर्म`) |
| **Must:** works well on a phone | A deliberate single-column phone layout: compact masthead with a menu, results as a scrolling strip of pills, 44px+ tap targets and large Devanagari type. Checked for overflow at 320, 375, 768 and 1440px. Installable to the home screen |
| **Must:** clear no-results state | Shows the query, explains what to type, and offers example searches to tap |
| **Bonus:** typo-tolerant search | Typos are offered under "Did you mean…", never shown as if they were the answer. The search dropdown works with ArrowUp/ArrowDown, Enter and Escape |
| **Bonus:** works offline | A service worker caches the app, dataset and fonts after the first visit |
| **Bonus:** recent searches or bookmarks | The last 8 words viewed, plus saved words (Save on any entry, Remove on the Saved page) |

| **Extra:** hear the word | A speaker button on every entry reads the headword aloud, and a Listen button reads the example sentence at a slower pace. It uses the phone's own Hindi voice, so it needs no audio files and works offline. If the device has no Hindi voice, the app says so instead of mispronouncing silently |

Also: a **word of the day** on the home page, and a **Browse** view with an A–Z index, a Devanagari (अ–ह) index and part-of-speech filters.

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
| `src/browse.js` | Letter indexes and filters for Browse (no DOM, unit-tested) |
| `src/main.js` | Routes the URL hash to a view, with no router library |
| `src/views/` | Home, word (results + entry), browse, and saved / recent / about |
| `src/ui/` | Shared search box (ARIA combobox), result rows, the speaker button (`speak.js`), icons and the `el()` helper |
| `src/style.css` | Design tokens (ivory, maroon, gold), type scale and layouts |
| `scripts/validate.mjs` | Dataset checks, run before every test and build |
| `test/` | Search tests on the real dataset, including Indic edge cases; storage and browse tests |

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
4. same key once an extra "a" between consonants is dropped (karam → कर्म, shabad → शब्द, करम → कर्म);
5. prefix, for live typing;
6. typos, allowing 0, 1 or 2 letter changes depending on word length;
7. English meaning, only when nothing else matches ("truth" finds सत्य).

Typo matches never pose as answers. They appear under **"Did you mean…"**, so "shakti" can't silently become शांति. Sanskrit "-am" endings (satyam, vriksham) are tried as a stem, and also only as a suggestion. When a word matches clearly, no guesses are shown beside it ("dhyan" gives ध्यान, not ध्यान plus ज्ञान).

The extra-"a" rule (step 4) exists because Hindi doesn't pronounce the vowel people hear and type in karam or shabad. It only counts when the result equals a stored key exactly, and a test checks that dropping an "a" never turns one stored word into another.

**Tested edge cases:**
- **Unicode:** precomposed vs decomposed nukta (U+095B vs ज + ़).
- **Extra vowels:** karam, shabad, sapana, paraan, and Devanagari typed the way it sounds (करम, शबद, परेम, सतय).
- **Matching spellings:** half-न vs anusvara (शान्ति = शांति), and South Indian "th" (shanthi).
- **Rule guards:** हरि must not collapse to हर, and अग्नि and प्रिय must survive.
- **Near pairs stay apart:** sukh/dukh, ped/ved, gun/guru, pita/mata.
- **Coverage:** all 331 stored forms in the dataset return their own entry first.

## Data

There are 66 entries:
- the 10 starter entries, unchanged;
- 33 Indic and civilisational terms (dharma, yoga, guru, ātmā, mokṣa, saṃskṛti, yajña, darśana…);
- 22 everyday words (pānī, ghar, kitāb, nadī, phūl, sapnā…);
- 1 entry added by the author: श्रेष्ठ (śreṣṭha, "best"), which is also his name.

Entries were drafted with AI and reviewed by hand. Genders were cross-checked against Wiktionary's Hindi data (61 of the first 65 matched; the rest are listed in the AI log; श्रेष्ठ is an adjective, so it has no gender to compare), and example sentences were read by native Hindi speakers. Words were chosen so that no two headwords share a search key, and a test enforces this.

## Using the dictionary in other apps and AI tools

The brief asked how this dictionary could plug into other apps, AI tools and platforms. My thinking was simple: a dictionary is most useful when you meet a hard word, and that usually happens on someone else's page, not in our app. So I tried to make the dictionary easy to take along.

Everything below is plain static files made when the site is built. There's no server to run, and the JSON is served with `Access-Control-Allow-Origin: *`, so JavaScript on any website can read it.

| What | Where | What it's for |
|---|---|---|
| **All entries** | [`/api/words.json`](https://shresth-14.github.io/GarudaDictionary/api/words.json) | The whole dataset, in the brief's format |
| **One entry** | [`/api/words/dharma.json`](https://shresth-14.github.io/GarudaDictionary/api/words/dharma.json) | A single word. The name is its first romanised spelling (`shiksha`, `gyan`, `vriksh`…) |
| **Index** | [`/api/index.json`](https://shresth-14.github.io/GarudaDictionary/api/index.json) | Every word with its data, page and embed links, so an app doesn't have to guess file names |
| **Dataset info** | [`/api/meta.json`](https://shresth-14.github.io/GarudaDictionary/api/meta.json) | Version, build time, number of entries, field names and licence status, so an app can tell when the data has changed |
| **A link to a word** | [`/#/word/dharm`](https://shresth-14.github.io/GarudaDictionary/#/word/dharm) | Any spelling, or Devanagari, opens the same entry |
| **An embeddable card** | `<iframe src=".../#/word/dharma?embed=1">` | A clean entry card with no menu or footer |
| **Browser search bar** | [`/opensearch.xml`](https://shresth-14.github.io/GarudaDictionary/opensearch.xml) | Lets you add "Garuda Dictionary" as a search engine |
| **For AI assistants** | [`/llms.txt`](https://shresth-14.github.io/GarudaDictionary/llms.txt) | A short plain-text guide to all of the above |

### Putting a word on any web page

This is the part I'm most pleased with. Imagine a blog post, a course page or a Notion note that mentions *dharma*. With one line of HTML, that page can show the full dictionary card right beside the word, so readers don't have to leave to look it up. Every card also has an "Open in Garuda Dictionary" link, so each use sends people back to Garuda.

```html
<iframe src="https://shresth-14.github.io/GarudaDictionary/#/word/dharma?embed=1"
        width="100%" height="760" style="border:0" title="धर्म, Garuda Dictionary"></iframe>
```

Swap `dharma` for any spelling (`karam`, `shreshth`, `धर्म`) and it finds the same word, because the link uses the same search as the app.

I tested this from a plain HTML page on my own computer, using different words and frame sizes. It taught me two things. The top of the Devanagari word was being clipped, so I added a little space above it. And my first height of 560px cut off the example sentence, so I measured the tallest of the 66 cards: it needs 688px on a wide page and 732px on a phone-width one. That's why I suggest 760px. I also tried it in Notion and in Google Sites, and the full card showed in both. In Notion the link has to go on an empty line in the page body, not in the title, and the box can be dragged taller.

### Reading the data from code

```bash
curl -s https://shresth-14.github.io/GarudaDictionary/api/words/dharma.json
```

```js
// from any web page
const w = await fetch("https://shresth-14.github.io/GarudaDictionary/api/words/dharma.json").then((r) => r.json());
console.log(w.headword, w.meanings); // धर्म ["righteous duty", ...]
```

### Searching from the address bar

The site advertises its search engine file, so Firefox offers to add it. In Chrome you add it yourself: Settings → Search engine → Manage search engines and site search → Add, and use the URL `https://shresth-14.github.io/GarudaDictionary/#/word/%s`. Then typing a word in the address bar takes you straight to it. If the word isn't in the dictionary, you get the closest suggestions instead of an error. I haven't been able to test the Chrome and Firefox settings screens myself, so treat these steps as untested.

### Which one should you use?

| If you are… | Use | You need |
|---|---|---|
| Writing a web page | the embed | to paste one line |
| Building an app or script | the JSON files | a few lines of `fetch` |
| Just looking a word up | a link, or the search bar | nothing |

### What this can't do yet

These are read-only files, so there's no `?q=dharm` search endpoint. An app that wants typo-tolerant search has to download `words.json` and match it itself. `meta.json` also says plainly that the data has no reuse licence yet, because that choice belongs to Garuda Prakashan, not to a prototype. The files are built from `data/words.json` every time the site is built, so they can't drift away from the app.

## Design

Swiss grid and editorial type on an ivory canvas: deep maroon (#682B38) for interaction, antique gold for rules and metadata, thin dividers instead of cards. Inter for the interface and Noto Serif Devanagari for Hindi and Sanskrit words. Both are self-hosted, so they work offline. Only the Latin and Devanagari subsets are cached. Gold text uses a darker shade (#8A6D3B) because the brand gold is too faint on ivory for readable text.

## Trade-offs

- **Static JSON, not a database.** At 66 entries a linear scan takes under a millisecond and works offline. Past roughly 10,000 entries the search would need an n-gram or trie index.
- **A hand-written key builder, not a transliteration library.** Sanscript and similar tools are built for display. They keep the silent "a" and treat शांति and शान्ति as different words, so they make poor search keys.
- **A lossy key.** Folding spellings means some real pairs share a key (कम and काम both become "kam"). Ranking and the stored spellings resolve this. The curated set avoids such pairs, and adding them later would need a test like the near-pairs one.
- **Simplified schwa rule.** It handles common words but not every compound.
- **Web app, not an APK.** One link works on any phone with no install, and it can still be added to the home screen and used offline.
- **No backend.** Saved and recent words live in the browser, so they stay on one device and don't sync. Storage errors (for example in private browsing) are caught, and the app works without them.
- **Self-hosted fonts.** About 380 KB of fonts is cached for offline use. That is the price of the serif Devanagari headwords, which most phones cannot show with their built-in fonts.
- **Hash links (`#/word/dharma`) rather than real paths.** They work on any static host with no server rewrite rules.

## Where integration goes next

What's live now is read-only. If Garuda wanted any software to be able to plug in, this is the order I'd build it, because each step needs the one before.

1. **A search API.** Something like `/search?q=karam` that returns ranked matches and "did you mean" suggestions, using the same matching as the app, on a small edge function with caching. The matching (any Roman spelling, typos, Devanagari) is the hardest part to copy, so it should be something other people can call. Everything below leans on it.
2. **A proper contract.** An OpenAPI spec, stable IDs, a versioned dataset with a changelog, and a real licence chosen by Garuda. Anyone building on this needs to know the data won't change shape under them.
3. **AI assistants.** An MCP server and tool definitions, so ChatGPT, Claude or Perplexity can look a word up and *cite Garuda* instead of guessing. Models often get Sanskrit and Hindi words wrong, so a source they can quote is worth a lot.
4. **Pages search engines can read.** One static page per word (`/w/dharma`) with schema.org markup and share previews. Right now words live behind `#/` links, which search engines and AI crawlers don't index.
5. **Easier widgets.** A one-line `<script>` widget, an embed that tells the host page its own height so nobody has to pick one, and a browser extension for looking up a selected word.
6. **Where people already type.** A WhatsApp or Telegram bot, and keyboard suggestions. Most people type Hindi in Roman letters on their phones, which is exactly what the search is built for.
7. **Access and cost.** API keys, rate limits and usage numbers, with a free tier and a paid one for commercial use.
8. **A feedback loop.** Log the searches that fail, let Garuda's editors approve them as new spellings, and later reach Marathi, Gujarati and other Indic languages.

Three risks I'd keep in view. Once other apps depend on a wrong meaning it travels further, so Garuda's editors need a way to review and correct entries. The licence and credit rules should be decided before wide reuse. And 66 entries is a prototype, so none of this matters until the dataset is large and reliable.

## With 2 more weeks

- A larger, editor-reviewed dataset, with Garuda's editors checking every entry.
- Short notes on words that lose meaning in translation (dharma ≠ "religion"), reviewed by Garuda's editors.
- Pronunciation recorded by native speakers. The current speaker button uses the phone's built-in voice, whose quality varies by device.
- The first steps of the [integration plan above](#where-integration-goes-next): a search API on an edge function, then an OpenAPI spec and an MCP server for AI assistants.
- Learning new spelling variants from what users actually search for.

## AI use

Built with AI assistance (Claude Code) and reviewed and tested by me. See [`AI_Log.md`](AI_Log.md) for the tools used, key prompts, and what was kept, changed or rejected.
