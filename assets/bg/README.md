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

## Eyes removed, 1 Sep 2026, same session

User: "I do not want to have any eye shapes or eyes shown on any face."
A standing rule, not a one-off edit, and not fixable by regenerating
since the free allocation is spent anyway. Fixed for free instead: found
a crop (`crop=664:1180:208:740` on the 1080x1920 video, the equivalent
scaled region on the 2K still) that holds across the whole 5s clip
despite its slow camera drift, confirmed by checking frames at 0.05s,
2.5s and 4.95s, not just one point. Reframes as a claw and shell macro
shot rather than a creature portrait; no eyes, no face, in any frame.
Applied to `mantis-shrimp-colour-demo.png` and `.mp4` in place, then the
text+audio composite was rebuilt from the newly cropped video with the
text moved from top to bottom (the crop removed the top-third negative
space the original prompt had reserved for it), reverified the same way
as the first build: frame extraction plus an audio volumedetect pass,
not just a clean exit code.

**Found while doing this, not before, which is the real problem**:
`scripts/data/compliance-policy.json`, `halal.forbid_animate_imagery`,
was already `true`, with its own note reading "Videos are pure typography
today, so this guards the future. Any image or video asset entering a
composition is blocked pending review, since it may depict humans or
animals." That rule predated this session. Cropping out the eyes did
not satisfy it: a mantis shrimp with its eyes out of frame is still
animate imagery, a real animal, under that rule's own definition. This
demo should have been checked against `compliance-policy.json` before
generating anything, the same file `compliance-gate.mjs` already reads
for every other rule in this project, and was not. Raised directly with
the user rather than either quietly shipping past a rule marked as the
channel owner's explicit instruction, or quietly rewriting that rule
myself on their behalf.

## Resolved, 1 Sep 2026, same session

The channel owner's answer: real imagery of animals is allowed,
specifically when eyes and faces are excluded from every frame; real
imagery of people was not part of that approval and stays blocked.
`compliance-policy.json`'s `halal.forbid_animate_imagery` is now the
structured `halal.animate_imagery`, and it is enforced, not just
documented: every asset in this folder now has an entry in
`scripts/data/animate-imagery-review.json`, and `compliance-gate.mjs`
blocks anything not recorded there as cleared. See that registry file
and the "RESOLVED" entry at the top of `VISUAL-DIRECTION-BRIEF.md` for
the full mechanism, including a matching bug the verification test
caught and fixed before this shipped: a loose substring match nearly let
the rejected eyed original resolve to its cleared cropped sibling's
record.

Both `mantis-shrimp-colour-demo.png`/`.mp4` and every file derived from
them (the two preview frames and the text-and-sound composite) are
recorded cleared in the registry. The original eyed generations, kept on
disk only as `*.old-with-eyes` for provenance and not git-tracked, are
recorded there too, explicitly not cleared, so they cannot be mistaken
for usable assets later.

Not done: none of this is resized, cropped, or timed against the
composition's real beat pacing (`EditorialReel.tsx`), and it is not wired
into `generate-reels.mjs`. It exists to answer what real imagery, real
type, and real audio look like together for this project, not to ship
as-is. The `forbid_animate_imagery` question above is resolved as of 1
Sep 2026; what is still open is actually integrating real imagery into
`generate-reels.mjs`, which has not been attempted.
