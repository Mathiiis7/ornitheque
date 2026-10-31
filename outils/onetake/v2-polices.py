"""Film v2 : planche des polices candidates, sur le vrai logo, la vraie phrase et la vraie carte.
Toutes sous licence OFL, donc embarquables dans le film. Lancer depuis la racine :

    .onetake/venv/Scripts/python.exe outils/onetake/v2-polices.py
"""
import pathlib
from playwright.sync_api import sync_playwright

R = pathlib.Path(".").resolve()
FONTS = R / ".claude/skills/onetake/looks/fonts"
SORTIE = R / ".onetake/v2/planche-polices.png"
CANDIDATES = [
    ("A", "Source Serif 4", "la police des titres du site", (R / "assets/fonts/SourceSerif4-Bold.woff2"), 700),
    ("B", "Fraunces", "une serif plus chaleureuse, plus de caractère", FONTS / "Fraunces.ttf", 600),
    ("C", "Archivo", "sans empattements, plus nerveuse", FONTS / "Archivo.ttf", 700),
]
faces = "".join(
    f"@font-face{{font-family:'P{k}';src:url('{p.as_uri()}');font-weight:100 900}}" for k, _, _, p, _ in CANDIDATES)
colonnes = ""
for k, nom, angle, _, g in CANDIDATES:
    f = f"font-family:'P{k}';font-weight:{g}"
    colonnes += f"""
    <section>
      <p class="tag">{k} - {nom} <span>{angle}</span></p>
      <div class="ouv"><img src="{(R / 'assets/logos/logo.svg').as_uri()}"><b style="{f}">L’Ornithèque</b></div>
      <div class="carte" style="background-image:url('{(R / '.onetake/v2/carte-fond.png').as_uri()}')">
        <div class="voile"></div>
        <h1 style="{f}">Note chaque<br>oiseau que<br><em>tu vois.</em></h1>
        <div class="cpt"><b style="{f}">212</b><i style="{f}">/ 467</i></div>
      </div>
    </section>"""
HTML = f"""<!doctype html><meta charset="utf-8"><style>{faces}
  *{{box-sizing:border-box}} body{{margin:0;background:#fff;width:2100px;padding:20px;display:flex;gap:20px;font-family:'Segoe UI',sans-serif}}
  section{{width:673px}} .tag{{font-size:26px;font-weight:700;color:#15201e;margin:0 0 12px}} .tag span{{display:block;font-weight:400;font-size:20px;color:#616966}}
  .ouv{{height:220px;background:#eef2f1;display:flex;align-items:center;gap:22px;padding:0 30px}} .ouv img{{width:130px}} .ouv b{{font-size:70px;color:#15201e;white-space:nowrap}}
  .carte{{position:relative;margin-top:8px;height:378px;background-size:cover;background-position:center;overflow:hidden}}
  .voile{{position:absolute;inset:0;background:linear-gradient(90deg,rgba(238,242,241,.78),rgba(238,242,241,.5) 28%,rgba(238,242,241,0) 52%)}}
  h1{{position:absolute;left:26px;top:30px;margin:0;font-size:50px;line-height:1.1;color:#15201e}} em{{font-style:normal;color:#0b7c77}}
  .cpt{{position:absolute;left:26px;bottom:18px;color:#0b7c77}} .cpt b{{font-size:60px}} .cpt i{{font-style:normal;font-size:26px;color:#616966;margin-left:8px}}
</style>{colonnes}"""
tmp = R / ".onetake/v2/planche-polices.html"
tmp.write_text(HTML, encoding="utf-8")
with sync_playwright() as p:
    nav = p.chromium.launch()
    page = nav.new_page(viewport={"width": 2100, "height": 720})
    page.goto(tmp.as_uri())
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(800)
    print(page.evaluate("[...document.fonts].map(f => f.family + ' ' + f.status)"))
    page.screenshot(path=str(SORTIE), full_page=True)
    nav.close()
print(SORTIE)
