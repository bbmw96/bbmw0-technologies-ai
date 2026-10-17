// Builds the full "zina: what the Quran and Hadith say" series: slide JSON + meta.json per post, sourced live.
// usage: node scripts/_bd_zina_build.mjs 2026-10-17
import fs from "fs";
const date = process.argv[2] || "2026-10-17";
const dir = `daily/${date}/blankdiscussions`;
fs.mkdirSync(dir + "/renders", { recursive: true });
const TR = { ...JSON.parse(fs.readFileSync("scripts/_bd_zina_tr_a.json", "utf8")), ...JSON.parse(fs.readFileSync("scripts/_bd_zina_tr_b.json", "utf8")) };
const pol = JSON.parse(fs.readFileSync("scripts/data/compliance-policy.json", "utf8"));
const terms = []; (function w(o) { if (typeof o === "string") terms.push(o); else if (Array.isArray(o)) o.forEach(w); else if (o && typeof o === "object") Object.values(o).forEach(w); })(pol.halal || pol);
const hits = (txt) => terms.filter(t => t.length > 2 && /^[a-z ]+$/i.test(t) && new RegExp("\\b" + t.toLowerCase() + "\\b").test(txt.toLowerCase()));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const getJson = async (u) => { for (let i = 0; i < 4; i++) { try { const r = await fetch(u); if (r.status === 200) return r.json(); } catch { } await sleep(1500); } throw new Error("fetch failed " + u); };

// ---- text-fit heuristic (shrinks long texts so they fit the 1080x1350 canvas) ----
const FM = { ar: [62, 1.65, 0.42], en: [48, 1.4, 0.5], zh: [54, 1.75, 1.0], ko: [44, 1.6, 0.85], ja: [46, 1.7, 1.0], ms: [44, 1.5, 0.5], th: [48, 1.75, 0.55], es: [44, 1.5, 0.5] };
const fit = (lang, text) => { const [size, lh, cw] = FM[lang]; const area = [...text].length * cw * size * size * lh; const s = Math.sqrt((770 * 928) / area * 0.9); return Math.min(1, Math.max(0.38, Math.floor(s * 20) / 20)); };

const T = 10;
const writeSlides = (slug, theme, slides) => slides.forEach((o, i) => fs.writeFileSync(`${dir}/${slug}.slide-${String(i + 1).padStart(2, "0")}.json`, JSON.stringify({ theme, ...o, slideNumber: i + 1, slideTotal: T }, null, 2)));
const txt = (lang, text, note) => { const o = { kind: "text", lang, text, note }; const s = fit(lang, text); if (s < 1) o.fontScale = s; return o; };

// =============== QURAN ===============
const QURAN = [["17:32"], ["6:151"], ["7:33"], ["24:2"], ["24:3"], ["24:4", "24:5"], ["24:6", "24:7"], ["24:8", "24:9"], ["24:19"], ["24:21"], ["24:23"], ["24:30"], ["24:31"], ["24:33"], ["25:68", "25:69", "25:70"], ["4:15", "4:16"], ["4:24"], ["4:25"], ["5:5"], ["23:5", "23:6", "23:7"], ["70:29", "70:30", "70:31"], ["60:12"], ["12:23", "12:24"]];
const HADITH = [
  { s: "bukhari-6810", t: "Faith and Zina" }, { s: "abudawud-4690", t: "Faith Departs" }, { s: "bukhari-5221", t: "Allah's Ghira" }, { s: "bukhari-4477", t: "A Gravest Sin" }, { s: "muslim-296", t: "Three Warned" },
  { s: "bukhari-6612", t: "Adultery of the Eye" }, { s: "bukhari-5066", t: "Lower the Gaze" }, { s: "bukhari-5076", t: "Fear of Zina" }, { s: "bukhari-6806", t: "Shaded by Allah" }, { s: "tirmidhi-2786", t: "Every Eye" },
  { s: "nasai-5126", t: "Perfume in Public" }, { s: "bukhari-18", t: "The Pledge" }, { s: "bukhari-6878", t: "Three Cases" }, { s: "muslim-4416", t: "A Way for Them" }, { s: "bukhari-6831", t: "The Unmarried" },
  { s: "bukhari-6818", t: "The Stone" }, { s: "bukhari-2234", t: "The Slave-Girl", }, { s: "bukhari-6824", t: "Averting the Hadd", arToEnd: true }, { s: "bukhari-2671", t: "Produce the Proof" }, { s: "muslim-4311", t: "False Accusation", raw: true, narr: "Abu Huraira" },
  { s: "abudawud-2052", t: "Marriage After Zina" }, { s: "abudawud-3601", t: "Testimony", noNarr: true }, { s: "malik-403", t: "Excesses and Penalty" }, { s: "bukhari-3222", t: "Forgiveness" }, { s: "bukhari-3321", t: "Mercy for a Sinner" },
  { s: "bukhari-2283", t: "Forbidden Earnings" }, { s: "muslim-4012", t: "Evil Earnings", noNarr: true }, { s: "bukhari-81", t: "Signs of the Hour" }, { s: "bukhari-5590", t: "Making It Lawful" },
];
const SPEC = {
  "bukhari-6831": { enTo: "exiled for one year.", arFrom: "يَأْمُرُ", arTo: "عَامٍ" },
  "bukhari-2283": { arFrom: "نَهَى", arTo: "الإِمَاءِ" },
  "bukhari-18": { enTo: "(in the Hereafter).\"" },
  "bukhari-3222": { arToEnd: true },
  "muslim-4416": { raw: true, narr: "Ubada b. as-Samit" },
  "muslim-296": { raw: true, narr: "Abu Huraira" },
  "muslim-4012": { enFrom: "The price of a dog is evil", pre: "Narrated Rafi b. Khadij: Allah's Messenger (ﷺ) said: ", narr: "Rafi b. Khadij" },
  "abudawud-2052": { enTo: "save the one like him." },
  "abudawud-3601": { enFrom: "The Messenger of Allah (ﷺ) said:", narr: null },
  "malik-403": { enFrom: "the Messenger of Allah, may Allah bless him", cap: true, pre: "Narrated an-Numan ibn Murra: ", narr: "an-Numan ibn Murra" },
  "nasai-5126": { close: ".'\"" },
  "bukhari-4477": { arStrip: true }, "bukhari-2671": { arStrip: true }, "bukhari-6824": { arToEnd: true },
};
const COLL = { bukhari: "Sahih al-Bukhari", muslim: "Sahih Muslim", abudawud: "Sunan Abi Dawud", tirmidhi: "Jami` at-Tirmidhi", nasai: "Sunan an-Nasa'i", malik: "Muwatta Malik" };

const manifest = [];
let part = 0; const TOTAL = QURAN.length + HADITH.length;
let themeN = 0; const nextTheme = () => "chaste-" + String(++themeN).padStart(2, "0");

// ---- Quran ----
const eds = "quran-uthmani,en.sahih,zh.jian,ko.korean,ja.japanese,ms.basmeih,th.thai,es.cortes";
const langs = [["quran-uthmani", "ar", "Uthmani script"], ["en.sahih", "en", "Saheeh International"], ["zh.jian", "zh", "Ma Jian"], ["ko.korean", "ko", "Translator not specified by source"], ["ja.japanese", "ja", "Translator not specified by source"], ["ms.basmeih", "ms", "Abdullah Muhammad Basmeih"], ["th.thai", "th", "King Fahad Quran Complex"], ["es.cortes", "es", "Julio Cortes"]];
for (const refs of QURAN) {
  part++;
  const [s0, a0] = refs[0].split(":"), aLast = refs[refs.length - 1].split(":")[1];
  const slug = `quran-${s0}-${a0}` + (refs.length > 1 ? `-${aLast}` : "");
  const rng = refs.length > 1 ? `${s0}:${a0}–${aLast}` : `${s0}:${a0}`;
  const per = [];
  for (const r of refs) {
    const u = `https://api.alquran.cloud/v1/ayah/${r}/editions/${eds}`;
    const a = await getJson(u), b = await getJson(u);
    const key = j => j.data.map(d => d.edition.identifier + "|" + d.text).join("\n");
    if (key(a) !== key(b)) throw new Error("two live fetches differ " + r);
    per.push(a);
    await sleep(300);
  }
  const by = {}; const scan = {};
  for (const [id] of langs) { const parts = per.map(p => p.data.find(d => d.edition.identifier === id).text); by[id] = parts.join(" "); }
  const surah = per[0].data.find(d => d.edition.identifier === "en.sahih").surah.englishName.replace(/^Sur(a|ah) /, "");
  for (const id in by) { const t = by[id]; scan[id] = { dbl: /  /.test(t), spPunct: /\s[,.;:!?]/.test(t), trim: t !== t.trim(), ctrl: /[\x00-\x08\x0b-\x1f]/.test(t) }; }
  const theme = nextTheme();
  const slides = [{ kind: "cover", kicker: "QURAN", title: surah, subtitle: rng }];
  for (const [id, l, note] of langs) slides.push(txt(l, by[id], note));
  slides.push({ kind: "citation", lines: [`Qur'an ${rng}, Surah ${surah}`, "Arabic: Uthmani script", "English: Saheeh International", "Chinese: Ma Jian translation", "Malay: Abdullah Muhammad Basmeih", "Thai: King Fahad Quran Complex", "Spanish: Julio Cortes", "Korean and Japanese: translator not specified by source", "Source: alquran.cloud"], handle: "@blankdiscussions" });
  writeSlides(slug, theme, slides);
  fs.writeFileSync(`${dir}/.raw-${slug}.json`, JSON.stringify(per, null, 1));
  const en = by["en.sahih"];
  const artifacts = Object.entries(scan).filter(([, v]) => v.dbl || v.spPunct || v.trim || v.ctrl).map(([k]) => k);
  const meta = {
    slug, date, channel: "ig-blankdiscussions", platform: "instagram", handle: "@blankdiscussions", mediaFormat: "carousel", series: "zina-quran-and-hadith", seriesPart: part, seriesTotal: TOTAL,
    caption: `"${en}"\n\nQur'an ${rng} (Surah ${surah}). Part ${part} of ${TOTAL} in our series on everything the Quran and the Prophet's hadith say about zina. Swipe through for the Arabic, then English, Mandarin, Korean, Japanese, Malay, Thai and Spanish.\n\nSources on the final slide.\n\n#Quran #Chastity #IslamicReminder #Deen #Guidance`,
    tags: ["Quran", "Chastity", "Guidance", "Deen"], theme, slides: slides.map((_, i) => `${slug}.slide-${String(i + 1).padStart(2, "0")}.json`),
    sourcing: {
      primary_text: `Qur'an ${rng}, Surah ${surah}. Part of the zina series; passage chosen from api.alquran.cloud keyword searches (en.sahih: unlawful sexual intercourse, adultery, immorality, chaste, private parts, prostitution) and cross-checked by name.`,
      arabic: `Edition quran-uthmani via api.alquran.cloud/v1/ayah/<ref>/editions/${eds}, one call per ayah (HTTP 200, fetched ${date}); each ayah fetched twice and diffed identical; slide text written programmatically from the raw API fields (multi-ayah passages joined with a single space), no retyping.`,
      other_editions: "en.sahih (Saheeh International), zh.jian (Ma Jian), ms.basmeih (Abdullah Muhammad Basmeih), th.thai (King Fahad Quran Complex), es.cortes (Julio Cortes): same call. ko.korean and ja.japanese: translator listed as unknown by source; slide says 'Translator not specified by source'.",
      source_artifact_note: artifacts.length ? `Artifact scan flagged: ${artifacts.join(", ")} (double space / space before punctuation / whitespace / control char); source text reproduced as-is, not edited.` : "Artifact scan (double spaces, space before punctuation, leading/trailing whitespace, control chars) found none; slide text byte-identical to the API.",
      compliance_check: `Checked against ${terms.length} string terms in compliance-policy.json halal section across all edition text: hits = ${JSON.stringify(hits(Object.values(by).join(" ")))}. The text is scripture addressing the prohibition and legal treatment of zina; it is not promotional or explicit content.`,
    },
    status: "sourced", hostingUrls: Array.from({ length: T }, (_, i) => `https://raw.githubusercontent.com/bbmw96/bbmw0-technologies-ai/main/${dir}/renders/${slug}-slide-${String(i + 1).padStart(2, "0")}.jpg`),
  };
  fs.writeFileSync(`${dir}/${slug}.meta.json`, JSON.stringify(meta, null, 2));
  manifest.push({ slug, kind: "quran", part, theme, ref: rng, surah, en });
  console.log("quran ok", slug, theme, JSON.stringify(Object.fromEntries(Object.entries(by).map(([k, v]) => [k, v.length]))), "artifacts:", artifacts.join(",") || "-");
}

// ---- Hadith ----
const TRL = [["zh", "Chinese"], ["ko", "Korean"], ["ja", "Japanese"], ["ms", "Malay"], ["th", "Thai"], ["es", "Spanish"]];
for (const h of HADITH) {
  part++;
  const [coll, num] = h.s.split("-"); const slug = h.s; const sp = { ...h, ...(SPEC[h.s] || {}) };
  const U = (p) => `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${p}/${num}.json`;
  const A1 = await getJson(U("ara-" + coll)), E1 = await getJson(U("eng-" + coll)), A2 = await getJson(U("ara-" + coll)), E2 = await getJson(U("eng-" + coll));
  const ar = A1.hadiths[0].text, en = E1.hadiths[0].text;
  if (ar !== A2.hadiths[0].text || en !== E2.hadiths[0].text) throw new Error("two live fetches differ " + h.s);
  const ref = E1.hadiths[0].reference, grades = E1.hadiths[0].grades || [];
  fs.writeFileSync(`${dir}/.raw-${slug}.json`, JSON.stringify({ ar, en, ref, grades }, null, 1));
  // Arabic: the Prophet's words
  let m;
  if (sp.arFrom) { let t = ar.slice(ar.indexOf(sp.arFrom)); if (ar.indexOf(sp.arFrom) < 0) throw new Error("arFrom missing " + h.s); const j = t.indexOf(sp.arTo); if (j < 0) throw new Error("arTo missing " + h.s); m = t.slice(0, j + sp.arTo.length); }
  else { const ch = [...ar]; const qs = ch.map((c, i) => c === '"' ? i : -1).filter(i => i >= 0); if (qs.length < 2) throw new Error("no quotes " + h.s); m = ch.slice(qs[0] + 1, sp.arToEnd ? ch.length : qs[qs.length - 1]).join(""); }
  m = m.replace(/[‎‏‪-‮]/g, "").replace(/"/g, "").replace(/[‌]/g, "").replace(/\s*\.\s*(?=\s|$)/g, "").replace(/\s+/g, " ").trim();
  // English
  let body = en.replace(/\s+/g, " ").trim();
  const nm = body.match(/^Narrated ([^:]*):\s*/); let narr = nm ? nm[1] : null; if (nm) body = body.slice(nm[0].length);
  if (sp.narr !== undefined) narr = sp.narr;
  if (sp.enFrom) { const i = body.indexOf(sp.enFrom); if (i < 0) throw new Error("enFrom missing " + h.s); body = body.slice(i); }
  if (sp.enTo) { const i = body.indexOf(sp.enTo); if (i < 0) throw new Error("enTo missing " + h.s); body = body.slice(0, i + sp.enTo.length); }
  if (sp.cap) body = body[0].toUpperCase() + body.slice(1);
  body = body.replace(/\b(said|observed|saying|reported|has):(?=["A-Z])/g, "$1: ");
  const q = (body.match(/"/g) || []).length;
  if (sp.close) body += sp.close; else if (q % 2 === 1) body += '."'; else if (!/[.!?"”]$/.test(body)) body += ".";
  const enFinal = sp.pre ? sp.pre + body : (sp.raw || !narr) ? body : `Narrated ${narr}: ${body}`;
  const tr = TR[slug]; if (!tr) throw new Error("no translation " + slug);
  for (const k in tr) tr[k] = tr[k].replace(/».”$/, "».");
  const theme = nextTheme(), collName = COLL[coll];
  const gradeLine = grades.length ? `Grade per hadith-api: ${grades.map(g => `${g.grade} (${g.name})`).join("; ")}` : `Collection: ${collName} (no grade supplied by hadith-api)`;
  const own = (n) => `Claude's own translation (hadith-api has no ${n} edition)`;
  const slides = [{ kind: "cover", kicker: "HADITH", title: h.t, subtitle: `${collName} ${num}` }, txt("ar", m, collName), txt("en", enFinal, "English: hadith-api (eng-" + coll + ")")];
  for (const [l, n] of TRL) slides.push(txt(l, tr[l], own(n)));
  slides.push({ kind: "citation", lines: [`${collName} ${num} (Book ${ref.book}, Hadith ${ref.hadith})`, narr ? `Narrated by ${narr}` : "Narrator: see source", "Arabic & English: hadith-api (cdn.jsdelivr.net/gh/fawazahmed0/hadith-api)", gradeLine, "Chinese, Korean, Japanese, Malay, Thai, Spanish:", "Claude's own translation from the verified Arabic and English"], handle: "@blankdiscussions" });
  writeSlides(slug, theme, slides);
  const hh = hits(enFinal + " " + Object.values(tr).join(" "));
  const meta = {
    slug, date, channel: "ig-blankdiscussions", platform: "instagram", handle: "@blankdiscussions", mediaFormat: "carousel", series: "zina-quran-and-hadith", seriesPart: part, seriesTotal: TOTAL,
    caption: `${enFinal}\n\n${collName} ${num}. Part ${part} of ${TOTAL} in our series on everything the Quran and the Prophet's hadith say about zina. Swipe for the Arabic, English, Mandarin, Korean, Japanese, Malay, Thai and Spanish.\n\nSources on the final slide.\n\n#Hadith #Chastity #IslamicReminder #Deen #Guidance`,
    tags: ["Hadith", "Chastity", "Guidance", "Deen"], theme, slides: slides.map((_, i) => `${slug}.slide-${String(i + 1).padStart(2, "0")}.json`),
    sourcing: {
      primary_text: `${collName} ${num} (hadith-api numbering; Book ${ref.book}, Hadith ${ref.hadith}). Selected from a full-text scan of all hadith-api English editions (Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah, Malik, Nawawi, Dehlawi) for zina / adultery / fornication / illegal sexual intercourse / prostitution; one representative narration per distinct statement of the Prophet.`,
      arabic_and_english: `Live-fetched twice on ${date} from cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${coll} and eng-${coll}, HTTP 200, the two fetches diffed identical. Slides written programmatically from the API text.`,
      arabic_extraction: "Arabic slide shows the Prophet's words only (text between the quotation marks, or a marked sub-range where the API Arabic has no quotes); chain of narrators omitted from the slide, not altered. Invisible directional marks and stray quote characters removed.",
      english_note: `English trimmed only at the edges where noted (chain/narrator commentary), punctuation restored at the end only. Final slide text: ${enFinal}`,
      grade: gradeLine,
      chinese_korean_japanese_malay_thai_spanish: "hadith-api has no Chinese, Korean, Japanese, Malay, Thai or Spanish edition. These six slides are Claude's own translation from the verified Arabic and English, labelled on-slide as such; no scholar is named.",
      compliance_check: `Checked against ${terms.length} halal-policy string terms across English and translations: hits = ${JSON.stringify(hh)}. The text is the Prophet's teaching on the prohibition and legal treatment of zina; not promotional or explicit.`,
    },
    status: "sourced", hostingUrls: Array.from({ length: T }, (_, i) => `https://raw.githubusercontent.com/bbmw96/bbmw0-technologies-ai/main/${dir}/renders/${slug}-slide-${String(i + 1).padStart(2, "0")}.jpg`),
  };
  fs.writeFileSync(`${dir}/${slug}.meta.json`, JSON.stringify(meta, null, 2));
  manifest.push({ slug, kind: "hadith", part, theme, en: enFinal, ar: m });
  console.log("hadith ok", slug, theme, "ar", m.length, "en", enFinal.length, "hits", JSON.stringify(hh));
}
fs.writeFileSync(`${dir}/zina-series-manifest.json`, JSON.stringify(manifest, null, 1));
console.log("DONE", manifest.length);
