import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Public word list for other apps and AI tools:
//   api/words.json (all entries), api/words/<slug>.json (one entry),
//   api/index.json (every slug with its links) and api/meta.json (version, size, fields, licence).
// ponytail: static files written at build time; a query endpoint (?q=dharm) would need a server.
const SITE = "https://shresth-14.github.io/GarudaDictionary";
function wordApi() {
  return {
    name: "word-api",
    generateBundle() {
      const words = JSON.parse(readFileSync("data/words.json", "utf8"));
      const pkg = JSON.parse(readFileSync("package.json", "utf8"));
      const emit = (fileName, data) => this.emitFile({ type: "asset", fileName, source: JSON.stringify(data, null, 2) });
      emit("api/words.json", words);
      for (const w of words) emit(`api/words/${w.romanised[0]}.json`, w);
      emit("api/index.json", words.map((w) => ({
        id: w.id, slug: w.romanised[0], headword: w.headword, transliteration: w.transliteration,
        api: `${SITE}/api/words/${w.romanised[0]}.json`,
        page: `${SITE}/#/word/${w.romanised[0]}`,
        embed: `${SITE}/#/word/${w.romanised[0]}?embed=1`,
      })));
      emit("api/meta.json", {
        name: "Garuda Dictionary (prototype)",
        version: pkg.version,
        built: new Date().toISOString(),
        entries: words.length,
        fields: Object.keys(words[0]),
        // the licence is Garuda Prakashan's decision; until it is made, nothing here grants reuse rights
        license: "Prototype data. No reuse licence has been granted yet.",
        files: { all: `${SITE}/api/words.json`, index: `${SITE}/api/index.json`, entry: `${SITE}/api/words/{slug}.json` },
      });
    },
  };
}

export default defineConfig({
  // ponytail: relative base works on GitHub Pages under any repo name; switch to '/<repo>/' only if a path breaks.
  base: "./",
  plugins: [
    wordApi(),
    VitePWA({
      registerType: "autoUpdate",
      // the 750 KB source logo stays out of the offline cache; the app uses the small PNGs made from it
      // the app already bundles the words, so the public API files are left out too;
      // Inter's non-Latin subsets are never used, so they are not cached for offline either
      workbox: { globPatterns: ["**/*.{js,css,html,png,woff2,json}"], globIgnores: ["api/**", "**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2"] },
      manifest: {
        name: "Garuda Dictionary (prototype)",
        short_name: "Garuda Kosh",
        description: "Hindi and Sanskrit words, searchable in Devanagari or Roman letters.",
        theme_color: "#682B38",
        background_color: "#F5F0E6",
        display: "standalone",
        start_url: ".",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
