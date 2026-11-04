import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Public word list for other apps and AI tools: api/words.json (all entries) and api/words/<slug>.json (one entry).
// ponytail: static files written at build time; a query endpoint (?q=dharm) would need a server.
function wordApi() {
  return {
    name: "word-api",
    generateBundle() {
      const words = JSON.parse(readFileSync("data/words.json", "utf8"));
      const emit = (fileName, data) => this.emitFile({ type: "asset", fileName, source: JSON.stringify(data, null, 2) });
      emit("api/words.json", words);
      for (const w of words) emit(`api/words/${w.romanised[0]}.json`, w);
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
