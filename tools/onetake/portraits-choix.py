"""Le portrait retenu pour chacune des quinze vignettes remplacees que le film montre.

Choix fait en regardant les planches de portraits-planches.py, le 2026-09-30. Le critere est
celui d'une vignette de Birdydex : l'oiseau entier ou sa tete, net, en pleine lumiere, dans
son milieu, et surtout RECONNAISSABLE - le trait qui nomme l'espece doit etre visible (le
collier de la tourterelle turque, le tubercule du cygne, la huppe du fuligule morillon).

Ce que les planches ont appris, et qui vaut pour la suite :
- le choix automatique par votes ne marche pas. iNaturalist recompense la photo remarquable :
  il proposait un canard domestique huppe pour le colvert, un troupeau de plusieurs milliers
  d'oiseaux pour la nette rousse, une oie cendree bec ouvert face camera, un martinet pose sur
  la couverture d'un centre de soins ;
- Wikimedia Commons montre surtout des oiseaux sauvages, mais ses categories contiennent
  n'importe quoi : une hirondelle rustique et deux graphiques dans celle du martinet noir, une
  page de texte scannee dans les candidats du meme, des cartes de repartition ailleurs ;
- et l'inverse arrive : la macreuse noire n'a sur Commons que du lointain en noir et blanc.

    .onetake/venv/Scripts/python.exe tools/onetake/portraits-choix.py
"""

import json
import pathlib

INDEX = pathlib.Path(".onetake/planches-index.json")
SORTIE = pathlib.Path(".onetake/portraits-choisis.json")

# espece -> (rang dans la planche, ce qui a decide)
CHOIX = {
    "anas platyrhynchos": (4, "male et femelle nets sur l'eau, tete verte franche"),
    "cygnus olor": (1, "tete de pres : le tubercule noir du bec, qui nomme l'espece"),
    # Le gros plan de tete (rang 0) ecrasait ses voisines une fois recadre en carre :
    # sur un mur, toutes les vignettes doivent etre a la meme distance de l'oiseau.
    "branta canadensis": (2, "oiseau entier au bord de l'eau, a la distance des voisines"),
    # Le male detoure sur fond blanc (rang 1) faisait un trou clair dans le mur.
    "mareca strepera": (4, "couple sur l'eau bleue, dans son milieu comme les voisines"),
    "aythya fuligula": (5, "couple sur l'eau, huppe du male visible"),
    "anas crecca": (3, "male de profil : bandeau vert sur tete marron"),
    "netta rufina": (4, "male de pres, huppe orange et bec rouge"),
    "anser anser": (3, "oiseau entier debout, bec orange, plumage detaille"),
    "branta bernicla": (0, "quatre oiseaux en vol sur ciel clair, silhouette nette"),
    "melanitta nigra": (5, "male de pres sur l'eau, bosse orange du bec visible"),
    "tachybaptus ruficollis": (4, "oiseau entier sur l'eau, joue marron"),
    "columba palumbus": (0, "oiseau entier, tache blanche du cou visible"),
    "streptopelia decaocto": (5, "collier noir bien visible sur la nuque"),
    "streptopelia turtur": (4, "sur une branche, motif des ailes et du cou lisible"),
    "apus apus": (2, "en vol, ailes en faux - c'est ainsi qu'on le voit toujours"),
}


def main():
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    choisis, defauts = {}, []
    for sci, (rang, pourquoi) in CHOIX.items():
        liste = index.get(sci) or []
        if rang >= len(liste):
            defauts.append(f"{sci} : rang {rang} absent ({len(liste)} candidats)")
            continue
        c = dict(liste[rang])
        c["pourquoi"] = pourquoi
        choisis[sci] = c
        print(f"  {sci:<24} {c['via']:<18} {c['licence']:<12} {c['auteur'][:32]}")
    if defauts:
        for d in defauts:
            print("DEFAUT : " + d)
        return 1
    SORTIE.write_text(json.dumps(choisis, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n{len(choisis)} portraits retenus\n{SORTIE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
