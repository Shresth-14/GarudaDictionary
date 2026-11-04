import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // ponytail: relative base works on GitHub Pages under any repo name; switch to '/<repo>/' only if a path breaks.
  base: "./",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      // the 750 KB source logo stays out of the offline cache; the app uses the small PNGs made from it
      workbox: { globPatterns: ["**/*.{js,css,html,png,woff2,json}"] },
      manifest: {
        name: "Garuda Dictionary (prototype)",
        short_name: "Garuda Kosh",
        description: "Hindi and Sanskrit words, searchable in Devanagari or Roman letters.",
        theme_color: "#c4000b",
        background_color: "#fdfaf5",
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
