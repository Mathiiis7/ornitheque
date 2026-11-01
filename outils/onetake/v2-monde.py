"""Film v2 : le vrai selecteur de pays du Birdydex, rangé par continent, et le mur de l'Australie.
Le serveur doit tourner sur 8765.

    .onetake/venv/Scripts/python.exe outils/onetake/v2-monde.py

Sortie dans .onetake/v2/monde/ : monde-liste.png, monde-mur.png, monde.json.
"""
import json, pathlib, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import demo199, photos_libres

URL = "http://127.0.0.1:8765/demo/"
OUT = pathlib.Path(".onetake/v2/monde")
OUT.mkdir(parents=True, exist_ok=True)
PAYS = "Australie"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
CADRE_MUR = {"x": 318, "y": 136, "width": 1284, "height": 944}


def birdydex(ctx):
    page = ctx.new_page()
    page.goto(URL)
    page.wait_for_timeout(6000)
    page.evaluate("""() => { for (const b of document.querySelectorAll('button')) { const t = b.textContent.trim();
        if (b.offsetParent && (t === '✕' || t === '×')) b.click(); } }""")
    page.add_style_tag(content="#demoBandeau { display:none !important; }")
    page.locator("button:visible", has_text=re.compile(r"^\s*Birdydex\s*$")).first.click()
    page.wait_for_timeout(3000)
    page.evaluate("document.getElementById('pkdxPliBtn').click()")
    page.wait_for_timeout(800)
    page.evaluate("document.getElementById('pkdxCountry').click()")
    page.wait_for_timeout(1500)
    return page


with sync_playwright() as p:
    nav = p.chromium.launch()
    journal = []
    # La liste entiere : une fenetre tres haute la montre sans defilement, le film la fait defiler lui-meme
    ctx = nav.new_context(viewport={"width": 1920, "height": 2600}, device_scale_factor=2, user_agent=UA)
    demo199.installe(ctx, apres=True)
    photos_libres.installe(ctx, journal)
    page = birdydex(ctx)
    info = page.evaluate("""(pays) => { const m = document.querySelector('.cp-modal-backdrop').firstElementChild; const c = m.getBoundingClientRect();
        const R = e => { const r = e.getBoundingClientRect(); return { x: r.x - c.x, y: r.y - c.y, w: r.width, h: r.height }; };
        return { modale: { x: c.x, y: c.y, w: c.width, h: c.height }, recherche: R(document.querySelector('.cp-search')),
          pays: [...document.querySelectorAll('.cp-item')].filter(e => e.offsetParent).length,
          cible: R([...document.querySelectorAll('.cp-item')].filter(e => e.offsetParent).find(e => e.textContent.includes(pays))) }; }""", PAYS)
    print(info)
    m = info["modale"]
    page.screenshot(path=str(OUT / "monde-liste.png"), clip={"x": m["x"], "y": m["y"], "width": m["w"], "height": m["h"]})
    ctx.close()

    # Le mur du pays, trie par rarete : les oiseaux qu'Alex connait viennent d'abord, les autres restent a decouvrir
    ctx = nav.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=2, user_agent=UA)
    demo199.installe(ctx, apres=True)
    photos_libres.installe(ctx, journal)
    page = birdydex(ctx)
    page.locator(".cp-item:visible", has_text=PAYS).first.click()
    page.wait_for_timeout(1500)
    page.evaluate("""() => { const b = [...document.querySelectorAll('.cp-modal-backdrop button')].find(x => /[×✕]/.test(x.textContent)); if (b) b.click(); }""")
    page.wait_for_timeout(1000)
    page.evaluate("""[...document.querySelectorAll('button')].find(b => b.offsetParent && b.textContent.trim() === 'Rareté').click()""")
    page.wait_for_timeout(1200)
    page.evaluate("document.getElementById('pkdxPliBtn').click()")
    page.wait_for_timeout(800)
    page.evaluate("window.scrollTo(0, 0)")
    page.mouse.move(5, 5)
    page.wait_for_timeout(7000)
    print(page.evaluate("document.body.innerText.match(/\\d+ espèces vues sur \\d+/)?.[0]"))
    page.screenshot(path=str(OUT / "monde-mur.png"), clip=CADRE_MUR)
    nav.close()
(OUT / "monde.json").write_text(json.dumps({**info, "cadreMur": CADRE_MUR}, ensure_ascii=False, indent=1), encoding="utf-8")
print("bloquees", sorted({a for g, _, a in journal if g == "bloquee"})[:6])
