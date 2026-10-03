"""Remplace la photo de la huppe par une photo HORIZONTALE, posee telle quelle.

Reproche du 2026-10-01 : la photo verticale, letterboxee par photo-fiche.py, ne remplissait ni le
cadre 16/9 de la fiche (deux bandes floues sur les cotes) ni le carre de la vignette. Une photo
deja horizontale, avec l'oiseau au centre, remplit les deux sans rien fabriquer.

Choisie sur la planche des candidates horizontales : numero 13, Tareq Uddin Ahmed, Wikimedia
Commons, CC BY - la huppe crete dressee, de profil, au centre. Telechargee en 1920 px (le
fichier de la liste n'en fait que 960, agrandi 1,35 fois dans la fiche a deux pixels par point).

    .onetake/venv/Scripts/python.exe outils/onetake/photo-horizontale.py
"""

import json
import pathlib
import shutil
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import substituts as S  # noqa: E402

CAND = pathlib.Path(".onetake/candidats/upupa-epops-commons/candidats.json")
CHOISIS = pathlib.Path(".onetake/portraits-choisis.json")
SORTIE = pathlib.Path(".onetake/remplacantes/upupa-epops-fiche.jpg")
RANG = 13


def main():
    c = dict(json.loads(CAND.read_text(encoding="utf-8"))[RANG])
    url = c["url"].replace("/960px-", "/1920px-")
    if SORTIE.exists():
        ancienne = SORTIE.with_name("upupa-epops-fiche-verticale.jpg")
        if not ancienne.exists():
            shutil.copy2(SORTIE, ancienne)
        SORTIE.unlink()
    if not S._telecharge(url, SORTIE):
        print("DEFAUT : telechargement en 1920 px impossible")
        return 1
    c["url"] = url
    c["fichier"] = str(SORTIE)
    c["pourquoi"] = ("photo horizontale, oiseau au centre : remplit le cadre 16/9 de la fiche "
                     "et le carre de la vignette sans bandes floues")
    choisis = json.loads(CHOISIS.read_text(encoding="utf-8"))
    choisis["upupa epops"] = c
    CHOISIS.write_text(json.dumps(choisis, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{SORTIE}  {SORTIE.stat().st_size // 1024} Ko  ({c['auteur']}, {c['licence']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
