const fs=require('fs');
const D='daily/2026-11-25/blankdiscussions', DATE='2026-11-25';
const pol=JSON.parse(fs.readFileSync('scripts/data/compliance-policy.json','utf8'));
const words=[];(function w(o){if(Array.isArray(o))o.forEach(x=>typeof x==='string'?words.push(x.toLowerCase()):w(x));else if(o&&typeof o==='object')Object.entries(o).forEach(([k,v])=>{if(k[0]!=='_')w(v)})})(pol.halal);
const src=fs.readFileSync('src/compositions/IslamicCarouselSlide.tsx','utf8');
const posts=[{ref:'57:4',slug:'quran-57-4',surah:'Al-Hadid',theme:'chaste-65',cap:'It is He who created the heavens and earth in six days and then established Himself above the Throne. He knows what penetrates into the earth and what emerges from it and what descends from the heaven and what ascends therein; and He is with you wherever you are. And Allah, of what you do, is Seeing.',fixes:{'ko.korean':[['오르셨 나니','오르셨나니'],['을라가 는','을라가는'],['너희 가 있는','너희가 있는'],['지켜보 고','지켜보고']]}},{ref:'73:8',slug:'quran-73-8',surah:'Al-Muzzammil',theme:'chaste-66',cap:'And remember the name of your Lord and devote yourself to Him with [complete] devotion.',fixes:{}}];
for(const p of posts){
 if(!src.includes('"'+p.theme+'"')) throw new Error('theme');
 const raw=JSON.parse(fs.readFileSync(`${D}/_raw-${p.ref.replace(':','-')}.json`,'utf8'));const get=id=>raw.find(x=>x.id===id).t;
 const fixed={},fixLog=[];
 for(const id of ['quran-uthmani','en.sahih','zh.jian','ko.korean','ja.japanese']){let t=get(id);const r=t;
  for(const [a,b] of (p.fixes[id]||[])){ if(!t.includes(a)) throw new Error('missing fix '+a); t=t.replace(a,b); fixLog.push(`${id}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`);}
  const ns=s=>s.replace(/[\s.]+/g,''); if(ns(t)!==ns(r)) throw new Error('wording changed '+id);
  fixed[id]={raw:r,text:t};}
 const all=Object.values(fixed).map(x=>x.text).join(' ').toLowerCase();
 const hits=words.filter(x=>x.length>2&&all.includes(x));console.log(p.slug,'halal words',words.length,'hits',JSON.stringify(hits));
 if(hits.length) throw new Error('halal hit');
 const [s,a]=p.ref.split(':');const T=7,base={theme:p.theme};
 const slides=[
 {kind:'cover',...base,kicker:'QURAN',title:p.surah,subtitle:p.ref,slideNumber:1,slideTotal:T},
 {kind:'text',...base,lang:'ar',text:fixed['quran-uthmani'].text,note:`Uthmani script, Qur'an ${p.ref}`,slideNumber:2,slideTotal:T},
 {kind:'text',...base,lang:'en',text:fixed['en.sahih'].text,note:'Saheeh International',slideNumber:3,slideTotal:T},
 {kind:'text',...base,lang:'zh',text:fixed['zh.jian'].text,note:'Ma Jian translation',slideNumber:4,slideTotal:T},
 {kind:'text',...base,lang:'ko',text:fixed['ko.korean'].text,note:'Translator not specified by source',slideNumber:5,slideTotal:T},
 {kind:'text',...base,lang:'ja',text:fixed['ja.japanese'].text,note:'Translator not specified by source',slideNumber:6,slideTotal:T},
 {kind:'citation',...base,lines:[`Qur'an ${p.ref}, Surah ${p.surah}`,'Arabic: Uthmani script','English: Saheeh International','Chinese: Ma Jian translation','Korean and Japanese: translator not specified by source','Source: alquran.cloud'],handle:'@blankdiscussions',slideNumber:7,slideTotal:T}];
 slides.forEach((x,i)=>fs.writeFileSync(`${D}/${p.slug}.slide-0${i+1}.json`,JSON.stringify(x,null,2),'utf8'));
 const caption=`${p.cap}\n\nSurah ${p.surah} (${p.ref}). Swipe through for the Arabic, then English, Mandarin, Korean and Japanese renderings.\n\nSources on the final slide.\n\n#Quran #IslamicReminder #Ayah #Deen #IslamicGuidance`;
 const meta={slug:p.slug,date:DATE,channel:'ig-blankdiscussions',platform:'instagram',handle:'@blankdiscussions',mediaFormat:'carousel',caption,tags:['Quran','IslamicReminder','Ayah','Deen','IslamicGuidance','MuslimReminder','QuranicVerses','Alhamdulillah'],theme:p.theme,slides:slides.map((_,i)=>`${p.slug}.slide-0${i+1}.json`),
 sourcing:{primary_text:`Qur'an, Surah ${p.surah} (${s}), Ayah ${a}`,
 arabic:`Uthmani script (quran-uthmani), api.alquran.cloud. Two independent live fetches this session (${DATE}) of GET /v1/ayah/${p.ref}/editions/quran-uthmani,en.sahih,zh.jian,ko.korean,ja.japanese, HTTP 200 each, diffed: byte-identical. Verbatim: `+JSON.stringify(fixed['quran-uthmani'].raw),
 english:'Saheeh International (en.sahih). Verbatim: '+JSON.stringify(fixed['en.sahih'].raw),
 chinese:'Ma Jian (zh.jian). Raw: '+JSON.stringify(fixed['zh.jian'].raw)+(p.fixes['zh.jian']?'. Punctuation/spacing-only fix (stray space after comma removed). No wording changed.':'. Used verbatim.'),
 korean:"ko.korean; source metadata lists translator as 'Unknown', credited on-slide as not specified. Raw: "+JSON.stringify(fixed['ko.korean'].raw)+'. Spacing-only fix: '+(p.fixes['ko.korean']||[]).map(f=>`'${f[0]}' -> '${f[1]}'`).join('; ')+'. Whitespace-stripped text verified identical to raw. No wording changed.',
 japanese:"ja.japanese; source metadata lists translator as 'Unknown', cited as such. Verbatim: "+JSON.stringify(fixed['ja.japanese'].raw),
 verification_note:`All renderings from two live api.alquran.cloud fetches this session, diffed identical; none from memory. Edition metadata re-checked via /v1/edition (en.sahih Saheeh International, zh.jian Ma Jian, ko.korean Unknown, ja.japanese Unknown). Halal compliance check against scripts/data/compliance-policy.json halal wordlists (${words.length} terms): typography only, no imagery, 0 hits. Dupcheck against local daily/*/blankdiscussions meta files: quran:${s}:${a} NEW. Fixes applied: ${fixLog.join('; ')}.`},
 renderCommand:`npx remotion still src/compositions/registry.tsx IslamicSlide out/blankdiscussions/${DATE}/${p.slug}-slide-NN.png --props=daily/${DATE}/blankdiscussions/${p.slug}.slide-NN.json`,
 status:'sourced_pending_render'};
 fs.writeFileSync(`${D}/${p.slug}.meta.json`,JSON.stringify(meta,null,2),'utf8');
 console.log('built',p.slug,fixLog.length,'fixes');}

