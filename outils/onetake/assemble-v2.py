"""Assemble le dossier de fabrication du film v2 dans .onetake/film2/ (moments 1 et 2 pour l'instant).

    .onetake/venv/Scripts/python.exe outils/onetake/assemble-v2.py

Les donnees viennent de .onetake/v2/ : facettes.json (facettes.py, d'apres l'image du logo
embarquee dans assets/logos/huppe.svg) et carte-points.json + carte-fond.png (v2-carte.py).
"""
import json, os, pathlib, shutil, subprocess, sys

SKILL = pathlib.Path(".claude/skills/onetake")
SRC = pathlib.Path("outils/onetake/film/comp-v2.html")
V2 = pathlib.Path(".onetake/v2")
OUT = pathlib.Path(".onetake/film2")
LOOK = pathlib.Path(".onetake/look-ornitheque.json")

OUT.mkdir(parents=True, exist_ok=True)
shutil.copy2(SRC, OUT / "comp.html")
shutil.copy2(SKILL / "lib" / "motion.js", OUT / "motion.js")
shutil.copy2(V2 / "carte-fond.png", OUT / "carte-fond.png")
donnees = {"facettes": json.load(open(V2 / "facettes.json")), "points": json.load(open(V2 / "carte-points.json"))}
(OUT / "donnees-v2.js").write_text("window.V2 = " + json.dumps(donnees, separators=(",", ":")) + ";\n", encoding="utf-8")
r = subprocess.run([sys.executable, str(SKILL / "scripts" / "look.py"), "apply", str(LOOK.resolve()), str((OUT / "comp.html").resolve())],
                   capture_output=True, text=True, encoding="utf-8", errors="replace",
                   env={**os.environ, "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"})
print(((r.stdout or "") + (r.stderr or "")).strip()[-600:])
sys.exit(r.returncode)
