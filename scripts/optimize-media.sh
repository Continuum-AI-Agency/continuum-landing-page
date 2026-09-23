#!/usr/bin/env bash
# Transcode showcase videos into streamable H.264 loops + JPEG posters in src/assets/showcase.
# Masters are never committed: they live in media/ (gitignored) or wherever MASTERS points,
# e.g. `MASTERS=~/Downloads bun run optimize:media`. A clip whose master is missing but whose
# output already exists is kept as-is. Older masters can be restored from git history
# (commit 7fa0bd4, public/assets/).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IN="${MASTERS:-$ROOT/media}"
OUT="$ROOT/src/assets/showcase"
mkdir -p "$OUT"

# scale width down, even dimensions, 24fps, no audio, moov-at-front for progressive play.
# Boomerang: the clip plays forward then in reverse, so the loop never jumps back to the start.
# The poster is taken `poster_at` seconds into the clip so it shows the settled layout, not an intro.
transcode_clip() {
  local src="$1" dest="$2" poster="$3" duration="$4" start="$5" poster_at="$6" width=480 crf=30 maxrate=600k
  ffmpeg -y -hide_banner -loglevel error -ss "$start" -t "$duration" -i "$src" -an \
    -filter_complex "[0:v]scale='min(${width}\,iw)':-2:flags=lanczos,fps=24,split[f][b];[b]reverse,trim=start_frame=1[r];[f][r]concat=n=2:v=1[v]" \
    -map "[v]" \
    -c:v libx264 -pix_fmt yuv420p -profile:v main -level 3.1 \
    -crf "$crf" -preset veryfast -maxrate "$maxrate" -bufsize "2M" \
    -movflags +faststart \
    "$dest"
  ffmpeg -y -hide_banner -loglevel error -ss "$start" -i "$src" -ss "$poster_at" -frames:v 1 -an \
    -vf "scale='min(${width}\,iw)':-2:flags=lanczos" -q:v 8 \
    "$poster"
}

# name|master filename|seconds|start (default 0)|poster time within the clip (default 1.5)
# Adding a clip: add a line here, run the script, then add the name to CLIPS in MasonryGrid.astro.
clips=(
  "privalia-hoco|Promo_30_off_AUDIFONOS_TWINS_BLUETOOTH_FACIL_EMPAREJAMIENTO_HOCO_usvd5fr.mp4|7"
  "tecate-cruz-azul|0_CAZ_VS_CAZ_4_5_mrofvc7.mp4|8|5|5"
  "kamay-coca-cola|Sponsor_9-16_Coca-Cola_Founding_Partner_oj1cim6.mp4|8|0|3"
  "privalia-calvin-klein|Calvin_Klein_10_Calvin_Klein_HOTSALE_no3fryd.mp4|8|0|3"
  "bembos-seaside|Boats_ratio_1200x628_jrwbcyt (1).mp4|8"
  "papa-johns|PAPA_JOHN_left_revTEXT_1440x1440_oxd6w6u.mp4|8"
  "dominos|WhatsApp Video 2025-09-30 at 18.18.27 (1).mp4|8|0|5"
  "mcdonalds-mccombo|WhatsApp Video 2025-09-30 at 17.39.31 (1).mp4|8|2"
  "bembos-andes|mountains_ratio_1440x1440_a79kelv.mp4|8"
  "caliente|Caliente_Previa_CardA_A08_JuanPabloII-v-CDMoquegua_25s.mp4|8"
  "vivo-day-pass|Vivo-47_DayPass_motiontext_1-1_eblhp8s.mp4|8"
  "mcdonalds-arg-fra|0_ARG_VS_FRA_1_1_73bzjro.mp4|8|5|5"
  "kamay|Kamay_Render_Vertical.mp4|8"
  "heineken|Catalogo_Heineken.mp4|7"
  "mercado-libre|Mercado_Libre.mp4|8"
  "catalog-claro|claro_catalogo.mp4|8"
  "influencer|dic-2-tomas-del-castillo-story_027ad7d.mp4|8"
  "consorcio|consorcio_9-16.mp4|8"
  "social|Tiene_3.mp4|8"
)

echo "Transcoding showcase clips from $IN → $OUT"
for spec in "${clips[@]}"; do
  IFS='|' read -r name rel dur start poster_at <<<"$spec"
  src="$IN/$rel"
  if [[ ! -f "$src" ]]; then
    if [[ -f "$OUT/$name.mp4" && -f "$OUT/$name.jpg" ]]; then
      echo "  $name  (kept, no master)"
      continue
    fi
    echo "MISSING $src" >&2
    exit 1
  fi
  while (( $(jobs -rp | wc -l) >= 4 )); do sleep 0.2; done
  echo "  $name  ($rel)"
  transcode_clip "$src" "$OUT/$name.mp4" "$OUT/$name.jpg" "$dur" "${start:-0}" "${poster_at:-1.5}" &
done
wait

du -h "$OUT"/*.mp4 | sort -h
echo -n "showcase total: "
du -sh "$OUT"
