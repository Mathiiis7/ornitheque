"""Quelques images fixes de la composition, pour regarder avant de lancer un rendu.

Un rendu complet coute huit minutes. Une planche de huit images en coute quarante secondes et
attrape l'essentiel : un cadre qui deborde, une image absente, un raccord qui ne raccorde pas.

    .onetake/venv/Scripts/python.exe tools/onetake/stills.py 0 3 6 6.2 8 12 16 22 28 29.5
"""

import pathlib
import subprocess
import sys

from playwright.sync_api import sync_playwright

COMP = pathlib.Path(".onetake/film/comp.html").resolve()
SORTIE = pathlib.Path(".onetake/stills")
PLANCHE = pathlib.Path(".onetake/planche-stills.png")


def main():
    instants = [float(x) for x in sys.argv[1:]] or [0, 3, 6, 7, 9, 12, 16, 22, 27, 29.5]
    SORTIE.mkdir(parents=True, exist_ok=True)
    for f in SORTIE.glob("*.png"):
        f.unlink()

    with sync_playwright() as p:
        nav = p.chromium.launch()
        page = nav.new_page(viewport={"width": 1920, "height": 1080})
        erreurs = []
        page.on("pageerror", lambda e: erreurs.append(str(e)))
        page.on("console", lambda m: erreurs.append(m.text) if m.type == "error" else None)
        page.goto("file://" + str(COMP).replace("\\", "/"))
        page.evaluate("window.__ready")
        fichiers = []
        for i, t in enumerate(instants):
            page.evaluate(f"window.__seek({t})")
            page.wait_for_timeout(120)
            f = SORTIE / f"{i:02d}-t{t}.png"
            page.screenshot(path=str(f), clip={"x": 0, "y": 0, "width": 1920, "height": 1080})
            fichiers.append(f)
            print(f"  t={t:<6} {f.name}")
        nav.close()

    if erreurs:
        print("\nerreurs de page :")
        for e in erreurs[:8]:
            print("  " + e)

    n = len(fichiers)
    par_rang = 3 if n <= 9 else 4
    rangs = [fichiers[i:i + par_rang] for i in range(0, n, par_rang)]
    rangs = [r for r in rangs if len(r) == par_rang]
    if rangs:
        entrees = []
        for r in rangs:
            for f in r:
                entrees += ["-i", str(f)]
        k, filtre = 0, ";".join(
            f"[{i}:v]scale=620:-1[v{i}]" for i in range(len(rangs) * par_rang))
        for r_i, r in enumerate(rangs):
            filtre += ";" + "".join(f"[v{k + j}]" for j in range(len(r)))
            filtre += f"hstack=inputs={len(r)}[r{r_i}]"
            k += len(r)
        filtre += ";" + "".join(f"[r{i}]" for i in range(len(rangs)))
        filtre += (f"vstack=inputs={len(rangs)}[o]" if len(rangs) > 1 else "null[o]")
        subprocess.run(["ffmpeg", "-v", "error", "-y", *entrees, "-filter_complex", filtre,
                        "-map", "[o]", str(PLANCHE)], check=True)
        print(f"\n{PLANCHE}")
    return 1 if erreurs else 0


if __name__ == "__main__":
    raise SystemExit(main())
