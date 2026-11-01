"""Film v2 : la demo avec une liste d'Alex a 199 especes, le temps des prises seulement.

Le film montre le passage de 199 a 200 (Martin-pecheur, puis trophee au seuil 200 d'app.js). On
retire 13 especes en interceptant demo/donnees.js dans le navigateur des prises : la carte, le
Birdydex et le classement restent coherents entre eux, et aucun fichier du site n'est touche.
"""
import json, pathlib
from datetime import date

NOUVELLE = "alcedo atthis"
# Les oiseaux que le film montre, a ne jamais retirer
GARDEES = {"merops apiaster", "phoenicopterus roseus", "cygnus olor", "upupa epops", "erithacus rubecula"}
RETIRER = 13
# Pour le film : a 200 Alex passe en tete. Les plus grandes listes sont ramenees sous 200 (Mathis, 2026-10-31).
# On retire la fin de l'alphabet : Qui a vu quoi ne montre que le debut, il reste le meme.
PLAFONDS = {"Samir": 199, "Claire": 187, "Hugo": 172}
# Qui a vu quoi : premier du classement, Alex doit avoir vu presque tout ce que montre le debut de la grille. Il ne
# lui manque que l'Accenteur alpin, celui de la fiche, et l'Aigrette des recifs. Une majorite de France, et d'autres
# pays pour montrer que le site ne s'arrete pas la (Mathis, 2026-11-01). Chaque couple est controle : l'oiseau doit
# depasser SEUIL_PRESENCE des listes du pays dans les frequences du site, sinon le script s'arrete.
AJOUTS_ALEX = ["Aigle botté", "Aigle criard", "Aigle de Bonelli", "Aigle impérial", "Alouette calandre", "Alouette calandrelle"]
SEUIL_PRESENCE = 0.003
PAYS = {
    "Alex": {"Accenteur mouchet": "FR", "Aigle botté": "ES", "Aigle criard": "GR", "Aigle de Bonelli": "FR", "Aigle impérial": "HU", "Aigle royal": "FR",
             "Aigrette garzette": "FR", "Alouette calandre": "ES", "Alouette calandrelle": "FR", "Alouette des champs": "FR"},
    "Samir": {"Accenteur alpin": "CH", "Accenteur mouchet": "FR", "Aigle de Bonelli": "ES", "Aigle impérial": "HU", "Aigle royal": "FR", "Aigrette des récifs": "LK",
              "Aigrette garzette": "FR", "Alouette calandre": "GR", "Alouette calandrelle": "FR", "Alouette des champs": "FR"},
    "Claire": {"Accenteur alpin": "FR", "Accenteur mouchet": "FR", "Aigle botté": "FR", "Aigle criard": "BG", "Aigle de Bonelli": "PT", "Aigle royal": "IT",
               "Aigrette garzette": "NA", "Alouette calandre": "ES", "Alouette calandrelle": "FR", "Alouette des champs": "FR"},
    "Hugo": {"Accenteur alpin": "AT", "Accenteur mouchet": "FR", "Aigle botté": "FR", "Aigle de Bonelli": "FR", "Aigle royal": "CH", "Aigrette garzette": "FR", "Alouette des champs": "FR"},
    "Lina": {"Accenteur mouchet": "FR", "Aigrette garzette": "IT", "Alouette des champs": "FR"},
}


def controle_presence(sci, pays):
    """Le pic de frequence de l'oiseau dans ce pays, d'apres les donnees du site."""
    table = json.loads(pathlib.Path(f"data/countries/{pays.lower()}/freq_48.json").read_text(encoding="utf-8"))
    pic = max(table.get(sci) or [0])
    if pic < SEUIL_PRESENCE:
        raise ValueError(f"{sci} trop rare en {pays} : {pic:.2%}")
    return pic


def _fin_liste(texte, debut):
    """L'indice du crochet qui ferme le tableau ouvert a debut."""
    prof, chaine, echap = 0, False, False
    for i in range(debut, len(texte)):
        c = texte[i]
        if chaine:
            if echap:
                echap = False
            elif c == "\\":
                echap = True
            elif c == '"':
                chaine = False
        elif c == '"':
            chaine = True
        elif c == "[":
            prof += 1
        elif c == "]":
            prof -= 1
            if prof == 0:
                return i
    raise ValueError("liste non fermee")


def reduit(corps, apres=False):
    """apres=True : la liste une fois le Martin-pecheur ajoute (200), avec lui en derniere acquisition."""
    cle = '"name":"Alex","species":'
    d = corps.index(cle) + len(cle)
    f = _fin_liste(corps, d)
    especes = json.loads(corps[d:f + 1])
    # les plus anciennes d'abord : le classement du site montre la derniere acquisition, on n'y touche pas
    retenues = [NOUVELLE] + [e["k"] for e in sorted(especes, key=lambda e: e.get("a", 0)) if e["k"] not in GARDEES and e["k"] != NOUVELLE][:RETIRER - 1]
    reste = [e for e in especes if e["k"] not in retenues]
    if apres:
        martin = next(e for e in especes if e["k"] == NOUVELLE)
        martin["a"] = max(e.get("a", 0) for e in especes) + 1
        # le classement juge la derniere acquisition sur la date d'observation, pas sur la date d'ajout
        martin["d"] = date.today().isoformat()
        reste.append(martin)
        # les oiseaux de la grille, copies de la liste d'un ami ; autant de fins d'alphabet retirees : Alex reste a 200
        fiches = {}
        for nom in ("Samir", "Claire", "Hugo"):
            cle = f'"name":"{nom}","species":'
            a = corps.index(cle) + len(cle)
            for e in json.loads(corps[a:_fin_liste(corps, a) + 1]):
                fiches.setdefault(e.get("c"), e)
        ajouts = [dict(fiches[n]) for n in AJOUTS_ALEX if not any(e.get("c") == n for e in reste)]
        gardes = GARDEES | {NOUVELLE}
        retirables = sorted((e for e in reste if e["k"] not in gardes), key=lambda e: e.get("c", ""), reverse=True)[:len(ajouts)]
        sortants = {e["k"] for e in retirables}
        reste = [e for e in reste if e["k"] not in sortants] + ajouts
        corps = corps[:d] + json.dumps(reste, ensure_ascii=False, separators=(",", ":")) + corps[f + 1:]
        for nom, plafond in PLAFONDS.items():
            cle = f'"name":"{nom}","species":'
            d = corps.index(cle) + len(cle)
            f = _fin_liste(corps, d)
            liste = sorted(json.loads(corps[d:f + 1]), key=lambda e: e.get("c", ""))[:plafond]
            corps = corps[:d] + json.dumps(liste, ensure_ascii=False, separators=(",", ":")) + corps[f + 1:]
        for nom, pays in PAYS.items():
            cle = f'"name":"{nom}","species":'
            d = corps.index(cle) + len(cle)
            f = _fin_liste(corps, d)
            liste = json.loads(corps[d:f + 1])
            for e in liste:
                if e.get("c") in pays:
                    controle_presence(e["k"], pays[e["c"]])
                    e["co"] = pays[e["c"]]
            corps = corps[:d] + json.dumps(liste, ensure_ascii=False, separators=(",", ":")) + corps[f + 1:]
        return corps
    if len(reste) != 199:
        raise ValueError(f"{len(reste)} especes au lieu de 199")
    return corps[:d] + json.dumps(reste, ensure_ascii=False, separators=(",", ":")) + corps[f + 1:]


def installe(ctx, apres=False):
    def route(r):
        reponse = r.fetch()
        r.fulfill(response=reponse, body=reduit(reponse.text(), apres))
    ctx.route("**/demo/donnees.js*", route)
