"""Les materiaux du film : images en pleine resolution, chiffres et textes reels.

Tout sort du mode demo. Rien n'est saisi a la main : le skill onetake pose comme regle que le
contenu montre doit etre la vraie sortie du produit, et un chiffre invente est une promesse que
l'appli n'a jamais faite.

Sortie :
    .onetake/film/donnees.json        chiffres, textes, positions des points
    .onetake/film/assets/*.png|jpg    les images telechargees

    .onetake/venv/Scripts/python.exe outils/onetake/materiaux.py
"""

import json
import pathlib
import re
import sys
import urllib.request

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8765/demo/"
FILM = pathlib.Path(".onetake/film")
ASSETS = FILM / "assets"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36"
)
# L'hirondelle rustique : le fil du film. Une des 304 especes qui ont une carte hebdomadaire.
SCI = "hirundo rustica"
# Meme cle que celle d'app.js : le depot est public et ce jeton ne lit que xeno-canto.
XC_KEY = "a082ff6c2adafb02ea6b275da67cd903988f82ea"


def clique_onglet(page, libelle):
    page.evaluate(
        """(libelle) => {
            const b = [...document.querySelectorAll('button')]
                .find(b => b.textContent.trim() === libelle);
            if (!b) throw new Error('onglet absent : ' + libelle);
            b.click();
        }""",
        libelle,
    )


def telecharge(url, nom):
    """Telecharge une image a cote de la composition. Renvoie le nom de fichier ou None."""
    dest = ASSETS / nom
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return nom
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=40) as r:
            dest.write_bytes(r.read())
        return nom
    except Exception as e:
        print(f"    echec {nom} : {type(e).__name__}")
        return None


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    donnees = {"source": "mode demo, " + URL, "espece": SCI}

    with sync_playwright() as p:
        nav = p.chromium.launch_persistent_context(
            ".onetake/profil",
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=2,
            user_agent=UA,
        )
        page = nav.new_page()
        page.goto(URL)
        page.wait_for_timeout(8000)

        # ---- Le mur du Birdydex : les cartes visibles, avec leur vignette ----
        clique_onglet(page, "📖 Birdydex")
        page.wait_for_timeout(2000)
        page.evaluate(
            """() => {
                const i = document.getElementById('pkdxSearch');
                if (i && i.value) { i.value=''; i.dispatchEvent(new Event('input',{bubbles:true})); }
            }"""
        )
        page.wait_for_timeout(1500)
        page.wait_for_function(
            """() => [...document.querySelectorAll('.pkdx-img img')]
                .filter(i => i.naturalWidth > 0).length >= 20""",
            timeout=40000,
        )
        donnees["mur"] = page.evaluate(
            """() => {
                const cartes = [...document.querySelectorAll('.pkdx-card')].map(c => {
                    const img = c.querySelector('.pkdx-img img');
                    const tier = c.querySelector('.pkdx-tier');
                    return {
                        sci: c.getAttribute('data-sci'),
                        num: (c.querySelector('.pkdx-num')||{}).textContent || '',
                        nom: (c.querySelector('.pkdx-name')||{}).textContent || '',
                        img: img && img.naturalWidth > 0 ? img.src : null,
                        tier: tier ? tier.textContent.trim() : '',
                        tierCouleur: tier ? getComputedStyle(tier).backgroundColor : '',
                    };
                });
                // Le compteur « 212 / 466 · filtré : 2 » vit dans un div sans classe. Le
                // chercher dans tout le texte de la page attrapait autre chose : on exige
                // que l'element commence par les deux nombres.
                const boite = [...document.querySelectorAll('div')]
                    .filter(e => e.children.length < 4 && /^\\s*\\d+\\s*\\/\\s*\\d+/.test(e.textContent))
                    .pop();
                const m = boite ? boite.textContent.match(/(\\d+)\\s*\\/\\s*(\\d+)/) : null;
                return {
                    compteur: m ? {vues: +m[1], total: +m[2]} : null,
                    cartes: cartes.filter(c => c.img).slice(0, 80),
                    sansPhoto: cartes.filter(c => !c.img).length,
                };
            }"""
        )
        print(f"  mur : {donnees['mur']['compteur']}, "
              f"{len(donnees['mur']['cartes'])} cartes avec photo")

        # ---- La fiche de l'hirondelle : photo, description, saisonnalite ----
        page.evaluate(
            """() => {
                const i = document.getElementById('pkdxSearch');
                i.value = 'rustica'; i.dispatchEvent(new Event('input',{bubbles:true}));
            }"""
        )
        page.wait_for_timeout(1200)
        page.evaluate(
            """(sci) => document.querySelector(`.pkdx-card[data-sci="${sci}"]`).click()""", SCI
        )
        page.wait_for_timeout(4000)
        donnees["fiche"] = page.evaluate(
            """() => {
                const mod = document.getElementById('speciesModal');
                // La photo de l'espece vit dans .sm-photo-card. Prendre « la plus grande
                // image du panneau » donnait le SONAGRAMME, large de 30 000 px : l'onglet
                // Sons est deja dans le document avant qu'on l'ouvre.
                const grande = mod.querySelector('.sm-photo-card img');
                // La description est le .sm-card dont le texte commence par son intitule.
                // Les pastilles de mois n'ont aucune classe et le film n'en a pas besoin.
                const carte = [...mod.querySelectorAll('.sm-card')]
                    .find(e => /^\\s*Description/i.test(e.textContent));
                const desc = carte
                    ? carte.textContent.replace(/^\\s*Description\\s*/i, '').replace(/\\s+/g, ' ').trim()
                    : '';
                return {
                    titre: (mod.querySelector('h2, .sm-titre, .sm-name')||{}).textContent || '',
                    photo: grande ? grande.src : null,
                    photoTaille: grande ? [grande.naturalWidth, grande.naturalHeight] : null,
                    description: desc.slice(0, 700),
                };
            }"""
        )
        print(f"  fiche : photo {donnees['fiche']['photoTaille']}")

        # ---- Le chant : le sonagramme, et de qui il vient ----
        page.evaluate(
            """() => {
                const b = [...document.querySelectorAll('button,[role=tab]')]
                    .find(b => /Sons/.test(b.textContent) && b.textContent.trim().length < 12);
                b.click();
            }"""
        )
        page.wait_for_selector(".xa-bar-sono", timeout=30000)
        page.wait_for_timeout(1500)
        donnees["chant"] = page.evaluate(
            """() => {
                const sono = document.querySelector('.xa-bar-sono');
                return {
                    sono: sono ? sono.src : null,
                    sonoTaille: sono ? [sono.naturalWidth, sono.naturalHeight] : null,
                };
            }"""
        )
        print(f"  chant : sonagramme {donnees['chant']['sonoTaille']}")

        # ---- La carte de rarete : les points tels qu'ils sont dessines ----
        page.keyboard.press("Escape")
        page.wait_for_timeout(1000)
        clique_onglet(page, "📍 Carte")
        page.wait_for_timeout(6000)
        donnees["rarete"] = page.evaluate(
            """() => {
                const c = document.querySelector('.leaflet-container');
                if (!c) return null;
                const rc = c.getBoundingClientRect();
                // Les pastilles de Leaflet sont des <path> dans le calque de dessin. On garde
                // leur centre RELATIF au conteneur : la capture de la carte et ces points
                // partagent alors un seul repere, et aucune reprojection n'est necessaire.
                const pts = [...c.querySelectorAll('.leaflet-overlay-pane path')].map(p => {
                    const b = p.getBoundingClientRect();
                    return {
                        x: +((b.x + b.width/2 - rc.x) / rc.width).toFixed(5),
                        y: +((b.y + b.height/2 - rc.y) / rc.height).toFixed(5),
                        r: +(b.width/2).toFixed(1),
                        couleur: p.getAttribute('fill') || '',
                    };
                }).filter(p => p.r > 1 && p.r < 40);
                // Leaflet laisse plusieurs <path> au meme endroit : 1 349 elements pour 26
                // observations reelles, releve le 2026-09-30. On garde une position unique.
                const vus = new Set();
                const uniques = pts.filter(p => {
                    const cle = p.x.toFixed(4) + ',' + p.y.toFixed(4);
                    if (vus.has(cle)) return false;
                    vus.add(cle); return true;
                });
                const legende = [...c.parentElement.querySelectorAll('*')]
                    .filter(e => e.children.length === 0 && /^\\d+ /.test(e.textContent.trim()))
                    .map(e => e.textContent.trim()).slice(0, 10);
                // La position de la carte dans la page, pour pouvoir decouper la capture
                // exactement sur elle : le film pose les points sur ce fond-la, et les deux
                // partagent alors le meme repere.
                return {
                    taille: [Math.round(rc.width), Math.round(rc.height)],
                    cadre: [Math.round(rc.x), Math.round(rc.y),
                            Math.round(rc.width), Math.round(rc.height)],
                    points: pts, legende,
                };
            }"""
        )
        n = len(donnees["rarete"]["points"]) if donnees["rarete"] else 0
        print(f"  rarete : {n} points, legende {len(donnees['rarete']['legende'])} paliers")

        # ---- Le classement et la comparaison des listes ----
        clique_onglet(page, "Classement")
        page.wait_for_timeout(3000)
        donnees["classement"] = page.evaluate(
            """() => {
                const lignes = [...document.querySelectorAll('table tr')].map(tr =>
                    [...tr.querySelectorAll('th,td')].map(c => c.textContent.trim())
                ).filter(l => l.length > 3);
                return {
                    rangs: lignes.filter(l => /^\\d+$|^★$/.test(l[0])).slice(0, 5)
                        .map(l => ({rang: l[0], joueur: l[1].replace(/vous$/i, '').trim(), especes: l[2], objectif: l[3]})),
                    comparaison: lignes.slice(0, 12),
                };
            }"""
        )
        print(f"  classement : {len(donnees['classement']['rangs'])} joueurs")

        # ---- Le quiz : une vraie question, avec ses quatre reponses ----
        clique_onglet(page, "🎵 Quiz")
        page.wait_for_timeout(2500)
        page.evaluate(
            """() => {
                const b = [...document.querySelectorAll('button')]
                    .find(b => /Lancer le quiz/.test(b.textContent));
                b.click();
            }"""
        )
        page.wait_for_timeout(8000)
        donnees["quiz"] = page.evaluate(
            """() => {
                return {
                    question: (document.querySelector('.qz-prompt')||{}).textContent || '',
                    reponses: [...document.querySelectorAll('.qz-choice')].map(c => ({
                        fr: (c.querySelector('.qz-choice-fr')||{}).textContent || '',
                        sci: (c.querySelector('.qz-choice-sci')||{}).textContent || '',
                    })).slice(0, 4),
                };
            }"""
        )
        print(f"  quiz : {len(donnees['quiz']['reponses'])} reponses")

        nav.close()

    # ---- Le chat : lu dans les donnees de la demo, pas dans la page ----
    # Les bulles du chat n'ont pas de classe propre, et ramasser le texte par niveau de
    # document rendait chaque message quatre fois, de plus en plus tronque. La source de
    # verite est demo/donnees.js, ou chaque message est un objet nomme.
    src = pathlib.Path("demo/donnees.js").read_text(encoding="utf-8")
    msgs = re.findall(
        r'chat/msg-(\d+)":\s*\{[^}]*?"name":"([^"]*)"[^}]*?"text":"([^"]*)"', src
    )
    donnees["chat"] = [
        {"n": int(n), "nom": nom, "texte": t} for n, nom, t in sorted(msgs, key=lambda m: int(m[0]))
    ]
    print(f"  chat : {len(donnees['chat'])} messages, lus dans demo/donnees.js")

    # ---- Le credit du chant, pris a la source ----
    # L'identifiant de l'enregistrement est dans l'adresse du sonagramme. On demande ses
    # metadonnees a xeno-canto plutot que de gratter le texte affiche : c'est cette
    # attribution qui devra figurer au generique.
    if donnees["chant"].get("sono"):
        m = re.search(r"/spectrograms/[^/]+/(\d+)/", donnees["chant"]["sono"])
        if m:
            donnees["chant"]["id"] = m.group(1)
            try:
                api = (
                    "https://xeno-canto.org/api/3/recordings?query=nr:"
                    + m.group(1) + "&key=" + XC_KEY
                )
                req = urllib.request.Request(api, headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=30) as r:
                    rec = (json.loads(r.read()).get("recordings") or [{}])[0]
                donnees["chant"]["credit"] = {
                    "enregistreur": rec.get("rec", ""), "lieu": rec.get("loc", ""),
                    "pays": rec.get("cnt", ""), "date": rec.get("date", ""),
                    "licence": rec.get("lic", ""), "url": rec.get("url", ""),
                }
                print(f"  chant : enregistre par {rec.get('rec','?')}, "
                      f"{rec.get('cnt','?')}, licence {(rec.get('lic') or '?').split('/')[-2:]}")
            except Exception as e:
                print(f"  chant : credit non recupere ({type(e).__name__})")

    # ---- La carte de migration : les 52 semaines, depuis le depot separe ----
    idx = json.loads(pathlib.Path("data/range-weekly-index.json").read_text(encoding="utf-8"))
    entree = {k.lower(): v for k, v in idx.items()}.get(SCI)
    if not entree:
        sys.exit(f"{SCI} n'a pas de carte hebdomadaire")
    base = "https://mathiiis7.github.io/ornitheque-data"
    donnees["migration"] = {
        "code": entree["code"], "bbox": entree["bbox"],
        "taille": [entree["w"], entree["h"]], "semaines": entree["weeks"],
    }
    print(f"  migration : {entree['code']}, {len(entree['weeks'])} semaines")

    # ---- Telechargements ----
    print("\ntelechargements :")
    if donnees["fiche"]["photo"]:
        donnees["fiche"]["fichier"] = telecharge(donnees["fiche"]["photo"], "hirondelle.jpg")
    if donnees["chant"]["sono"]:
        donnees["chant"]["fichier"] = telecharge(donnees["chant"]["sono"], "sonagramme.png")
    for i, c in enumerate(donnees["mur"]["cartes"]):
        c["fichier"] = telecharge(c["img"], f"mur/{i:02d}.jpg")
    print(f"    mur : {sum(1 for c in donnees['mur']['cartes'] if c.get('fichier'))} vignettes")
    for wk in donnees["migration"]["semaines"]:
        nom = f"migration/w{wk:02d}.png"
        telecharge(f"{base}/range-weekly/{entree['code']}/w{wk:02d}.png?v=20260901", nom)

    FILM.mkdir(parents=True, exist_ok=True)
    (FILM / "donnees.json").write_text(
        json.dumps(donnees, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    poids = sum(f.stat().st_size for f in ASSETS.rglob("*") if f.is_file())
    print(f"\n.onetake/film/donnees.json  ·  assets : {poids // 1024} Ko")


if __name__ == "__main__":
    main()
