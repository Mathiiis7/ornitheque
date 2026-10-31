"""Colle les morceaux du film v2 : moments 1 et 2, le mur, la scene « espece debloquee », le retour dans la
case, la scene du trophee. Les scenes du site sont trop longues pour le film : leur preambule passe
plus vite, la carte et le trophee gardent leur vraie vitesse.

    .onetake/venv/Scripts/python.exe outils/onetake/montage-v2.py SORTIE.mp4
"""
import pathlib, subprocess, sys

SORTIE = sys.argv[1]
SCENES = pathlib.Path(".onetake/v2/scenes")
ENTREES = [".onetake/v2-brouillon5.mp4", ".onetake/mur-a.mp4", "debloque", ".onetake/mur-c.mp4", "trophee"]
# (debut, fin, vitesse) en secondes de la scene. Debloque : drapeau, famille, rarete, puis la carte.
# Trophee : la montee du palier, puis la fenetre « Ornithologue chevronne ».
COUPES = {"debloque": [(0, 5.0, 1.7), (5.0, 6.5, 1)], "trophee": [(0.45, 6.2, 1.4), (6.2, 7.6, 1)]}

args, filtres, noms = ["ffmpeg", "-y", "-loglevel", "error"], [], []
for k, e in enumerate(ENTREES):
    if e in COUPES:
        args += ["-framerate", "30", "-i", str(SCENES / e / "%04d.jpg")]
        parts = []
        for j, (a, b, v) in enumerate(COUPES[e]):
            filtres.append(f"[{k}:v]trim={a}:{b},setpts=(PTS-STARTPTS)/{v},fps=30,format=yuv420p,setsar=1[{e}{j}]")
            parts.append(f"[{e}{j}]")
        filtres.append("".join(parts) + f"concat=n={len(parts)}:v=1:a=0[m{k}]")
    else:
        args += ["-i", e]
        filtres.append(f"[{k}:v]fps=30,format=yuv420p,setsar=1[m{k}]")
    noms.append(f"[m{k}]")
filtres.append("".join(noms) + f"concat=n={len(noms)}:v=1:a=0[sortie]")
args += ["-filter_complex", ";".join(filtres), "-map", "[sortie]", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", SORTIE]
sys.exit(subprocess.run(args).returncode)
