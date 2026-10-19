#!/bin/bash
# usage: mlreel.sh outname secs slug1 [slug2]
R="$HOME/mnt/Video Editing/bbmw0-technologies-ai/daily"
SRC="$R/2026-10-17/blankdiscussions/renders"
OUT="$R/2026-10-19/blankdiscussions"
name=$1; D=$2; shift 2
W=$HOME/work_$name; rm -rf $W; mkdir -p $W; i=0; list=$W/list.txt; : > $list
seg(){ img=$1; d=$2; o=$W/s$(printf %02d $i).mp4; i=$((i+1))
 ffmpeg -v error -y -loop 1 -t $d -i "$img" -vf "split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=40:6,eq=brightness=-0.35[bg];[b]scale=1080:1350[fg];[bg][fg]overlay=0:285,fade=t=in:d=0.3,fade=t=out:st=$(echo "$d-0.3"|bc):d=0.3,format=yuv420p" -r 24 -c:v libx264 -preset veryfast -crf 21 -an $o && echo "file '$o'" >> $list; }
first=1
for s in "$@"; do
  if [ $first = 1 ]; then seg "$SRC/$s-slide-01.jpg" 2.5; first=0; fi
  for n in 02 03 04 05 06 07 08 09; do seg "$SRC/$s-slide-$n.jpg" $D; done
done
last=${@: -1}
seg "$SRC/$last-slide-10.jpg" 3.5
ffmpeg -v error -y -f concat -safe 0 -i $list -f lavfi -i anullsrc=r=44100:cl=stereo -shortest -c:v copy -c:a aac -b:a 96k -movflags +faststart "$OUT/$name.mp4"
rm -rf $W; ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/$name.mp4"
