"""Choisir a la main le portrait des vignettes remplacees QUE L'ON VOIT dans le film.

vignettes-libres.py prend la photo libre la mieux votee. C'est un choix automatique, et il
donne parfois un mauvais portrait : la macreuse noire est devenue deux oiseaux lointains sur
l'eau la ou l'appli montrait une tete nette (constate le 2026-09-30).

Seule une quarantaine de vignettes passent a l'ecran dans le film. Pour celles-la seulement,
ce script rassemble plusieurs candidates libres et fabrique une planche par espece : on
choisit en regardant, et le choix est ecrit dans .onetake/portraits-choisis.json, que
mur-libre.py lit en priorite.

    .onetake/venv/Scripts/python.exe outils/onetake/portraits.py --lister
    .onetake/venv/Scripts/python.exe outils/onetake/portraits.py --candidates
"""

import json
import pathlib
import re
import subprocess
import sys
import urllib.parse
import urllib.request

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from credits import lis, normalise  # noqa: E402

URL = "http://127.0.0.1:8765/demo/"
MESURE = pathlib.Path(".onetake/vignettes-libres.json")
VISIBLES = pathlib.Path(".onetake/vignettes-visibles.json")
CANDIDATS = pathlib.Path(".onetake/candidats")
LARGEUR, HAUTEUR = 1920, 1080
DEMARRAGE_MS = 8000
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36")
# Les licences compatibles avec le film. CC BY-SA en est EXCLUE, et ce n'est pas une
# prudence : le chant de l'hirondelle que l'appli fait ecouter impose « pas d'usage
# commercial », or CC BY-SA interdit d'ajouter cette restriction a une oeuvre qui la reprend.
# Les deux ne peuvent pas cohabiter. CC BY-NC-ND est exclue aussi : elle interdit toute
# modification, et recadrer ou animer en est une. Constate le 2026-09-30 : 29 des 125
# vignettes du mur sont en CC BY-SA.
LIBRES = {"cc0", "pd", "cc-by", "cc-by-nc", "cc-by-nc-sa"}

# Deux hauteurs d'ecran : le film peut descendre un peu dans le mur sans qu'on ait a tout
# reprendre. Au-dela, personne ne verra jamais ces vignettes.
CADRE_PX = 2 * HAUTEUR


def lister():
    """Les especes a remplacer dont la carte tombe dans le cadre du film."""
    mesure = json.loads(MESURE.read_text(encoding="utf-8"))
    a_remplacer = {x["sci"]: x for x in mesure["a_remplacer"]}
    with sync_playwright() as p:
        nav = p.chromium.launch_persistent_context(
            ".onetake/profil", viewport={"width": LARGEUR, "height": HAUTEUR},
            device_scale_factor=2, user_agent=UA)
        page = nav.new_page()
        page.goto(URL)
        page.wait_for_timeout(DEMARRAGE_MS)
        page.evaluate(
            """() => {
                const b = [...document.querySelectorAll('button')]
                    .find(b => /Birdydex/.test(b.textContent) && b.textContent.length < 20);
                b.click();
            }""")
        page.wait_for_timeout(2000)
        page.evaluate(
            """() => {
                const i = document.getElementById('pkdxSearch');
                if (i && i.value) { i.value=''; i.dispatchEvent(new Event('input',{bubbles:true})); }
            }""")
        page.wait_for_timeout(2500)
        page.wait_for_function(
            """() => [...document.querySelectorAll('.pkdx-img img')]
                     .filter(i => i.naturalWidth > 0).length >= 20""", timeout=40000)
        dans_cadre = page.evaluate(
            """(hauteur) => [...document.querySelectorAll('.pkdx-card')].map(c => {
                const r = c.getBoundingClientRect();
                const img = c.querySelector('.pkdx-img img');
                return {sci: c.dataset.sci || '', y: Math.round(r.top + window.scrollY),
                        avec_photo: !!(img && img.naturalWidth > 0)};
            }).filter(c => c.avec_photo && c.y < hauteur)""", CADRE_PX)
        nav.close()
    vus = [c["sci"] for c in dans_cadre]
    concernees = [a_remplacer[s] for s in vus if s in a_remplacer]
    VISIBLES.write_text(json.dumps(
        {"cadre_px": CADRE_PX, "vignettes_dans_le_cadre": len(vus),
         "a_remplacer_dans_le_cadre": [x["sci"] for x in concernees]},
        ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(vus)} vignettes avec photo dans le cadre du film "
          f"(les {CADRE_PX} premiers pixels du mur)")
    print(f"{len(concernees)} d'entre elles sont a remplacer :")
    for x in concernees:
        print(f"  {x['nom'] or x['sci']:<26} {x['sci']}")
    return concernees


def candidates(sci, combien=6):
    """Plusieurs photos libres de l'espece, les mieux votees d'abord."""
    j = lis("https://api.inaturalist.org/v1/taxa/autocomplete?rank=species&per_page=1&q="
            + urllib.parse.quote(sci))
    res = ((j or {}).get("results") or [{}])[0]
    out, vus = [], set()
    for tp in res.get("taxon_photos") or []:
        ph = tp.get("photo") or {}
        lic = normalise(ph.get("license_code"))
        if lic in LIBRES and ph.get("id") not in vus:
            vus.add(ph.get("id"))
            out.append({"licence": lic, "url": ph.get("medium_url") or ph.get("url"),
                        "auteur": (ph.get("attribution") or "")[:60], "via": "taxon_photos"})
    tid = res.get("id")
    if tid:
        j = lis("https://api.inaturalist.org/v1/observations?per_page=20&quality_grade=research"
                f"&order_by=votes&photos=true&taxon_id={tid}"
                "&photo_license=cc0,cc-by,cc-by-nc,cc-by-nc-sa")
        for obs in (j or {}).get("results") or []:
            for ph in obs.get("photos") or []:
                lic = normalise(ph.get("license_code"))
                if lic in LIBRES and ph.get("id") not in vus:
                    vus.add(ph.get("id"))
                    out.append({"licence": lic,
                                "url": (ph.get("url") or "").replace("square", "medium"),
                                "auteur": (ph.get("attribution") or "")[:60],
                                "via": "observations"})
    return out[:combien]


def planches(concernees):
    """Une planche par espece : la photo d'aujourd'hui, puis les candidates libres."""
    CANDIDATS.mkdir(parents=True, exist_ok=True)
    fiche = {}
    for x in concernees:
        sci = x["sci"]
        dossier = CANDIDATS / sci.replace(" ", "-")
        dossier.mkdir(exist_ok=True)
        cands = candidates(sci)
        gardees = []
        for i, c in enumerate(cands):
            f = dossier / f"{i:02d}.jpg"
            if not f.exists():
                try:
                    req = urllib.request.Request(c["url"], headers={"User-Agent": UA})
                    with urllib.request.urlopen(req, timeout=40) as r:
                        octets = r.read()
                    if len(octets) < 2000:
                        continue
                    f.write_bytes(octets)
                except Exception:
                    continue
            c["fichier"] = str(f)
            gardees.append(c)
        fiche[sci] = {"nom": x["nom"], "candidates": gardees}
        if gardees:
            entrees = []
            for c in gardees:
                entrees += ["-i", c["fichier"]]
            n = len(gardees)
            filtre = ";".join(
                [f"[{i}:v]scale=420:420:force_original_aspect_ratio=increase,"
                 f"crop=420:420,pad=436:436:8:8:color=white[v{i}]" for i in range(n)]
            ) + ";" + "".join(f"[v{i}]" for i in range(n)) + f"hstack=inputs={n}[out]"
            subprocess.run(
                ["ffmpeg", "-v", "error", "-y", *entrees, "-filter_complex", filtre,
                 "-map", "[out]", str(dossier / "planche.png")], check=False)
            print(f"  {x['nom'] or sci:<26} {n} candidate(s)  ->  {dossier / 'planche.png'}")
    (CANDIDATS / "candidats.json").write_text(
        json.dumps(fiche, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n{CANDIDATS / 'candidats.json'}")


def commons(sci, combien=18):
    """Des portraits de la meme espece sur Wikimedia Commons.

    iNaturalist classe ses photos par votes, et les plus votees d'une espece discrete sont
    souvent celles d'un centre de soins ou d'une session de baguage : oiseau tenu en main,
    fond gris. Commons range par espece et contient surtout des oiseaux sauvages. Constate le
    2026-09-30 sur la tourterelle des bois, dont les dix-huit premieres candidates iNaturalist
    etaient toutes des photos de baguage.
    """
    j = lis("https://commons.wikimedia.org/w/api.php?action=query&format=json"
            "&generator=categorymembers&gcmtype=file&gcmlimit=60"
            "&gcmtitle=" + urllib.parse.quote("Category:" + sci.capitalize()) +
            "&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=600")
    pages = ((j or {}).get("query") or {}).get("pages") or {}
    out = []
    for p in pages.values():
        info = (p.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata") or {}
        lic = normalise((meta.get("LicenseShortName") or {}).get("value", ""))
        if lic not in LIBRES:
            continue
        url = info.get("thumburl") or info.get("url")
        if not url or not url.lower().split("?")[0].endswith((".jpg", ".jpeg", ".png")):
            continue
        auteur = re.sub(r"<[^>]+>", "", (meta.get("Artist") or {}).get("value", "") or "?")
        out.append({"licence": lic, "url": url, "auteur": auteur.strip()[:60],
                    "via": "Wikimedia Commons", "page": p.get("title", "")})
    return out[:combien]


def profond(scis, combien=18, source=None):
    """Chercher plus loin pour une espece dont les premieres candidates sont mauvaises.

    Le martinet noir et la tourterelle des bois ne remontaient que des oiseaux tenus en main
    et des ailes posees sur une table : les photos les mieux votees d'une espece sont souvent
    celles d'un centre de soins ou d'une session de baguage, pas des portraits.
    """
    CANDIDATS.mkdir(parents=True, exist_ok=True)
    for sci in scis:
        suffixe = "-commons" if source == "commons" else "-profond"
        dossier = CANDIDATS / (sci.replace(" ", "-") + suffixe)
        dossier.mkdir(exist_ok=True)
        cands = commons(sci, combien) if source == "commons" else candidates(sci, combien)
        gardees = []
        for i, c in enumerate(cands):
            f = dossier / f"{i:02d}.jpg"
            if not f.exists():
                try:
                    req = urllib.request.Request(c["url"], headers={"User-Agent": UA})
                    with urllib.request.urlopen(req, timeout=40) as r:
                        octets = r.read()
                    if len(octets) < 2000:
                        continue
                    f.write_bytes(octets)
                except Exception:
                    continue
            c["fichier"] = str(f)
            gardees.append(c)
        n = min(len(gardees), combien)
        if not n:
            continue
        entrees = []
        for c in gardees[:n]:
            entrees += ["-i", c["fichier"]]
        par_rang = 6
        rangs = [gardees[i:i + par_rang] for i in range(0, n, par_rang)]
        filtre = ";".join(
            f"[{i}:v]scale=420:420:force_original_aspect_ratio=increase,"
            f"crop=420:420,pad=436:436:8:8:color=white[v{i}]" for i in range(n))
        k = 0
        for r, rang in enumerate(rangs):
            filtre += ";" + "".join(f"[v{k + j}]" for j in range(len(rang)))
            filtre += f"hstack=inputs={len(rang)}[r{r}]" if len(rang) > 1 else f"null[r{r}]"
            k += len(rang)
        complets = [r for r, rang in enumerate(rangs) if len(rang) == par_rang]
        filtre += ";" + "".join(f"[r{r}]" for r in complets)
        filtre += f"vstack=inputs={len(complets)}[out]" if len(complets) > 1 else "null[out]"
        subprocess.run(["ffmpeg", "-v", "error", "-y", *entrees, "-filter_complex", filtre,
                        "-map", "[out]", str(dossier / "planche.png")], check=False)
        print(f"  {sci:<26} {n} candidate(s)  ->  {dossier / 'planche.png'}")
        (dossier / "candidats.json").write_text(
            json.dumps(gardees, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    if "--commons" in sys.argv:
        i = sys.argv.index("--commons")
        profond(sys.argv[i + 1:], source="commons")
        sys.exit(0)
    if "--profond" in sys.argv:
        i = sys.argv.index("--profond")
        profond(sys.argv[i + 1:])
        sys.exit(0)
    concernees = lister()
    if "--candidates" in sys.argv and concernees:
        print("\ncandidates libres, par espece :")
        planches(concernees)
