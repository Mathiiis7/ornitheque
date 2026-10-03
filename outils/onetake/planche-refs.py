"""Planche de contact des prises de reference : les neuf ecrans sur une seule image.

Sert a verifier d'un coup d'oeil que chaque prise a bien attrape son ecran, plutot que
d'ouvrir neuf fichiers de 2 Mo.

    .onetake/venv/Scripts/python.exe outils/onetake/planche-refs.py
"""

import pathlib

from PIL import Image, ImageDraw

REFS = pathlib.Path(".onetake/refs")
SORTIE = pathlib.Path(".onetake/planche-refs.png")
COLONNES = 3
LARGEUR_VIGNETTE = 620
MARGE = 14
BANDEAU = 26
FOND = (238, 242, 241)  # le fond de l'appli
ENCRE = (21, 32, 30)


def main():
    fichiers = sorted(REFS.glob("*.png"))
    if not fichiers:
        raise SystemExit("aucune prise dans .onetake/refs - lancer outils/onetake/captures.py")

    vignettes = []
    for f in fichiers:
        im = Image.open(f).convert("RGB")
        h = round(im.height * LARGEUR_VIGNETTE / im.width)
        vignettes.append((f.stem, im.resize((LARGEUR_VIGNETTE, h), Image.LANCZOS)))

    hauteur_vignette = max(v.height for _, v in vignettes)
    lignes = (len(vignettes) + COLONNES - 1) // COLONNES
    larg = COLONNES * LARGEUR_VIGNETTE + (COLONNES + 1) * MARGE
    haut = lignes * (hauteur_vignette + BANDEAU) + (lignes + 1) * MARGE

    planche = Image.new("RGB", (larg, haut), FOND)
    dessin = ImageDraw.Draw(planche)

    for i, (nom, im) in enumerate(vignettes):
        col, ligne = i % COLONNES, i // COLONNES
        x = MARGE + col * (LARGEUR_VIGNETTE + MARGE)
        y = MARGE + ligne * (hauteur_vignette + BANDEAU + MARGE)
        dessin.text((x + 2, y), nom, fill=ENCRE)
        planche.paste(im, (x, y + BANDEAU))

    planche.save(SORTIE)
    ko = SORTIE.stat().st_size // 1024
    print(f"{SORTIE}  {planche.size[0]}x{planche.size[1]}  {ko} Ko  ({len(vignettes)} prises)")


if __name__ == "__main__":
    main()
