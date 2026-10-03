"""Sous quelle licence sont les materiaux du film, et lesquels sont utilisables sans contrainte.

Une video de presentation se diffuse : un enregistrement en « partage a l'identique » obligerait
le film entier a la meme licence, et un « pas d'utilisation commerciale » l'enferme au portfolio.
Ce script liste ce qui est disponible pour l'hirondelle et classe par contrainte croissante.

    .onetake/venv/Scripts/python.exe outils/onetake/licences.py
"""

import json
import urllib.parse
import urllib.request

XC_KEY = "a082ff6c2adafb02ea6b275da67cd903988f82ea"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153.0.0.0 Safari/537.36"
SCI = "hirundo rustica"


def lis(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.loads(r.read())


def etiquette(lic):
    """Nomme la contrainte en clair, et la classe : 0 = libre, 3 = la plus enfermante."""
    u = (lic or "").lower()
    if "publicdomain" in u or "zero" in u:
        return 0, "domaine public (CC0)"
    if "by-nc-sa" in u:
        return 3, "attribution + pas commercial + partage a l'identique"
    if "by-nc-nd" in u:
        return 3, "attribution + pas commercial + pas de derive"
    if "by-nc" in u:
        return 2, "attribution + pas commercial"
    if "by-sa" in u:
        return 2, "attribution + partage a l'identique"
    if "by-nd" in u:
        return 2, "attribution + pas de derive"
    if "by" in u:
        return 1, "attribution seule"
    return 3, "licence inconnue : " + (lic or "(vide)")


def chants():
    gen, sp = SCI.split()
    q = urllib.parse.quote(f"gen:{gen} sp:{sp} type:song q:A")
    recs = lis(f"https://xeno-canto.org/api/3/recordings?query={q}&key={XC_KEY}").get(
        "recordings", []
    )
    lignes = []
    for r in recs:
        if not r.get("file") or not (r.get("sono") or {}).get("large"):
            continue
        rang, txt = etiquette(r.get("lic"))
        lignes.append((rang, r["id"], r.get("rec", ""), r.get("cnt", ""), r.get("length", ""), txt))
    lignes.sort(key=lambda l: (l[0], -int(l[1])))
    print(f"CHANTS de l'hirondelle, qualite A, avec sonagramme  ({len(lignes)} au total)")
    vus = set()
    for rang, ident, rec, cnt, lg, txt in lignes:
        if txt in vus and rang > 0:
            continue
        vus.add(txt)
        print(f"  [{rang}] n° {ident}  {rec[:22]:<23} {cnt[:12]:<13} {lg:>5}  {txt}")
    libres = [l for l in lignes if l[0] <= 1]
    print(f"  -> {len(libres)} enregistrement(s) sans contrainte lourde (rang 0 ou 1)")
    if libres:
        rang, ident, rec, cnt, lg, txt = libres[0]
        print(f"  -> le plus recent : n° {ident}, par {rec}, {txt}")
    return libres


def photo(obs_id):
    """La licence d'une photo iNaturalist, depuis son identifiant d'observation."""
    j = lis(f"https://api.inaturalist.org/v1/observations/{obs_id}")
    r = (j.get("results") or [{}])[0]
    for p in r.get("photos", []):
        rang, txt = etiquette(p.get("license_code") and
                              f"https://creativecommons.org/licenses/{p['license_code']}/4.0/")
        print(f"  [{rang}] photo {p.get('id')}  {p.get('license_code') or '(tous droits reserves)'}"
              f"  ·  {txt}")
        print(f"       auteur : {(r.get('user') or {}).get('login', '?')}"
              f"  ·  {r.get('uri', '')}")


if __name__ == "__main__":
    chants()
    print()
    donnees = json.loads(open(".onetake/film/donnees.json", encoding="utf-8").read())
    url = donnees["fiche"]["photo"] or ""
    print(f"PHOTO de la fiche : {url[:78]}")
    print("  iNaturalist sert ses images depuis un identifiant de PHOTO, pas d'observation :")
    print("  la licence se lit sur la page de l'observation. Adresse relevee ci-dessus.")
