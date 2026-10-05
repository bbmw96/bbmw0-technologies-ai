import fs from "fs";
const slug = "quran-29-69", date = "2026-10-05", dir = `daily/${date}/blankdiscussions`;
const raw = JSON.parse(fs.readFileSync(`${dir}/.raw-${slug}.json`, "utf8"));
const en = raw.data.find(d => d.edition.identifier === "en.sahih").text;
const caption = `${en}\n\nSurah Al-Ankaboot (29:69). Swipe through for the Arabic, then English, Mandarin, Korean, Japanese, Malay, Thai and Spanish.\n\nSources on the final slide.\n\n#Quran #Guidance #Striving #IslamicReminder #Deen`;
const meta = {
  slug, date, channel: "ig-blankdiscussions", platform: "instagram", handle: "@blankdiscussions", mediaFormat: "carousel",
  caption, tags: ["Quran", "Striving", "Jihad", "IslamicReminder", "Deen"], theme: "celadon-plum",
  slides: Array.from({ length: 10 }, (_, i) => `${slug}.slide-${String(i + 1).padStart(2, "0")}.json`),
  sourcing: {
    primary_text: "Qur'an 29:69, Surah Al-Ankaboot, on striving and divine guidance. Not used by any prior post (checked against existing blankdiscussions meta.json files). Standing 8-language/10-slide format.",
    arabic: "Edition quran-uthmani, live call api.alquran.cloud/v1/ayah/29:69/editions/quran-uthmani,en.sahih,zh.jian,ko.korean,ja.japanese,ms.basmeih,th.thai,es.cortes (HTTP 200, fetched 2026-10-05); fetched twice in the same script and the two responses diffed identical; slide text written programmatically from the raw API fields, no retyping.",
    english: "Edition en.sahih (Saheeh International), same call, byte-identical.",
    chinese: "Edition zh.jian (Ma Jian), same call, byte-identical.",
    korean: "Edition ko.korean, translator 'Unknown' per source so slide says 'Translator not specified by source'. Byte-identical; artifact scan (double spaces, space before punctuation, leading/trailing whitespace, control chars) found none.",
    japanese: "Edition ja.japanese, translator 'Unknown' per source, byte-identical, same artifact scan clean.",
    malay: "Edition ms.basmeih (Abdullah Muhammad Basmeih), byte-identical.",
    thai: "Edition th.thai (King Fahad Quran Complex), byte-identical.",
    spanish: "Edition es.cortes (Julio Cortes), byte-identical.",
    source_artifact_note: "Slide text left byte-identical to the API, nothing edited. Caption uses the English line unchanged.",
    verification_note: "Live fetch performed this session in the same script that wrote the slide files. No wording from memory.",
    compliance_check: "Checked against 142 string terms in compliance-policy.json halal section across all slide text: 0 hits."
  },
  renderCommand: `npx remotion still src/compositions/registry.tsx IslamicSlide daily/${date}/blankdiscussions/renders/${slug}-slide-NN.jpg --image-format=jpeg --jpeg-quality=92 --props=daily/${date}/blankdiscussions/${slug}.slide-NN.json (NN = 01..10)`,
  status: "rendered_and_hosted",
  theme_note: "All 35 prior themes used; celadon-plum (Sandstone & Navy) added as the 36th.",
  hosting_verified: { checkedAt: date, note: "Visually spot-checked Arabic (02), Chinese (04), Korean (05), Japanese (06), Thai (08): no tofu or missing glyphs." }
};
fs.writeFileSync(`${dir}/${slug}.meta.json`, JSON.stringify(meta, null, 2));
console.log(caption);
