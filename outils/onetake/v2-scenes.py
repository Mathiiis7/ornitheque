"""Film v2 : les vraies scenes du site, prises image par image (Birdydex a 199, espece debloquee, case
qui se revele, trophee du palier 200). Le serveur doit tourner sur 8765.

    .onetake/venv/Scripts/python.exe outils/onetake/v2-scenes.py [--essai]

Une capture prend 150 ms, un film veut une image toutes les 33 ms : filmer la page en direct saccaderait.
On met donc les animations du site en pause et on les avance soi-meme, image par image : c'est leur
vraie choregraphie, a la bonne vitesse, sans une image perdue. --essai ne prend qu'une image toutes les 0,5 s.
"""
import json, pathlib, re, shutil, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import demo199, photos_libres

URL = "http://127.0.0.1:8765/demo/"
OUT = pathlib.Path(".onetake/v2/scenes")
ESSAI = "--essai" in sys.argv
PAS = 0.5 if ESSAI else 1 / 30
SCI = demo199.NOUVELLE
PAUSE = """() => { document.getAnimations().forEach(a => a.pause()); }"""
DUREE = """() => Math.max(0, ...document.getAnimations().map(a => { const f = a.effect.getComputedTiming().endTime; return isFinite(f) ? f : 0; }))"""
FINIT = """() => document.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} })"""
AVANCE = """(ms) => { document.getAnimations().forEach(a => { a.pause(); a.currentTime = ms; }); }"""


def ferme(page):
    page.evaluate("""() => { for (const b of document.querySelectorAll('button')) { const t = b.textContent.trim();
        if (b.offsetParent && (t === '✕' || t === '×')) b.click(); } }""")
    page.wait_for_timeout(500)


def film(page, nom, max_s=14):
    """Les animations en cours, image par image, jusqu'a leur fin."""
    dossier = OUT / nom
    shutil.rmtree(dossier, ignore_errors=True)
    dossier.mkdir(parents=True)
    page.evaluate(PAUSE)
    page.wait_for_timeout(1500)   # le temps des images de la scene, animations arretees
    page.evaluate(PAUSE)
    fin = min(page.evaluate(DUREE) / 1000, max_s)
    print(nom, "dure", round(fin, 2), "s ;", page.evaluate("document.getAnimations().length"), "animations")
    n, t = 0, 0.0
    while t <= fin + 1e-6:
        page.evaluate(AVANCE, t * 1000)
        page.screenshot(path=str(dossier / f"{n:04d}.jpg"), type="jpeg", quality=92)
        n += 1
        t += PAS
    return {"images": n, "duree": fin}


with sync_playwright() as p:
    nav = p.chromium.launch()
    ctx = nav.new_context(viewport={"width": 1920, "height": 1080},
                          user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36")
    demo199.installe(ctx)
    journal = []
    photos_libres.installe(ctx, journal)
    page = ctx.new_page()
    erreurs = []
    page.on("pageerror", lambda e: erreurs.append(str(e)[:200]))
    page.goto(URL)
    page.wait_for_timeout(6000)
    ferme(page)
    page.add_style_tag(content="#demoBandeau { display:none !important; }")
    page.locator("button:visible", has_text=re.compile(r"^\s*Birdydex\s*$")).first.click()
    page.wait_for_timeout(2500)
    ferme(page)
    OUT.mkdir(parents=True, exist_ok=True)
    page.evaluate(f"""document.querySelector('.pkdx-card[data-sci="{SCI}"]').scrollIntoView({{block:'center'}})""")
    page.wait_for_timeout(3000)
    page.screenshot(path=str(OUT / "birdydex-199.png"))
    info = {"carte": page.evaluate(f"""(() => {{ const r = document.querySelector('.pkdx-card[data-sci="{SCI}"]').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }})()""")}
    page.evaluate(f"""document.querySelector('.pkdx-card[data-sci="{SCI}"]').click()""")
    page.wait_for_timeout(3000)
    page.screenshot(path=str(OUT / "fiche-grise.png"))
    # L'ajout : la vraie scene part de la
    page.evaluate("document.getElementById('smVuBtn').click()")
    page.wait_for_timeout(900)
    page.screenshot(path=str(OUT / "formulaire.png"))
    # Le formulaire d'ajout : la date du jour suffit, c'est lui qui lance la scene
    page.evaluate("""() => { const d = document.getElementById('manualDate'); if (d && !d.value) { d.value = '2026-05-10'; d.dispatchEvent(new Event('input', {bubbles:true})); d.dispatchEvent(new Event('change', {bubbles:true})); }
        const b = [...document.querySelectorAll('dialog[open] button')].find(x => x.offsetParent && x.textContent.trim() === 'Ajouter'); b.click(); }""")
    page.wait_for_timeout(150)
    print("apres clic :", page.evaluate("""[...document.querySelectorAll('dialog[open], .fut-scene')].map(e => e.tagName + '.' + e.className).join(' | ')"""))
    page.screenshot(path=str(OUT / "apres-clic.png"))
    info["debloque"] = film(page, "debloque")
    # On laisse la scene se finir pour de vrai, puis on la ferme : le Birdydex montre sa case
    page.evaluate(FINIT)
    page.wait_for_timeout(800)
    page.screenshot(path=str(OUT / "debloque-fin.png"))
    print("boutons fin :", page.evaluate("[...document.querySelectorAll('.fut-scene button, dialog[open] button')].map(b => b.textContent.trim().slice(0,30))"))
    # Le vrai bouton « Continuer » : fermer autrement laisse la fiche ouverte et bloque la suite
    page.evaluate("document.querySelector('#debloqueScene .debloque-ok').click()")
    page.wait_for_timeout(300)
    print("etat :", page.evaluate("document.body.innerText.match(/\\d+ espèces vues sur \\d+/)?.[0]"),
          page.evaluate(f"""document.querySelector('.pkdx-card[data-sci="{SCI}"]')?.className"""))
    info["revele"] = film(page, "revele", 5)
    page.evaluate(FINIT)
    page.wait_for_timeout(1000)
    page.screenshot(path=str(OUT / "birdydex-200.png"))
    # Le trophee : sa scene part a l'arrivee sur l'onglet
    # l'onglet porte une pastille depuis le nouveau palier : on le vise par son debut
    page.evaluate("[...document.querySelectorAll('button')].find(b => b.offsetParent && b.textContent.trim().startsWith('Trophées')).click()")
    page.wait_for_timeout(250)
    print("trophee :", page.evaluate("""[...document.querySelectorAll('dialog[open]')].map(e => e.id + ' ' + e.innerText.replace(/\\s+/g,' ').slice(0,160)).join(' | ')"""))
    info["trophee"] = film(page, "trophee")
    page.evaluate(FINIT)
    page.wait_for_timeout(800)
    page.screenshot(path=str(OUT / "trophee-fin.png"))
    print("apres trophee :", page.evaluate("""[...document.querySelectorAll('dialog[open] [data-tro-suite]')].map(e => e.textContent.trim()).join('|')"""))
    (OUT / "scenes.json").write_text(json.dumps(info, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(info))
    print("erreurs :", erreurs)
    print("photos bloquees :", sorted({a for g, _, a in journal if g == "bloquee"}))
    nav.close()
