"""Assemble les quatre essais du moment 3 dans .onetake/film3/ : une seule composition, quatre
fichiers qui ne different que par leur variante (a, b, c, d). Lancer apres v2-m3.py :

    .onetake/venv/Scripts/python.exe outils/onetake/assemble-m3.py
"""
import json, os, pathlib, shutil, subprocess, sys
from PIL import Image

SKILL = pathlib.Path(".claude/skills/onetake")
M3 = pathlib.Path(".onetake/v2/m3")
OUT = pathlib.Path(".onetake/film3")
SRC = pathlib.Path("outils/onetake/film/comp-m3.html")
OUT.mkdir(parents=True, exist_ok=True)
for f in M3.glob("*.png"):
    shutil.copy2(f, OUT / f.name)
shutil.copy2(SKILL / "lib" / "motion.js", OUT / "motion.js")
# la derniere image de la scene du trophee retenue par montage-v2.py : le classement part de la
shutil.copy2(pathlib.Path(".onetake/v2/scenes/trophee") / f"{round(7.6 * 30):04d}.jpg", OUT / "trophee-fin.jpg")
shutil.copy2(".onetake/film2/police-v2.js", OUT / "police-v2.js")
donnees = json.loads((M3 / "m3.json").read_text(encoding="utf-8"))
# La fiche : le tiroir seul. Sa place se lit sur une ligne de l'image, la ou le blanc de ses cartes commence.
FICHE = pathlib.Path(".onetake/v2/fiche")
fiche = json.loads((FICHE / "fiche.json").read_text(encoding="utf-8"))
info = Image.open(FICHE / "info.png").convert("RGB")
ligne = info.convert("L").crop((2200, 2000, info.width, 2001))
x0 = 2200 + next(x for x in range(ligne.width) if ligne.getpixel((x, 0)) > 200)
hauteur = 1200 * 2
for nom in ["info", "sons"]:
    Image.open(FICHE / f"{nom}.png").convert("RGB").crop((x0, 0, 3840, hauteur)).save(OUT / f"fiche-{nom}.png")
for f in FICHE.glob("mois-*.png"):
    shutil.copy2(f, OUT / f.name)
X0 = x0 / 2
# Les observations recentes et le quiz
RECENT = pathlib.Path(".onetake/v2/recent")
for f in RECENT.glob("*.png"):
    shutil.copy2(f, OUT / f.name)
donnees["recent"] = json.loads((RECENT / "recent.json").read_text(encoding="utf-8"))
MONDE = pathlib.Path(".onetake/v2/monde")
for f in MONDE.glob("*.png"):
    shutil.copy2(f, OUT / f.name)
donnees["monde"] = json.loads((MONDE / "monde.json").read_text(encoding="utf-8"))
print("tiroir a", X0)
def rel(r):
    return {**r, "x": r["x"] - X0}
donnees["fiche"] = {"w": (3840 - x0) / 2, "h": hauteur / 2, "bloc": rel(fiche["bloc"]), "sons": rel(fiche["sons"]),
                    "pastilles": [rel(q) for q in fiche["pastilles"]],
                    "enregistrements": [{"barre": rel(e["barre"]), "lecture": rel(e["lecture"])} for e in fiche["enregistrements"][:1]]}
(OUT / "donnees-m3.js").write_text("window.M3 = " + json.dumps(donnees, separators=(",", ":"), ensure_ascii=False) + ";\n", encoding="utf-8")
src = SRC.read_text(encoding="utf-8")
for v in "abcdefgm":
    (OUT / f"comp-{v}.html").write_text(src.replace("__VARIANTE__", v), encoding="utf-8")
r = subprocess.run([sys.executable, str(SKILL / "scripts" / "look.py"), "apply", str(pathlib.Path(".onetake/look-ornitheque.json").resolve()), str((OUT / "comp-a.html").resolve())],
                   capture_output=True, text=True, encoding="utf-8", errors="replace",
                   env={**os.environ, "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"})
print(((r.stdout or "") + (r.stderr or "")).strip()[-120:])
sys.exit(r.returncode)
