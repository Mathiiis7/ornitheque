"""Film v2 : la vraie fiche d'une espece vue par les amis et pas par Alex, ouverte depuis Qui a vu quoi.
Une fenetre tres haute montre le tiroir entier sans defilement, en une seule image : l'onglet Info, le bloc
« Ou et quand » pour l'annee et chaque mois, l'onglet Sons. Le serveur doit tourner sur 8765.

    .onetake/venv/Scripts/python.exe outils/onetake/v2-fiche.py

Sortie dans .onetake/v2/fiche/ : info.png, mois-*.png, sons.png, fiche.json.
"""
import json, pathlib, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import demo199, photos_libres

URL = "http://127.0.0.1:8765/demo/"
OUT = pathlib.Path(".onetake/v2/fiche")
OUT.mkdir(parents=True, exist_ok=True)
NOM = "Accenteur alpin"
RECT = "const R = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };"
# Les pastilles : les plus petits elements du bloc dont le texte est un mois, ou l'annee, avec sa note
PASTILLES = """const pastilles = () => { const b = document.getElementById('smRarityMap');
  return [...b.querySelectorAll('*')].filter(e => e.offsetParent && /^(ANNÉE|année|janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\\s*\\d*$/i.test(e.textContent.trim().replace(/\\s+/g, ' ')) && ![...e.children].some(c => /^(ANNÉE|année|janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\\s*\\d*$/i.test(c.textContent.trim().replace(/\\s+/g, ' ')))); };"""


def clip(r):
    return {"x": r["x"], "y": r["y"], "width": r["w"], "height": r["h"]}


with sync_playwright() as p:
    nav = p.chromium.launch()
    ctx = nav.new_context(viewport={"width": 1920, "height": 2600}, device_scale_factor=2,
                          user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36")
    demo199.installe(ctx, apres=True)
    journal = []
    photos_libres.installe(ctx, journal)
    page = ctx.new_page()
    erreurs = []
    page.on("pageerror", lambda e: erreurs.append(str(e)[:200]))
    page.goto(URL)
    page.wait_for_timeout(6000)
    page.evaluate("""() => { for (const b of document.querySelectorAll('button')) { const t = b.textContent.trim();
        if (b.offsetParent && (t === '✕' || t === '×')) b.click(); } }""")
    page.add_style_tag(content="#demoBandeau { display:none !important; }")
    page.locator("button:visible", has_text=re.compile(r"^\s*Classement\s*$")).first.click()
    page.wait_for_timeout(2500)
    page.evaluate("""(nom) => { [...document.querySelectorAll('.sp-link')].find(e => e.textContent.trim() === nom).click(); }""", NOM)
    page.wait_for_timeout(7000)
    info = page.evaluate("(() => { " + RECT + PASTILLES + """ const t = document.getElementById('speciesModal');
        return { tiroir: R(t), bloc: R(document.getElementById('smOuQuandCard')), photo: [...t.querySelectorAll('img')].filter(i => i.offsetParent && i.naturalWidth > 200).map(i => i.src)[0],
          sons: R(document.getElementById('smTabSound')), pastilles: pastilles().map(e => ({ t: e.textContent.trim().replace(/\\s+/g, ' '), ...R(e) })) }; })()""")
    print(json.dumps({k: info[k] for k in ("tiroir", "bloc", "photo", "sons")}, ensure_ascii=False), [q["t"] for q in info["pastilles"]])
    page.screenshot(path=str(OUT / "info.png"), clip=clip(info["tiroir"]))
    # Chaque mois : la vraie pastille cliquee, le site recolore sa carte et son graphique
    for k in range(len(info["pastilles"])):
        page.evaluate("(k) => { " + PASTILLES + " pastilles()[k].click(); }", k)
        page.wait_for_timeout(900)
        page.screenshot(path=str(OUT / f"mois-{k:02d}.png"), clip=clip(info["bloc"]))
    page.evaluate("document.getElementById('smTabSound').click()")
    page.wait_for_timeout(6000)
    page.wait_for_function("[...document.querySelectorAll('#speciesModal .xa-bar-sono')].filter(i => i.offsetParent).some(i => i.complete && i.naturalWidth > 0)", timeout=40000)
    page.wait_for_timeout(1500)
    # Pour cette espece le site donne le meme enregistrement au chant et au cri : deux spectrogrammes
    # identiques l'un sous l'autre. Le film montre le chant seul.
    page.evaluate("document.getElementById('smCallRow').hidden = true")
    page.wait_for_timeout(300)
    sons = page.evaluate("(() => { " + RECT + """ const b = [...document.querySelectorAll('#speciesModal .xa-block')].filter(e => e.offsetParent);
        return b.slice(0, 4).map(e => ({ bloc: R(e), texte: e.innerText.replace(/\\s+/g, ' ').slice(0, 160),
          liens: [...e.querySelectorAll('a')].map(a => a.href).slice(0, 4), barre: R(e.querySelector('.xa-bar')), lecture: R(e.querySelector('[data-xa-play]')) })); })()""")
    print(json.dumps(sons, ensure_ascii=False)[:1500])
    page.screenshot(path=str(OUT / "sons.png"), clip=clip(info["tiroir"]))
    (OUT / "fiche.json").write_text(json.dumps({**info, "enregistrements": sons}, ensure_ascii=False, indent=1), encoding="utf-8")
    print("erreurs", erreurs, "bloquees", sorted({a for g, _, a in journal if g == "bloquee"})[:5])
    print("remplacees", sorted({s for g, s, _ in journal if g == "remplacee"}))
    nav.close()
