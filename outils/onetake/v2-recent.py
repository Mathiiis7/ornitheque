"""Film v2 : les observations recentes de la Bretagne et une vraie manche du quiz, pris sur la demo.
Le serveur doit tourner sur 8765.

    .onetake/venv/Scripts/python.exe outils/onetake/v2-recent.py

Sortie dans .onetake/v2/recent/ : recent-fond.png, point-*.png, recent-plein.png, quiz-question.png,
quiz-reponse.png, recent.json.
"""
import json, pathlib, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import demo199, photos_libres

URL = "http://127.0.0.1:8765/demo/"
OUT = pathlib.Path(".onetake/v2/recent")
OUT.mkdir(parents=True, exist_ok=True)
CADRE = {"x": 335, "y": 292, "width": 1250, "height": 543}          # la carte et son panneau
CADRE_QUIZ = {"x": 545, "y": 200, "width": 830, "height": 735}      # la manche, de sa barre a sa derniere reponse


def ferme(page):
    page.evaluate("""() => { for (const b of document.querySelectorAll('button')) { const t = b.textContent.trim();
        if (b.offsetParent && (t === '✕' || t === '×')) b.click(); } }""")
    page.wait_for_timeout(400)


def onglet(page, nom):
    page.locator("button:visible", has_text=re.compile(r"^\s*" + nom + r"\s*$")).first.click()
    page.wait_for_timeout(3000)
    ferme(page)


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
    page.goto(URL)
    page.wait_for_timeout(6000)
    ferme(page)
    # 258 px au lieu de 256 : sous le zoom 0,85 du site, les tuiles se recollent avec des joints blancs
    page.add_style_tag(content="""#demoBandeau { display:none !important; }
        #mapEl .leaflet-tile { width: 258px !important; height: 258px !important; }""")

    # 1. La Bretagne, sa couche des observations recentes
    onglet(page, "Carte")
    page.mouse.click(768, 557)
    page.wait_for_timeout(4000)
    page.mouse.click(610, 482)
    page.wait_for_timeout(5000)
    page.locator("button:visible", has_text="Vu récemment").first.click()
    page.wait_for_timeout(5000)
    # la legende couvre un coin de la carte : son vrai bouton la replie
    page.locator("#mapEl button:visible", has_text="Légende").first.click()
    page.mouse.move(5, 5)
    # le panneau annonce « lecture des listes : 91 sur 521... » tant qu'il lit : on attend qu'il ait fini
    for _ in range(120):
        if not page.evaluate("/lecture des listes/.test(document.body.innerText)"):
            break
        page.wait_for_timeout(2000)
    page.wait_for_timeout(4000)
    page.screenshot(path=str(OUT / "recent-plein.png"), clip=CADRE)
    print(page.evaluate("document.body.innerText.match(/\\d+ espèces non observées[^\\n]*/)?.[0]"))
    # les rangees du panneau : ce qui entoure chaque date (« il y a 4 j », « hier »)
    rangees = page.evaluate("""(C) => { const vus = new Set(), sortie = [];
        for (const e of document.querySelectorAll('body *')) {
          if (e.children.length || !e.offsetParent || !/^(il y a \\d+ ?j|hier|aujourd'hui)/i.test(e.textContent.trim())) continue;
          let l = e; while (l && l.getBoundingClientRect().width < 280) l = l.parentElement;
          const r = l.getBoundingClientRect();
          if (vus.has(l) || r.x < C.x + 880 || r.y > C.y + C.height) continue;
          vus.add(l); sortie.push({ x: r.x - C.x, y: r.y - C.y, w: r.width, h: Math.min(r.height, C.y + C.height - r.y) });
        }
        return sortie; }""", CADRE)
    print(len(rangees), "rangees")
    points = page.evaluate("""(C) => [...document.querySelectorAll('#mapEl .leaflet-marker-icon')].map((e, i) => { e.dataset.film = i;
        const r = e.getBoundingClientRect(); return { i, x: r.x - C.x, y: r.y - C.y, w: r.width, h: r.height }; })""", CADRE)
    fond = page.add_style_tag(content="#mapEl .leaflet-marker-pane { visibility: hidden !important; }")
    page.wait_for_timeout(300)
    page.screenshot(path=str(OUT / "recent-fond.png"), clip=CADRE)
    fond.evaluate("e => e.remove()")
    for q in points:
        st = page.add_style_tag(content=f"""html, body {{ background: transparent !important; }} body * {{ visibility: hidden !important; }}
            #mapEl .leaflet-marker-icon[data-film="{q['i']}"], #mapEl .leaflet-marker-icon[data-film="{q['i']}"] * {{ visibility: visible !important; }}""")
        page.wait_for_timeout(60)
        m = 3
        page.screenshot(path=str(OUT / f"point-{q['i']}.png"), omit_background=True,
                        clip={"x": CADRE["x"] + q["x"] - m, "y": CADRE["y"] + q["y"] - m, "width": q["w"] + 2 * m, "height": q["h"] + 2 * m})
        st.evaluate("e => e.remove()")
        q.update(x=q["x"] - m, y=q["y"] - m, w=q["w"] + 2 * m, h=q["h"] + 2 * m)
    print(len(points), "points")

    # 2. Le quiz : une manche ou le premier choix est le bon, pour que la fleche clique juste. Le tirage
    # est au hasard : on recommence jusqu'a la tomber, le site n'annonce la reponse qu'apres le clic.
    quiz = None
    for essai in range(30):
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
        page.evaluate("document.querySelector('[data-pc-retour]')?.click()")
        page.wait_for_timeout(800)
    if not quiz:
        raise SystemExit("aucune manche ou le premier choix est le bon")
    (OUT / "recent.json").write_text(json.dumps({"cadre": CADRE, "points": points, "rangees": rangees, "cadreQuiz": CADRE_QUIZ, "quiz": quiz}, ensure_ascii=False, indent=1), encoding="utf-8")
    print("erreurs", erreurs, "bloquees", sorted({a for g, _, a in journal if g == "bloquee"})[:5])
    nav.close()
