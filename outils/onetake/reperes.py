"""Les reperes du film : ou se trouve, dans chaque prise, l'objet qui traverse le passage.

Le film n'est plus une reconstruction mais une suite de vraies captures. Un enchainement se
fait alors par RACCORD DE POSITION : la vignette de la huppe occupe un rectangle dans la prise
du mur, sa photo occupe un autre rectangle dans la prise de la fiche, et la camera va de l'un a
l'autre. Sans ces coordonnees, il n'y a pas de raccord - seulement un fondu, c'est-a-dire un
diaporama.

Sortie :
  .onetake/refs/1b-mur-huppe.png   le mur defile jusqu'a la huppe, vignette au centre
  .onetake/reperes.json            les rectangles, en pixels de prise (deux par point CSS)

Prerequis : le serveur local tourne (npx http-server . -p 8765) et la machine est en ligne.

    .onetake/venv/Scripts/python.exe outils/onetake/reperes.py
"""

import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import substituts as S  # noqa: E402

URL = "http://127.0.0.1:8765/demo/"
REFS = pathlib.Path(".onetake/refs")
SORTIE = pathlib.Path(".onetake/reperes.json")
SCI = "upupa epops"
LARGEUR, HAUTEUR = 1920, 1080
DPR = 2
DEMARRAGE_MS = 8000
UA = S.UA

# Le rectangle rendu par le navigateur est en pixels CSS ; les prises sont faites a deux
# pixels par point. Le film travaille dans le repere de la PRISE, donc on multiplie.
def en_prise(r):
    return {k: round(v * DPR) for k, v in r.items()}


def main():
    REFS.mkdir(parents=True, exist_ok=True)
    subs, _, n_choisis = S.charge()
    print(f"{len(subs)} substituts prets, {n_choisis} choisis a la main\n")
    # On complete le fichier, on ne le remplace pas : les cadres des panneaux et le
    # bloc de la carte sont mesures par d'autres scripts.
    reperes = json.loads(SORTIE.read_text(encoding="utf-8")) if SORTIE.exists() else {}

    with sync_playwright() as p:
        nav = p.chromium.launch_persistent_context(
            ".onetake/profil", viewport={"width": LARGEUR, "height": HAUTEUR},
            device_scale_factor=DPR, user_agent=UA)
        page = nav.new_page()
        page.goto(URL)
        page.wait_for_timeout(DEMARRAGE_MS)
        S.installe(page, {"parSci": subs, "parUrl": {}, "hero": SCI})

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
        page.wait_for_timeout(2000)
        page.wait_for_function(
            """() => [...document.querySelectorAll('.pkdx-img img')]
                     .filter(i => i.naturalWidth > 0).length >= 20""", timeout=40000)

        # « Vues seulement » : sans ce filtre, le mur compte 466 cases dont 254 vides, et la
        # descente vers la huppe traverse cinquante rangees de cases grises. Avec, elle en
        # traverse dix et chacune porte une photo. C'est un filtre de l'appli, pas un
        # arrangement pour le film - le bouton est a l'ecran.
        page.click("#pkdxOwned")
        page.wait_for_timeout(900)
        page.evaluate(
            """() => {
                const it = [...document.querySelectorAll('.cp-item, [data-value]')]
                    .find(e => /Vues seulement/i.test(e.textContent || ''));
                if (!it) throw new Error('choix « Vues seulement » absent du selecteur');
                it.click();
            }""")
        page.wait_for_timeout(2500)
        # Faire venir toutes les vignettes (chargement differe) avant de viser la huppe.
        for _ in range(14):
            page.mouse.wheel(0, 2500)
            page.wait_for_timeout(500)
        page.wait_for_timeout(2000)

        # La position de la huppe DANS LA PAGE, pas dans l'ecran : la prise est une seule
        # image haute, et la camera y descend.
        page.evaluate("() => window.scrollTo(0, 0)")
        page.wait_for_timeout(1500)
        rect = page.evaluate(
            """(sci) => {
                const c = document.querySelector('.pkdx-card[data-sci="' + sci + '"]');
                if (!c) return null;
                const r = c.getBoundingClientRect();
                const img = c.querySelector('.pkdx-img img');
                const ri = img ? img.getBoundingClientRect() : r;
                const sx = window.scrollX, sy = window.scrollY;
                return {carte: {x: r.left + sx, y: r.top + sy, w: r.width, h: r.height},
                        photo: {x: ri.left + sx, y: ri.top + sy, w: ri.width, h: ri.height},
                        page: {h: document.documentElement.scrollHeight}};
            }""", SCI)
        if not rect:
            print("DEFAUT : vignette de la huppe introuvable dans le mur")
            nav.close()
            return 1
        chemin = REFS / "1b-mur-huppe.png"
        hauteur = min(rect["carte"]["y"] + rect["carte"]["h"] + 420, rect["page"]["h"])
        page.screenshot(path=str(chemin), full_page=True,
                        clip={"x": 0, "y": 0, "width": LARGEUR, "height": hauteur})
        reperes["mur"] = {"prise": chemin.name, "hauteur": round(hauteur * DPR),
                          "carte": en_prise(rect["carte"]), "photo": en_prise(rect["photo"])}
        print(f"  {chemin.name} : vignette de la huppe a "
              f"{reperes['mur']['carte']['x']},{reperes['mur']['carte']['y']} "
              f"({reperes['mur']['carte']['w']}x{reperes['mur']['carte']['h']})")

        # La fiche : la photo d'en-tete, et le panneau entier.
        page.evaluate(
            """(sci) => {
                const c = document.querySelector('.pkdx-card[data-sci="' + sci + '"]');
                c.click();
            }""", SCI)
        page.wait_for_timeout(4000)
        page.evaluate(
            """() => {
                const b = [...document.querySelectorAll('button,[role=tab]')]
                    .find(b => /Info/.test(b.textContent) && b.textContent.trim().length < 12);
                if (b) b.click();
            }""")
        page.wait_for_timeout(2500)
        mesures = page.evaluate(
            """() => {
                const h = document.getElementById('smHeroImg');
                const p = document.querySelector('.species-modal') || document.body;
                const oq = document.getElementById('smOuQuandCard');
                const r = e => e ? (e => ({x: e.left, y: e.top, w: e.width, h: e.height}))(
                    e.getBoundingClientRect()) : null;
                return {photo: r(h), panneau: r(p), ouquand: r(oq)};
            }""")
        reperes["fiche"] = {"prise": "2-fiche-libre.png",
                            **{k: (en_prise(v) if v else None) for k, v in mesures.items()}}
        print(f"  fiche : photo a {reperes['fiche']['photo']}")
        nav.close()

    SORTIE.write_text(json.dumps(reperes, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n{SORTIE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
