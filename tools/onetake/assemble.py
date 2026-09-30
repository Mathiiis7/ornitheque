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

    # Les donnees en <script> et non en fetch : le rendu ouvre la page en file://, ou une
    # requete vers un fichier voisin est refusee, alors qu'une balise script passe.
    d = json.loads((FILM / "donnees.json").read_text(encoding="utf-8"))
    (FILM / "donnees.js").write_text(
        "window.DATA = " + json.dumps(d, ensure_ascii=False) + ";\n", encoding="utf-8")
    ko = (FILM / "donnees.js").stat().st_size // 1024
    print(f"  donnees.js  {ko} Ko")

    # reperes.js : les rectangles mesures dans le navigateur (reperes.py, prises-libres.py).
    # Les recopier a la main dans la composition les figeait : une prise refaite et le film
    # cadrait a cote sans qu'aucune erreur ne le dise.
    rep = pathlib.Path(".onetake/reperes.json")
    if rep.exists():
        (FILM / "reperes.js").write_text(
            "window.REPERES = " + rep.read_text(encoding="utf-8") + ";\n", encoding="utf-8")
        print(f"  reperes.js  {(FILM / 'reperes.js').stat().st_size} octets")
    else:
        sys.exit("manque .onetake/reperes.json : lancer reperes.py")

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

    manquants = [n for n in ("comp.html", "motion.js", "donnees.js", "look.js", "reperes.js")
                 if not (FILM / n).exists()]
    if manquants:
        sys.exit("manque dans le dossier de fabrication : " + ", ".join(manquants))
    print(f"\ndossier de fabrication pret : {FILM.resolve()}")


if __name__ == "__main__":
    main()
