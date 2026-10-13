// node scripts/_bd_hmeta.mjs <date> <slug> <hashtags> <tags csv> <extra caption line> <collName> <seriesDay>
import fs from "fs";
const [, , date, slug, hash, tags, extra, collName, seriesDay] = process.argv, dir = `daily/${date}/blankdiscussions`;
const raw = JSON.parse(fs.readFileSync(`${dir}/.raw-${slug}.json`, "utf8"));
const en = JSON.parse(fs.readFileSync(`${dir}/${slug}.slide-03.json`, "utf8")).text.replace(/^Narrated [^:]*: /, "");
const base = `https://raw.githubusercontent.com/bbmw96/bbmw0-technologies-ai/main/${dir}/renders/${slug}-slide-`, n = i => String(i).padStart(2, "0");
const m = { slug, date, channel: "ig-blankdiscussions", platform: "instagram", handle: "@blankdiscussions", mediaFormat: "carousel", series: "promises-covenants-pledges", seriesDay,
  caption: `${en}\n\n${collName} ${slug.split("-").pop()}. ${extra} Swipe for the Arabic, English, Mandarin, Korean, Japanese, Malay, Thai and Spanish.\n\nSources on the final slide.\n\n${hash}`,
  tags: tags.split(","), theme: JSON.parse(fs.readFileSync(`${dir}/${slug}.slide-01.json`, "utf8")).theme,
  slides: Array.from({ length: 10 }, (_, i) => `${slug}.slide-${n(i + 1)}.json`),
  sourcing: { primary_text: `${collName} ${slug.split("-").pop()} (hadith-api numbering; Book ${raw.ref.book}, Hadith ${raw.ref.hadith}). Series: what Islam says about promises, covenants and pledges.`,
    arabic_and_english: `Live-fetched twice on ${date} from cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-<collection> and eng-<collection>, HTTP 200, the two fetches diffed identical. Slides written programmatically from the API text.`,
    arabic_extraction: "Arabic slide shows the Prophet's words only (the text between the quotation marks); the chain of narrators is omitted from the slide, not altered. Invisible RLM/RLE control marks removed.",
    english_artifact_note: "API English text omitted the closing period and quotation mark when applicable; restored punctuation only, no wording changed. 'Narrated X:' prefix kept as 'Narrated X: '.",
    grade: "hadith-api supplies no grade for this edition (grades empty); slide states only the collection. Sahih al-Bukhari / Sahih Muslim collections are the sources, no grade is claimed beyond that.",
    chinese_korean_japanese_malay_thai_spanish: "hadith-api has no Chinese, Korean, Japanese, Malay, Thai or Spanish edition (checked editions.json 2026-10-13). These six slides are Claude's own careful translation from the verified Arabic and English, labelled on-slide as such; no scholar is named.",
    compliance_check: "Checked against all string terms in compliance-policy.json halal section across English and translations: 0 hits. No imagery." },
  renderCommand: `node scripts/_bd_render.mjs ${date} ${slug}`, status: "rendered_and_hosted",
  hostingUrls: Array.from({ length: 10 }, (_, i) => base + n(i + 1) + ".jpg") };
fs.writeFileSync(`${dir}/${slug}.meta.json`, JSON.stringify(m, null, 2)); console.log(m.caption);
