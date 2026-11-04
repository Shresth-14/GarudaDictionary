// ponytail: two views (home/results, entry detail) switched by the URL hash; no router library.
import words from "../data/words.json";
import { buildIndex, search, findEntry, slug } from "./search.js";
import { recent, addRecent, saved, isSaved, toggleSaved } from "./store.js";
import "./style.css";

const idx = buildIndex(words);
const byId = new Map(words.map((w) => [w.id, w]));
const entries = (ids) => ids.map((id) => byId.get(id)).filter(Boolean); // ignores ids from older datasets
const q = document.getElementById("q");
const out = document.getElementById("results");
const TITLE = document.title;

// small DOM helper; text always goes in via textContent, never as HTML
function el(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  n.append(...children);
  return n;
}

const wordHref = (w) => `#/word/${encodeURIComponent(slug(w))}`;

function card(w, extraClass = "") {
  return el("a", { class: `card ${extraClass}`.trim(), href: wordHref(w) },
    el("h2", { lang: "hi" }, w.headword),
    el("p", { class: "iast" }, el("span", { lang: "sa-Latn" }, w.transliteration), el("span", { class: "pos" }, ` · ${w.pos}`)),
    el("p", {}, w.meanings.join("; ")));
}

// same word for everyone on a given day, cycling through the dataset
const wordOfTheDay = () => words[Math.floor(Date.now() / 864e5) % words.length];

function home() {
  const nodes = [el("p", { class: "label" }, "Word of the day"), card(wordOfTheDay(), "featured")];
  const r = entries(recent());
  if (r.length) nodes.push(el("p", { class: "label" }, "Recently viewed"),
    el("ul", { class: "chips links" }, ...r.map((w) => el("li", {}, el("a", { href: wordHref(w), lang: "hi" }, w.headword)))));
  const s = entries(saved());
  if (s.length) nodes.push(el("p", { class: "label" }, "Saved"), ...s.map((w) => card(w)));
  nodes.push(hint("Search the dictionary"));
  return nodes;
}

const EXAMPLES = ["dharm", "धर्म", "shaanthi", "gyan", "vruksha"];

// shown before the first keystroke and when nothing matches
function hint(title) {
  const tries = el("div", { class: "tries" }, ...EXAMPLES.map((t) => {
    const b = el("button", { type: "button", lang: /[ऀ-ॿ]/.test(t) ? "hi" : "hi-Latn" }, t);
    b.addEventListener("click", () => { q.value = t; renderList(); q.focus(); });
    return b;
  }));
  return el("section", { class: "empty" },
    el("h2", {}, title),
    el("p", {}, "Type a Hindi or Sanskrit word in Devanagari or Roman letters. dharm, dharma and धर्म all find the same word."),
    el("p", { class: "try-label" }, "Try:"),
    tries);
}

function renderList() {
  document.title = TITLE;
  const query = q.value.trim();
  const { results, suggestions } = search(idx, query);
  if (!query) return out.replaceChildren(...home());
  if (!results.length && !suggestions.length) return out.replaceChildren(hint(`No match for “${query}”`));
  const nodes = results.map(card);
  if (suggestions.length) nodes.push(el("h3", {}, results.length ? "Similar words" : "Did you mean…"), ...suggestions.map(card));
  out.replaceChildren(...nodes);
}

function section(label, ...content) {
  return el("section", {}, el("h3", {}, label), ...content);
}

function renderDetail(key) {
  const w = findEntry(idx, key);
  const back = el("a", { class: "back", href: "#/" }, "← Back");
  if (!w) {
    document.title = TITLE;
    out.replaceChildren(back, el("p", { class: "missing" }, `No entry for “${key}”.`));
    return;
  }
  document.title = `${w.headword} (${w.transliteration}) · ${TITLE}`;
  addRecent(w.id);
  const heading = el("h2", { lang: "hi", tabindex: "-1" }, w.headword);
  const save = el("button", { type: "button", class: "save" });
  const paint = (on) => { save.textContent = on ? "★ Saved" : "☆ Save"; save.setAttribute("aria-pressed", on); };
  paint(isSaved(w.id));
  save.addEventListener("click", () => paint(toggleSaved(w.id)));
  const share = el("button", { type: "button" }, "Share link");
  share.addEventListener("click", async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url });
      else { await navigator.clipboard.writeText(url); share.textContent = "Link copied"; }
    } catch { /* user cancelled the share sheet */ }
  });
  out.replaceChildren(el("article", { class: "detail" },
    back,
    heading,
    el("p", { lang: "sa-Latn", class: "iast" }, w.transliteration),
    el("p", { class: "pos" }, w.pos),
    section("Meanings", el("ol", {}, ...w.meanings.map((m) => el("li", {}, m)))),
    section("Example", el("blockquote", { lang: "hi" }, w.example)),
    section("Also spelled", el("ul", { class: "chips", lang: "hi-Latn" }, ...w.romanised.map((r) => el("li", {}, r)))),
    el("div", { class: "actions" }, save, share)));
  scrollTo(0, 0);
  heading.focus();
}

function route() {
  const m = location.hash.match(/^#\/word\/(.+)$/);
  if (m) renderDetail(decodeURIComponent(m[1]));
  else renderList();
}

q.addEventListener("input", () => {
  if (location.hash.startsWith("#/word/")) location.hash = "#/"; // typing returns to the results list
  else renderList();
});
addEventListener("hashchange", route);
route();
if (!location.hash.startsWith("#/word/")) q.focus();
