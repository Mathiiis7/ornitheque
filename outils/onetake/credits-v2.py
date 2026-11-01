"""Film v2 : qui a fait quoi. Lit les licences et les auteurs dans les reponses iNaturalist gardees, ecrit la
liste complete des photos du Birdydex dans docs/VIDEO-CREDITS-V2.md et les noms de l'ecran de fin dans
.onetake/v2/credits.json. Lancer apres v2-site.py et v2-recent.py.

    .onetake/venv/Scripts/python.exe outils/onetake/credits-v2.py
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import photos_libres as P

# Les photos que le film montre en grand : leurs auteurs sont nommes a l'ecran
EN_GRAND = {"merops apiaster": "179625228", "phoenicopterus roseus": "187242272", "cygnus olor": "482124381",
            "upupa epops": "60494705", "erithacus rubecula": "104940884", "alcedo atthis": "61266631", "prunella collaris": "59007262"}
CHANTS = [("Benjamin Drillat", "XC982627")]


def nom(attribution):
    m = re.search(r"\(c\)\s*(.+?),\s*(some|no) rights", attribution or "")
    return m.group(1).strip() if m else (attribution or "").strip()


licences, par_espece = P.lit_cache()
_, rempl, _ = P.table()
cartes = json.loads(P.CARTES.read_text(encoding="utf-8"))
lignes, sans = [], []
parId = {x["id"]: (sci, x) for sci, l in par_espece.items() for x in l}
for c in cartes:
    r = rempl.get(c["src"])
    if not r:
        m = P.PHOTO_INAT.search(c["src"] or "")
        r = next((x for x in par_espece.get(c["sci"], []) if m and x["id"] == m.group(1)), None)
    if r:
        lignes.append((c["nom"], nom(r["auteur"]), r["licence"], "https://www.inaturalist.org/photos/" + r["id"]))
    else:
        sans.append(c["nom"])
# Toutes les autres photos notees aux prises : classement, quiz, mur du pays lointain
vues = set(P.VUES.read_text(encoding="utf-8").split()) if P.VUES.exists() else set()
vues |= set(EN_GRAND.values())
deja = {l[3].rsplit("/", 1)[1] for l in lignes}
nomsF = {c["sci"]: c["nom"] for c in cartes}
for i in sorted(vues - deja):
    if i in parId:
        sci, x = parId[i]
        lignes.append((nomsF.get(sci, sci), nom(x["auteur"]), x["licence"], "https://www.inaturalist.org/photos/" + i))
    else:
        sans.append("photo " + i)
lignes.sort(key=lambda l: l[0].lower())
photos = []
for sci, i in EN_GRAND.items():
    a = next((x for x in par_espece.get(sci, []) if x["id"] == i), None)
    if not a:
        raise SystemExit(f"auteur introuvable : {sci} {i}")
    photos.append(nom(a["auteur"]))
quiz = json.loads(pathlib.Path(".onetake/v2/recent/recent.json").read_text(encoding="utf-8"))["quiz"]["chant"]
m = re.match(r"Chant n° XC (\d+) · (.+)", quiz)
chants = [c[0] for c in CHANTS] + [m.group(2).strip()]
pathlib.Path(".onetake/v2/credits.json").write_text(json.dumps({"photos": sorted(set(photos), key=str.lower), "chants": chants}, ensure_ascii=False, indent=1), encoding="utf-8")
texte = ["# Crédits du film de présentation", "",
         "Généré par `outils/onetake/credits-v2.py`. Ce film est diffusé sous licence CC BY-NC-SA 4.0 (https://creativecommons.org/licenses/by-nc-sa/4.0/). Les photos sont recadrées et animées.", "",
         f"Chants, xeno-canto, CC BY-NC-SA 4.0 : Benjamin Drillat (XC982627), {m.group(2).strip()} (XC{m.group(1)}).",
         "Fond de carte : © OpenStreetMap, https://www.openstreetmap.org/copyright. Observations et fréquences : eBird.org.", "",
         "| Espèce | Auteur | Licence | Photo |", "|---|---|---|---|"]
texte += [f"| {a} | {b} | {c} | {d} |" for a, b, c, d in lignes]
if sans:
    texte += ["", "Sans auteur retrouvé : " + ", ".join(sans) + "."]
pathlib.Path("docs/VIDEO-CREDITS-V2.md").write_text("\n".join(texte) + "\n", encoding="utf-8")
print(len(lignes), "photos ;", len(sans), "sans auteur :", sans)
print("a l'ecran :", photos, chants)
