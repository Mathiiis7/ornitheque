# Film v2, moment 2 : la carte SANS ses points (fond de tuiles) et la position/couleur de chaque
# point de la demo, lues dans la page. Lancer depuis la racine :
#   .onetake/venv/Scripts/python.exe outils/onetake/v2-carte.py
import json, pathlib, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import pilote as P

OUT = pathlib.Path(".onetake/v2"); OUT.mkdir(exist_ok=True)

with sync_playwright() as p:
    nav, page, subs = P.ouvre(p)
    P.onglet(page, "Carte")
    page.wait_for_timeout(4000)
    # tous les cochages, pas seulement ceux de la selection
    page.evaluate("""() => { const c=[...document.querySelectorAll('input[type=checkbox]')]
        .find(x => x.parentElement && /tous les cochages/i.test(x.parentElement.textContent));
        if (c && !c.checked) c.click(); }""")
    page.wait_for_timeout(3000)
    # zoom 1 : sous le zoom 0,85 du site, les tuiles se recollent avec des joints blancs visibles
    page.evaluate("document.body.style.zoom = '1'; window.dispatchEvent(new Event('resize'))")
    page.wait_for_timeout(6000)
    info = page.evaluate("""() => {
        const m = document.querySelector('.leaflet-container');
        const r = m.getBoundingClientRect();
        const pts = [...m.querySelectorAll('path.leaflet-interactive, .leaflet-marker-icon')].map(e => {
            const b = e.getBoundingClientRect();
            return { x: b.x + b.width/2 - r.x, y: b.y + b.height/2 - r.y, w: b.width,
                     fill: e.getAttribute('fill') || getComputedStyle(e).backgroundColor, tag: e.tagName, cls: e.getAttribute('class')||'' };
        });
        return { rect: { x: r.x, y: r.y, w: r.width, h: r.height }, pts };
    }""")
    print("points lus :", len(info["pts"]), info["rect"])
    json.dump(info, open(OUT / "carte-points.json", "w"), indent=1)
    # le fond : plus de points, plus de commandes, plus de legende
    page.add_style_tag(content="""
      .leaflet-overlay-pane, .leaflet-marker-pane, .leaflet-shadow-pane, .leaflet-tooltip-pane,
      .leaflet-popup-pane, .leaflet-control-container, .leaflet-control { visibility: hidden !important; }
      #demoBandeau { display: none !important; }
      #viewMap .legend, .map-legend, .rar-legend { visibility: hidden !important; }
    """)
    page.wait_for_timeout(800)
    page.locator(".leaflet-container").screenshot(path=str(OUT / "carte-fond.png"))
    nav.close()

# Joints de tuiles : des lignes claires d'un pixel que le zoom laisse entre deux tuiles. On les
# repere par un saut de luminosite sur toute la largeur, puis on les remplace par la moyenne
# des deux lignes voisines.
import numpy as np
from PIL import Image
im = np.array(Image.open(OUT / "carte-fond.png").convert("RGB")).astype(np.float32)
lum = im.mean(2).mean(1)
saut = lum[1:-1] - (lum[:-2] + lum[2:]) / 2
rows = [i + 1 for i, v in enumerate(saut) if v > 6]
print("joints horizontaux :", rows)
for r in rows:
    for k in (r - 1, r, r + 1):
        pass
    im[r] = (im[r - 1] + im[r + 1]) / 2
Image.fromarray(im.astype(np.uint8)).save(OUT / "carte-fond.png")
print("ok")
