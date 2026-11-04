import words from "../data/words.json";
import { buildIndex } from "./search.js";

export { words };
export const idx = buildIndex(words);
export const byId = new Map(words.map((w) => [w.id, w]));
export const entries = (ids) => ids.map((id) => byId.get(id)).filter(Boolean); // ignores ids from older datasets

// same word for everyone on a given day, cycling through the dataset
export const wordOfTheDay = (now = Date.now()) => words[Math.floor(now / 864e5) % words.length];
