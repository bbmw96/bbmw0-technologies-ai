// Independent AI reviewers for the judgement calls rules cannot make.
//
// Four reviewers, deliberately on different providers, each given ONE narrow
// question and no knowledge of the others' verdicts. Diversity is the point:
// four passes of the same model would correlate its blind spots. A majority
// must pass, per policy.ai_panel.required_pass_ratio.
//
// The panel is advisory infrastructure, not a rubber stamp. It is asked to
// answer FAIL when unsure, so ambiguity costs a held video rather than a
// policy strike.

import { SEVERITY } from "./rules.mjs";
import { collectOnScreenText } from "./rules.mjs";

const RUBRIC = {
  factual: `You are a fact-checker for a YouTube Shorts channel that publishes educational facts.
Assess ONLY whether every factual claim is accurate and current.
Reject outdated figures, disputed claims, common myths stated as fact, and numbers that cannot be verified.`,

  safety: `You are a content-safety reviewer for a YouTube Shorts channel.
The channel must remain suitable for a broad audience that includes minors.
Reject anything involving violence, death, weapons, sexual content, romance, drugs, alcohol,
gambling, politics, religion, or medical claims. Educational science and nature are fine.`,

  legal: `You are a media lawyer reviewing a short video before publication.
Assess copyright, trademark, defamation and advertising-disclosure risk.
Reject song lyrics, quoted copyrighted text, claims about identifiable living people,
implied brand endorsement, and undisclosed commercial promotion.`,

  misleading: `You are reviewing whether a video's title honestly represents its content,
under YouTube's spam and deceptive-practices policy.
Reject clickbait, exaggeration, titles promising more than the video delivers,
and metadata that does not match what appears on screen.`,
};

function finding(severity, rule, message, detail) {
  return { severity, rule, message, detail: detail ?? null };
}

function buildPrompt(reviewer, payload) {
  return `${RUBRIC[reviewer.id]}

Specific question: ${reviewer.focus}

VIDEO UNDER REVIEW
Title:       ${payload.title}
Description: ${payload.description}
Tags:        ${payload.tags.join(", ")}
On-screen text (all frames, in order):
${payload.onScreen}

Answer with STRICT JSON and nothing else:
{"verdict":"PASS"|"FAIL","confidence":0.0-1.0,"reason":"one sentence","concerns":["..."]}

Answer FAIL if you are unsure. A held video costs nothing. A policy strike costs the channel.`;
}

async function askOne(endpoint, reviewer, payload, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        mode: reviewer.provider,
        prompt: buildPrompt(reviewer, payload),
        maxTokens: 400,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.text();

    // Providers wrap JSON in prose or code fences often enough to warrant this.
    const match = raw.match(/\{[\s\S]*"verdict"[\s\S]*\}/);
    if (!match) throw new Error("no JSON verdict in response");
    const parsed = JSON.parse(match[0]);

    const verdict = String(parsed.verdict || "").toUpperCase();
    if (verdict !== "PASS" && verdict !== "FAIL") throw new Error(`bad verdict "${verdict}"`);

    return {
      reviewer: reviewer.id,
      provider: reviewer.provider,
      ok: true,
      verdict,
      confidence: Number(parsed.confidence ?? 0),
      reason: String(parsed.reason || "").slice(0, 300),
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns.slice(0, 5) : [],
      ms: Date.now() - started,
    };
  } catch (err) {
    return {
      reviewer: reviewer.id,
      provider: reviewer.provider,
      ok: false,
      verdict: null,
      error: String(err.message || err),
      ms: Date.now() - started,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function runPanel(meta, props, policy) {
  const P = policy.ai_panel;
  const endpoint = process.env.AI_ENDPOINT;

  if (!P.enabled) {
    return { available: false, skipped: "disabled in policy", findings: [], reviews: [] };
  }
  if (!endpoint) {
    const sev = P.on_unavailable === "block" ? SEVERITY.BLOCK : SEVERITY.WARN;
    return {
      available: false,
      skipped: "AI_ENDPOINT not set",
      reviews: [],
      findings: [finding(sev, "ai_panel.unavailable",
        "AI review panel did not run: AI_ENDPOINT is not configured. Only deterministic rules were applied.")],
    };
  }

  const payload = {
    title: meta.title,
    description: meta.description,
    tags: meta.tags || [],
    onScreen: collectOnScreenText(props).slice(0, 2000),
  };

  const reviews = await Promise.all(
    P.reviewers.map((r) => askOne(endpoint, r, payload, P.timeout_ms))
  );

  const usable = reviews.filter((r) => r.ok);
  const findings = [];

  if (!usable.length) {
    const sev = P.on_unavailable === "block" ? SEVERITY.BLOCK : SEVERITY.WARN;
    findings.push(finding(sev, "ai_panel.no_responses",
      `All ${reviews.length} reviewers failed to respond. Deterministic rules only.`,
      { errors: reviews.map((r) => `${r.reviewer}: ${r.error}`) }));
    return { available: false, reviews, findings };
  }

  const passes = usable.filter((r) => r.verdict === "PASS").length;
  const ratio = passes / usable.length;

  for (const r of usable) {
    if (r.verdict === "FAIL") {
      findings.push(finding(SEVERITY.INFO, `ai_panel.${r.reviewer}`,
        `${r.reviewer} reviewer (${r.provider}) returned FAIL: ${r.reason}`,
        { concerns: r.concerns, confidence: r.confidence }));
    }
  }

  if (ratio < P.required_pass_ratio) {
    findings.push(finding(SEVERITY.BLOCK, "ai_panel.majority_fail",
      `AI panel rejected this video: ${passes}/${usable.length} passed, ${(P.required_pass_ratio * 100).toFixed(0)}% required.`,
      { passes, total: usable.length, ratio: Number(ratio.toFixed(2)) }));
  }

  if (usable.length < reviews.length) {
    findings.push(finding(SEVERITY.WARN, "ai_panel.partial",
      `${reviews.length - usable.length} of ${reviews.length} reviewers failed to respond.`));
  }

  return {
    available: true,
    reviews,
    passRatio: Number(ratio.toFixed(2)),
    findings,
  };
}
