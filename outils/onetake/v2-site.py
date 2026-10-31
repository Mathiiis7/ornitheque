"""Film v2 : tout ce que les moments 1 et 2 montrent du site, pris sur le site ACTUEL (la demo).
Remplace les prises du 2026-10-01 (composants.py, v2-carte.py) : aucune photo n'est substituee,
les cartes du Birdydex sont celles qu'un visiteur voit. Le serveur doit tourner sur 8765.

    .onetake/venv/Scripts/python.exe outils/onetake/v2-site.py

Sortie dans .onetake/v2/site/ : cartes-birdydex.json (espece, photo, licence), planche, prises.
"""
import json, math, pathlib, re, sys
from PIL import Image
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import demo199, photos_libres

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
    demo199.installe(ctx)   # le film part de 199 : le Martin-pecheur fera le 200e
    photos_libres.installe(ctx)
    page = ctx.new_page()
    page.goto(URL)
    page.wait_for_timeout(6000)
    ferme_guides(page)
    page.screenshot(path=str(OUT / "0-accueil.png"))

    # 1. Le Birdydex : l'espece, la photo reellement affichee, sa licence
    onglet(page, "Birdydex")
    ferme_guides(page)
    page.wait_for_timeout(1500)
    compte = page.evaluate("document.querySelector('#viewBirdydex, #pkdx, body').innerText.match(/\\d+ espèces vues sur \\d+/)?.[0]")
    print(compte)
    total, sur = [int(v) for v in re.findall(r"\d+", compte)]
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
        # La carte seule sur fond transparent : son vrai arrondi et sa vraie bordure viennent du
        # navigateur. La recouper apres coup laissait un liseré du fond de page (Mathis, 2026-10-31).
        seule = page.add_style_tag(content=f"""
          html, body {{ background: transparent !important; }}
          body * {{ visibility: hidden !important; }}
          .pkdx-card[data-sci="{sci}"], .pkdx-card[data-sci="{sci}"] * {{ visibility: visible !important; }}
        """)
        b = loc.bounding_box()
        page.screenshot(path=str(OUT / nom), omit_background=True,
                        clip={"x": b["x"] - 2, "y": b["y"] - 2, "width": b["width"] + 4, "height": b["height"] + 4})
        seule.evaluate("e => e.remove()")
        gardees.append({**c, "fichier": nom})
    (OUT / "cartes-gardees.json").write_text(json.dumps(gardees, ensure_ascii=False, indent=1), encoding="utf-8")
    ims = [Image.open(OUT / c["fichier"]).convert("RGBA") for c in gardees]
    if ims:
        print("taille d'une carte :", ims[0].size)
        pl = Image.new("RGB", (sum(i.width + 10 for i in ims), ims[0].height), "#ff00ff")
        x = 0
        for i in ims:
            pl.paste(i, (x, 0), i)
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
    # Seulement « Vous » : le compteur annonce votre liste, la carte doit montrer la meme chose.
    # Avec toute la ligue, les anneaux totalisaient 1 200 pour un compteur a 212 (Mathis, 2026-10-31).
    print(page.evaluate("""() => { const s = document.getElementById('mapPlayerSel');
        const opts = [...s.options].map(o => [o.value, o.textContent.trim()]);
        const moi = [...s.options].find(o => o.value === 'demo-visiteur');   // le visiteur de la demo, 212 especes
        s.value = moi.value; s.dispatchEvent(new Event('change', { bubbles: true }));
        return { opts, choisi: moi.textContent.trim() }; }"""))
    page.wait_for_timeout(2500)
    # La France APRES le filtre : le filtre remet la carte en vue Europe, sans la France decoupee
    page.mouse.click(768, 557)
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
    # Le compteur du film additionne les anneaux : ils doivent donner le nombre que le site annonce
    if sum(m["n"] for m in marqueurs) != total or total != 199:
        raise SystemExit(f"anneaux {sum(m['n'] for m in marqueurs)}, site {total} : attendu 199 partout")
    (OUT / "compte.json").write_text(json.dumps({"total": total, "sur": sur}), encoding="utf-8")

    # Qui est dans quel anneau : une photo doit surgir la ou l'oiseau a ete note, pas ailleurs (un
    # Guepier dans le Nord, Mathis, 2026-10-31). Les tuiles donnent la projection exacte de la carte :
    # une tuile, son z/x/y et sa place a l'ecran suffisent a situer n'importe quel point GPS.
    tuile = page.evaluate("""() => { const t = [...document.querySelectorAll('#mapEl img.leaflet-tile')]
          .find(i => /\\/\\d+\\/\\d+\\/\\d+/.test(i.src)); const r = t.getBoundingClientRect();
        return { src: t.src, x: r.x, y: r.y, w: r.width }; }""")
    z, tx, ty = [int(v) for v in re.search(r"/(\d+)/(\d+)/(\d+)", tuile["src"]).groups()]
    def vers_ecran(la, lo):
        n = 2 ** z
        wx = (lo + 180) / 360 * n
        wy = (1 - math.asinh(math.tan(math.radians(la))) / math.pi) / 2 * n
        return tuile["x"] + (wx - tx) * tuile["w"], tuile["y"] + (wy - ty) * tuile["w"]
    especes = page.evaluate("""async () => { const m = await import('/demo/donnees.js');
        return m.DONNEES['leagues/merlin-bird/members/demo-visiteur'].species; }""")
    for m in marqueurs:
        m["especes"] = []
    hors = 0
    for e in especes:
        if e.get("la") is None or e.get("co") != "FR":
            hors += 1
            continue
        x, y = vers_ecran(e["la"], e["lo"])
        proche = min(marqueurs, key=lambda m: math.hypot(m["x"] + m["w"] / 2 - x, m["y"] + m["h"] / 2 - y))
        proche["especes"].append({"sci": e["k"], "nom": e["c"], "lieu": e["l"]})
    ecarts = [(m["n"], len(m["especes"])) for m in marqueurs if m["n"] != len(m["especes"])]
    print("especes rattachees :", sum(len(m["especes"]) for m in marqueurs), "| hors France ou sans GPS :", hors,
          "| anneaux dont le nombre differe (ecrit, calcule) :", ecarts)
    for sci in CANDIDATES:
        ou = [(round(m["x"]), round(m["y"]), e["lieu"]) for m in marqueurs for e in m["especes"] if e["sci"] == sci]
        print(" ", sci, ou)
    sans = page.add_style_tag(content="#mapEl .leaflet-marker-pane, #mapEl .leaflet-marker-pane * { visibility: hidden !important; }")
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUT / "carte-fond.png"))
    sans.evaluate("e => e.remove()")
    page.add_style_tag(content="""
      html, body, #mapEl, .leaflet-container { background: transparent !important; }
      /* Tous les plans sauf celui des anneaux : le voile qui eclaircit l'etranger a son propre plan, et
         il restait colle dans les images des anneaux de la cote, en carre pale (vu le 2026-10-31). */
      #mapEl .leaflet-pane:not(.leaflet-map-pane):not(.leaflet-marker-pane),
      #mapEl .leaflet-pane:not(.leaflet-map-pane):not(.leaflet-marker-pane) * { visibility: hidden !important; }
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
        # un anneau est rond : ses quatre coins doivent etre vides, sinon un voile est reste colle
        a = Image.open(OUT / m["fichier"]).convert("RGBA")
        coins = [a.getpixel(c)[3] for c in [(1, 1), (a.width - 2, 1), (1, a.height - 2), (a.width - 2, a.height - 2)]]
        if max(coins) > 0:
            raise SystemExit(f"anneau {m['i']} : coins non transparents {coins}")
    (OUT / "anneaux.json").write_text(json.dumps(marqueurs, ensure_ascii=False, indent=1), encoding="utf-8")
    nav.close()
