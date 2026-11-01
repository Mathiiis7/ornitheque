"""La version du film pour le web : 1080p, lecture avant la fin du telechargement, et son affiche. Le master 4K reste hors
des depots : il depasse ce que GitHub accepte et personne ne le verrait, le lecteur fait au plus 900 px de large.

    .onetake/venv/Scripts/python.exe outils/onetake/film-web.py ENTREE.mp4

Ecrit assets/film/ de ce depot et les deux fichiers projet-ornitheque-film.* du portfolio.
"""
import pathlib, shutil, subprocess, sys

ENTREE = sys.argv[1]
ICI = pathlib.Path("assets/film")
PORTFOLIO = pathlib.Path("../../2-Emploi/portfolio")
ICI.mkdir(parents=True, exist_ok=True)
FILM, AFFICHE = ICI / "ornitheque-film.mp4", ICI / "ornitheque-film.webp"
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", ENTREE, "-vf", "scale=1920:1080:flags=lanczos", "-c:v", "libx264", "-preset", "slow", "-crf", "24",
                "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", str(FILM)], check=True)    # muet : choix de Mathis, 2026-11-01
# 4 s : le logo et le nom sont poses, l'iris n'a pas commence
subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", "4", "-i", ENTREE, "-frames:v", "1", "-vf", "scale=1280:720:flags=lanczos", "-quality", "82", str(AFFICHE)], check=True)
shutil.copy2(FILM, PORTFOLIO / "projet-ornitheque-film.mp4")
shutil.copy2(AFFICHE, PORTFOLIO / "projet-ornitheque-film.webp")
print(f"film {FILM.stat().st_size / 2 ** 20:.1f} Mo, affiche {AFFICHE.stat().st_size / 2 ** 10:.0f} Ko")
