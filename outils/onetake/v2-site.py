"""Film v2 : tout ce que les moments 1 et 2 montrent du site, pris sur le site ACTUEL (la demo).
Remplace les prises du 2026-10-01 (composants.py, v2-carte.py) : aucune photo n'est substituee,
les cartes du Birdydex sont celles qu'un visiteur voit. Le serveur doit tourner sur 8765.

    .onetake/venv/Scripts/python.exe outils/onetake/v2-site.py

Sortie dans .onetake/v2/site/ : cartes-birdydex.json (espece, photo, licence), planche, prises.
"""
import json, pathlib, re
from PIL import Image
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8765/demo/"   # pas localhost : http-server n'ecoute qu'en IPv4
OUT = pathlib.Path(".onetake/v2/site")
OUT.mkdir(parents=True, exist_ok=True)
CACHE = pathlib.Path("notes-privees/choix-photos/cache-inat")
# Licences compatibles avec le chant du film (CC BY-NC-SA) : ni BY-SA, ni ND. Voir VIDEO-PRESENTATION.md.
LIBRES = {"cc0", "pd", "cc-by", "cc-by-nc", "cc-by-nc-sa"}
CANDIDATES = ["alcedo atthis", "phoenicopterus roseus", "podiceps cristatus", "upupa epops", "ciconia ciconia",
              "merops apiaster", "cygnus olor", "tadorna tadorna", "fratercula arctica", "erithacus rubecula",
              "grus grus", "himantopus himantopus", "ardea cinerea", "parus major"]


def licences_inat():
    """id de photo iNaturalist -> licence, depuis les reponses deja gardees."""
    lic = {}
    def note(p):
        if p and p.get("id") is not None:
            lic.setdefault(str(p["id"]), p.get("license_code"))
    for f in CACHE.glob("*.json"):
        try:
            j = json.loads(f.read_text(encoding="utf-8"))
        except ValueError:
            continue
        for r in j.get("results") or []:
            note(r.get("default_photo"))
            for tp in r.get("taxon_photos") or []:
                note(tp.get("photo"))
            for p in r.get("photos") or []:
                note(p)
    return lic


def ferme_guides(page):
    page.evaluate("""() => {
        for (const b of document.querySelectorAll('button')) {
            const t = b.textContent.trim();
            if (b.offsetParent && (t === '✕' || t === '×')) b.click();
        }
    }""")
    page.wait_for_timeout(500)


def onglet(page, libelle):
    page.locator("button:visible", has_text=re.compile("^\\s*" + libelle + "\\s*$")).first.click()
    page.wait_for_timeout(2500)


with sync_playwright() as p:
    nav = p.chromium.launch()
    ctx = nav.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=2,
                          user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36")
    page = ctx.new_page()
    page.goto(URL)
    page.wait_for_timeout(6000)
    ferme_guides(page)
    page.screenshot(path=str(OUT / "0-accueil.png"))

    # 1. Le Birdydex : l'espece, la photo reellement affichee, sa licence
    onglet(page, "Birdydex")
    ferme_guides(page)
    page.wait_for_timeout(1500)
    print(page.evaluate("document.querySelector('#viewBirdydex, #pkdx, body').innerText.match(/\\d+ espèces vues sur \\d+/)?.[0]"))
    cartes = page.evaluate("""() => [...document.querySelectorAll('.pkdx-card:not(.missing)')].map(c => ({
        sci: c.dataset.sci, nom: c.querySelector('.pkdx-name')?.textContent.trim(),
        num: c.querySelector('.pkdx-num')?.textContent.trim(), src: c.querySelector('img')?.src || null }))""")
    lic = licences_inat()
    for c in cartes:
        m = re.search(r"/photos/(\d+)/", c["src"] or "")
        c["licence"] = lic.get(m.group(1), "inconnue") if m else ("wikimedia" if "wikimedia" in (c["src"] or "") else "inconnue")
    (OUT / "cartes-birdydex.json").write_text(json.dumps(cartes, ensure_ascii=False, indent=1), encoding="utf-8")
    bilan = {}
    for c in cartes:
        bilan[str(c["licence"])] = bilan.get(str(c["licence"]), 0) + 1
    print(len(cartes), "cartes vues ; licences :", bilan)
    page.screenshot(path=str(OUT / "1-birdydex.png"))

    # Les cartes candidates : seulement une licence compatible, verifiee ci-dessus
    par_sci = {c["sci"]: c for c in cartes}
    gardees = []
    for sci in CANDIDATES:
        c = par_sci.get(sci)
        if not c or c["licence"] not in LIBRES:
            print("ecartee :", sci, c and c["licence"])
            continue
        loc = page.locator(f'.pkdx-card[data-sci="{sci}"]')
        loc.scroll_into_view_if_needed()
        page.wait_for_function("s => { const i = document.querySelector(`.pkdx-card[data-sci=\"${s}\"] img`); return i && i.complete && i.naturalWidth > 0; }", arg=sci, timeout=20000)
        page.wait_for_timeout(300)
        nom = "carte-" + sci.replace(" ", "-") + ".png"
        loc.screenshot(path=str(OUT / nom))
        gardees.append({**c, "fichier": nom})
    (OUT / "cartes-gardees.json").write_text(json.dumps(gardees, ensure_ascii=False, indent=1), encoding="utf-8")
    ims = [Image.open(OUT / c["fichier"]).convert("RGB") for c in gardees]
    if ims:
        print("taille d'une carte :", ims[0].size)
        pl = Image.new("RGB", (sum(i.width + 10 for i in ims), ims[0].height), "#ffffff")
        x = 0
        for i in ims:
            pl.paste(i, (x, 0))
            x += i.width + 10
        pl.save(OUT / "planche-cartes.png")
        print([(c["nom"], c["licence"]) for c in gardees])

    # 2. La carte : la couche de la ligue, chaque cochage a sa place, la France
    onglet(page, "Carte")
    ferme_guides(page)
    page.locator("button:visible", has_text="La ligue").first.click()
    page.wait_for_timeout(1500)
    page.locator("button:visible", has_text=re.compile("^\\s*Ligue")).first.click()
    page.wait_for_timeout(1000)
    page.evaluate("() => { const b = document.getElementById('mapMineShowAllObs'); if (b && !b.checked) b.click(); }")
    page.wait_for_timeout(1500)
    page.mouse.click(768, 557)   # la France, au milieu de la carte d'Europe
    page.wait_for_timeout(4000)
    page.screenshot(path=str(OUT / "2-carte-france.png"))

    # Plein cadre : la vraie carte agrandie a 1920 x 1080, sans ses commandes. Zoom 1 : sous le
    # zoom 0,85 du site, les tuiles se recollent avec des joints blancs (vu le 2026-10-02).
    page.add_style_tag(content="""
      body { zoom: 1 !important; }
      body * { visibility: hidden; }
      #mapEl, #mapEl * { visibility: visible; }
      #mapEl { position: fixed !important; left: 0 !important; top: 0 !important; width: 1920px !important;
               height: 1080px !important; z-index: 99999 !important; border-radius: 0 !important; margin: 0 !important; }
      #mapEl .leaflet-control-container, #mapEl .leaflet-control-container *, #mapEl .leaflet-tooltip-pane, #mapEl .leaflet-tooltip-pane *,
      #mapEl .leaflet-popup-pane, #mapEl .leaflet-popup-pane * { visibility: hidden !important; }
      #mapEl > :not(.leaflet-pane):not(.leaflet-control-container), #mapEl > :not(.leaflet-pane):not(.leaflet-control-container) * { visibility: hidden !important; }
      #demoBandeau { display: none !important; }
    """)
    page.evaluate("window.dispatchEvent(new Event('resize'))")
    page.wait_for_timeout(1500)
    # France au centre-droit : la phrase et le compteur occupent la gauche du cadre
    page.mouse.move(800, 200)
    page.mouse.down()
    page.mouse.move(1040, 200, steps=12)
    page.mouse.up()
    page.mouse.move(5, 5)
    page.wait_for_timeout(7000)   # les tuiles
    page.screenshot(path=str(OUT / "3-plein-cadre.png"))

    # Chaque anneau seul, sur fond transparent, pour le faire arriver dans le film
    marqueurs = page.evaluate("""() => [...document.querySelectorAll('#mapEl .leaflet-marker-icon')].map((e, i) => {
        e.dataset.film = i; const r = e.getBoundingClientRect();
        return { i, x: r.x, y: r.y, w: r.width, h: r.height, n: parseInt(e.textContent) || 1 }; })""")
    print(len(marqueurs), "anneaux ; somme des nombres :", sum(m["n"] for m in marqueurs))
    sans = page.add_style_tag(content="#mapEl .leaflet-marker-pane, #mapEl .leaflet-marker-pane * { visibility: hidden !important; }")
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUT / "carte-fond.png"))
    sans.evaluate("e => e.remove()")
    page.add_style_tag(content="""
      html, body, #mapEl, .leaflet-container { background: transparent !important; }
      #mapEl .leaflet-tile-pane, #mapEl .leaflet-tile-pane *, #mapEl .leaflet-overlay-pane, #mapEl .leaflet-overlay-pane * { visibility: hidden !important; }
    """)
    for m in marqueurs:
        # l'opacite et non la visibilite : les enfants de l'icone ont leur propre « visible »
        page.evaluate("""(i) => document.querySelectorAll('#mapEl .leaflet-marker-icon').forEach(e => {
            e.style.setProperty('opacity', e.dataset.film == i ? '1' : '0', 'important'); })""", m["i"])
        marge = 4
        m["fichier"] = f"anneau-{m['i']}.png"
        page.screenshot(path=str(OUT / m["fichier"]), omit_background=True,
                        clip={"x": m["x"] - marge, "y": m["y"] - marge, "width": m["w"] + 2 * marge, "height": m["h"] + 2 * marge})
        m.update(x=m["x"] - marge, y=m["y"] - marge, w=m["w"] + 2 * marge, h=m["h"] + 2 * marge)
    (OUT / "anneaux.json").write_text(json.dumps(marqueurs, ensure_ascii=False, indent=1), encoding="utf-8")
    nav.close()
