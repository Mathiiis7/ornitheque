"""Film v2 : aucune photo interdite a l'image. Le site montre des BY-SA, des ND et des licences
inconnues : pendant les prises, chacune est remplacee par une photo libre de la MEME espece, au niveau
du reseau. Un re-rendu de la page ne peut donc pas les faire revenir, et le site n'est pas touche.

    .onetake/venv/Scripts/python.exe outils/onetake/photos_libres.py   (le bilan et la planche de controle)

Une photo qu'on ne sait pas juger reste bloquee : elle apparait vide a l'image et dans le bilan.
"""
import json, pathlib, re, time, urllib.request

CACHE = pathlib.Path("notes-privees/choix-photos/cache-inat")
OUT = pathlib.Path(".onetake/v2/libres")
CARTES = pathlib.Path(".onetake/v2/site/cartes-birdydex.json")
# Licences compatibles avec le chant du film (CC BY-NC-SA) : ni BY-SA, ni ND. Voir VIDEO-PRESENTATION.md.
LIBRES = {"cc0", "pd", "cc-by", "cc-by-nc", "cc-by-nc-sa"}
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
PHOTO_INAT = re.compile(r"/photos/(\d+)/")
# Le choix par votes prefere les curiosites : aquarelle, oiseau tenu en main, petite voiture, vitre (planche du 2026-10-31)
PREMIERE_ECARTEE = {"limosa lapponica", "sterna hirundo", "ardeola ralloides", "regulus regulus",
                    "coccothraustes coccothraustes", "corvus cornix", "falco peregrinus", "columba palumbus"}
# Celles que le classement montre, choisies a l'oeil : le choix par votes donnait une silhouette minuscule et un plumage trop serre
CHOISIES = {"anser serrirostris": "604440187", "falco peregrinus": "236986913", "ardeola ralloides": "607168642"}


def lit_cache():
    """Depuis les reponses iNaturalist gardees : la licence de chaque photo, et les photos libres de chaque espece."""
    licences, par_espece = {}, {}

    def note(p, nom, votes=0):
        if not p or p.get("id") is None:
            return
        i = str(p["id"])
        code = p.get("license_code")
        licences.setdefault(i, code)
        if nom and code in LIBRES and p.get("url"):
            liste = par_espece.setdefault(nom.lower(), [])
            if not any(x["id"] == i for x in liste):
                liste.append({"id": i, "licence": code, "auteur": p.get("attribution"), "url": p["url"], "votes": votes})

    for f in CACHE.glob("*.json"):
        try:
            j = json.loads(f.read_text(encoding="utf-8"))
        except ValueError:
            continue
        for r in j.get("results") or []:
            nom = (r.get("taxon") or {}).get("name") or r.get("name")
            note(r.get("default_photo"), nom)
            for tp in r.get("taxon_photos") or []:
                note(tp.get("photo"), nom)
            for p in r.get("photos") or []:
                note(p, nom, r.get("faves_count") or 0)
    for nom, liste in par_espece.items():
        liste.sort(key=lambda x: -x["votes"])
        if nom in PREMIERE_ECARTEE and len(liste) > 1:
            del liste[0]
        liste.sort(key=lambda x: x["id"] != CHOISIES.get(nom))   # stable : la choisie passe devant, le reste ne bouge pas
    return licences, par_espece


def especes_des_photos():
    """adresse ou id de photo -> espece, d'apres les tables du site : le classement montre aussi les oiseaux des autres membres."""
    paires = re.findall(r"'([a-z -]+)':\s*\{\s*url:'([^']+)',\s*thumb:'([^']+)'", pathlib.Path("app.js").read_text(encoding="utf-8"))
    figees = json.loads(pathlib.Path("data/frozen-photos.json").read_text(encoding="utf-8"))
    paires += [(sci, p.get("url") or "", p.get("thumb") or "") for sci, p in figees.items()]
    especes = {}
    for sci, *adresses in paires:
        for a in adresses:
            m = PHOTO_INAT.search(a)
            especes[m.group(1) if m else a] = sci
    return especes


def table():
    """url ou id de photo interdite -> remplacante, pour toutes les cartes du Birdydex."""
    licences, par_espece = lit_cache()
    cartes = json.loads(CARTES.read_text(encoding="utf-8"))
    rempl, sans = {}, []
    for c in cartes:
        if c["licence"] in LIBRES or not c["src"]:
            continue
        choix = par_espece.get(c["sci"])
        if not choix:
            sans.append((c["sci"], c["licence"]))
            continue
        rempl[c["src"]] = {**choix[0], "sci": c["sci"], "nom": c["nom"], "avant": c["licence"]}
    return licences, rempl, sans


def fichier(r):
    """La remplacante, telechargee une fois : deux prises doivent se ressembler."""
    OUT.mkdir(parents=True, exist_ok=True)
    chemin = OUT / (r["id"] + ".jpg")
    if not chemin.exists():
        url = r["url"].replace("/square.", "/medium.")
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        for essai in range(4):
            try:
                with urllib.request.urlopen(req, timeout=40) as rep:
                    chemin.write_bytes(rep.read())
                break
            except OSError:
                # le serveur coupe parfois une connexion sur une serie de telechargements
                if essai == 3:
                    raise
                time.sleep(3 * (essai + 1))
    return chemin


def installe(ctx, journal=None):
    """A appeler avant d'ouvrir une page. journal : la liste ou noter ce qui a ete remplace ou bloque."""
    licences, rempl, _ = table()
    par_id = {PHOTO_INAT.search(u).group(1): r for u, r in rempl.items() if PHOTO_INAT.search(u)}
    _, par_espece = lit_cache()
    especes = especes_des_photos()

    def sert(route, r, adresse):
        if journal is not None:
            journal.append(("remplacee", r["sci"], adresse))
        route.fulfill(path=str(fichier(r)), content_type="image/jpeg", headers={"Access-Control-Allow-Origin": "*"})

    def route(rt):
        adresse = rt.request.url
        if adresse in rempl:
            return sert(rt, rempl[adresse], adresse)
        m = PHOTO_INAT.search(adresse)
        if m and m.group(1) in par_id:
            return sert(rt, par_id[m.group(1)], adresse)
        if m and licences.get(m.group(1)) in LIBRES:
            return rt.continue_()
        # une photo d'un autre membre : l'espece vient des tables du site
        sci = especes.get(m.group(1) if m else adresse)
        if sci and par_espece.get(sci):
            return sert(rt, {**par_espece[sci][0], "sci": sci}, adresse)
        # ni libre ni remplacable : rien ne part a l'image
        if journal is not None:
            journal.append(("bloquee", None, adresse))
        rt.abort()

    ctx.route(re.compile(r"inaturalist|wikimedia|wikipedia"), lambda r: route(r) if r.request.resource_type == "image" else r.continue_())


if __name__ == "__main__":
    from PIL import Image, ImageDraw
    licences, rempl, sans = table()
    print(len(rempl), "photos a remplacer ;", len(sans), "sans remplacante :", sans)
    ims = []
    for r in rempl.values():
        im = Image.open(fichier(r)).convert("RGB")
        im.thumbnail((200, 200))
        ims.append((r, im))
    lignes = (len(ims) + 7) // 8
    pl = Image.new("RGB", (8 * 210, lignes * 235), "white")
    d = ImageDraw.Draw(pl)
    for k, (r, im) in enumerate(ims):
        x, y = (k % 8) * 210 + 5, (k // 8) * 235 + 5
        pl.paste(im, (x, y))
        d.text((x, y + 205), r["sci"][:30], fill="black")
    pl.save(OUT / "planche.png")
    (OUT / "remplacantes.json").write_text(json.dumps(list(rempl.values()), ensure_ascii=False, indent=1), encoding="utf-8")
    print("planche :", OUT / "planche.png")
