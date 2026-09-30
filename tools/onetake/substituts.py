"""Poser les photos libres a la place des photos interdites, dans une page ouverte.

Partage par toutes les prises de vue du film : le mur du Birdydex, la fiche d'espece, et ce
qui viendra. Les images arrivent en data: URL, donc aucune requete ne part, et un observateur
les repose apres chaque re-rendu du panneau - sans lui, l'appli rendrait aux 70 especes leur
photo d'origine sans qu'on le voie.
"""

import base64
import json
import pathlib
import urllib.request

MESURE = pathlib.Path(".onetake/vignettes-libres.json")
CHOISIS = pathlib.Path(".onetake/portraits-choisis.json")
PHOTOS = pathlib.Path(".onetake/remplacantes")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36")


def _telecharge(url, vers):
    if vers.exists() and vers.stat().st_size > 2000:
        return True
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=40) as r:
            octets = r.read()
    except Exception as e:
        print(f"    echec : {e}")
        return False
    if len(octets) < 2000:
        return False
    vers.write_bytes(octets)
    return True


def charge():
    """espece -> data: URL de sa photo de remplacement. Rend aussi ce qui a manque."""
    mesure = json.loads(MESURE.read_text(encoding="utf-8"))
    a_remplacer = [x for x in mesure["a_remplacer"] if x.get("remplacante")]
    choisis = json.loads(CHOISIS.read_text(encoding="utf-8")) if CHOISIS.exists() else {}
    for x in a_remplacer:
        if x["sci"] in choisis:
            x["remplacante"] = choisis[x["sci"]]

    PHOTOS.mkdir(parents=True, exist_ok=True)
    substituts, manquantes = {}, []
    for x in a_remplacer:
        chemin = PHOTOS / (x["sci"].replace(" ", "-").replace("/", "-") + ".jpg")
        source = x["remplacante"].get("fichier") or x["remplacante"]["url"]
        if source.startswith("http"):
            _telecharge(source, chemin)
        else:
            chemin.write_bytes(pathlib.Path(source).read_bytes())
        if chemin.exists() and chemin.stat().st_size > 2000:
            substituts[x["sci"]] = ("data:image/jpeg;base64,"
                                    + base64.b64encode(chemin.read_bytes()).decode("ascii"))
        else:
            manquantes.append(x["nom"] or x["sci"])
    return substituts, manquantes, len(choisis)


def installe(page, substituts):
    """Pose les substituts dans la page ouverte, et les repose apres chaque re-rendu.

    Deux endroits portent une photo d'espece : la vignette du mur (.pkdx-img img, reperee par
    data-sci sur la carte) et l'en-tete de la fiche d'espece, qui n'a pas de data-sci - on la
    reconnait a son adresse, qui est celle que la mesure a relevee.
    """
    return page.evaluate(
        """(subs) => {
            const parSci = subs.parSci, parUrl = subs.parUrl;
            const applique = () => {
                let n = 0;
                for (const c of document.querySelectorAll('.pkdx-card')) {
                    const d = parSci[c.dataset.sci];
                    if (!d) continue;
                    const img = c.querySelector('.pkdx-img img');
                    if (img && img.src !== d) { img.src = d; img.srcset = ''; n++; }
                }
                for (const img of document.querySelectorAll('img')) {
                    const d = parUrl[img.getAttribute('src') || ''];
                    if (d && img.src !== d) { img.src = d; img.srcset = ''; n++; }
                }
                return n;
            };
            const n = applique();
            const obs = new MutationObserver(() => applique());
            obs.observe(document.body, {childList: true, subtree: true, attributes: true,
                                        attributeFilter: ['src']});
            window.__obsSubstitution = obs;
            return n;
        }""",
        substituts,
    )
