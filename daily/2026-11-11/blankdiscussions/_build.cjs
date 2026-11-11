const fs=require('fs'),p=require('path');
const D='daily/2026-11-11/blankdiscussions', slug='quran-2-156', DATE='2026-11-11';
const src=fs.readFileSync('src/compositions/IslamicCarouselSlide.tsx','utf8');
const order=JSON.parse(src.match(/THEME_ORDER: ThemeKey\[\] = (\[[^\]]*\])/)[1]);
const used=new Set();(function w(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const q=p.join(d,f.name);if(f.isDirectory()){if(f.name!='node_modules'&&f.name!='.git')w(q)}else if(/\.meta\.json$/.test(f.name)&&/blankdiscussions/.test(q)){try{const j=JSON.parse(fs.readFileSync(q,'utf8'));if(j.theme)used.add(j.theme)}catch{}}}})('daily');
const free=order.filter(t=>!used.has(t));
const theme=free.find(x=>!x.startsWith('chaste'))||free[0];
if(!theme) throw new Error('no free theme');
const raw=JSON.parse(fs.readFileSync(D+'/_raw-2-156.json','utf8'));
const get=id=>raw.find(x=>x.id===id).t;
const ar=get('quran-uthmani'),en=get('en.sahih'),zh=get('zh.jian'),koRaw=get('ko.korean'),ja=get('ja.japanese');
const koFix=[['있을때','있을 때'],['우 리는','우리는'],['돌아 가나이다','돌아가나이다']];
let ko=koRaw; for(const [a,b] of koFix){ if(!ko.includes(a)) throw new Error('missing '+a); ko=ko.replace(a,b); }
const ns=s=>s.replace(/\s+/g,''); if(ns(ko)!==ns(koRaw)) throw new Error('korean wording changed');
const T=7, base={theme};
const slides=[
{kind:'cover',...base,kicker:'QURAN',title:'Al-Baqarah',subtitle:'2:156',slideNumber:1,slideTotal:T},
{kind:'text',...base,lang:'ar',text:ar,note:"Uthmani script, Qur'an 2:156",slideNumber:2,slideTotal:T},
{kind:'text',...base,lang:'en',text:en,note:'Saheeh International',slideNumber:3,slideTotal:T},
{kind:'text',...base,lang:'zh',text:zh,note:'Ma Jian translation',slideNumber:4,slideTotal:T},
{kind:'text',...base,lang:'ko',text:ko,note:'Translator not specified by source',slideNumber:5,slideTotal:T},
{kind:'text',...base,lang:'ja',text:ja,note:'Translator not specified by source',slideNumber:6,slideTotal:T},
{kind:'citation',...base,lines:["Qur'an 2:156, Surah Al-Baqarah","Arabic: Uthmani script","English: Saheeh International","Chinese: Ma Jian translation","Korean and Japanese: translator not specified by source","Source: alquran.cloud"],handle:'@blankdiscussions',slideNumber:7,slideTotal:T}];
slides.forEach((s,i)=>fs.writeFileSync(`${D}/${slug}.slide-0${i+1}.json`,JSON.stringify(s,null,2),'utf8'));
const caption="Who, when disaster strikes them, say, \"Indeed we belong to Allah, and indeed to Him we will return.\"\n\nSurah Al-Baqarah (2:156). Swipe through for the Arabic, then English, Mandarin, Korean and Japanese renderings.\n\nSources on the final slide.";
const meta={slug,date:DATE,channel:'ig-blankdiscussions',platform:'instagram',handle:'@blankdiscussions',mediaFormat:'carousel',caption,tags:['Quran','IslamicReminder','Ayah','Deen','IslamicGuidance','MuslimReminder','Patience','Sabr','QuranicVerses','Alhamdulillah'],theme,slides:slides.map((_,i)=>`${slug}.slide-0${i+1}.json`),
sourcing:{primary_text:"Qur'an, Surah Al-Baqarah (2), Ayah 156",
arabic:"Uthmani script (quran-uthmani), api.alquran.cloud. Two independent live fetches this session ("+DATE+") of GET /v1/ayah/2:156/editions/quran-uthmani,en.sahih,zh.jian,ko.korean,ja.japanese, HTTP 200 each, diffed: byte-identical. Verbatim: "+JSON.stringify(ar),
english:"Saheeh International (en.sahih). Verbatim: "+JSON.stringify(en),
chinese:"Ma Jian (zh.jian). Verbatim: "+JSON.stringify(zh),
korean:"ko.korean; source metadata lists translator as 'Unknown', credited on-slide as not specified. Raw: "+JSON.stringify(koRaw)+". Spacing-only fixes: "+koFix.map(f=>`'${f[0]}' -> '${f[1]}'`).join('; ')+". Whitespace-stripped text verified identical to raw. No wording changed.",
japanese:"ja.japanese; source metadata lists translator as 'Unknown', cited as such. Verbatim: "+JSON.stringify(ja),
verification_note:"All renderings from two live api.alquran.cloud fetches this session, diffed identical; none from memory. Manual halal compliance check against scripts/data/compliance-policy.json blocklists: typography only, no imagery. Dupcheck against local daily/*/blankdiscussions meta files: quran:2:156 NEW (2:152, 2:153 exist; different ayah)."},
renderCommand:`npx remotion still src/compositions/registry.tsx IslamicSlide out/blankdiscussions/${DATE}/${slug}-slide-NN.png --props=daily/${DATE}/blankdiscussions/${slug}.slide-NN.json`,
status:'sourced_pending_render'};
fs.writeFileSync(`${D}/${slug}.meta.json`,JSON.stringify(meta,null,2),'utf8');
console.log('theme',theme);console.log(ko);
