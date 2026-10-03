"""Les morceaux d'ecran que le film pose tels quels, decoupes dans les prises de reference.

Trois ecrans n'ont aucune image de tiers et peuvent donc entrer dans le film sans autre
verification : le classement, le quiz et le chat. La carte de rarete en contient - les tuiles
OpenStreetMap - mais elles sont libres a condition de citer leurs auteurs, et la decoupe garde
volontairement la mention en bas a droite.

Le mur du Birdydex, lui, N'EST PAS decoupe : sa capture contient des photos sous tous droits
reserves (voir docs/VIDEO-CREDITS.md). Il est reconstruit dans la composition a partir des
seules vignettes autorisees.

    .onetake/venv/Scripts/python.exe outils/onetake/decoupes.py
"""

import json
import pathlib

from PIL import Image

REFS = pathlib.Path(".onetake/refs")
FILM = pathlib.Path(".onetake/film")
ASSETS = FILM / "assets"
DPR = 2  # les prises sont faites a deux pixels par point


def decoupe(prise, cadre, nom, marge=0):
    """Decoupe un rectangle donne en pixels CSS dans une prise faite a deux pixels par point."""
    im = Image.open(REFS / prise)
    x, y, w, h = [v * DPR for v in cadre]
    x, y = max(0, x - marge), max(0, y - marge)
    w, h = min(im.width - x, w + 2 * marge), min(im.height - y, h + 2 * marge)
    out = im.crop((x, y, x + w, y + h))
    dest = ASSETS / nom
    out.save(dest)
    print(f"  {nom}  {out.width}x{out.height}  {dest.stat().st_size // 1024} Ko")
    return [out.width, out.height]


def panneau(prise, nom):
    """Decoupe le panneau central : la carte blanche, sans l'entete ni le bandeau du bas."""
    im = Image.open(REFS / prise)
    # Le panneau occupe la largeur utile de la page. Releve sur les prises du 2026-09-30 :
    # il commence a 330 px CSS et court jusqu'a 1590, sous la barre d'onglets (135 px) et
    # AU-DESSUS du bandeau de demonstration, mesure a 54 px CSS de haut : on coupe a 1018.
    # Le bandeau ne va pas dans le film - c'est un element du mode demo, pas de l'appli - et
    # l'avertissement « ligue et listes inventees » est repris sur la carte de fin.
    cadre = (330 * DPR, 135 * DPR, 1590 * DPR, 1018 * DPR)
    out = im.crop(cadre)
    dest = ASSETS / nom
    out.save(dest)
    print(f"  {nom}  {out.width}x{out.height}  {dest.stat().st_size // 1024} Ko")
    return [out.width, out.height]


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    d = json.loads((FILM / "donnees.json").read_text(encoding="utf-8"))
    tailles = {}

    print("decoupes :")
    # La carte de rarete, exactement sur son cadre : les 1 349 points sont notes en
    # coordonnees relatives a CE rectangle, donc les deux se superposent sans calcul.
    tailles["carte"] = decoupe("4-carte-rarete.png", d["rarete"]["cadre"], "carte-rarete.png")
    tailles["classement"] = panneau("5-classement.png", "classement.png")
    tailles["quiz"] = panneau("6b-quiz-question.png", "quiz.png")
    tailles["chat"] = panneau("7-chat.png", "chat.png")

    d["decoupes"] = tailles
    (FILM / "donnees.json").write_text(
        json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n{FILM / 'donnees.json'} mis a jour")


if __name__ == "__main__":
    main()
