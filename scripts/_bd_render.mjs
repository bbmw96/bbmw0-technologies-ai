import { execSync } from "child_process";
const [, , date, ...slugs] = process.argv; const d = `daily/${date}/blankdiscussions`;
for (const s of slugs) for (let i = 1; i <= 10; i++) { const n = String(i).padStart(2, "0");
  try { execSync(`npx remotion still src/compositions/registry.tsx IslamicSlide ${d}/renders/${s}-slide-${n}.jpg --image-format=jpeg --jpeg-quality=92 --props=${d}/${s}.slide-${n}.json`, { stdio: "pipe" }); console.log("ok", s, n); } catch (e) { console.log("FAIL", s, n, String(e.stderr).slice(-200)); } }
