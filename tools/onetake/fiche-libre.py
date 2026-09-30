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
# L'espece du film. La huppe fasciee a remplace l'hirondelle rustique le 2026-09-30 : c'est
# l'oiseau du logo, et le film se termine sur une forme qui se replie en huppe.
SCI = sys.argv[1] if len(sys.argv) > 1 else "upupa epops"
LARGEUR, HAUTEUR = 1920, 1080
DEMARRAGE_MS = 8000
# Un departement selectionne sur la deuxieme prise de la carte : le bloc apparait deux fois
# dans le film, et la deuxieme doit montrer ce que le clic apporte.
DEPARTEMENT = "Gironde"
DEPARTEMENT_CODE = "33"
UA = S.UA


def portrait_libre(sci):
    """Une photo compatible de l'espece. Celle qu'on a choisie a la main passe avant."""
    choisis = json.loads(S.CHOISIS.read_text(encoding="utf-8")) if S.CHOISIS.exists() else {}
    c = choisis.get(sci)
    if c and c.get("fichier") and pathlib.Path(c["fichier"]).exists():
        return c, pathlib.Path(c["fichier"])
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
            """(mot) => {
                const i = document.getElementById('pkdxSearch');
                i.value = mot; i.dispatchEvent(new Event('input',{bubbles:true}));
            }""", SCI.split()[1])
        page.wait_for_timeout(1500)
        page.evaluate(
            """(sci) => {
                const c = document.querySelector('.pkdx-card[data-sci="' + sci + '"]');
                if (!c) throw new Error('carte absente du Birdydex : ' + sci);
                c.click();
            }""", SCI)
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
                const i = document.getElementById('smHeroImg');
                return i ? i.getAttribute('src') : '';
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
                print("DEFAUT : aucun portrait libre trouve")
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

        chemin = REFS / "2-fiche-libre.png"
        page.screenshot(path=str(chemin))
        print(f"  {chemin}  ({chemin.stat().st_size // 1024} Ko)")

        # Le bloc « Ou et quand la trouver » en entier : la carte de France ET les barres
        # mensuelles dessous, qui sortaient coupees de la prise precedente.
        trouve = page.evaluate(
            """() => {
                const c = document.getElementById('smOuQuandCard');
                if (!c || c.hidden) return 0;
                const h = c.getBoundingClientRect().height;
                c.scrollIntoView({block: h < window.innerHeight - 60 ? 'center' : 'start'});
                return Math.round(h);
            }""")
        page.wait_for_timeout(2000)
        if not trouve:
            print("  ATTENTION : bloc « Ou et quand la trouver » absent, cadrage non fait")
        else:
            print(f"  bloc « Ou et quand la trouver » : {trouve} px de haut, cadre")
        zone = page.evaluate(
            """(q) => {
                const zones = [...document.querySelectorAll('#smRarityMap [data-zone]')];
                const texte = z => [...z.attributes].map(a => a.name + '=' + a.value).join(' ')
                    + ' ' + (z.textContent || '');
                const cible = zones.find(z => new RegExp(q.nom, 'i').test(texte(z)))
                    || zones.find(z => (z.getAttribute('data-zone') || '') === q.code);
                if (!cible) return zones.length
                    ? 'absente parmi ' + zones.length + ' zones ; exemple : '
                      + texte(zones[0]).slice(0, 200)
                    : 'aucune zone';
                cible.dispatchEvent(new MouseEvent('click', {bubbles: true}));
                return 'ok';
            }""",
            {"nom": DEPARTEMENT, "code": DEPARTEMENT_CODE})
        print(f"  selection du departement {DEPARTEMENT} : {zone}")
        page.wait_for_timeout(2000)

        chemin = REFS / "2c-fiche-carte-libre.png"
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
