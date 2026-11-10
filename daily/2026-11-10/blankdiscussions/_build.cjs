const fs=require('fs'),p=require('path');
const D='daily/2026-11-10/blankdiscussions', slug='quran-103-1-3', DATE='2026-11-10';
// theme: first unused in THEME_ORDER (non-chaste preferred)
const src=fs.readFileSync('src/compositions/IslamicCarouselSlide.tsx','utf8');
const order=JSON.parse(src.match(/THEME_ORDER: ThemeKey\[\] = (\[[^\]]*\])/)[1]);
const used=new Set();(function w(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const q=p.join(d,f.name);if(f.isDirectory()){if(f.name!='node_modules'&&f.name!='.git')w(q)}else if(/\.meta\.json$/.test(f.name)&&/blankdiscussions/.test(q)){try{const j=JSON.parse(fs.readFileSync(q,'utf8'));if(j.theme)used.add(j.theme)}catch{}}}})('daily');
const free=order.filter(t=>!used.has(t));
const theme=free.find(x=>!x.startsWith('chaste'))||free[0];
if(!theme) throw new Error('no free theme');
const raw=JSON.parse(fs.readFileSync(D+'/_raw-103.json','utf8'));
const get=id=>raw.find(x=>x.id===id).ayahs.map(a=>a.t);
// Arabic: API prefixes the basmalah onto ayah 1 of this surah; it is not part of the verse. Strip exactly that prefix.
const strip=x=>x.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,'');
const arA=get('quran-uthmani'); const tk=arA[0].split(' ');
if(tk.length!==5||strip(tk.slice(0,4).join(' '))!==strip('بسم ٱلله ٱلرحمن ٱلرحيم')) throw new Error('basmalah prefix check failed: '+strip(tk.join(' ')));
const arFix=[tk[4],arA[1],arA[2]];
const ar=arFix.join(' ');
const en=get('en.sahih').join(' ');
const zhRaw=get('zh.jian').join(' '), zh=zhRaw;
const koRawArr=get('ko.korean'); const koRaw=koRawArr.join(' ');
const koFix=[['되 니라','되니라'],['일을실천하며','일을 실천하며'],['진리를권고하며','진리를 권고하며']];
let ko=koRaw; for(const [a,b] of koFix){ if(!ko.includes(a)) throw new Error('missing '+a); ko=ko.replace(a,b); }
const jaRaw=get('ja.japanese'), ja=jaRaw.join('');
const ns=s=>s.replace(/\s+/g,'');
if(ns(ko)!==ns(koRaw)) throw new Error('korean wording changed');
const T=7, base={theme};
const slides=[
{kind:'cover',...base,kicker:'QURAN',title:'Al-Asr',subtitle:'103:1-3',slideNumber:1,slideTotal:T},
{kind:'text',...base,lang:'ar',text:ar,note:"Uthmani script, Qur'an 103:1-3",slideNumber:2,slideTotal:T},
{kind:'text',...base,lang:'en',text:en,note:'Saheeh International',slideNumber:3,slideTotal:T},
{kind:'text',...base,lang:'zh',text:zh,note:'Ma Jian translation',slideNumber:4,slideTotal:T},
{kind:'text',...base,lang:'ko',text:ko,note:'Translator not specified by source',slideNumber:5,slideTotal:T},
{kind:'text',...base,lang:'ja',text:ja,note:'Translator not specified by source',slideNumber:6,slideTotal:T},
{kind:'citation',...base,lines:["Qur'an 103:1-3, Surah Al-Asr","Arabic: Uthmani script","English: Saheeh International","Chinese: Ma Jian translation","Korean and Japanese: translator not specified by source","Source: alquran.cloud"],handle:'@blankdiscussions',slideNumber:7,slideTotal:T}];
slides.forEach((s,i)=>fs.writeFileSync(`${D}/${slug}.slide-0${i+1}.json`,JSON.stringify(s,null,2),'utf8'));
const caption="By time, indeed mankind is in loss, except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience.\n\nSurah Al-Asr (103:1-3). Swipe through for the Arabic, then English, Mandarin, Korean and Japanese renderings.\n\nSources on the final slide.";
const meta={slug,date:DATE,channel:'ig-blankdiscussions',platform:'instagram',handle:'@blankdiscussions',mediaFormat:'carousel',caption,tags:['Quran','IslamicReminder','Ayah','Deen','IslamicGuidance','MuslimReminder','Patience','Sabr','QuranicVerses','Alhamdulillah'],theme,slides:slides.map((_,i)=>`${slug}.slide-0${i+1}.json`),
sourcing:{primary_text:"Qur'an, Surah Al-Asr (103), Ayahs 1-3",
arabic:"Uthmani script (quran-uthmani), api.alquran.cloud. Two independent live fetches this session ("+DATE+") of GET /v1/surah/103/editions/quran-uthmani,en.sahih,zh.jian,ko.korean,ja.japanese, HTTP 200 each, diffed: byte-identical. Source artifact: the API prepends the basmalah to ayah 1 of this surah; it was removed (exact-prefix strip, asserted in code) because it is not part of the verse. No other change. Raw ayah 1: "+JSON.stringify(arA[0]),
english:"Saheeh International (en.sahih). Verbatim, ayahs joined by a space: "+JSON.stringify(en),
chinese:"Ma Jian (zh.jian). Verbatim, ayahs joined by a space: "+JSON.stringify(zhRaw),
korean:"ko.korean; source metadata lists translator as 'Unknown', credited on-slide as not specified. Raw: "+JSON.stringify(koRaw)+". Spacing-only fixes: "+koFix.map(f=>`'${f[0]}' -> '${f[1]}'`).join('; ')+". Whitespace-stripped text verified identical to raw. No wording changed.",
japanese:"ja.japanese; source metadata lists translator as 'Unknown', cited as such. Verbatim, ayahs concatenated: "+JSON.stringify(ja),
verification_note:"All renderings from two live api.alquran.cloud fetches this session, diffed identical; none from memory. Manual halal compliance check against scripts/data/compliance-policy.json blocklists: typography only, no imagery. Dupcheck against fresh clone of origin/main (c1b27ea): quran:103:1-3 NEW."},
renderCommand:`npx remotion still src/compositions/registry.tsx IslamicSlide out/blankdiscussions/${DATE}/${slug}-slide-NN.png --props=daily/${DATE}/blankdiscussions/${slug}.slide-NN.json`,
status:'sourced_pending_render'};
fs.writeFileSync(`${D}/${slug}.meta.json`,JSON.stringify(meta,null,2),'utf8');
console.log('theme',theme);console.log(ar);console.log(ko);console.log(ja);

