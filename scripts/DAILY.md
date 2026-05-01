# Daily Shorts pipeline

This is the variation engine that lets you publish 5 different Shorts a day without ever repeating yourself, in a way that satisfies YouTube's "Mass-produced or repetitive content" policy.

## What's unique per video

Every Short the generator writes is unique across:

| Layer | Pool size |
|---|---|
| Topic (hook + punchline) | 30 seeds (extend in `scripts/data/topics.json`) |
| Theme (background + palette) | 12 |
| Font family | 5 |
| Audio bed | 6 |
| Layout variant per beat | 3 (across 6 beats = 729 layouts) |
| Eyebrow / sub / list heading / stat label / CTA copy | 4–8 each |
| Title hashtag set | 6 |
| Description intro | 6 |
| Tag pool | 8 |
| Beat durations (jittered, total stays 1200 frames) | continuous |

**A given topic only ever runs once.** History is tracked in `scripts/data/published.json`. The generator hard-stops if the library runs out — that's your signal to add more seeds.

## Daily workflow

```bash
# 1. Generate 5 unique Shorts for today
npm run gen:daily -- --count=5

# 2. Render them all
npm run render:daily -- --date=$(date +%F)

# 3. Optionally upload (PRIVATE by default)
npm run publish:daily -- --date=$(date +%F)
```

That writes to `daily/<date>/`:
- `<slug>.props.json` — Remotion render config (theme, font, audio, beats)
- `<slug>.meta.json` — YouTube metadata (title, description, tags, category, privacy)
- `render-log.txt` — output of the batch run

And to `out/`:
- `daily-<date>-<slug>.mp4` — the rendered video

## Filter by niche

```bash
npm run gen:daily -- --count=5 --niche=animals
npm run gen:daily -- --count=3 --niche=space
```

Niches in the starter library: `animals`, `food`, `space`, `biology`, `science`, `history`, `weather`, `music`, `productivity`, `tech`, `app`.

## Re-runs are deterministic

If you run `gen:daily --date=2026-05-01` twice, you get the same 5 videos. That's intentional — pick a date, pick once, never wobble.

## Promoting from private to public

Defaults are `--privacy=private`. After `publish:daily`, log into YouTube Studio, watch each video, and only switch to public the ones you're happy with. Until you build trust with the API, this is your best protection.

## Adding more topics

Edit `scripts/data/topics.json`:

```json
{ "id": "your-unique-slug", "niche": "science", "hook": "Your hook line.", "punchline": "Your payoff line." }
```

Slugs must be unique. Keep `hook` punchy (one sentence) and `punchline` tight (4–6 words). The generator handles everything else.

## Adding more copy variants

Edit `scripts/data/copy-pools.json` — add entries to `eyebrows`, `subs_intro`, `list_headings`, etc. Larger pools = more visible difference between videos. Aim to keep each pool at 8+ entries before publishing in volume.

## Monthly long-form

For the once-a-month 10–20 minute video, run `npm run render:longform` (the existing 30-min explainer composition) and customise its props for that month's theme. The repetition policy applies less harshly to long-form, but still vary the structure (chapter order, voiceover content) each month.

## Honest limits

- This script does not research YouTube trends. You bring the topics; it ensures uniqueness.
- The audio bed pool is 6 files. If you publish daily, you'll cycle through them every week. Adding more sounds to `public/sounds/` and `copy-pools.json` keeps things fresher.
- Layout variation is structural, not radical. Two videos can look "from the same family" even with different themes. That's normal for a brand. To break the pattern further, add more themes to `themes.ts` or alternate compositions (the original 9 named Shorts still work — mix them in once a week).
- The script picks PRIVATE by default. The "I'll switch them public after review" step is the safety valve. Skip it at your peril.
