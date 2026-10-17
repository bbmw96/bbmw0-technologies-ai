// usage: node scripts/_bd_zina_meta.mjs <pub-json-file>   (slug -> [mediaId, shortcode, publishedAt])
import fs from "fs";
const d = "daily/2026-10-17/blankdiscussions";
const pub = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
let n = 0;
for (const [slug, v] of Object.entries(pub)) {
  if (slug === "__reel") continue;
  const f = `${d}/${slug}.meta.json`;
  const m = JSON.parse(fs.readFileSync(f, "utf8"));
  if (m.status === "published") continue;
  m.status = "published";
  m.published = {
    mediaId: v[0], permalink: `https://www.instagram.com/p/${v[1]}/`, publishedAt: v[2],
    hostingUrls: m.hostingUrls || null, publishedVia: "Composio INSTAGRAM_CREATE_CAROUSEL_CONTAINER (child_image_urls) + INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH",
  };
  fs.writeFileSync(f, JSON.stringify(m, null, 2) + "\n"); n++;
}
const r = pub.__reel && pub.__reel[0];
if (r) {
  fs.writeFileSync(`${d}/reel-zina-quran-and-hadith.meta.json`, JSON.stringify({
    slug: "reel-zina-quran-and-hadith", date: "2026-10-17", channel: "ig-blankdiscussions", platform: "instagram", handle: "@blankdiscussions",
    mediaFormat: "reel", series: "zina-quran-and-hadith", caption: r.caption, status: "published",
    video: "reel-zina-quran-and-hadith.mp4",
    edit: "Dola AI watermark removed by cropping to 686x1220 from the top-left and scaling to 1080x1920; original audio loudness-normalised (-37 dB mean to about -18 dB), looped to cover the full length; clip extended with a reversed copy and 12 BlankDiscussions-themed verse/hadith cards rendered from this batch's Remotion slides.",
    published: { mediaId: r.id, permalink: r.permalink, publishedAt: r.timestamp, publishedVia: "Composio INSTAGRAM_POST_IG_USER_MEDIA (REELS) + INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH" },
  }, null, 2) + "\n");
}
console.log("updated", n);
