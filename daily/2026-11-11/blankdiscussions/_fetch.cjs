const fs=require('fs');
const eds='quran-uthmani,en.sahih,zh.jian,ko.korean,ja.japanese';
async function pull(){const r=await fetch('https://api.alquran.cloud/v1/ayah/2:156/editions/'+eds);if(r.status!==200)throw new Error(r.status);const j=await r.json();return j.data.map(d=>({id:d.edition.identifier,tr:d.edition.englishName,s:d.surah.englishName,t:d.text}));}
(async()=>{const A=await pull();const B=await pull();console.log('IDENTICAL',JSON.stringify(A)===JSON.stringify(B));
fs.writeFileSync('daily/2026-11-11/blankdiscussions/_raw-2-156.json',JSON.stringify(A,null,1),'utf8');
for(const x of A)console.log(x.id,JSON.stringify(x.tr),x.s,JSON.stringify(x.t));})();
