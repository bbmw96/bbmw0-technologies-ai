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

export function runHalalRules(meta, props, policy) {
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
  // Videos are pure typography today. This guards the future: the moment an
  // image or video asset enters a composition, it must be reviewed.
  if (H.forbid_animate_imagery) {
    const assets = findMediaAssets(props);
    if (assets.length) {
      out.push(finding(SEVERITY.BLOCK, "halal.animate_imagery",
        `Video contains ${assets.length} image or video asset(s). Only typography is permitted, so any depiction of humans or animals must be reviewed before use.`,
        { assets: assets.slice(0, 5) }));
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
