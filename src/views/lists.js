import { entries, words } from "../data.js";
import { recent, saved, toggleSaved } from "../store.js";
import { el } from "../ui/dom.js";
import { entryRow } from "../ui/rows.js";

function page(eyebrow, title, ...body) {
  return el("section", { class: "page narrow" },
    el("p", { class: "eyebrow" }, eyebrow),
    el("h1", { class: "page-title", tabindex: "-1" }, title),
    ...body);
}

const empty = (text) => el("div", { class: "empty" }, el("p", {}, text), el("p", {}, el("a", { href: "#/browse" }, "Browse the collection")));

export function renderSaved(app) {
  document.title = "Saved words · Garuda Dictionary";
  const list = el("ul", { class: "index single" });
  function render() {
    const ws = entries(saved());
    list.replaceChildren(...ws.map((w) => entryRow(w, el("button", {
      type: "button", class: "remove", "aria-label": `Remove ${w.headword} (${w.transliteration}) from saved`,
      onclick: () => { toggleSaved(w.id); render(); },
    }, "Remove"))));
    if (!ws.length) list.replaceWith(empty("No saved words yet. Open any word and press Save."));
  }
  app.replaceChildren(page("Your vocabulary", "Saved words", list));
  render();
}

export function renderRecent(app) {
  document.title = "Recently viewed · Garuda Dictionary";
  const ws = entries(recent());
  app.replaceChildren(page("History", "Recently viewed",
    ws.length ? el("ul", { class: "index single" }, ...ws.map((w) => entryRow(w)))
      : empty("Words you open will appear here.")));
}

export function renderAbout(app) {
  document.title = "About · Garuda Dictionary";
  const fact = (term, desc) => [el("dt", {}, term), el("dd", {}, desc)];
  app.replaceChildren(page("About", "Garuda Dictionary",
    el("dl", { class: "facts" },
      ...fact("What it is", "A prototype front-end for Garuda Prakashan's dictionary."),
      ...fact("Entries", `${words.length} curated Hindi and Sanskrit words, each with IAST, romanised spellings, part of speech, meanings and an example sentence.`),
      ...fact("Search", "Devanagari, IAST or everyday Roman spelling: dharm, dharam and धर्म all find the same word."),
      ...fact("Offline", "Works without a connection after the first visit, and can be installed to a phone's home screen."))));
}
