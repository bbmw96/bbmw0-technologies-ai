#!/usr/bin/env node
// Cross-platform launcher for scripts/daily-report.sh.
//
// On Windows, plain `bash` resolves to WSL's bash when Ubuntu is installed.
// WSL is a separate Linux environment: it cannot see the Windows PATH, so tools
// installed on Windows (gh, node) are invisible and the report fails with
// misleading "not found" errors. This finds Git Bash first, which shares the
// Windows environment, and only falls back to whatever `bash` resolves to.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SCRIPT = path.join(ROOT, "scripts/daily-report.sh");

function findBash() {
  if (process.platform !== "win32") return "bash";
  const candidates = [
    "C:\\Program Files\\Git\\bin\\bash.exe",
    "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
    path.join(process.env.LOCALAPPDATA || "", "Programs\\Git\\bin\\bash.exe"),
    path.join(process.env.PROGRAMFILES || "", "Git\\bin\\bash.exe"),
  ];
  for (const c of candidates) {
    try { if (c && fs.existsSync(c)) return c; } catch { /* next */ }
  }
  return "bash"; // may be WSL; the report will say so rather than lying
}

const BASH = findBash();
if (process.platform === "win32" && BASH === "bash") {
  console.error("WARNING: Git Bash not found. Falling back to `bash`, which on Windows");
  console.error("may be WSL and cannot see your Windows gh or node installs.");
  console.error("Install Git for Windows, or run the report inside WSL with its own tooling.\n");
}

const r = spawnSync(BASH, [SCRIPT, ...process.argv.slice(2)], { cwd: ROOT, stdio: "inherit" });
process.exit(r.status === null ? 1 : r.status);
