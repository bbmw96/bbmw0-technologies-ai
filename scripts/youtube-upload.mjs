// YouTube upload helper. Uploads a single MP4 with title, description, tags,
// category, and privacy status. Uses the refresh token captured by
// scripts/youtube-auth.mjs so it can run unattended.
//
// USAGE:
//   node scripts/youtube-upload.mjs \
//     --file=out/whyvertical.mp4 \
//     --title="Vertical first. Always." \
//     --description="..." \
//     --tags="shorts,videoeditor,opensource" \
//     --category=28 \
//     --privacy=private \
//     --shorts
//
// FLAGS:
//   --file       (required) path to the MP4
//   --title      (required) video title (max 100 chars)
//   --description       description body (default: empty)
//   --tags       comma-separated tags
//   --category   numeric YouTube categoryId. 28 = Science & Technology,
//                22 = People & Blogs, 27 = Education. Default 28.
//   --privacy    private | unlisted | public (default: private)
//   --shorts     if present, appends "#Shorts" to title and description
//                so YouTube treats the upload as a Short
//   --thumbnail  optional path to a JPG/PNG thumbnail to attach
//   --credentials  path to a channel credentials JSON (default scripts/yt-credentials.json)
//
// EXIT CODES:
//   0  uploaded successfully
//   1  bad arguments / missing credentials
//   2  upload failed (Google API error)
//
// SAFETY: defaults to PRIVATE. You must review videos in YouTube Studio
// and switch them public yourself until you trust the automation.

import { google } from "googleapis";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Per-channel credentials. --credentials=<path> lets a second channel reuse
// this script without duplicating it. Defaults to the primary channel.
const CREDS_PATH = (() => {
  const flag = process.argv.find((a) => a.startsWith("--credentials="));
  if (flag) {
    const p = flag.slice("--credentials=".length);
    return path.isAbsolute(p) ? p : path.join(__dirname, "..", p);
  }
  return path.join(__dirname, "yt-credentials.json");
})();

function parseArgs(argv) {
  const out = { _: [] };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq === -1) {
        out[arg.slice(2)] = true;
      } else {
        out[arg.slice(2, eq)] = arg.slice(eq + 1);
      }
    } else {
      out._.push(arg);
    }
  }
  return out;
}

const args = parseArgs(process.argv);

function fail(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

if (!args.file) fail("Missing --file=<path-to-mp4>");
if (!args.title) fail("Missing --title=<video-title>");
if (!fs.existsSync(args.file)) fail(`File not found: ${args.file}`);
if (!fs.existsSync(CREDS_PATH))
  fail(`Missing ${CREDS_PATH}. Run npm run yt:rotate first.`);

const creds = JSON.parse(fs.readFileSync(CREDS_PATH, "utf8"));
if (!creds.refresh_token)
  fail(`${CREDS_PATH} has no refresh_token. Re-run npm run yt:rotate.`);

const oauth2 = new google.auth.OAuth2(creds.client_id, creds.client_secret);
oauth2.setCredentials({ refresh_token: creds.refresh_token });

const youtube = google.youtube({ version: "v3", auth: oauth2 });

const isShort = !!args.shorts;
const title = isShort && !args.title.includes("#Shorts")
  ? `${args.title} #Shorts`
  : args.title;
// render-batch escapes newlines to survive the shell (\n becomes backslash-n).
// Without unescaping here, YouTube receives the LITERAL two characters, which
// is why every published description read "No chatter.\n\nThe first vending
// machine..." instead of having real paragraph breaks.
let description = (args.description || "")
  .replace(/\\n/g, "\n")
  .replace(/\\"/g, '"');
if (isShort && !/#Shorts/i.test(description)) {
  description = description ? `${description}\n\n#Shorts` : "#Shorts";
}

const tags = (args.tags || "")
  .split(",")
  .map((t) => t.trim())
  .filter(Boolean);

const categoryId = String(args.category || "28");
const privacyStatus = ["private", "unlisted", "public"].includes(args.privacy)
  ? args.privacy
  : "private";

console.log(`Uploading ${args.file}`);
console.log(`  Title:    ${title}`);
console.log(`  Privacy:  ${privacyStatus}`);
console.log(`  Category: ${categoryId}`);
if (tags.length) console.log(`  Tags:     ${tags.join(", ")}`);

try {
  const stat = fs.statSync(args.file);
  const res = await youtube.videos.insert(
    {
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: title.slice(0, 100),
          description,
          tags,
          categoryId,
        },
        status: {
          privacyStatus,
          selfDeclaredMadeForKids: false, // adjust per video if needed
        },
      },
      media: {
        body: fs.createReadStream(args.file),
      },
    },
    {
      onUploadProgress: (evt) => {
        const pct = ((evt.bytesRead / stat.size) * 100).toFixed(1);
        process.stdout.write(`\r  Progress: ${pct}%   `);
      },
    }
  );
  process.stdout.write("\n");
  const id = res.data.id;
  // The insert response tells us which channel actually received the video.
  // This is the only reliable wrong-channel check available: the youtube.upload
  // scope does not permit channels.list, so it cannot be verified beforehand.
  // Surfacing it here lets render-batch catch a wrong-account authorisation on
  // video ONE rather than after a whole batch has gone to the wrong place.
  const actualChannel = res.data.snippet?.channelId;
  if (actualChannel) console.log(`Channel ID: ${actualChannel}`);
  console.log(`Uploaded. Video ID: ${id}`);
  console.log(`URL: https://youtu.be/${id}`);

  if (args.thumbnail && fs.existsSync(args.thumbnail)) {
    await youtube.thumbnails.set({
      videoId: id,
      media: { body: fs.createReadStream(args.thumbnail) },
    });
    console.log(`Thumbnail set: ${args.thumbnail}`);
  }
} catch (err) {
  process.stdout.write("\n");
  console.error("Upload failed:", err.errors || err.message || err);
  process.exit(2);
}
