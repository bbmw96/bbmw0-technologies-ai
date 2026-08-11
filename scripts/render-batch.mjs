#!/usr/bin/env node
// Render every video in daily/<date>/ then optionally upload to YouTube.
//
// USAGE:
//   node scripts/render-batch.mjs --date=2026-05-01           # render only
//   node scripts/render-batch.mjs --date=2026-05-01 --upload  # render + upload
//
// What it does:
//   1. Finds every <slug>.props.json in daily/<date>/
//   2. Skips any slug that already has a recorded youtubeId (never re-uploads)
//   3. Runs `npx remotion render registry.tsx Daily out/<file>.mp4 --props=<...>`
//   4. If --upload: runs scripts/youtube-upload.mjs with the slug's meta.json
//   5. Records the returned YouTube video ID back into published.json
//   6. Logs everything to daily/<date>/render-log.txt
//
// Privacy: driven by meta.privacy written by the generator (default public).

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// BOM-tolerant JSON reader. OneDrive and PowerShell both like to prepend a
// UTF-8 BOM, which makes JSON.parse throw. Strip it before parsing, always.
function readJSON(p) {
  const raw = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${p}: ${err.message}`);
  }
}

// Auto-detect i9/RTX hardware. Use ~75% of logical CPU threads for Remotion workers.
const CONCURRENCY = Math.max(2, Math.floor(os.cpus().length * 0.75));

// On Windows, ANGLE translates OpenGL to Direct3D so the RTX GPU accelerates Chromium.
const GL_FLAGS = process.platform === "win32" ? "--gl=angle" : "";

function args(argv) {
  const o = {};
  for (const a of argv.slice(2)) {
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq === -1) o[a.slice(2)] = true;
      else o[a.slice(2, eq)] = a.slice(eq + 1);
    }
  }
  return o;
}
const A = args(process.argv);
const DATE = A.date || new Date().toISOString().slice(0, 10);
const UPLOAD = !!A.upload;

const dir = path.join(ROOT, "daily", DATE);
if (!fs.existsSync(dir)) {
  console.error(`No daily/${DATE}/ directory. Run npm run gen:daily first.`);
  process.exit(1);
}

const propsFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".props.json"));
if (!propsFiles.length) {
  console.error(`No *.props.json in daily/${DATE}/`);
  process.exit(1);
}

fs.mkdirSync(path.join(ROOT, "out"), { recursive: true });
const log = [];
const logPath = path.join(dir, "render-log.txt");
const append = (s) => { log.push(s); fs.writeFileSync(logPath, log.join("\n") + "\n"); console.log(s); };

append(`Rendering ${propsFiles.length} Shorts for ${DATE} (concurrency=${CONCURRENCY}, GL=${GL_FLAGS || "default"})`);
let okCount = 0, failCount = 0, skipCount = 0, uploadCount = 0, blockedCount = 0;

// ---------------------------------------------------------------- compliance
// Nothing reaches YouTube without clearing the compliance gate. If the verdict
// is missing we run the gate rather than trusting an unreviewed batch: an
// absent verdict must never be read as approval.
let complianceBlocked = new Set();
if (UPLOAD) {
  const verdictPath = path.join(dir, "compliance-verdict.json");
  if (!fs.existsSync(verdictPath)) {
    append("No compliance verdict found. Running the gate before upload.");
    try {
      execSync(`node scripts/compliance-gate.mjs --date="${DATE}"`, { cwd: ROOT, stdio: "inherit" });
    } catch {
      // Exit code 1 means some videos were blocked, which is a normal outcome.
      // The verdict file is still written, so carry on and read it.
    }
  }
  if (!fs.existsSync(verdictPath)) {
    append("FATAL: compliance gate did not produce a verdict. Refusing to upload.");
    process.exit(1);
  }
  const verdict = readJSON(verdictPath);
  complianceBlocked = new Set(verdict.blocked || []);
  append(`Compliance: ${(verdict.allowed || []).length} cleared, ${complianceBlocked.size} blocked (policy v${verdict.policyVersion}).`);
  if (complianceBlocked.size) {
    append(`Blocked by compliance: ${[...complianceBlocked].join(", ")}`);
  }
}

const channels = readJSON(path.join(ROOT, "scripts/data/channels.json"), { channels: [] });
const publishedPath = path.join(ROOT, "scripts/data/published.json");
const published = readJSON(publishedPath);
published.videos = published.videos || [];

// CRITICAL: the generator records a topic in topicsUsed at GENERATION time, so
// topicsUsed can never be the skip signal. It would skip every single video.
// The real signal is whether we already have a YouTube video ID for that slug.
const uploadedIds = new Set(
  published.videos.filter((v) => v && v.youtubeId).map((v) => v.id)
);

function recordUpload(slug, youtubeId, privacy) {
  const fresh = readJSON(publishedPath);
  fresh.videos = fresh.videos || [];
  const entry = fresh.videos.find((v) => v && v.id === slug);
  if (entry) {
    entry.youtubeId = youtubeId;
    entry.youtubeUrl = `https://youtu.be/${youtubeId}`;
    entry.uploadedAt = new Date().toISOString();
    entry.privacy = privacy;
  }
  fs.writeFileSync(publishedPath, JSON.stringify(fresh, null, 2) + "\n");
}

for (const propsFile of propsFiles) {
  const slug = propsFile.replace(/\.props\.json$/, "");
  const metaPath = path.join(dir, `${slug}.meta.json`);
  const meta = readJSON(metaPath);
  const propsAbs = path.join(dir, propsFile);
  const outFile = path.join(ROOT, meta.file);

  append(`\n--- ${slug} ---`);

  if (UPLOAD && uploadedIds.has(slug)) {
    append(`  SKIPPED: already uploaded to YouTube. Clear its youtubeId in published.json to re-run.`);
    skipCount++;
    continue;
  }
  append(`  theme=${meta.themeId} font=${meta.fontFamilyId} audio=${meta.audioUrl} privacy=${meta.privacy}`);

  // Reuse an existing render if one is already on disk and non-trivial in size.
  let needsRender = true;
  if (fs.existsSync(outFile)) {
    try {
      if (fs.statSync(outFile).size > 100_000) {
        append(`  reusing existing render: ${meta.file}`);
        needsRender = false;
        okCount++;
      }
    } catch { /* fall through and re-render */ }
  }

  if (needsRender) {
    // Which composition to render. Rich topics emit Editorial Reel props and
    // stamp _composition: "Reel"; everything the ThemedShort path produces has
    // no such field and renders as Daily, exactly as before. The allow-list
    // matters — this string is interpolated straight into a shell command, so
    // an unexpected value from a props file must not reach it.
    let composition = "Daily";
    try {
      const declared = JSON.parse(fs.readFileSync(propsAbs, "utf8"))._composition;
      if (declared === "Reel" || declared === "Daily") composition = declared;
      else if (declared) append(`  ${slug}: ignoring unknown _composition "${declared}", rendering Daily`);
    } catch { /* unreadable props will fail the render below with a clearer error */ }

    const renderCmd = [
      "npx remotion render",
      `src/compositions/registry.tsx ${composition}`,
      `"${outFile}"`,
      `--props="${propsAbs}"`,
      `--concurrency=${CONCURRENCY}`,
      // Encoding was previously left entirely to defaults, which is how a
      // vertical Short ended up soft and heavy at the same time.
      "--codec=h264",
      // yuv420p is the only chroma format every phone, browser and social
      // platform decodes reliably. Without it some encoders emit yuv444p,
      // which several players refuse outright or fall back to software
      // decoding for, and software decode on a phone is what stutter is.
      "--pixel-format=yuv420p",
      // Constant quality rather than a bitrate target: type and flat colour
      // need very few bits, so a fixed bitrate wastes them on still frames and
      // starves the motion. 18 is visually transparent for this material.
      "--crf=18",
      GL_FLAGS,
    ].filter(Boolean).join(" ");

    try {
      execSync(renderCmd, { cwd: ROOT, stdio: "inherit" });
      append(`  rendered: ${meta.file}`);
      okCount++;
    } catch (err) {
      append(`  FAILED render: ${err.message || err}`);
      failCount++;
      continue;
    }
  }

  if (UPLOAD && complianceBlocked.has(slug)) {
    append(`  BLOCKED BY COMPLIANCE: not uploaded. See daily/${DATE}/compliance-verdict.json.`);
    blockedCount++;
    continue;
  }

  if (UPLOAD) {
    try {
      const tags = (meta.tags || []).join(",");
      const channel = (channels.channels || []).find((c) => c.id === meta.channelId);

      // Instagram fetches the video from a public URL rather than accepting an
      // upload, so it needs the file hosted first. Skip rather than fail the
      // batch if no public base URL is configured.
      if (meta.platform === "instagram") {
        // Instagram cURLs the video from a public URL. Resolve it in priority
        // order: an explicit override, then the media-urls.json written by
        // publish-media.mjs, then host it now.
        let videoUrl = null;
        const urlsPath = path.join(dir, "media-urls.json");

        if (process.env.PUBLIC_MEDIA_BASE_URL) {
          videoUrl = `${process.env.PUBLIC_MEDIA_BASE_URL.replace(/\/$/, "")}/${encodeURIComponent(path.basename(outFile))}`;
        } else {
          if (!fs.existsSync(urlsPath)) {
            append(`  hosting media so Instagram can fetch it...`);
            try {
              execSync(`node scripts/publish-media.mjs --date="${DATE}"`, { cwd: ROOT, stdio: "inherit" });
            } catch {
              append(`  FAILED to host media. Instagram cannot fetch a local file.`);
              failCount++;
              continue;
            }
          }
          if (fs.existsSync(urlsPath)) {
            const m = readJSON(urlsPath, { urls: {} });
            videoUrl = (m.urls || {})[slug] || null;
          }
        }

        if (!videoUrl) {
          append(`  SKIPPED: no public URL for ${slug}. Set PUBLIC_MEDIA_BASE_URL or check publish-media.mjs.`);
          skipCount++;
          continue;
        }
        // Prefer Composio when configured: it holds the auth and refreshes the
        // token itself, so there is no 60-day expiry to forget about.
        //
        // A secret that EXISTS but is EMPTY reads as an empty string here, which
        // is falsy, so it silently falls through to the direct Meta path and
        // then fails for a completely unrelated-looking reason. Report the
        // length of each credential (never the value) so an empty secret is
        // distinguishable from a missing one at a glance.
        // Note the limit of what a runner can actually know: GitHub substitutes
        // an empty string for a secret that does not exist AND for one whose
        // value is blank, so from in here the two are indistinguishable. Say
        // "empty or not set" rather than asserting which, and check the repo
        // secret list to tell them apart.
        const credState = (name) => {
          const v = process.env[name];
          if (!v) return `${name}=EMPTY or not set`;
          return `${name}=present(${v.length} chars)`;
        };
        append(
          `  ig credentials: ${["COMPOSIO_API_KEY", "IG_ACCESS_TOKEN", "IG_USER_ID"]
            .map(credState)
            .join(", ")}`
        );

        const useComposio = !!process.env.COMPOSIO_API_KEY;
        const igScript = useComposio
          ? "scripts/instagram-upload-composio.mjs"
          : "scripts/instagram-upload.mjs";

        // Fail with a message that names the actual problem, rather than
        // letting the upload script fail on a missing token further down.
        if (!useComposio && !process.env.IG_ACCESS_TOKEN) {
          append(
            `  FAILED: no usable Instagram credential. Both COMPOSIO_API_KEY ` +
              `and IG_ACCESS_TOKEN arrived empty. If the secret is listed in ` +
              `the repo but arrives empty here, it was stored with a blank ` +
              `value; re-set it with:\n` +
              `    gh secret set COMPOSIO_API_KEY --repo bbmw96/bbmw0-technologies-ai`
          );
          failCount++;
          continue;
        }
        append(`  instagram via: ${useComposio ? "Composio" : "direct Meta API"}`);
        const igCmd = [
          "node", igScript,
          `--video-url="${videoUrl}"`,
          `--caption="${meta.title.replace(/"/g, '\\"')}"`,
          `--tags="${tags}"`,
        ].join(" ");
        // stderr must be "pipe", not "inherit". With "inherit" the child's
        // error text goes straight to the runner console and is NOT attached to
        // the thrown error, so the catch block below has nothing to report and
        // the failure reads as a bare "Command failed". Capturing it means the
        // reason lands in render-log.txt, which is committed back to the repo
        // and is therefore readable without digging through CI output.
        const igOut = execSync(igCmd, {
          cwd: ROOT,
          encoding: "utf8",
          stdio: ["inherit", "pipe", "pipe"],
        });
        process.stdout.write(igOut);
        const im = igOut.match(/Media ID:\s*(\d+)/);
        if (im) {
          recordUpload(slug, im[1], meta.privacy);
          uploadedIds.add(slug);
          append(`  published to Instagram: media ${im[1]}`);
        }
        uploadCount++;
        continue;
      }

      const credFlag = channel && channel.credentialsFile
        ? ` --credentials="${channel.credentialsFile}"` : "";
      const cmd = [
        "node", "scripts/youtube-upload.mjs",
        `--file="${outFile}"`,
        `--title="${meta.title.replace(/"/g, '\\"')}"`,
        `--description="${meta.description.replace(/\n/g, "\\n").replace(/"/g, '\\"')}"`,
        `--tags="${tags}"`,
        `--category=${meta.categoryId}`,
        `--privacy=${meta.privacy}`,
        "--shorts",
      ].join(" ") + credFlag;

      // Capture stdout so we can pull the video ID out, but still show progress.
      const out = execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["inherit", "pipe", "inherit"] });
      process.stdout.write(out);

      // Wrong-channel guard. If the operator signed in as the wrong Google
      // account during rotation, every upload silently lands on someone else's
      // channel. Compare what YouTube says against the registry and stop the
      // batch immediately rather than publishing four more to the wrong place.
      const chMatch = out.match(/Channel ID:\s*(UC[A-Za-z0-9_-]+)/);
      if (chMatch && channel && channel.channelId && chMatch[1] !== channel.channelId) {
        // Record it first. The video IS published; losing it from history would
        // mean re-uploading a duplicate later. Halt after recording, not before.
        const vm = out.match(/Video ID:\s*([A-Za-z0-9_-]{6,})/);
        if (vm) { recordUpload(slug, vm[1], meta.privacy); uploadedIds.add(slug); }
        append(`  FATAL: uploaded to channel ${chMatch[1]} but ${meta.channelId} expects ${channel.channelId}.`);
        append(`  The video IS live${vm ? ` at https://youtu.be/${vm[1]}` : ""} and has been recorded.`);
        append(`  The credentials authorise the WRONG channel. Stopping before more go astray.`);
        append(`  Fix: npm run yt:rotate -- --channel=${meta.channelId}  (sign in as ${channel.handle})`);
        failCount++;
        break;
      }

      const m = out.match(/Video ID:\s*([A-Za-z0-9_-]{6,})/);
      if (m) {
        recordUpload(slug, m[1], meta.privacy);
        uploadedIds.add(slug);
        append(`  uploaded ${meta.privacy}: https://youtu.be/${m[1]}`);
      } else {
        append(`  uploaded, but no video ID found in output. Not recorded.`);
      }
      uploadCount++;
    } catch (err) {
      // execSync throws with the child's output on .stdout / .stderr. Logging
      // only err.message gives "Command failed: node scripts/..." and nothing
      // about WHY, which made the first Instagram failure impossible to
      // diagnose from the run log. Surface the child's own words.
      append(`  FAILED upload: ${err.message || err}`);
      const decode = (b) => (b == null ? "" : Buffer.isBuffer(b) ? b.toString("utf8") : String(b));
      for (const [label, buf] of [["stdout", err.stdout], ["stderr", err.stderr]]) {
        const body = decode(buf).trim();
        if (!body) continue;
        append(`  --- child ${label} ---`);
        // Cap it: an API error is short, but a stack trace or an HTML error
        // page is not, and the log gets committed back to the repo.
        for (const line of body.split("\n").slice(-25)) append(`  | ${line}`);
      }
      failCount++;
    }
  }
}

append(`\n=== Done. ${okCount} rendered, ${uploadCount} uploaded, ${skipCount} skipped, ${blockedCount} blocked by compliance, ${failCount} failed. ===`);
if (failCount > 0) process.exit(1);
