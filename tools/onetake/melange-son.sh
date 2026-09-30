#!/bin/sh
# Melange la bande son du film : les bruitages fabriques par partition.py,
# la nappe et le vent dans les feuilles (les deux en CC0).
#
# Sonies relevees le 2026-09-30 avant dosage : bruitages -21,6 LUFS,
# nappe -15,1, feuilles -37,1. Les deux fonds passent par loudnorm - un simple
# gain ne va pas : un enregistrement de vent a des cretes tres hautes pour une
# sonie tres basse, et remonter les feuilles de +4 dB amenait leurs rafales a
# -2,9 dBFS. Pas d alimiter non plus : son option level remonte le niveau toute
# seule, le premier melange est ressorti a -0,4 dBFS au lieu d etre limite.
#
# Resultat attendu : -24,4 LUFS, crete -6,5 dBFS, aucun ecretage, et le fond
# n ajoute que 0,7 a 1 dB la ou le chant d hirondelle et les bruitages parlent.
#
#   sh tools/onetake/melange-son.sh [video-entree] [video-sortie]
#
# Sans argument, il ne fabrique que le WAV .onetake/film/son-musique.wav.
set -e
cd "$(dirname "$0")/../.."

SON=.onetake/film/son.wav
NAPPE=.onetake/musique/nappe-bartmann.mp3
FEUILLES=.onetake/musique/feuilles-borgory.mp3
SORTIE=.onetake/film/son-musique.wav

for f in "$SON" "$NAPPE" "$FEUILLES"; do
  if [ ! -f "$f" ]; then
    echo "manque : $f  (voir docs/VIDEO-PRESENTATION.md, section La musique et le fond de foret)" >&2
    exit 1
  fi
done

# Fenetre de 30 s prise a 40 s dans la nappe et a 15 s dans les feuilles :
# on evite l introduction du morceau et le demarrage de l enregistrement.
ffmpeg -v error -y \
  -i "$SON" \
  -ss 40 -t 30 -i "$NAPPE" \
  -ss 15 -t 30 -i "$FEUILLES" \
  -filter_complex "\
[1:a]loudnorm=I=-24:TP=-9:LRA=7,volume=-6dB,afade=t=in:st=0:d=2,afade=t=out:st=27:d=3,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[nappe];\
[2:a]loudnorm=I=-24:TP=-9:LRA=7,volume=-15dB,afade=t=in:st=0:d=1.5,afade=t=out:st=27:d=3,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[feuilles];\
[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[sfx];\
[sfx][nappe][feuilles]amix=inputs=3:duration=first:normalize=0[out]" \
  -map "[out]" -c:a pcm_s16le "$SORTIE"

echo "ecrit $SORTIE"
ffmpeg -hide_banner -nostats -i "$SORTIE" -filter_complex ebur128=peak=true -f null - 2>&1 \
  | grep -A3 -E "Integrated loudness|True peak" | grep -E "I: |Peak: "

# La sonie du melange est plus basse que celle des bruitages seuls, et c est
# normal : la mesure EBU R128 ecarte les passages trop faibles, et un fond
# continu fait entrer dans le calcul tous les silences qui en etaient exclus.

if [ -n "$1" ] && [ -n "$2" ]; then
  ffmpeg -v error -y -i "$1" -i "$SORTIE" \
    -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "$2"
  echo "ecrit $2"
  ffprobe -v error -count_frames -select_streams v:0 \
    -show_entries stream=nb_read_frames,duration -of default=nw=1 "$2"
fi
