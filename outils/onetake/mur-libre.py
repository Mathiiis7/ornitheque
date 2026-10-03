"""Le VRAI mur du Birdydex, mais avec les 38 photos interdites remplacees par des libres.

Le film doit montrer le site tel qu'il est. Or 38 des 125 vignettes du mur sont sous tous
droits reserves, ou interdisent toute modification - ce qu'un film qui recadre et anime fait
forcement. Mesure du 2026-09-30 par vignettes-libres.py : les 38 ont une remplacante libre de
la MEME espece.

Ce script telecharge ces remplacantes, ouvre le mur, substitue les images dans la page, puis
photographie. Le reste de l'ecran ne bouge pas d'un pixel : c'est la vraie page, les vrais
noms, la vraie grille. L'appli, elle, n'est pas touchee - la substitution ne vit que le temps
de la prise.

Sortie : .onetake/refs/1-birdydex-mur-libre.png et .onetake/remplacantes/.

Prerequis : le serveur local tourne (npx http-server . -p 8765) et la machine est en ligne.

    .onetake/venv/Scripts/python.exe outils/onetake/mur-libre.py
"""

import base64
import json
import pathlib
import sys
import urllib.request

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8765/demo/"
MESURE = pathlib.Path(".onetake/vignettes-libres.json")
PHOTOS = pathlib.Path(".onetake/remplacantes")
REFS = pathlib.Path(".onetake/refs")
LARGEUR, HAUTEUR = 1920, 1080
DEMARRAGE_MS = 8000
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36")


def telecharge(url, vers):
    if vers.exists() and vers.stat().st_size > 2000:
        return True
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=40) as r:
            octets = r.read()
            type_ = r.headers.get("Content-Type", "")
    except Exception as e:
        print(f"    echec : {e}")
        return False
    if not type_.startswith("image/") or len(octets) < 2000:
        print(f"    refuse : {type_}, {len(octets)} octets")
        return False
    vers.write_bytes(octets)
    return True


def main():
    if not MESURE.exists():
        print("lancer d'abord outils/onetake/vignettes-libres.py")
        return 1
    mesure = json.loads(MESURE.read_text(encoding="utf-8"))
    a_remplacer = [x for x in mesure["a_remplacer"] if x.get("remplacante")]
    print(f"{len(a_remplacer)} vignettes a remplacer\n")

    PHOTOS.mkdir(parents=True, exist_ok=True)
    REFS.mkdir(parents=True, exist_ok=True)

    # Les images sont telechargees UNE fois et gardees : iNaturalist change la photo par
    # defaut d'une espece d'un jour a l'autre, et on veut que deux prises se ressemblent.
    # Les vignettes que le film montre vraiment ont un portrait choisi a la main : le choix
    # automatique par votes donnait un canard domestique pour le colvert et un troupeau
    # lointain pour la nette rousse (voir portraits-choix.py). Les autres, qu'on ne verra
    # jamais, gardent la remplacante automatique.
    CHOISIS = pathlib.Path(".onetake/portraits-choisis.json")
    choisis = json.loads(CHOISIS.read_text(encoding="utf-8")) if CHOISIS.exists() else {}
    for x in a_remplacer:
        if x["sci"] in choisis:
            x["remplacante"] = choisis[x["sci"]]
    print(f"{len(choisis)} portraits choisis a la main, "
          f"{len(a_remplacer) - len(choisis)} laisses au choix automatique")

    substituts, manquantes = {}, []
    for x in a_remplacer:
        nom = x["sci"].replace(" ", "-").replace("/", "-") + ".jpg"
        chemin = PHOTOS / nom
        source = x["remplacante"].get("fichier") or x["remplacante"]["url"]
        if source.startswith("http") and telecharge(source, chemin):
            pass
        elif not source.startswith("http"):
            chemin.write_bytes(pathlib.Path(source).read_bytes())
        if chemin.exists() and chemin.stat().st_size > 2000:
            substituts[x["sci"]] = (
                "data:image/jpeg;base64,"
                + base64.b64encode(chemin.read_bytes()).decode("ascii")
            )
        else:
            manquantes.append(x["nom"] or x["sci"])
    print(f"{len(substituts)} photos pretes"
          + (f", {len(manquantes)} manquantes : {', '.join(manquantes)}" if manquantes else ""))

    with sync_playwright() as p:
        nav = p.chromium.launch_persistent_context(
            ".onetake/profil",
            viewport={"width": LARGEUR, "height": HAUTEUR},
            device_scale_factor=2,
            user_agent=UA,
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
        # Faire venir toutes les vignettes (chargement differe), puis remonter en haut :
        # c'est le haut du mur qu'on photographie, et il doit cadrer comme la prise d'origine.
        for _ in range(12):
            page.mouse.wheel(0, 3000)
            page.wait_for_timeout(600)
        page.wait_for_timeout(2000)
        page.evaluate("() => window.scrollTo(0, 0)")
        page.evaluate(
            """() => {
                const p = document.querySelector('.pkdx-grid') || document.body;
                p.scrollTop = 0;
                const s = document.scrollingElement; if (s) s.scrollTop = 0;
            }"""
        )
        page.wait_for_timeout(1500)

        # La substitution. On garde aussi un observateur : l'appli re-rend son panneau, et un
        # re-rendu rendrait leur photo d'origine aux 38 especes sans qu'on le voie.
        poses = page.evaluate(
            """(subs) => {
                const applique = () => {
                    let n = 0;
                    for (const c of document.querySelectorAll('.pkdx-card')) {
                        const d = subs[c.dataset.sci];
                        if (!d) continue;
                        const img = c.querySelector('.pkdx-img img');
                        if (img && img.src !== d) { img.src = d; img.srcset = ''; n++; }
                    }
                    return n;
                };
                const n = applique();
                const obs = new MutationObserver(() => applique());
                obs.observe(document.body, {childList: true, subtree: true});
                window.__obsSubstitution = obs;
                return n;
            }""",
            substituts,
        )
        print(f"{poses} vignettes substituees dans la page")
        page.wait_for_timeout(2500)

        chemin = REFS / "1-birdydex-mur-libre.png"
        page.screenshot(path=str(chemin))
        print(f"  {chemin}  ({chemin.stat().st_size // 1024} Ko)")

        # Controle : plus aucune vignette visible ne doit pointer vers une photo interdite.
        restantes = page.evaluate(
            """(scis) => [...document.querySelectorAll('.pkdx-card')]
                .filter(c => scis.includes(c.dataset.sci))
                .filter(c => {
                    const img = c.querySelector('.pkdx-img img');
                    return img && !img.src.startsWith('data:');
                })
                .map(c => c.dataset.sci)""",
            list(substituts),
        )
        nav.close()

    if restantes:
        print(f"DEFAUT : {len(restantes)} vignette(s) interdite(s) encore en place : "
              + ", ".join(restantes[:8]))
        return 1
    print("CONFORME : aucune vignette interdite ne reste dans la page.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
