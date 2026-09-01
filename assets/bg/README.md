# assets/bg

Reusable background imagery for reels. Referenced but never populated in
`scripts/data/VISUAL-DIRECTION-BRIEF.md` since 15 Aug 2026, blocked on
generation budget.

## mantis-shrimp-colour-demo.*

Added 1 Sep 2026. A proof-of-concept, not wired into the generation
pipeline. Built for the unpublished topic `mantis-shrimp-colour`
(`scripts/data/topics-rich.json`, niche: animals, channel: yt-bbm0902) to
show what real imagery looks like next to that topic's actual palette and
beats, as a direct answer to feedback that the reels do not compete with
real Shorts or Reels content.

- `mantis-shrimp-colour-demo.png`: Flux 2.0 Pro, 9:16, 2K (1152x2048).
- `mantis-shrimp-colour-demo.mp4`: Kling 2.5 Turbo Pro, image-to-video from
  the PNG above, 9:16, 1080p, 5s, ambient motion only (eye movement,
  drifting particulate, light shimmer, no strike).
- `mantis-shrimp-colour-demo-preview-frame.png`: a frame pulled from the
  mp4 at 2.5s with ffmpeg, kept so the motion result can be checked
  without opening a video player.

Both generations used Artlist's one-time free allocation (2 free images, 1
free video, both now used, does not renew). Exact prompts are in the
generate_image / generate_video calls in the session that made these; not
duplicated here to avoid drift if this file is copied elsewhere.

## mantis-shrimp-colour-demo-preview-with-text-and-sound.*

Added 1 Sep 2026, same session, after feedback on the first cut: check
legibility with real beat text over it, and that a silent clip is not a
finished asset. Composited with ffmpeg, no further AI generation spent.

- Video: `mantis-shrimp-colour-demo.mp4` with the topic's actual first
  beat drawn over it (lead "The internet's favourite animal fact", text
  "It is not what you were told.", DejaVu Sans Bold standing in for the
  real reel typeface, positioned in the top third left clear in the
  original image prompt for exactly this) and
  `public/sounds/bbmw0-ocean-swell.mp3` mixed in under it, looped to the
  clip's 5s. That track is in `scripts/data/audio-licences.json` as Owned
  Original, ffmpeg-synthesised noise, no Content ID exposure, so this
  used no generation budget and no new licensing question.
- `mantis-shrimp-colour-demo-preview-with-text-and-sound-frame.png`: a
  frame pulled at 1.5s for the same no-video-player reason as above.

Worth recording since it very nearly shipped wrong: the first attempt at
this composite had a broken drawtext filter, an unescaped apostrophe
leaked raw filter syntax onto the frame, and an unescaped `\n` glued two
words into "whatnyou". Caught by extracting and actually looking at a
frame before saying anything, not by assuming ffmpeg exiting 0 meant the
output was correct. Rebuilt using `textfile=` instead of inline `text=`
for both lines, which avoids that whole class of shell-escaping failure.

Feedback not yet addressed: the eye-stalk swivel motion in the .mp4 reads
as a little uncanny on review. Fixing it means a new image-to-video
generation with that motion prompted out, which needs paid credits now
that the free allocation is spent (the same Kling 2.5 Turbo Pro call was
quoted at 750 credits before the free allocation zeroed it out). Not
spent without asking first.

Not done: none of this is resized, cropped, or timed against the
composition's real beat pacing (`EditorialReel.tsx`), and it is not wired
into `generate-reels.mjs`. It exists to answer what real imagery, real
type, and real audio look like together for this project, not to ship
as-is.
