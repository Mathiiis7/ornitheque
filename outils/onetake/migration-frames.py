"""Les 52 semaines de la migration, une image par semaine, prises sur le vrai ecran.

Le film fait defiler une annee en cinq secondes. Une capture ne suffit donc pas : il en faut
une par semaine. On ouvre l'animation plein ecran de l'appli, on pose la semaine voulue sur son
curseur (#migFsSlider) au lieu de laisser tourner la lecture - ainsi chaque image est prise
quand SON image est arrivee, et non a l'aveugle pendant que la carte defile.

Sortie : .onetake/film/assets/mig/w00.jpg ... w51.jpg, cadrees sur la carte seule.

Prerequis : le serveur local tourne, la machine est en ligne (les PNG viennent du depot
separe ornitheque-data).

    .onetake/venv/Scripts/python.exe outils/onetake/migration-frames.py
"""

import pathlib
import sys

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import substituts as S  # noqa: E402

URL = "http://127.0.0.1:8765/demo/"
SORTIE = pathlib.Path(".onetake/film/assets/mig")
SCI = "upupa epops"
LARGEUR, HAUTEUR = 1920, 1080
DEMARRAGE_MS = 8000
UA = S.UA


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    subs, _, _ = S.charge()

    with sync_playwright() as p:
        nav = p.chromium.launch_persistent_context(
            ".onetake/profil", viewport={"width": LARGEUR, "height": HAUTEUR},
            device_scale_factor=2, user_agent=UA)
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
            """(mot) => {
                const i = document.getElementById('pkdxSearch');
                i.value = mot; i.dispatchEvent(new Event('input',{bubbles:true}));
            }""", SCI.split()[1])
        page.wait_for_timeout(1500)
        page.evaluate(
            """(sci) => {
                document.querySelector('.pkdx-card[data-sci="' + sci + '"]').click();
            }""", SCI)
        page.wait_for_timeout(4000)
        page.evaluate(
            """() => {
                const b = [...document.querySelectorAll('button,[role=tab]')]
                    .find(b => /Info/.test(b.textContent) && b.textContent.trim().length < 12);
                if (b) b.click();
            }""")
        page.wait_for_timeout(1500)
        page.evaluate("""() => document.querySelector('.mig-fs-btn').click()""")
        page.wait_for_timeout(3500)

        # La lecture charge les images ; on la lance une fois pour amorcer, puis on met en
        # pause et on pose chaque semaine a la main.
        page.evaluate(
            """() => {
                const b = [...document.querySelectorAll('button')].find(b => /Lire/.test(b.textContent));
                if (b) b.click();
            }""")
        page.wait_for_timeout(2500)
        page.evaluate(
            """() => {
                const b = [...document.querySelectorAll('button')].find(b => /Pause/.test(b.textContent));
                if (b) b.click();
            }""")
        page.wait_for_timeout(800)

        info = page.evaluate(
            """() => {
                const s = document.getElementById('migFsSlider');
                // Plusieurs cartes Leaflet coexistent dans la page - celle de la fiche,
                // celle des observations, celle du plein ecran. On prend la plus grande :
                // les autres sont repliees et mesurent zero, ce qui faisait echouer la prise.
                const c = [...document.querySelectorAll('.leaflet-container')]
                    .map(e => [e, e.getBoundingClientRect()])
                    .sort((a, b) => b[1].width * b[1].height - a[1].width * a[1].height)[0];
                if (!s || !c || c[1].width < 100) return null;
                const r = c[1];
                return {max: Number(s.max),
                        cadre: {x: r.left, y: r.top, width: r.width, height: r.height}};
            }""")
        if not info:
            print("DEFAUT : curseur ou carte introuvable")
            nav.close()
            return 1
        semaines = info["max"] + 1
        cadre = info["cadre"]
        ctrl = page.evaluate(
            """() => { const r = document.getElementById('migFsSlider').parentElement
                          .getBoundingClientRect();
                       return {x: r.left, y: r.top, width: r.width, height: r.height}; }""")
        print(f"{semaines} semaines, carte {round(cadre['width'])}x{round(cadre['height'])} points CSS")

        for w in range(semaines):
            page.evaluate(
                """(w) => {
                    const s = document.getElementById('migFsSlider');
                    s.value = String(w);
                    s.dispatchEvent(new Event('input', {bubbles: true}));
                    s.dispatchEvent(new Event('change', {bubbles: true}));
                }""", w)
            # Attendre que l'image de CETTE semaine soit arrivee : sans cela on photographie
            # la semaine precedente sans qu'aucune erreur ne le dise.
            try:
                page.wait_for_function(
                    """() => [...document.querySelectorAll('.leaflet-image-layer, .leaflet-overlay-pane img')]
                        .every(i => i.complete && i.naturalWidth > 0)""", timeout=15000)
            except Exception:
                pass
            page.wait_for_timeout(260)
            f = SORTIE / f"w{w:02d}.jpg"
            page.screenshot(path=str(f), type="jpeg", quality=86, clip=cadre)
            # La barre du bas (curseur et « Sem 27 ») avance avec les semaines : sans elle,
            # le film montrerait une carte qui defile sous un curseur immobile (2026-10-01).
            page.screenshot(path=str(SORTIE / f"c{w:02d}.jpg"), type="jpeg", quality=90,
                            clip=ctrl)
            if w % 10 == 0 or w == semaines - 1:
                print(f"  w{w:02d}  {f.stat().st_size // 1024} Ko")

        nav.close()
    # Demi-definition pour le film : la carte y est affichee a un pixel ecran par point CSS,
    # donc la pleine definition (deux pixels par point) ne servirait a rien et pesait 23 Mo
    # decodes par semaine, 52 fois, dans chacun des huit navigateurs du rendu.
    from PIL import Image
    demi = SORTIE.parent / "mig-s"
    demi.mkdir(exist_ok=True)
    for f in SORTIE.glob("w*.jpg"):
        im = Image.open(f)
        im.resize((im.width // 2, im.height // 2), Image.LANCZOS).save(demi / f.name, quality=88)
    for f in SORTIE.glob("c*.jpg"):
        im = Image.open(f)
        im.save(demi / f.name, quality=90)
    total = sum(f.stat().st_size for f in SORTIE.glob("*.jpg")) // 1024
    print(f"\n{len(list(SORTIE.glob('*.jpg')))} semaines, {total} Ko au total\n{SORTIE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
