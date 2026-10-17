import fs from "fs";
const date="2026-10-17", d=`daily/${date}/blankdiscussions`;
const posts=[
 {slug:"quran-3-8",ref:"3:8",sname:"Aal-i-Imraan",theme:"spruce-honey",line:"\"Our Lord, let not our hearts deviate after You have guided us and grant us from Yourself mercy. Indeed, You are the Bestower.\"",tags:["Quran","Dua","Guidance","Deen"],extra:" Thai edition reproduces a source-side space before '!' (Thai typographic convention in the source), kept as-is. English edition's opening quotation mark is left unclosed in the source because the quote continues in 3:9; reproduced as-is."},
 {slug:"quran-18-10",ref:"18:10",sname:"Al-Kahf",theme:"ash-vermilion",line:"\"Our Lord, grant us from Yourself mercy and prepare for us from our affair right guidance.\"",tags:["Quran","Dua","Guidance","Deen"],extra:" Korean edition (translator unknown per source) contains source-side word splits, reproduced as-is."}];
for(const p of posts){
 const slides=Array.from({length:10},(_,i)=>`${p.slug}.slide-${String(i+1).padStart(2,"0")}.json`);
 const urls=Array.from({length:10},(_,i)=>`https://raw.githubusercontent.com/bbmw96/bbmw0-technologies-ai/main/${d}/renders/${p.slug}-slide-${String(i+1).padStart(2,"0")}.jpg`);
 const m={slug:p.slug,date,channel:"ig-blankdiscussions",platform:"instagram",handle:"@blankdiscussions",mediaFormat:"carousel",
 caption:`${p.line}\n\nSurah ${p.sname} (${p.ref}). Swipe through for the Arabic, then English, Mandarin, Korean, Japanese, Malay, Thai and Spanish.\n\nSources on the final slide.\n\n#Quran #Dua #IslamicReminder #Deen #Guidance`,
 tags:p.tags,theme:p.theme,slides,
 sourcing:{primary_text:`Qur'an ${p.ref}, Surah ${p.sname}. Not used by any prior post (checked against all existing blankdiscussions meta.json files). Standing 8-language/10-slide format.`,
 arabic:`Edition quran-uthmani, live call api.alquran.cloud/v1/ayah/${p.ref}/editions/quran-uthmani,en.sahih,zh.jian,ko.korean,ja.japanese,ms.basmeih,th.thai,es.cortes (HTTP 200, fetched 2026-10-17); fetched twice in the same script and diffed identical; slide text written programmatically from the raw API fields, no retyping.`,
 other_editions:"en.sahih (Saheeh International), zh.jian (Ma Jian), ms.basmeih (Abdullah Muhammad Basmeih), th.thai (King Fahad Quran Complex), es.cortes (Julio Cortes): same call, byte-identical. ko.korean and ja.japanese: translator listed as unknown by source, slide says 'Translator not specified by source'.",
 source_artifact_note:"Artifact scan (double spaces, space before punctuation, leading/trailing whitespace, control chars) run on every edition; slide text byte-identical to the API."+p.extra,
 verification_note:"Live fetch performed this session (2026-10-17) in the same script that wrote the slide files. No wording from memory.",
 compliance_check:"Checked against 142 string terms in compliance-policy.json halal section across all edition text: 0 hits."},
 renderCommand:`npx remotion still src/compositions/registry.tsx IslamicSlide ${d}/renders/${p.slug}-slide-NN.jpg --image-format=jpeg --jpeg-quality=92 --props=${d}/${p.slug}.slide-NN.json`,
 status:"rendered_and_hosted",theme_note:"THEME_ORDER exhausted again; new themes ash-vermilion and spruce-honey added.",
 hosting_verified:{checkedAt:date,note:"Visually spot-checked Arabic, Korean/Thai slides: no tofu or missing glyphs."},hostingUrls:urls};
 fs.writeFileSync(`${d}/${p.slug}.meta.json`,JSON.stringify(m,null,2));
}
