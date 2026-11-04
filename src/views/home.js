import { search } from "../search.js";
import { idx, wordOfTheDay } from "../data.js";
import { el, icon, splitPos } from "../ui/dom.js";
import { resultOption, wordHref } from "../ui/rows.js";
import { searchBox, noResults } from "../ui/searchbox.js";

function wordOfTheDaySection() {
  const w = wordOfTheDay();
  const { pos } = splitPos(w.pos);
  return el("section", { class: "wotd", "aria-labelledby": "wotd-label" },
    el("p", { class: "eyebrow ruled", id: "wotd-label" }, "Word of the day"),
    el("div", { class: "wotd-body" },
      el("a", { class: "wotd-word", href: wordHref(w), lang: "hi" }, w.headword),
      el("div", { class: "wotd-text" },
        el("p", { class: "wotd-meta" }, el("span", { class: "iast", lang: "sa-Latn" }, w.transliteration), ` · ${pos}`),
        el("p", { class: "wotd-meaning" }, w.meanings[0])),
      el("a", { class: "circle-link", href: wordHref(w), "aria-label": `Explore ${w.transliteration}` }, icon("arrow", 22))));
}

function shortcuts() {
  const item = (href, mark, label) => el("a", { class: "shortcut", href }, el("span", { class: "shortcut-mark" }, mark), el("span", {}, label));
  return el("nav", { class: "shortcuts", "aria-label": "Explore the collection" },
    item("#/browse", el("span", { class: "glyph" }, "A–Z"), "Browse A–Z"),
    item("#/browse/devanagari", el("span", { class: "glyph", lang: "hi" }, "अ"), "Devanagari index"),
    item("#/saved", icon("bookmark", 28), "Saved words"),
    item("#/recent", icon("clock", 28), "Recently viewed"));
}

export function renderHome(app, { signal }) {
  document.title = "Garuda Dictionary";
  const list = el("div", { id: "search-list", role: "listbox", "aria-label": "Matching words" });
  const panel = el("div", { class: "panel", hidden: true }, list);
  const box = searchBox({
    listbox: list,
    onInput: fill,
    onFocus: fill,
    onEscape: close,
    onSubmit(q) {
      const top = q && search(idx, q).results[0];
      if (top) location.hash = wordHref(top);
      else fill(q);
    },
  });

  function close() { panel.hidden = true; box.setExpanded(false); }
  function fill(q) {
    if (!q) return close();
    const { results, suggestions } = search(idx, q);
    let n = 0;
    const opts = (ws) => ws.map((w) => resultOption(w, `opt-${n++}`));
    const nodes = opts(results);
    if (suggestions.length) nodes.push(el("p", { class: "panel-label", role: "presentation" }, "Did you mean…"), ...opts(suggestions));
    list.replaceChildren(...nodes);
    panel.querySelector(".no-results")?.remove();
    if (!n) panel.append(noResults(q, (t) => { box.input.value = t; box.input.dispatchEvent(new Event("input")); box.input.focus(); }));
    panel.hidden = false;
    box.setExpanded(n > 0);
  }

  const searchWrap = el("div", { class: "search-wrap" }, box.form, panel);
  // close the dropdown when clicking anywhere outside the search
  document.addEventListener("pointerdown", (e) => { if (!searchWrap.contains(e.target)) close(); }, { signal });

  app.replaceChildren(
    el("section", { class: "hero" },
      el("h1", { class: "display" }, "A Living Dictionary of Hindi and Sanskrit"),
      el("p", { class: "lede" }, "Explore words, meanings and the linguistic heritage behind them."),
      searchWrap),
    wordOfTheDaySection(),
    shortcuts());
}
