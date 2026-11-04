import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // ponytail: relative base works on GitHub Pages under any repo name; switch to '/<repo>/' only if a path breaks.
  base: "./",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      workbox: { globPatterns: ["**/*.{js,css,html,svg,png,woff2,json}"] },
      manifest: {
        name: "Garuda Dictionary (prototype)",
        short_name: "Garuda Kosh",
        description: "Hindi and Sanskrit words, searchable in Devanagari or Roman letters.",
        theme_color: "#7a2e0e",
        background_color: "#fdfaf5",
        display: "standalone",
        start_url: ".",
        // TODO: add 192px and 512px PNG icons before submission; Chrome's install prompt needs them.
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
    }),
  ],
});
