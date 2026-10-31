"""Film v2 : la demo avec une liste d'Alex a 199 especes, le temps des prises seulement.

Le film montre le passage de 199 a 200 (Martin-pecheur, puis trophee au seuil 200 d'app.js). On
retire 13 especes en interceptant demo/donnees.js dans le navigateur des prises : la carte, le
Birdydex et le classement restent coherents entre eux, et aucun fichier du site n'est touche.
"""
import json
from datetime import date

NOUVELLE = "alcedo atthis"
# Les oiseaux que le film montre, a ne jamais retirer
GARDEES = {"merops apiaster", "phoenicopterus roseus", "cygnus olor", "upupa epops", "erithacus rubecula"}
RETIRER = 13


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
        return corps[:d] + json.dumps(reste, ensure_ascii=False, separators=(",", ":")) + corps[f + 1:]
    if len(reste) != 199:
        raise ValueError(f"{len(reste)} especes au lieu de 199")
    return corps[:d] + json.dumps(reste, ensure_ascii=False, separators=(",", ":")) + corps[f + 1:]


def installe(ctx, apres=False):
    def route(r):
        reponse = r.fetch()
        r.fulfill(response=reponse, body=reduit(reponse.text(), apres))
    ctx.route("**/demo/donnees.js*", route)
