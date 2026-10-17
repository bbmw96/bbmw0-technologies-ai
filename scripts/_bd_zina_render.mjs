import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "fs";
const d = "daily/2026-10-17/blankdiscussions";
const man = JSON.parse(fs.readFileSync(`${d}/zina-series-manifest.json`, "utf8"));
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const slugs = (Array.isArray(man) ? man : man.posts).map((p) => p.slug).filter((s) => !only || only.test(s));
fs.mkdirSync(`${d}/renders`, { recursive: true });
const serveUrl = await bundle({ entryPoint: "src/compositions/registry.tsx" });
const jobs = [];
for (const s of slugs) for (let i = 1; i <= 10; i++) { const n = String(i).padStart(2, "0"); const f = `${d}/${s}.slide-${n}.json`; if (fs.existsSync(f)) jobs.push({ s, n, f }); }
let done = 0, fail = 0;
async function worker() {
  while (jobs.length) {
    const j = jobs.shift();
    try {
      const inputProps = JSON.parse(fs.readFileSync(j.f, "utf8"));
      const comp = await selectComposition({ serveUrl, id: "IslamicSlide", inputProps });
      await renderStill({ composition: comp, serveUrl, output: `${d}/renders/${j.s}-slide-${j.n}.jpg`, inputProps, imageFormat: "jpeg", jpegQuality: 92 });
      done++;
    } catch (e) { fail++; console.log("FAIL", j.s, j.n, String(e).slice(0, 200)); }
    if (done % 25 === 0) console.log("done", done);
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
console.log("RENDER COMPLETE", done, "fail", fail);
