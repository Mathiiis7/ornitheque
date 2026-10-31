"""Assemble le dossier de fabrication du film v2 dans .onetake/film2/ (moments 1 et 2 pour l'instant).

    .onetake/venv/Scripts/python.exe outils/onetake/assemble-v2.py

Le logo vient tel quel de assets/logos/logo.svg (fige le 2026-10-05) : ses traces sont repris un
par un, dans leur ordre, avec leurs masques, pour que l'image finale soit le vrai logo. La carte,
ses anneaux et les cartes du Birdydex viennent du site actuel (v2-site.py). La police des titres
est celle du site.
"""
import base64, json, os, pathlib, shutil, subprocess, sys
import xml.etree.ElementTree as ET

SKILL = pathlib.Path(".claude/skills/onetake")
SRC = pathlib.Path("outils/onetake/film/comp-v2.html")
SITE = pathlib.Path(".onetake/v2/site")
OUT = pathlib.Path(".onetake/film2")
LOOK = pathlib.Path(".onetake/look-ornitheque.json")
LOGO = pathlib.Path("assets/logos/logo.svg")
POLICE = pathlib.Path("assets/fonts/SourceSerif4-Bold.woff2")
# Les cinq cartes qui surgissent : licences verifiees par v2-site.py (cartes-gardees.json)
# Chaque oiseau sort de l'anneau ou la demo l'a note, et son lieu doit etre vraisemblable (Mathis,
# 2026-10-31) : Guepier dans l'Herault, Flamant dans les Bouches-du-Rhone, Cygne en Mayenne,
# Huppe dans le Vaucluse. Le Rougegorge ferme le moment depuis l'Indre : le Martin-pecheur n'est
# pas encore dans la liste a 199, c'est lui qui fera le 200e.
PHOTOS = ["merops apiaster", "phoenicopterus roseus", "cygnus olor", "upupa epops", "erithacus rubecula"]


def lit_logo():
    """Le logo a plat : chaque trace avec sa couleur et le masque qui le decoupe."""
    ns = "{http://www.w3.org/2000/svg}"
    racine = ET.parse(LOGO).getroot()
    x, y, w, h = [float(v) for v in racine.get("viewBox").split()]
    masques, traces = {}, []

    def parcourt(el, masque):
        for e in el:
            nom = e.tag.replace(ns, "")
            if nom == "mask":
                # masque en luminance, tout en blanc : revient a decouper par ses traces
                masques[e.get("id")] = [p.get("d") for p in e.findall(ns + "path")]
            elif nom == "g":
                m = e.get("mask")
                parcourt(e, m[5:-1] if m else masque)
            elif nom == "path":
                traces.append({"d": e.get("d"), "fill": e.get("fill"), "stroke": e.get("stroke"),
                               "sw": float(e.get("stroke-width") or 0), "op": float(e.get("opacity") or 1),
                               "masque": masque})

    parcourt(racine.find(ns + "g"), None)
    return {"x": x, "y": y, "w": w, "h": h, "rx": 2.66, "fond": "#d3e7e6", "masques": masques, "traces": traces}


OUT.mkdir(parents=True, exist_ok=True)
for ancien in OUT.glob("*.png"):
    ancien.unlink()
shutil.copy2(SRC, OUT / "comp.html")
shutil.copy2(SKILL / "lib" / "motion.js", OUT / "motion.js")
shutil.copy2(SITE / "carte-fond.png", OUT / "carte-fond.png")
anneaux = json.loads((SITE / "anneaux.json").read_text(encoding="utf-8"))
for a in anneaux:
    shutil.copy2(SITE / a["fichier"], OUT / a["fichier"])
gardees = {c["sci"]: c for c in json.loads((SITE / "cartes-gardees.json").read_text(encoding="utf-8"))}
photos = [gardees[s] for s in PHOTOS]
# les noms de l'ecran de fin (credits-v2.py)
credits = json.loads(pathlib.Path(".onetake/v2/credits.json").read_text(encoding="utf-8"))
for c in photos:
    shutil.copy2(SITE / c["fichier"], OUT / c["fichier"])
    print(c["nom"], "|", c["licence"], "|", c["src"])
compte = json.loads((SITE / "compte.json").read_text(encoding="utf-8"))
donnees = {"logo": lit_logo(), "anneaux": anneaux, "photos": [{"fichier": c["fichier"], "sci": c["sci"]} for c in photos], **compte, "credits": credits}
print("logo :", len(donnees["logo"]["traces"]), "traces ;", len(anneaux), "anneaux")
(OUT / "donnees-v2.js").write_text("window.V2 = " + json.dumps(donnees, separators=(",", ":")) + ";\n", encoding="utf-8")
# Embarquee en base64 : un rendu en file:// ne charge pas une police par son adresse.
b64 = base64.b64encode(POLICE.read_bytes()).decode()
(OUT / "comp-fin.html").write_text(SRC.read_text(encoding="utf-8").replace("const MODE_FIN = false;", "const MODE_FIN = true;"), encoding="utf-8")
(OUT / "police-v2.js").write_text("window.POLICE_TITRE = 'data:font/woff2;base64," + b64 + "';\n", encoding="utf-8")
r = subprocess.run([sys.executable, str(SKILL / "scripts" / "look.py"), "apply", str(LOOK.resolve()), str((OUT / "comp.html").resolve())],
                   capture_output=True, text=True, encoding="utf-8", errors="replace",
                   env={**os.environ, "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"})
print(((r.stdout or "") + (r.stderr or "")).strip()[-600:])
sys.exit(r.returncode)
