"""Le generique du film : qui a fait chaque image, sous quelle licence.

Une video de presentation montre une trentaine de photos d'oiseaux, un sonagramme et des cartes
d'abondance. Aucune n'est de nous. L'appli credite ses sources a l'ecran ; le film doit le faire
aussi, et il faut d'abord savoir ce qu'on montre.

Ce script remonte a la source de chaque image de .onetake/film/donnees.json et ecrit
.onetake/film/credits.json plus un resume lisible dans docs/VIDEO-CREDITS.md.

    .onetake/venv/Scripts/python.exe outils/onetake/credits.py
"""

import json
import pathlib
import re
import time
import urllib.parse
import urllib.request

FILM = pathlib.Path(".onetake/film")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153.0.0.0 Safari/537.36"

# Nom lisible et degre de contrainte de chaque licence rencontree.
LICENCES = {
    "cc0": ("CC0, domaine public", 0),
    "pd": ("domaine public", 0),
    "cc-by": ("CC BY, attribution", 1),
    "cc-by-sa": ("CC BY-SA, attribution et partage a l'identique", 2),
    "cc-by-nc": ("CC BY-NC, attribution, pas d'usage commercial", 2),
    "cc-by-nc-sa": ("CC BY-NC-SA, attribution, pas commercial, partage a l'identique", 3),
    "cc-by-nc-nd": ("CC BY-NC-ND, attribution, pas commercial, aucune modification", 4),
    "tous-droits": ("tous droits reserves : INUTILISABLE", 5),
}


def lis(url, essais=3):
    for i in range(essais):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.loads(r.read())
        except Exception:
            if i == essais - 1:
                return None
            time.sleep(1.5)


def normalise(code):
    """Ramene un code de licence a une des cles de LICENCES."""
    if not code:
        return "tous-droits"
    brut = code.lower()
    if "all rights" in brut or "tous droits" in brut:
        return "tous-droits"
    c = re.sub(r"^https?://creativecommons\.org/(licenses|publicdomain)/", "", brut).strip("/")
    c = re.sub(r"[/\s]*\d+\.\d+.*$", "", c)          # retire la version : « CC BY-SA 4.0 »
    c = c.replace("_", "-").replace(" ", "-").strip("-")
    if "zero" in c or "publicdomain" in c or c in ("cc0", "cc-cc0"):
        return "cc0"
    c = re.sub(r"^(cc-)+", "cc-", c)                 # « CC BY-SA » donnait cc-cc-by-sa
    if not c.startswith("cc-"):
        c = "cc-" + c
    return c if c in LICENCES else "inconnue"


_taxons = {}


def photo_inat(photo_id, sci):
    """Auteur et licence d'une photo iNaturalist.

    On refait EXACTEMENT l'appel de l'appli - taxa/autocomplete puis default_photo
    (app.js:11987) - parce que c'est cette photo-la qui est affichee, et que la reponse
    porte deja sa licence et son attribution. Chercher l'identifiant parmi les douze
    taxon_photos du taxon echouait pour huit vignettes sur vingt-neuf, et le repli les
    declarait « tous droits reserves » : une fausse alerte.
    """
    if sci not in _taxons:
        j = lis("https://api.inaturalist.org/v1/taxa/autocomplete?rank=species&per_page=1&q="
                + urllib.parse.quote(sci))
        _taxons[sci] = ((j or {}).get("results") or [{}])[0].get("default_photo") or {}
    ph = _taxons[sci]
    att = ph.get("attribution") or ""
    auteur = (re.search(r"\(c\)\s*([^,]+)", att) or [None, ""])[1] or "?"
    memes = str(ph.get("id")) == str(photo_id)
    return {
        "auteur": auteur.strip(), "licence": normalise(ph.get("license_code")),
        "source": "iNaturalist", "url": f"https://www.inaturalist.org/photos/{photo_id}",
        **({} if memes else {"note": "photo par defaut du taxon, identifiant different de "
                                     "celui servi ; attribution a confirmer"}),
    }


def photo_commons(nom_fichier):
    """Auteur et licence d'une image de Wikimedia Commons."""
    j = lis("https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo"
            "&iiprop=extmetadata&format=json&titles=File:" + urllib.parse.quote(nom_fichier))
    pages = ((j or {}).get("query") or {}).get("pages") or {}
    for p in pages.values():
        meta = ((p.get("imageinfo") or [{}])[0].get("extmetadata") or {})
        auteur = re.sub(r"<[^>]+>", "", (meta.get("Artist") or {}).get("value", "") or "?")
        lic = (meta.get("LicenseShortName") or {}).get("value", "")
        return {"auteur": auteur.strip()[:60] or "?", "licence": normalise(lic),
                "source": "Wikimedia Commons",
                "url": "https://commons.wikimedia.org/wiki/File:" + nom_fichier}
    return {"auteur": "?", "licence": "tous-droits", "source": "Wikimedia Commons", "url": ""}


def origine(url, sci):
    if "inaturalist" in url:
        m = re.search(r"/photos/(\d+)/", url)
        return photo_inat(m.group(1), sci) if m else None
    if "wikimedia.org" in url:
        # thumb.wikimedia.org/.../<hash>/<Nom.jpg>/320px-<Nom.jpg> ; upload : .../<Nom.jpg>
        parts = urllib.parse.unquote(url.split("?")[0]).split("/")
        nom = parts[-2] if "/thumb/" in url else parts[-1]
        return photo_commons(nom)
    return None


def main():
    d = json.loads((FILM / "donnees.json").read_text(encoding="utf-8"))
    credits = {"images": [], "son": None, "cartes": [], "fonds": []}

    print("photo de la fiche :")
    p = origine(d["fiche"]["photo"], d["espece"])
    p["role"] = "la photo de l'hirondelle, montree en grand"
    credits["images"].append(p)
    print(f"  {p['auteur']}  ·  {LICENCES.get(p['licence'], (p['licence'],9))[0]}")

    print(f"\nvignettes du mur ({sum(1 for c in d['mur']['cartes'] if c.get('fichier'))}) :")
    for c in d["mur"]["cartes"]:
        if not c.get("fichier"):
            continue
        p = origine(c["img"], c["sci"])
        if not p:
            continue
        p["role"] = f"vignette du Birdydex · {c['nom'] or c['sci']}"
        credits["images"].append(p)
    compte = {}
    for p in credits["images"]:
        compte[p["licence"]] = compte.get(p["licence"], 0) + 1
    for lic, n in sorted(compte.items(), key=lambda kv: -kv[1]):
        nom, rang = LICENCES.get(lic, (lic, 9))
        print(f"  {n:>3}  [{rang}] {nom}")

    ch = d.get("chant", {}).get("credit") or {}
    if ch:
        credits["son"] = {
            "role": "le chant de l'hirondelle et son sonagramme",
            "auteur": ch.get("enregistreur", "?"), "source": "xeno-canto",
            "lieu": f"{ch.get('lieu','')}, {ch.get('pays','')}".strip(", "),
            "date": ch.get("date", ""), "url": ch.get("url", ""),
            "licence": normalise(ch.get("licence")),
        }
        nom, rang = LICENCES.get(credits["son"]["licence"], (credits["son"]["licence"], 9))
        print(f"\nchant : {credits['son']['auteur']}  ·  [{rang}] {nom}")

    credits["cartes"] = [{
        "role": "les cartes de migration semaine par semaine",
        "auteur": "Cornell Lab of Ornithology", "source": "eBird Status & Trends",
        "url": "https://science.ebird.org/en/status-and-trends",
        "licence": "cc-by-nc-sa",
        "note": "Utilisation non commerciale avec attribution, comme dans l'appli.",
    }]
    credits["fonds"] = [{
        "role": "le contour des departements francais",
        "auteur": "-", "source": "data/departements-fr-simplified.json du depot",
        "licence": "pd", "note": "Domaine public, comme indique dans les credits de l'appli.",
    }]

    # Une image sous tous droits reserves, ou de licence indeterminee, ne peut pas entrer dans
    # un fichier video qu'on diffuse : l'appli la montre depuis son adresse d'origine, le film
    # en ferait une copie. On les ecarte au lieu de les subir.
    for x in credits["images"]:
        x["ecartee"] = x["licence"] in ("tous-droits", "inconnue") or "note" in x
    ecartees = [x for x in credits["images"] if x["ecartee"]]
    gardees = [x for x in credits["images"] if not x["ecartee"]]

    # La licence du film est la plus contraignante de ce qu'il contient VRAIMENT.
    pire = max(
        (LICENCES.get(x["licence"], ("?", 9))[1], x["licence"])
        for x in gardees + credits["cartes"] + ([credits["son"]] if credits["son"] else [])
    )
    credits["licence_du_film"] = pire[1]
    credits["contrainte_max"] = pire[0]
    (FILM / "credits.json").write_text(
        json.dumps(credits, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"\n{len(gardees)} image(s) gardee(s), {len(ecartees)} ecartee(s)")
    for x in ecartees:
        raison = "licence a confirmer" if "note" in x else LICENCES.get(x["licence"], ("?",))[0]
        print(f"   ecartee : {x['role']}  ({raison})")
    print(f"licence que le film doit porter : {LICENCES.get(pire[1], (pire[1],))[0]}")

    lignes = [
        "# Le generique du film de presentation",
        "",
        "Genere par `outils/onetake/credits.py`, a partir des adresses reellement servies par",
        "l'appli en mode demo. **Ne pas modifier a la main** : relancer le script.",
        "",
        f"**Le film porte donc la licence {LICENCES.get(pire[1], (pire[1],))[0]}**, parce que",
        "c'est la plus contraignante de tout ce qu'il contient. L'usage non commercial ne coute",
        "rien de plus : le skill qui fabrique le film est lui-meme en PolyForm Noncommercial.",
        "",
        "## Le son",
        "",
    ]
    if credits["son"]:
        s = credits["son"]
        lignes += [
            f"- **{s['auteur']}**, {s['lieu']}, {s['date']} - {s['url']}",
            f"  {LICENCES.get(s['licence'], (s['licence'],))[0]}",
            "",
        ]
    lignes += ["## Les images", ""]
    for x in gardees:
        lignes.append(f"- **{x['auteur']}** ({x['source']}) - {x['role']}  ")
        lignes.append(f"  {LICENCES.get(x['licence'], (x['licence'],))[0]}  ·  {x['url']}")
    lignes += ["", "## Les cartes et les fonds", ""]
    for x in credits["cartes"] + credits["fonds"]:
        lignes.append(f"- **{x['auteur']}** ({x['source']}) - {x['role']}  ")
        lignes.append(f"  {LICENCES.get(x['licence'], (x['licence'],))[0]}"
                      + (f"  ·  {x.get('url','')}" if x.get("url") else ""))
    if ecartees:
        lignes += ["", "## Ecartees du film, et pourquoi", "",
                   "L'appli les affiche depuis leur adresse d'origine, ce qui est un lien. Les",
                   "mettre dans un fichier video en ferait une copie diffusee.", ""]
        for x in ecartees:
            raison = "licence a confirmer" if "note" in x else LICENCES.get(x["licence"], ("?",))[0]
            lignes.append(f"- {x['role']} - {x['auteur']} - {raison}  ")
            lignes.append(f"  {x['url']}")
    doc = pathlib.Path("docs/VIDEO-CREDITS.md")
    doc.write_text("\n".join(lignes) + "\n", encoding="utf-8")

    # Reporter le verdict dans donnees.json : la composition ne lit que ce fichier, et elle
    # doit ignorer les vignettes ecartees SANS avoir a raisonner sur les licences.
    ecartes_urls = {x["url"] for x in ecartees}
    roles = {x["role"]: x for x in credits["images"]}
    gardees_n = 0
    for c in d["mur"]["cartes"]:
        if not c.get("fichier"):
            continue
        role = f"vignette du Birdydex · {c['nom'] or c['sci']}"
        info = roles.get(role)
        c["utilisable"] = bool(info) and not info["ecartee"]
        if info:
            c["licence"] = info["licence"]
            c["auteur"] = info["auteur"]
        if c["utilisable"]:
            gardees_n += 1
        else:
            f = FILM / "assets" / c["fichier"]
            if f.exists():
                f.unlink()
            c["fichier"] = None
    (FILM / "donnees.json").write_text(
        json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\ndonnees.json : {gardees_n} vignettes utilisables, fichiers des autres supprimes")
    print(f"{FILM / 'credits.json'}\n{doc}")


if __name__ == "__main__":
    main()
