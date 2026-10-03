"""Combien de vignettes du mur du Birdydex sont interdites de video, et peut-on les remplacer ?

Le film doit montrer le VRAI mur, pas une reconstruction. Or l'appli affiche la photo « par
defaut » que lui sert iNaturalist, et celle-ci est parfois sous tous droits reserves : la
montrer dans l'appli est un lien vers son adresse, la mettre dans un fichier video en ferait
une copie diffusee.

Plutot que d'ecarter ces especes, on remplace leur photo par une AUTRE photo de la meme espece,
libre celle-la. Ce script mesure d'abord si c'est possible : il ouvre le mur comme le fait
captures.py, releve chaque vignette reellement affichee, lit sa licence, et cherche une
remplacante libre pour celles qui sont interdites.

Il n'ecrit aucune image : il dit combien d'especes sont concernees et combien sont
remplacables. La substitution elle-meme viendra apres, au moment de la prise.

Prerequis : le serveur local tourne (npx http-server . -p 8765) et la machine est en ligne.

    .onetake/venv/Scripts/python.exe outils/onetake/vignettes-libres.py
"""

import json
import pathlib
import sys
import urllib.parse

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from credits import LICENCES as _LICENCES, lis, normalise, photo_commons  # noqa: E402

# Une case sans photo n'a pas de licence : elle a un manque. On la range avec les
# interdites, parce que la reponse est la meme - lui poser une photo libre.
LICENCES = {**_LICENCES, "absente": ("aucune photo affichee (emoji de l'appli)", 5)}

URL = "http://127.0.0.1:8765/demo/"
SORTIE = pathlib.Path(".onetake/vignettes-libres.json")
LARGEUR, HAUTEUR = 1920, 1080
DEMARRAGE_MS = 8000

# Les licences qu'on peut mettre dans un fichier video diffuse. CC BY-NC-ND est exclue : elle
# interdit toute modification, et un film qui recadre et anime EST une modification.
# Les licences compatibles avec le film. CC BY-SA en est EXCLUE, et ce n'est pas une
# prudence : le chant de l'hirondelle que l'appli fait ecouter impose « pas d'usage
# commercial », or CC BY-SA interdit d'ajouter cette restriction a une oeuvre qui la reprend.
# Les deux ne peuvent pas cohabiter. CC BY-NC-ND est exclue aussi : elle interdit toute
# modification, et recadrer ou animer en est une. Constate le 2026-09-30 : 29 des 125
# vignettes du mur sont en CC BY-SA.
LIBRES = {"cc0", "pd", "cc-by", "cc-by-nc", "cc-by-nc-sa"}


def vignettes_affichees():
    """Ouvre le mur du Birdydex et releve chaque vignette REELLEMENT affichee."""
    with sync_playwright() as p:
        nav = p.chromium.launch_persistent_context(
            ".onetake/profil",
            viewport={"width": LARGEUR, "height": HAUTEUR},
            device_scale_factor=2,
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36"
            ),
        )
        page = nav.new_page()
        page.goto(URL)
        page.wait_for_timeout(DEMARRAGE_MS)
        page.evaluate(
            """() => {
                const b = [...document.querySelectorAll('button')]
                    .find(b => /Birdydex/.test(b.textContent) && b.textContent.length < 20);
                if (!b) throw new Error('onglet Birdydex absent');
                b.click();
            }"""
        )
        page.wait_for_timeout(2000)
        # Vider le filtre APRES l'ouverture : le panneau restaure sa recherche gardee.
        page.evaluate(
            """() => {
                const i = document.getElementById('pkdxSearch');
                if (i && i.value) { i.value=''; i.dispatchEvent(new Event('input',{bubbles:true})); }
            }"""
        )
        page.wait_for_timeout(1500)
        page.wait_for_function(
            """() => {
                const im = [...document.querySelectorAll('.pkdx-img img')];
                return im.length > 20 && im.filter(i => i.naturalWidth > 0).length >= 20;
            }""",
            timeout=40000,
        )
        # Les vignettes sont en chargement differe : on descend tout le mur pour les faire
        # toutes venir, sinon on ne mesure que le premier ecran.
        for _ in range(12):
            page.mouse.wheel(0, 3000)
            page.wait_for_timeout(700)
        page.wait_for_timeout(2500)
        vues = page.evaluate(
            """() => [...document.querySelectorAll('.pkdx-card')].map(c => {
                const img = c.querySelector('.pkdx-img img');
                const boite = c.querySelector('.pkdx-img');
                // Une case cochee dont la photo n'est jamais arrivee garde l'emoji de
                // l'appli. Ce n'est pas un choix : le chargeur cesse d'observer la case
                // AVANT de savoir si la requete a reussi, donc une requete ratee n'est
                // jamais rejouee. 18 cases dans ce cas le 2026-09-30, et iNaturalist a
                // pourtant une photo pour chacune. Le film leur en pose une.
                const emoji = !!(boite && !img && (boite.textContent || '').trim());
                return {
                    sci: c.dataset.sci || '',
                    nom: (c.querySelector('.pkdx-name') || {}).textContent || '',
                    src: (img && img.currentSrc) || (img && img.src) || '',
                    chargee: !!(img && img.naturalWidth > 0),
                    emoji,
                };
            })"""
        )
        nav.close()
        return [v for v in vues if (v["chargee"] and v["src"]) or v["emoji"]]


def licence_servie(v):
    """La licence de la photo REELLEMENT affichee pour cette espece."""
    if v.get("emoji"):
        return "absente", "", "aucune photo affichee"
    src = v["src"]
    if "wikimedia.org" in src:
        parts = urllib.parse.unquote(src.split("?")[0]).split("/")
        nom = parts[-2] if "/thumb/" in src else parts[-1]
        info = photo_commons(nom)
        return info["licence"], info["auteur"], "Wikimedia Commons"
    if "inaturalist" in src:
        j = lis("https://api.inaturalist.org/v1/taxa/autocomplete?rank=species&per_page=1&q="
                + urllib.parse.quote(v["sci"]))
        ph = ((j or {}).get("results") or [{}])[0].get("default_photo") or {}
        return normalise(ph.get("license_code")), ph.get("attribution", "")[:40], "iNaturalist"
    return "inconnue", "", "?"


def remplacante(sci):
    """Une autre photo de la meme espece, libre celle-la. Rend None s'il n'y en a pas.

    On regarde d'abord les photos du taxon (une seule requete, jusqu'a douze photos), puis, si
    aucune n'est libre, les observations validees qui portent une photo libre.
    """
    j = lis("https://api.inaturalist.org/v1/taxa/autocomplete?rank=species&per_page=1&q="
            + urllib.parse.quote(sci))
    res = ((j or {}).get("results") or [{}])[0]
    tid = res.get("id")
    for tp in res.get("taxon_photos") or []:
        ph = tp.get("photo") or {}
        lic = normalise(ph.get("license_code"))
        if lic in LIBRES:
            return {"licence": lic, "url": ph.get("medium_url") or ph.get("url"),
                    "auteur": (ph.get("attribution") or "")[:60], "via": "taxon_photos"}
    if not tid:
        return None
    j = lis("https://api.inaturalist.org/v1/observations?per_page=5&quality_grade=research"
            f"&order_by=votes&photos=true&taxon_id={tid}"
            "&photo_license=cc0,cc-by,cc-by-nc,cc-by-nc-sa")
    for obs in (j or {}).get("results") or []:
        for ph in obs.get("photos") or []:
            lic = normalise(ph.get("license_code"))
            if lic in LIBRES:
                return {"licence": lic, "url": ph.get("url", "").replace("square", "medium"),
                        "auteur": (ph.get("attribution") or "")[:60], "via": "observations"}
    return None


def main():
    vues = vignettes_affichees()
    print(f"{len(vues)} vignettes affichees sur le mur\n")

    interdites, libres, rapport = [], 0, []
    for v in vues:
        lic, auteur, source = licence_servie(v)
        ok = lic in LIBRES
        libres += ok
        ligne = {"sci": v["sci"], "nom": v["nom"].strip(), "licence": lic,
                 "auteur": auteur, "source": source, "libre": ok, "src": v["src"]}
        if not ok:
            interdites.append(ligne)
        rapport.append(ligne)

    print(f"  {libres} libres, {len(interdites)} a remplacer\n")
    if interdites:
        print("especes a remplacer, et ce qu'on trouve de libre chez elles :")
    remplacables = 0
    for x in interdites:
        r = remplacante(x["sci"])
        x["remplacante"] = r
        remplacables += bool(r)
        etat = (f"OK  {LICENCES.get(r['licence'], (r['licence'],))[0]}  ({r['via']})"
                if r else "AUCUNE photo libre trouvee")
        print(f"  {x['nom'] or x['sci']:<28} {LICENCES.get(x['licence'], (x['licence'],))[0][:28]:<30} -> {etat}")

    SORTIE.write_text(json.dumps(
        {"vignettes": rapport, "a_remplacer": interdites}, ensure_ascii=False, indent=1),
        encoding="utf-8")
    print(f"\n{len(vues)} vignettes · {libres} libres · {len(interdites)} a remplacer · "
          f"{remplacables} remplacables")
    if interdites and remplacables < len(interdites):
        print(f"{len(interdites) - remplacables} espece(s) sans remplacante : "
              "ce sont elles qui decideront s'il faut griser ou recadrer.")
    print(SORTIE)
    return 0


if __name__ == "__main__":
    sys.exit(main())
