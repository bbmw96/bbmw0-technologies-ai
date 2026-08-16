# NEXT SESSION — DO THIS FIRST, BEFORE ANYTHING ELSE

Not "attempt". Do it, finish it, and look at the result. The user has asked
for this across several sessions and it has been deferred every time. Deferring
again is the wrong answer.

**THE BUG (found 15 Aug, not yet fixed):** the palettes in topics-rich.json are
already near-black and high-contrast — `bg: #0B0B0F`, `ink: #F5F5F0`,
`accent: #FF3D2E`. But published videos render as pale pink and lilac blur.
**Something in the composition's background layer stack is overriding a palette
that was correct all along.** Suspect the grain (feTurbulence) and the 3-plane
Drift added in commit 5c00a1a — likely an opacity, a blend mode, or a gradient
fill using the wrong colour token.

This is a BUG, not a taste problem. Do not redesign anything until it is found.

### The sequence — all four steps, no stopping early

1. **Read the whole of `src/compositions/EditorialReel.tsx`.** All of it. It is
   large; budget for that. The cause is in there.
2. **Fix the override.** The rendered background must actually be `p.bg`.
3. **RENDER IT:**
   `npx remotion render src/compositions/registry.tsx Reel --props=daily/reels/<id>.props.json out/test.mp4`
4. **WATCH IT.** Extract frames and Read them, or use the `/watch` skill on the
   local file. Do not judge it from code. Do not report it fixed without
   having looked at the output.

Every failure in this project came from skipping step 4. The audio was
"mastered" without listening — it was static. Runs were reported "success"
while the videos looked identical to the ones the user had rejected. A green
workflow is not a good video.

### Only then

- Per-topic generated palettes (kill the fixed list)
- Image layer in the composition (`<Img>` + legible type treatment over photo)
- Background library on **Nano Banana 2 Lite at 1K** — 40 credits bought
  exactly ONE 2K Nano Banana Pro image, so premium/2K is not viable at volume
- The loop and the first-5s pattern interrupt (see research below)
- Re-check the voice by LISTENING to it

### Asset already generated

Archival macro, relay panel, 1536x2752, for `first-bug-real`:
https://cdn.openart.ai/openart-ai/production/2026-08/create-image/XghmTUIGkCRVgZpurHgl/image_1786860432525_c86d91e0_1786860433206_5bdabfcb.png

---

# Visual direction — research brief

**Written** 15 Aug 2026, at the end of a long session, deliberately as a brief
rather than a half-done answer. The research below has NOT been done. Do it
properly in a fresh session with full context; a shallow version of this is
worse than none.

---

## What was asked

> "A combination of all — some videos with no words, some with words, mix it,
> and create your own unique animations and look. Do your own comprehensive
> deep online and YouTube and video research."

## What is already known, and should not be re-litigated

**The reference video was watched.** `youtube.com/shorts/gCf_yCmpcEI` — "ASMR
cooking 🥘 🌿 #anime" by Candy Starr. 75s, 360x640, AV1. Studio Ghibli-style
animated cooking: hand-painted-looking food, warm window light, steam over a
pan, a wooden spoon stirring. **Zero text on screen.** Transcript is `[music]`
and "Oh my". It is AI-generated anime ASMR.

So the reference and the current product share nothing:

| | Current reels | The reference |
|---|---|---|
| Carries the message | Typography | Imagery |
| Text on screen | Everything | None |
| Cost per video | £0 (CSS + SVG) | Generated imagery, every time |
| What holds a thumb | The fact | The picture |

The user's answer to that tension is the brief above: **do both, mixed.** Some
videos wordless and image-led, some typographic, and a house style that ties
them together.

## The constraint that decides everything

Image-led video costs money per video. Current balances:

- Artlist: **2 free image generations, 1 free video generation.** Exhausted
  beyond that without a subscription.
- `FAIL_AI_VIDEO_CREATION` — a repo secret added 11 Aug, **still unwired
  because the provider was never identified.** Reads like FAL_AI. If it is a
  real image/video generation service with credits, it is the missing piece
  and changes what is affordable. ASK BEFORE BUILDING AGAINST IT.

At six videos a week, anything with a per-video generation cost has to be
budgeted, not assumed. A background reused across several reels is a different
economic proposition from one generated per video — prefer the former.

## Research findings — round one (15 Aug 2026)

Done, cited, and they change the brief. **Do not go fully wordless.**

- **On-screen text during the hook is worth +18% watch time.** Removing words
  from the opening costs retention rather than buying it.
- **50-60% of all drop-off happens in the first three seconds.** Everything
  else is decided there. Beat 1 is the entire product.
- **A pattern interrupt within the first 5s adds +23% retention** versus a
  static opening. Our reels currently open on a card that simply staggers in.
- Benchmarks to beat: **>80% still watching at 3s, >60% at the midpoint,
  >70% average percentage viewed.**
- **Loop structure is specifically strong for faceless video** — with no face
  on screen there is no cue that a new scene has started, so a jump from the
  last frame back to the first is invisible and the replay counts as watch
  time.
- Faceless stock-footage-plus-voiceover channels still hit 80-90% completion
  when the first frame is high-contrast and carries a surprise.
- Hooks should state one clear promise in present tense with active verbs.

Sources:
- https://virvid.ai/blog/first-3-seconds-hook-faceless-shorts-2026
- https://virvid.ai/blog/looping-structure-shorts-retention-2026
- https://virvid.ai/blog/faceless-youtube-algorithm-retention-2026
- https://humbleandbrag.com/blog/youtube-shorts-benchmarks

### What this means for the mix

The amendment to "some with words, some without": **the hook always has
words.** Imagery may carry the middle and the payoff. A wordless opening
forfeits both the 18% and the thing that stops the thumb.

### The highest-value change, and it is free

**Make the reel loop.** The sign beat currently ends and stops dead. If the
last beat resolves into the first — same palette, same composition, the CTA
dissolving as the opening line arrives — the video replays without the viewer
noticing. Costs nothing, needs no credits, is a real house signature rather
than a borrowed one, and makes the channel's videos recognisable as a set.

Second free change: **give beat 1 a pattern interrupt.** A hard cut, a colour
flip, a scale snap — something in the first 5s that is not a gentle stagger.

## GENERATION IS NOW UNBLOCKED (15 Aug 2026, late)

Three routes supplied by the user. This changes the brief from "design against
the free half" to "image-led is affordable — spend it well."

**1. OpenArt MCP — LIVE, 40 credits, Free plan.** Already connected and
callable this session (`openart_generate_image`, `openart_generate_video`,
`openart_model_list`, `openart_model_cost`). Check `openart_model_cost` before
generating; 40 credits is a handful of images, not a season's worth.

**2. Vyro AI (api.vyro.ai) — REST, needs the key wiring in.** Very likely what
`FAIL_AI_VIDEO_CREATION` was for. Confirm before assuming.

    POST https://api.vyro.ai/v2/image/generations
      Authorization: Bearer {API_KEY}      (multipart/form-data)
      prompt, style=realistic, aspect_ratio=1:1, seed

    POST https://api.vyro.ai/v2/video/text-to-video
      style=kling-1.0-pro, prompt

    POST https://api.vyro.ai/v2/video/image-to-video
      style=kling-1.0-pro, prompt, file=@<image>

Note `aspect_ratio` must be set to a vertical ratio for reels, not the 1:1 in
the sample. Image-to-video (Kling) is the interesting one: generate one still,
animate it, and get motion without paying the text-to-video rate.

**3. Alibaba DashScope wan3.0-video — async REST.**

    POST https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/
         video-generation/video-synthesis
      X-DashScope-Async: enable
      Authorization: Bearer $DASHSCOPE_API_KEY
      model=wan3.0-video
      input.prompt
      parameters: resolution=480P, ratio=adaptive, duration=5

Async — returns a task id, must be polled. Same shape as the Instagram
transcode poll already in instagram-upload-composio.mjs; reuse that pattern
rather than inventing a new one. 480P is below our 1080x1920 target, so check
whether a higher resolution is available on the plan before committing.

### Spend it on the right thing

40 credits will not cover 6 videos a week. Do NOT wire generation into the
per-video path. Generate a small library of **reusable backgrounds** — a
dozen good ones, seeded and varied — and have the composition pick and treat
them. That converts a per-video cost into a one-off cost, which is the only
version of this that survives contact with the schedule.

### Budget reality, as of tonight

The Higgsfield-style generation MCP reports `credits: 0`, plan `free`.
Artlist has 2 image / 1 video generation left. **There is currently no funded
route to generated imagery.** Until `FAIL_AI_VIDEO_CREATION` is identified,
design only against the free half — motion, type, colour, texture, and the
loop. That is where the retention wins listed above live anyway.

## The research still to do

1. **Watch 8-12 successful Shorts in the adjacent space** with the `/watch`
   skill, which is now installed and working. Not one — a spread. Faceless
   fact channels, ASMR/ambient channels, typographic explainer channels.
   Note per video: hook in the first 1.5s, cut rhythm, whether text or image
   leads, how the end card asks for the follow.
2. **Find what the wordless ones do instead of text.** A wordless video still
   needs a hook and a payoff. Identify the mechanism.
3. **Establish what is repeatable at zero marginal cost.** Motion, texture,
   type treatment and colour are free and unlimited. Generated imagery is not.
   The house style must live mostly in the free half or it cannot run weekly.
4. **Design the mix rule.** Which topics earn a wordless treatment and which
   need words? A first guess to test, not to assume: topics whose payoff is a
   *number* or a *quote* need type; topics whose payoff is a *scene* or a
   *process* may be better wordless.
5. **Then design the look** — and render it, watch it, and iterate. Not a
   contact sheet. The whole failure mode of this project has been judging
   motion from stills.

## Rules that carry over

- Text is not the enemy; **undifferentiated text** is. The old ThemedShort
  failed because twelve videos differed only in hue.
- Nothing invented. A wordless video cannot assert a false fact, but it can
  imply one. The same standard applies.
- Whatever is designed must survive the CTA: every video ends with
  "Subscribe for more." / "Follow for more." That is structural, in the
  composition, not per-topic.
- Silence over hiss. Beds were removed for good reason — see topics-rich.json.
  Do not reintroduce audio without listening to it.

## Where this sits against everything else

This is a *quality* project. It is not the binding constraint. Those are, in
order:

1. ~82 published videos still assert randomly-generated statistics. Unlist them.
2. The topic library — 9 verified topics against 6 videos a week.
3. This.

A beautiful format with nothing true to say, or with false numbers still live
behind it, is worth less than a plain one that is honest and consistent.
