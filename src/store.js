// Recently viewed and saved words, as entry ids in localStorage.
// ponytail: per-device only (no accounts); reads and writes are wrapped because private browsing can throw.
const read = (k) => { try { return JSON.parse(localStorage.getItem(k)) ?? []; } catch { return []; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };

const MAX_RECENT = 8;
export const recent = () => read("recent");
export const addRecent = (id) => write("recent", [id, ...recent().filter((x) => x !== id)].slice(0, MAX_RECENT));

export const saved = () => read("saved");
export const isSaved = (id) => saved().includes(id);
export function toggleSaved(id) {
  const s = saved(), on = !s.includes(id);
  write("saved", on ? [id, ...s] : s.filter((x) => x !== id));
  return on;
}
