const fs=require('fs');
const eds='quran-uthmani,en.sahih,zh.jian,ko.korean,ja.japanese';
async function pull(){const r=await fetch('https://api.alquran.cloud/v1/surah/103/editions/'+eds);if(r.status!==200)throw new Error(r.status);const j=await r.json();return j.data.map(d=>({id:d.edition.identifier,tr:d.edition.englishName,s:d.englishName,ayahs:d.ayahs.map(a=>({n:a.numberInSurah,t:a.text}))}));}
(async()=>{const A=await pull();const B=await pull();console.log('IDENTICAL',JSON.stringify(A)===JSON.stringify(B));
fs.writeFileSync('daily/2026-11-10/blankdiscussions/_raw-103.json',JSON.stringify(A,null,1),'utf8');
for(const x of A){console.log(x.id,JSON.stringify(x.tr),x.s,x.ayahs.length);for(const a of x.ayahs)console.log(' ',a.n,JSON.stringify(a.t));}})();
