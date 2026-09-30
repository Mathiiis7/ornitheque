"""Assemble le dossier de fabrication du film, dans .onetake/film/.

Notre travail (la composition) est suivi par git dans tools/onetake/film/. Le reste ne l'est
pas : motion.js appartient au skill, sous licence PolyForm Noncommercial, et le depot est
public. On les reunit ici au moment de fabriquer, pas dans le depot.

    .onetake/venv/Scripts/python.exe tools/onetake/assemble.py
"""

import json
import pathlib
import shutil
import subprocess
import sys

SKILL = pathlib.Path(".claude/skills/onetake")
SOURCE = pathlib.Path("tools/onetake/film")
FILM = pathlib.Path(".onetake/film")
LOOK = pathlib.Path(".onetake/look-ornitheque.json")


def main():
    FILM.mkdir(parents=True, exist_ok=True)

    shutil.copy2(SOURCE / "comp.html", FILM / "comp.html")
    shutil.copy2(SKILL / "lib" / "motion.js", FILM / "motion.js")
    print(f"  comp.html et motion.js -> {FILM}")

    # composants.js : les morceaux du site et leurs rectangles, mesures dans le navigateur par
    # composants.py. En <script> et non en fetch : le rendu ouvre la page en file://, ou une
    # requete vers un fichier voisin est refusee, alors qu'une balise script passe.
    comp = pathlib.Path(".onetake/composants.json")
    if not comp.exists():
        sys.exit("manque .onetake/composants.json : lancer composants.py")
    (FILM / "composants.js").write_text(
        "window.COMP = " + comp.read_text(encoding="utf-8") + ";\n", encoding="utf-8")
    print(f"  composants.js  {(FILM / 'composants.js').stat().st_size // 1024} Ko")

    # look.js : les huit couleurs et les trois polices, sous-ensemblees et incorporees.
    # Indispensable en file://, ou une police distante n'arrive jamais et ou le canvas
    # retombe en silence sur une police du systeme.
    r = subprocess.run(
        [sys.executable, str(SKILL / "scripts" / "look.py"), "apply",
         str(LOOK.resolve()), str((FILM / "comp.html").resolve())],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
        env={**__import__("os").environ, "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"},
    )
    sortie = (r.stdout or "") + (r.stderr or "")
    for ligne in sortie.strip().splitlines()[-6:]:
        print("  " + ligne)
    if r.returncode != 0:
        sys.exit("look.py apply a echoue")

    manquants = [n for n in ("comp.html", "motion.js", "composants.js", "look.js")
                 if not (FILM / n).exists()]
    if manquants:
        sys.exit("manque dans le dossier de fabrication : " + ", ".join(manquants))
    print(f"\ndossier de fabrication pret : {FILM.resolve()}")


if __name__ == "__main__":
    main()
