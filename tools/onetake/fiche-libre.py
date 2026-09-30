"""La fiche d'espece de l'hirondelle, filmable : on verifie sa photo avant de la photographier.

Le film montre la fiche en grand, donc sa photo occupe la moitie de l'ecran pendant huit
secondes. Elle vient d'iNaturalist, qui change la photo par defaut d'une espece d'un jour a
l'autre : une licence relevee hier peut decrire une AUTRE photo aujourd'hui. On la relit donc
a la source au moment de la prise, et on la remplace si elle n'est pas compatible.

Sortie : .onetake/refs/2-fiche-hirondelle-libre.png et 2b-fiche-sons-libre.png.

Prerequis : le serveur local tourne (npx http-server . -p 8765) et la machine est en ligne.

    .onetake/venv/Scripts/python.exe tools/onetake/fiche-libre.py
"""

import base64
import json
import pathlib
import sys
import urllib.request

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import substituts as S  # noqa: E402
from credits import LICENCES, origine  # noqa: E402
from portraits import LIBRES, candidates, commons  # noqa: E402

URL = "http://127.0.0.1:8765/demo/"
REFS = pathlib.Path(".onetake/refs")
PHOTOS = pathlib.Path(".onetake/remplacantes")
SCI = "hirundo rustica"
LARGEUR, HAUTEUR = 1920, 1080
DEMARRAGE_MS = 8000
UA = S.UA


def portrait_libre(sci):
    """Une photo compatible de l'espece, Commons d'abord."""
    for c in commons(sci, 30) + candidates(sci, 12):
        if c["licence"] not in LIBRES:
            continue
        chemin = PHOTOS / (sci.replace(" ", "-") + "-fiche.jpg")
        if S._telecharge(c["url"], chemin):
            return c, chemin
    return None, None


def main():
    REFS.mkdir(parents=True, exist_ok=True)
    subs, manquantes, n_choisis = S.charge()
    print(f"{len(subs)} substituts prets, {n_choisis} choisis a la main"
          + (f", {len(manquantes)} manquants" if manquantes else ""))

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
                i.value = 'rustica'; i.dispatchEvent(new Event('input',{bubbles:true}));
            }""")
        page.wait_for_timeout(1500)
        page.evaluate(
            """() => {
                const c = document.querySelector('.pkdx-card[data-sci="hirundo rustica"]');
                if (!c) throw new Error('carte hirondelle absente du Birdydex');
                c.click();
            }""")
        page.wait_for_timeout(4000)

        # Le profil garde le dernier onglet visite : la fiche s'ouvrait sur Sons, d'ou deux
        # prises identiques et une licence lue sur le sonagramme. On pose l'onglet.
        page.evaluate(
            """() => {
                const b = [...document.querySelectorAll('button,[role=tab]')]
                    .find(b => /Info/.test(b.textContent) && b.textContent.trim().length < 12);
                if (!b) throw new Error('onglet Info absent de la fiche');
                b.click();
            }""")
        page.wait_for_timeout(2500)

        # La photo REELLEMENT affichee en tete de fiche, et sa licence, lues maintenant.
        src = page.evaluate(
            """() => {
                const im = [...document.querySelectorAll('img')]
                    .filter(i => i.naturalWidth > 200 && !/xeno-canto|spectrogram/.test(i.src))
                    .sort((a,b) => b.naturalWidth*b.naturalHeight - a.naturalWidth*a.naturalHeight);
                return im.length ? im[0].getAttribute('src') : '';
            }""")
        print(f"  adresse servie : {src[:110]}")
        info = origine(src, SCI) or {}
        lic = info.get("licence", "inconnue")
        nom_lic = LICENCES.get(lic, (lic,))[0]
        print(f"photo de la fiche : {info.get('auteur','?')}  ·  {nom_lic}")

        remplacee = None
        if lic not in LIBRES:
            print("  -> incompatible, on cherche un portrait libre")
            c, chemin = portrait_libre(SCI)
            if not c:
                print("DEFAUT : aucun portrait libre trouve pour l'hirondelle")
                nav.close()
                return 1
            remplacee = c
            data = ("data:image/jpeg;base64,"
                    + base64.b64encode(chemin.read_bytes()).decode("ascii"))
            subs = dict(subs)
            subs[SCI] = data
            print(f"  -> {c['auteur'][:40]}  ·  {LICENCES.get(c['licence'], (c['licence'],))[0]}")

        poses = S.installe(page, {"parSci": subs, "parUrl": {src: subs[SCI]} if remplacee else {}})
        print(f"{poses} image(s) substituee(s) dans la page")
        page.wait_for_timeout(2500)

        chemin = REFS / "2-fiche-hirondelle-libre.png"
        page.screenshot(path=str(chemin))
        print(f"  {chemin}  ({chemin.stat().st_size // 1024} Ko)")

        # L'onglet Sons : le chant et son sonagramme.
        page.evaluate(
            """() => {
                const b = [...document.querySelectorAll('button,[role=tab]')]
                    .find(b => /Sons/.test(b.textContent) && b.textContent.trim().length < 12);
                if (!b) throw new Error('onglet Sons absent de la fiche');
                b.click();
            }""")
        page.wait_for_timeout(1500)
        print("  onglets : " + page.evaluate(
            """() => [...document.querySelectorAll('button,[role=tab]')]
                 .filter(b => b.textContent.trim().length < 14)
                 .map(b => b.textContent.trim() + (b.className.includes('active') ? '*' : ''))
                 .join(' | ')"""))
        try:
            page.wait_for_selector(".xa-bar-sono", timeout=25000)
        except Exception:
            print("  ATTENTION : pas de sonagramme sur cette prise, relancer (le cache se"
                  " rechauffe dans .onetake/profil)")
        page.wait_for_timeout(2000)
        chemin = REFS / "2b-fiche-sons-libre.png"
        page.screenshot(path=str(chemin))
        print(f"  {chemin}  ({chemin.stat().st_size // 1024} Ko)")
        nav.close()

    (pathlib.Path(".onetake/fiche-licence.json")).write_text(json.dumps(
        {"photo_servie": info, "remplacee_par": remplacee}, ensure_ascii=False, indent=1),
        encoding="utf-8")
    print("CONFORME : la photo de la fiche est compatible avec la licence du film.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
