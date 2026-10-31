"""Assemble les quatre essais du moment 3 dans .onetake/film3/ : une seule composition, quatre
fichiers qui ne different que par leur variante (a, b, c, d). Lancer apres v2-m3.py :

    .onetake/venv/Scripts/python.exe outils/onetake/assemble-m3.py
"""
import json, os, pathlib, shutil, subprocess, sys

SKILL = pathlib.Path(".claude/skills/onetake")
M3 = pathlib.Path(".onetake/v2/m3")
OUT = pathlib.Path(".onetake/film3")
SRC = pathlib.Path("outils/onetake/film/comp-m3.html")
OUT.mkdir(parents=True, exist_ok=True)
for f in M3.glob("*.png"):
    shutil.copy2(f, OUT / f.name)
shutil.copy2(SKILL / "lib" / "motion.js", OUT / "motion.js")
shutil.copy2(".onetake/film2/police-v2.js", OUT / "police-v2.js")
donnees = json.loads((M3 / "m3.json").read_text(encoding="utf-8"))
(OUT / "donnees-m3.js").write_text("window.M3 = " + json.dumps(donnees, separators=(",", ":"), ensure_ascii=False) + ";\n", encoding="utf-8")
src = SRC.read_text(encoding="utf-8")
for v in "abcd":
    (OUT / f"comp-{v}.html").write_text(src.replace("__VARIANTE__", v), encoding="utf-8")
r = subprocess.run([sys.executable, str(SKILL / "scripts" / "look.py"), "apply", str(pathlib.Path(".onetake/look-ornitheque.json").resolve()), str((OUT / "comp-a.html").resolve())],
                   capture_output=True, text=True, encoding="utf-8", errors="replace",
                   env={**os.environ, "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"})
print(((r.stdout or "") + (r.stderr or "")).strip()[-120:])
sys.exit(r.returncode)
