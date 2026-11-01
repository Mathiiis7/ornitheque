"""Colle les morceaux du film v2 : moments 1 et 2, le mur, la scene « espece debloquee », le retour dans la
case, la scene du trophee. Les scenes du site sont trop longues pour le film : leur preambule passe
plus vite, la carte et le trophee gardent leur vraie vitesse.

    .onetake/venv/Scripts/python.exe outils/onetake/montage-v2.py SORTIE.mp4 [--final]

--final colle les morceaux de rendu-final.py en 3840x2160 a 60 images/s. Les scenes du site restent prises a 30 images
par seconde : chacune de leurs images dure deux images du film.
"""
import pathlib, subprocess, sys

SORTIE = sys.argv[1]
FINAL = "--final" in sys.argv
M, FPS, TAILLE = (".onetake/4k/", 60, "3840:2160") if FINAL else (".onetake/", 30, "1920:1080")
SCENES = pathlib.Path(".onetake/v2/scenes")
ENTREES = [M + "v2-brouillon5.mp4", M + "mur-a.mp4", "debloque", M + "mur-c.mp4", "trophee", M + "m3-e.mp4", M + "m3-f.mp4", M + "m3-m.mp4", M + "m3-g.mp4", M + "fin.mp4"]
# (debut, fin, vitesse) en secondes de la scene. Debloque : drapeau, famille, rarete, puis la carte.
# Trophee : la montee du palier, puis la fenetre « Ornithologue chevronne ».
COUPES = {"debloque": [(0, 5.0, 1.2), (5.0, 6.5, 0.75)], "trophee": [(0, 0.45, 1), (0.45, 6.2, 1.2), (6.2, 7.6, 0.8)]}

args, filtres, noms = ["ffmpeg", "-y", "-loglevel", "error"], [], []
for k, e in enumerate(ENTREES):
    if e in COUPES:
        args += ["-framerate", "30", "-i", str(SCENES / e / "%04d.jpg")]
        parts = []
        for j, (a, b, v) in enumerate(COUPES[e]):
            filtres.append(f"[{k}:v]trim={a}:{b},setpts=(PTS-STARTPTS)/{v},fps={FPS},scale={TAILLE}:flags=lanczos,format=yuv420p,setsar=1[{e}{j}]")
            parts.append(f"[{e}{j}]")
        filtres.append("".join(parts) + f"concat=n={len(parts)}:v=1:a=0[m{k}]")
    else:
        args += ["-i", e]
        # le repos final du moment 2 raccourci : la transition vers le mur paraissait longue (Mathis, 2026-10-31)
        coupe = "trim=0:15.1,setpts=PTS-STARTPTS," if k == 0 else ""
        filtres.append(f"[{k}:v]{coupe}fps={FPS},format=yuv420p,setsar=1[m{k}]")
    noms.append(f"[m{k}]")
filtres.append("".join(noms) + f"concat=n={len(noms)}:v=1:a=0[sortie]")
args += ["-filter_complex", ";".join(filtres), "-map", "[sortie]", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", SORTIE]
sys.exit(subprocess.run(args).returncode)
