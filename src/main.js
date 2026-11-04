// ponytail: views switched by the URL hash; no router library.
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/inter/wght-italic.css";
import "@fontsource/noto-serif-devanagari/devanagari-400.css";
import "@fontsource/noto-serif-devanagari/devanagari-600.css";
import "./style.css";
import { icon } from "./ui/dom.js";
import { renderHome } from "./views/home.js";
import { renderWord } from "./views/word.js";
import { renderBrowse } from "./views/browse.js";
import { renderSaved, renderRecent, renderAbout } from "./views/lists.js";
import { stopSpeaking } from "./ui/speak.js";

const app = document.getElementById("app");
const menuBtn = document.querySelector(".menu-btn");
const nav = document.getElementById("site-nav");
document.querySelector(".saved-link").append(icon("bookmark", 22));
menuBtn.append(icon("menu", 24));
menuBtn.addEventListener("click", () => {
  const open = menuBtn.getAttribute("aria-expanded") !== "true";
  menuBtn.setAttribute("aria-expanded", open);
  nav.classList.toggle("open", open);
});

const ROUTES = [
  [/^#\/word\/(.+)$/, "home", (m, embed) => renderWord(app, decodeURIComponent(m[1]), { embed })],
  [/^#\/browse\/devanagari$/, "browse", () => renderBrowse(app, "deva")],
  [/^#\/browse$/, "browse", () => renderBrowse(app, "latin")],
  [/^#\/saved$/, "saved", () => renderSaved(app)],
  [/^#\/recent$/, "home", () => renderRecent(app)],
  [/^#\/about$/, "about", () => renderAbout(app)],
];

let cleanup = null;
function route(first = false) {
  // clearing the search on a word page lands on home: keep the cursor in the search box
  const searching = document.activeElement?.classList.contains("search-input");
  stopSpeaking(); // never keep talking after the page changes
  cleanup?.abort();
  cleanup = new AbortController();
  // "#/word/dharma?embed=1" is the chrome-free card other sites put in an iframe
  const [path, query = ""] = location.hash.split("?");
  const embed = new URLSearchParams(query).get("embed") === "1";
  document.documentElement.toggleAttribute("data-embed", embed);
  const hit = ROUTES.map(([re, section, view]) => [path.match(re), section, view]).find(([m]) => m);
  if (hit) hit[2](hit[0], embed);
  else renderHome(app, { signal: cleanup.signal });
  const section = hit ? hit[1] : "home";
  for (const a of document.querySelectorAll("[data-nav]")) a.toggleAttribute("aria-current", a.dataset.nav === section);
  for (const a of document.querySelectorAll("[data-nav][aria-current]")) a.setAttribute("aria-current", "page");
  menuBtn.setAttribute("aria-expanded", "false");
  nav.classList.remove("open");
  if (!first) {
    scrollTo(0, 0);
    const box = searching && app.querySelector(".search-input");
    (box || (app.querySelector("h1[tabindex]") ?? app)).focus({ preventScroll: true });
  }
}

addEventListener("hashchange", () => route());
route(true);
