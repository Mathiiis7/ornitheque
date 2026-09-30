"""Preparer la photo de l'espece pour le cadre 16/9 de la fiche, sans couper l'oiseau.

L'appli affiche la photo de fiche en `aspect-ratio:16/9` avec `object-fit:cover`
(styles.css:1021) : une photo verticale y perd la moitie de sa hauteur, et l'oiseau est coupe.
La huppe retenue le 2026-09-30 - Shantanu Kuveskar, Wikimedia Commons, CC BY - fait 750x1000,
donc tout en hauteur.

On fabrique donc une image 16/9 qui contient l'oiseau ENTIER : la photo agrandie et floutee
sert de fond, la photo entiere se pose au centre. Recadrer et modifier est permis par CC BY, a
condition de crediter - ce que fait docs/VIDEO-CREDITS.md.

    .onetake/venv/Scripts/python.exe tools/onetake/photo-fiche.py upupa-epops-commons 5
"""

import json
import pathlib
import subprocess
import sys

CANDIDATS = pathlib.Path(".onetake/candidats")
CHOISIS = pathlib.Path(".onetake/portraits-choisis.json")
SORTIE = pathlib.Path(".onetake/remplacantes")
LARGEUR, HAUTEUR = 1920, 1080


def main():
    dossier = sys.argv[1] if len(sys.argv) > 1 else "upupa-epops-commons"
    rang = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    sci = dossier.replace("-commons", "").replace("-planche", "").replace("-", " ")

    liste = json.loads((CANDIDATS / dossier / "candidats.json").read_text(encoding="utf-8"))
    c = dict(liste[rang])
    source = pathlib.Path(c["fichier"])
    SORTIE.mkdir(parents=True, exist_ok=True)
    cible = SORTIE / (sci.replace(" ", "-") + "-fiche.jpg")

    subprocess.run([
        "ffmpeg", "-v", "error", "-y", "-i", str(source), "-filter_complex",
        f"[0:v]scale={LARGEUR}:{HAUTEUR}:force_original_aspect_ratio=increase,"
        f"crop={LARGEUR}:{HAUTEUR},gblur=sigma=40,eq=brightness=-0.06[fond];"
        f"[0:v]scale=-2:{HAUTEUR}[oiseau];[fond][oiseau]overlay=(W-w)/2:0",
        "-q:v", "2", str(cible)], check=True)

    dims = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=width,height",
         "-of", "csv=p=0", str(cible)], capture_output=True, text=True).stdout.strip()
    print(f"{cible}  ({dims})  depuis {source.name} ({c['auteur']}, {c['licence']})")

    c["fichier"] = str(cible)
    c["pourquoi"] = ("photo verticale posee entiere dans un cadre 16/9, son propre flou en "
                     "fond : le cadre de la fiche coupe sinon l'oiseau")
    choisis = json.loads(CHOISIS.read_text(encoding="utf-8")) if CHOISIS.exists() else {}
    choisis[sci] = c
    CHOISIS.write_text(json.dumps(choisis, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{CHOISIS} : {sci} enregistree")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
