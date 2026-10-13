import fs from "fs";
const ref = process.argv[2], slug = "quran-" + ref.replace(":", "-");
const eds = "quran-uthmani,en.sahih,zh.jian,ko.korean,ja.japanese,ms.basmeih,th.thai,es.cortes";
const url = `https://api.alquran.cloud/v1/ayah/${ref}/editions/${eds}`;
const get = async () => { const r = await fetch(url); if (r.status !== 200) throw new Error(r.status); return r.json(); };
const a = await get(), b = await get();
const key = j => j.data.map(d => d.edition.identifier + "|" + d.text).join("\n");
if (key(a) !== key(b)) throw new Error("two live fetches differ");
const dir = "daily/2026-10-13/blankdiscussions";
fs.writeFileSync(`${dir}/.raw-${slug}.json`, JSON.stringify(a, null, 1));
const out = { ref, surah: a.data[0].surah.englishName, texts: {} };
for (const d of a.data) {
  const t = d.text;
  out.texts[d.edition.identifier] = t;
  console.log(d.edition.identifier, JSON.stringify({ dbl: /  /.test(t), sp: /\s[,.;:!?]/.test(t), trim: t !== t.trim(), len: t.length, translator: d.edition.englishName }));
}
fs.writeFileSync(`${dir}/.reeltext-${slug}.json`, JSON.stringify(out, null, 1));
const pol = JSON.parse(fs.readFileSync("scripts/data/compliance-policy.json", "utf8"));
const terms = []; (function w(o) { if (typeof o === "string") terms.push(o); else if (Array.isArray(o)) o.forEach(w); else if (o && typeof o === "object") Object.values(o).forEach(w); })(pol.halal || pol);
const all = a.data.map(d => d.text).join(" ").toLowerCase();
console.log("hits", JSON.stringify(terms.filter(t => t.length > 2 && /^[a-z ]+$/i.test(t) && new RegExp("\\b" + t.toLowerCase() + "\\b").test(all))));
console.log(JSON.stringify(out, null, 1));
