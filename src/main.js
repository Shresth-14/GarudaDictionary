// ponytail: bare search list to prove the pipeline end to end; detail screen, routing and no-results UI come next.
import words from "../data/words.json";
import { buildIndex, search } from "./search.js";
import "./style.css";

const idx = buildIndex(words);
const q = document.getElementById("q");
const out = document.getElementById("results");

function card(w) {
  const li = document.createElement("article");
  li.innerHTML = `<h2 lang="hi"></h2><p lang="sa-Latn"></p><p></p>`;
  const [h, t, m] = li.children;
  h.textContent = w.headword;
  t.textContent = w.transliteration;
  m.textContent = w.meanings.join("; ");
  return li;
}

function render() {
  const { results, suggestions } = search(idx, q.value);
  const nodes = results.map(card);
  if (suggestions.length) {
    const h = document.createElement("h3");
    h.textContent = results.length ? "Similar words" : "Did you mean…";
    nodes.push(h, ...suggestions.map(card));
  }
  out.replaceChildren(...nodes);
}

q.addEventListener("input", render);
q.focus();
