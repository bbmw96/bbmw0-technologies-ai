const fs=require('fs');
const eds='quran-uthmani,en.sahih,zh.jian,ko.korean,ja.japanese';
const refs=process.argv.slice(2);
async function pull(r){const x=await fetch('https://api.alquran.cloud/v1/ayah/'+r+'/editions/'+eds);if(x.status!==200)throw new Error(r+' '+x.status);const j=await x.json();return j.data.map(d=>({id:d.edition.identifier,tr:d.edition.englishName,s:d.surah.englishName,t:d.text}));}
(async()=>{const e=await (await fetch('https://api.alquran.cloud/v1/edition')).json();console.log(e.data.filter(x=>['ko.korean','ja.japanese','zh.jian','en.sahih'].includes(x.identifier)).map(x=>x.identifier+':'+x.englishName).join(' | '));
for(const r of refs){const A=await pull(r);const B=await pull(r);console.log(r,'IDENTICAL',JSON.stringify(A)===JSON.stringify(B));
fs.writeFileSync('daily/2026-11-23/blankdiscussions/_raw-'+r.replace(':','-')+'.json',JSON.stringify(A,null,1),'utf8');
console.log(JSON.stringify(A.find(x=>x.id==='en.sahih').t),A[0].s);
const ko=A.find(x=>x.id==='ko.korean').t;console.log('KOspaces',JSON.stringify([...ko.matchAll(/\S\s\S{1,2}\s/g)].length), 'KOlen',ko.length);}})();



