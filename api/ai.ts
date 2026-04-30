// BBMW0 — multi-provider AI router (Vercel serverless function).
// Picks one or more LLM providers, asks each for scene props, merges.
// Providers light up automatically when their API key is set in env.
//
// Single-provider mode: { mode: "openai" | "anthropic" | "gemini" | "perplexity" | "groq" }
// Auto mode (default):  picks the first available provider in priority order.
// Consensus mode:       calls all available providers in parallel,
//                       merges the results (majority vote per field).
//
// All providers return the same shape: { text, emoji, title, subtitle,
// heading, items, quote, author, url, accent }.

export const config = { runtime: "edge" };

type Suggestion = {
  text?: string;
  emoji?: string;
  title?: string;
  subtitle?: string;
  heading?: string;
  items?: string[];
  quote?: string;
  author?: string;
  url?: string;
  accent?: string;
};

type ProviderId =
  | "openai"
  | "anthropic"
  | "gemini"
  | "perplexity"
  | "groq";

type ProviderResult = Suggestion & {
  _provider: ProviderId;
  _ok: boolean;
  _ms: number;
  _error?: string;
};

const PROVIDER_PRIORITY: ProviderId[] = [
  "anthropic",
  "openai",
  "groq",
  "gemini",
  "perplexity",
];

function envFor(p: ProviderId): string | undefined {
  // @ts-ignore — process.env access on edge runtime
  const e = (globalThis as any).process?.env ?? {};
  switch (p) {
    case "openai":
      return e.OPENAI_API_KEY;
    case "anthropic":
      return e.ANTHROPIC_API_KEY;
    case "gemini":
      return e.GOOGLE_GEMINI_API_KEY ?? e.GEMINI_API_KEY;
    case "perplexity":
      return e.PERPLEXITY_API_KEY;
    case "groq":
      return e.GROQ_API_KEY;
  }
}

function availableProviders(): ProviderId[] {
  return PROVIDER_PRIORITY.filter((p) => !!envFor(p));
}

const SYSTEM_PROMPT = `You are BBMW0, a video scene assistant. Given a creator's prompt and a scene type, return a JSON object that fills the scene.

Always respond with ONLY a JSON object (no prose, no markdown), with a subset of these fields:
- text (string): the main hook/headline (max 60 chars)
- emoji (string): a single emoji that matches the topic
- title (string): main title (max 60 chars)
- subtitle (string): subtitle (max 80 chars)
- heading (string): bullet-list heading (max 40 chars)
- items (string[3]): exactly 3 bullets, each max 40 chars
- quote (string): a quotable line (max 100 chars)
- author (string): attribution
- url (string): a URL if relevant
- accent (string): a hex color like "#7c5cff" that matches the vibe

Match the language of the prompt. Be punchy. Do not use markdown.`;

function userPrompt(prompt: string, sceneId: string) {
  const fields: Record<string, string> = {
    Hook: "text, emoji, accent",
    Title: "title, subtitle, accent",
    Bullets: "heading, items (exactly 3), accent",
    Quote: "quote, author, accent",
    CTA: "title, url, accent",
  };
  return `Scene type: ${sceneId}\nFields needed: ${fields[sceneId] ?? "all"}\nUser prompt: ${prompt}`;
}

// ============== Providers ==============

async function callOpenAI(
  prompt: string,
  sceneId: string,
  key: string,
): Promise<Suggestion> {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt(prompt, sceneId) },
      ],
      temperature: 0.7,
      max_tokens: 400,
    }),
  });
  if (!r.ok) throw new Error(`openai ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const content = j.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content);
}

async function callAnthropic(
  prompt: string,
  sceneId: string,
  key: string,
): Promise<Suggestion> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: userPrompt(prompt, sceneId) },
      ],
    }),
  });
  if (!r.ok) throw new Error(`anthropic ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const text: string = j.content?.[0]?.text ?? "{}";
  // Strip code fences if any
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  return JSON.parse(cleaned);
}

async function callGemini(
  prompt: string,
  sceneId: string,
  key: string,
): Promise<Suggestion> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        { role: "user", parts: [{ text: userPrompt(prompt, sceneId) }] },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 400,
      },
    }),
  });
  if (!r.ok) throw new Error(`gemini ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const text: string =
    j.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return JSON.parse(text);
}

async function callPerplexity(
  prompt: string,
  sceneId: string,
  key: string,
): Promise<Suggestion> {
  const r = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt(prompt, sceneId) },
      ],
      temperature: 0.7,
      max_tokens: 400,
    }),
  });
  if (!r.ok) throw new Error(`perplexity ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const text = j.choices?.[0]?.message?.content ?? "{}";
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  return JSON.parse(cleaned);
}

async function callGroq(
  prompt: string,
  sceneId: string,
  key: string,
): Promise<Suggestion> {
  // Groq hosts Llama models with an OpenAI-compatible endpoint.
  const r = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt(prompt, sceneId) },
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    },
  );
  if (!r.ok) throw new Error(`groq ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const content = j.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content);
}

const PROVIDERS: Record<
  ProviderId,
  (p: string, s: string, k: string) => Promise<Suggestion>
> = {
  openai: callOpenAI,
  anthropic: callAnthropic,
  gemini: callGemini,
  perplexity: callPerplexity,
  groq: callGroq,
};

async function callOne(
  id: ProviderId,
  prompt: string,
  sceneId: string,
): Promise<ProviderResult> {
  const key = envFor(id);
  if (!key) {
    return {
      _provider: id,
      _ok: false,
      _ms: 0,
      _error: "no api key",
    };
  }
  const t0 = Date.now();
  try {
    const result = await PROVIDERS[id](prompt, sceneId, key);
    return { ...result, _provider: id, _ok: true, _ms: Date.now() - t0 };
  } catch (e) {
    return {
      _provider: id,
      _ok: false,
      _ms: Date.now() - t0,
      _error: (e as Error).message?.slice(0, 200) ?? "error",
    };
  }
}

// Merge multiple results: pick the most common non-empty value per field.
// Falls back to first available if no consensus.
function consensusMerge(results: ProviderResult[]): Suggestion {
  const ok = results.filter((r) => r._ok);
  if (ok.length === 0) return {};
  if (ok.length === 1) return stripMeta(ok[0]);

  const out: Suggestion = {};
  const fields: (keyof Suggestion)[] = [
    "text",
    "emoji",
    "title",
    "subtitle",
    "heading",
    "quote",
    "author",
    "url",
    "accent",
  ];
  for (const f of fields) {
    const vals = ok
      .map((r) => r[f])
      .filter((v): v is string => typeof v === "string" && v.length > 0);
    if (vals.length === 0) continue;
    out[f] = mostCommon(vals) as any;
  }
  // items: take the first non-empty array
  const items = ok.find((r) => Array.isArray(r.items) && r.items.length > 0);
  if (items?.items) out.items = items.items;
  return out;
}

function mostCommon(arr: string[]): string {
  const counts = new Map<string, number>();
  for (const v of arr) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = arr[0];
  let max = 0;
  for (const [k, n] of counts) if (n > max) (max = n), (best = k);
  return best;
}

function stripMeta(r: ProviderResult): Suggestion {
  const { _provider, _ok, _ms, _error, ...rest } = r;
  void _provider;
  void _ok;
  void _ms;
  void _error;
  return rest;
}

// ============== Handler ==============

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }
  if (req.method === "GET") {
    // Status check — which providers are available
    return Response.json(
      {
        available: availableProviders(),
        providers: PROVIDER_PRIORITY,
      },
      { headers: corsHeaders() },
    );
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "invalid JSON body" },
      { status: 400, headers: corsHeaders() },
    );
  }

  const prompt: string = (body.prompt ?? "").toString().slice(0, 1000);
  const sceneId: string = (body.sceneId ?? "Hook").toString();
  const mode: string = (body.mode ?? "auto").toString();

  if (!prompt) {
    return Response.json(
      { error: "prompt is required" },
      { status: 400, headers: corsHeaders() },
    );
  }

  const available = availableProviders();
  if (available.length === 0) {
    return Response.json(
      {
        error: "no providers configured",
        hint:
          "Set at least one of OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_GEMINI_API_KEY, PERPLEXITY_API_KEY, GROQ_API_KEY in your Vercel environment.",
      },
      { status: 503, headers: corsHeaders() },
    );
  }

  if (mode === "consensus") {
    const results = await Promise.all(
      available.map((p) => callOne(p, prompt, sceneId)),
    );
    return Response.json(
      { suggestion: consensusMerge(results), trace: results, mode: "consensus" },
      { headers: corsHeaders() },
    );
  }

  // Pick a single provider — either the requested one or the highest-priority available
  let pick: ProviderId;
  if ((PROVIDER_PRIORITY as string[]).includes(mode)) {
    pick = mode as ProviderId;
    if (!available.includes(pick)) {
      return Response.json(
        { error: `provider '${mode}' has no key configured` },
        { status: 400, headers: corsHeaders() },
      );
    }
  } else {
    pick = available[0];
  }

  const result = await callOne(pick, prompt, sceneId);
  if (!result._ok) {
    return Response.json(
      { error: `provider '${pick}' failed`, detail: result._error },
      { status: 502, headers: corsHeaders() },
    );
  }
  return Response.json(
    {
      suggestion: stripMeta(result),
      mode: pick,
      ms: result._ms,
    },
    { headers: corsHeaders() },
  );
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
