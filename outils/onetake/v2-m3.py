"""Film v2, moment 3 : le Classement, Qui a vu quoi et les Trophees pris morceau par morceau sur le
site actuel (la demo), plus la fin du moment 2 pour y raccorder. Le serveur doit tourner sur 8765 et
.onetake/film2/ doit etre assemble. Sortie dans .onetake/v2/m3/.

    .onetake/venv/Scripts/python.exe outils/onetake/v2-m3.py
"""
import json, pathlib, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import demo199

URL = "http://127.0.0.1:8765/demo/"
OUT = pathlib.Path(".onetake/v2/m3")
OUT.mkdir(parents=True, exist_ok=True)
SEUL = """html, body {{ background: transparent !important; }} body * {{ visibility: hidden !important; }}
  {sel}, {sel} * {{ visibility: visible !important; }} {plus}"""


def ferme(page):
    page.evaluate("""() => { for (const b of document.querySelectorAll('button')) { const t = b.textContent.trim();
        if (b.offsetParent && (t === '✕' || t === '×')) b.click(); } }""")
    page.wait_for_timeout(500)


def onglet(page, nom):
    page.locator("button:visible", has_text=re.compile("^\\s*" + nom + "\\s*$")).first.click()
    page.wait_for_timeout(2500)


def seul(page, sel, chemin, clip, plus=""):
    """Une partie de la page seule, sur fond transparent : son arrondi vient du navigateur."""
    st = page.add_style_tag(content=SEUL.format(sel=sel, plus=plus))
    page.wait_for_timeout(150)
    page.screenshot(path=str(OUT / chemin), omit_background=True, clip=clip)
    st.evaluate("e => e.remove()")


def ouvre(ctx):
    page = ctx.new_page()
    page.goto(URL)
    page.wait_for_timeout(6000)
    ferme(page)
    return page


with sync_playwright() as p:
    nav = p.chromium.launch()
    ctx = nav.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=2,
                          user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36")
    # Le classement et Qui a vu quoi viennent apres l'ajout du Martin-pecheur dans le film : le site lui-meme montre 200
    demo199.installe(ctx, apres=True)
    # --- 1. Le classement : l'entete et chaque ligne, sans rang ni nombre (la composition les ecrit)
    page = ouvre(ctx)
    onglet(page, "Classement")
    ferme(page)
    t = page.evaluate("""() => { const t = document.querySelector('table.board-sheet'); t.scrollIntoView({block:'center'});
        const r = t.getBoundingClientRect(), R = e => { const b = e.getBoundingClientRect(); return {x:b.x-r.x, y:b.y-r.y, w:b.width, h:b.height}; };
        return { x:r.x, y:r.y, w:r.width, h:r.height, entete:R(t.rows[0]), lignes:[...t.rows].slice(1).map((l,i) => { l.dataset.film=i;
            const sc=l.querySelector('.board-score'), ec=l.querySelector('.board-ecart'), g=ec.querySelector('i');
            return { i, nom:l.querySelector('.who-name').textContent.trim(), n:parseInt(sc.textContent), moi:l.classList.contains('board-moi'), ...R(l), rang:R(l.cells[0]), rangTxt:l.cells[0].textContent.trim(), score:R(sc), ecart:R(ec), jauge:ec.querySelector('i').style.width,
              jaugeCoul:getComputedStyle(g).backgroundColor, fondEcart:getComputedStyle(ec).backgroundColor }; }),
          styleNb:(s=>[s.fontSize,s.fontWeight,s.color])(getComputedStyle(t.querySelector('.board-score'))), styleRang:(s=>[s.fontSize,s.fontWeight,s.color])(getComputedStyle(t.querySelector('.c-rank'))) }; }""")
    page.wait_for_timeout(1500)
    clip = lambda r: {"x": t["x"] + r["x"], "y": t["y"] + r["y"], "width": r["w"], "height": r["h"]}
    seul(page, "table.board-sheet", "table-plein.png", clip({"x": 0, "y": 0, "w": t["w"], "h": t["h"]}))
    seul(page, "table.board-sheet tr:first-child", "table-entete.png", clip(t["entete"]))
    for l in t["lignes"]:
        sel = f'table.board-sheet tr[data-film="{l["i"]}"]'
        # meme selecteur que la regle qui rend la ligne visible, sinon il perd : les nombres sortaient en double
        vide = f"{sel} .c-rank {{ color: transparent !important; }} {sel} .board-score, {sel} .board-score * {{ visibility: hidden !important; }}"
        seul(page, sel, f'ligne-{l["i"]}.png', clip(l), vide)
    # --- 2. Qui a vu quoi : la grille pleine et la grille sans ses cases, plus la place de chaque case
    g = page.evaluate("""() => { const t=[...document.querySelectorAll('table')].find(x=>/SAMIR/i.test(x.rows[0].innerText)&&/ESPÈCE/i.test(x.rows[0].innerText));
        t.dataset.film='grille'; t.scrollIntoView({block:'start'}); window.scrollBy(0,-20); return true; }""")
    page.wait_for_timeout(2500)
    g = page.evaluate("""() => { const t=document.querySelector('table[data-film=grille]'), r=t.getBoundingClientRect(); const N=13; const rows=[...t.rows].slice(0,N); const last=rows[N-1].getBoundingClientRect();
        return { x:r.x, y:r.y, w:r.width, h:last.bottom-r.y, noms:[...rows[0].cells].map(c=>c.textContent.trim()),
          cases:rows.slice(1).flatMap((l,i)=>[...l.cells].map((c,j)=>{const b=c.getBoundingClientRect(); return {l:i,c:j,x:b.x-r.x,y:b.y-r.y,w:b.width,h:b.height,vu:c.classList.contains('is-seen')};}).filter(c=>c.c>0)) }; }""")
    page.wait_for_timeout(1500)
    cg = {"x": g["x"], "y": g["y"], "width": g["w"], "height": g["h"]}
    seul(page, "table[data-film=grille]", "grille-pleine.png", cg)
    seul(page, "table[data-film=grille]", "grille-vide.png", cg,
         "table[data-film=grille] td.pcol.is-seen { background: transparent !important; } table[data-film=grille] td.pcol .case-drap, table[data-film=grille] td.pcol .case-drap * { visibility: hidden !important; }")
    # --- 3. Les trophees : la page telle quelle, carte Marco Polo verrouillee
    page.close()

    def trophees(ctx_page, nom):
        onglet(ctx_page, "Trophées")
        ferme(ctx_page)
        ctx_page.wait_for_timeout(2500)
        ctx_page.add_style_tag(content="#demoBandeau, .demo-bandeau { display:none !important; }")
        info = ctx_page.evaluate("""() => { const e=[...document.querySelectorAll('.tro-family')].find(x=>x.querySelector('.tro-fam-cup img')?.src.includes('marcopolo'));
            const r=e.getBoundingClientRect(); const bars=[...e.querySelectorAll('*')].filter(x=>{const b=x.getBoundingClientRect();return b.height>0&&b.height<=10&&b.width>100;}).map(x=>{const b=x.getBoundingClientRect();return {c:x.className,x:b.x-r.x,y:b.y-r.y,w:b.width,h:b.height,bg:getComputedStyle(x).backgroundColor,im:getComputedStyle(x).backgroundImage.slice(0,60)};});
            return {x:r.x,y:r.y,w:r.width,h:r.height,cl:e.className,tier:e.style.getPropertyValue('--tier-color'),texte:e.innerText.replace(/\\s+/g,' ').slice(0,120),bars}; }""")
        ctx_page.screenshot(path=str(OUT / f"page-trophees-{nom}.png"))
        ctx_page.evaluate("""() => [...document.querySelectorAll('.tro-family')].find(x => x.querySelector('.tro-fam-cup img')?.src.includes('marcopolo')).dataset.film = 'mp'""")
        seul(ctx_page, ".tro-family[data-film=mp]", f"carte-mp-{nom}.png",
             {"x": info["x"] - 2, "y": info["y"] - 2, "width": info["w"] + 4, "height": info["h"] + 4})
        print(nom, json.dumps({k: info[k] for k in ("cl", "tier", "texte", "x", "y", "w", "h")}, ensure_ascii=False))
        return info

    page = ouvre(ctx)
    troph_a = trophees(page, "avant")
    page.close()
    # Le meme ecran apres un deuxieme pays : une observation d'Alex passe en Espagne, le temps de cette
    # prise seulement. C'est le site lui-meme qui dessine la carte gagnee, rien n'est retouche.
    def route(r):
        corps = r.fetch().text()
        i = corps.index('"name":"Alex"')
        j = corps.index('"co":"FR"', i)
        r.fulfill(body=corps[:j] + '"co":"ES"' + corps[j + 9:], content_type="text/javascript")
    ctx2 = nav.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=2, user_agent=ctx.pages[0].evaluate("navigator.userAgent") if ctx.pages else None)
    ctx2.route("**/demo/donnees.js*", route)
    page = ouvre(ctx2)
    troph_b = trophees(page, "apres")
    page.close()
    # --- 4. La fin du moment 2 : la carte, le logo et le nom, separes
    page = nav.new_page(viewport={"width": 1920, "height": 1080})
    page.goto((pathlib.Path(".onetake/film2/comp.html").resolve()).as_uri())
    page.evaluate("window.__ready")
    page.wait_for_timeout(1500)
    def toile(js, nom):
        # une capture et non toDataURL : en file://, le navigateur refuse d'exporter une toile peinte d'images
        page.add_style_tag(content="html, body { background: transparent !important; }")
        page.evaluate(js + "; 0")
        page.wait_for_timeout(200)
        page.screenshot(path=str(OUT / nom), omit_background=True)
    toile("dessinePhrase=()=>{};dessineCompteur=()=>{};dessineLogo=()=>{};dessineNom=()=>{};seek(15.5)", "carte-nue.png")
    page.goto((pathlib.Path(".onetake/film2/comp.html").resolve()).as_uri())
    page.evaluate("window.__ready")
    page.wait_for_timeout(1500)
    toile("ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,1920,1080);dessineLogo(15.5);dessineNom(15.5)", "logo-nom.png")
    nav.close()

(OUT / "m3.json").write_text(json.dumps({"table": t, "grille": g, "tropheeAvant": troph_a, "tropheeApres": troph_b}, ensure_ascii=False, indent=1), encoding="utf-8")
print("lignes :", [(l["nom"], l["n"], l["jauge"], l["moi"]) for l in t["lignes"]], t["styleNb"], t["styleRang"])
print("barres trophee :", troph_a["bars"])
print("cases :", len(g["cases"]), "colonnes :", g["noms"])
