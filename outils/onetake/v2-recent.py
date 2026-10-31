"""Film v2 : les observations recentes de la Bretagne et une vraie manche du quiz, pris sur la demo.
Le serveur doit tourner sur 8765.

    .onetake/venv/Scripts/python.exe outils/onetake/v2-recent.py

Sortie dans .onetake/v2/recent/ : recent-panneau.png, recent-fond.png, point-*.png, quiz-question.png,
quiz-reponse.png, recent.json.
"""
import json, pathlib, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import demo199, photos_libres

URL = "http://127.0.0.1:8765/demo/"
OUT = pathlib.Path(".onetake/v2/recent")
OUT.mkdir(parents=True, exist_ok=True)
PANNEAU = {"x": 1236, "y": 292, "width": 349, "height": 543}        # le panneau de droite, a sa place sur le site
CARTE = {"w": 1369, "h": 834}                                       # la carte telle que le film la montre
CADRE_QUIZ = {"x": 545, "y": 200, "width": 830, "height": 735}      # la manche, de sa barre a sa derniere reponse


def ferme(page):
    page.evaluate("""() => { for (const b of document.querySelectorAll('button')) { const t = b.textContent.trim();
        if (b.offsetParent && (t === '✕' || t === '×')) b.click(); } }""")
    page.wait_for_timeout(400)


def onglet(page, nom):
    page.locator("button:visible", has_text=re.compile(r"^\s*" + nom + r"\s*$")).first.click()
    page.wait_for_timeout(3000)
    ferme(page)


def ouvre(page):
    page.goto(URL)
    page.wait_for_timeout(6000)
    ferme(page)
    page.add_style_tag(content="#demoBandeau { display:none !important; }")


with sync_playwright() as p:
    nav = p.chromium.launch()
    ctx = nav.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=2,
                          user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36")
    demo199.installe(ctx, apres=True)
    journal = []
    photos_libres.installe(ctx, journal)
    page = ctx.new_page()
    erreurs = []
    page.on("pageerror", lambda e: erreurs.append(str(e)[:200]))
    ouvre(page)

    # 1. La Bretagne, sa couche des observations recentes
    onglet(page, "Carte")
    page.mouse.click(768, 557)
    page.wait_for_timeout(4000)
    page.mouse.click(610, 482)
    page.wait_for_timeout(5000)
    page.locator("button:visible", has_text="Vu récemment").first.click()
    page.mouse.move(5, 5)
    page.wait_for_timeout(2000)
    # le panneau annonce « lecture des listes : 91 sur 521... » tant qu'il lit : on attend qu'il ait fini
    for _ in range(120):
        if not page.evaluate("/lecture des listes/.test(document.body.innerText)"):
            break
        page.wait_for_timeout(2000)
    page.wait_for_timeout(3000)
    page.screenshot(path=str(OUT / "recent-panneau.png"), clip=PANNEAU)
    print(page.evaluate("document.body.innerText.match(/\\d+ espèces non observées[^\\n]*/)?.[0]"))
    # les rangees du panneau : ce qui entoure chaque date (« il y a 4 j », « hier »)
    rangees = page.evaluate("""(C) => { const vus = new Set(), sortie = [];
        for (const e of document.querySelectorAll('body *')) {
          if (e.children.length || !e.offsetParent || !/^(il y a \\d+ ?j|hier|aujourd'hui)/i.test(e.textContent.trim())) continue;
          let l = e; while (l && l.getBoundingClientRect().width < 280) l = l.parentElement;
          const r = l.getBoundingClientRect();
          if (vus.has(l) || r.x < C.x || r.y > C.y + C.height) continue;
          vus.add(l); sortie.push({ x: r.x - C.x, y: r.y - C.y, w: r.width, h: Math.min(r.height, C.y + C.height - r.y) });
        }
        return sortie; }""", PANNEAU)
    print(len(rangees), "rangees")
    # La carte : hors du zoom 0,85 du site, les tuiles se recollent sans joints blancs (meme remede que le moment 2)
    page.add_style_tag(content=f"""
      body {{ zoom: 1 !important; }}
      body * {{ visibility: hidden; }}
      #mapEl, #mapEl * {{ visibility: visible; }}
      #mapEl {{ position: fixed !important; left: 0 !important; top: 0 !important; width: {CARTE['w']}px !important;
               height: {CARTE['h']}px !important; z-index: 99999 !important; border-radius: 0 !important; margin: 0 !important; }}
      #mapEl .leaflet-control-container, #mapEl .leaflet-control-container *, #mapEl .leaflet-tooltip-pane, #mapEl .leaflet-tooltip-pane *,
      #mapEl .leaflet-popup-pane, #mapEl .leaflet-popup-pane * {{ visibility: hidden !important; }}
      #mapEl > :not(.leaflet-pane):not(.leaflet-control-container), #mapEl > :not(.leaflet-pane):not(.leaflet-control-container) * {{ visibility: hidden !important; }}
    """)
    page.evaluate("window.dispatchEvent(new Event('resize'))")
    page.wait_for_timeout(1500)
    # Un petit glissement : le voile de l'exterieur ne se redessine qu'au deplacement, il laissait un rectangle pale
    page.mouse.move(700, 400)
    page.mouse.down()
    page.mouse.move(660, 400, steps=8)
    page.mouse.up()
    page.mouse.move(5, 5)
    page.wait_for_timeout(8000)
    points = page.evaluate("""() => [...document.querySelectorAll('#mapEl .leaflet-marker-icon')].map((e, i) => { e.dataset.film = i;
        const r = e.getBoundingClientRect(); return { i, x: r.x, y: r.y, w: r.width, h: r.height }; })""")
    clip_carte = {"x": 0, "y": 0, "width": CARTE["w"], "height": CARTE["h"]}
    fond = page.add_style_tag(content="#mapEl .leaflet-marker-pane, #mapEl .leaflet-marker-pane * { visibility: hidden !important; }")
    page.wait_for_timeout(300)
    page.screenshot(path=str(OUT / "recent-fond.png"), clip=clip_carte)
    fond.evaluate("e => e.remove()")
    page.add_style_tag(content="""html, body, #mapEl, .leaflet-container { background: transparent !important; }
      #mapEl .leaflet-pane:not(.leaflet-map-pane):not(.leaflet-marker-pane), #mapEl .leaflet-pane:not(.leaflet-map-pane):not(.leaflet-marker-pane) * { visibility: hidden !important; }""")
    for f in OUT.glob("point-*.png"):
        f.unlink()
    for q in points:
        page.evaluate("""(i) => document.querySelectorAll('#mapEl .leaflet-marker-icon').forEach(e => {
            e.style.setProperty('opacity', e.dataset.film == i ? '1' : '0', 'important'); })""", q["i"])
        m = 4
        page.screenshot(path=str(OUT / f"point-{q['i']}.png"), omit_background=True,
                        clip={"x": q["x"] - m, "y": q["y"] - m, "width": q["w"] + 2 * m, "height": q["h"] + 2 * m})
        q.update(x=q["x"] - m, y=q["y"] - m, w=q["w"] + 2 * m, h=q["h"] + 2 * m)
    print(len(points), "points")

    # 2. Le quiz : une manche ou le premier choix est le bon, pour que la fleche clique juste. Le tirage est au
    # hasard et le site n'annonce la reponse qu'apres le clic : on recharge la page jusqu'a la tomber. Quitter
    # une manche pour en relancer une bloquait le site (2026-10-31).
    quiz = None
    for essai in range(40):
        ouvre(page)
        onglet(page, "Quiz")
        page.locator("button:visible", has_text="Chant vers nom").first.click()
        page.wait_for_timeout(1200)
        page.locator("button:visible", has_text="C'est parti").first.click()
        page.wait_for_timeout(3500)
        page.mouse.move(5, 5)
        page.wait_for_timeout(500)   # le survol de la derniere reponse s'efface en fondu
        page.screenshot(path=str(OUT / "quiz-question.png"), clip=CADRE_QUIZ)
        info = page.evaluate("""(C) => { const R = e => { const r = e.getBoundingClientRect(); return { x: r.x - C.x, y: r.y - C.y, w: r.width, h: r.height }; };
            const m = document.body.innerText.match(/Chant n° [^\\n]*/);
            return { chant: m && m[0], lecture: R(document.getElementById('pcPlay')), choix: [...document.querySelectorAll('.pc-reponse')].map(b => ({ nom: b.innerText.trim(), ...R(b) })) }; }""", CADRE_QUIZ)
        page.evaluate("document.querySelector('.pc-reponse').click()")
        page.wait_for_timeout(1100)
        if page.evaluate("document.querySelector('.pc-reponse').classList.contains('correct')"):
            page.mouse.move(5, 5)
            page.wait_for_timeout(300)
            page.screenshot(path=str(OUT / "quiz-reponse.png"), clip=CADRE_QUIZ)
            quiz = info
            print("manche trouvee a l'essai", essai + 1, info["chant"], [c["nom"] for c in info["choix"]])
            break
    if not quiz:
        raise SystemExit("aucune manche ou le premier choix est le bon")
    (OUT / "recent.json").write_text(json.dumps({"panneau": PANNEAU, "carte": CARTE, "points": points, "rangees": rangees, "cadreQuiz": CADRE_QUIZ, "quiz": quiz}, ensure_ascii=False, indent=1), encoding="utf-8")
    print("erreurs", erreurs, "bloquees", sorted({a for g, _, a in journal if g == "bloquee"})[:5])
    nav.close()
