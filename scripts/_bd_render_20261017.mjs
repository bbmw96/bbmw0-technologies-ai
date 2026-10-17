import { execSync } from "child_process";
const d="daily/2026-10-17/blankdiscussions";
for (const s of ["quran-3-8","quran-18-10"]) for (let i=1;i<=10;i++){const n=String(i).padStart(2,"0");
 try{execSync(`npx remotion still src/compositions/registry.tsx IslamicSlide ${d}/renders/${s}-slide-${n}.jpg --image-format=jpeg --jpeg-quality=92 --props=${d}/${s}.slide-${n}.json`,{stdio:"pipe"});console.log("ok",s,n)}catch(e){console.log("FAIL",s,n,String(e.stderr).slice(-200))}}
