// usage: node scripts/_bd_hadith.mjs <date> <collection e.g. bukhari> <number> <theme> <topic title> <translations.json> <coll display name>
import fs from "fs";
const [, , date, coll, num, theme, topic, trFile, collName] = process.argv;
const slug = `${coll}-${num}`, dir = `daily/${date}/blankdiscussions`;
fs.mkdirSync(dir + "/renders", { recursive: true });
const U = (p) => `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${p}/${num}.json`;
const get = async (p) => { const r = await fetch(U(p)); if (r.status !== 200) throw new Error(p + " " + r.status); return r.json(); };
const A1 = await get("ara-" + coll), E1 = await get("eng-" + coll), A2 = await get("ara-" + coll), E2 = await get("eng-" + coll);
const ar = A1.hadiths[0].text, en = E1.hadiths[0].text;
if (ar !== A2.hadiths[0].text || en !== E2.hadiths[0].text) throw new Error("two live fetches differ");
const ref = E1.hadiths[0].reference;
fs.writeFileSync(`${dir}/.raw-${slug}.json`, JSON.stringify({ ar, en, ref, grades: E1.hadiths[0].grades }, null, 1));
// matn: text between first and last straight quote marks in the Arabic (the Prophet's words); fall back to full text
const qs = [...ar].map((c, i) => c === '"' ? i : -1).filter(i => i >= 0);
let matn = ar; const chars = [...ar];
if (qs.length >= 2) matn = chars.slice(qs[0] + 1, qs[qs.length - 1]).join("").replace(/[‏‫‬]/g, "").replace(/\s+/g, " ").trim();
let enText = en.replace(/^Narrated [^:]*:/, "").trim();
const narrator = (en.match(/^Narrated ([^:]*):/) || [, "see source"])[1];
if ((enText.match(/"/g) || []).length % 2 === 1) enText += '."'; // restore stray closing quote/period only
const tr = JSON.parse(fs.readFileSync(trFile, "utf8"));
const T = 10;
const mk = (n, o) => fs.writeFileSync(`${dir}/${slug}.slide-${String(n).padStart(2, "0")}.json`, JSON.stringify({ theme, ...o, slideNumber: n, slideTotal: T }, null, 2));
mk(1, { kind: "cover", kicker: "HADITH", title: topic, subtitle: `${collName} ${num}` });
const own = (l) => `Claude's own translation (hadith-api has no ${l} edition)`;
mk(2, { kind: "text", lang: "ar", text: matn, note: collName, fontScale: matn.length > 200 ? 0.7 : matn.length > 120 ? 0.85 : 0.95 });
mk(3, { kind: "text", lang: "en", text: `Narrated ${narrator}: ${enText}`, note: "English: hadith-api (eng-" + coll + ")" });
[["zh", "Chinese"], ["ko", "Korean"], ["ja", "Japanese"], ["ms", "Malay"], ["th", "Thai"], ["es", "Spanish"]].forEach(([l, n], i) => mk(4 + i, { kind: "text", lang: l, text: tr[l], note: own(n) }));
mk(10, { kind: "citation", lines: [`${collName} ${num} (Book ${ref.book}, Hadith ${ref.hadith})`, `Narrated by ${narrator}`, "Arabic & English: hadith-api (cdn.jsdelivr.net/gh/fawazahmed0/hadith-api)", "Chinese, Korean, Japanese, Malay, Thai, Spanish:", "Claude's own translation from the verified Arabic and English", "(hadith-api has no edition in these languages)"], handle: "@blankdiscussions" });
const pol = JSON.parse(fs.readFileSync("scripts/data/compliance-policy.json", "utf8"));
const terms = []; (function w(o) { if (typeof o === "string") terms.push(o); else if (Array.isArray(o)) o.forEach(w); else if (o && typeof o === "object") Object.values(o).forEach(w); })(pol.halal || pol);
const all = (en + " " + Object.values(tr).join(" ")).toLowerCase();
console.log("hits", JSON.stringify(terms.filter(t => t.length > 2 && /^[a-z ]+$/i.test(t) && new RegExp("\\b" + t.toLowerCase() + "\\b").test(all))));
console.log("MATN:", matn); console.log("EN:", `Narrated ${narrator}: ${enText}`); console.log("REF", JSON.stringify(ref), "narrator", narrator);
