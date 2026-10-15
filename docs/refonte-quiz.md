# Refonte du quiz de chants

Tickets liés : qg#64 (repartir de zéro), qg#55 (petits groupes au chant proche), qg#59
(commencer par les passereaux de France). Inspiration : `docs/inspiration-syrinx.md`.

## Premier groupe : les mésanges (choisi le 2026-10-15)

Cinq espèces présentes partout en France toute l'année, aux chants courts et répétés,
faciles à confondre entre elles. Noms vérifiés dans `FR_NAMES` d'`app.js`.

| Nom                  | Nom scientifique         |
|----------------------|--------------------------|
| Mésange charbonnière | Parus major              |
| Mésange bleue        | Cyanistes caeruleus      |
| Mésange noire        | Periparus ater           |
| Mésange nonnette     | Poecile palustris        |
| Pouillot véloce      | Phylloscopus collybita   |

Groupes écartés pour commencer, gardés pour la suite :
- merle et grives : Merle noir, Grive musicienne, Grive draine, Rougegorge familier ;
- fauvettes : Fauvette à tête noire, Fauvette des jardins, Fauvette grisette, Hypolaïs
  polyglotte (absentes l'hiver, plus difficiles).

## À garder en tête

- Varier les enregistreurs parmi les sons retenus pour une espèce : aujourd'hui `scoreRec`
  peut garder 8 sons de la même personne, et l'oreille apprend alors le micro, pas le chant.
