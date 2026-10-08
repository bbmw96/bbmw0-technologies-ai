import fs from "fs";
const date = "2026-10-08", ref = process.argv[2], slug = "quran-" + ref.replace(":", "-");
const eds = "quran-uthmani,en.sahih,zh.jian,ko.korean,ja.japanese,ms.basmeih,th.thai,es.cortes";
const url = `https://api.alquran.cloud/v1/ayah/${ref}/editions/${eds}`;
const dir = `daily/${date}/blankdiscussions`;
fs.mkdirSync(dir + "/renders", { recursive: true });
const get = async () => { const r = await fetch(url); if (r.status !== 200) throw new Error(r.status); return r.json(); };
const a = await get(), b = await get();
const key = j => j.data.map(d => d.edition.identifier + "|" + d.text).join("\n");
if (key(a) !== key(b)) throw new Error("two live fetches differ");
fs.writeFileSync(dir + "/.raw-" + slug + ".json", JSON.stringify(a, null, 1));
const by = {}; for (const d of a.data) by[d.edition.identifier] = d;
const info = {}; for (const d of a.data) info[d.edition.identifier] = { translator: d.edition.name, text: d.text };
const scan = {};
for (const [k, v] of Object.entries(by)) {
  const t = v.text;
  scan[k] = { dbl: /  /.test(t), spPunct: /\s[,.;:!?]/.test(t), trim: t !== t.trim(), ctrl: /[\x00-\x08\x0b-\x1f]/.test(t), len: t.length, name: v.edition.name, englishName: v.edition.englishName };
}
const s = by["en.sahih"].surah;
console.log(JSON.stringify({ surah: s.englishName, scan }, null, 1));
const theme = process.argv[3], T = 10;
const mk = (n, o) => fs.writeFileSync(`${dir}/${slug}.slide-${String(n).padStart(2, "0")}.json`, JSON.stringify({ theme, ...o, slideNumber: n, slideTotal: T }, null, 2));
mk(1, { kind: "cover", kicker: "QURAN", title: s.englishName.replace(/^Sur(a|ah) /, ""), subtitle: ref });
const lang = [["quran-uthmani", "ar", "Uthmani script"], ["en.sahih", "en", "Saheeh International"], ["zh.jian", "zh", "Ma Jian"], ["ko.korean", "ko", "Translator not specified by source"], ["ja.japanese", "ja", "Translator not specified by source"], ["ms.basmeih", "ms", "Abdullah Muhammad Basmeih"], ["th.thai", "th", "King Fahad Quran Complex"], ["es.cortes", "es", "Julio Cortes"]];
lang.forEach(([id, l, note], i) => { const o = { kind: "text", lang: l, text: by[id].text, note }; if (l === "ar") o.fontScale = by[id].text.length > 120 ? 0.85 : 0.95; mk(i + 2, o); });
mk(10, { kind: "citation", lines: [`Qur'an ${ref}, Surah ${s.englishName.replace(/^Sur(a|ah) /, "")}`, "Arabic: Uthmani script", "English: Saheeh International", "Chinese: Ma Jian translation", "Malay: Abdullah Muhammad Basmeih", "Thai: King Fahad Quran Complex", "Spanish: Julio Cortes", "Korean and Japanese: translator not specified by source", "Source: alquran.cloud"], handle: "@blankdiscussions" });
// compliance check
const pol = JSON.parse(fs.readFileSync("scripts/data/compliance-policy.json", "utf8"));
const terms = []; (function w(o) { if (typeof o === "string") terms.push(o); else if (Array.isArray(o)) o.forEach(w); else if (o && typeof o === "object") Object.values(o).forEach(w); })(pol.halal || pol);
const all = a.data.map(d => d.text).join(" ").toLowerCase();
const hits = terms.filter(t => t.length > 2 && /^[a-z ]+$/i.test(t) && new RegExp("\\b" + t.toLowerCase() + "\\b").test(all));
console.log("terms", terms.length, "hits", JSON.stringify(hits));
console.log("EN:", by["en.sahih"].text);

