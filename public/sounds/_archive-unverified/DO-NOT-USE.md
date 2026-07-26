# Archived: unverified provenance

These six files were in `public/sounds/` and were used in published videos, but
no record existed of where they came from or what licence they carry. The
repository README describes where to *find* royalty-free audio; it records
nothing about these specific files, and the filenames do not match its table.

Background music is the most common trigger of YouTube Content ID claims, and a
claim strips monetisation immediately.

They have been moved here rather than deleted, because you may hold licences for
them. To bring one back into use:

1. Find the original download page and confirm the licence permits commercial
   use on YouTube.
2. Save the licence page as a PDF next to the file.
3. Add an entry to `scripts/data/audio-licences.json` with the exact `source_url`,
   the `licence`, and your name in `verified_by`.
4. Move the file back to `public/sounds/` and add it to `copy-pools.json`.

If you cannot establish where a file came from, do not guess. An entry claiming
"CC0" that turns out to be wrong is worse than an honest UNKNOWN, because it
looks like a deliberate misrepresentation rather than an oversight.

The replacement beds in `public/sounds/bbmw0-*.mp3` are synthesised from scratch
by `scripts/audio/generate-beds.sh` and carry no third-party rights at all.
