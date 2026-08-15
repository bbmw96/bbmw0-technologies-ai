# Writing a rich topic

The pipeline can already make a good video. It has three subjects it has been
given enough real material to make one about. That is the whole bottleneck.

At three videos a week per channel, two channels, you need about **26 verified
topics to cover a quarter**. There are 3.

---

## The bar

A topic earns a video when you can say **four to six true, specific things**
about it that a stranger would not already know. Not four sentences — four
*facts*. If you have two, it is a good comment, not a video.

The test: could someone contradict you? "Records are sparse" cannot be wrong,
which is how you know it is filler. "Relay #70, Panel F, 15:45" can be wrong,
which is why it is worth putting on screen.

## The shape

Six beat kinds. Use the ones the subject actually supports.

| kind | carries | needs |
|---|---|---|
| `code` | a literal sequence | only if the subject *is* a sequence |
| `statement` | the claim + a note that complicates it | `text`, optional `lead`, `note` |
| `credit` | a named person or thing, dated | `year`, `name`, `role` |
| `figure` | one number, set enormous | `value`, `unit`, `context` |
| `kicker` | the turn, one line, no support | `text` |
| `sign` | the close and the handle | `line`, `handle` |

A four-beat reel of real facts beats a six-beat reel with two invented ones.
`generate-reels.mjs` computes the runtime from the content, so a shorter topic
simply makes a shorter video. That is correct, not a failure.

## The figure beat rule

A `figure` renders its value at 300px. That is an enormous claim to make.

Being true is **not sufficient**. The moth topic briefly carried `70` — the
relay number, real and sourced, and it was cut. A relay number is an address,
not a fact; setting it that large implies a significance it does not have.

Ask: *does this number deserve to be the biggest thing on the screen?* If it is
only there because the beat exists, delete the beat.

This is the same instinct that produced the old `Mind the number.` beat, just
better disguised. Watch for it in your own drafts.

## Sourcing

`verified: true` means **you read the sources**, not that the claim sounded
right. Each entry in `sources` should be a URL followed by ` — ` and what that
source actually established, so the next person can check your work without
re-reading everything.

Prefer primary. The Smithsonian's catalogue entry beats a listicle about it.

**Write down what you deliberately did not say.** The moth topic does not name
Grace Hopper: she was on the team and made the story famous later, but the log
book was probably not hers and the attribution is contested. That decision
lives in `verifiedNote`, because otherwise someone will "helpfully" add her
back in.

Popular versions of famous stories are usually wrong in a specific way. Finding
that way is often the best beat in the video — the moth reel opens on "bug"
being a century older than the incident, which is the correction, not the myth.

## The workflow

1. Add the topic to `topics-rich.json` with `verified: false` and a
   `reviewNote` naming what you need to confirm. A draft is not a mistake; it
   turns checking into a small job instead of a blank page.
2. Research. Fill `sources`. Correct the beats to match what you actually
   found, rather than bending the sources to fit the draft.
3. Set `verified: true`.
4. `npm run gen:reel -- --id=<id>` then render and watch it.

Until step 3, the generator refuses it. `--allow-unverified` renders a draft
locally and stamps `_DRAFT` into the props so it cannot be published by
accident.

## Niches

`yt-bbmw0` — tech, app, productivity, science, history
`ig-aigameodyssey` — gaming, ai, tech, app
`yt-bbm0902` — animals, space, biology, food, weather — **off hold since
15 Aug 2026**, when the first four topics in its niches landed (animals, space,
food, weather). `biology` still has none. It is the channel that starves
first, so weight new research here until it has a backlog.

A topic only reaches a channel whose niches include it, so check the niche
before writing, or you will research something with nowhere to go.

## Where the ideas come from

`topics.json` has 123 thin topics and about 78 unused. Most are a hook and a
punchline about a subject that could support a real video. Treat it as a
shortlist to research, not as content.

Note the id collision is deliberate and handled: rich usage is tracked as
`reel:<id>`, so a subject already published as a padded Short can still be
covered properly as a Reel.
