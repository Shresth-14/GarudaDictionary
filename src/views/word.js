import { search, findEntry } from "../search.js";
import { idx } from "../data.js";
import { addRecent, isSaved, toggleSaved } from "../store.js";
import { el, icon, splitPos } from "../ui/dom.js";
import { resultOption, wordHref } from "../ui/rows.js";
import { searchBox, getQuery, setQuery, noResults } from "../ui/searchbox.js";
import { listenButton } from "../ui/speak.js";

function entry(w) {
  const { pos, gender } = splitPos(w.pos);
  const heading = el("h1", { class: "entry-word", lang: "hi", tabindex: "-1" }, w.headword);

  const save = el("button", { type: "button", class: "action" });
  const paint = (on) => {
    save.replaceChildren(icon("bookmark", 20), on ? "Saved" : "Save");
    save.setAttribute("aria-pressed", on ? "true" : "false");
  };
  paint(isSaved(w.id));
  save.addEventListener("click", () => paint(toggleSaved(w.id)));

  const share = el("button", { type: "button", class: "action" }, icon("share", 20), "Share");
  share.addEventListener("click", async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url });
      else { await navigator.clipboard.writeText(url); share.replaceChildren(icon("share", 20), "Link copied"); }
    } catch { /* share sheet cancelled */ }
  });

  const hint = el("p", { class: "listen-hint", role: "status", hidden: true },
    "This device has no Hindi voice, so the pronunciation may sound off. Add one in your phone's text-to-speech settings.");
  const showHint = () => { hint.hidden = false; };
  const listenWord = listenButton({ text: w.headword, label: `Listen to ${w.transliteration}`, onNoVoice: showHint });
  const listenExample = w.example && listenButton({ text: w.example, label: "Listen to the example sentence", rate: 0.8, labelled: true, onNoVoice: showHint });

  const section = (title, ...body) => el("section", { class: "entry-section" }, el("h2", {}, title), ...body);
  return el("article", { class: "entry" },
      el("header", { class: "entry-head" },
        el("div", { class: "entry-title" },
          el("div", { class: "entry-word-row" }, heading, listenWord),
          el("p", { class: "entry-iast", lang: "sa-Latn" }, w.transliteration)),
        el("div", { class: "entry-gram" },
          el("p", { class: "eyebrow" }, pos),
          gender && el("p", { class: "entry-gender" }, gender)),
        el("div", { class: "entry-actions" }, save, share)),
      hint,
      section("Meaning", el("ol", { class: "meanings" }, ...w.meanings.map((m) => el("li", {}, m)))),
      w.example && el("section", { class: "entry-section" },
        el("div", { class: "section-head" }, el("h2", {}, "Example"), listenExample),
        el("blockquote", { class: "example", lang: "hi" }, w.example)),
      section("Also spelled", el("ul", { class: "pills", lang: "hi-Latn" }, ...w.romanised.map((r) => el("li", {}, r)))));
}

export function renderWord(app, key, { embed = false } = {}) {
  const w = findEntry(idx, key);
  const list = el("div", { id: "results-list", class: "results-list", role: "listbox", "aria-label": "Matching words" });
  const column = el("aside", { class: "results", "aria-label": "Search results" });
  const box = searchBox({
    listbox: list,
    // emptying the search field takes you back to the home page; replace, so Back doesn't bounce into it again
    onInput: (q) => (q ? fillColumn(q, true) : location.replace("#/")),
    onSubmit(q) {
      const top = q && search(idx, q).results[0];
      if (top) location.hash = wordHref(top);
    },
  });

  // the results column only appears for a real search; a word opened from a link stands alone
  function fillColumn(q, typed) {
    const r = q ? search(idx, q) : { results: [], suggestions: [] };
    const all = [...r.results, ...r.suggestions];
    const show = q && (typed || all.some((e) => e.id === w?.id));
    layout.classList.toggle("has-results", !!show);
    column.hidden = !show;
    box.setExpanded(!!show && all.length > 0);
    if (!show) return;
    let n = 0;
    const opts = (ws) => ws.map((e) => resultOption(e, `res-${n++}`, { current: e.id === w?.id, compact: true }));
    const count = r.results.length;
    list.replaceChildren(...opts(r.results));
    if (r.suggestions.length) list.append(el("p", { class: "panel-label", role: "presentation" }, "Did you mean…"), ...opts(r.suggestions));
    column.replaceChildren(
      el("p", { class: "results-count" }, count ? `${count} result${count > 1 ? "s" : ""} for “${q}”` : `No exact match for “${q}”`),
      list);
    if (!all.length) column.append(noResults(q, (t) => { box.input.value = t; box.input.dispatchEvent(new Event("input")); box.input.focus(); }));
  }

  const detail = el("div", { class: "detail" });
  const layout = el("div", { class: "word-layout" }, column, detail);

  if (!w) {
    document.title = "Not found · Garuda Dictionary";
    detail.append(el("div", { class: "not-found" },
      el("h1", { tabindex: "-1" }, `No entry for “${key}”`),
      el("p", {}, el("a", { href: "#/" }, "Back to the dictionary"))));
  } else {
    document.title = `${w.headword} (${w.transliteration}) · Garuda Dictionary`;
    if (!embed) addRecent(w.id);
    detail.append(entry(w));
  }

  if (embed) { // just the entry, with a credit link back to the full app
    const full = location.href.replace(/\?embed=1$/, "");
    app.replaceChildren(detail, el("p", { class: "embed-credit" },
      el("a", { href: full, target: "_blank", rel: "noopener" }, "Open in Garuda Dictionary ↗")));
    return;
  }
  app.replaceChildren(el("div", { class: "search-wrap top" }, box.form), layout);
  // a word we don't have (for example typed in the browser's search bar) shows the nearest guesses beside the message
  if (!w) { setQuery(key); fillColumn(key, true); } else fillColumn(getQuery().trim(), false);
}
