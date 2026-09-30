"""Les composants du site : chaque morceau d'ecran, photographie a part, avec sa position.

Le film precedent posait des captures entieres et bougeait la camera dessus : un diaporama
(reproche du 2026-10-01). Ici le site se MONTE sous la main : le fond de chaque ecran (le site
sans ses morceaux) est une image, et chaque morceau - une vignette, une fiche, un onglet, un
sonagramme, une reponse de quiz, une bulle de chat - en est une autre, rangee a sa place
exacte. La composition les fait arriver un a un. Tout est encore le vrai site, pixel pour
pixel, mais il est desormais fait de pieces.

Par etat : on cache les morceaux (visibility:hidden), on photographie le FOND ; on les
remontre, on photographie le TOUT, et on decoupe chaque morceau dans le tout.

Sortie :
  .onetake/film/assets/c/<etat>-fond.jpg        le site sans ses morceaux
  .onetake/film/assets/c/<etat>-<cle>[-i].png   un morceau
  .onetake/composants.json                      leurs rectangles (pixels CSS de la fenetre)

Prerequis : le serveur local tourne (npx http-server . -p 8765), la machine est en ligne.

    .onetake/venv/Scripts/python.exe tools/onetake/composants.py
"""

import io
import json
import pathlib
import sys

from PIL import Image
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import pilote as P  # noqa: E402

SORTIE = pathlib.Path(".onetake/film/assets/c")
JSON_SORTIE = pathlib.Path(".onetake/composants.json")
DPR = P.DPR
# Marge autour d'un morceau : l'ombre d'une carte deborde de son rectangle.
MARGE = {"mur-carte": 3}

RES = {}


def photo(page):
    return Image.open(io.BytesIO(page.screenshot())).convert("RGB")


def css_cacher(page, sels):
    page.evaluate(
        """(sels) => {
            let s = document.getElementById('__cache');
            if (!s) { s = document.createElement('style'); s.id = '__cache'; document.head.appendChild(s); }
            s.textContent = sels.length ? sels.join(',') + '{visibility:hidden !important}' : '';
        }""", sels)
    page.wait_for_timeout(250)


def mesure(page, sel, dans=None):
    """Rectangles de tous les elements visibles du selecteur ; `dans` borne a un conteneur."""
    return page.evaluate(
        """([sel, dans]) => {
            const lim = dans ? document.querySelector(dans).getBoundingClientRect() : null;
            return [...document.querySelectorAll(sel)].map(e => {
                const r = e.getBoundingClientRect();
                return {x: r.left, y: r.top, w: r.width, h: r.height,
                        sci: e.getAttribute('data-sci') || ''};
            }).filter(r => r.w > 3 && r.h > 3
                && r.y >= (lim ? lim.top - 2 : 0) && r.y + r.h <= (lim ? lim.bottom + 2 : 1081)
                && r.x >= 0 && r.x + r.w <= 1921);
        }""", [sel, dans])


def etat(page, nom, cacher, items, dans=None, apres_fond=None):
    """Photographie un etat : le fond (morceaux caches), puis chaque morceau."""
    SORTIE.mkdir(parents=True, exist_ok=True)
    # Un bouton qui garde le focus se dessine avec un contour, et ce contour finissait dans
    # le fond du mur (« Vues seulement » cerclé de bleu).
    page.evaluate("() => document.activeElement && document.activeElement.blur()")
    css_cacher(page, list(cacher) + ['#fabStack'])
    fond = photo(page)
    fond.save(SORTIE / f"{nom}-fond.jpg", quality=92)
    css_cacher(page, [])
    page.wait_for_timeout(400)
    tout = photo(page)
    res = {"fond": f"c/{nom}-fond.jpg", "items": {}}
    for cle, sel in items.items():
        rs = mesure(page, sel, dans if cle in ("msg",) else None)
        pad = MARGE.get(f"{nom}-{cle}", 0)
        liste = []
        for i, r in enumerate(rs):
            x0, y0 = max(0, r["x"] - pad), max(0, r["y"] - pad)
            x1, y1 = min(1920, r["x"] + r["w"] + pad), min(1080 if cle == "fab" else 1050, r["y"] + r["h"] + pad)
            fichier = f"c/{nom}-{cle}" + (f"-{i}" if len(rs) > 1 else "") + ".png"
            tout.crop((round(x0 * DPR), round(y0 * DPR), round(x1 * DPR), round(y1 * DPR))
                      ).save(SORTIE.parent / fichier)
            liste.append({"src": fichier, "x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0,
                          "sci": r["sci"]})
        res["items"][cle] = liste
        print(f"  {nom:<10} {cle:<12} {len(liste)}")
    RES[nom] = res
    return res


def main():
    with sync_playwright() as p:
        nav, page, _ = P.ouvre(p)
        erreurs = []
        page.on("pageerror", lambda e: erreurs.append(str(e)))

        # 1. Le mur : les vignettes des premieres rangees, le reste est le fond.
        P.birdydex(page)
        etat(page, "mur", [".pkdx-card", "#fabStack"], {"carte": ".pkdx-card", "fab": "#fabStack"})

        # 2. La recherche : « huppe » tapee, le mur se resserre sur l'oiseau du film.
        # Le champ photographie a chaque lettre : la composition tape « huppe » en posant
        # l'image qui correspond, au lieu d'en reveler une par un masque qui montrerait
        # le texte d'une autre etape.
        for n in range(6):
            page.fill("#pkdxSearch", "huppe"[:n])
            page.focus("#pkdxSearch")
            page.wait_for_timeout(350)
            r = page.evaluate(
                """() => { const r = document.getElementById('pkdxSearch').getBoundingClientRect();
                           return {x: r.left, y: r.top, w: r.width, h: r.height}; }""")
            im = photo(page).crop((round(r["x"] * DPR), round(r["y"] * DPR),
                                   round((r["x"] + r["w"]) * DPR), round((r["y"] + r["h"]) * DPR)))
            im.save(SORTIE / f"recherche-saisie-{n}.png")
            RES["_saisie"] = r
        page.fill("#pkdxSearch", "huppe")
        page.wait_for_timeout(2500)
        etat(page, "recherche", [".pkdx-card"],
             {"champ": "#pkdxSearch", "carte": ".pkdx-card"})

        # 3. La fiche, onglet Info : le tiroir est le fond, ses blocs sont les morceaux.
        P.ouvre_fiche(page)
        P.onglet_fiche(page, "Info")
        page.wait_for_timeout(1500)
        sombre = page.evaluate(
            """() => getComputedStyle(document.getElementById('speciesModal')).backgroundColor""")
        RES["_voile"] = sombre
        print(f"  voile du tiroir : {sombre}")
        etat(page, "fiche",
             ["#smTitle", ".sm-header > *", "#smPhotoCard", "#smDesc", "#smOuQuandCard",
              ".sm-tabs > *", ".sm-nav"],
             {"entete": ".sm-header", "onglets": ".sm-tabs", "photo": "#smPhotoCard",
              "desc": "#smDesc", "nav": ".sm-nav"})
        # Le bloc Ou et quand, qui deborde sous l'ecran : on fait defiler le tiroir, comme
        # le ferait la main, et on releve sa position dans le contenu (hors defilement).
        haut_oq = page.evaluate(
            """() => {
                const sc = document.querySelector('.sm-scroll');
                const c = document.getElementById('smOuQuandCard');
                const r0 = c.getBoundingClientRect().top + sc.scrollTop;
                c.scrollIntoView({block: 'start'});
                return {scroll: sc.scrollTop, contenu_y: r0,
                        btn: (() => { const b = document.querySelector('.mig-fs-btn');
                          if (!b) return null; const r = b.getBoundingClientRect();
                          return {x: r.left, y: r.top, w: r.width, h: r.height}; })()};
            }""")
        page.wait_for_timeout(1500)
        RES["_oq"] = haut_oq
        print(f"  defilement du tiroir : {haut_oq}")
        etat(page, "oq", [], {"bloc": "#smOuQuandCard", "bas": ".sm-scroll"})
        # Les zones de la carte ne portent pas leur nom : on vise par le texte des attributs,
        # puis par le code du departement (comme fiche-libre.py).
        RES["_gironde"] = page.evaluate(
            """() => {
                const zones = [...document.querySelectorAll('#smRarityMap [data-zone]')];
                const texte = z => [...z.attributes].map(a => a.name + '=' + a.value).join(' ')
                    + ' ' + (z.textContent || '');
                const z = zones.find(z => /Gironde/i.test(texte(z)))
                    || zones.find(z => (z.getAttribute('data-zone') || '') === '33');
                if (!z) return null;
                z.dispatchEvent(new MouseEvent('click', {bubbles: true}));
                const r = z.getBoundingClientRect();
                return {x: r.left + r.width / 2, y: r.top + r.height / 2, n: zones.length};
            }""")
        print(f"  zone Gironde : {RES['_gironde']}")
        page.wait_for_timeout(2000)
        etat(page, "gironde", [], {"bloc": "#smOuQuandCard", "bas": ".sm-scroll"})

        # 4. L'onglet Sons : deux enregistrements, chacun avec son sonagramme.
        page.evaluate("() => { document.querySelector('.sm-scroll').scrollTop = 0; }")
        P.onglet_fiche(page, "Sons")
        try:
            page.wait_for_selector(".xa-bar-sono", timeout=25000)
        except Exception:
            print("  ATTENTION : pas de sonagramme, relancer")
        page.wait_for_timeout(2500)
        RES["_sono"] = page.evaluate(
            """() => [...document.querySelectorAll('.xa-bar')].map(e => {
                const r = e.getBoundingClientRect();
                return {x: r.left, y: r.top, w: r.width, h: r.height}; })""")
        etat(page, "sons", ["#smSongRow", "#smCallRow", ".sm-tabs > *"],
             {"chant": "#smSongRow", "cri": "#smCallRow", "onglets": ".sm-tabs"})
        page.evaluate("() => document.querySelectorAll('.xa-bar-sono,.xa-bar-progress')"
                      ".forEach(e => e.style.visibility = 'hidden')")
        page.wait_for_timeout(300)
        etat(page, "sons-nu", [], {"chant": "#smSongRow", "cri": "#smCallRow"})
        page.evaluate("() => document.querySelectorAll('.xa-bar-sono,.xa-bar-progress')"
                      ".forEach(e => e.style.visibility = '')")

        # 4b. L'animation de la migration, ouverte par le bouton de la fiche. On ne garde que
        # son decor : la carte est remplacee par les 52 semaines de migration-frames.py.
        P.onglet_fiche(page, "Info")
        page.evaluate(
            """() => { const c = document.getElementById('smOuQuandCard');
                       c.scrollIntoView({block: 'start'}); }""")
        page.wait_for_timeout(800)
        page.evaluate("() => document.querySelector('.mig-fs-btn').click()")
        page.wait_for_timeout(3500)
        page.evaluate(
            """() => { const b = [...document.querySelectorAll('button')]
                .find(b => /Lire/.test(b.textContent)); if (b) b.click(); }""")
        page.wait_for_timeout(2500)
        page.evaluate(
            """() => { const b = [...document.querySelectorAll('button')]
                .find(b => /Pause/.test(b.textContent)); if (b) b.click(); }""")
        page.wait_for_timeout(800)
        page.evaluate(
            """() => { const c = [...document.querySelectorAll('.leaflet-container')]
                .map(e => [e, e.getBoundingClientRect()])
                .sort((a, b) => b[1].width * b[1].height - a[1].width * a[1].height)[0];
                c[0].setAttribute('data-film-carte', '1'); }""")
        RES["_mig"] = mesure(page, "[data-film-carte]")[0]
        etat(page, "mig", ["[data-film-carte]"], {"carte": "[data-film-carte]"})
        page.keyboard.press("Escape")
        page.wait_for_timeout(800)
        page.keyboard.press("Escape")
        page.wait_for_timeout(1000)

        # 5. La carte de rarete.
        P.onglet(page, "Carte")
        page.wait_for_timeout(5000)
        etat(page, "carte", [".leaflet-container"], {"carte": ".leaflet-container"})

        # 6. Le classement.
        P.onglet(page, "Classement")
        page.wait_for_timeout(3000)
        etat(page, "classement", ["table.board-sheet"],
             {"table": "table.board-sheet", "rang": "table.board-sheet tr"})

        # 7. Le quiz, en cours de partie.
        P.onglet(page, "Quiz")
        page.wait_for_timeout(2500)
        page.evaluate(
            """() => { const b = [...document.querySelectorAll('button')]
                .find(b => /Lancer le quiz/.test(b.textContent)); if (b) b.click(); }""")
        page.wait_for_timeout(8000)
        etat(page, "quiz", [".qz-play"],
             {"lecteur": ".qz-player", "bouton": "#quizPlayBtn", "choix": ".qz-choice"})

        # 8. Le tchat.
        page.evaluate(
            """() => { const b = [...document.querySelectorAll('button,[role=button],a')]
                .find(b => (b.textContent || '').includes('\\u{1F4AC}')); if (b) b.click(); }""")
        page.wait_for_timeout(2500)
        etat(page, "chat", [".msg", "#chatForm"],
             {"msg": ".msg", "saisie": "#chatForm"}, dans="#chatMessages")
        nav.close()
    JSON_SORTIE.write_text(json.dumps(RES, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n{JSON_SORTIE}")
    if erreurs:
        print("erreurs de page :", erreurs[:5])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
