import { slug } from "../search.js";
import { el, icon } from "./dom.js";

export const wordHref = (w) => `#/word/${encodeURIComponent(slug(w))}`;

// one line of the collection: headword, IAST, first meaning
export function entryRow(w, ...extra) {
  return el("li", { class: "row" },
    el("a", { class: "row-link", href: wordHref(w) },
      el("span", { class: "row-head", lang: "hi" }, w.headword),
      el("span", { class: "row-iast", lang: "sa-Latn" }, w.transliteration),
      el("span", { class: "row-meaning" }, w.meanings[0])),
    ...extra);
}

// a selectable search result (role="option"), used by the dropdown and the results column
export function resultOption(w, id, { current = false, compact = false } = {}) {
  return el("a", { class: `opt${current ? " is-current" : ""}`, id, role: "option", "aria-selected": "false",
      "aria-current": current ? "true" : null, href: wordHref(w) },
    el("span", { class: "opt-text" },
      el("span", { class: "opt-head", lang: "hi" }, w.headword),
      el("span", { class: "opt-iast", lang: "sa-Latn" }, w.transliteration),
      !compact && el("span", { class: "opt-meta" }, `${w.pos} · ${w.meanings[0]}`)),
    el("span", { class: "opt-arrow" }, icon("arrow", 18)));
}
