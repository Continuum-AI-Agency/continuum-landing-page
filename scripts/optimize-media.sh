#!/usr/bin/env bash
# Transcode landing-page showcase/hero videos into streamable H.264 loops + JPEG posters.
# Expects original masters in public/assets (same filenames as the clips= list).
# Delivery files live in src/assets/showcase and src/assets/hero.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IN="$ROOT/public/assets"

if [[ ! -f "$IN/Turismo.mp4" ]]; then
  echo "No masters in public/assets — delivery files already live in src/assets/showcase."
  echo "Place source MP4s back in public/assets to re-encode."
  exit 0
fi
OUT="$ROOT/src/assets/showcase"
HERO_OUT="$ROOT/src/assets/hero"
mkdir -p "$OUT" "$HERO_OUT"

# scale long-edge down, even dimensions, 24fps, no audio, moov-at-front for progressive play
transcode_clip() {
  local src="$1" dest="$2" poster="$3" duration="${4:-8}" width="${5:-480}" crf="${6:-30}" maxrate="${7:-600k}"
  ffmpeg -y -hide_banner -loglevel error -i "$src" \
    -t "$duration" -an \
    -vf "scale='min(${width}\,iw)':-2:flags=lanczos,fps=24" \
    -c:v libx264 -pix_fmt yuv420p -profile:v main -level 3.1 \
    -crf "$crf" -preset veryfast -maxrate "$maxrate" -bufsize "2M" \
    -movflags +faststart \
    "$dest"
  ffmpeg -y -hide_banner -loglevel error -ss 0.4 -i "$src" -frames:v 1 -an \
    -vf "scale='min(${width}\,iw)':-2:flags=lanczos" -q:v 8 \
    "$poster"
}

# name|source-relative-to-public/assets|max-seconds
clips=(
  "turismo|Turismo.mp4|8"
  "social|Tiene_3.mp4|8"
  "catalog-claro|claro_catalogo.mp4|8"
  "consorcio|consorcio_9-16.mp4|8"
  "influencer|dic-2-tomas-del-castillo-story_027ad7d.mp4|8"
  "product|VENTA_PRODUCTO_1-1.mp4|8"
  "real-estate|Real Estate.mp4|8"
  "speaker|SPEAKER_9-16.mp4|8"
  "kamay|Kamay_Render_Vertical.mp4|8"
  "heineken|Catalogo_Heineken.mp4|7"
  "mercado-libre|Mercado_Libre.mp4|8"
  "fashion|Tiene_4.mp4|8"
  "sports|BODEGA_GOL_PROMO_9-16.mp4|8"
  "lifestyle|Tiene_2.mp4|8"
  "sports-results|Deportes_resultados.mp4|8"
)

echo "Transcoding ${#clips[@]} showcase clips → $OUT"
for spec in "${clips[@]}"; do
  IFS='|' read -r name rel dur <<<"$spec"
  src="$IN/$rel"
  if [[ ! -f "$src" ]]; then
    echo "MISSING $src" >&2
    exit 1
  fi
  while (( $(jobs -rp | wc -l) >= 4 )); do sleep 0.2; done
  echo "  $name  ($rel)"
  transcode_clip "$src" "$OUT/$name.mp4" "$OUT/$name.jpg" "$dur" &
done
wait

echo "Transcoding hero background"
transcode_clip \
  "$ROOT/src/assets/Landing-Page.mp4" \
  "$HERO_OUT/bg.mp4" \
  "$HERO_OUT/bg.jpg" \
  5 640 34 400k

echo "Done."
du -h "$OUT"/*.mp4 "$OUT"/*.jpg "$HERO_OUT"/* | sort -h
echo -n "showcase total: "
du -sh "$OUT"
echo -n "hero total: "
du -sh "$HERO_OUT"
