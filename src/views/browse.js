import { words } from "../data.js";
import { LATIN, DEVA, browse, letterCounts, posValues } from "../browse.js";
import { el } from "../ui/dom.js";
import { entryRow } from "../ui/rows.js";

const PAGE = 24;

export function renderBrowse(app, script) {
  document.title = "Browse · Garuda Dictionary";
  const counts = letterCounts(words, script);
  const state = { letter: null, pos: null, shown: PAGE };
  const letters = el("div", { class: "letters", role: "group", "aria-label": "Filter by first letter" });
  const posGroup = el("div", { class: "chips", role: "group", "aria-label": "Filter by part of speech" });
  const count = el("p", { class: "list-count", "aria-live": "polite" });
  const list = el("ul", { class: "index" });
  const more = el("button", { type: "button", class: "more" });

  const toggle = (label, pressed, onclick, attrs = {}) =>
    el("button", { type: "button", class: "toggle", "aria-pressed": pressed ? "true" : "false", onclick, ...attrs }, label);

  function render() {
    letters.replaceChildren(
      toggle("All", !state.letter, () => set({ letter: null })),
      ...(script === "deva" ? DEVA : LATIN).map((l) => toggle(l, state.letter === l, () => set({ letter: l }), {
        disabled: !counts.has(l), lang: script === "deva" ? "hi" : null,
        "aria-label": counts.has(l) ? `${l}, ${counts.get(l)} words` : `${l}, no words`,
      })));
    posGroup.replaceChildren(
      toggle("All", !state.pos, () => set({ pos: null })),
      ...posValues(words).map((p) => toggle(p, state.pos === p, () => set({ pos: p }))));
    const all = browse(words, { script, letter: state.letter, pos: state.pos });
    count.textContent = `${all.length} word${all.length === 1 ? "" : "s"}`;
    list.replaceChildren(...all.slice(0, state.shown).map((w) => entryRow(w)));
    if (!all.length) list.append(el("li", { class: "empty-row" }, "No words match these filters."));
    more.hidden = all.length <= state.shown;
    more.textContent = `Show more (${all.length - state.shown} left)`;
  }
  function set(change) { Object.assign(state, change, { shown: PAGE }); render(); }
  more.addEventListener("click", () => { state.shown += PAGE; render(); });

  const tab = (href, label, on, lang) => el("a", { href, class: "tab", "aria-current": on ? "page" : null, lang }, label);
  app.replaceChildren(el("section", { class: "page" },
    el("p", { class: "eyebrow" }, "The collection"),
    el("h1", { class: "page-title", tabindex: "-1" }, "Browse"),
    el("nav", { class: "tabs", "aria-label": "Index" },
      tab("#/browse", "A–Z", script !== "deva"),
      tab("#/browse/devanagari", "अ–ह", script === "deva", "hi")),
    letters,
    el("div", { class: "filter-row" }, el("span", { class: "filter-label" }, "Part of speech"), posGroup),
    count, list, more));
  render();
}
