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
export function buildIndex(entries){
  return entries.map(e=>({e,
    head:e.headword.normalize('NFD'),
    forms:new Set([...e.romanised.map(r=>r.toLowerCase()), strip(e.transliteration)]),
    keys:new Set([e.headword, e.transliteration, ...e.romanised].map(skeleton)),
    en:new Set(e.meanings.join(' ').toLowerCase().split(/[^a-z]+/).filter(Boolean))}));
}
export function search(idx,q){
  q=q.trim().replace(/\s+/g,' '); if(!q) return [];
  const qn=q.normalize('NFD'), ql=strip(q), k=skeleton(q), md=maxD(k.length);
  const hits=[];
  for(const x of idx){
    let s=0;
    if(qn===x.head) s=100;
    else if(x.forms.has(ql)) s=90;
    else if(x.keys.has(k)) s=80;
    else if(k.length>=3&&[...x.keys].some(y=>y.startsWith(k))) s=60;
    else if(md){ const d=Math.min(...[...x.keys].map(y=>osa(k,y))); if(d<=md) s=40-10*d; }
    if(s) hits.push({s,e:x.e});
  }
  if(!hits.length) for(const x of idx) if(x.en.has(ql)) hits.push({s:20,e:x.e}); // reverse English only as fallback
  return hits.sort((a,b)=>b.s-a.s||[...a.e.headword].length-[...b.e.headword].length).slice(0,10).map(h=>h.e);
}
