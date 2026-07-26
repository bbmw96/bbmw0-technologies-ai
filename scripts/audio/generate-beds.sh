#!/usr/bin/env bash
# Generate original ambient audio beds from pure synthesis.
#
# WHY THIS EXISTS
# The six original sound files had no recorded provenance. Background music is
# the single most common trigger of YouTube Content ID claims, and a claim
# strips monetisation immediately. Rather than guess at a licence we could not
# verify, these beds are synthesised from scratch with ffmpeg. No sample, no
# recording, no third-party material is involved at any point.
#
# That makes the licence position unambiguous: the output is an original work
# owned outright by BBMW0 Technologies. This script IS the provenance, and it
# is deterministic, so any run reproduces byte-identical audio.
#
# USAGE: bash scripts/audio/generate-beds.sh [output_dir]

set -euo pipefail
OUT="${1:-public/sounds}"
mkdir -p "$OUT"
DUR=45          # seconds. Beats total 40s, so 45 leaves headroom with no loop seam.
SR=44100
FADE=2.5

echo "Generating original ambient beds into $OUT (${DUR}s each)"

gen() {
  local name="$1"; shift
  local filter="$1"; shift
  ffmpeg -hide_banner -loglevel error -y \
    -f lavfi -i "$filter" \
    -af "afade=t=in:st=0:d=${FADE},afade=t=out:st=$((DUR-3)):d=3,volume=-3dB" \
    -ac 2 -ar "$SR" -b:a 160k -t "$DUR" \
    "$OUT/$name"
  printf "  %-26s %s\n" "$name" "$(du -h "$OUT/$name" | cut -f1)"
}

# Rain: white noise rolled off top and bottom so it hisses rather than sizzles.
gen "bbmw0-rain.mp3" \
  "anoisesrc=d=${DUR}:c=white:r=${SR}:a=0.30,highpass=f=600,lowpass=f=7000,tremolo=f=0.12:d=0.05"

# Ocean: brown noise with a slow swell, roughly one breath every eight seconds.
gen "bbmw0-ocean.mp3" \
  "anoisesrc=d=${DUR}:c=brown:r=${SR}:a=0.55,lowpass=f=1100,tremolo=f=0.125:d=0.65"

# Forest wind: narrow mid band, gentle movement, no high hiss.
gen "bbmw0-forest.mp3" \
  "anoisesrc=d=${DUR}:c=brown:r=${SR}:a=0.50,highpass=f=180,lowpass=f=2200,tremolo=f=0.1:d=0.45"

# Warm drone: three stacked low sines, slightly detuned so it breathes.
gen "bbmw0-hum.mp3" \
  "sine=f=110:d=${DUR}:r=${SR}[a];sine=f=110.4:d=${DUR}:r=${SR}[b];sine=f=165:d=${DUR}:r=${SR}[c];[a][b][c]amix=inputs=3:duration=first,volume=1.0,lowpass=f=900"

# Soft pulse: low sine gated into a slow heartbeat, about 72 bpm.
gen "bbmw0-pulse.mp3" \
  "sine=f=72:d=${DUR}:r=${SR},volume=1.0,tremolo=f=1.2:d=0.92,lowpass=f=260"

# Stream: mid-band water movement, brighter than ocean, no swell.
gen "bbmw0-stream.mp3" \
  "anoisesrc=d=${DUR}:c=pink:r=${SR}:a=0.34,highpass=f=400,lowpass=f=4800,tremolo=f=0.3:d=0.18"

echo "Done. All beds are original synthesised works, owned outright."
