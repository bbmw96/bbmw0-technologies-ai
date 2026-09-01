// Halal content rules.
//
// Enforced as hard blocks on every video, per the channel owner's explicit
// instruction. These sit alongside the platform-policy and legal layers rather
// than replacing them: a video must satisfy all of them.
//
// Scope, stated honestly: this is a keyword and pattern layer over the text of
// a video. It catches the clear cases. It is not a substitute for a scholar,
// and it cannot judge nuance. Where a term is legitimate in one context and not
// another, the term is referred to the AI reviewer rather than blocked outright,
// exactly as the kid-safety layer does.

import { SEVERITY } from "./rules.mjs";
import { collectOnScreenText } from "./rules.mjs";

const wordBoundary = (term) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "iu");

function finding(severity, rule, message, detail) {
  return { severity, rule, message, detail: detail ?? null };
}

export function runHalalRules(meta, props, policy, imageryReview) {
  const H = policy.halal;
  if (!H || !H.enabled) return [];

  const out = [];
  const text = `${meta.title}\n${meta.description}\n${collectOnScreenText(props)}`;

  // ---- Core prohibitions -------------------------------------------------
  for (const [category, terms] of Object.entries(H.prohibited || {})) {
    for (const term of terms) {
      if (wordBoundary(term).test(text)) {
        out.push(finding(SEVERITY.BLOCK, `halal.${category}`,
          `Prohibited under ${category}: "${term}".`, { term, category }));
      }
    }
  }

  // ---- Astrology and superstition ----------------------------------------
  for (const term of (H.superstition || [])) {
    if (wordBoundary(term).test(text)) {
      out.push(finding(SEVERITY.BLOCK, "halal.superstition",
        `Astrology or superstition: "${term}".`, { term }));
    }
  }

  // ---- Theological care --------------------------------------------------
  // Contested origins claims stated as settled fact. The pattern requires a
  // deep-time or origins marker, so ordinary uses of "old" or "ancient" in a
  // historical fact do not trip it.
  for (const pat of (H.origins_patterns || [])) {
    const re = new RegExp(pat, "i");
    if (re.test(text)) {
      out.push(finding(SEVERITY.BLOCK, "halal.origins_claim",
        `States a contested origins or deep-time claim as settled fact (matched: ${pat}).`,
        { pattern: pat }));
    }
  }

  // ---- Depiction of animate beings ---------------------------------------
  // Narrowed 1 Sep 2026, approved by the channel owner in chat: real imagery
  // of animals is allowed, real imagery of people is not, and every asset
  // must be reviewed, confirmed free of eyes and faces in every frame, and
  // recorded in animate_imagery.registry_file before it can be used. This
  // mirrors legal.require_audio_licence_record: an asset with no matching,
  // cleared entry is blocked, full stop, no inference from filename alone.
  const AI = H.animate_imagery;
  if (AI && AI.enabled) {
    const assets = findMediaAssets(props);
    const registry = (imageryReview && imageryReview.assets) || [];
    for (const hit of assets) {
      const val = hit.includes(": ") ? hit.slice(hit.indexOf(": ") + 2) : hit;
      // Exact match only. A substring match here is a real hazard: e.g.
      // "mantis-shrimp-colour-demo.png" is a substring of the rejected
      // "mantis-shrimp-colour-demo.png.old-with-eyes", so a fuzzy match
      // let a rejected asset resolve to its cleared sibling's entry. Fail
      // closed instead: an unrecognised path is unreviewed, not guessed at.
      const rec = registry.find((r) => r.file === val);

      if (!rec) {
        out.push(finding(SEVERITY.BLOCK, "halal.animate_imagery_unreviewed",
          `"${val}" has no entry in ${AI.registry_file || "animate-imagery-review.json"}. Every image or video asset must be reviewed and recorded before use.`,
          { asset: val }));
        continue;
      }
      if (!rec.cleared) {
        out.push(finding(SEVERITY.BLOCK, "halal.animate_imagery_rejected",
          `"${val}" is recorded as not cleared: ${rec.notes || "no reason given"}.`,
          { asset: val }));
        continue;
      }
      if (rec.depicts === "person" && !AI.people_allowed) {
        out.push(finding(SEVERITY.BLOCK, "halal.animate_imagery_person",
          `"${val}" depicts a person. Real imagery of people is not approved.`,
          { asset: val }));
        continue;
      }
      if (rec.depicts === "animal" && !AI.animals_allowed) {
        out.push(finding(SEVERITY.BLOCK, "halal.animate_imagery_animal",
          `"${val}" depicts an animal, which is not currently approved.`,
          { asset: val }));
        continue;
      }
      if (AI.require_no_eyes_or_face && rec.eyesOrFaceVisible) {
        out.push(finding(SEVERITY.BLOCK, "halal.animate_imagery_eyes_visible",
          `"${val}" is recorded as showing eyes or a face, which the standing content rule forbids regardless of species.`,
          { asset: val }));
        continue;
      }
      out.push(finding(SEVERITY.INFO, "halal.animate_imagery_cleared",
        `"${val}" is a reviewed, cleared animate-imagery asset (${rec.depicts}, no eyes or face visible). Reviewed ${rec.reviewed_on || "date unrecorded"}.`,
        { asset: val }));
    }
  }

  // ---- Terms needing context ---------------------------------------------
  const flagged = (H.context_review || []).filter((t) => wordBoundary(t).test(text));
  if (flagged.length) {
    out.push(finding(SEVERITY.WARN, "halal.context_review",
      `Term(s) needing context: ${flagged.join(", ")}. Referred to the AI reviewer.`,
      { terms: flagged }));
  }

  return out;
}

/** Walk props for anything that looks like an image or video asset reference. */
function findMediaAssets(props) {
  const hits = [];
  const mediaKey = /^(src|image|imageUrl|videoUrl|poster|thumbnail|backgroundImage|photo|icon)$/i;
  const mediaVal = /\.(png|jpe?g|gif|webp|svg|avif|mp4|webm|mov)(\?|$)/i;
  const walk = (v, key) => {
    if (typeof v === "string") {
      if ((key && mediaKey.test(key)) || mediaVal.test(v)) hits.push(`${key || "?"}: ${v.slice(0, 80)}`);
    } else if (Array.isArray(v)) {
      v.forEach((x) => walk(x, key));
    } else if (v && typeof v === "object") {
      for (const [k, val] of Object.entries(v)) walk(val, k);
    }
  };
  walk(props, null);
  return hits;
}
