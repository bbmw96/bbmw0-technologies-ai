# Sound files for the themed Shorts

Drop these MP3 files into this folder. If a file is missing, Remotion just
renders the video silently for that Short. Nothing breaks.

| File                | Used by              | What to find                 |
|---------------------|----------------------|------------------------------|
| `drums-1.mp3`       | Consensus (Sunset)   | Steady, warm tribal-ish loop |
| `drums-2.mp3`       | PhoneInstall (Mid)   | Slow, deep, electronic kick  |
| `drums-3.mp3`       | Languages (Ocean)    | Soft, watery percussion      |
| `drums-4.mp3`       | Presets (Sandstorm)  | Earthy, hand-drum (djembe)   |
| `rain.mp3`          | OpenSource (Forest)  | Calm rain ambience           |
| `thunder.mp3`       | MobileFirst (Neon)   | Distant rolling thunder      |
| `wind.mp3`          | (spare)              | Soft wind layer              |

## Where to get royalty-free audio

All free for commercial use, no attribution required (or check each):

- **Pixabay Music** — https://pixabay.com/music/
  Search "drum loop", "tribal drums", "djembe", "rain", "thunder", "wind".
- **YouTube Audio Library** — https://www.youtube.com/audiolibrary
  Sign in, filter by "drums" or weather. Download as MP3.
- **Mixkit** — https://mixkit.co/free-stock-music/
  Mood and genre filters. MP3 downloads.
- **Freesound.org** — https://freesound.org/  *(check licence per file)*
  Massive archive. Filter to "Creative Commons 0" for no attribution.

## Volume notes

Each Short already sets `audioVolume` to between 0.35 and 0.45 inside the
composition file. The drums won't be loud against any voiceover or screen
narration. If you want them quieter or louder, edit the value in
`src/compositions/themedShorts.tsx`.

## Length

Loops shorter than 40 seconds will play once and then go silent. Pick loops
that are at least 40 seconds, or pick something that loops cleanly (most
royalty-free drum tracks loop seamlessly).
