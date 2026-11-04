// Shared search field: an ARIA combobox whose listbox (dropdown or results column) is owned by the view.
import { el, icon } from "./dom.js";

// the query survives moving between home and word pages, and a reload, within one tab
const KEY = "query";
export const getQuery = () => { try { return sessionStorage.getItem(KEY) ?? ""; } catch { return ""; } };
export const setQuery = (q) => { try { sessionStorage.setItem(KEY, q); } catch { /* storage unavailable */ } };

export function searchBox({ listbox, onInput, onSubmit, onEscape, onFocus }) {
  const input = el("input", {
    class: "search-input", type: "text", value: getQuery(), placeholder: "Search a word · शब्द खोजें",
    "aria-label": "Search the dictionary in Devanagari or Roman letters", role: "combobox",
    "aria-autocomplete": "list", "aria-controls": listbox.id, "aria-expanded": "false",
    autocomplete: "off", autocapitalize: "off", autocorrect: "off", spellcheck: "false",
    inputmode: "search", enterkeyhint: "search",
  });
  const clear = el("button", { class: "search-clear", type: "button", "aria-label": "Clear search", hidden: !input.value }, icon("close", 20));
  const form = el("form", { class: "search", role: "search" },
    el("span", { class: "search-icon" }, icon("search", 22)),
    input,
    clear,
    el("button", { class: "search-go", type: "submit", "aria-label": "Search" }, icon("arrow", 22)));

  let active = -1;
  const options = () => [...listbox.querySelectorAll('[role="option"]')];
  function setActive(i) {
    const o = options();
    o.forEach((x, j) => x.setAttribute("aria-selected", j === i ? "true" : "false"));
    active = o[i] ? i : -1;
    if (o[i]) { input.setAttribute("aria-activedescendant", o[i].id); o[i].scrollIntoView({ block: "nearest" }); }
    else input.removeAttribute("aria-activedescendant");
  }
  function changed() {
    setQuery(input.value);
    clear.hidden = !input.value;
    onInput(input.value.trim());
    setActive(-1);
  }

  input.addEventListener("input", changed);
  input.addEventListener("focus", () => onFocus?.(input.value.trim()));
  input.addEventListener("keydown", (e) => {
    const o = options();
    if (e.key === "ArrowDown" && o.length) { e.preventDefault(); setActive((active + 1) % o.length); }
    else if (e.key === "ArrowUp" && o.length) { e.preventDefault(); setActive(active <= 0 ? o.length - 1 : active - 1); }
    else if (e.key === "Enter" && o[active]) { e.preventDefault(); o[active].click(); }
    else if (e.key === "Escape") { setActive(-1); onEscape?.(); }
  });
  form.addEventListener("submit", (e) => { e.preventDefault(); onSubmit(input.value.trim()); });
  clear.addEventListener("click", () => { input.value = ""; changed(); input.focus(); });

  const setExpanded = (open) => input.setAttribute("aria-expanded", open ? "true" : "false");
  return { form, input, setExpanded, resetActive: () => setActive(-1) };
}

const EXAMPLES = ["dharm", "धर्म", "shaanthi", "gyan", "vruksha"];

// shown when a query matches nothing, not even a near spelling
export function noResults(query, onTry) {
  return el("div", { class: "no-results" },
    el("p", { class: "no-results-title" }, `No match for “${query}”`),
    el("p", {}, "Try a Hindi or Sanskrit word in Devanagari or Roman letters:"),
    el("div", { class: "tries" }, ...EXAMPLES.map((t) =>
      el("button", { type: "button", lang: /[ऀ-ॿ]/.test(t) ? "hi" : "hi-Latn", onclick: () => onTry(t) }, t))));
}
