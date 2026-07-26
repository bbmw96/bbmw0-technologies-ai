#!/usr/bin/env bash
# Generate original ambient audio beds from pure synthesis.
#
# TWO CONSTRAINTS SHAPE THIS FILE
#
# 1. Copyright. The original six beds had no recorded provenance, and background
#    music is the most common trigger of YouTube Content ID claims. Every bed
#    here is synthesised from scratch. No sample, recording or third-party
#    material is involved, so the output is an original work owned outright.
#    This script is deterministic, so it IS the provenance record.
#
# 2. Halal. Every bed is natural ambience only, generated from filtered noise.
#    There are no instruments, no tones, no melody and no beat. Amplitude
#    modulation is used only at 0.1 to 0.3 Hz to reproduce the natural swell of
#    wind and water, which is far below anything that reads as rhythm.
#
#    Two earlier beds were removed for this reason: a sustained three-tone
#    drone (effectively a chord) and a 72 bpm low pulse (effectively a drum).
#    Do not reintroduce sine, square, triangle or sawtooth sources here.
#
# USAGE: bash scripts/audio/generate-beds.sh [output_dir]

set -euo pipefail
OUT="${1:-public/sounds}"
mkdir -p "$OUT"
DUR=45          # Beats total 40s, so 45 leaves headroom with no loop seam.
SR=44100
FADE=2.5

echo "Generating original natural-ambience beds into $OUT (${DUR}s each)"

gen() {
  local name="$1"; shift
  local filter="$1"; shift
  ffmpeg -hide_banner -loglevel error -y \
    -f lavfi -i "$filter" \
    -af "afade=t=in:st=0:d=${FADE},afade=t=out:st=$((DUR-3)):d=3,volume=-3dB" \
    -ac 2 -ar "$SR" -b:a 160k -t "$DUR" \
    "$OUT/$name"
  printf "  %-28s %s\n" "$name" "$(du -h "$OUT/$name" | cut -f1)"
}

# --- Rain -------------------------------------------------------------------
# Light rain: top and bottom rolled off so it hisses rather than sizzles.
gen "bbmw0-rain-light.mp3" \
  "anoisesrc=d=${DUR}:c=white:r=${SR}:a=0.28,highpass=f=800,lowpass=f=6500,tremolo=f=0.12:d=0.05"

# Heavy rain: wider band, more body underneath.
gen "bbmw0-rain-heavy.mp3" \
  "anoisesrc=d=${DUR}:c=white:r=${SR}:a=0.42,highpass=f=300,lowpass=f=8000,tremolo=f=0.15:d=0.10"

# Distant rain: heavily muffled, as if heard through a window.
gen "bbmw0-rain-distant.mp3" \
  "anoisesrc=d=${DUR}:c=pink:r=${SR}:a=0.50,lowpass=f=1500,highpass=f=120,tremolo=f=0.1:d=0.20"

# --- Water ------------------------------------------------------------------
# Ocean swell: one long breath roughly every eight seconds.
gen "bbmw0-ocean-swell.mp3" \
  "anoisesrc=d=${DUR}:c=brown:r=${SR}:a=0.55,lowpass=f=1100,tremolo=f=0.125:d=0.65"

# Shore: shorter, brighter breaks than the open-water swell.
gen "bbmw0-ocean-shore.mp3" \
  "anoisesrc=d=${DUR}:c=brown:r=${SR}:a=0.48,highpass=f=150,lowpass=f=2400,tremolo=f=0.22:d=0.55"

# Stream: continuous mid-band flow, no swell.
gen "bbmw0-stream.mp3" \
  "anoisesrc=d=${DUR}:c=pink:r=${SR}:a=0.34,highpass=f=400,lowpass=f=4800,tremolo=f=0.3:d=0.18"

# --- Wind -------------------------------------------------------------------
# Forest wind: narrow mid band, no high hiss, gentle movement.
gen "bbmw0-forest-wind.mp3" \
  "anoisesrc=d=${DUR}:c=brown:r=${SR}:a=0.50,highpass=f=180,lowpass=f=2200,tremolo=f=0.1:d=0.45"

# Open wind: airier and higher than forest, more movement.
gen "bbmw0-wind-open.mp3" \
  "anoisesrc=d=${DUR}:c=pink:r=${SR}:a=0.38,highpass=f=350,lowpass=f=3600,tremolo=f=0.18:d=0.40"

echo "Done. Eight natural-ambience beds. No instruments, tones, melody or beat."
