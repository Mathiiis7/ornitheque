"""Le rendu final du film v2 : chaque morceau en 3840x2160 a 60 images/s, l'un apres l'autre, dans .onetake/4k/.

    .onetake/venv/Scripts/python.exe outils/onetake/rendu-final.py [--workers 3] [m e f ...]

Sans nom : tous les morceaux pas encore rendus. Un morceau interrompu reprend ou il s'etait arrete. Ne relance AUCUNE
prise : v2-recent.py tire un autre chant a chaque prise, et les credits et partition-v2.py nomment celui du film.
La memoire libre la plus basse s'ecrit a la fin de chaque morceau : ce PC n'a que 7,6 Go, et 2 navigateurs la vident
deja (--workers 2 : 6 s de film en 13 min, memoire libre 0 ; ne pas monter). --gap 48 : l'ecart du brouillon, 24 px a
1920, soit 48 a 3840 ; le film en ligne est en 1080p et le defaut de 24 doublerait le temps (2,5 h au lieu de 1,3 h).
"""
import argparse, ctypes, json, pathlib, subprocess, sys, threading, time

SKILL = pathlib.Path(".claude/skills/onetake")
SORTIES = pathlib.Path(".onetake/4k")
# nom court : (composition, fichier de sortie, le meme nom que le brouillon)
MORCEAUX = {"m": ("film3/comp-m.html", "m3-m.mp4"), "a": ("film-mur/comp-a.html", "mur-a.mp4"), "c": ("film-mur/comp-c.html", "mur-c.mp4"),
            "fin": ("film2/comp-fin.html", "fin.mp4"), "e": ("film3/comp-e.html", "m3-e.mp4"), "f": ("film3/comp-f.html", "m3-f.mp4"),
            "ouv": ("film2/comp.html", "v2-brouillon5.mp4"), "g": ("film3/comp-g.html", "m3-g.mp4")}


class Memoire(ctypes.Structure):
    _fields_ = [("dwLength", ctypes.c_ulong), ("dwMemoryLoad", ctypes.c_ulong)] + [(n, ctypes.c_ulonglong) for n in
                ("total", "libre", "pagetot", "pagelibre", "virttot", "virtlibre", "ext")]


def libre_go():
    m = Memoire()
    m.dwLength = ctypes.sizeof(Memoire)
    ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m))
    return m.libre / 2 ** 30


def rend(nom, workers):
    comp, sortie = MORCEAUX[nom]
    sortie = SORTIES / sortie
    bas = [libre_go()]
    fini = threading.Event()

    def surveille():
        while not fini.wait(5):
            bas[0] = min(bas[0], libre_go())

    threading.Thread(target=surveille, daemon=True).start()
    t0 = time.time()
    # --resume : garde les images deja faites d'un rendu interrompu (le dossier _frames est a cote de la sortie)
    r = subprocess.run([sys.executable, str(SKILL / "scripts" / "render.py"), str(pathlib.Path(".onetake") / comp), "--out", str(sortie),
                        "--final", "--workers", str(workers), "--resume", "--gap", "48"])
    fini.set()
    print(f"== {nom} : code {r.returncode}, {(time.time() - t0) / 60:.1f} min, memoire libre la plus basse {bas[0]:.2f} Go", flush=True)
    return r.returncode


ap = argparse.ArgumentParser()
ap.add_argument("noms", nargs="*")
ap.add_argument("--workers", type=int, default=3)
a = ap.parse_args()
SORTIES.mkdir(parents=True, exist_ok=True)
for nom in a.noms or MORCEAUX:
    if not a.noms and (SORTIES / MORCEAUX[nom][1]).exists():
        continue
    if rend(nom, a.workers):
        sys.exit(1)
print("termine", json.dumps([p.name for p in SORTIES.glob("*.mp4")]), flush=True)
