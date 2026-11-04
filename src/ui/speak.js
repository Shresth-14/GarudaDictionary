// Pronunciation through the browser's own text-to-speech: free, works offline when the phone has a Hindi voice installed.
import { el, icon } from "./dom.js";

export const canSpeak = () => typeof speechSynthesis !== "undefined" && typeof SpeechSynthesisUtterance !== "undefined";

// Best Hindi voice on the device. Hindi only; then exact hi-IN, then the clearer voice families
// (neural / enhanced / Google ones sound far less muddy than the default "compact" voices), then ones that work offline.
const CLEAR = /neural|natural|enhanced|premium|google|siri/i;
export function pickVoice(voices, lang = "hi-IN") {
  const base = lang.split("-")[0].toLowerCase();
  const norm = (v) => v.lang.replace("_", "-").toLowerCase();
  const score = (v) => (norm(v) === lang.toLowerCase() ? 4 : 0) + (CLEAR.test(v.name ?? "") ? 2 : 0) + (v.localService ? 1 : 0);
  return voices.filter((v) => norm(v).split("-")[0] === base).sort((a, b) => score(b) - score(a))[0] ?? null;
}

export const stopSpeaking = () => { if (canSpeak()) speechSynthesis.cancel(); };

// speaks `text`; returns the voice used (null when the device has no Hindi voice, so the caller can say so)
export function speak(text, { rate = 0.75, onEnd } = {}) {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(speechSynthesis.getVoices());
  u.lang = "hi-IN";
  if (voice) u.voice = voice;
  u.rate = rate;
  u.onend = u.onerror = () => onEnd?.();
  speechSynthesis.speak(u);
  return voice;
}

// a speaker button; pressing it again stops the audio
export function listenButton({ text, label, rate, labelled = false, onNoVoice }) {
  if (!canSpeak()) return null;
  const btn = el("button", { type: "button", class: labelled ? "listen listen-text" : "listen", "aria-pressed": "false", "aria-label": label },
    icon("volume", labelled ? 18 : 22), labelled && "Listen");
  const idle = () => btn.setAttribute("aria-pressed", "false");
  btn.addEventListener("click", () => {
    if (btn.getAttribute("aria-pressed") === "true") { stopSpeaking(); return idle(); }
    btn.setAttribute("aria-pressed", "true");
    const voice = speak(text, { rate, onEnd: idle });
    if (!voice && speechSynthesis.getVoices().length) onNoVoice?.();
  });
  return btn;
}
