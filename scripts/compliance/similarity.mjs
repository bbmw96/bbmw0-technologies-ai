// Repetition detection.
//
// This is the most important file in the compliance system. YouTube's
// "Mass-produced or repetitive content" policy is the one that demonetises
// automated channels wholesale, and it is judged on how similar your videos
// are TO EACH OTHER, not on whether each one is individually fine.
//
// Three independent axes are measured, because a video can be textually novel
// while still being structurally identical to everything else on the channel:
//   1. Text    - how close is the wording to anything published before
//   2. Presentation - theme, font and audio combination reuse and spacing
//   3. Topical - niche concentration over a rolling window

import { SEVERITY } from "./rules.mjs";

const STOP = new Set([
  "the","a","an","is","are","was","were","be","been","to","of","in","on","at",
  "for","with","and","or","but","it","its","this","that","these","those","you",
  "your","from","as","by","not","can","will","has","have","had","do","does",
  "shorts","didyouknow","learn","quickfact","facts",
]);

export function normalise(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/#\w+/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokens(text) {
  return normalise(text).split(" ").filter((w) => w.length > 2 && !STOP.has(w));
}

// Character trigrams catch near-duplicates that word overlap misses,
// e.g. "Octopuses have blue blood" vs "Octopus has blue blood".
function trigrams(text) {
  const s = normalise(text).replace(/\s/g, "");
  const set = new Set();
  for (let i = 0; i < s.length - 2; i++) set.add(s.slice(i, i + 3));
  return set;
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Combined similarity: max of trigram and token overlap, so neither can hide a duplicate. */
export function similarity(a, b) {
  const tri = jaccard(trigrams(a), trigrams(b));
  const tok = jaccard(new Set(tokens(a)), new Set(tokens(b)));
  return Math.max(tri, tok);
}

function finding(severity, rule, message, detail) {
  return { severity, rule, message, detail: detail ?? null };
}

/**
 * @param candidate  { id, title, description, hook, themeId, fontFamilyId, audioUrl, niche }
 * @param history    published.videos, oldest first
 * @param batch      other candidates being published in the same run
 */
export function checkRepetition(candidate, history, batch, policy) {
  const out = [];
  const R = policy.repetition;
  const recent = history.slice(-R.compare_against_last_n);

  // ---- 1. Text similarity against everything published -------------------
  let worstTitle = { score: 0, against: null };
  let worstDesc = { score: 0, against: null };

  for (const prev of recent) {
    if (!prev || prev.id === candidate.id) continue;

    const tScore = similarity(candidate.title, prev.title || "");
    if (tScore > worstTitle.score) worstTitle = { score: tScore, against: prev.id };

    if (prev.description) {
      const dScore = similarity(candidate.description, prev.description);
      if (dScore > worstDesc.score) worstDesc = { score: dScore, against: prev.id };
    }
  }

  // Same-batch comparison matters just as much: five near-identical videos
  // published on one day is the clearest possible mass-production signal.
  for (const other of batch) {
    if (other.id === candidate.id) continue;
    const tScore = similarity(candidate.title, other.title);
    if (tScore > worstTitle.score) worstTitle = { score: tScore, against: other.id + " (same batch)" };
    const dScore = similarity(candidate.description, other.description);
    if (dScore > worstDesc.score) worstDesc = { score: dScore, against: other.id + " (same batch)" };
  }

  if (worstTitle.score > R.max_title_similarity) {
    out.push(finding(SEVERITY.BLOCK, "repetition.title",
      `Title is ${(worstTitle.score * 100).toFixed(0)}% similar to "${worstTitle.against}" (limit ${(R.max_title_similarity * 100).toFixed(0)}%).`,
      { score: worstTitle.score, against: worstTitle.against }));
  }
  if (worstDesc.score > R.max_description_similarity) {
    out.push(finding(SEVERITY.BLOCK, "repetition.description",
      `Description is ${(worstDesc.score * 100).toFixed(0)}% similar to "${worstDesc.against}" (limit ${(R.max_description_similarity * 100).toFixed(0)}%).`,
      { score: worstDesc.score, against: worstDesc.against }));
  }

  // ---- 2. Presentation reuse ---------------------------------------------
  const combo = `${candidate.themeId}|${candidate.fontFamilyId}|${candidate.audioUrl}`;
  if (R.forbid_exact_combo_reuse) {
    const clash = recent.find((p) => p && `${p.themeId}|${p.fontFamilyId}|${p.audioUrl}` === combo);
    if (clash) {
      out.push(finding(SEVERITY.BLOCK, "repetition.combo",
        `Theme/font/audio combination already used by "${clash.id}".`, { combo }));
    }
    const batchClash = batch.find((o) =>
      o.id !== candidate.id && `${o.themeId}|${o.fontFamilyId}|${o.audioUrl}` === combo);
    if (batchClash) {
      out.push(finding(SEVERITY.BLOCK, "repetition.combo_batch",
        `Same theme/font/audio as "${batchClash.id}" in this batch.`, { combo }));
    }
  }

  // Spacing: the same theme back to back looks like one template on repeat.
  const themeGap = distanceSinceLast(recent, (p) => p.themeId === candidate.themeId);
  if (themeGap !== null && themeGap < R.min_theme_gap) {
    out.push(finding(SEVERITY.WARN, "repetition.theme_spacing",
      `Theme "${candidate.themeId}" reused after only ${themeGap} video(s). Minimum gap is ${R.min_theme_gap}.`));
  }
  const audioGap = distanceSinceLast(recent, (p) => p.audioUrl === candidate.audioUrl);
  if (audioGap !== null && audioGap < R.min_audio_gap) {
    out.push(finding(SEVERITY.WARN, "repetition.audio_spacing",
      `Audio "${candidate.audioUrl}" reused after only ${audioGap} video(s). Minimum gap is ${R.min_audio_gap}.`));
  }

  // ---- 2b. Cross-channel duplication -------------------------------------
  // Publishing the same fact to two owned channels is a mass-produced content
  // signal across the whole estate, and on YouTube it can read as one channel
  // reuploading another. Channels are given separate niches for this reason;
  // this catches the case where allocation drifts or a topic is forced.
  if (candidate.channelId) {
    const elsewhere = recent.find(
      (p) => p && p.id === candidate.id && p.channelId && p.channelId !== candidate.channelId
    );
    if (elsewhere) {
      out.push(finding(SEVERITY.BLOCK, "repetition.cross_channel",
        `Topic "${candidate.id}" was already published on channel "${elsewhere.channelId}". Publishing it again on "${candidate.channelId}" duplicates content across owned channels.`,
        { otherChannel: elsewhere.channelId }));
    }

    let worstCross = { score: 0, against: null, channel: null };
    for (const p of recent) {
      if (!p || !p.channelId || p.channelId === candidate.channelId) continue;
      const sc = similarity(candidate.title, p.title || "");
      if (sc > worstCross.score) worstCross = { score: sc, against: p.id, channel: p.channelId };
    }
    if (worstCross.score > R.max_cross_channel_similarity) {
      out.push(finding(SEVERITY.BLOCK, "repetition.cross_channel_similar",
        `Title is ${(worstCross.score * 100).toFixed(0)}% similar to "${worstCross.against}" on channel "${worstCross.channel}" (limit ${(R.max_cross_channel_similarity * 100).toFixed(0)}%).`,
        { score: worstCross.score, against: worstCross.against, channel: worstCross.channel }));
    }
  }

  // ---- 3. Topical concentration ------------------------------------------
  const sameNicheInBatch = batch.filter((o) => o.niche === candidate.niche).length;
  if (sameNicheInBatch > R.max_same_niche_per_day) {
    out.push(finding(SEVERITY.WARN, "repetition.niche_batch",
      `${sameNicheInBatch} videos in this batch are "${candidate.niche}". Maximum is ${R.max_same_niche_per_day}.`));
  }
  const last10 = recent.slice(-10).filter((p) => p && p.niche === candidate.niche).length;
  if (last10 > R.max_same_niche_in_last_10) {
    out.push(finding(SEVERITY.WARN, "repetition.niche_window",
      `${last10} of the last 10 videos are "${candidate.niche}".`));
  }

  return {
    findings: out,
    scores: {
      worstTitleSimilarity: Number(worstTitle.score.toFixed(3)),
      worstTitleAgainst: worstTitle.against,
      worstDescriptionSimilarity: Number(worstDesc.score.toFixed(3)),
      combo,
      themeGap,
      audioGap,
    },
  };
}

function distanceSinceLast(recent, pred) {
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i] && pred(recent[i])) return recent.length - 1 - i;
  }
  return null;
}
