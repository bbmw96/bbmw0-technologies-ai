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

Not done: this is not composited into a reel, not resized or cropped to
sit behind the actual beat text, and not checked for legibility with type
over it. It exists to answer one question, what does real imagery look
like for this project, not to ship as-is.
