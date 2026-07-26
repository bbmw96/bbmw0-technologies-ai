# Compliance engine

Nothing reaches YouTube without clearing this gate. It exists to keep the
channel on the right side of YouTube policy, copyright law and the house style,
without a human reviewing every video by hand.

## Why it exists

A daily automated channel has one existential risk: YouTube's
**Mass-produced or repetitive content** policy. That policy is judged on how
similar your videos are *to each other*, not on whether each one is fine in
isolation. A channel can publish 100 individually-acceptable videos and still be
demonetised because they are all the same template. The repetition layer is the
main defence.

The second-largest real risk is **audio**. Background music triggers Content ID
claims far more often than anything else, and a claim strips monetisation
immediately. See `scripts/data/audio-licences.json`.

## Three layers

| Layer | File | What it does | Can it be wrong? |
|---|---|---|---|
| 1. Rules | `rules.mjs` | Objective, offline checks: field limits, house style, hard-banned terms, keyword stuffing, misleading metadata, COPPA, audio licence records | No. Same input, same verdict, every time |
| 2. Repetition | `similarity.mjs` | Trigram and token similarity against the last 200 videos and the current batch, plus theme/font/audio reuse and niche concentration | Thresholds are a judgement call, tune in policy |
| 3. AI panel | `ai-panel.mjs` | Four reviewers on four different providers: factual accuracy, safety, legal, misleading metadata. Majority must pass | Yes, which is why it is a majority vote and only one of three layers |

Layers 1 and 2 never call the network. The gate degrades to those two if
`AI_ENDPOINT` is unset, and says so loudly rather than pretending it ran.

## Running it

```bash
npm run compliance -- --date=2026-07-26      # review a batch
npm run compliance:strict -- --date=...      # treat every warning as a block
node scripts/compliance-gate.mjs --date=... --json
```

Exit codes: `0` all clear, `1` at least one video blocked, `2` the gate could
not run. A `2` must never be read as approval.

## Outputs

- `daily/<date>/compliance-verdict.json` - which slugs may upload. `render-batch.mjs` reads this and refuses to upload anything on the blocked list.
- `scripts/data/compliance-log.json` - append-only audit trail. **Keep this.** It is the evidence record if a policy decision is ever appealed.

## Tuning

Everything tunable lives in `scripts/data/compliance-policy.json`. Do not put
thresholds in code.

The two most consequential settings:

- `repetition.max_title_similarity` (0.55). Lower is stricter. Below about 0.40 you will start blocking legitimately different videos that share a sentence shape.
- `enforcement.strict_mode` (false). Turning this on promotes every warning to a block. Useful after a policy warning from YouTube, too aggressive for normal running.

## Kid-safety is deliberately two-tier

`hard_banned` blocks outright. `context_sensitive` only warns, because words
like *blood*, *venom*, *virus* and *war* appear constantly in legitimate nature,
science and history facts. An early flat wordlist blocked "Jellyfish have no
brain, heart, or blood", which is textbook biology. Context-sensitive hits are
referred to the AI safety reviewer, which can read the sentence.

## Honest limits

- The gate reads **text and metadata**, not rendered pixels. It cannot see a visual layout problem, a contrast failure or a font that renders illegibly.
- The AI panel is advisory. Models are wrong sometimes, in both directions.
- It cannot verify audio licences for you. It can only check whether you have recorded one. An entry saying `CC0` that is actually wrong is worse than `UNKNOWN`.
- Passing this gate is not legal advice and is not a guarantee against a strike. It materially reduces risk. It does not eliminate it.
