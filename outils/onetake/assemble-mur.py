"""Assemble les deux morceaux du Birdydex dans .onetake/film-mur/ (comp-a, comp-c), apres v2-mur.py,
v2-scenes.py et v2-m3.py. Le noir ou chaque morceau finit est lu sur la premiere image de la scene qui
suit : la coupure ne se voit pas.

    .onetake/venv/Scripts/python.exe outils/onetake/assemble-mur.py
"""
import json, os, pathlib, shutil, subprocess, sys
from PIL import Image

SKILL = pathlib.Path(".claude/skills/onetake")
MUR = pathlib.Path(".onetake/v2/mur")
M3 = pathlib.Path(".onetake/v2/m3")
SCENES = pathlib.Path(".onetake/v2/scenes")
SITE = pathlib.Path(".onetake/v2/site")
OUT = pathlib.Path(".onetake/film-mur")
SRC = pathlib.Path("outils/onetake/film/comp-mur.html")
# Les coupes des scenes, partagees avec montage-v2.py
DEBLOQUE_FIN_S = 6.5    # avant l'arrivee du bouton « Continuer »


def couleur(chemin):
    r, g, b = Image.open(chemin).convert("RGB").getpixel((3, 3))
    return f"rgb({r},{g},{b})"


OUT.mkdir(parents=True, exist_ok=True)
for f in ["mur-199.jpg", "carte-martin.png"]:
    shutil.copy2(MUR / f, OUT / f)
for f in ["carte-nue.png", "logo-nom.png"]:
    shutil.copy2(M3 / f, OUT / f)
shutil.copy2(SKILL / "lib" / "motion.js", OUT / "motion.js")
shutil.copy2(".onetake/film2/police-v2.js", OUT / "police-v2.js")
shutil.copy2(SCENES / "debloque" / f"{round(DEBLOQUE_FIN_S * 30):04d}.jpg", OUT / "debloque-fin.jpg")
shutil.copy2(SCENES / "birdydex-200.png", OUT / "page-200.png")
shutil.copy2(SCENES / "trophee" / "0000.jpg", OUT / "trophee-debut.jpg")
# La carte dans la derniere image de la scene : ses vrais bords, lus sur les pixels clairs du centre
# (les rayons de la scene ne depassent pas 150). Le film la fait partir de la, au pixel pres.
fin = Image.open(OUT / "debloque-fin.jpg").convert("L").resize((1920, 1080))
x0, y0, x1, y1 = fin.crop((600, 200, 1320, 900)).point(lambda v: 255 if v > 225 else 0).getbbox()
carte_scene = {"x": 600 + x0, "y": 200 + y0, "w": x1 - x0, "h": y1 - y0}
# La scene sans sa carte, pour le fondu : les rayons partent en etoile du centre de la carte, chaque pixel
# de sa place reprend donc la couleur du meme rayon, juste a l'exterieur. Un morceau pris a un autre instant
# ne raccordait pas : les rayons tournent, un rectangle sombre se voyait autour de la carte (Mathis, 2026-10-31).
sans = Image.open(OUT / "debloque-fin.jpg").convert("RGB").resize((1920, 1080), Image.LANCZOS)
M = 12
gx0, gy0 = carte_scene["x"] - M, carte_scene["y"] - M
gx1, gy1 = carte_scene["x"] + carte_scene["w"] + M, carte_scene["y"] + carte_scene["h"] + M
cx, cy = carte_scene["x"] + carte_scene["w"] / 2, carte_scene["y"] + carte_scene["h"] / 2
source = sans.copy()
for y in range(gy0, gy1):
    for x in range(gx0, gx1):
        dx, dy = x - cx, y - cy
        f = min((gx1 + 1 - cx) / abs(dx) if dx else 1e9, (gy1 + 1 - cy) / abs(dy) if dy else 1e9)
        sans.putpixel((x, y), source.getpixel((min(1919, round(cx + dx * f)), min(1079, round(cy + dy * f)))))
sans.save(OUT / "debloque-sans-carte.jpg", quality=95)
donnees = {**json.loads((MUR / "mur.json").read_text(encoding="utf-8")),
           **json.loads((SITE / "compte.json").read_text(encoding="utf-8")),
           "noirDebloque": couleur(SCENES / "debloque" / "0000.jpg"),
           "carteScene": carte_scene,
           "page200": json.loads((SCENES / "scenes.json").read_text(encoding="utf-8"))["page200"]}
print(donnees)
(OUT / "donnees-mur.js").write_text("window.MUR = " + json.dumps(donnees) + ";\n", encoding="utf-8")
src = SRC.read_text(encoding="utf-8")
for v in "ac":
    (OUT / f"comp-{v}.html").write_text(src.replace("__PARTIE__", v), encoding="utf-8")
r = subprocess.run([sys.executable, str(SKILL / "scripts" / "look.py"), "apply", str(pathlib.Path(".onetake/look-ornitheque.json").resolve()), str((OUT / "comp-a.html").resolve())],
                   capture_output=True, text=True, encoding="utf-8", errors="replace",
                   env={**os.environ, "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"})
print(((r.stdout or "") + (r.stderr or "")).strip()[-120:])
sys.exit(r.returncode)
