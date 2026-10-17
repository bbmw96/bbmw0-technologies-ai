// Adds N generated themes ("chaste-01".."chaste-NN") to IslamicCarouselSlide.tsx (idempotent).
import fs from "fs";
const f = "src/compositions/IslamicCarouselSlide.tsx";
let c = fs.readFileSync(f, "utf8");
const N = 60;
const hsl = (h, s, l) => { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l); const g = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); const x = v => Math.round(255 * v).toString(16).padStart(2, "0"); return "#" + x(g(0)) + x(g(8)) + x(g(4)); };
const keys = [], rows = [];
for (let i = 1; i <= N; i++) {
  const key = "chaste-" + String(i).padStart(2, "0");
  if (c.includes(`"${key}"`)) continue;
  const h = (i * 137.508) % 360, a = (h + 150 + (i % 5) * 12) % 360;
  rows.push(`  "${key}": { bg: "${hsl(h, 26 + (i % 4) * 4, 11 + (i % 3) * 2)}", ink: "${hsl(h, 22, 94)}", accent: "${hsl(a, 62 + (i % 3) * 5, 62)}", muted: "${hsl(h, 12, 58)}", label: "Chastity series ${String(i).padStart(2, "0")}" },`);
  keys.push(key);
}
if (!keys.length) { console.log("themes already present"); process.exit(0); }
// 1) union type
c = c.replace(/(export type ThemeKey = [^;]*?)(;)/, (m, a, b) => a + keys.map(k => ` | "${k}"`).join("") + b);
// 2) THEMES rows: insert before the closing of the record, i.e. before line containing the THEME_ORDER export (find the "};" preceding it)
const idx = c.indexOf("export const THEME_ORDER");
const close = c.lastIndexOf("};", idx);
c = c.slice(0, close) + rows.join("\n") + "\n" + c.slice(close);
// 3) THEME_ORDER
c = c.replace(/(export const THEME_ORDER: ThemeKey\[\] = \[[^\]]*?)(\];)/, (m, a, b) => a + ", " + keys.map(k => `"${k}"`).join(", ") + b);
fs.writeFileSync(f, c);
console.log("added", keys.length, "themes");
