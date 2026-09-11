# @blankdiscussions posting schedule: proposal, not yet live

**UPDATE 11 Sep 2026: this proposal is resolved and Option B is now live.** The owner gave a general go-ahead for autonomous daily posting on 10 Sep 2026 after reviewing `quran-94-5` and `bukhari-1-1`; both published that day (permalinks in their own `.meta.json` files). A third post, `quran-2-152`, sourced and rendered on 11 Sep, was independently re-verified against the live api.alquran.cloud endpoint and published the same day (see `daily/2026-09-11/blankdiscussions/quran-2-152.meta.json`). The scheduled task named in this proposal (`blankdiscussions-daily-posting`) is the mechanism actually running now. The rest of this file is kept as the original planning record, not as current status.

Written 10 Sep 2026. This is a proposal for how to actually run the "post several carousels a day, spaced out, quantity depends on how much good content is ready" instruction. Autopilot for this channel needs an explicit yes from the channel owner before it runs unattended, for two independent reasons: it is a brand-new account's first-ever posts, and it is religious content, so a bad automated post is worse than usual on both counts. (That yes has since been given — see the update above.)

## The two mechanisms available, and which fits better

**Option A: extend the GitHub Actions cron** (`.github/workflows/daily-shorts.yml`), the same system that already runs the three video channels once a day. To post several times a day with variable spacing, this would need either several fixed cron triggers (for example every 30 minutes) each checking "is anything due right now", or one long daily job that sleeps between posts. Fixed cron times fight against what was actually asked for, a variable count and variable spacing decided by how much verified content exists that day, and a single long-running job risks losing the rest of the day's posts if it fails partway through.

**Option B: a Cowork scheduled task**, the same mechanism already running this weekly channel-director review. A task runs once each morning, decides how many pieces of verified content are ready (bounded by how much has actually been sourced and passed the compliance gate, not a fixed number), works out a spacing plan with randomised 20 to 60 minute gaps between posts, and creates a short-lived scheduled task for each specific post time that day. Each post is its own task run with its own log, so there is a clear per-post trail rather than one opaque batch job.

**Recommendation: Option B.** The cadence itself is meant to vary day to day by judgement ("depends on you and what information you are creating properly", the owner's own words), which is a natural fit for a task that decides fresh each morning rather than a fixed cron matrix. It also keeps this brand-new, still-unproven carousel pipeline entirely separate from the daily-shorts workflow that the three video channels depend on, so a bug here cannot take down what is already working.

## What would actually happen, if approved

1. Each morning, a scheduled task checks how many Quran/Hadith posts have been sourced, built into slide props, and passed the compliance gate that day (see the two example posts already prepared in `daily/2026-09-10/blankdiscussions/` for the shape this takes).
2. It picks a posting plan for the day: how many posts (a small number, not a fixed target), and a start time plus gap for each, each gap randomised between 20 and 60 minutes as asked.
3. At each post's scheduled time, a task renders that post's slides (if not already rendered), hosts them at public URLs, and publishes via `instagram-upload-carousel-composio.mjs`.
4. Every post still goes through the existing compliance gate first. Nothing publishes that has not passed it.

## What is not yet decided, and needs the owner's answer

- **Go-ahead to enable this at all.** Nothing above runs until this is a yes.
- **A content-sourcing cadence.** Sourcing needs a real Quran verse or Hadith found, verified against a citable source, and translated where no source translation exists (see `quran-94-5.meta.json` and `bukhari-1-1.meta.json` for what that process looks like and how long it takes). That is not instant, so "how much content is ready" genuinely varies day to day rather than being a number Claude can promise in advance.
- **A first-post review step.** Given this is a brand-new account, the recommendation is that the very first few posts are shown to the owner for a look before they go live, even after autopilot is approved, the same way any new format on the existing channels gets watched before it is trusted (see `VISUAL-DIRECTION-BRIEF.md`'s repeated "render, look, then believe" rule, applied here to a first launch rather than a code change).

## Immediate blocker, unrelated to this proposal

Both `mcp__workspace__bash` and Desktop Commander were unavailable this session (bash: a Plan9 mount failure that explicitly said to stop retrying; Desktop Commander: a connection timeout), so the two example posts above are sourced and built but not yet rendered into actual images. Nothing publishes, scheduled or otherwise, until a working shell renders them and the owner has seen the result.
