"""Une planche de candidats par espece, pour choisir les portraits a la main.

Le choix automatique - la photo libre la mieux votee sur iNaturalist - ne tient pas : mesure du
2026-09-30 sur les quinze vignettes visibles du mur, il donnait un canard domestique huppe pour
le colvert, un troupeau de plusieurs milliers d'oiseaux pour la nette rousse, une oie cendree
bec ouvert face camera et un martinet pose sur une couverture de centre de soins. Les votes
recompensent la photo remarquable, pas le portrait qui sert a reconnaitre l'espece.

Ce script reunit, pour chaque espece, des candidats des DEUX sources - Wikimedia Commons
d'abord, qui range par espece et montre surtout des oiseaux sauvages, puis iNaturalist pour
completer - et fabrique une planche par groupe de trois especes. On choisit en regardant.

    .onetake/venv/Scripts/python.exe outils/onetake/portraits-planches.py
"""

import json
import pathlib
import subprocess
import sys
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from portraits import CANDIDATS, LIBRES, candidates, commons  # noqa: E402

VISIBLES = pathlib.Path(".onetake/vignettes-visibles.json")
MESURE = pathlib.Path(".onetake/vignettes-libres.json")
INDEX = pathlib.Path(".onetake/planches-index.json")
PLANCHES = pathlib.Path(".onetake/planches")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36")
PAR_ESPECE = 6
PAR_PLANCHE = 3


def telecharge(url, vers):
    if vers.exists() and vers.stat().st_size > 2000:
        return True
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=40) as r:
            octets = r.read()
    except Exception:
        return False
    if len(octets) < 2000:
        return False
    vers.write_bytes(octets)
    return True


def pour(sci):
    """Jusqu'a six candidats : Commons d'abord, iNaturalist pour completer."""
    liste = [c for c in commons(sci, 30) if c["licence"] in LIBRES]
    liste += [c for c in candidates(sci, 12) if c["licence"] in LIBRES]
    dossier = CANDIDATS / (sci.replace(" ", "-") + "-planche")
    dossier.mkdir(parents=True, exist_ok=True)
    gardes = []
    for c in liste:
        if len(gardes) >= PAR_ESPECE:
            break
        f = dossier / f"{len(gardes):02d}.jpg"
        if telecharge(c["url"], f):
            c["fichier"] = str(f)
            gardes.append(c)
    (dossier / "candidats.json").write_text(
        json.dumps(gardes, ensure_ascii=False, indent=1), encoding="utf-8")
    return gardes


def main():
    visibles = json.loads(VISIBLES.read_text(encoding="utf-8"))["a_remplacer_dans_le_cadre"]
    noms = {x["sci"]: (x["nom"] or x["sci"])
            for x in json.loads(MESURE.read_text(encoding="utf-8"))["a_remplacer"]}
    PLANCHES.mkdir(parents=True, exist_ok=True)

    index = {}
    for sci in visibles:
        index[sci] = pour(sci)
        print(f"  {noms.get(sci, sci):<26} {len(index[sci])} candidat(s)")
    INDEX.write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")

    groupes = [visibles[i:i + PAR_PLANCHE] for i in range(0, len(visibles), PAR_PLANCHE)]
    for g, groupe in enumerate(groupes):
        rangs = [index[s] for s in groupe if len(index[s]) == PAR_ESPECE]
        if not rangs:
            continue
        entrees, filtre, k = [], "", 0
        for rang in rangs:
            for c in rang:
                entrees += ["-i", c["fichier"]]
        n = sum(len(r) for r in rangs)
        filtre = ";".join(
            f"[{i}:v]scale=400:400:force_original_aspect_ratio=increase,crop=400:400,"
            f"pad=416:416:8:8:color=white[v{i}]" for i in range(n))
        for r, rang in enumerate(rangs):
            filtre += ";" + "".join(f"[v{k+j}]" for j in range(len(rang)))
            filtre += f"hstack=inputs={len(rang)}[r{r}]"
            k += len(rang)
        filtre += ";" + "".join(f"[r{r}]" for r in range(len(rangs)))
        filtre += (f"vstack=inputs={len(rangs)}[o]" if len(rangs) > 1 else "null[o]")
        sortie = PLANCHES / f"planche-{g+1}.png"
        subprocess.run(["ffmpeg", "-v", "error", "-y", *entrees, "-filter_complex", filtre,
                        "-map", "[o]", str(sortie)], check=True)
        print(f"{sortie}  : " + " | ".join(noms.get(s, s) for s in groupe))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
