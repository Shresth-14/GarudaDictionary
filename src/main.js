// ponytail: two views (results list, entry detail) switched by the URL hash; no router library.
import words from "../data/words.json";
import { buildIndex, search, findEntry, slug } from "./search.js";
import "./style.css";

const idx = buildIndex(words);
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

function card(w) {
  return el("a", { class: "card", href: wordHref(w) },
    el("h2", { lang: "hi" }, w.headword),
    el("p", { lang: "sa-Latn", class: "iast" }, w.transliteration),
    el("p", {}, w.meanings.join("; ")));
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
  if (!query) return out.replaceChildren(hint("Search the dictionary"));
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
  const heading = el("h2", { lang: "hi", tabindex: "-1" }, w.headword);
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
    share));
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
