"""Les materiaux du film : les vraies captures, pretes a etre animees.

Le film n'est plus une reconstruction. Chaque plan est une capture du site, et la camera s'y
deplace. Ce script range ces captures dans le dossier de fabrication, en JPEG - une capture
PNG de 3840x2160 pese 2 Mo, le rendu en ouvre neuf a la fois.

Les 52 semaines de migration sont fabriquees a part, par migration-frames.py.

    .onetake/venv/Scripts/python.exe tools/onetake/assets-film.py
"""

import json
import pathlib
import shutil
import subprocess

REFS = pathlib.Path(".onetake/refs")
ASSETS = pathlib.Path(".onetake/film/assets")
REPERES = pathlib.Path(".onetake/reperes.json")

# prise de reference -> nom dans le film
PLANS = {
    "1b-mur-huppe.png": "mur.jpg",
    "2-fiche-libre.png": "fiche.jpg",
    "2d-fiche-carte-france.png": "carte-fr.jpg",
    "2c-fiche-carte-libre.png": "carte-gironde.jpg",
    "2b-fiche-sons-libre.png": "sons.jpg",
    "4-carte-rarete.png": "rarete.jpg",
    "5-classement.png": "classement.jpg",
    "6b-quiz-question.png": "quiz.jpg",
    "7-chat.png": "chat.jpg",
}


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    manquants = [s for s in PLANS if not (REFS / s).exists()]
    if manquants:
        print("prises manquantes : " + ", ".join(manquants))
        return 1

    total = 0
    for source, nom in PLANS.items():
        cible = ASSETS / nom
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(REFS / source),
                        "-q:v", "3", str(cible)], check=True)
        ko = cible.stat().st_size // 1024
        total += ko
        print(f"  {nom:<20} {ko:>5} Ko")

    logo = pathlib.Path("assets/logos/huppe.png")
    if logo.exists():
        shutil.copy2(logo, ASSETS / "huppe.png")
        print(f"  huppe.png            {(ASSETS / 'huppe.png').stat().st_size // 1024:>5} Ko")

    mig = ASSETS / "mig"
    n_mig = len(list(mig.glob("*.jpg"))) if mig.exists() else 0
    ko_mig = sum(f.stat().st_size for f in mig.glob("*.jpg")) // 1024 if n_mig else 0
    print(f"  mig/                 {ko_mig:>5} Ko  ({n_mig} semaines)")
    if n_mig < 52:
        print("  ATTENTION : lancer migration-frames.py, il manque des semaines")

    if not REPERES.exists():
        print("ATTENTION : .onetake/reperes.json absent, lancer reperes.py")
    else:
        r = json.loads(REPERES.read_text(encoding="utf-8"))
        print(f"\nreperes : " + ", ".join(sorted(r)))
    print(f"\n{total + ko_mig} Ko de materiaux dans {ASSETS}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
