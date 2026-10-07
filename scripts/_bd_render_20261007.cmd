@echo off
cd /d "C:\Users\BBMW0\OneDrive\Documents\Claude\Projects\Video Editing\bbmw0-technologies-ai"
set D=daily/2026-10-07/blankdiscussions
for %%R in (94-6 3-173) do (
  for %%N in (01 02 03 04 05 06 07 08 09 10) do (
    call npx remotion still src/compositions/registry.tsx IslamicSlide %D%/renders/quran-%%R-slide-%%N.jpg --image-format=jpeg --jpeg-quality=92 --props=%D%/quran-%%R.slide-%%N.json
  )
)
echo DONE > render7.done
