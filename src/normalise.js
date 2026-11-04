const V={'अ':'a','आ':'aa','इ':'i','ई':'ii','उ':'u','ऊ':'uu','ऋ':'ri','ए':'e','ऐ':'ai','ओ':'o','औ':'au','ऑ':'o'};
const M={'ा':'aa','ि':'i','ी':'ii','ु':'u','ू':'uu','ृ':'ri','े':'e','ै':'ai','ो':'o','ौ':'au','ॉ':'o'};
const C={'क':'k','ख':'kh','ग':'g','घ':'gh','ङ':'n','च':'ch','छ':'chh','ज':'j','झ':'jh','ञ':'n','ट':'t','ठ':'th','ड':'d','ढ':'dh','ण':'n','त':'t','थ':'th','द':'d','ध':'dh','न':'n','प':'p','फ':'ph','ब':'b','भ':'bh','म':'m','य':'y','र':'r','ल':'l','व':'v','श':'sh','ष':'sh','स':'s','ह':'h','ळ':'l'};
const NUK={'क':'q','ख':'kh','ग':'g','ज':'z','ड':'d','ढ':'dh','फ':'f'};
const isV=c=>/[aeiou@]/.test(c);
function schwa(w){                       // simplified Ohala rule, right-to-left
  w=w.replace(/@$/,''); const ch=[...w];
  for(let i=ch.length-2;i>1;i--){ if(ch[i]!=='@') continue;
    let L=i-1; if(isV(ch[L])) continue; while(L>=0&&!isV(ch[L])) L--; if(L<0) continue;
    let R=i+1; if(R>=ch.length||isV(ch[R])) continue; while(R<ch.length&&!isV(ch[R])) R++; if(R>=ch.length) continue;
    if(i-1-L>2||R-(i+1)>2) continue;     // clusters block deletion
    ch.splice(i,1);
  }
  return ch.join('').replace(/@/g,'a');
}
export function deva2lat(s){
  const a=[...s.replace(/ज्ञ/g,'ग्य').normalize('NFD').replace(/[‌‍]/g,'')]; let o='';
  for(let i=0;i<a.length;i++){ const c=a[i];
    if(C[c]){ let b=C[c]; if(a[i+1]==='़'){ b=NUK[c]??b; i++; }
      const n=a[i+1];
      if(n==='्'){ o+=b; i++; } else if(M[n]){ o+=b+M[n]; i++; } else o+=b+'@'; }
    else if(V[c]) o+=V[c];
    else if(c==='ं'||c==='ँ') o+='n';
    else if(c==='ः') o+='h';
    else if(/\s/.test(c)) o+=' ';
  }
  return o.split(' ').map(schwa).join(' ');
}
const RULES=[[/jn|^gn|dny/g,'gy'],[/ksh|kss|x/g,'ks'],[/chh|ch|c/g,'c'],[/sh|s/g,'s'],[/w/g,'v'],
  [/ph|f/g,'p'],[/z/g,'j'],[/q/g,'k'],[/ru(?=[^aeiou]|$)/g,'ri'],[/ri(?=[^aeiou])/g,'r'],
  [/([kgcjtdpb])h/g,'$1'],[/ee|ii/g,'i'],[/oo|uu/g,'u'],[/aa/g,'a'],[/([a-z])\1+/g,'$1'],
  [/(?<=.)a$/,''],[/m(?=[^aeiou])/g,'n'],[/h(?=[^aeiou])/g,'']];
export function skeleton(q){
  let s=q.trim().toLowerCase();
  if(/[ऀ-ॿ]/.test(s)) s=deva2lat(s);
  s=s.normalize('NFD').replace(/r[̣̥]/g,'ri').replace(/\p{M}/gu,'').replace(/[^a-z]/g,'');
  for(const [re,r] of RULES) s=s.replace(re,r);
  return s;
}
