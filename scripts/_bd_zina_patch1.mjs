import fs from "fs";
const f = "scripts/_bd_zina_build.mjs";
let s = fs.readFileSync(f, "utf8");
const a1 = "يَأْمُرُ", a2 = "عَامٍ";
const b1 = "نَهَى", b2 = "الإِمَاءِ";
s = s.replace(/("bukhari-6831": \{ enTo: "[^"]*", )arFrom: "[^"]*", arTo: "[^"]*"/, `$1arFrom: "${a1}", arTo: "${a2}"`);
s = s.replace(/("bukhari-2283": \{ )arFrom: "[^"]*", arTo: "[^"]*"/, `$1arFrom: "${b1}", arTo: "${b2}"`);
fs.writeFileSync(f, s);
console.log("patched");
