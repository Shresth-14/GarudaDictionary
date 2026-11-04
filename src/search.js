import {skeleton} from "./normalise.js";
const strip = s => s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
export function osa(a,b){ // optimal string alignment (Damerau) distance
  const d=[...Array(a.length+1)].map((_,i)=>[i,...Array(b.length).fill(0)]);
  for(let j=1;j<=b.length;j++) d[0][j]=j;
  for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++){
    const c=a[i-1]===b[j-1]?0:1;
    d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c);
    if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]) d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
  }
  return d[a.length][b.length];
}
const maxD = n => n<=3?0:n<=6?1:2;
// People type a schwa Hindi doesn't pronounce: karam for कर्म, shabad for शब्द, sapana for सपना.
// Drop up to two "a"s sitting between consonants; the result must equal a stored key exactly, so it is still a confident match.
const isCons = c => c && !/[aeiou]/.test(c);
export function schwaVariants(k){
  const out = new Set(), at = [];
  for(let i=1;i<k.length-1;i++) if(k[i]==='a'&&isCons(k[i-1])&&isCons(k[i+1])) at.push(i);
  at.forEach((i,n)=>{ out.add(k.slice(0,i)+k.slice(i+1));
    for(const j of at.slice(n+1)) out.add(k.slice(0,i)+k.slice(i+1,j)+k.slice(j+1)); });
  return out;
}
export function buildIndex(entries){
  return entries.map(e=>({e,
    head:e.headword.normalize('NFD'),
    forms:new Set([...e.romanised.map(r=>r.toLowerCase()), strip(e.transliteration)]),
    keys:new Set([e.headword, e.transliteration, ...e.romanised].map(skeleton)),
    en:new Set(e.meanings.join(' ').toLowerCase().split(/[^a-z]+/).filter(Boolean))}));
}
const rank = hits => hits.sort((a,b)=>b.s-a.s||[...a.e.headword].length-[...b.e.headword].length).slice(0,10).map(h=>h.e);
// results: confident matches. suggestions: typo and stem guesses, shown as "Did you mean…" (shakti must not pose as शांति).
export function search(idx,q){
  q=q.trim().replace(/\s+/g,' '); if(!q) return {results:[],suggestions:[]};
  const qn=q.normalize('NFD'), ql=strip(q), k=skeleton(q), md=maxD(k.length);
  // ponytail: Sanskrit nominative -am (satyam, vriksham) tried as a stem guess only; kalam must not confidently mean कल.
  const stem = k.length>=5&&k.endsWith('am') ? k.slice(0,-2) : null;
  const variants = schwaVariants(k);
  // live typing: "sha" folds to the one-letter key "s", but it should already list शब्द, शांति, शक्ति… rather than "No match"
  const prefixOk = k.length>=3 || (k.length>=1 && (q.length>=2 || /[ऀ-ॿ]/.test(q)));
  const results=[], suggestions=[];
  for(const x of idx){
    let s=0, guess=false;
    if(qn===x.head) s=100;
    else if(x.forms.has(ql)) s=90;
    else if(x.keys.has(k)) s=80;
    else if([...variants].some(v=>x.keys.has(v))) s=70;
    else if(prefixOk&&[...x.keys].some(y=>y.startsWith(k))) s=[...x.forms].some(f=>f.startsWith(ql))?65:60; // spelled the way it was typed ranks first
    else if(stem&&x.keys.has(stem)) { s=35; guess=true; }
    else if(md){ const d=Math.min(...[...x.keys].map(y=>osa(k,y))); if(d<=md) { s=40-10*d; guess=true; } }
    if(s) (guess?suggestions:results).push({s,e:x.e});
  }
  if(!results.length&&!suggestions.length) for(const x of idx) if(x.en.has(ql)) results.push({s:20,e:x.e}); // reverse English only as fallback
  // a clear match needs no guesses beside it: "dhyan" should not also offer ज्ञान
  const sure = results.some(h=>h.s>=70);
  return {results:rank(results), suggestions:sure?[]:rank(suggestions)};
}

// Word links: #/word/<first romanised spelling>, e.g. #/word/dharma. Any spelling or Devanagari also resolves,
// so #/word/dharm and #/word/धर्म open the same entry; a link never resolves to a mere suggestion.
export const slug = e => e.romanised[0];
export function findEntry(idx, s){
  return idx.find(x=>slug(x.e)===s)?.e ?? search(idx,s).results[0] ?? null;
}
