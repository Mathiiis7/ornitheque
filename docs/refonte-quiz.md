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

## Le parcours (décidé le 2026-10-15)

La page Quiz est refaite autour d'un parcours de 7 étapes, façon Syrinx. Le défi du jour, le
défi hebdo et le classement sont retirés de la page pour l'instant ; leur code est gardé.

| Étape | Question | Espèces | Questions |
|---|---|---|---|
| 1 | un chant, 2 noms | Charbonnière, Pouillot véloce | 10 |
| 2 | un chant, 3 noms | + Mésange bleue | 10 |
| 3 | un chant, 4 noms | + Mésange nonnette | 10 |
| 4 | un chant, 5 noms | + Mésange noire (sosie de la charbonnière, en dernier) | 10 |
| 5 | un oiseau, 3 chants | les 5 | 10 |
| 6 | mélange des deux | les 5 | 10 |
| 7 | un chant, 5 noms | les 5 | 15 |

Il faut 8 sur 10 (12 sur 15 à la dernière) pour ouvrir l'étape suivante ; une étape se rejoue
à volonté. Maquettes : `notes-privees/maquettes/parcours-quiz/index.html` (A chemin, B cases,
C étape en grand).

## À garder en tête

- Varier les enregistreurs parmi les sons retenus pour une espèce : aujourd'hui `scoreRec`
  peut garder 8 sons de la même personne, et l'oreille apprend alors le micro, pas le chant.
