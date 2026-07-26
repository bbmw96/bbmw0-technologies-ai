// Deterministic compliance rules. No network, no models, no ambiguity.
// Every check here is objective and reproducible: same input, same verdict.
// Judgement calls belong in ai-panel.mjs, not here.

export const SEVERITY = { BLOCK: "BLOCK", WARN: "WARN", INFO: "INFO" };

const wordBoundary = (term) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "iu");

function finding(severity, rule, message, detail) {
  return { severity, rule, message, detail: detail ?? null };
}

// ---------------------------------------------------------------- field limits
function checkFieldLimits(meta, policy) {
  const out = [];
  const L = policy.youtube_limits;

  if (!meta.title || !meta.title.trim()) {
    out.push(finding(SEVERITY.BLOCK, "title.missing", "Title is empty."));
  } else if (meta.title.length > L.title_max_chars) {
    out.push(finding(SEVERITY.BLOCK, "title.too_long",
      `Title is ${meta.title.length} chars, limit is ${L.title_max_chars}. YouTube truncates or rejects.`));
  }

  if ((meta.description || "").length > L.description_max_chars) {
    out.push(finding(SEVERITY.BLOCK, "description.too_long",
      `Description is ${meta.description.length} chars, limit is ${L.description_max_chars}.`));
  }

  const tags = meta.tags || [];
  const tagChars = tags.join(",").length;
  if (tags.length < L.tags_min_count) {
    out.push(finding(SEVERITY.WARN, "tags.too_few",
      `${tags.length} tags. Below ${L.tags_min_count} hurts discoverability.`));
  }
  if (tags.length > L.tags_max_count) {
    out.push(finding(SEVERITY.BLOCK, "tags.too_many",
      `${tags.length} tags, limit is ${L.tags_max_count}. Excess tags read as keyword stuffing.`));
  }
  if (tagChars > L.tags_total_max_chars) {
    out.push(finding(SEVERITY.BLOCK, "tags.total_too_long",
      `Tags total ${tagChars} chars, limit is ${L.tags_total_max_chars}.`));
  }
  for (const t of tags) {
    if (t.length > L.tag_max_chars) {
      out.push(finding(SEVERITY.WARN, "tags.tag_too_long", `Tag "${t}" is ${t.length} chars.`));
    }
  }

  const titleHashes = (meta.title.match(/#/g) || []).length;
  if (titleHashes > L.title_max_hashtags) {
    out.push(finding(SEVERITY.BLOCK, "title.too_many_hashtags",
      `${titleHashes} hashtags in title. YouTube ignores all of them above ${L.title_max_hashtags}.`));
  }

  const durSec = meta.durationInFrames ? meta.durationInFrames / 30 : null;
  if (durSec !== null && durSec > L.shorts_max_seconds) {
    out.push(finding(SEVERITY.BLOCK, "duration.not_a_short",
      `${durSec.toFixed(1)}s exceeds the ${L.shorts_max_seconds}s Shorts limit. It will publish as a normal video.`));
  }
  return out;
}

// ---------------------------------------------------------------- house style
function checkHouseStyle(meta, policy) {
  const out = [];
  const H = policy.house_style;
  const text = `${meta.title}\n${meta.description}`;

  if (H.forbid_em_dash && /—/.test(text)) {
    out.push(finding(SEVERITY.BLOCK, "style.em_dash", "Em-dash found in title or description."));
  }
  if (H.forbid_en_dash && /–/.test(text)) {
    out.push(finding(SEVERITY.BLOCK, "style.en_dash", "En-dash found in title or description."));
  }
  if (H.forbid_emoji &&
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u.test(text)) {
    out.push(finding(SEVERITY.BLOCK, "style.emoji", "Emoji found in title or description."));
  }
  if (H.require_uk_english) {
    for (const [us, uk] of Object.entries(H.us_spellings)) {
      if (wordBoundary(us).test(text)) {
        out.push(finding(SEVERITY.BLOCK, "style.us_spelling",
          `US spelling "${us}" found. Use "${uk}".`));
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- kid safety
function checkKidSafety(meta, props, policy) {
  const out = [];
  const K = policy.kid_safety;
  const onScreen = collectOnScreenText(props);
  const text = `${meta.title}\n${meta.description}\n${onScreen}`;

  for (const term of (K.hard_banned || [])) {
    if (wordBoundary(term).test(text)) {
      out.push(finding(SEVERITY.BLOCK, "safety.hard_banned",
        `Prohibited term "${term}" appears in the video text or metadata.`,
        { term }));
    }
  }

  // Context-sensitive terms are common in legitimate science, nature and
  // history. They warn rather than block, and the AI safety reviewer decides.
  const flagged = [];
  for (const term of (K.context_sensitive || [])) {
    if (wordBoundary(term).test(text)) flagged.push(term);
  }
  if (flagged.length) {
    out.push(finding(SEVERITY.WARN, "safety.context_review",
      `Context-sensitive term(s) present: ${flagged.join(", ")}. Legitimate in educational science and history, referred to the AI safety reviewer.`,
      { terms: flagged }));
  }
  return out;
}

// ------------------------------------------------------- metadata integrity
function checkMetadataIntegrity(meta, props, policy) {
  const out = [];
  const M = policy.metadata_integrity;
  const text = `${meta.title} ${meta.description}`;

  for (const pat of M.forbid_clickbait_patterns) {
    if (new RegExp(pat, "i").test(text)) {
      out.push(finding(SEVERITY.BLOCK, "metadata.clickbait",
        `Clickbait pattern "${pat}" found. This engages the deceptive-practices policy.`));
    }
  }

  const counts = new Map();
  for (const t of (meta.tags || [])) {
    const k = t.trim().toLowerCase();
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  for (const [tag, n] of counts) {
    if (n > M.max_tag_repetition) {
      out.push(finding(SEVERITY.BLOCK, "metadata.tag_stuffing",
        `Tag "${tag}" repeated ${n} times.`));
    }
  }

  const caps = (meta.title.match(/\b[A-Z]{2,}\b/g) || [])
    .filter((w) => !/^(AI|UK|US|CSS|SMS|MIT|NASA|DNA|REM|PWA|HTML|JSON)$/.test(w));
  if (caps.length > M.forbid_all_caps_words_over) {
    out.push(finding(SEVERITY.WARN, "metadata.shouting",
      `${caps.length} all-caps words in title: ${caps.join(", ")}.`));
  }

  if (/([!?]){2,}/.test(meta.title)) {
    out.push(finding(SEVERITY.WARN, "metadata.punctuation",
      "Repeated punctuation in title reads as low quality."));
  }

  // The title must actually reflect what is on screen.
  if (M.require_title_matches_content) {
    const onScreen = collectOnScreenText(props).toLowerCase();
    const titleCore = meta.title.replace(/#\w+/g, "").trim().toLowerCase();
    const words = titleCore.split(/\W+/).filter((w) => w.length > 3);
    if (words.length) {
      const hits = words.filter((w) => onScreen.includes(w)).length;
      if (hits / words.length < 0.4) {
        out.push(finding(SEVERITY.BLOCK, "metadata.title_mismatch",
          `Only ${Math.round((hits / words.length) * 100)}% of title keywords appear in the video. Misleading metadata risk.`));
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- legal
function checkLegal(meta, props, policy, audioLicences) {
  const out = [];
  const G = policy.legal;
  const text = `${meta.title} ${meta.description} ${collectOnScreenText(props)}`;

  if (G.require_audio_licence_record && meta.audioUrl) {
    const rec = (audioLicences.tracks || []).find((t) => t.file === meta.audioUrl);
    if (!rec) {
      out.push(finding(SEVERITY.BLOCK, "legal.audio_unrecorded",
        `Audio "${meta.audioUrl}" has no entry in audio-licences.json.`));
    } else if (!rec.licence || rec.licence === "UNKNOWN") {
      const sev = policy.enforcement.on_audio_licence_unknown === "block"
        ? SEVERITY.BLOCK : SEVERITY.WARN;
      out.push(finding(sev, "legal.audio_licence_unknown",
        `Audio "${meta.audioUrl}" has no recorded licence. Content ID claim risk on every video using it.`,
        { file: meta.audioUrl }));
    } else if (!G.acceptable_audio_licences.includes(rec.licence)) {
      out.push(finding(SEVERITY.BLOCK, "legal.audio_licence_unacceptable",
        `Audio "${meta.audioUrl}" licence "${rec.licence}" is not on the approved list.`));
    }
  }

  for (const brand of G.trademark_care_terms) {
    const re = new RegExp(`${brand}\\s+(official|partner|sponsored|endorsed|approved)`, "i");
    if (re.test(text)) {
      out.push(finding(SEVERITY.BLOCK, "legal.trademark_endorsement",
        `Text implies an official relationship with ${brand}.`));
    }
  }

  if (G.forbid_real_person_claims) {
    const re = /\b(said|says|claims|admitted|confirmed|denied)\b/i;
    if (re.test(text) && /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(text)) {
      out.push(finding(SEVERITY.WARN, "legal.attributed_quote",
        "Text may attribute a statement to a named person. Verify before publishing."));
    }
  }
  return out;
}

// ---------------------------------------------------------------- COPPA
function checkCoppa(meta, props, policy) {
  const out = [];
  const C = policy.coppa;
  if (C.require_explicit_declaration && typeof meta.madeForKids === "undefined") {
    out.push(finding(SEVERITY.WARN, "coppa.undeclared",
      `No madeForKids field on the video. Falling back to the channel default of ${C.declared_made_for_kids}.`));
  }
  const text = `${meta.title} ${meta.description} ${collectOnScreenText(props)}`.toLowerCase();
  for (const sig of C.forbid_child_directed_signals) {
    if (text.includes(sig.toLowerCase())) {
      out.push(finding(SEVERITY.BLOCK, "coppa.child_directed_signal",
        `"${sig}" makes this look child-directed while the channel declares made-for-kids = ${C.declared_made_for_kids}. Mismatch carries FTC exposure.`));
    }
  }
  return out;
}

// ---------------------------------------------------------------- helpers
export function collectOnScreenText(props) {
  if (!props || !Array.isArray(props.beats)) return "";
  const parts = [];
  const walk = (v) => {
    if (typeof v === "string") parts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  props.beats.forEach(walk);
  return parts.join(" ");
}

export function runRules(meta, props, policy, audioLicences) {
  return [
    ...checkFieldLimits(meta, policy),
    ...checkHouseStyle(meta, policy),
    ...checkKidSafety(meta, props, policy),
    ...checkMetadataIntegrity(meta, props, policy),
    ...checkLegal(meta, props, policy, audioLicences),
    ...checkCoppa(meta, props, policy),
  ];
}
