"""Film v2 : le mur du Birdydex en haute definition, assez haut pour le faire defiler jusqu'au Martin-pecheur,
a 199 (case grise) et a 200 (case revelee, titres de famille a jour). Le serveur doit tourner sur 8765.
Une seule capture ne suffit pas (l'entete du site est collante, les photos arrivent a l'approche de
l'ecran) : on prend des tranches sous l'entete et on les recolle sur la position mesuree du Martin.

    .onetake/venv/Scripts/python.exe outils/onetake/v2-mur.py

Sortie dans .onetake/v2/mur/ : mur-199.jpg, mur-200.jpg, carte-martin.png, mur.json.
"""
import io, json, pathlib, re, sys
from PIL import Image
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import demo199, photos_libres

URL = "http://127.0.0.1:8765/demo/"
OUT = pathlib.Path(".onetake/v2/mur")
OUT.mkdir(parents=True, exist_ok=True)
SCI = demo199.NOUVELLE
ECHELLE = 2
ENTETE = 116                  # le bas de l'entete collante, a 1920 x 1080
GAUCHE, DROITE = 318, 1602    # le panneau blanc du Birdydex
AU_DESSUS, EN_DESSOUS = 3400, 760
CARTE = f'.pkdx-card[data-sci="{SCI}"]'


def ouvre(ctx):
    page = ctx.new_page()
    page.goto(URL)
    page.wait_for_timeout(6000)
    page.evaluate("""() => { for (const b of document.querySelectorAll('button')) { const t = b.textContent.trim();
        if (b.offsetParent && (t === '✕' || t === '×')) b.click(); } }""")
    page.add_style_tag(content="#demoBandeau { display:none !important; }")
    page.locator("button:visible", has_text=re.compile(r"^\s*Birdydex\s*$")).first.click()
    page.wait_for_timeout(2500)
    return page


def haut_martin(page):
    return page.evaluate(f"document.querySelector('{CARTE}').getBoundingClientRect().top")


def recolle(page, nom):
    """Le mur de AU_DESSUS pixels au-dessus du Martin a EN_DESSOUS en dessous, en pixels de page."""
    page.evaluate(f"document.querySelector('{CARTE}').scrollIntoView({{block:'center'}})")
    page.wait_for_timeout(500)
    # on remonte par pas : l'ecart reel se mesure sur la carte, le zoom du site fausse les pas demandes
    tranches = []
    cible = AU_DESSUS + ENTETE
    for _ in range(40):
        y = haut_martin(page)
        if y >= cible:
            break
        page.mouse.move(960, 600)
        page.mouse.wheel(0, -700)
        page.wait_for_timeout(250)
    while True:
        page.wait_for_timeout(1800)   # les photos qui viennent d'entrer dans l'ecran
        y = haut_martin(page)
        octets = page.screenshot(clip={"x": GAUCHE, "y": ENTETE, "width": DROITE - GAUCHE, "height": 1080 - ENTETE})
        tranches.append((y, Image.open(io.BytesIO(octets)).convert("RGB")))
        if y + 300 < ENTETE + 1080 - ENTETE - EN_DESSOUS:
            break
        page.mouse.move(960, 600)
        page.mouse.wheel(0, 800)
        page.wait_for_timeout(400)
    hauteur = AU_DESSUS + EN_DESSOUS
    mur = Image.new("RGB", ((DROITE - GAUCHE) * ECHELLE, hauteur * ECHELLE), "#ffffff")
    for y, im in tranches:
        # sur le mur, le haut du Martin est a AU_DESSUS ; le haut de la tranche est a ENTETE a l'ecran
        mur.paste(im, (0, round((AU_DESSUS - (y - ENTETE)) * ECHELLE)))
    mur.save(OUT / nom, quality=90)
    print(nom, mur.size, len(tranches), "tranches")


with sync_playwright() as p:
    nav = p.chromium.launch()
    def contexte(apres):
        ctx = nav.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=ECHELLE,
                              user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36")
        demo199.installe(ctx, apres=apres)
        journal = []
        photos_libres.installe(ctx, journal)
        return ctx, journal

    ctx, j1 = contexte(False)
    page = ouvre(ctx)
    print(page.evaluate("document.body.innerText.match(/\\d+ espèces vues sur \\d+/)?.[0]"))
    recolle(page, "mur-199.jpg")
    page.evaluate(f"document.querySelector('{CARTE}').scrollIntoView({{block:'center'}})")
    page.wait_for_timeout(500)
    b = page.locator(CARTE).bounding_box()
    y0 = b["y"]
    ctx.close()

    ctx, j2 = contexte(True)
    page = ouvre(ctx)
    print(page.evaluate("document.body.innerText.match(/\\d+ espèces vues sur \\d+/)?.[0]"))
    recolle(page, "mur-200.jpg")
    page.evaluate(f"document.querySelector('{CARTE}').scrollIntoView({{block:'center'}})")
    page.wait_for_function(f"(() => {{ const i = document.querySelector('{CARTE} img'); return i && i.complete && i.naturalWidth > 0; }})()", timeout=20000)
    page.wait_for_timeout(600)
    # La carte en couleur seule, sur fond transparent : c'est elle qui revient se poser dans sa case
    st = page.add_style_tag(content=f"""html, body {{ background: transparent !important; }} body * {{ visibility: hidden !important; }}
        {CARTE}, {CARTE} * {{ visibility: visible !important; }}""")
    c = page.locator(CARTE).bounding_box()
    page.screenshot(path=str(OUT / "carte-martin.png"), omit_background=True,
                    clip={"x": c["x"] - 2, "y": c["y"] - 2, "width": c["width"] + 4, "height": c["height"] + 4})
    st.evaluate("e => e.remove()")
    nav.close()

info = {"w": DROITE - GAUCHE, "h": AU_DESSUS + EN_DESSOUS, "carte": {"x": b["x"] - GAUCHE, "y": AU_DESSUS, "w": b["width"], "h": b["height"]}}
(OUT / "mur.json").write_text(json.dumps(info), encoding="utf-8")
print(info)
print("bloquees :", sorted({a for g, _, a in j1 + j2 if g == "bloquee"}))
print("remplacees :", sorted({s for g, s, _ in j1 + j2 if g == "remplacee"}))
